import {
  X,
  Trophy,
  AlertTriangle,
  CheckCircle2,
  ArrowRight,
  RotateCcw,
} from "lucide-react";
import { useGameStore } from "@/store/gameStore";

const ResultModal = () => {
  const {
    showResultModal,
    closeResultModal,
    lastRoundResults,
    score,
    round,
    maxRounds,
    delays,
    phase,
    nextRound,
    initGame,
  } = useGameStore();

  if (!showResultModal || !lastRoundResults) return null;

  const isGameOver = phase === "gameover";
  const overloadCount = lastRoundResults.filter((r) => r.isOverloaded).length;
  const totalPenalty = lastRoundResults.reduce(
    (sum, r) => sum + r.delayPenalty,
    0,
  );
  const onTime = overloadCount === 0;

  const getGrade = () => {
    const avgScore = score / round;
    if (avgScore >= 120)
      return { grade: "S", color: "text-yellow-400", desc: "完美调度！" };
    if (avgScore >= 80)
      return { grade: "A", color: "text-subway-success", desc: "优秀调度！" };
    if (avgScore >= 50)
      return { grade: "B", color: "text-subway-accent", desc: "良好调度" };
    if (avgScore >= 20)
      return { grade: "C", color: "text-subway-warning", desc: "需要改进" };
    return { grade: "D", color: "text-subway-danger", desc: "加强练习" };
  };

  const gradeInfo = getGrade();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center modal-backdrop p-4">
      <div className="glass-panel rounded-3xl max-w-2xl w-full max-h-[90vh] overflow-y-auto shadow-2xl border border-slate-600/30">
        <div className="flex items-center justify-between px-8 pt-6 pb-4 border-b border-slate-700/50">
          <div className="flex items-center gap-3">
            {isGameOver ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-400 to-amber-600 flex items-center justify-center">
                  <Trophy className="w-6 h-6 text-slate-900" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    游戏结束
                  </h2>
                  <p className="text-slate-400 text-sm">最终结算结果</p>
                </div>
              </>
            ) : onTime ? (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-subway-success to-emerald-600 flex items-center justify-center">
                  <CheckCircle2 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    准点发车！
                  </h2>
                  <p className="text-slate-400 text-sm">
                    第 {round} 轮 · 所有车厢均未超载
                  </p>
                </div>
              </>
            ) : (
              <>
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-subway-warning to-orange-600 flex items-center justify-center">
                  <AlertTriangle className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h2 className="font-display text-2xl font-bold text-white">
                    发车延误
                  </h2>
                  <p className="text-slate-400 text-sm">
                    第 {round} 轮 · {overloadCount} 节车厢超载
                  </p>
                </div>
              </>
            )}
          </div>

          {!isGameOver && (
            <button
              onClick={closeResultModal}
              className="w-10 h-10 rounded-xl bg-slate-700/50 hover:bg-slate-600/60 text-slate-400 hover:text-white flex items-center justify-center transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          )}
        </div>

        <div className="px-8 py-6 space-y-6">
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                总得分
              </div>
              <div className="font-display text-3xl font-bold text-white tabular-nums">
                {score}
              </div>
            </div>
            <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
              <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                延误次数
              </div>
              <div
                className={`font-display text-3xl font-bold tabular-nums ${delays > 0 ? "text-subway-danger" : "text-subway-success"}`}
              >
                {delays}
              </div>
            </div>
            {isGameOver && (
              <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                  评级
                </div>
                <div
                  className={`font-display text-4xl font-bold ${gradeInfo.color}`}
                >
                  {gradeInfo.grade}
                </div>
              </div>
            )}
            {!isGameOver && (
              <div className="bg-slate-800/50 rounded-2xl p-4 text-center">
                <div className="text-slate-400 text-xs uppercase tracking-wider mb-1">
                  本轮扣分
                </div>
                <div
                  className={`font-display text-3xl font-bold tabular-nums ${totalPenalty > 0 ? "text-subway-danger" : "text-subway-success"}`}
                >
                  {totalPenalty > 0 ? `-${totalPenalty}` : `+${50}`}
                </div>
              </div>
            )}
          </div>

          {isGameOver && (
            <div className="text-center">
              <span
                className={`inline-block px-4 py-1.5 rounded-full bg-slate-800/50 text-sm font-medium ${gradeInfo.color}`}
              >
                {gradeInfo.desc}
              </span>
            </div>
          )}

          <div>
            <h3 className="text-white font-semibold mb-3 flex items-center gap-2">
              <span className="w-1 h-5 bg-subway-accent rounded-full" />
              各车厢载客情况
            </h3>
            <div className="space-y-2">
              {lastRoundResults.map((result) => {
                const ratio = result.boarded / result.capacity;
                return (
                  <div key={result.carId} className="flex items-center gap-3">
                    <div className="w-16 text-right">
                      <span className="text-slate-300 text-sm font-medium">
                        {result.carId + 1}号
                      </span>
                    </div>
                    <div className="flex-1 h-6 bg-slate-800/60 rounded-lg overflow-hidden relative">
                      <div
                        className="absolute inset-y-0 left-0 border-r-2 border-dashed border-slate-500/50"
                        style={{ width: "100%" }}
                      />
                      <div
                        className={`h-full rounded-lg transition-all duration-500 ${
                          result.isOverloaded
                            ? "bg-gradient-to-r from-subway-danger to-red-600"
                            : ratio > 0.75
                              ? "bg-gradient-to-r from-subway-warning to-orange-500"
                              : "bg-gradient-to-r from-subway-light to-subway-accent"
                        }`}
                        style={{ width: `${Math.min(ratio * 100, 120)}%` }}
                      />
                      <div className="absolute inset-0 flex items-center justify-end pr-2">
                        <span className="text-xs font-medium text-white drop-shadow">
                          {result.boarded}/{result.capacity}
                        </span>
                      </div>
                    </div>
                    {result.isOverloaded && (
                      <span className="text-subway-danger text-xs font-semibold w-20">
                        -{result.delayPenalty}分
                      </span>
                    )}
                    {!result.isOverloaded && <span className="w-20" />}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        <div className="px-8 py-5 border-t border-slate-700/50 flex items-center justify-end gap-3">
          {isGameOver ? (
            <button
              onClick={initGame}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-subway-accent to-cyan-600 text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-subway-accent/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              <RotateCcw className="w-5 h-5" />
              再来一局
            </button>
          ) : (
            <button
              onClick={nextRound}
              className="px-6 py-3 rounded-xl bg-gradient-to-r from-subway-blue to-subway-light text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-subway-light/30 transition-all hover:scale-[1.02] active:scale-[0.98]"
            >
              下一轮 ({round}/{maxRounds})
              <ArrowRight className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResultModal;
