import React from "react";

export default function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/nodedata", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4 z-20">
      <div className="text-gray-400 text-xs font-bold uppercase tracking-widest mb-2">
        Library
      </div>

      <div
        className="bg-gray-800 border border-red-900 p-3 rounded cursor-grab hover:border-red-500 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "promptNode", { type: "ai", prompt: "" })
        }
        draggable
      >
        <div className="w-8 h-8 bg-red-900/50 rounded flex items-center justify-center text-red-200">
          🤖
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">AI Logic</div>
          <div className="text-[10px] text-gray-500">
            Generates text using LLM
          </div>
        </div>
      </div>

      <div
        className="bg-gray-800 border border-blue-900 p-3 rounded cursor-grab hover:border-blue-500 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "retro", {
            type: "trigger",
            label: "Webhook",
            subline: "Listens for requests",
          })
        }
        draggable
      >
        <div className="w-8 h-8 bg-blue-900/50 rounded flex items-center justify-center text-blue-200">
          ⚡
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">Webhook</div>
          <div className="text-[10px] text-gray-500">
            Start workflow via API
          </div>
        </div>
      </div>
    </aside>
  );
}
