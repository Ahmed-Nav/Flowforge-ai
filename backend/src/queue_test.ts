// backend/src/queue_test.ts
import "dotenv/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { WorkflowEngine } from "./engine";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

const connection = new IORedis(
  process.env.REDIS_URL || "redis://localhost:6379",
  {
    maxRetriesPerRequest: null,
    tls: process.env.REDIS_URL?.startsWith("rediss://") ? {} : undefined,
  }
);
const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });
const myQueue = new Queue("workflow-queue", { connection });

const worker = new Worker(
  "workflow-queue",
  async (job) => {
    console.log(`[Worker] Processing Job: ${job.id}`);

    const { workflowId, runId } = job.data;

    const workflow = await prisma.workflow.findUnique({
      where: { id: job.data.workflowId },
    });

    if (!workflow) throw new Error("Workflow not found");

    const engine = new WorkflowEngine();
    await engine.runWorkflow(workflow.definition, runId);
  },
  { connection }
);

console.log("👷 Worker is listening for jobs...");
