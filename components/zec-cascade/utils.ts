import { createClient } from "@supabase/supabase-js";


const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "";
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "";
export const supabase = createClient(supabaseUrl, supabaseAnonKey);


// Large static word list (~80 words = ~1.5 years of daily words)
export const ZCASH_WORDS = [
  "ZCASH", "SHIELD", "ORCHARD", "SAPLING", "PRIVACY", "HALVING",
  "ZEC", "ZECPAGE", "ZECWALLET", "NIGHTHAWK", "UNIFIED", "ADDRESS",
  "VIEWING", "SPENDING", "MEMO", "OUTPUT", "INPUT", "NULLIFIER",
  "COMMITMENT", "NOTE", "TREE", "ROOT", "ANCHOR", "MERKLE",
  "PROOF", "VERIFY", "SNARK", "GROTH", "MARLIN", "PLONK",
  "HUSH", "ANON", "MASK", "VEIL", "CLOAK", "SHADOW",
  "GHOST", "PHANTOM", "SPECTER", "WHISPER", "SILENCE", "NOISE",
  "ECC", "ZFND", "GRANT", "MAJOR", "MINOR", "PATCH",
  "TESTNET", "MAINNET", "REGTEST", "DEVNET", "STAGENET",
  "ALICE", "BOB", "CAROL", "DAVE", "ERIN", "FRANK",
  "GRACE", "HEIDI", "IVAN", "JUDY", "MALLORY", "OSCAR",
  "PEGGY", "QUENTIN", "RUPERT", "SYBIL", "TRENT", "VICTOR",
  "WALTER", "XAVIER", "YVONNE", "ZARA"
];


export const GRID_SIZE = 8;
// Kept for backward compatibility - use mission.initialMoves instead
export const INITIAL_MOVES = 8;


export const SHAPES = [
  { bg: "bg-amber-500", border: "border-amber-300", text: "text-slate-950" },
  { bg: "bg-yellow-400", border: "border-yellow-200", text: "text-slate-950" },
  { bg: "bg-amber-400", border: "border-amber-100", text: "text-slate-950" },
  { bg: "bg-orange-500", border: "border-orange-300", text: "text-slate-950" },
  { bg: "bg-yellow-600", border: "border-yellow-300", text: "text-slate-950" },
];


// Dynamic moves formula: unique letters + 3 buffer
// ZCASH (5 unique) → 8 moves
// SHIELD/HALVING/ORCHARD (6 unique) → 9 moves
// SAPLING/PRIVACY (6 unique) → 9 moves
export function getMovesForWord(word: string): number {
  const uniqueLetters = new Set(word).size;
  return uniqueLetters + 3;
}


export function hashStringToSeed(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (hash << 5) - hash + str.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}


export function getDailyMission() {
  const todayUTC = new Date().toISOString().split("T")[0];
  const seed = hashStringToSeed("zec-lore-" + todayUTC);
  const targetWord = ZCASH_WORDS[seed % ZCASH_WORDS.length];
  const uniqueLetters = Array.from(new Set(targetWord.split("")));


  const FILLER_LETTERS = ["X", "Y", "Q", "W", "V", "K"];
  const shapeLetterMap: string[] = [];


  for (let i = 0; i < 5; i++) {
    if (i < uniqueLetters.length) {
      shapeLetterMap.push(uniqueLetters[i]);
    } else {
      shapeLetterMap.push(FILLER_LETTERS[i - uniqueLetters.length]);
    }
  }


  const initialMoves = getMovesForWord(targetWord);


  return { todayUTC, targetWord, shapeLetterMap, initialMoves };
}


export function getUTCResetCountdown(): string {
  const now = new Date();
  const nextUTC = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1));
  const diffMs = nextUTC.getTime() - now.getTime();


  const hours = Math.floor(diffMs / (1000 * 60 * 60)).toString().padStart(2, "0");
  const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60)).toString().padStart(2, "0");
  const seconds = Math.floor((diffMs % (1000 * 60)) / 1000).toString().padStart(2, "0");


  return `${hours}h ${minutes}m ${seconds}s`;
}