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

    if (runId === "scheduled" && !workflowId) {
      console.log("🧟 Ignoring old 'Zombie' job with missing Workflow ID.");
      return { status: "SKIPPED", reason: "Missing Workflow ID" };
    }

    if (runId === "scheduled") {
      const workflow = await prisma.workflow.findUnique({
        where: { id: workflowId },
      });

      if (!workflow) {
        console.warn(
          `👻 Ghost Job detected: Workflow ${workflowId} not found. Skipping.`,
        );
        return { status: "SKIPPED", reason: "Workflow Deleted" };
      }

      if (workflow.isActive === false) {
        console.log(
          `⏸️ Paused Job detected: Workflow ${workflowId} is paused. Skipping.`,
        );
        return { status: "SKIPPED", reason: "Workflow Paused" };
      }

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
      } catch (err: any) {
        if (err.code === "P2003") {
          console.warn(
            `👻 Ghost Job detected: Workflow ${workflowId} no longer exists. Skipping.`,
          );
          return { status: "SKIPPED", reason: "Workflow Deleted" };
        }

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
