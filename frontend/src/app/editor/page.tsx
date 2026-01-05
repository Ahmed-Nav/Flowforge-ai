"use client";

import { useState, useCallback, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  ReactFlow,
  Background,
  Controls,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  NodeTypes,
} from "@xyflow/react";
import "@xyflow/react/dist/style.css";
import Navbar from "@/components/Navbar";
import RetroNode from "@/components/nodes/RetroNode";
import ConfigPanel from "@/components/ConfigPanel";
import RunHistory from "@/components/RunHistory";
import PromptNode from "@/components/nodes/PromptNode";
import NodeLibrary from "@/components/NodeLibrary";
import HttpNode from "@/components/nodes/HttpNode";
import ConditionNode from "@/components/nodes/ConditionNode";
import DiscordNode from "@/components/nodes/DiscordNode";
import EmailNode from "@/components/nodes/EmailNode";

import { useAuth } from "@/context/AuthContext";

const nodeTypes: NodeTypes = {
  retro: RetroNode,
  promptNode: PromptNode,
  httpNode: HttpNode,
  conditionNode: ConditionNode,
  discordNode: DiscordNode,
  emailNode: EmailNode,
};

const initialNodes = [
  {
    id: "1",
    type: "retro",
    position: { x: 100, y: 100 },
    data: {
      label: "Webhook Trigger",
      type: "trigger",
      subline: "Listening for POST requests...",
    },
    deletable: false,
  }
];

const initialEdges: any[] = [];

function EditorPage() {
  const { token, isAuthenticated, loading } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get("id");
  const [nodes, setNodes, onNodesChange] = useNodesState<any>(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!loading && !isAuthenticated) {
      router.push("/login");
    }
  }, [loading, isAuthenticated, router]);

  useEffect(() => {
    if (!workflowId || !token) return;

    const loadWorkflow = async () => {
      try {
        const resList = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workflows`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        if (resList.ok) {
          const allWorkflows = await resList.json();
          const current = allWorkflows.find((w: any) => w.id === workflowId);

          if (current && current.definition) {
            const graph =
              typeof current.definition === "string"
                ? JSON.parse(current.definition)
                : current.definition;

            if (graph.nodes) {
              const restoredNodes = graph.nodes.map((n: any) => {
                let frontendType = "retro";

                if (n.type === "AI") frontendType = "promptNode";
                if (n.type === "TRIGGER") frontendType = "retro";
                if (n.type === "HTTP") frontendType = "httpNode";
                if (n.type === "CONDITION") frontendType = "conditionNode";
                if (n.type === "DISCORD") frontendType = "discordNode";
                if (n.type === "EMAIL") frontendType = "emailNode";

                return {
                  ...n,
                  type: frontendType,
                };
              });
              setNodes(restoredNodes);
            }

            if (graph.edges) setEdges(graph.edges);
          }
        }
      } catch (err) {
        console.error("Failed to load workflow", err);
      }
    };

    loadWorkflow();
  }, [workflowId, token, setNodes, setEdges]);

  const onConnect = useCallback(
    (params: Connection) =>
      setEdges((eds) =>
        addEdge(
          {
            ...params,
            animated: true,
            style: { stroke: "#1D1D1D", strokeWidth: 2 },
          },
          eds
        )
      ),
    [setEdges]
  );

  const handleDeploy = async () => {
    const workflowDefinition = {
      triggerId: nodes.find((n) => n.data.type === "trigger")?.id,
      nodes: nodes.map((node) => {
        const edge = edges.find((e) => e.source === node.id);
        let backendType = "ACTION";
        if (node.data.type === "trigger") backendType = "TRIGGER";
        else if (node.data.type === "ai" || node.type === "promptNode")
          backendType = "AI";
        else if (node.type === "httpNode") backendType = "HTTP";
        else if (node.type === "conditionNode") backendType = "CONDITION";
        else if (node.type === "discordNode") backendType = "DISCORD";
        else if (node.type === "emailNode") backendType = "EMAIL";

        return {
          id: node.id,
          type: backendType,
          data: node.data,
          position: node.position,
          nextStepId: edge ? edge.target : null,
        };
      }),
      edges: edges,
    };

    try {
      console.log("🚀 DEPLOYING NODES:", JSON.stringify(nodes, null, 2));
      console.log("🚀 Deploying with Token:", token?.slice(0, 10) + "...");

      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id: workflowId,
          name: "My Visual Workflow",
          definition: workflowDefinition,
        }),
      });

      if (res.status === 401 || res.status === 403) {
        alert(
          "Session Expired: The backend rejected your token. Redirecting to login..."
        );
        localStorage.removeItem("token");
        router.push("/login");
        return null;
      }

      if (!res.ok) {
        const errText = await res.text();
        throw new Error(`Deployment Failed: ${res.status} ${errText}`);
      }

      const data = await res.json();

      if (!workflowId) {
        router.push(`/editor?id=${data.id}`);
      }
      return data.id;
    } catch (err: any) {
      console.error("❌ Deployment Error:", err);
      setRunStatus(`ERROR: ${err.message}`);
      return null;
    }
  };

  const runWorkflow = async () => {
    setRunStatus("DEPLOYING_TO_SERVER...");
    const workflowId = await handleDeploy();

    if (!workflowId) {
      setRunStatus("DEPLOYMENT_FAILED_ERROR_500");
      return;
    }

    setRunStatus("INITIALIZING_AI_AGENTS...");

    await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/run`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      }
    );

    setRunStatus("EXECUTING_WORKFLOW... [WAITING_FOR_GEMINI]");
    setRefreshTrigger((prev) => prev + 1);
    pollLogs(workflowId);
  };

  const pollLogs = async (workflowId: string) => {
    if (!workflowId) return;
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/runs`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

        if (!res.ok) {
          if (res.status === 401 || res.status === 403) {
            clearInterval(interval);
            alert("Session expired. Please login again.");
            router.push("/login");
            return;
          }
          console.error("Polling failed:", res.status);
          return;
        }

        const runs = await res.json();
        const latestRun = runs[0];

        if (latestRun && latestRun.status === "COMPLETED") {
          setRunStatus("✅ MISSION_COMPLETED");
          setLogs(latestRun.outputs ? [latestRun.outputs] : []);
          clearInterval(interval);
        } else if (latestRun && latestRun.status === "FAILED") {
          setRunStatus("❌ MISSION_FAILED");
          setLogs([{ error: "Workflow crashed in backend." }]);
          clearInterval(interval);
        }
      } catch (e) {
        console.log("Error polling logs:", e);
      }
    }, 1000);
  };

  const onNodeClick = useCallback((event: any, node: any) => {
    if (node.data.type === "ai") {
      setSelectedNodeId(node.id);
    }
  }, []);

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = "move";
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData("application/reactflow");
      const dataString = event.dataTransfer.getData("application/nodedata");

      if (!type || !dataString) return;

      const data = JSON.parse(dataString);

      
      const position = { x: event.clientX - 300, y: event.clientY - 100 }; 

      const newNode = {
        id: `node-${Date.now()}`, 
        type,
        position,
        data: data,
      };

      setNodes((nds) => nds.concat(newNode));
    },
    [setNodes]
  );

  const deleteNode = useCallback(
    (id: string) => {
      setNodes((nds) => nds.filter((n) => n.id !== id));
      setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
      setSelectedNodeId(null);
    },
    [setNodes, setEdges]
  );

  if (loading)
    return (
      <div className="bg-gray-900 h-screen text-white p-10">
        System Initializing...
      </div>
    );

  return (
    <div className="h-screen flex flex-col bg-retro-bg">
      <Navbar />

      <div className="flex-1 flex overflow-hidden border-t-4 border-retro-dark relative">
        <NodeLibrary />

        <div className="flex-1 relative h-full ">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            nodeTypes={nodeTypes}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={onNodeClick}
            onDragOver={onDragOver}
            onDrop={onDrop}
            fitView
          >
            <Background color="#1D1D1D" gap={30} size={2} />

            <Controls
              className="bg-retro-bg border-2 border-retro-dark shadow-pixel text-retro-dark"
              position="bottom-left"
            />
          </ReactFlow>

          <RunHistory
            workflowId={workflowId}
            refreshTrigger={refreshTrigger}
            onSelectRun={(run) => {
              setRunStatus(
                run.status === "COMPLETED"
                  ? "✅ MISSION_COMPLETED"
                  : run.status === "FAILED"
                  ? "❌ MISSION_FAILED"
                  : "⏳ RUN_PENDING"
              );
              setLogs(run.outputs ? [run.outputs] : []);
            }}
          />

          <ConfigPanel
            selectedNodeId={selectedNodeId}
            nodes={nodes}
            setNodes={setNodes}
            onClose={() => setSelectedNodeId(null)}
            onDelete={deleteNode}
          />

          <div className="absolute bottom-4 left-4 right-4 h-48 bg-black border-4 border-retro-dark p-4 font-pixel text-green-400 overflow-y-auto shadow-pixel z-20 opacity-90">
            <div className="flex justify-between border-b-2 border-green-800 mb-2 pb-1">
              <span>TERMINAL_OUTPUT</span>
              <button
                onClick={runWorkflow}
                className="hover:text-white hover:underline"
              >
                [ EXECUTE_RUN ]
              </button>
            </div>

            <div>{runStatus || "READY_TO_DEPLOY..."}</div>

            {logs.map((log, i) => (
              <pre
                key={i}
                className="whitespace-pre-wrap mt-2 text-sm text-retro-bg"
              >
                {JSON.stringify(log, null, 2)}
              </pre>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

import { ReactFlowProvider } from "@xyflow/react";
export default function Editor() {
  return (
    <Suspense
      fallback={
        <div className="flex h-screen items-center justify-center text-white bg-gray-900">
          Loading Console...
        </div>
      }
    >
      <ReactFlowProvider>
        <EditorPage />
      </ReactFlowProvider>
    </Suspense>
  );
}
