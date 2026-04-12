// backend/src/nodes/http.ts
import { WorkflowNode, WorkflowDefinition, NodeHandler } from "../types";
import fetch from "cross-fetch";

export const execute: NodeHandler = async (
  node: WorkflowNode,
  _context: Record<string, any>,
  _definition: WorkflowDefinition,
  _initialData: any,
) => {
  const url = node.data.url;
  const method = node.data.method || "GET";
  console.log(`   🌐 HTTP START: ${method} ${url}`);

  if (!url) return { error: "No URL provided" };

  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!res.ok) throw new Error(`HTTP Error: ${res.status}`);

    const data = await res.json();
    console.log("   ✅ HTTP SUCCESS");
    return { result: JSON.stringify(data), status: res.status };
  } catch (err: any) {
    console.error("   ❌ HTTP FAILED:", err.message);
    return { error: `HTTP Failed: ${err.message}` };
  }
};
