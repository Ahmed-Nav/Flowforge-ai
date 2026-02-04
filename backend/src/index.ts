// backend/src/index.ts
import "dotenv/config";
import express from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Queue } from "bullmq";
import IORedis from "ioredis";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { authenticateToken, AuthRequest } from "./middleware";
import "./worker";
import { scheduleWorkflow } from "./queue";
import { saveMemory } from "./memory";
import multer from "multer";

const JWT_SECRET = process.env.JWT_SECRET || "secret_JWT";

const app = express();
app.use(express.json());
app.use(
  cors({
    origin: ["http://localhost:3000", "https://flowforge-ai-drab.vercel.app"],
    methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization"],
  }),
);

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  },
);

const workflowQueue = new Queue("workflow-queue", { connection });

const upload = multer({ storage: multer.memoryStorage() });

app.post("/tools/parse-pdf", upload.single("file"), async (req: any, res) => {
  if (!req.file) {
    console.warn("PDF Parse Request: No file uploaded");
    return res.status(400).json({ error: "No file uploaded" });
  }

  console.log(
    `Received PDF parse request: ${req.file.originalname}, size: ${req.file.size} bytes`,
  );

  let parser;
  try {
    const { PDFParse } = require("pdf-parse"); // Import PDFParse class from v2

    // Initialize parser with the file buffer
    parser = new PDFParse({ data: req.file.buffer });

    // Extract text
    const textResult = await parser.getText();

    // Get info if needed (optional, depends on what frontend expects)
    // const infoResult = await parser.getInfo();

    console.log("PDF parsed successfully");
    res.json({
      text: textResult.text ? textResult.text.trim() : "",
      // info: infoResult.info, // You can add this back if needed
      // pages: infoResult.total,
    });
  } catch (error: any) {
    console.error("PDF Parse Error Details:", error);
    res.status(500).json({
      error: "Failed to parse PDF",
      details: error.message,
    });
  } finally {
    // Always destroy the parser instance to free memory
    if (parser) {
      await parser.destroy();
    }
  }
});

app.post(
  "/auth/register",
  async (req: express.Request, res: express.Response) => {
    const { email, password } = req.body;

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      return res.status(400).json({ error: "User already exists" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
      },
    });

    res.json({ message: "User created successfully", userId: user.id });
  },
);

app.post("/auth/login", async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "User not found" });

  const validPassword = await bcrypt.compare(password, user.password || "");
  if (!validPassword)
    return res.status(400).json({ error: "Invalid password" });

  const token = jwt.sign({ userId: user.id }, JWT_SECRET, { expiresIn: "1h" });

  res.json({ token, email: user.email });
});

app.post(
  "/workflows",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { id, name, definition } = req.body;

    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    let workflow;
    if (id) {
      workflow = await prisma.workflow.update({
        where: { id },
        data: { definition },
      });
    } else {
      workflow = await prisma.workflow.create({
        data: {
          name: name || "Untitled Workflow",
          userId: userId,
          triggerType: "webhook",
          status: "active",
          definition: definition,
        },
      });
    }

    if (definition && definition.nodes) {
      const scheduleNode = definition.nodes.find(
        (n: any) => n.type === "SCHEDULE",
      );

      if (scheduleNode && scheduleNode.data.cron) {
        console.log(`📅 Schedule Node Detected for ${workflow.id}`);
        await scheduleWorkflow(workflow.id, definition, scheduleNode.data.cron);
      }
    }

    res.json(workflow);
  },
);

app.post(
  "/workflows/:id/run",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params as { id: string };

    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    const run = await prisma.workflowRun.create({
      data: {
        workflowId: workflow.id,
        status: "PENDING",
        triggerInput: req.body || {},
        outputs: {},
      },
    });

    await workflowQueue.add("execute-workflow", {
      runId: run.id,
      definition: workflow.definition,
    });

    console.log(`🚀 Job Added to Queue: ${run.id}`);

    res.json({ id: run.id, status: "QUEUED" });
  },
);

app.get(
  "/workflows/:id/runs",
  async (req: express.Request, res: express.Response) => {
    const { id } = req.params as { id: string };

    const runs = await prisma.workflowRun.findMany({
      where: { workflowId: id },
      orderBy: { createdAt: "desc" },
      take: 10,
    });

    res.json(runs);
  },
);

app.patch("/workflows/:id/toggle", authenticateToken, async (req: any, res) => {
  const { id } = req.params;
  const { isActive } = req.body;

  try {
    const updated = await prisma.workflow.update({
      where: { id, userId: req.userId },
      data: { isActive },
    });
    res.json(updated);
  } catch (error) {
    res.status(500).json({ error: "Failed to update workflow status" });
  }
});

app.post(
  "/hooks/catch/:workflowId",
  async (req: express.Request, res: express.Response) => {
    const { workflowId } = req.params as { workflowId: string };
    const inputData = req.body;

    const workflow = await prisma.workflow.findUnique({
      where: { id: workflowId },
    });
    if (!workflow) {
      res.status(404).json({ error: "Workflow not found" });
      return;
    }

    if (workflow.isActive === false) {
      return res.status(400).json({ error: "Workflow is paused" });
    }

    await workflowQueue.add("run-flow", {
      workflowId,
      input: inputData,
    });

    res.json({ message: "Workflow triggered successfully!", status: "queued" });
  },
);

app.get(
  "/workflows",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const userId = req.userId;

    if (!userId) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const workflows = await prisma.workflow.findMany({
      where: { userId: userId },
      orderBy: { updatedAt: "desc" },
    });
    res.json(workflows);
  },
);

app.delete(
  "/workflows/:id",
  authenticateToken,
  async (req: AuthRequest, res: express.Response) => {
    const { id } = req.params;
    const userId = req.userId;

    try {
      const workflow = await prisma.workflow.findUnique({ where: { id } });
      if (!workflow || workflow.userId !== userId) {
        return res
          .status(403)
          .json({ error: "Not authorized to delete this workflow" });
      }

      await prisma.workflowRun.deleteMany({ where: { workflowId: id } });

      await prisma.workflow.delete({
        where: { id },
      });

      const repeatableJobs = await workflowQueue.getRepeatableJobs();
      const zombieJob = repeatableJobs.find(
        (job) => job.key.includes(id) || job.id?.includes(id),
      );

      if (zombieJob) {
        await workflowQueue.removeRepeatableByKey(zombieJob.key);
        console.log(`🧹 Cleaned up Redis schedule for workflow ${id}`);
      }

      res.json({ message: "Workflow deleted and schedule removed" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete workflow" });
    }
  },
);

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on ${PORT}`);
});
