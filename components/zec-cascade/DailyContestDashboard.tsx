"use client";


import React, { useState, useEffect } from "react";
import { Lock, Trophy, Share2, Clock, ShieldCheck, RefreshCw } from "lucide-react";
import { getUTCResetCountdown } from "./utils";


interface DashboardProps {
  username: string;
  todayScore: number;
  weeklyTotal: number;
  userRank: number;
  onOpenLeaderboard: () => void;
  onChangeHandle: () => void;
}


export function DailyContestDashboard({
  username,
  todayScore,
  weeklyTotal,
  userRank,
  onOpenLeaderboard,
  onChangeHandle,
}: DashboardProps) {
  const [countdown, setCountdown] = useState(getUTCResetCountdown());


  useEffect(() => {
    const interval = setInterval(() => {
      setCountdown(getUTCResetCountdown());
    }, 1000);
    return () => clearInterval(interval);
  }, []);


  const handleShareX = () => {
    const text = `ZCade 🛡️\nDaily Score: ${todayScore} PTS\nWeekly Rank: #${userRank}\nCan you beat my score on ZCade? #Zcash`;
    const url = `https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}`;
    window.open(url, "_blank");
  };


  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl relative">
        
        {/* COMPLETION BADGE */}
        <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/30 text-amber-400 text-xs font-bold mb-4">
          <Lock className="w-3.5 h-3.5" /> LOCKED FOR TODAY
        </div>


        <h2 className="text-xl font-black text-slate-100 mb-0.5">Contest Dashboard</h2>
        <p className="text-xs text-slate-400 mb-5">
          Player: <span className="text-amber-400 font-bold">{username}</span>
        </p>


        {/* STATS GRID */}
        <div className="grid grid-cols-2 gap-2 mb-4">
          <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-xl">
            <span className="text-xs text-slate-500 uppercase font-bold block">Today's Score</span>
            <span className="text-3xl font-black text-yellow-400">{todayScore} PTS</span>
          </div>


          <div className="p-4 bg-slate-950 border border-amber-500/20 rounded-xl">
            <span className="text-xs text-slate-500 uppercase font-bold block">Weekly Total</span>
            <span className="text-3xl font-black text-slate-100">{weeklyTotal} PTS</span>
          </div>
        </div>


        {/* RANK BADGE */}
        <div className="p-4 bg-amber-500/10 border border-amber-400/40 rounded-xl flex items-center justify-between mb-6">
          <span className="text-xs font-bold text-amber-300 flex items-center gap-1.5">
            <Trophy className="w-4 h-4 text-amber-400" /> Current Rank
          </span>
          <span className="text-lg font-black text-amber-400">#{userRank || "-"}</span>
        </div>


        {/* COUNTDOWN */}
        <div className="flex items-center justify-center gap-2 text-sm text-slate-400 mb-6 bg-slate-950 p-3 rounded-lg border border-slate-800">
          <Clock className="w-5 h-5 text-amber-400 animate-pulse" />
          <span>Next Mission Unlocks in: <strong className="text-amber-400 font-mono">{countdown}</strong></span>
        </div>


        {/* ACTIONS */}
        <div className="space-y-3">
          <button
            onClick={onOpenLeaderboard}
            className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2"
          >
            <Trophy className="w-5 h-5" /> View Leaderboard
          </button>


          <button
            onClick={handleShareX}
            className="w-full py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-slate-200 font-bold text-sm hover:bg-slate-700 transition-all flex items-center justify-center gap-2"
          >
            <Share2 className="w-4 h-4" /> Share Score to X
          </button>


          <button
            onClick={onChangeHandle}
            className="w-full py-2.5 text-sm text-slate-500 hover:text-slate-400 font-bold flex items-center justify-center gap-1 mt-1"
          >
            <RefreshCw className="w-4 h-4" /> Switch Player Handle
          </button>
        </div>
      </div>
    </div>
  );
}