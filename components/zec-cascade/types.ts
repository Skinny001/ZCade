export interface Tile {
  id: string;
  shapeIndex: number;
  letter: string;
  isShielded: boolean;
  isMatched?: boolean;
}


export interface LeaderboardEntry {
  name: string;
  score: number;
  moves: number;
  earliestCompletion?: string;
  zcashAddress?: string;
}


export type ScreenState = "welcome" | "playing" | "result" | "gate";