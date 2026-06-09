import { DragEvent, useState } from "react";
import { Shield, Info } from "lucide-react";
import { useGameStore } from "@/store/gameStore";

const GuidePanel = () => {
  const { guides, phase, totalGuides } = useGameStore();
  const [draggingId, setDraggingId] = useState<number | null>(null);

  const availableGuides = guides.filter((g) => !g.isDeployed);
  const deployedCount = totalGuides - availableGuides.length;

  const handleDragStart = (e: DragEvent<HTMLDivElement>, guideId: number) => {
    if (phase !== "waiting") {
      e.preventDefault();
      return;
    }
    e.dataTransfer.setData("guideId", String(guideId));
    e.dataTransfer.effectAllowed = "move";
    setDraggingId(guideId);
  };

  const handleDragEnd = () => {
    setDraggingId(null);
  };

  return (
    <div className="glass-panel rounded-2xl px-6 py-4">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-subway-accent to-cyan-700 flex items-center justify-center shadow-lg">
            <Shield className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-white font-display font-semibold text-lg">
              疏导员
            </div>
            <div className="text-slate-400 text-xs">
              已部署{" "}
              <span className="text-subway-accent font-bold">
                {deployedCount}
              </span>{" "}
              / {totalGuides}
              <span className="mx-2">·</span>
              剩余{" "}
              <span className="text-subway-success font-bold">
                {availableGuides.length}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 text-slate-400 text-xs max-w-sm">
          <Info className="w-4 h-4 flex-shrink-0" />
          <span>
            {phase === "waiting"
              ? "拖拽疏导员到拥堵的候车区，点击已部署的疏导员可回收"
              : "疏导员仅在候车阶段可部署"}
          </span>
        </div>
      </div>

      <div className="flex items-center gap-4 min-h-[64px]">
        {availableGuides.length === 0 ? (
          <div className="text-slate-500 text-sm italic">
            所有疏导员已部署，点击候车区内的疏导员可回收
          </div>
        ) : (
          availableGuides.map((guide) => (
            <div
              key={guide.id}
              draggable={phase === "waiting"}
              onDragStart={(e) => handleDragStart(e, guide.id)}
              onDragEnd={handleDragEnd}
              className={`guide-avatar flex flex-col items-center gap-1 p-3 rounded-xl bg-slate-800/60 border border-slate-600/40 ${draggingId === guide.id ? "dragging" : ""} ${phase !== "waiting" ? "opacity-40 cursor-not-allowed" : ""}`}
            >
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-subway-accent to-cyan-600 flex items-center justify-center shadow-md border-2 border-cyan-400/30">
                <Shield className="w-5 h-5 text-white" />
              </div>
              <span className="text-xs text-slate-300 font-medium">
                #{guide.id + 1}
              </span>
            </div>
          ))
        )}

        {availableGuides.length > 0 && phase === "waiting" && (
          <div className="ml-auto flex items-center gap-2 px-4 py-2 rounded-xl bg-subway-accent/10 border border-subway-accent/30">
            <div className="w-2 h-2 rounded-full bg-subway-accent animate-pulse" />
            <span className="text-subway-accent text-sm font-medium">
              拖拽到候车区开始疏导
            </span>
          </div>
        )}
      </div>
    </div>
  );
};

export default GuidePanel;
