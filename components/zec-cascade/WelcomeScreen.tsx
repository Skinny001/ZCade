"use client";


import React from "react";
import { ArrowRight } from "lucide-react";


interface WelcomeScreenProps {
  username: string;
  setUsername: (val: string) => void;
  onLogin: () => void;
}


export function WelcomeScreen({ username, setUsername, onLogin }: WelcomeScreenProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 p-4 text-slate-100 font-sans">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl">
        <div className="w-16 h-16 rounded-full bg-gradient-to-tr from-amber-500 to-yellow-300 flex items-center justify-center mx-auto mb-3 text-slate-950 font-black shadow-lg">
          🛡️
        </div>
        <h1 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-yellow-200 to-amber-500 uppercase tracking-wider mb-1">
          ZCade
        </h1>
        <p className="text-xs text-amber-500/80 font-bold tracking-widest uppercase mb-6">Community Contest</p>


        <div className="space-y-4 text-left mb-6">
          <label className="block text-xs uppercase font-bold text-slate-400">Handle / Nickname</label>
          <input
            type="text"
            placeholder="e.g. @cypher_jack"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-4 py-4 rounded-xl bg-slate-950 border border-amber-500/30 text-slate-100 font-bold focus:outline-none focus:border-amber-400 text-center text-base"
          />
        </div>


        <button
          onClick={onLogin}
          disabled={!username.trim()}
          className="w-full py-4 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-base shadow-lg hover:brightness-110 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
        >
          Continue to Game <ArrowRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
}