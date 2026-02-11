import { Handle, Position } from "@xyflow/react";
import { FileText } from "lucide-react";

export default function NotionNode({ data }: any) {
  return (
    <div className="bg-white border-2 border-black shadow-xl p-4 w-72 rounded-lg font-mono text-black relative">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-black !w-3 !h-3 !border-2 !border-white"
      />

      <div className="flex items-center gap-2 mb-3 border-b-2 border-gray-200 pb-2">
        <FileText className="w-5 h-5" />
        <span className="font-bold text-sm">NOTION PAGE</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">
            Database ID
          </label>
          <input
            type="text"
            className="w-full bg-gray-100 border border-gray-300 rounded p-1 text-xs text-black focus:outline-none focus:border-black"
            placeholder="e.g., 845dd7c03aa7..."
            defaultValue={data.databaseId}
            onChange={(e) => (data.databaseId = e.target.value)}
          />
        </div>

        <div>
          <label className="text-[10px] text-gray-500 uppercase tracking-wider">
            Page Content
          </label>
          <textarea
            className="w-full bg-gray-100 border border-gray-300 rounded p-1 text-xs text-black focus:outline-none focus:border-black h-16 resize-none"
            placeholder="Content: {{previous_step}}"
            defaultValue={data.content}
            onChange={(e) => (data.content = e.target.value)}
          />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-black !w-3 !h-3 !border-2 !border-white"
      />
    </div>
  );
}
