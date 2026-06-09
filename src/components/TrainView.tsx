import { Train } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import { CAR_COUNT } from "@/types/game";

const TrainView = () => {
  const { trainVisible, cars, phase } = useGameStore();

  if (!trainVisible) return null;

  const isLeaving = phase === "result" || phase === "gameover";

  return (
    <div className="relative w-full mb-6">
      <div
        className={`flex items-end gap-1 ${isLeaving ? "animate-slide-out" : "animate-slide-in"}`}
      >
        {cars.map((car, idx) => {
          const isHead = idx === 0;
          const isTail = idx === CAR_COUNT - 1;
          const overloaded = car.boardedPassengers > car.capacity;
          const warning =
            car.boardedPassengers > car.capacity * 0.75 && !overloaded;

          return (
            <div
              key={car.id}
              className={`relative train-shadow bg-gradient-to-b from-slate-500 to-slate-700 rounded-t-lg border border-slate-400/30 flex-1 flex flex-col items-center justify-center py-3 px-2 min-h-[100px] ${
                isHead ? "rounded-l-2xl" : ""
              } ${isTail ? "rounded-r-2xl" : ""} ${overloaded ? "ring-2 ring-subway-danger glow-danger" : warning ? "ring-2 ring-subway-warning" : ""}`}
            >
              {isHead && (
                <div className="absolute -left-1 top-1/2 -translate-y-1/2 w-6 h-10 bg-gradient-to-r from-subway-light to-slate-600 rounded-l-lg border border-subway-light/50 flex items-center justify-center">
                  <Train className="w-4 h-4 text-white" />
                </div>
              )}

              <div className="text-xs text-slate-300 font-medium mb-1">
                {car.id + 1}号车厢
              </div>

              <div className="grid grid-cols-4 gap-1 mb-2">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div
                    key={i}
                    className={`w-3 h-4 rounded-sm ${
                      i < Math.ceil((car.boardedPassengers / car.capacity) * 8)
                        ? overloaded
                          ? "bg-subway-danger"
                          : warning
                            ? "bg-subway-warning"
                            : "bg-subway-light"
                        : "bg-slate-800/60"
                    }`}
                  />
                ))}
              </div>

              <div
                className={`font-display font-bold text-sm tabular-nums ${
                  overloaded
                    ? "text-subway-danger"
                    : warning
                      ? "text-subway-warning"
                      : "text-white"
                }`}
              >
                {car.boardedPassengers}/{car.capacity}
              </div>

              {overloaded && (
                <div className="absolute -top-2 -right-2 px-2 py-0.5 bg-subway-danger text-white text-xs font-bold rounded-full animate-pulse">
                  超载!
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="h-3 bg-gradient-to-b from-slate-800 to-slate-900 rounded-b-xl mt-[-2px] relative">
        <div className="absolute inset-x-0 top-0 flex justify-around">
          {Array.from({ length: 20 }).map((_, i) => (
            <div key={i} className="w-1 h-1 bg-slate-600 rounded-full" />
          ))}
        </div>
      </div>
    </div>
  );
};

export default TrainView;
