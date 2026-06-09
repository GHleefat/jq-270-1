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
  return cars.map((car) => {
    if (car.guides > 0 && car.waitingPassengers > 0) {
      const reduction = Math.min(
        car.waitingPassengers,
        Math.floor(car.waitingPassengers * GUIDE_REDUCTION_RATE * car.guides),
      );
      return {
        ...car,
        waitingPassengers: car.waitingPassengers - reduction,
      };
    }
    return car;
  });
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
    set({ phase: "boarding", trainVisible: true, countdown: 3 });
  },

  calculateResults: () => {
    const state = get();
    let totalPenalty = 0;
    let totalBonus = 0;
    const results: RoundResult[] = [];
    let overloadCount = 0;

    state.cars.forEach((car) => {
      const boarded = Math.min(car.waitingPassengers, car.capacity + 5);
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

    const updatedCars = state.cars.map((car, i) => ({
      ...car,
      boardedPassengers: results[i].boarded,
      waitingPassengers: 0,
    }));

    set({
      score: Math.max(0, state.score + roundScore),
      delays: state.delays + overloadCount,
      cars: updatedCars,
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
