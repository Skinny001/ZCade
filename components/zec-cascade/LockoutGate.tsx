"use client";


import React from "react";
import { Lock, Trophy } from "lucide-react";


interface LockoutGateProps {
  username: string;
  todayScore: number;
  onShowLeaderboard: () => void;
  onChangeHandle: () => void;
}


export function LockoutGate({ username, todayScore, onShowLeaderboard, onChangeHandle }: LockoutGateProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl">
        <Lock className="w-12 h-12 text-amber-400 mx-auto mb-3" />
        <h2 className="text-2xl font-black text-slate-100 mb-1">Locked for Today</h2>
        <p className="text-xs text-slate-400 mb-4">
          Player: <span className="text-amber-400 font-bold">{username}</span>
        </p>


        <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-xl mb-6">
          <span className="text-xs text-slate-500 uppercase font-bold block">Today's Score</span>
          <span className="text-4xl font-black text-yellow-400">{todayScore} PTS</span>
        </div>


        <p className="text-xs text-amber-500/80 font-medium mb-6">Come back tomorrow at 00:00 UTC for the next target word!</p>


        <div className="space-y-2">
          <button
            onClick={onShowLeaderboard}
            className="w-full py-3 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-400 font-bold text-sm flex items-center justify-center gap-2"
          >
            <Trophy className="w-4 h-4" /> View Weekly Leaderboard
          </button>
          <button onClick={onChangeHandle} className="w-full py-3 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 font-bold text-sm">
            Change Handle
          </button>
        </div>
      </div>
    </div>
  );
}