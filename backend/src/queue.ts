import { Queue } from "bullmq";
import { connection } from "./redis";

export const workflowQueues = new Queue("workflow-queue", {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: "exponential",
      delay: 1000,
    },
    removeOnComplete: 100,
    removeOnFail: 500,
  },
});

export const scheduleWorkflow = async (
  workflowId: string,
  definition: any,
  cron: string,
) => {
  const jobs = await workflowQueues.getRepeatableJobs();
  const existingJob = jobs.find((j) => j.id === `schedule-${workflowId}`);

  if (existingJob) {
    await workflowQueues.removeRepeatableByKey(existingJob.key);
    console.log(`⏰ Removed old schedule for ${workflowId}`);
  }

  await workflowQueues.add(
    "execute-workflow",
    { runId: "scheduled", definition },
    {
      jobId: `schedule-${workflowId}`,
      repeat: { pattern: cron },
    },
  );

  console.log(`⏰ Scheduled workflow ${workflowId} with cron: ${cron}`);
};
