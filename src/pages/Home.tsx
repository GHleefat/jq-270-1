import { useEffect } from "react";
import { Play, RotateCcw, Train } from "lucide-react";
import { useGameStore } from "@/store/gameStore";
import TopBar from "@/components/TopBar";
import Platform from "@/components/Platform";
import GuidePanel from "@/components/GuidePanel";
import ResultModal from "@/components/ResultModal";

const Home = () => {
  const { phase, initGame, startRound } = useGameStore();

  useEffect(() => {
    initGame();
  }, [initGame]);

  return (
    <div className="min-h-screen text-white">
      <div className="max-w-7xl mx-auto px-6 py-6">
        <header className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-subway-blue via-subway-light to-subway-accent flex items-center justify-center shadow-lg shadow-subway-light/30">
              <Train className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-display text-2xl font-bold tracking-tight">
                地铁高峰疏导员
              </h1>
              <p className="text-slate-400 text-sm">Subway Peak Dispatcher</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {phase !== "idle" && (
              <button
                onClick={initGame}
                className="px-5 py-2.5 rounded-xl bg-slate-700/60 hover:bg-slate-600/70 text-slate-200 font-medium flex items-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] border border-slate-600/40"
              >
                <RotateCcw className="w-4 h-4" />
                重新开始
              </button>
            )}
            {phase === "idle" && (
              <button
                onClick={startRound}
                className="px-8 py-3 rounded-xl bg-gradient-to-r from-subway-accent to-cyan-500 text-white font-semibold flex items-center gap-2 hover:shadow-lg hover:shadow-subway-accent/40 transition-all hover:scale-[1.03] active:scale-[0.98]"
              >
                <Play className="w-5 h-5 fill-current" />
                开始游戏
              </button>
            )}
          </div>
        </header>

        <TopBar />

        <div className="my-6">
          <Platform />
        </div>

        <GuidePanel />

        {phase === "idle" && (
          <div className="mt-8 glass-panel rounded-2xl p-6">
            <h3 className="font-display text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="w-1 h-5 bg-subway-accent rounded-full" />
              游戏说明
            </h3>
            <div className="grid grid-cols-2 gap-6 text-sm">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-subway-blue/30 flex items-center justify-center text-subway-light font-bold text-sm flex-shrink-0">
                    1
                  </div>
                  <div>
                    <div className="text-white font-medium">观察候车区密度</div>
                    <div className="text-slate-400">
                      乘客会随机聚集在不同车厢门口，颜色越深表示越拥挤
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-subway-blue/30 flex items-center justify-center text-subway-light font-bold text-sm flex-shrink-0">
                    2
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      拖拽疏导员到拥堵区域
                    </div>
                    <div className="text-slate-400">
                      疏导员可以引导乘客分散到其他车厢，降低该区密度
                    </div>
                  </div>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-subway-blue/30 flex items-center justify-center text-subway-light font-bold text-sm flex-shrink-0">
                    3
                  </div>
                  <div>
                    <div className="text-white font-medium">
                      列车到站前完成部署
                    </div>
                    <div className="text-slate-400">
                      倒计时结束后列车进站，乘客开始上车
                    </div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-7 h-7 rounded-lg bg-subway-blue/30 flex items-center justify-center text-subway-light font-bold text-sm flex-shrink-0">
                    4
                  </div>
                  <div>
                    <div className="text-white font-medium">避免车厢超载</div>
                    <div className="text-slate-400">
                      超载车厢会延误发车并扣分，所有车厢准点可获得奖励
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      <ResultModal />
    </div>
  );
};

export default Home;
