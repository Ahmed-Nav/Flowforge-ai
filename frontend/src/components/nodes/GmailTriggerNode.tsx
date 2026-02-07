import { Handle, Position } from "@xyflow/react";
import { Mail, RefreshCw } from "lucide-react";

export default function GmailTriggerNode({ data }: any) {
  return (
    <div className="bg-red-900 border-2 border-red-600 shadow-xl p-4 w-72 rounded-lg font-mono text-white relative">
      <div className="flex items-center gap-2 mb-3 border-b border-red-700 pb-2">
        <Mail className="w-5 h-5 text-red-300" />
        <span className="font-bold text-sm text-red-100">GMAIL WATCHER</span>
        <div className="ml-auto animate-pulse">
          <RefreshCw size={12} className="text-red-400" />
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-red-300 uppercase tracking-wider">
            Search Query (IMAP)
          </label>
          <input
            type="text"
            className="w-full bg-black/50 border border-red-700 rounded p-1 text-xs text-red-100 focus:outline-none focus:border-red-400"
            placeholder="UNSEEN SUBJECT 'Invoice'"
            defaultValue={data.searchQuery || "UNSEEN"}
            onChange={(e) => (data.searchQuery = e.target.value)}
          />
          <div className="text-[9px] text-gray-400 mt-1">
            Example:{" "}
            <code className="bg-black/30 px-1 rounded">
              UNSEEN FROM "boss@work.com"
            </code>
          </div>
        </div>

        <div className="bg-red-950/50 p-2 rounded border border-red-800">
          <p className="text-[10px] text-red-200">
            ℹ️ Checks Inbox every 60s. <br />
            Uses credentials from .env
          </p>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-red-500 !w-3 !h-3 !border-2 !border-black"
      />
    </div>
  );
}
