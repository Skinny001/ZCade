"use client";


import React from "react";
import { Tile } from "./types";
import { SHAPES } from "./utils";


interface GameBoardProps {
  board: Tile[][];
  selectedTile: { r: number; c: number } | null;
  isProcessing: boolean;
  gameStatus: string;
  onTileClick: (r: number, c: number) => void;
}


export function GameBoard({ board, selectedTile, isProcessing, gameStatus, onTileClick }: GameBoardProps) {
  return (
    <div className="relative w-full max-w-md aspect-square bg-slate-900/50 p-3 rounded-2xl border border-amber-500/20 shadow-2xl">
      <div className="grid grid-cols-8 gap-1.5 w-full h-full">
        {board.map((row, r) =>
          row.map((tile, c) => {
            const shape = SHAPES[tile.shapeIndex];
            const isSelected = selectedTile?.r === r && selectedTile?.c === c;


            return (
              <button
                key={tile.id}
                onClick={() => onTileClick(r, c)}
                disabled={isProcessing || gameStatus !== "playing"}
                className={`relative flex items-center justify-center rounded-xl font-black transition-all border-2 shadow-md min-h-[44px] min-w-[44px] ${
                  tile.isShielded ? "bg-slate-950 border-slate-800 text-amber-500/40" : `${shape.bg} ${shape.border} ${shape.text}`
                } ${isSelected ? "ring-4 ring-yellow-300 scale-105 z-10" : "active:brightness-110"} ${
                  tile.isMatched ? "scale-0 opacity-0" : "scale-100 opacity-100"
                }`}
              >
                {tile.isShielded ? (
                  <span className="text-xl font-mono font-bold select-none text-slate-600">?</span>
                ) : (
                  <span className="text-2xl drop-shadow-md select-none">{tile.letter}</span>
                )}
              </button>
            );
          })
        )}
      </div>
    </div>
  );
}