import { Handle, Position } from "@xyflow/react";
import { Table, Database } from "lucide-react";

export default function GoogleSheetsNode({ data }: any) {
  return (
    <div className="bg-green-900 border-2 border-green-600 shadow-xl p-4 w-64 rounded-lg font-mono text-white">
      <Handle
        type="target"
        position={Position.Left}
        className="!bg-white !w-3 !h-3"
      />

      <div className="flex items-center gap-2 mb-3 border-b border-green-700 pb-2">
        <Table className="w-5 h-5 text-green-300" />
        <span className="font-bold text-sm text-green-100">GOOGLE SHEETS</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-[10px] text-green-300 uppercase tracking-wider">
            Sheet ID
          </label>
          <input
            type="text"
            className="w-full bg-black/50 border border-green-700 rounded p-1 text-xs text-green-100 focus:outline-none focus:border-green-400"
            placeholder="1BxiMvs..."
            defaultValue={data.sheetId}
            onChange={(e) => (data.sheetId = e.target.value)}
          />
          <div className="text-[9px] text-gray-400 mt-1">
            Found in the URL of your sheet
          </div>
        </div>

        <div>
          <label className="text-[10px] text-green-300 uppercase tracking-wider">
            Range
          </label>
          <input
            type="text"
            className="w-full bg-black/50 border border-green-700 rounded p-1 text-xs text-green-100 focus:outline-none focus:border-green-400"
            placeholder="Sheet1!A:A"
            defaultValue={data.range}
            onChange={(e) => (data.range = e.target.value)}
          />
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-white !w-3 !h-3"
      />
    </div>
  );
}
