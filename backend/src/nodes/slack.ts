// backend/src/nodes/slack.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { resolveTemplate } from "./utils";
import fetch from "cross-fetch";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const slackUrl = node.data.url;
  const slackTemplate = node.data.message || "Update: {{previous_step}}";

  const finalSlackMessage = resolveTemplate(
    slackTemplate,
    node.id,
    context,
    definition,
  );

  console.log(
    `   📢 Sending to Slack: "${finalSlackMessage.substring(0, 30)}..."`,
  );

  if (!slackUrl) return { error: "No Slack Webhook URL provided" };

  try {
    const res = await fetch(slackUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: finalSlackMessage }),
    });

    const responseText = await res.text();
    if (responseText !== "ok")
      throw new Error(`Slack Error: ${responseText}`);

    return { result: "Slack Message Sent" };
  } catch (err: any) {
    console.error("   ❌ Slack Failed:", err.message);
    return { error: `Slack Failed: ${err.message}` };
  }
};
