import { Handle, Position, useReactFlow } from "@xyflow/react";
import { Hash, MessageSquare } from "lucide-react";
import { useState, useEffect } from "react";

export default function SlackNode({ data, id }: { data: any; id: string }) {
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
    <div className="bg-fuchsia-900 border-2 border-fuchsia-600 shadow-xl p-4 w-72 rounded-lg font-mono text-white relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-fuchsia-500 !w-3 !h-3 !border-2 !border-black"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-fuchsia-700 pb-2">
        <Hash className="w-5 h-5 text-fuchsia-300" />
        <span className="font-bold text-sm text-fuchsia-100">
          SLACK MESSAGE
        </span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-fuchsia-300 uppercase tracking-wider">
            Webhook URL
          </label>
          <input
            type="text"
            className="w-full bg-black/50 border border-fuchsia-700 rounded p-1 text-xs text-fuchsia-100 focus:outline-none focus:border-fuchsia-400"
            placeholder="https://hooks.slack.com/..."
            value={url}
            onChange={(e) => handleChange("url", e.target.value)}
          />
        </div>

        <div>
          <label className="text-[10px] text-fuchsia-300 uppercase tracking-wider">
            Message
          </label>
          <textarea
            className="w-full bg-black/50 border border-fuchsia-700 rounded p-1 text-xs text-fuchsia-100 focus:outline-none focus:border-fuchsia-400 h-16 resize-none"
            placeholder="Alert: {{previous_step}}"
            value={message}
            onChange={(e) => handleChange("message", e.target.value)}
          />
          <div className="text-[9px] text-gray-400 mt-1">
            Supports{" "}
            <code className="bg-black/30 px-1 rounded">
              {"{{previous_step}}"}
            </code>{" "}
            variable
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-fuchsia-500 !w-3 !h-3 !border-2 !border-black"
      />
    </div>
  );
}
