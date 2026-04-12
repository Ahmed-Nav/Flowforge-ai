// backend/src/nodes/discord.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { resolveTemplate } from "./utils";
import fetch from "cross-fetch";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const webhookUrl = node.data.url;
  const msgTemplate = node.data.message || "Alert: {{previous_step}}";

  const finalMessage = resolveTemplate(
    msgTemplate,
    node.id,
    context,
    definition,
  );

  console.log(
    `   📢 Sending to Discord: "${finalMessage.substring(0, 30)}..."`,
  );

  if (!webhookUrl) return { error: "No Webhook URL provided" };

  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content: finalMessage }),
    });

    if (!res.ok) throw new Error(`Discord API ${res.status}`);
    return { result: "Message Sent Successfully" };
  } catch (err: any) {
    console.error("   ❌ Discord Failed:", err.message);
    return { error: `Discord Failed: ${err.message}` };
  }
};
