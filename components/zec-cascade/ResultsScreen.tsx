"use client";


import React from "react";
import { Sparkles, AlertTriangle, Shield, CheckCircle2, Trophy } from "lucide-react";


interface ResultsScreenProps {
  gameStatus: "won" | "lost";
  todayScore: number;
  walletAddress: string;
  setWalletAddress: (val: string) => void;
  walletSubmitted: boolean;
  onSaveWallet: () => void;
  onShowLeaderboard: () => void;
  onContinueToDashboard: () => void;
}


export function ResultsScreen({
  gameStatus,
  todayScore,
  walletAddress,
  setWalletAddress,
  walletSubmitted,
  onSaveWallet,
  onShowLeaderboard,
  onContinueToDashboard,
}: ResultsScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl">
        {gameStatus === "won" ? (
          <>
            <Sparkles className="w-16 h-16 text-amber-400 mx-auto mb-3 animate-bounce" />
            <h2 className="text-2xl font-black text-amber-300 uppercase tracking-wide">Mission Complete!</h2>
          </>
        ) : (
          <>
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-3" />
            <h2 className="text-2xl font-black text-red-400 uppercase tracking-wide">Out of Moves!</h2>
          </>
        )}


        <div className="my-6 p-4 bg-slate-950 border border-amber-500/20 rounded-xl">
          <span className="text-xs text-slate-500 uppercase font-bold block">Today's Score</span>
          <span className="text-5xl font-black text-yellow-400">{todayScore} PTS</span>
        </div>


        <div className="bg-slate-950/60 p-4 rounded-xl border border-amber-500/20 text-left mb-6">
          <h4 className="text-sm font-black text-amber-400 uppercase mb-2 flex items-center gap-2">
            <Shield className="w-5 h-5 text-amber-400" /> Zcash Shielded Address
          </h4>
          <p className="text-xs text-slate-400 mb-4">Optional: Save address (`zs1...` / `u1...`) for Friday payouts.</p>

          {walletSubmitted ? (
            <div className="flex items-center gap-2 p-3 bg-amber-500/10 border border-amber-400/40 rounded-lg text-amber-300 text-sm font-bold">
              <CheckCircle2 className="w-5 h-5 text-amber-400" /> Address Saved
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-2">
              <input
                type="text"
                placeholder="zs1... or u1..."
                value={walletAddress}
                onChange={(e) => setWalletAddress(e.target.value)}
                className="flex-1 px-4 py-3 rounded-lg bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-400"
              />
              <button onClick={onSaveWallet} className="px-4 py-3 rounded-lg bg-amber-500 text-slate-950 font-black text-sm hover:bg-amber-400 transition-all">
                Save
              </button>
            </div>
          )}
        </div>


        <button
          onClick={onShowLeaderboard}
          className="w-full py-3.5 rounded-xl bg-slate-800 border border-amber-500/30 text-amber-400 font-bold text-sm flex items-center justify-center gap-2"
        >
          <Trophy className="w-4 h-4" /> View Weekly Leaderboard
        </button>

        <button
          onClick={onContinueToDashboard}
          className="w-full py-3.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-2 mt-3"
        >
          Continue to Dashboard
        </button>
      </div>
    </div>
  );
}