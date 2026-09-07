"use client";


import React from "react";


interface DashboardPanelProps {
  targetWord: string;
  movesLeft: number;
  sequenceIndex: number;
}


export function DashboardPanel({ targetWord, movesLeft, sequenceIndex }: DashboardPanelProps) {
  const currentNeededLetter = targetWord[sequenceIndex] || "";


  return (
    <div className="w-full max-w-md bg-slate-900/90 border border-amber-500/30 rounded-2xl p-4 mb-3 shadow-xl">
      <div className="flex justify-between items-center mb-3">
        <div>
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Target Word</span>
          <span className="text-3xl font-black tracking-widest text-amber-400">{targetWord}</span>
        </div>
        <div className="text-right">
          <span className="text-xs uppercase tracking-wider text-slate-400 font-bold block">Moves Left</span>
          <span className={`text-3xl font-black ${movesLeft <= 3 ? "text-red-500 animate-pulse" : "text-slate-100"}`}>
            {movesLeft}
          </span>
        </div>
      </div>


      <div className="pt-2 border-t border-slate-800">
        <span className="text-xs text-slate-400 uppercase font-bold block mb-2">
          Sequential Decryption: <span className="text-amber-400">Must collect '{currentNeededLetter}' next</span>
        </span>
        <div className="flex gap-2 overflow-x-auto pb-2">
          {targetWord.split("").map((letter, idx) => {
            const isCollected = idx < sequenceIndex;
            const isCurrentTarget = idx === sequenceIndex;
            return (
              <div
                key={idx}
                className={`flex-1 min-w-[36px] py-2.5 rounded-lg border text-center font-black transition-all shrink-0 ${
                  isCollected
                    ? "bg-amber-500/20 border-amber-400 text-amber-300"
                    : isCurrentTarget
                    ? "bg-amber-500 border-yellow-300 text-slate-950 animate-pulse"
                    : "bg-slate-950 border-slate-800 text-slate-600"
                }`}
              >
                <span className="text-sm">{letter}</span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}