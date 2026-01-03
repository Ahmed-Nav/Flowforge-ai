import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";
import { MessageSquare } from "lucide-react";

export default function DiscordNode({ data, id }: { data: any; id: string }) {
  const { updateNodeData } = useReactFlow();
  const [url, setUrl] = useState(data.url || "");
  const [message, setMessage] = useState(data.message || "");

  useEffect(() => {
    if (data.url !== undefined) setUrl(data.url);
    if (data.message !== undefined) setMessage(data.message);
  }, [data.url, data.message]);

  const handleChange = (key: string, val: string) => {
    if (key === "url") setUrl(val);
    if (key === "message") setMessage(val);
    updateNodeData(id, { [key]: val });
  };

  return (
    <div className="bg-gray-800 border-2 border-indigo-500 rounded-lg p-4 shadow-xl w-64">
      <div className="bg-indigo-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <MessageSquare size={14} /> DISCORD_BOT
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          Webhook URL
        </label>
        <input
          type="text"
          value={url}
          onChange={(e) => handleChange("url", e.target.value)}
          placeholder="https://discord.com/api/webhooks/..."
          className="w-full bg-gray-900 text-indigo-300 text-xs font-mono p-2 rounded border border-gray-700 focus:border-indigo-500 outline-none"
        />
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          Message
        </label>
        <textarea
          value={message}
          onChange={(e) => handleChange("message", e.target.value)}
          placeholder="Alert: {{previous_step}}"
          className="w-full h-16 bg-gray-900 text-white text-xs font-mono p-2 rounded border border-gray-700 focus:border-indigo-500 outline-none resize-none"
        />
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />
    </div>
  );
}
