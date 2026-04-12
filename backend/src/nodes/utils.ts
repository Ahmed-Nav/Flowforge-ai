// backend/src/nodes/utils.ts — Shared helpers for node handlers
import { WorkflowDefinition } from "../types";

/**
 * Extracts the output of the parent node connected to the given nodeId.
 * This pattern was repeated in nearly every node handler.
 */
export function getParentOutput(
  nodeId: string,
  context: Record<string, any>,
  definition: WorkflowDefinition,
): any {
  const incomingEdge = (definition.edges || []).find(
    (e: any) => e.target === nodeId,
  );
  return incomingEdge ? context[incomingEdge.source] : {};
}

/**
 * Resolves the parent output to a string value.
 * Falls back to JSON serialization if the output is not a plain string.
 */
export function getParentOutputValue(
  nodeId: string,
  context: Record<string, any>,
  definition: WorkflowDefinition,
): string {
  const parent = getParentOutput(nodeId, context, definition);
  return parent?.result || JSON.stringify(parent) || "";
}

/**
 * Replaces {{previous_step}} placeholders in a template with the parent output.
 */
export function resolveTemplate(
  template: string,
  nodeId: string,
  context: Record<string, any>,
  definition: WorkflowDefinition,
): string {
  const value = getParentOutputValue(nodeId, context, definition);
  return template.replace("{{previous_step}}", value);
}
