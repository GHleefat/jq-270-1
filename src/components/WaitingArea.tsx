import { useState, DragEvent } from "react";
import { Users, Shield, AlertTriangle } from "lucide-react";
import { Car as CarType } from "@/types/game";
import { useGameStore } from "@/store/gameStore";

interface WaitingAreaProps {
  car: CarType;
}

const WaitingArea = ({ car }: WaitingAreaProps) => {
  const { phase, deployGuide, guides, recallGuide } = useGameStore();
  const [isDragOver, setIsDragOver] = useState(false);

  const densityRatio = car.waitingPassengers / car.capacity;
  const isOverloaded = densityRatio > 1;
  const isWarning = densityRatio > 0.75 && !isOverloaded;

  const densityColor = isOverloaded
    ? "from-subway-danger to-red-700"
    : isWarning
      ? "from-subway-warning to-orange-600"
      : densityRatio > 0.4
        ? "from-subway-light to-subway-blue"
        : "from-subway-success to-emerald-700";

  const bgColor = isOverloaded
    ? "bg-red-950/40"
    : isWarning
      ? "bg-orange-950/30"
      : "bg-slate-800/40";

  const borderColor = isDragOver
    ? "border-subway-accent"
    : isOverloaded
      ? "border-subway-danger/60"
      : isWarning
        ? "border-subway-warning/50"
        : "border-slate-600/40";

  const glowClass = isOverloaded
    ? "glow-danger"
    : isWarning
      ? "glow-warning"
      : "";

  const handleDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (phase === "waiting") {
      setIsDragOver(true);
    }
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragOver(false);
    const guideId = parseInt(e.dataTransfer.getData("guideId"), 10);
    if (!isNaN(guideId)) {
      deployGuide(guideId, car.id);
    }
  };

  const deployedGuides = guides.filter((g) => g.deployedCarId === car.id);

  const handleGuideClick = (guideId: number) => {
    if (phase === "waiting") {
      recallGuide(guideId);
    }
  };

  const passengerDots = Math.min(car.waitingPassengers, 20);

  return (
    <div
      className={`drop-zone relative rounded-2xl border-2 ${borderColor} ${bgColor} ${glowClass} p-4 flex flex-col min-h-[200px] transition-all duration-300 ${isDragOver ? "drag-over" : ""}`}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-slate-700/80 flex items-center justify-center border border-slate-600">
            <span className="font-display font-bold text-sm text-white">
              {car.id + 1}
            </span>
          </div>
          <span className="text-slate-300 text-sm font-medium">
            车厢 {car.id + 1}
          </span>
        </div>

        {deployedGuides.length > 0 && (
          <div className="flex -space-x-2">
            {deployedGuides.map((g) => (
              <button
                key={g.id}
                onClick={() => handleGuideClick(g.id)}
                title="点击回收疏导员"
                className="w-7 h-7 rounded-full bg-gradient-to-br from-subway-accent to-cyan-600 border-2 border-slate-900 flex items-center justify-center shadow-md hover:scale-110 transition-transform"
              >
                <Shield className="w-3.5 h-3.5 text-white" />
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Users
          className={`w-4 h-4 ${isOverloaded ? "text-subway-danger" : isWarning ? "text-subway-warning" : "text-slate-400"}`}
        />
        <span
          className={`font-display text-xl font-bold tabular-nums ${isOverloaded ? "text-subway-danger" : isWarning ? "text-subway-warning" : "text-white"}`}
        >
          {car.waitingPassengers}
        </span>
        <span className="text-slate-500 text-sm">/ {car.capacity}</span>
        {isOverloaded && (
          <AlertTriangle className="w-4 h-4 text-subway-danger animate-pulse" />
        )}
      </div>

      <div className="h-2.5 bg-slate-700/50 rounded-full overflow-hidden mb-3">
        <div
          className={`h-full density-bar rounded-full bg-gradient-to-r ${densityColor}`}
          style={{ width: `${Math.min(densityRatio * 100, 120)}%` }}
        />
      </div>

      <div className="flex-1 flex flex-wrap gap-1 items-end content-end">
        {Array.from({ length: passengerDots }).map((_, i) => (
          <div
            key={i}
            className={`passenger-dot w-3 h-3 rounded-full bg-gradient-to-br ${isOverloaded ? "from-red-400 to-subway-danger" : isWarning ? "from-orange-400 to-subway-warning" : "from-blue-400 to-subway-light"}`}
            style={{ animationDelay: `${i * 0.1}s` }}
          />
        ))}
        {car.waitingPassengers > 20 && (
          <span className="text-xs text-slate-400 ml-1">
            +{car.waitingPassengers - 20}
          </span>
        )}
      </div>

      {phase === "waiting" && (
        <div className="absolute bottom-2 right-2 text-xs text-slate-500">
          拖拽疏导员到此处
        </div>
      )}
    </div>
  );
};

export default WaitingArea;
