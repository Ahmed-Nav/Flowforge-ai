import { Handle, Position, NodeProps } from "@xyflow/react";
import { Zap, Bot, Mail, Globe } from "lucide-react";

const ICONS: Record<string, any> = {
  trigger: Zap,
  ai: Bot,
  action: Mail,
  api: Globe,
};

export default function RetroNode({ data }: NodeProps) {
  const Icon = ICONS[data.type as string] || Zap;

  return (
    <div className="w-64 bg-retro-bg border-4 border-retro-dark shadow-pixel transition-transform hover:-translate-y-1">
      <div className="bg-retro-primary p-2 border-b-4 border-retro-dark flex items-center gap-2">
        <Icon className="w-5 h-5 text-white" />
        <span className="text-white font-bold uppercase tracking-widest text-lg">
          {data.label as string}
        </span>
      </div>

      <div className="p-4">
        <p className="text-sm opacity-70 mb-2 font-pixel">CONFIGURATION:</p>
        <div className="bg-white border-2 border-retro-dark p-2 text-sm text-retro-dark">
          {(data.subline as string) || "No configuration needed."}
        </div>
      </div>

      {data.type !== "trigger" && (
        <Handle
          type="target"
          position={Position.Top}
          className="!w-4 !h-4 !bg-retro-dark !border-2 !border-white"
        />
      )}

      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-4 !h-4 !bg-retro-primary !border-2 !border-retro-dark"
      />
    </div>
  );
}
