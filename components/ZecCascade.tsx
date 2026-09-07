"use client";

import React, { useState, useEffect, useCallback } from "react";
import { Sparkles, RefreshCw, Trophy, Lock, Shield, Eye, HelpCircle, ArrowRight, CheckCircle2 } from "lucide-react";
import confetti from "canvas-confetti";


// --- ZCASH DAILY LORE WORD BANK ---
const ZCASH_WORDS = ["ZCASH", "SHIELD", "ORCHARD", "SAPLING", "PRIVACY", "HALVING"];


const GRID_SIZE = 8;
const INITIAL_MOVES = 8; // Hardcore 8-move cap


export interface Tile {
  id: string;
  shapeIndex: number;
  letter: string;
  isShielded: boolean; // True if encrypted (?) tile
  isMatched?: boolean;
}


// Deterministic hash to derive daily word
function hashStringToSeed(str: string): number {
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


  return { todayUTC, targetWord, shapeLetterMap };
}


export default function ZecCascade() {
  // --- USER & GAME STATE ---
  const [screen, setScreen] = useState<"welcome" | "playing" | "result">("welcome");
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletSubmitted, setWalletSubmitted] = useState(false);


  const [mission] = useState(() => getDailyMission());
  const [board, setBoard] = useState<Tile[][]>([]);
  const [selectedTile, setSelectedTile] = useState<{ r: number; c: number } | null>(null);
  const [movesLeft, setMovesLeft] = useState(INITIAL_MOVES);
  const [sequenceIndex, setSequenceIndex] = useState(0); // Index of next letter required in word
  const [score, setScore] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [showLeaderboard, setShowLeaderboard] = useState(false);


  const targetWord = mission.targetWord;
  const currentNeededLetter = targetWord[sequenceIndex] || "";


  // SHAPE STYLING PALETTE
  const SHAPES = [
    { bg: "bg-amber-500", border: "border-amber-300", text: "text-slate-950" },
    { bg: "bg-yellow-400", border: "border-yellow-200", text: "text-slate-950" },
    { bg: "bg-amber-400", border: "border-amber-100", text: "text-slate-950" },
    { bg: "bg-orange-500", border: "border-orange-300", text: "text-slate-950" },
    { bg: "bg-yellow-600", border: "border-yellow-300", text: "text-slate-950" },
  ];


  // --- TILE GENERATOR ---
  const generateTile = useCallback(
    (shapeIndex?: number, forceShielded = false): Tile => {
      const idx = shapeIndex !== undefined ? shapeIndex : Math.floor(Math.random() * 5);
      // 20% chance to spawn as a Shielded (?) tile unless specified
      const isShielded = forceShielded || Math.random() < 0.2;
      return {
        id: `tile-${Math.random().toString(36).substring(2, 9)}`,
        shapeIndex: idx,
        letter: mission.shapeLetterMap[idx],
        isShielded,
      };
    },
    [mission.shapeLetterMap]
  );


  // --- INITIALIZE BOARD ---
  const initBoard = useCallback(() => {
    const newBoard: Tile[][] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      const row: Tile[] = [];
      for (let c = 0; c < GRID_SIZE; c++) {
        let tile = generateTile();
        while (
          (r >= 2 && newBoard[r - 1][c].shapeIndex === tile.shapeIndex && newBoard[r - 2][c].shapeIndex === tile.shapeIndex) ||
          (c >= 2 && row[c - 1].shapeIndex === tile.shapeIndex && row[c - 2].shapeIndex === tile.shapeIndex)
        ) {
          tile = generateTile();
        }
        row.push(tile);
      }
      newBoard.push(row);
    }
    setBoard(newBoard);
  }, [generateTile]);


  useEffect(() => {
    initBoard();
  }, [initBoard]);


  // --- MATCH DETECTION ---
  const checkMatches = useCallback((currentBoard: Tile[][]) => {
    const matchedMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));


    // Rows
    for (let r = 0; r < GRID_SIZE; r++) {
      let len = 1;
      for (let c = 0; c < GRID_SIZE; c++) {
        const match = c < GRID_SIZE - 1 && currentBoard[r][c].shapeIndex === currentBoard[r][c + 1].shapeIndex;
        if (match) len++;
        else {
          if (len >= 3) {
            for (let i = 0; i < len; i++) matchedMap[r][c - i] = true;
          }
          len = 1;
        }
      }
    }


    // Columns
    for (let c = 0; c < GRID_SIZE; c++) {
      let len = 1;
      for (let r = 0; r < GRID_SIZE; r++) {
        const match = r < GRID_SIZE - 1 && currentBoard[r][c].shapeIndex === currentBoard[r + 1][c].shapeIndex;
        if (match) len++;
        else {
          if (len >= 3) {
            for (let i = 0; i < len; i++) matchedMap[r - i][c] = true;
          }
          len = 1;
        }
      }
    }


    const matches: { r: number; c: number }[] = [];
    for (let r = 0; r < GRID_SIZE; r++) {
      for (let c = 0; c < GRID_SIZE; c++) {
        if (matchedMap[r][c]) matches.push({ r, c });
      }
    }
    return matches;
  }, []);


  // --- CASCADE ENGINE LOOP ---
  const processBoard = async (startBoard: Tile[][], moves: number) => {
    setIsProcessing(true);
    let tempBoard = structuredClone(startBoard);
    let matches = checkMatches(tempBoard);
    let currentSeq = sequenceIndex;


    while (matches.length > 0) {
      // 1. Unshield adjacent tiles & process sequential matching
      matches.forEach(({ r, c }) => {
        const tile = tempBoard[r][c];


        // Unshield adjacent tiles
        const neighbors = [
          { r: r - 1, c },
          { r: r + 1, c },
          { r, c: c - 1 },
          { r, c: c + 1 },
        ];
        neighbors.forEach((n) => {
          if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE) {
            tempBoard[n.r][n.c].isShielded = false; // Decrypt adjacent
          }
        });


        // STRICT SEQUENTIAL SPELLING CHECK
        // Only collect if the tile is unshielded AND matches the EXACT current required letter
        if (!tile.isShielded && tile.letter === targetWord[currentSeq]) {
          currentSeq++;
        }


        tempBoard[r][c].isMatched = true;
      });


      setSequenceIndex(currentSeq);
      setBoard([...tempBoard]);
      await new Promise((res) => setTimeout(res, 250));


      // 2. Gravity drop refill
      for (let c = 0; c < GRID_SIZE; c++) {
        let emptySpots = 0;
        for (let r = GRID_SIZE - 1; r >= 0; r--) {
          if (tempBoard[r][c].isMatched) {
            emptySpots++;
          } else if (emptySpots > 0) {
            tempBoard[r + emptySpots][c] = tempBoard[r][c];
            tempBoard[r][c] = generateTile();
            tempBoard[r][c].isMatched = true;
          }
        }
        for (let r = 0; r < emptySpots; r++) {
          tempBoard[r][c] = generateTile();
        }
      }


      setBoard([...tempBoard]);
      await new Promise((res) => setTimeout(res, 200));


      // Re-check for chain cascades
      matches = checkMatches(tempBoard);
    }


    setIsProcessing(false);


    // WIN OR LOSS CONDITION
    if (currentSeq >= targetWord.length) {
      const finalScore = 1000 - (INITIAL_MOVES - moves) * 30;
      setScore(finalScore);
      setGameStatus("won");
      setScreen("result");
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
    } else if (moves <= 0) {
      const finalScore = Math.round((currentSeq / targetWord.length) * 400);
      setScore(finalScore);
      setGameStatus("lost");
      setScreen("result");
    }
  };


  // --- SWAP CONTROLLER ---
  const handleTileClick = async (r: number, c: number) => {
    if (isProcessing || gameStatus !== "playing") return;


    if (!selectedTile) {
      setSelectedTile({ r, c });
      return;
    }


    const { r: r1, c: c1 } = selectedTile;
    const isAdjacent = Math.abs(r1 - r) + Math.abs(c1 - c) === 1;


    if (!isAdjacent) {
      setSelectedTile({ r, c });
      return;
    }


    setSelectedTile(null);
    let nextBoard = structuredClone(board);


    // Swap
    const t1 = nextBoard[r1][c1];
    const t2 = nextBoard[r][c];
    nextBoard[r1][c1] = t2;
    nextBoard[r][c] = t1;


    const matches = checkMatches(nextBoard);


    if (matches.length > 0) {
      const remainingMoves = movesLeft - 1;
      setMovesLeft(remainingMoves);
      await processBoard(nextBoard, remainingMoves);
    } else {
      setBoard([...board]); // Revert invalid swap
    }
  };


  // --- SCREEN 1: WELCOME & USERNAME ENTRY ---
  if (screen === "welcome") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 text-slate-100 font-sans">
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md">
          <div className="w-14 h-14 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-3 text-slate-950 font-black shadow-lg shadow-amber-500/20">
            🛡️
          </div>
          <h1 className="text-2xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 uppercase tracking-wider mb-1">
            ZCade
          </h1>
          <p className="text-xs text-amber-500/80 font-bold tracking-widest uppercase mb-6">Community Contest</p>


          <div className="space-y-4 text-left mb-6">
            <label className="block text-xs uppercase font-bold text-slate-400">Enter Your Handle / Nickname</label>
            <input
              type="text"
              placeholder="e.g. @cypher_jack"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-amber-500/30 text-slate-100 placeholder-slate-600 font-bold focus:outline-none focus:border-amber-400 transition-all text-center"
            />
            <p className="text-[11px] text-slate-500 text-center">No wallet required to play. Submit payout address if you win!</p>
          </div>


          <button
            onClick={() => username.trim() && setScreen("playing")}
            disabled={!username.trim()}
            className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
          >
            Start Today's Mission <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }


  // --- SCREEN 3: GAME RESULTS & OPTIONAL WALLET ENTRY ---
  if (screen === "result") {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 text-slate-100 font-sans">
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl backdrop-blur-md">
          {gameStatus === "won" ? (
            <>
              <Sparkles className="w-14 h-14 text-amber-400 mx-auto mb-2 animate-bounce" />
              <h2 className="text-2xl font-black text-amber-300 uppercase tracking-wide">Mission Complete!</h2>
              <p className="text-xs text-slate-300 mt-1">Word Decrypted in Sequential Order!</p>
            </>
          ) : (
            <>
              <Lock className="w-14 h-14 text-red-500 mx-auto mb-2" />
              <h2 className="text-2xl font-black text-red-400 uppercase tracking-wide">Out of Moves!</h2>
              <p className="text-xs text-slate-400 mt-1">Sequential decryption takes strategy.</p>
            </>
          )}


          {/* SCORE CARD */}
          <div className="my-5 p-4 bg-slate-950 border border-amber-500/20 rounded-xl">
            <span className="text-xs text-slate-500 uppercase font-bold block">Final Contest Score</span>
            <span className="text-4xl font-black text-yellow-400">{score} PTS</span>
          </div>


          {/* OPTIONAL WALLET ADDRESS INPUT FOR WINNERS */}
          <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/20 text-left mb-6">
            <h4 className="text-xs font-black text-amber-400 uppercase mb-1 flex items-center gap-1.5">
              <Shield className="w-4 h-4 text-amber-400" /> Zcash Shielded Payout Address
            </h4>
            <p className="text-[11px] text-slate-400 mb-3">Optional: Enter your ZEC address (`zs1...` or `u1...`) for prize distribution.</p>


            {walletSubmitted ? (
              <div className="flex items-center gap-2 p-2.5 bg-amber-500/10 border border-amber-400/40 rounded-lg text-amber-300 text-xs font-bold">
                <CheckCircle2 className="w-4 h-4 text-amber-400" /> Address Locked for Weekly Payout
              </div>
            ) : (
              <div className="flex gap-2">
                <input
                  type="text"
                  placeholder="zs1... or u1..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="flex-1 px-3 py-2 rounded-lg bg-slate-950 border border-slate-800 text-xs text-slate-200 placeholder-slate-600 focus:outline-none focus:border-amber-400 font-mono"
                />
                <button
                  onClick={() => walletAddress.trim() && setWalletSubmitted(true)}
                  disabled={!walletAddress.trim()}
                  className="px-3 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs disabled:opacity-50 transition-all"
                >
                  Save
                </button>
              </div>
            )}
          </div>


          <div className="space-y-2">
            <button
              onClick={() => setShowLeaderboard(true)}
              className="w-full py-3 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-400 font-bold text-sm flex items-center justify-center gap-2"
            >
              <Trophy className="w-4 h-4" /> View Weekly Leaderboard
            </button>
            <button
              onClick={() => {
                setScreen("welcome");
                setGameStatus("playing");
                setSequenceIndex(0);
                setMovesLeft(INITIAL_MOVES);
                initBoard();
              }}
              className="w-full py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm"
            >
              Back to Home
            </button>
          </div>
        </div>
      </div>
    );
  }


  // --- SCREEN 2: ACTIVE GAMEPLAY ---
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans p-4">
      {/* HEADER */}
      <header className="w-full max-w-md flex items-center justify-between mb-3 border-b border-amber-500/20 pb-2">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-xs">
            🛡️
          </div>
          <div>
            <h1 className="text-base font-black text-amber-400 uppercase tracking-wider">ZCade</h1>
            <p className="text-[10px] text-slate-400">Player: <span className="text-amber-400 font-bold">{username}</span></p>
          </div>
        </div>
        <button
          onClick={() => setShowLeaderboard(true)}
          className="p-2 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-400 flex items-center gap-1 text-xs font-bold"
        >
          <Trophy className="w-3.5 h-3.5" /> Rank
        </button>
      </header>


      {/* DASHBOARD PANEL */}
      <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 mb-3 shadow-xl">
        <div className="flex justify-between items-center mb-3">
          <div>
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Target Word</span>
            <span className="text-2xl font-black tracking-widest text-amber-400">{targetWord}</span>
          </div>
          <div className="text-right">
            <span className="text-[10px] uppercase tracking-wider text-slate-400 font-bold block">Moves Left</span>
            <span className={`text-2xl font-black ${movesLeft <= 3 ? "text-red-500 animate-pulse" : "text-slate-100"}`}>
              {movesLeft}
            </span>
          </div>
        </div>


        {/* SEQUENTIAL PROGRESS SPELLER */}
        <div className="pt-2 border-t border-slate-800">
          <span className="text-[10px] text-slate-400 uppercase font-bold block mb-1.5">
            Sequential Decryption: <span className="text-amber-400">Must collect '{currentNeededLetter}' next</span>
          </span>
          <div className="flex gap-1.5 justify-between">
            {targetWord.split("").map((letter, idx) => {
              const isCollected = idx < sequenceIndex;
              const isCurrentTarget = idx === sequenceIndex;
              return (
                <div
                  key={idx}
                  className={`flex-1 py-1.5 rounded-lg border text-center font-black transition-all ${
                    isCollected
                      ? "bg-amber-500/20 border-amber-400 text-amber-300"
                      : isCurrentTarget
                      ? "bg-amber-500 border-yellow-300 text-slate-950 animate-pulse"
                      : "bg-slate-950 border-slate-800 text-slate-600"
                  }`}
                >
                  <span className="text-xs">{letter}</span>
                </div>
              );
            })}
          </div>
        </div>
      </div>


      {/* GAME BOARD */}
      <div className="relative w-full max-w-md aspect-square bg-slate-900/50 p-2 rounded-2xl border border-amber-500/20 shadow-2xl">
        <div className="grid grid-cols-8 gap-1 w-full h-full">
          {board.map((row, r) =>
            row.map((tile, c) => {
              const shape = SHAPES[tile.shapeIndex];
              const isSelected = selectedTile?.r === r && selectedTile?.c === c;


              return (
                <button
                  key={tile.id}
                  onClick={() => handleTileClick(r, c)}
                  disabled={isProcessing || gameStatus !== "playing"}
                  className={`relative flex items-center justify-center rounded-xl font-black transition-all duration-150 border-2 shadow-md ${
                    tile.isShielded ? "bg-slate-950 border-slate-800 text-amber-500/40" : `${shape.bg} ${shape.border} ${shape.text}`
                  } ${isSelected ? "ring-4 ring-yellow-300 scale-105 z-10" : "hover:brightness-110"} ${
                    tile.isMatched ? "scale-0 opacity-0" : "scale-100 opacity-100"
                  }`}
                >
                  {/* SHIELDED (?) VS DECRYPTED LETTER */}
                  {tile.isShielded ? (
                    <span className="text-base font-mono font-bold select-none text-slate-600">?</span>
                  ) : (
                    <span className="text-lg md:text-xl drop-shadow-md select-none">{tile.letter}</span>
                  )}
                </button>
              );
            })
          )}
        </div>
      </div>


      {/* STRATEGY FOOTER */}
      <footer className="w-full max-w-md mt-3 p-2.5 bg-slate-900/50 border border-amber-500/10 rounded-xl text-center">
        <p className="text-[11px] text-amber-400/80 font-medium flex items-center justify-center gap-1.5">
          <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
          <span>Match next to '?' tiles to decrypt letters. Collect in exact sequence!</span>
        </p>
      </footer>


      {/* LEADERBOARD MODAL OVERLAY */}
      {showLeaderboard && (
        <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                <Trophy className="w-4 h-4" /> Community Leaderboard
              </h3>
              <button onClick={() => setShowLeaderboard(false)} className="text-slate-400 hover:text-slate-100 font-bold text-sm">
                ✕
              </button>
            </div>


            <div className="space-y-2 mb-6">
              {[
                { rank: 1, name: "ZcashWhale", score: 970 },
                { rank: 2, name: username || "Player", score: score || 850 },
                { rank: 3, name: "ShieldedNode", score: 810 },
                { rank: 4, name: "SatoshiZ", score: 780 },
              ].map((item) => (
                <div key={item.rank} className="flex justify-between items-center p-2.5 rounded-xl bg-slate-950 border border-slate-800">
                  <span className="text-xs font-bold text-slate-300">
                    #{item.rank} {item.name}
                  </span>
                  <span className="font-black text-yellow-400 text-xs">{item.score} pts</span>
                </div>
              ))}
            </div>


            <button
              onClick={() => setShowLeaderboard(false)}
              className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 text-xs"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
}