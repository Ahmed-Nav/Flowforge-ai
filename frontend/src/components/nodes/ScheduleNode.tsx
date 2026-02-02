import { Handle, Position } from "@xyflow/react";
import { Clock, Calendar } from "lucide-react";
import { useEffect, useState } from "react";

const isNum = (val: string) => !isNaN(Number(val));

export default function ScheduleNode({ data }: any) {
  const initialCron = data.cron || "* * * * *";
  const parts = initialCron.split(" ");

  let initialMode = "custom";
  let initialTime = "09:00";
  let initialDays: string[] = [];

  if (initialCron === "* * * * *") initialMode = "minute";
  else if (initialCron === "0 * * * *") initialMode = "hourly";
  else if (parts.length === 5) {
    if (
      isNum(parts[0]) &&
      isNum(parts[1]) &&
      parts[2] === "*" &&
      parts[3] === "*" &&
      parts[4] === "*"
    ) {
      initialMode = "daily";
      initialTime = `${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`;
    } else if (
      isNum(parts[0]) &&
      isNum(parts[1]) &&
      parts[2] === "*" &&
      parts[3] === "*" &&
      parts[4] !== "*"
    ) {
      initialMode = "weekly";
      initialTime = `${parts[1].padStart(2, "0")}:${parts[0].padStart(2, "0")}`;
      initialDays = parts[4].split(",");
    }
  }

  const [mode, setMode] = useState(initialMode);
  const [time, setTime] = useState(initialTime);
  const [selectedDays, setSelectedDays] = useState<string[]>(initialDays);
  const [customCron, setCustomCron] = useState(initialCron);

  useEffect(() => {
    let newCron = data.cron;

    if (mode === "minute") newCron = "* * * * *";
    else if (mode === "hourly") newCron = "0 * * * *";
    else if (mode === "daily") {
      const [hh, mm] = time.split(":");
      newCron = `${Number(mm)} ${Number(hh)} * * *`;
    } else if (mode === "weekly") {
      const [hh, mm] = time.split(":");
      const days = selectedDays.length > 0 ? selectedDays.join(",") : "*";
      newCron = `${Number(mm)} ${Number(hh)} * * ${days}`;
    } else if (mode === "custom") {
      newCron = customCron;
    }

    data.cron = newCron;
  }, [mode, time, selectedDays, customCron, data]);

  const toggleDay = (day: string) => {
    setSelectedDays((prev) =>
      prev.includes(day) ? prev.filter((d) => d !== day) : [...prev, day],
    );
  };

  return (
    <div className="bg-purple-900 border-4 border-purple-600 shadow-pixel p-4 w-72 rounded-lg font-pixel text-white">
      <div className="flex items-center gap-2 mb-3 border-b-2 border-purple-700 pb-2">
        <Clock className="w-5 h-5 text-purple-300" />
        <span className="font-bold text-sm text-purple-100">SCHEDULER</span>
      </div>

      <div className="space-y-3">
        <div>
          <label className="text-purple-300 text-[10px] block mb-1 uppercase tracking-widest">
            Frequency
          </label>
          <select
            className="w-full bg-black border-2 border-purple-700 text-purple-100 p-1 text-xs font-mono rounded focus:outline-none focus:border-purple-400"
            value={mode}
            onChange={(e) => setMode(e.target.value)}
          >
            <option value="minute">Every Minute</option>
            <option value="hourly">Hourly</option>
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="custom">Custom (Advanced)</option>
          </select>
        </div>

        {(mode === "daily" || mode === "weekly") && (
          <div>
            <label className="text-purple-300 text-[10px] block mb-1 uppercase tracking-widest">
              Time (24H)
            </label>
            <div className="flex items-center gap-2 bg-black border-2 border-purple-700 rounded p-1">
              <Clock size={12} className="text-purple-500" />
              <input
                type="time"
                className="bg-transparent text-purple-100 text-sm font-mono focus:outline-none w-full"
                value={time}
                onChange={(e) => setTime(e.target.value)}
              />
            </div>
          </div>
        )}

        {mode === "weekly" && (
          <div>
            <label className="text-purple-300 text-[10px] block mb-1 uppercase tracking-widest">
              Days
            </label>
            <div className="flex justify-between gap-1">
              {["1", "2", "3", "4", "5", "6", "0"].map((day, i) => (
                <button
                  key={day}
                  onClick={() => toggleDay(day)}
                  className={`w-6 h-6 text-[10px] font-bold rounded flex items-center justify-center border transition-all ${
                    selectedDays.includes(day)
                      ? "bg-purple-500 text-white border-white"
                      : "bg-black text-purple-500 border-purple-800 hover:border-purple-500"
                  }`}
                  title={["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"][i]}
                >
                  {["M", "T", "W", "T", "F", "S", "S"][i]}
                </button>
              ))}
            </div>
          </div>
        )}

        {mode === "custom" && (
          <div>
            <label className="text-purple-300 text-[10px] block mb-1 uppercase tracking-widest">
              Cron Expression
            </label>
            <input
              type="text"
              className="w-full bg-black border-2 border-purple-700 text-purple-100 p-1 text-xs font-mono rounded"
              value={customCron}
              onChange={(e) => setCustomCron(e.target.value)}
              placeholder="* * * * *"
            />
          </div>
        )}

        <div className="bg-purple-950/50 p-2 rounded border border-purple-800/50">
          <div className="text-[9px] text-purple-400 mb-1">Generated Cron:</div>
          <div className="text-[10px] font-mono text-green-300 break-all">
            {data.cron}
          </div>
        </div>
      </div>

      <Handle
        type="source"
        position={Position.Right}
        className="!bg-purple-500 !w-3 !h-3 !border-2 !border-black"
      />
    </div>
  );
}
