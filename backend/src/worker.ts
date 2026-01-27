import { Worker } from "bullmq";
import { workerConnection } from "./redis";
import { WorkflowEngine } from "./engine";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import { Pool } from "pg";

const pool = new Pool({ connectionString: process.env.DATABASE_URL });
const adapter = new PrismaPg(pool);
const prisma = new PrismaClient({ adapter });

const engine = new WorkflowEngine();

console.log("👷 Worker is listening for jobs...");

export const worker = new Worker(
  "workflow-queue",
  async (job) => {
    console.log(`[Worker] Processing Job: ${job.id}`);
    const { runId, definition } = job.data;

    try {
      await engine.runWorkflow(definition, runId);
      return { status: "COMPLETED", runId };
    } catch (error: any) {
      console.error(`[Worker] Job Failed: ${error.message}`);
      throw error;
    }
  },
  {
    connection: workerConnection,
    concurrency: 5,
  },
);
