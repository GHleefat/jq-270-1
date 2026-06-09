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
  OVERLOAD_PENALTY,
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
      const minShare = Math.max(
        2,
        Math.floor((basePassengers / CAR_COUNT) * 0.3),
      );
      const maxShare = Math.floor((basePassengers / CAR_COUNT) * 2.5);
      const share =
        Math.floor(Math.random() * (maxShare - minShare + 1)) + minShare;
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
  let totalToRedistribute = 0;
  const reductions: { carId: number; amount: number }[] = [];

  result.forEach((car) => {
    if (car.guides > 0 && car.waitingPassengers > 0) {
      const reduction = Math.min(
        car.waitingPassengers,
        Math.floor(car.waitingPassengers * GUIDE_REDUCTION_RATE * car.guides),
      );
      if (reduction > 0) {
        reductions.push({ carId: car.id, amount: reduction });
        totalToRedistribute += reduction;
      }
    }
  });

  if (totalToRedistribute === 0) return result;

  reductions.forEach(({ carId, amount }) => {
    const idx = result.findIndex((c) => c.id === carId);
    result[idx] = {
      ...result[idx],
      waitingPassengers: result[idx].waitingPassengers - amount,
    };
  });

  const targetCars = result
    .filter((c) => c.guides === 0 || reductions.every((r) => r.carId !== c.id))
    .sort((a, b) => a.waitingPassengers - b.waitingPassengers);

  if (targetCars.length === 0) return result;

  const totalWaitingSpace = targetCars.reduce(
    (sum, c) => sum + Math.max(0, c.capacity - c.waitingPassengers),
    0,
  );

  let remaining = totalToRedistribute;

  if (totalWaitingSpace > 0) {
    targetCars.forEach((target) => {
      if (remaining <= 0) return;
      const availableSlot = Math.max(
        0,
        target.capacity - target.waitingPassengers,
      );
      if (availableSlot <= 0) return;

      const share = Math.min(
        availableSlot,
        Math.ceil((totalToRedistribute * availableSlot) / totalWaitingSpace),
      );
      const actualShare = Math.min(share, remaining);

      const idx = result.findIndex((c) => c.id === target.id);
      result[idx] = {
        ...result[idx],
        waitingPassengers: result[idx].waitingPassengers + actualShare,
      };
      remaining -= actualShare;
    });
  }

  if (remaining > 0) {
    targetCars.forEach((target) => {
      if (remaining <= 0) return;
      const perCar = Math.ceil(remaining / targetCars.length);
      const actual = Math.min(perCar, remaining);
      const idx = result.findIndex((c) => c.id === target.id);
      result[idx] = {
        ...result[idx],
        waitingPassengers: result[idx].waitingPassengers + actual,
      };
      remaining -= actual;
    });
  }

  return result;
};

const redistributeOverflow = (cars: Car[]): Car[] => {
  let overflowCars = cars.filter((c) => c.waitingPassengers > c.capacity);
  const underflowCars = cars.filter((c) => c.waitingPassengers < c.capacity);

  if (overflowCars.length === 0 || underflowCars.length === 0) return cars;

  const result = [...cars];

  overflowCars.forEach((overflowCar) => {
    const overflow = overflowCar.waitingPassengers - overflowCar.capacity;
    if (overflow <= 0) return;

    let toRedistribute = overflow;
    const availableSlots = underflowCars.reduce(
      (sum, c) => sum + (c.capacity - c.waitingPassengers),
      0,
    );

    if (availableSlots <= 0) return;

    underflowCars.forEach((underCar) => {
      const slot = underCar.capacity - underCar.waitingPassengers;
      if (slot <= 0 || toRedistribute <= 0) return;

      const share = Math.min(
        slot,
        Math.ceil((overflow * slot) / availableSlots),
      );
      const actualShare = Math.min(share, toRedistribute);

      const overflowIdx = result.findIndex((c) => c.id === overflowCar.id);
      const underIdx = result.findIndex((c) => c.id === underCar.id);

      result[overflowIdx] = {
        ...result[overflowIdx],
        waitingPassengers: result[overflowIdx].waitingPassengers - actualShare,
      };
      result[underIdx] = {
        ...result[underIdx],
        waitingPassengers: result[underIdx].waitingPassengers + actualShare,
      };

      toRedistribute -= actualShare;
    });
  });

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
      g.id === guideId ? { ...g, isDeployed: true, deployedCarId: carId } : g,
    );
    const newCars = state.cars.map((c) =>
      c.id === carId ? { ...c, guides: c.guides + 1 } : c,
    );

    let finalCars = applyGuideEffect(newCars);
    finalCars = redistributeOverflow(finalCars);

    set({ guides: newGuides, cars: finalCars });
  },

  recallGuide: (guideId: number) => {
    const state = get();
    if (state.phase !== "waiting") return;

    const guide = state.guides.find((g) => g.id === guideId);
    if (!guide || !guide.isDeployed || guide.deployedCarId === null) return;

    const carId = guide.deployedCarId;
    const newGuides = state.guides.map((g) =>
      g.id === guideId ? { ...g, isDeployed: false, deployedCarId: null } : g,
    );
    const newCars = state.cars.map((c) =>
      c.id === carId ? { ...c, guides: Math.max(0, c.guides - 1) } : c,
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
    const carsWithFinal = state.cars.map((car) => ({
      ...car,
      finalBoarded: Math.min(car.waitingPassengers, car.capacity + 5),
    }));
    set({
      phase: "boarding",
      trainVisible: true,
      countdown: 3,
      boardingProgress: 0,
      cars: carsWithFinal,
    });
  },

  tickBoarding: () => {
    const state = get();
    if (state.phase !== "boarding") return;

    const newProgress = state.boardingProgress + 10;

    if (newProgress >= 100) {
      const updatedCars = state.cars.map((car) => ({
        ...car,
        boardedPassengers: car.finalBoarded ?? car.waitingPassengers,
        waitingPassengers: 0,
        finalBoarded: undefined,
      }));
      set({ cars: updatedCars, boardingProgress: 100 });
      get().calculateResults();
    } else {
      const updatedCars = state.cars.map((car) => {
        const totalBoarded = car.finalBoarded ?? 0;
        const totalWaiting = car.waitingPassengers + car.boardedPassengers;
        const currentBoarded = Math.floor(totalBoarded * (newProgress / 100));
        const currentWaiting = Math.max(0, totalWaiting - currentBoarded);
        return {
          ...car,
          boardedPassengers: currentBoarded,
          waitingPassengers: currentWaiting,
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
      const delayPenalty = isOverloaded
        ? Math.ceil((boarded - car.capacity) * 10)
        : 0;

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
      c.id === carId
        ? { ...c, waitingPassengers: c.waitingPassengers + count }
        : c,
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
