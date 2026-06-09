import { Trophy, Clock, Zap, AlertTriangle } from "lucide-react";
import { useGameStore } from "@/store/gameStore";

const TopBar = () => {
  const { score, level, round, maxRounds, countdown, phase, delays } =
    useGameStore();

  const countdownColor =
    countdown <= 5
      ? "text-subway-danger"
      : countdown <= 10
        ? "text-subway-warning"
        : "text-subway-accent";

  return (
    <div className="glass-panel rounded-2xl px-6 py-4 flex items-center justify-between gap-6">
      <div className="flex items-center gap-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center shadow-lg">
            <Trophy className="w-5 h-5 text-slate-900" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              得分
            </div>
            <div className="font-display text-2xl font-bold text-white tabular-nums">
              {score}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-subway-blue to-subway-light flex items-center justify-center shadow-lg">
            <Zap className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              关卡
            </div>
            <div className="font-display text-2xl font-bold text-white">
              Lv.{level}{" "}
              <span className="text-sm text-slate-500">
                ({round}/{maxRounds})
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <div
            className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg ${delays > 0 ? "bg-gradient-to-br from-subway-danger to-red-700" : "bg-gradient-to-br from-slate-600 to-slate-700"}`}
          >
            <AlertTriangle className="w-5 h-5 text-white" />
          </div>
          <div>
            <div className="text-slate-400 text-xs font-medium uppercase tracking-wider">
              延误
            </div>
            <div
              className={`font-display text-2xl font-bold tabular-nums ${delays > 0 ? "text-subway-danger" : "text-white"}`}
            >
              {delays}
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-3">
        {phase === "waiting" && (
          <>
            <div
              className={`w-12 h-12 rounded-xl flex items-center justify-center shadow-lg countdown-pulse ${countdown <= 5 ? "bg-gradient-to-br from-subway-danger to-red-700 glow-danger" : countdown <= 10 ? "bg-gradient-to-br from-subway-warning to-orange-700 glow-warning" : "bg-gradient-to-br from-subway-accent to-cyan-700"}`}
            >
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider text-right">
                列车进站
              </div>
              <div
                className={`font-display text-3xl font-bold tabular-nums ${countdownColor}`}
              >
                {countdown}s
              </div>
            </div>
          </>
        )}
        {phase === "boarding" && (
          <>
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-subway-success to-emerald-700 flex items-center justify-center shadow-lg animate-pulse">
              <Clock className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="text-slate-400 text-xs font-medium uppercase tracking-wider text-right">
                乘客上下车
              </div>
              <div className="font-display text-3xl font-bold tabular-nums text-subway-success">
                进行中
              </div>
            </div>
          </>
        )}
        {phase === "idle" && (
          <div className="text-slate-400 font-display text-lg">
            点击"开始游戏"开始疏导乘客
          </div>
        )}
        {phase === "result" && (
          <div className="text-subway-accent font-display text-lg">
            查看结算结果
          </div>
        )}
        {phase === "gameover" && (
          <div className="text-yellow-400 font-display text-lg font-bold">
            游戏结束
          </div>
        )}
      </div>
    </div>
  );
};

export default TopBar;
