// backend/src/nodes/document.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  _context: Record<string, any>,
  _definition: WorkflowDefinition,
  _initialData: any,
) => {
  const docText = node.data.result || "";
  console.log(`   📄 DOCUMENT PASSTHROUGH: ${docText.length} chars`);

  if (!docText)
    return { error: "No document text found. Did you upload a PDF?" };

  return { result: docText };
};
