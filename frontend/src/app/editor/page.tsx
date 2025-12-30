"use client";

import { useState, useCallback, useEffect } from "react";
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

import { useAuth } from "@/context/AuthContext";

const nodeTypes: NodeTypes = {
  retro: RetroNode,
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
  },
  {
    id: "2",
    type: "retro",
    position: { x: 100, y: 350 },
    data: { label: "GPT-4 Brain", type: "ai", subline: "Summarizing input..." },
  },
  {
    id: "3",
    type: "retro",
    position: { x: 500, y: 350 },
    data: {
      label: "Email Action",
      type: "action",
      subline: "Sending to user@example.com",
    },
  },
];

const initialEdges = [
  {
    id: "e1-2",
    source: "1",
    target: "2",
    animated: true,
    style: { stroke: "#1D1D1D", strokeWidth: 2 },
  },
];

export default function EditorPage() {
  const { token } = useAuth();
  const searchParams = useSearchParams();
  const router = useRouter();
  const workflowId = searchParams.get("id");
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges);
  const [runStatus, setRunStatus] = useState<string | null>(null);
  const [logs, setLogs] = useState<any[]>([]);
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (workflowId && token) {
      const loadWorkflow = async () => {
        try {
          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/workflows`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const workflows = await res.json();
          const current = workflows.find((w: any) => w.id === workflowId);

          if (current && current.definition) {
            console.log("Loaded workflow:", current);
          }
        } catch (err) {
          console.error("Failed to load workflow", err);
        }
      };
      loadWorkflow();
    }
  }, [workflowId, token]);

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
        return {
          id: node.id,
          type:
            node.data.type === "trigger"
              ? "TRIGGER"
              : node.data.type === "ai"
              ? "AI"
              : "ACTION",
          data: node.data,
          nextStepId: edge ? edge.target : null,
        };
      }),
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/workflows`, {
        method: "POST",
        headers: { "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
         },
        body: JSON.stringify({
          id: workflowId,
          name: "My Visual Workflow",
          definition: workflowDefinition,
        }),
      });

      const data = await res.json();
      router.push(`/editor?id=${data.id}`);
      return data.id; 
    } catch (err) {
      console.error(err);
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
      }
    );

    setRunStatus("EXECUTING_WORKFLOW... [WAITING_FOR_GEMINI]");
    setRefreshTrigger((prev) => prev + 1);
    pollLogs(workflowId);
  };

  const pollLogs = async (workflowId: string) => {
    const interval = setInterval(async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/workflows/${workflowId}/runs`
        );
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
        console.log("Error polling logs:", e);}
    }, 1000); 
  };

  const onNodeClick = useCallback((event: any, node: any) => {
    if (node.data.type === "ai") {
      setSelectedNodeId(node.id);
    }
  }, []);

  return (
    <div className="h-screen flex flex-col bg-retro-bg">
      <Navbar />

      <div className="flex-1 border-t-4 border-retro-dark relative">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          nodeTypes={nodeTypes}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onNodeClick={onNodeClick}
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
  );
}
