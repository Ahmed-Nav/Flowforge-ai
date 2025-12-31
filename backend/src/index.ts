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

const JWT_SECRET = process.env.JWT_SECRET || "secret_JWT";

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
  }
);

const workflowQueue = new Queue("workflow-queue", { connection });

app.post("/auth/register", async (req: express.Request, res: express.Response) => {
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
});

app.post("/auth/login", async (req: express.Request, res: express.Response) => {
  const { email, password } = req.body;

  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return res.status(400).json({ error: "User not found" });

  const validPassword = await bcrypt.compare(password, user.password || "");
  if (!validPassword) return res.status(400).json({ error: "Invalid password" });

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

    res.json(workflow);
  }
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
      },
    });

    await workflowQueue.add("run-flow", {
      workflowId: id,
      runId: run.id, 
    });

    res.json({ message: "Run started", runId: run.id });
  }
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
  }
);

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

    await workflowQueue.add("run-flow", {
      workflowId,
      input: inputData,
    });

    res.json({ message: "Workflow triggered successfully!", status: "queued" });
  }
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
  }
);

app.delete("/workflows/:id", authenticateToken, async (req: AuthRequest, res: express.Response) => {
  const { id } = req.params;
  const userId = req.userId;

  try {
    const workflow = await prisma.workflow.findUnique({ where: { id } });
    if (!workflow || workflow.userId !== userId) {
      return res.status(403).json({ error: "Not authorized to delete this workflow" });
    }

    await prisma.workflow.delete({ where: { id } });
    
    res.json({ message: "Workflow deleted successfully" });
  } catch (error) {
    res.status(500).json({ error: "Failed to delete workflow" });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on ${PORT}`);
});
