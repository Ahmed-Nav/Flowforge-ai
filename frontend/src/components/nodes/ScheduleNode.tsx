import { Handle, Position, useReactFlow } from "@xyflow/react";
import { useState, useEffect } from "react";
import { Clock } from "lucide-react";

export default function ScheduleNode({ data, id }: { data: any; id: string }) {
  const { updateNodeData } = useReactFlow();
  const [cron, setCron] = useState(data.cron || "0 9 * * *");

  useEffect(() => {
    if (data.cron) setCron(data.cron);
  }, [data.cron]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setCron(e.target.value);
    updateNodeData(id, { cron: e.target.value });
  };

  return (
    <div className="bg-gray-800 border-2 border-purple-500 rounded-lg p-4 shadow-xl w-64">
      <div className="bg-purple-600 -mx-4 -mt-4 mb-4 p-2 rounded-t-lg font-bold text-white text-xs tracking-widest flex items-center gap-2">
        <Clock size={14} /> SCHEDULER
      </div>

      <div className="mb-2">
        <label className="text-gray-400 text-[10px] uppercase font-bold">
          Cron Expression
        </label>
        <input
          type="text"
          value={cron}
          onChange={handleChange}
          placeholder="* * * * *"
          className="w-full bg-gray-900 text-purple-300 text-xs font-mono p-2 rounded border border-gray-700 focus:border-purple-500 outline-none"
        />
        <div className="text-[8px] text-gray-500 mt-1">
          Format: Min Hour Day Month Weekday
          <br />
          Example: "0 9 * * *" = Daily at 9 AM
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-green-500 !w-3 !h-3"
      />
    </div>
  );
}
