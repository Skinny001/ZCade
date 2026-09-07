"use client";


import React, { useState } from "react";
import { Shield, Sparkles, HelpCircle, ArrowRight, ArrowLeft, Check } from "lucide-react";
import { SHAPES } from "./utils";


interface TutorialModalProps {
  targetWord: string;
  initialMoves: number;
  onClose: () => void;
}


// Mini tile preview for tutorial illustrations
const TilePreview = ({ shapeIndex = 0, size = 28, letter = "A" }: { shapeIndex?: number; size?: number; letter?: string }) => {
  const shape = SHAPES[shapeIndex];
  return (
    <div
      className={`rounded-lg border-2 flex-shrink-0 flex items-center justify-center font-black ${shape.bg} ${shape.border} ${shape.text}`}
      style={{ width: size, height: size }}
    >
      {letter}
    </div>
  );
};


export function TutorialModal({ targetWord, initialMoves, onClose }: TutorialModalProps) {
  const [currentStep, setCurrentStep] = useState(0);


  const steps = [
    {
      title: "Objective & Move Limit",
      icon: <Sparkles className="w-8 h-8 text-amber-400" />,
      content: (
        <>
          <p className="text-sm text-slate-300 mb-3">
            Today's Target Word is <span className="font-black text-amber-400">{targetWord}</span>. You have only{" "}
            <span className="font-black text-red-400">{initialMoves} Moves</span> to complete the word!
          </p>
          <div className="p-3 bg-slate-950 border border-amber-500/20 rounded-xl">
            <span className="text-xs text-slate-500 uppercase font-bold block mb-3">Pro Tip</span>
            
            <div className="space-y-3 text-[11px]">
              <div>
                <span className="text-slate-400 block mb-1">3-Match (Basic)</span>
                <div className="flex gap-1">
                  <TilePreview shapeIndex={0} size={24} />
                  <TilePreview shapeIndex={0} size={24} />
                  <TilePreview shapeIndex={0} size={24} />
                </div>
                <span className="text-slate-500 block mt-1">Clears tiles only</span>
              </div>
              
              <div className="pt-2 border-t border-slate-800">
                <span className="text-amber-400 block mb-1">4-Match (Combo!) ★</span>
                <div className="flex gap-1">
                  <TilePreview shapeIndex={0} size={24} />
                  <TilePreview shapeIndex={0} size={24} />
                  <TilePreview shapeIndex={0} size={24} />
                  <TilePreview shapeIndex={0} size={24} />
                </div>
                <span className="text-amber-400 block mt-1">Creates special tiles → Big cascades</span>
              </div>
            </div>
          </div>
        </>
      ),
    },
    {
      title: "Sequential Decryption",
      icon: <HelpCircle className="w-8 h-8 text-amber-400" />,
      content: (
        <>
          <p className="text-sm text-slate-300 mb-3">
            You must collect letters in <span className="font-bold text-amber-400">strict left-to-right order</span>!
          </p>
          <div className="p-3 bg-slate-950 border border-amber-500/20 rounded-xl text-center font-mono text-sm font-black text-amber-400 mb-2 overflow-x-auto">
            {targetWord.split("").join(" → ")}
          </div>
          <p className="text-xs text-slate-400">
            Matching letters out of order will clear them from the board but yields 0 progress toward the word.
          </p>
        </>
      ),
    },
    {
      title: "Encrypted (?) Tiles",
      icon: <Shield className="w-8 h-8 text-amber-400" />,
      content: (
        <>
          <p className="text-sm text-slate-300 mb-3">
            Dark tiles marked with <span className="font-mono font-bold text-amber-400">?</span> are encrypted.
          </p>
          <div className="p-3 bg-slate-950 border border-amber-500/20 rounded-xl text-center">
            <span className="text-sm text-slate-200 font-medium">
              Make a match <span className="text-amber-400 font-bold">adjacent</span> to a '?' tile to decrypt it and reveal its hidden letter!
            </span>
          </div>
        </>
      ),
    },
  ];


  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onClose();
    }
  };


  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };


  return (
    <div className="fixed inset-0 bg-slate-950/85 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="w-full max-w-sm bg-slate-900 border border-amber-500/30 rounded-2xl p-6 text-center shadow-2xl relative">
        
        {/* SKIP BUTTON */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-sm font-bold text-slate-400 hover:text-amber-400 transition-all uppercase tracking-wider"
        >
          Skip
        </button>


        {/* STEP ICON */}
        <div className="w-14 h-14 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-3">
          {steps[currentStep].icon}
        </div>


        {/* STEP TITLE */}
        <h3 className="text-lg font-black text-amber-400 uppercase tracking-wider mb-2">
          {steps[currentStep].title}
        </h3>


        {/* STEP CONTENT */}
        <div className="min-h-[120px] flex flex-col justify-center mb-4">
          {steps[currentStep].content}
        </div>


        {/* STEP INDICATOR DOTS */}
        <div className="flex justify-center gap-1.5 mb-6">
          {steps.map((_, idx) => (
            <div
              key={idx}
              className={`h-2 rounded-full transition-all ${
                idx === currentStep ? "w-8 bg-amber-400" : "w-2 bg-slate-800"
              }`}
            />
          ))}
        </div>


        {/* NAVIGATION CONTROLS */}
        <div className="flex gap-2">
          {currentStep > 0 && (
            <button
              onClick={handleBack}
              className="px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold text-sm flex items-center justify-center gap-1"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          )}


          <button
            onClick={handleNext}
            className="flex-1 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-yellow-400 text-slate-950 font-black text-sm shadow-lg hover:brightness-110 transition-all flex items-center justify-center gap-1.5"
          >
            {currentStep === steps.length - 1 ? (
              <>
                Got It, Start Playing! <Check className="w-4 h-4" />
              </>
            ) : (
              <>
                Next Step <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}