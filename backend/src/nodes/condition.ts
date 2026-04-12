// backend/src/nodes/condition.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import { getParentOutputValue } from "./utils";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  context: Record<string, any>,
  definition: WorkflowDefinition,
  _initialData: any,
) => {
  const targetValue = node.data.value || "";
  const conditionType = node.data.condition || "contains";

  const inputValue = getParentOutputValue(node.id, context, definition);

  console.log(
    `   ⚖️ Checking: "${inputValue.substring(
      0,
      20,
    )}..." ${conditionType} "${targetValue}"`,
  );

  let isTrue = false;
  if (conditionType === "contains") {
    isTrue = inputValue.toLowerCase().includes(targetValue.toLowerCase());
  } else if (conditionType === "equals") {
    isTrue =
      inputValue.trim().toLowerCase() ===
      targetValue.trim().toLowerCase();
  }

  return { result: isTrue ? "TRUE" : "FALSE" };
};
