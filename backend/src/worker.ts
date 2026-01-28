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

    let { runId, definition, workflowId } = job.data;

    if (runId === "scheduled") {
      try {
        console.log(`⏰ Creating Run Record for Workflow: ${workflowId}`);
        const newRun = await prisma.workflowRun.create({
          data: {
            workflowId: workflowId,
            status: "PENDING",
            triggerInput: { type: "cron" },
            outputs: {},
          },
        });
        runId = newRun.id;
        console.log(`✅ Created Scheduled Run ID: ${runId}`);
      } catch (err) {
        console.error("❌ Failed to create scheduled run record:", err);
        return;
      }
    }

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
