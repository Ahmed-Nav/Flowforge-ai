import { Clock, GitFork, Mail, MessageSquare, ScanSearch } from "lucide-react";
import React from "react";

export default function NodeLibrary() {
  const onDragStart = (event: React.DragEvent, nodeType: string, data: any) => {
    event.dataTransfer.setData("application/reactflow", nodeType);
    event.dataTransfer.setData("application/nodedata", JSON.stringify(data));
    event.dataTransfer.effectAllowed = "move";
  };

  return (
    <aside className="w-64 bg-gray-900 border-r border-gray-800 p-4 flex flex-col gap-4 z-20 h-full overflow-y-auto pb-24 shadow-2xl">
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
      <div
        className="bg-gray-800 border border-blue-600 p-3 rounded cursor-grab hover:border-blue-400 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "httpNode", {
            type: "http",
            url: "",
            method: "GET",
          })
        }
        draggable
      >
        <div className="w-8 h-8 bg-blue-900/50 rounded flex items-center justify-center text-blue-200">
          🌐
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">HTTP Request</div>
          <div className="text-[10px] text-gray-500">Fetch API Data</div>
        </div>
      </div>
      <div
        className="bg-gray-800 border border-purple-600 p-3 rounded cursor-grab hover:border-purple-400 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "conditionNode", {
            type: "condition",
            condition: "contains",
            value: "",
          })
        }
        draggable
      >
        <div className="w-8 h-8 bg-purple-900/50 rounded flex items-center justify-center text-purple-200">
          <GitFork size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">Logic Gate</div>
          <div className="text-[10px] text-gray-500">If / Else Branching</div>
        </div>
      </div>
      <div
        className="bg-gray-800 border border-indigo-600 p-3 rounded cursor-grab hover:border-indigo-400 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "discordNode", {
            type: "discord",
            url: "",
            message: "",
          })
        }
        draggable
      >
        <div className="w-8 h-8 bg-indigo-900/50 rounded flex items-center justify-center text-indigo-200">
          <MessageSquare size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">Discord Bot</div>
          <div className="text-[10px] text-gray-500">Send Notification</div>
        </div>
      </div>
      <div
        className="bg-gray-800 border border-yellow-600 p-3 rounded cursor-grab hover:border-yellow-400 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "emailNode", {
            type: "email",
            to: "",
            subject: "",
            body: "",
          })
        }
        draggable
      >
        <div className="w-8 h-8 bg-yellow-900/50 rounded flex items-center justify-center text-yellow-200">
          <Mail size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">Send Email</div>
          <div className="text-[10px] text-gray-500">SMTP Notification</div>
        </div>
      </div>
      <div
        className="bg-gray-800 border border-orange-600 p-3 rounded cursor-grab hover:border-orange-400 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "scraperNode", { type: "scraper", url: "" })
        }
        draggable
      >
        <div className="w-8 h-8 bg-orange-900/50 rounded flex items-center justify-center text-orange-200">
          <ScanSearch size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">Web Scraper</div>
          <div className="text-[10px] text-gray-500">Read Website Text</div>
        </div>
      </div>
      <div
        className="bg-gray-800 border border-purple-500 p-3 rounded cursor-grab hover:border-purple-400 transition shadow-lg flex items-center gap-3"
        onDragStart={(event) =>
          onDragStart(event, "scheduleNode", {
            type: "schedule",
            cron: "0 9 * * *",
          })
        }
        draggable
      >
        <div className="w-8 h-8 bg-purple-900/50 rounded flex items-center justify-center text-purple-200">
          <Clock size={16} />
        </div>
        <div>
          <div className="text-sm font-bold text-gray-200">Scheduler</div>
          <div className="text-[10px] text-gray-500">Run Cron Jobs</div>
        </div>
      </div>
    </aside>
  );
}
