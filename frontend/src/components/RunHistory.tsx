import { useEffect, useState } from "react";
import { Clock, CheckCircle, XCircle, Terminal } from "lucide-react";

interface RunHistoryProps {
  workflowId: string | null;
  onSelectRun: (run: any) => void;
  refreshTrigger: number; 
}

export default function RunHistory({
  workflowId,
  onSelectRun,
  refreshTrigger,
}: RunHistoryProps) {
  const [runs, setRuns] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!workflowId) return;

    const fetchRuns = async () => {
      if (runs.length === 0) setLoading(true);

      try {
        const res = await fetch(
          `http://localhost:3001/workflows/${workflowId}/runs`
        );
        const data = await res.json();
        setRuns(data);
        if (data.length > 0 && runs.length === 0) {
          onSelectRun(data[0]);
        }
      } catch (err) {
        console.error("Failed to fetch history", err);
      } finally {
        setLoading(false);
      }
    };

    fetchRuns(); 

    const interval = setInterval(fetchRuns, 2000);

    return () => clearInterval(interval); 
  }, [workflowId, refreshTrigger]);

  if (!workflowId) return null;

  return (
    <div className="absolute top-20 left-4 w-64 bg-retro-bg border-4 border-retro-dark shadow-pixel z-10 flex flex-col max-h-[500px]">
      <div className="bg-retro-dark text-white p-2 font-pixel flex items-center gap-2">
        <Clock size={16} />
        <span>RUN_HISTORY_LOG</span>
      </div>

      <div className="overflow-y-auto flex-1 p-2 space-y-2">
        {loading && (
          <div className="text-xs text-center p-2 font-pixel">
            LOADING_DATA...
          </div>
        )}

        {!loading && runs.length === 0 && (
          <div className="text-xs text-center p-2 opacity-50 font-pixel">
            NO_LOGS_FOUND
          </div>
        )}

        {runs.map((run) => (
          <button
            key={run.id}
            onClick={() => onSelectRun(run)}
            className="w-full text-left bg-white border-2 border-retro-dark p-2 hover:bg-retro-accent hover:text-white transition-colors group"
          >
            <div className="flex justify-between items-center mb-1">
              <span className="font-bold text-xs">#{run.id.slice(0, 4)}</span>
              {run.status === "COMPLETED" ? (
                <CheckCircle
                  size={14}
                  className="text-green-600 group-hover:text-white"
                />
              ) : run.status === "FAILED" ? (
                <XCircle
                  size={14}
                  className="text-red-600 group-hover:text-white"
                />
              ) : (
                <Terminal
                  size={14}
                  className="text-blue-600 animate-pulse group-hover:text-white"
                />
              )}
            </div>
            <div className="text-[10px] font-mono opacity-60 truncate">
              {new Date(run.createdAt).toLocaleTimeString()}
            </div>
          </button>
        ))}
      </div>
    </div>
  );
}
