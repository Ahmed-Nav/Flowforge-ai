import { StateGraph, END, Annotation } from "@langchain/langgraph";
import { WorkflowEngine } from "./engine";
import { WorkflowDefinition, WorkflowNode } from "./types";
import { Langfuse } from "langfuse";
import { CallbackHandler } from "@langfuse/langchain";

const lf = new Langfuse({
  publicKey: process.env.LANGFUSE_PUBLIC_KEY!,
  secretKey: process.env.LANGFUSE_SECRET_KEY!,
});

const AgentState = Annotation.Root({
    context: Annotation<Record<string, any>>({ reducer: (a, b) => ({ ...a, ...b }) }),
    runId: Annotation<string>,
    attempts: Annotation<number>({ reducer: (_, b) => b ?? 0 }),
});

function wrapNode(node: WorkflowNode, definition: WorkflowDefinition) {
    const engine = new WorkflowEngine();
    return async (state: typeof AgentState.State) => {
        const output = await engine.executeNode(node, state.context, definition, {});

        if (node.type === "AI" && output.result && process.env.LANGFUSE_SECRET_KEY) {
            lf.score({
                traceId: state.runId,
                name: "ai-node-output-length", // proxy quality metric
                value: output.result.length,
                comment: `Node ${node.id} (${node.type})`,
            });
        }

        return { context: { [node.id]: output } };
    };
}

export function buildLangGraph(definition: WorkflowDefinition) {
    const graph = new StateGraph(AgentState);

    for (const node of definition.nodes) {
        graph.addNode(node.id, wrapNode(node, definition));
    }

    for (const edge of definition.edges) {
        const src = edge.source, tgt = edge.target;
        if (edge.sourceHandle === "true" || edge.sourceHandle === "false") {
            const sibling = definition.edges.find(
                e => e.source === src && e.sourceHandle !== edge.sourceHandle
            );
            graph.addConditionalEdges(src, (state) => {
                const res = state.context[src]?.result;
                return res === "TRUE" ? "true" : "false";
            }, {
                true: edge.sourceHandle === "true" ? tgt : (sibling?.target ?? END),
                false: edge.sourceHandle === "false" ? tgt : (sibling?.target ?? END)
            });
        } else {
            graph.addEdge(src as any, tgt === undefined ? END : tgt as any);
        }
    }

    graph.setEntryPoint(definition.triggerId as any);
    return graph.compile();
}

export async function runLangGraph(
    definition: WorkflowDefinition, runId: string
) {
    const trace = lf.trace({
        name: "workflow-run",
        id: runId,
        metadata: { compiledByDSPy: definition.compiledByDSPy ?? false }
    });

    const g = buildLangGraph(definition);
    const handler = new CallbackHandler();

    const result = await g.invoke(
        { context: {}, runId, attempts: 0 },
        { callbacks: [handler] }
    );

    await lf.flushAsync();
    return result;
}