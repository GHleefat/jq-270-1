import { create } from "zustand";
import {
  GameState,
  Car,
  Guide,
  RoundResult,
  CAR_COUNT,
  CAR_CAPACITY,
  TOTAL_GUIDES,
  WAITING_TIME,
  MAX_ROUNDS,
  GUIDE_REDUCTION_RATE,
  ON_TIME_BONUS,
} from "@/types/game";

const createInitialCars = (): Car[] => {
  return Array.from({ length: CAR_COUNT }, (_, i) => ({
    id: i,
    capacity: CAR_CAPACITY,
    waitingPassengers: 0,
    boardedPassengers: 0,
    guides: 0,
  }));
};

const createInitialGuides = (): Guide[] => {
  return Array.from({ length: TOTAL_GUIDES }, (_, i) => ({
    id: i,
    isDeployed: false,
    deployedCarId: null,
  }));
};

const generateRandomPassengers = (level: number): number[] => {
  const basePassengers = 20 + level * 8;
  const result: number[] = [];
  let remaining = basePassengers;

  for (let i = 0; i < CAR_COUNT; i++) {
    if (i === CAR_COUNT - 1) {
      result.push(remaining);
    } else {
      const minShare = Math.max(2, Math.floor((basePassengers / CAR_COUNT) * 0.3));
      const maxShare = Math.floor((basePassengers / CAR_COUNT) * 2.5);
      const share = Math.floor(Math.random() * (maxShare - minShare + 1)) + minShare;
      const actual = Math.min(share, remaining);
      result.push(actual);
      remaining -= actual;
    }
  }

  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }

  return result;
};

const applyGuideEffect = (cars: Car[]): Car[] => {
  const result = cars.map((c) => ({ ...c }));
  const sourceCarIds: number[] = [];
  let totalToMove = 0;

  for (let i = 0; i < result.length; i++) {
    const car = result[i];
    if (car.guides > 0 && car.waitingPassengers > 0) {
      const moveCount = Math.min(
        car.waitingPassengers,
        Math.max(1, Math.floor(car.waitingPassengers * GUIDE_REDUCTION_RATE * car.guides))
      );
      if (moveCount > 0) {
        sourceCarIds.push(car.id);
        totalToMove += moveCount;
        result[i] = { ...car, waitingPassengers: car.waitingPassengers - moveCount };
      }
    }
  }

  if (totalToMove === 0) return result;

  const targetCars = result
    .filter((c) => !sourceCarIds.includes(c.id))
    .sort((a, b) => a.waitingPassengers - b.waitingPassengers);

  const targets = targetCars.length > 0 ? targetCars : result.sort((a, b) => a.waitingPassengers - b.waitingPassengers);

  let remaining = totalToMove;
  let idx = 0;
  while (remaining > 0 && idx < 10000) {
    const target = targets[idx % targets.length];
    const carIdx = result.findIndex((c) => c.id === target.id);
    result[carIdx] = {
      ...result[carIdx],
      waitingPassengers: result[carIdx].waitingPassengers + 1,
    };
    remaining--;
    idx++;
  }

  return result;
};

const redistributeOverflow = (cars: Car[]): Car[] => {
  const result = cars.map((c) => ({ ...c }));

  for (let iter = 0; iter < 10; iter++) {
    let changed = false;
    for (let i = 0; i < result.length; i++) {
      if (result[i].waitingPassengers > result[i].capacity) {
        const overflow = result[i].waitingPassengers - result[i].capacity;
        const underflowCars = result
          .map((c, idx) => ({ car: c, idx }))
          .filter(({ car }) => car.waitingPassengers < car.capacity && car.id !== result[i].id)
          .sort((a, b) => a.car.waitingPassengers - b.car.waitingPassengers);

        if (underflowCars.length === 0) continue;

        let toMove = overflow;
        let ui = 0;
        while (toMove > 0 && ui < underflowCars.length) {
          const { car: underCar, idx: underIdx } = underflowCars[ui];
          const slot = underCar.capacity - underCar.waitingPassengers;
          if (slot > 0) {
            const move = Math.min(1, slot, toMove);
            result[i] = { ...result[i], waitingPassengers: result[i].waitingPassengers - move };
            result[underIdx] = { ...result[underIdx], waitingPassengers: result[underIdx].waitingPassengers + move };
            toMove -= move;
            changed = true;
          }
          ui++;
        }
      }
    }
    if (!changed) break;
  }

  return result;
};

export const useGameStore = create<GameState>((set, get) => ({
  score: 0,
  level: 1,
  round: 0,
  maxRounds: MAX_ROUNDS,
  countdown: WAITING_TIME,
  phase: "idle",
  delays: 0,
  cars: createInitialCars(),
  guides: createInitialGuides(),
  totalGuides: TOTAL_GUIDES,
  lastRoundResults: null,
  trainVisible: false,
  showResultModal: false,
  boardingProgress: 0,

  initGame: () => {
    set({
      score: 0,
      level: 1,
      round: 0,
      countdown: WAITING_TIME,
      phase: "idle",
      delays: 0,
      cars: createInitialCars(),
      guides: createInitialGuides(),
      lastRoundResults: null,
      trainVisible: false,
      showResultModal: false,
      boardingProgress: 0,
    });
  },

  startRound: () => {
    const state = get();
    const passengers = generateRandomPassengers(state.level);
    const newCars = state.cars.map((car, i) => ({
      ...car,
      waitingPassengers: passengers[i],
      boardedPassengers: 0,
      guides: 0,
      initialWaiting: undefined,
      finalBoarded: undefined,
    }));
    const resetGuides = createInitialGuides();

    set({
      cars: newCars,
      guides: resetGuides,
      countdown: WAITING_TIME,
      phase: "waiting",
      round: state.round + 1,
      trainVisible: false,
      lastRoundResults: null,
      showResultModal: false,
      boardingProgress: 0,
    });
  },

  deployGuide: (guideId: number, carId: number) => {
    const state = get();
    if (state.phase !== "waiting") return;

    const guide = state.guides.find((g) => g.id === guideId);
    if (!guide || guide.isDeployed) return;

    const newGuides = state.guides.map((g) =>
      g.id === guideId ? { ...g, isDeployed: true, deployedCarId: carId } : g
    );
    let newCars = state.cars.map((c) =>
      c.id === carId ? { ...c, guides: c.guides + 1 } : c
    );

    newCars = applyGuideEffect(newCars);
    newCars = redistributeOverflow(newCars);

    set({ guides: newGuides, cars: newCars });
  },

  recallGuide: (guideId: number) => {
    const state = get();
    if (state.phase !== "waiting") return;

    const guide = state.guides.find((g) => g.id === guideId);
    if (!guide || !guide.isDeployed || guide.deployedCarId === null) return;

    const carId = guide.deployedCarId;
    const newGuides = state.guides.map((g) =>
      g.id === guideId ? { ...g, isDeployed: false, deployedCarId: null } : g
    );
    const newCars = state.cars.map((c) =>
      c.id === carId ? { ...c, guides: Math.max(0, c.guides - 1) } : c
    );

    set({ guides: newGuides, cars: newCars });
  },

  tickCountdown: () => {
    const state = get();
    if (state.phase !== "waiting") return;

    const newCountdown = state.countdown - 1;
    if (newCountdown <= 0) {
      get().triggerBoarding();
    } else {
      set({ countdown: newCountdown });
    }
  },

  triggerBoarding: () => {
    const state = get();
    const carsWithInitial = state.cars.map((car) => ({
      ...car,
      initialWaiting: car.waitingPassengers,
      finalBoarded: Math.min(car.waitingPassengers, car.capacity + 5),
      boardedPassengers: 0,
    }));
    set({
      phase: "boarding",
      trainVisible: true,
      countdown: 3,
      boardingProgress: 0,
      cars: carsWithInitial,
    });
  },

  tickBoarding: () => {
    const state = get();
    if (state.phase !== "boarding") return;

    const step = 10;
    const newProgress = Math.min(state.boardingProgress + step, 100);

    if (newProgress >= 100) {
      const finalCars = state.cars.map((car) => ({
        ...car,
        boardedPassengers: car.finalBoarded ?? car.boardedPassengers,
        waitingPassengers: 0,
        initialWaiting: undefined,
        finalBoarded: undefined,
      }));
      set({ cars: finalCars, boardingProgress: 100 });
      setTimeout(() => {
        get().calculateResults();
      }, 400);
    } else {
      const updatedCars = state.cars.map((car) => {
        const init = car.initialWaiting ?? car.waitingPassengers;
        const final = car.finalBoarded ?? car.boardedPassengers;
        const boarded = Math.floor(final * (newProgress / 100));
        const waiting = Math.max(0, init - boarded);
        return {
          ...car,
          boardedPassengers: boarded,
          waitingPassengers: waiting,
        };
      });
      set({ cars: updatedCars, boardingProgress: newProgress });
    }
  },

  calculateResults: () => {
    const state = get();
    let totalPenalty = 0;
    let totalBonus = 0;
    const results: RoundResult[] = [];
    let overloadCount = 0;

    state.cars.forEach((car) => {
      const boarded = car.boardedPassengers;
      const isOverloaded = boarded > car.capacity;
      const delayPenalty = isOverloaded ? Math.ceil((boarded - car.capacity) * 10) : 0;

      if (isOverloaded) {
        overloadCount++;
        totalPenalty += delayPenalty;
      }

      results.push({
        carId: car.id,
        boarded,
        capacity: car.capacity,
        isOverloaded,
        delayPenalty,
      });
    });

    if (overloadCount === 0) {
      totalBonus = ON_TIME_BONUS + state.level * 10;
    }

    const roundScore = totalBonus - totalPenalty;
    const isGameOver = state.round >= state.maxRounds;

    set({
      score: Math.max(0, state.score + roundScore),
      delays: state.delays + overloadCount,
      lastRoundResults: results,
      phase: isGameOver ? "gameover" : "result",
      showResultModal: true,
    });
  },

  nextRound: () => {
    const state = get();
    const newLevel = state.round % 2 === 0 ? state.level + 1 : state.level;
    set({ level: newLevel, trainVisible: false, showResultModal: false });
    get().startRound();
  },

  closeResultModal: () => {
    set({ showResultModal: false });
  },

  addPassengers: (carId: number, count: number) => {
    const state = get();
    if (state.phase !== "waiting") return;

    let newCars = state.cars.map((c) =>
      c.id === carId ? { ...c, waitingPassengers: c.waitingPassengers + count } : c
    );
    newCars = redistributeOverflow(newCars);

    set({ cars: newCars });
  },

  redistributePassengers: () => {
    const state = get();
    const newCars = redistributeOverflow(state.cars);
    set({ cars: newCars });
  },
}));
