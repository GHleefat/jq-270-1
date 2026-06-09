export interface Car {
  id: number;
  capacity: number;
  waitingPassengers: number;
  boardedPassengers: number;
  guides: number;
  finalBoarded?: number;
}

export interface Guide {
  id: number;
  isDeployed: boolean;
  deployedCarId: number | null;
}

export type GamePhase = "idle" | "waiting" | "boarding" | "result" | "gameover";

export interface RoundResult {
  carId: number;
  boarded: number;
  capacity: number;
  isOverloaded: boolean;
  delayPenalty: number;
}

export interface GameState {
  score: number;
  level: number;
  round: number;
  maxRounds: number;
  countdown: number;
  phase: GamePhase;
  delays: number;
  cars: Car[];
  guides: Guide[];
  totalGuides: number;
  lastRoundResults: RoundResult[] | null;
  trainVisible: boolean;
  showResultModal: boolean;
  boardingProgress: number;

  initGame: () => void;
  startRound: () => void;
  deployGuide: (guideId: number, carId: number) => void;
  recallGuide: (guideId: number) => void;
  tickCountdown: () => void;
  triggerBoarding: () => void;
  tickBoarding: () => void;
  calculateResults: () => void;
  nextRound: () => void;
  closeResultModal: () => void;
  addPassengers: (carId: number, count: number) => void;
  redistributePassengers: () => void;
}

export const CAR_COUNT = 6;
export const CAR_CAPACITY = 40;
export const TOTAL_GUIDES = 4;
export const WAITING_TIME = 30;
export const MAX_ROUNDS = 5;
export const GUIDE_REDUCTION_RATE = 0.25;
export const OVERLOAD_PENALTY = 100;
export const ON_TIME_BONUS = 50;
