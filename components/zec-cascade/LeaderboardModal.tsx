"use client";


import React, { useState } from "react";
import { Trophy, Copy, Plus, Wallet, X } from "lucide-react";
import { LeaderboardEntry } from "./types";


interface LeaderboardModalProps {
  data: LeaderboardEntry[];
  currentUsername?: string;
  currentScore?: number;
  onClose: () => void;
  onAddWallet?: (handle: string, address: string) => Promise<void>;
}


const shortenAddress = (address?: string): string => {
  if (!address) return "";
  if (address.length <= 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
};

const formatCompletionTime = (isoString?: string): string => {
  if (!isoString) return "";
  const date = new Date(isoString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false });
};


export function LeaderboardModal({ data, currentUsername, currentScore, onClose, onAddWallet }: LeaderboardModalProps) {
  // If database hasn't synced yet, show current player's score as #1 fallback
  const displayData =
    data.length > 0
      ? data
      : currentUsername
      ? [{ name: currentUsername, score: currentScore || 0, moves: 8 }]
      : [];

  const [addingWalletFor, setAddingWalletFor] = useState<string | null>(null);
  const [newWalletAddress, setNewWalletAddress] = useState("");


  const handleCopy = (address: string) => {
    navigator.clipboard.writeText(address);
  };


  const handleAddWalletClick = (handle: string) => {
    setAddingWalletFor(handle);
    setNewWalletAddress("");
  };


  const handleSaveWallet = async () => {
    if (!addingWalletFor || !newWalletAddress.trim()) return;
    if (onAddWallet) {
      await onAddWallet(addingWalletFor, newWalletAddress.trim());
    }
    setAddingWalletFor(null);
    setNewWalletAddress("");
  };


  const handleCancelAddWallet = () => {
    setAddingWalletFor(null);
    setNewWalletAddress("");
  };


  return (
    <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      {/* Add Wallet Modal Overlay */}
      {addingWalletFor && (
        <div className="fixed inset-0 bg-slate-950/90 backdrop-blur-md z-60 flex items-center justify-center p-4">
          <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-wider">
                <Wallet className="w-4 h-4" /> Add Zcash Address
              </h3>
              <button onClick={handleCancelAddWallet} className="text-slate-400 font-bold text-sm p-1">
                ✕
              </button>
            </div>

            <p className="text-xs text-slate-400 mb-4">
              Enter address for <span className="font-bold text-amber-400">{addingWalletFor}</span>
            </p>

            <input
              type="text"
              placeholder="zs1... or u1..."
              value={newWalletAddress}
              onChange={(e) => setNewWalletAddress(e.target.value)}
              className="w-full px-4 py-3 rounded-xl bg-slate-950 border border-slate-800 text-sm text-slate-200 font-mono focus:outline-none focus:border-amber-400 mb-4"
            />

            <div className="flex gap-2">
              <button
                onClick={handleCancelAddWallet}
                className="flex-1 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleSaveWallet}
                disabled={!newWalletAddress.trim()}
                className="flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 disabled:opacity-50"
              >
                Save Address
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Leaderboard Modal */}
      <div className="fixed inset-0 bg-slate-950/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
        <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 shadow-2xl">
          <div className="flex justify-between items-center mb-4 border-b border-slate-800 pb-2">
            <h3 className="text-sm font-black text-amber-400 flex items-center gap-2 uppercase tracking-wider">
              <Trophy className="w-4 h-4" /> Weekly Leaderboard
            </h3>
            <button onClick={onClose} className="text-slate-400 font-bold text-sm p-1">
              ✕
            </button>
          </div>


          <div className="space-y-2 mb-6 max-h-60 overflow-y-auto">
            {displayData.length > 0 ? (
              displayData.map((item, idx) => (
                <div
                  key={idx}
                  className={`flex justify-between items-center p-2.5 rounded-xl border ${
                    item.name.toLowerCase() === currentUsername?.toLowerCase()
                      ? "bg-amber-500/10 border-amber-400/50"
                      : "bg-slate-950 border-slate-800"
                  }`}
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0 ${
                        idx === 0
                          ? "bg-amber-400 text-slate-950"
                          : idx === 1
                          ? "bg-slate-300 text-slate-950"
                          : idx === 2
                          ? "bg-amber-700 text-slate-100"
                          : "bg-slate-800 text-slate-400"
                      }`}
                    >
                      {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-slate-200 truncate">
                      {item.name} {item.name.toLowerCase() === currentUsername?.toLowerCase() && "(You)"}
                    </span>
                    {item.zcashAddress ? (
                      <button
                        onClick={() => handleCopy(item.zcashAddress)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors flex-shrink-0 flex items-center gap-1"
                        title={`Copy ${item.zcashAddress}`}
                      >
                        <span className="text-[10px] font-mono text-amber-400/80 whitespace-nowrap">
                          {shortenAddress(item.zcashAddress)}
                        </span>
                        <Copy className="w-3.5 h-3.5" />
                      </button>
                    ) : (
                      <button
                        onClick={() => handleAddWalletClick(item.name)}
                        className="p-1 text-slate-500 hover:text-amber-400 transition-colors flex-shrink-0 flex items-center gap-1"
                        title="Add wallet address"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span className="text-[10px] font-bold text-slate-500">Add Wallet</span>
                      </button>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="font-black text-yellow-400 text-xs block">{item.score} pts</span>
                    <span className="text-[10px] text-slate-500 block">{item.moves} moves used</span>
                    {item.earliestCompletion && (
                      <span className="text-[9px] text-amber-400/70 block mt-0.5 font-mono">
                        {formatCompletionTime(item.earliestCompletion)}
                      </span>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="p-4 text-center text-xs text-slate-500">
                No games played yet. Be the first to score!
              </div>
            )}
          </div>


          <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 font-bold text-slate-200 text-xs">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}