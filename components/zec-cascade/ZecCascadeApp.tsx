"use client";


import React, { useState, useEffect, useCallback } from "react";
import { Trophy, HelpCircle } from "lucide-react";
import confetti from "canvas-confetti";


import { Tile, ScreenState, LeaderboardEntry } from "./types";
import { getDailyMission, GRID_SIZE, supabase } from "./utils";

type DailyScoreRow = {
  player_handle: string;
  score: number;
  moves_used: number;
  created_at: string;
  players: { zcash_address: string | null } | null;
};
import { WelcomeScreen } from "./WelcomeScreen";
import { DashboardPanel } from "./DashboardPanel";
import { GameBoard } from "./GameBoard";
import { LockoutGate } from "./LockoutGate";
import { ResultsScreen } from "./ResultsScreen";
import { LeaderboardModal } from "./LeaderboardModal";
import { TutorialModal } from "./TutorialModal";
import { DailyContestDashboard } from "./DailyContestDashboard";


export default function ZecCascadeApp() {
  const [screen, setScreen] = useState<ScreenState>("welcome");
  const [username, setUsername] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [walletSubmitted, setWalletSubmitted] = useState(false);
  const [todayScore, setTodayScore] = useState(0);
  const [showTutorial, setShowTutorial] = useState(false);


  const [mission] = useState(() => getDailyMission());
  const [board, setBoard] = useState<Tile[][]>([]);
  const [selectedTile, setSelectedTile] = useState<{ r: number; c: number } | null>(null);
  const [movesLeft, setMovesLeft] = useState(mission.initialMoves);
  const [sequenceIndex, setSequenceIndex] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [gameStatus, setGameStatus] = useState<"playing" | "won" | "lost">("playing");
  const [showLeaderboard, setShowLeaderboard] = useState(false);
  const [leaderboardData, setLeaderboardData] = useState<LeaderboardEntry[]>([]);


  const targetWord = mission.targetWord;


  const fetchLeaderboard = useCallback(async () => {
    try {
      // Join daily_scores with players to get wallet addresses
      const { data } = await supabase
        .from("daily_scores")
        .select("player_handle, score, moves_used, created_at, players!inner(zcash_address)")
        .returns<DailyScoreRow[]>();

      if (!data) return;


      const userStats: Record<string, { 
        totalScore: number; 
        totalMoves: number; 
        earliestCompletion: string;
        zcashAddress?: string 
      }> = {};
      data.forEach((row) => {
        if (!userStats[row.player_handle]) {
          userStats[row.player_handle] = { 
            totalScore: 0, 
            totalMoves: 0, 
            earliestCompletion: row.created_at,
            zcashAddress: row.players?.zcash_address ?? undefined
          };
        }
        // Keep earliest (fastest) completion
        if (row.created_at < userStats[row.player_handle].earliestCompletion) {
          userStats[row.player_handle].earliestCompletion = row.created_at;
        }
        userStats[row.player_handle].totalScore += row.score;
        userStats[row.player_handle].totalMoves += row.moves_used;
      });


      const sorted = Object.entries(userStats)
        .map(([name, stat]) => ({ 
          name, 
          score: stat.totalScore, 
          moves: stat.totalMoves, 
          earliestCompletion: stat.earliestCompletion,
          zcashAddress: stat.zcashAddress 
        }))
        .sort((a, b) => 
          b.score - a.score 
          || a.moves - b.moves 
          || new Date(a.earliestCompletion).getTime() - new Date(b.earliestCompletion).getTime()
        );


      setLeaderboardData(sorted.slice(0, 5));
    } catch (e) {
      console.error(e);
    }
  }, []);


  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);


  const handleLogin = async () => {
    const handle = username.trim().toLowerCase();
    console.log("[handleLogin] Attempting login for handle:", handle);
    console.log("[handleLogin] Today's UTC date:", mission.todayUTC);
    if (!handle) return;


    const { data, error } = await supabase
      .from("daily_scores")
      .select("score")
      .eq("player_handle", handle)
      .eq("play_date", mission.todayUTC)
      .maybeSingle();

    console.log("[handleLogin] Supabase response:", { data, error });
    console.log("[handleLogin] Found existing score:", data);

    if (error) {
      console.error("[handleLogin] Supabase error:", error);
    }

    if (data) {
      console.log("[handleLogin] Returning player - navigating to gate");
      setTodayScore(data.score);
      setScreen("gate");
    } else {
      console.log("[handleLogin] New player - navigating to playing");
      setScreen("playing");
      setShowTutorial(true); // Show tutorial on first play
    }
  };


  const generateTile = useCallback(
    (shapeIndex?: number): Tile => {
      const idx = shapeIndex !== undefined ? shapeIndex : Math.floor(Math.random() * 5);
      return {
        id: `tile-${Math.random().toString(36).substring(2, 9)}`,
        shapeIndex: idx,
        letter: mission.shapeLetterMap[idx],
        isShielded: Math.random() < 0.2,
      };
    },
    [mission.shapeLetterMap]
  );


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


  const checkMatches = useCallback((currentBoard: Tile[][]) => {
    const matchedMap = Array.from({ length: GRID_SIZE }, () => Array(GRID_SIZE).fill(false));


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


  const saveFinalScore = async (finalScore: number, movesUsed: number) => {
    const handle = username.trim().toLowerCase();
    await supabase.from("players").upsert({ handle: handle, zcash_address: walletAddress || null }, { onConflict: "handle" });
    await supabase.from("daily_scores").insert({
      player_handle: handle,
      play_date: mission.todayUTC,
      score: finalScore,
      moves_used: movesUsed,
    });
    fetchLeaderboard();
  };


  const processBoard = async (startBoard: Tile[][], moves: number) => {
    setIsProcessing(true);
    let tempBoard = structuredClone(startBoard);
    let matches = checkMatches(tempBoard);
    let currentSeq = sequenceIndex;


    while (matches.length > 0) {
      matches.forEach(({ r, c }) => {
        const tile = tempBoard[r][c];
        const neighbors = [{ r: r - 1, c }, { r: r + 1, c }, { r, c: c - 1 }, { r, c: c + 1 }];
        neighbors.forEach((n) => {
          if (n.r >= 0 && n.r < GRID_SIZE && n.c >= 0 && n.c < GRID_SIZE) {
            tempBoard[n.r][n.c].isShielded = false;
          }
        });


        if (!tile.isShielded && tile.letter === targetWord[currentSeq]) {
          currentSeq++;
        }
        tempBoard[r][c].isMatched = true;
      });


      setSequenceIndex(currentSeq);
      setBoard([...tempBoard]);
      await new Promise((res) => setTimeout(res, 250));


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
      matches = checkMatches(tempBoard);
    }


    setIsProcessing(false);
    const movesUsed = mission.initialMoves - moves;


    if (currentSeq >= targetWord.length) {
      const finalScore = 1000 - movesUsed * 30;
      setTodayScore(finalScore);
      setGameStatus("won");
      setScreen("result");
      confetti({ particleCount: 120, spread: 70, origin: { y: 0.6 } });
      await saveFinalScore(finalScore, movesUsed);
    } else if (moves <= 0) {
      const finalScore = Math.round((currentSeq / targetWord.length) * 400);
      setTodayScore(finalScore);
      setGameStatus("lost");
      setScreen("result");
      await saveFinalScore(finalScore, mission.initialMoves);
    }
  };


  const handleTileClick = async (r: number, c: number) => {
    if (isProcessing || gameStatus !== "playing") return;


    if (!selectedTile) {
      setSelectedTile({ r, c });
      return;
    }


    const { r: r1, c: c1 } = selectedTile;
    if (Math.abs(r1 - r) + Math.abs(c1 - c) !== 1) {
      setSelectedTile({ r, c });
      return;
    }


    setSelectedTile(null);
    let nextBoard = structuredClone(board);
    const t1 = nextBoard[r1][c1];
    const t2 = nextBoard[r][c];
    nextBoard[r1][c1] = t2;
    nextBoard[r][c] = t1;


    if (checkMatches(nextBoard).length > 0) {
      const remainingMoves = movesLeft - 1;
      setMovesLeft(remainingMoves);
      await processBoard(nextBoard, remainingMoves);
    } else {
      setBoard([...board]);
    }
  };


  // Compute gate screen data
  const userRankIndex = leaderboardData.findIndex(
    (item) => item.name.toLowerCase() === username.toLowerCase()
  );
  const currentRank = userRankIndex !== -1 ? userRankIndex + 1 : 1;
  const userWeeklyTotal = leaderboardData.find(
    (item) => item.name.toLowerCase() === username.toLowerCase()
  )?.score || todayScore;

  // Main playing screen
  const playingScreen = (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-slate-100 font-sans p-4 sm:p-6">
      <header className="w-full max-w-md flex items-center justify-between mb-4 border-b border-amber-500/20 pb-3">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 rounded-full bg-amber-500 flex items-center justify-center text-slate-950 font-black text-sm">🛡️</div>
          <div>
            <h1 className="text-lg font-black text-amber-400 uppercase tracking-wider">ZCade</h1>
            <p className="text-xs text-slate-400">
              Player: <span className="text-amber-400 font-bold">{username}</span>
            </p>
          </div>
        </div>
        <button onClick={() => setShowLeaderboard(true)} className="px-3 py-2 rounded-lg bg-slate-900 border border-amber-500/30 text-amber-400 flex items-center gap-2 text-xs font-bold">
          <Trophy className="w-4 h-4" /> Rank
        </button>
      </header>


      <DashboardPanel targetWord={targetWord} movesLeft={movesLeft} sequenceIndex={sequenceIndex} />


      <GameBoard
        board={board}
        selectedTile={selectedTile}
        isProcessing={isProcessing}
        gameStatus={gameStatus}
        onTileClick={handleTileClick}
      />


      <footer className="w-full max-w-md mt-4 p-3 bg-slate-900/50 border border-amber-500/10 rounded-xl text-center">
        <p className="text-xs text-amber-400/80 font-medium flex items-center justify-center gap-2">
          <HelpCircle className="w-4 h-4 text-amber-400" />
          <span>Match next to '?' tiles to decrypt letters. Collect in exact sequence!</span>
        </p>
      </footer>
    </div>
  );

  // Gate screen (Daily Contest Dashboard)
  const gateScreen = (
    <>
      <DailyContestDashboard
        username={username}
        todayScore={todayScore}
        weeklyTotal={userWeeklyTotal}
        userRank={currentRank}
        onOpenLeaderboard={() => setShowLeaderboard(true)}
        onChangeHandle={() => setScreen("welcome")}
      />

      {showLeaderboard && (
        <LeaderboardModal
          data={leaderboardData}
          currentUsername={username}
          currentScore={todayScore}
          onClose={() => setShowLeaderboard(false)}
        />
      )}
    </>
  );

  // Result screen
  const resultScreen = (
    <ResultsScreen
      gameStatus={gameStatus as "won" | "lost"}
      todayScore={todayScore}
      walletAddress={walletAddress}
      setWalletAddress={setWalletAddress}
      walletSubmitted={walletSubmitted}
      onSaveWallet={async () => {
        if (!walletAddress.trim()) return;
        await supabase.from("players").upsert(
          { handle: username.trim().toLowerCase(), zcash_address: walletAddress },
          { onConflict: 'handle' }
        );
        setWalletSubmitted(true);
        // Refresh leaderboard data after saving wallet
        const { data } = await supabase
          .from("daily_scores")
          .select("player_handle, score, moves_used, created_at, players!inner(zcash_address)")
          .returns<DailyScoreRow[]>();
        if (data) {
          const userStats: Record<string, { totalScore: number; totalMoves: number; earliestCompletion: string; zcashAddress?: string }> = {};
          data.forEach((row) => {
            if (!userStats[row.player_handle]) {
              userStats[row.player_handle] = { totalScore: 0, totalMoves: 0, earliestCompletion: row.created_at, zcashAddress: row.players?.zcash_address ?? undefined };
            }
            if (row.created_at < userStats[row.player_handle].earliestCompletion) {
              userStats[row.player_handle].earliestCompletion = row.created_at;
            }
            userStats[row.player_handle].totalScore += row.score;
            userStats[row.player_handle].totalMoves += row.moves_used;
          });
          const sorted = Object.entries(userStats)
            .map(([name, stat]) => ({ name, score: stat.totalScore, moves: stat.totalMoves, earliestCompletion: stat.earliestCompletion, zcashAddress: stat.zcashAddress }))
            .sort((a, b) => b.score - a.score || a.moves - b.moves || new Date(a.earliestCompletion).getTime() - new Date(b.earliestCompletion).getTime());
          setLeaderboardData(sorted.slice(0, 5));
        }
      }}
      onShowLeaderboard={() => setShowLeaderboard(true)}
      onContinueToDashboard={() => setScreen("gate")}
    />
  );

  // App-level render
  return (
    <>
      {screen === "welcome" && <WelcomeScreen username={username} setUsername={setUsername} onLogin={handleLogin} />}
      {screen === "playing" && playingScreen}
      {screen === "result" && resultScreen}
      {screen === "gate" && gateScreen}

      {showLeaderboard && (
        <LeaderboardModal
          data={leaderboardData}
          currentUsername={username}
          currentScore={todayScore}
          onClose={() => setShowLeaderboard(false)}
          onAddWallet={async (handle, address) => {
            await supabase.from("players").upsert(
              { handle: handle.toLowerCase(), zcash_address: address },
              { onConflict: 'handle' }
            );
            // Refresh leaderboard data
            const { data } = await supabase
              .from("daily_scores")
              .select("player_handle, score, moves_used, players!inner(zcash_address)")
              .returns<DailyScoreRow[]>();
            if (data) {
              const userStats: Record<string, { totalScore: number; totalMoves: number; zcashAddress?: string }> = {};
              data.forEach((row) => {
                if (!userStats[row.player_handle]) {
                  userStats[row.player_handle] = { totalScore: 0, totalMoves: 0, zcashAddress: row.players?.zcash_address ?? undefined };
                }
                userStats[row.player_handle].totalScore += row.score;
                userStats[row.player_handle].totalMoves += row.moves_used;
              });
              const sorted = Object.entries(userStats)
                .map(([name, stat]) => ({ name, score: stat.totalScore, moves: stat.totalMoves, zcashAddress: stat.zcashAddress }))
                .sort((a, b) => b.score - a.score || a.moves - b.moves);
              setLeaderboardData(sorted.slice(0, 5));
            }
          }}
        />
      )}

      {showTutorial && <TutorialModal targetWord={targetWord} initialMoves={mission.initialMoves} onClose={() => setShowTutorial(false)} />}
    </>
  );
}