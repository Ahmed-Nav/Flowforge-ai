// backend/src/index.ts
import "dotenv/config";
import express from "express"; 
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";
import { Queue } from "bullmq";
import IORedis from "ioredis";

const app = express();
app.use(express.json());
app.use(cors());

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const connection = new IORedis({
  host: "localhost",
  port: 6379,
  maxRetriesPerRequest: null,
});
const workflowQueue = new Queue("workflow-queue", { connection });

app.post("/workflows", async (req: express.Request, res: express.Response) => {
  const { id, name, definition } = req.body; 

  const user = await prisma.user.findFirst();
  if (!user) {
     res.status(500).json({ error: "No user found" });
     return;
  }

  let workflow;

  if (id) {
    workflow = await prisma.workflow.update({
      where: { id },
      data: {
        definition: definition,
      }
    });
  } else {
    workflow = await prisma.workflow.create({
      data: {
        name: name || "Untitled Workflow",
        userId: user.id,
        triggerType: "webhook",
        status: "active",
        definition: definition,
      }
    });
  }

  console.log(`💾 Saved/Updated Workflow: ${workflow.id}`);
  res.json(workflow);
});

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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`🚀 API Server running on ${PORT}`);
});
