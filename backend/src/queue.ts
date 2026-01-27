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
