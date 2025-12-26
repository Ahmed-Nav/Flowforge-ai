// backend/src/queue_test.ts
import "dotenv/config";
import { Queue, Worker } from "bullmq";
import IORedis from "ioredis";
import { PrismaClient } from "@prisma/client";
import { WorkflowEngine } from "./engine";
import { Pool } from "pg";
import { PrismaPg } from "@prisma/adapter-pg";

console.log("-----------------------------------------");
console.log("🔍 WORKER STARTING...");
console.log(
  "🔍 REDIS_URL:",
  process.env.REDIS_URL ? "✅ FOUND (Hidden)" : "❌ MISSING (Using localhost)"
);
console.log(
  "🔍 DATABASE_URL:",
  process.env.DATABASE_URL ? "✅ FOUND (Hidden)" : "❌ MISSING"
);
console.log("-----------------------------------------");

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const connection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

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

import express from "express";
const app = express();
const PORT = process.env.PORT || 3000;

app.get("/health", (req, res) => res.send("Worker is alive!"));

app.listen(PORT, () => {
  console.log(`❤️ Health check server running on port ${PORT}`);
});