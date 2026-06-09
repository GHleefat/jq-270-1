import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/gameStore";
import TrainView from "./TrainView";
import WaitingArea from "./WaitingArea";

const Platform = () => {
  const { cars, phase, tickCountdown, tickBoarding, boardingProgress } =
    useGameStore();
  const boardingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(
    null,
  );

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | null = null;

    if (phase === "waiting") {
      interval = setInterval(() => {
        tickCountdown();
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [phase, tickCountdown]);

  useEffect(() => {
    if (phase === "boarding") {
      boardingIntervalRef.current = setInterval(() => {
        tickBoarding();
      }, 150);
    }

    return () => {
      if (boardingIntervalRef.current) {
        clearInterval(boardingIntervalRef.current);
      }
    };
  }, [phase, tickBoarding]);

  return (
    <div className="relative">
      <TrainView />

      <div className="relative glass-panel rounded-3xl p-6 platform-grid">
        <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-subway-accent to-transparent opacity-50" />

        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-subway-success animate-pulse" />
            <span className="text-slate-400 text-sm font-medium">
              候车区 · 俯视视角
            </span>
          </div>
          <div className="flex items-center gap-4 text-xs text-slate-500">
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-blue-400 to-subway-light" />{" "}
              正常
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-orange-400 to-subway-warning" />{" "}
              拥挤
            </span>
            <span className="flex items-center gap-1">
              <span className="w-3 h-3 rounded-full bg-gradient-to-br from-red-400 to-subway-danger" />{" "}
              超载
            </span>
          </div>
        </div>

        <div className="grid grid-cols-6 gap-4">
          {cars.map((car) => (
            <WaitingArea key={car.id} car={car} />
          ))}
        </div>

        <div className="mt-6 flex items-center justify-center gap-2 text-slate-500 text-xs">
          <svg
            className="w-4 h-4"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6h16M4 12h16M4 18h7"
            />
          </svg>
          <span>站台安全线</span>
        </div>
      </div>
    </div>
  );
};

export default Platform;
