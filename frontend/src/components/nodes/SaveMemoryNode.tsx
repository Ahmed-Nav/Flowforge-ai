import { Handle, Position } from "@xyflow/react";

export default function SaveMemoryNode({ data }: any) {
  return (
    <div className="bg-yellow-900 border-4 border-yellow-600 shadow-pixel p-4 w-64 rounded-lg font-pixel">
      <div className="flex items-center gap-2 mb-2 border-b-2 border-yellow-700 pb-2">
        <span className="text-xl">💾</span>
        <span className="text-yellow-100 font-bold text-sm">SAVE MEMORY</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-yellow-300 text-xs block mb-1">
            DATA TO MEMORIZE
          </label>
          <textarea
            className="w-full bg-black border-2 border-yellow-700 text-yellow-100 p-2 text-xs font-mono rounded h-20 focus:outline-none focus:border-yellow-400"
            defaultValue={data.content || "{{previous_step}}"}
            onChange={(evt) => (data.content = evt.target.value)}
            placeholder="Data to save..."
          />
        </div>
        <div className="text-[10px] text-yellow-400 opacity-70">
          * This data will be vectorized and stored in the Long-Term Brain.
        </div>
      </div>

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-black"
      />
      <Handle
        type="source"
        position={Position.Right}
        className="!bg-yellow-500 !w-3 !h-3 !border-2 !border-black"
      />
    </div>
  );
}
