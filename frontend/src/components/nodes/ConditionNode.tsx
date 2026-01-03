import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";
import { GitFork } from "lucide-react";

export default function ConditionNode({ data, id }: { data: any; id: string }) {
  const { updateNodeData } = useReactFlow();
  const [condition, setCondition] = useState(data.condition || "contains");
  const [value, setValue] = useState(data.value || "");

  useEffect(() => {
    if (data.condition) setCondition(data.condition);
    if (data.value) setValue(data.value);
  }, [data.condition, data.value]);

  const handleChange = (key: string, val: string) => {
    if (key === "condition") setCondition(val);
    if (key === "value") setValue(val);
    updateNodeData(id, { [key]: val });
  };

  return (
    <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-4 shadow-xl w-64">
      <div className="bg-purple-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <GitFork size={14} /> LOGIC_GATE
      </div>

      <div className="text-[10px] text-gray-400 font-bold mb-1">
        IF INPUT...
      </div>

      <select
        value={condition}
        onChange={(e) => handleChange("condition", e.target.value)}
        className="w-full bg-gray-900 text-purple-300 text-xs font-mono p-2 rounded border border-gray-700 outline-none mb-2"
      >
        <option value="contains">Contains</option>
        <option value="equals">Equals (Exact)</option>
      </select>

      <input
        type="text"
        value={value}
        onChange={(e) => handleChange("value", e.target.value)}
        placeholder="Value to check..."
        className="w-full bg-gray-900 text-white text-xs font-mono p-2 rounded border border-gray-700 focus:border-purple-500 outline-none"
      />

      <Handle
        type="target"
        position={Position.Left}
        className="!bg-blue-500 !w-3 !h-3"
      />

      <div className="absolute -right-3 top-10 flex items-center">
        <span className="text-[9px] text-green-500 mr-2 font-bold">TRUE</span>
        <Handle
          type="source"
          position={Position.Right}
          id="true"
          className="!bg-green-500 !w-3 !h-3 !right-0"
        />
      </div>

      <div className="absolute -right-3 top-20 flex items-center">
        <span className="text-[9px] text-red-500 mr-2 font-bold">FALSE</span>
        <Handle
          type="source"
          position={Position.Right}
          id="false"
          className="!bg-red-500 !w-3 !h-3 !right-0"
        />
      </div>
    </div>
  );
}
