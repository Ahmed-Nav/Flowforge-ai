// backend/src/nodes/notion.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { resolveTemplate } from "./utils";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const { Client } = require("@notionhq/client");
  const notion = new Client({ auth: process.env.NOTION_API_KEY });

  const dbId = node.data.databaseId;
  const noteContent = node.data.content || "{{previous_step}}";

  const finalContents = resolveTemplate(
    noteContent,
    node.id,
    context,
    definition,
  );

  console.log(`   📝 NOTION START: Writing to DB ${dbId}...`);

  if (!process.env.NOTION_API_KEY)
    return { error: "Server missing NOTION_API_KEY" };
  if (!dbId) return { error: "No Database ID provided" };

  try {
    const maxLength = 2000;
    const textChunks = [];
    for (let i = 0; i < finalContents.length; i += maxLength) {
      textChunks.push(finalContents.substring(i, i + maxLength));
    }

    const childrenBlocks = textChunks.map((chunk) => ({
      object: "block",
      type: "paragraph",
      paragraph: {
        rich_text: [{ type: "text", text: { content: chunk } }],
      },
    }));

    const response = await notion.pages.create({
      parent: { database_id: dbId },
      properties: {
        Name: {
          title: [{ text: { content: "FlowForge Auto-Entry" } }],
        },
      },
      children: childrenBlocks,
    });

    console.log("   ✅ NOTION SUCCESS");
    return { result: `Page Created: ${response.url}` };
  } catch (err: any) {
    console.error("   ❌ NOTION FAILED:", err.message);
    return { error: `Notion Failed: ${err.message}` };
  }
};
