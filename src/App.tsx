/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  RotateCcw, 
  Undo2, 
  ArrowLeftRight, 
  Trophy, 
  Timer, 
  Settings2,
  ChevronUp,
  ChevronDown,
  History as HistoryIcon
} from 'lucide-react';

type ServingSide = 'A' | 'B' | null;

interface GameState {
  scoreA: number;
  scoreB: number;
  setsA: number;
  setsB: number;
  serving: ServingSide;
  timeoutsA: number;
  timeoutsB: number;
  teamAName: string;
  teamBName: string;
}

const INITIAL_STATE: GameState = {
  scoreA: 0,
  scoreB: 0,
  setsA: 0,
  setsB: 0,
  serving: null,
  timeoutsA: 2,
  timeoutsB: 2,
  teamAName: '烏野高中',
  teamBName: '音駒高中',
};

export default function App() {
  const [state, setState] = useState<GameState>(INITIAL_STATE);
  const [history, setHistory] = useState<GameState[]>([]);
  const [isSwapped, setIsSwapped] = useState(false);
  const [isEditingNames, setIsEditingNames] = useState(false);
  const [timeoutTimer, setTimeoutTimer] = useState<number | null>(null);

  // Auto-save/load? Let's stick to state for now.

  const saveToHistory = useCallback(() => {
    setHistory(prev => [...prev.slice(-19), { ...state }]); // Keep last 20 steps
  }, [state]);

  const updateScore = (side: 'A' | 'B', delta: number) => {
    saveToHistory();
    setState(prev => {
      const newState = { ...prev };
      if (side === 'A') {
        newState.scoreA = Math.max(0, newState.scoreA + delta);
        if (delta > 0) newState.serving = 'A';
      } else {
        newState.scoreB = Math.max(0, newState.scoreB + delta);
        if (delta > 0) newState.serving = 'B';
      }
      return newState;
    });
  };

  const updateSets = (side: 'A' | 'B', delta: number) => {
    saveToHistory();
    setState(prev => {
      const newState = { ...prev };
      if (side === 'A') newState.setsA = Math.max(0, newState.setsA + delta);
      else newState.setsB = Math.max(0, newState.setsB + delta);
      return newState;
    });
  };

  const undo = () => {
    if (history.length === 0) return;
    const lastState = history[history.length - 1];
    setState(lastState);
    setHistory(prev => prev.slice(0, -1));
  };

  const resetSet = () => {
    if (window.confirm('確定要清除目前的比分並開始新的一局嗎？')) {
      saveToHistory();
      setState(prev => ({
        ...prev,
        scoreA: 0,
        scoreB: 0,
        timeoutsA: 2,
        timeoutsB: 2,
        serving: null,
      }));
    }
  };

  const resetMatch = () => {
    if (window.confirm('確定要初始化整場比賽的所有數據嗎？')) {
      saveToHistory();
      setState(INITIAL_STATE);
      setIsSwapped(false);
    }
  };

  const toggleTimeout = (side: 'A' | 'B') => {
    saveToHistory();
    setState(prev => {
      const key = side === 'A' ? 'timeoutsA' : 'timeoutsB';
      if (prev[key] <= 0) return prev;
      
      // Start 30s timer
      setTimeoutTimer(30);
      
      return {
        ...prev,
        [key]: prev[key] - 1
      };
    });
  };

  useEffect(() => {
    let interval: any;
    if (timeoutTimer !== null && timeoutTimer > 0) {
      interval = setInterval(() => {
        setTimeoutTimer(prev => (prev !== null && prev > 0 ? prev - 1 : null));
      }, 1000);
    } else {
      setTimeoutTimer(null);
    }
    return () => clearInterval(interval);
  }, [timeoutTimer]);

  const TeamPanel = ({ side, color }: { side: 'A' | 'B', color: 'blue' | 'red' }) => {
    const isServing = state.serving === side;
    const score = side === 'A' ? state.scoreA : state.scoreB;
    const sets = side === 'A' ? state.setsA : state.setsB;
    const timeouts = side === 'A' ? state.timeoutsA : state.timeoutsB;

    const bgGradient = color === 'blue' 
      ? 'bg-linear-to-br from-[#2563eb] to-[#1d4ed8]' 
      : 'bg-linear-to-br from-[#dc2626] to-[#b91c1c]';

    return (
      <div className={`flex-1 relative overflow-hidden rounded-[16px] sm:rounded-[24px] shadow-[0_20px_25px_-5px_rgba(0,0,0,0.3)] flex flex-col ${bgGradient} transition-all duration-500`}>
        {/* Serve Indicator */}
        <AnimatePresence>
          {isServing && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0, opacity: 0 }}
              className="absolute top-2 right-2 sm:top-5 sm:right-5 z-10 w-6 h-6 sm:w-10 sm:h-10 bg-[#facc15] text-black rounded-full flex items-center justify-center font-bold text-xs sm:text-base shadow-[0_0_20px_rgba(250,204,21,0.5)]"
            >
              S
            </motion.div>
          )}
        </AnimatePresence>

        {/* Score Area - Massive but controlled by vh */}
        <div 
          className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none group relative overflow-hidden"
          onClick={() => updateScore(side, 1)}
        >
          <motion.div
            key={score}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[40vh] sm:text-[55vh] lg:text-[22rem] font-extrabold text-white leading-none tabular-nums drop-shadow-[0_10px_20px_rgba(0,0,0,0.2)]"
          >
            {score}
          </motion.div>

          {/* Decrease button - visible but unobtrusive */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[25%] flex items-center justify-center opacity-0 group-hover:opacity-40 hover:bg-black/5 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); updateScore(side, -1); }}
          >
            <ChevronDown size={32} className="text-white" />
          </div>
        </div>

        {/* Sets & Timeouts - Very compact in landscape */}
        <div className="py-3 sm:pb-10 space-y-3 sm:space-y-8 shrink-0 bg-black/5">
          {/* Set Dots */}
          <div className="flex justify-center gap-3 sm:gap-5">
            {[...Array(3)].map((_, i) => (
              <div 
                key={i}
                onClick={(e) => { e.stopPropagation(); updateSets(side, i < sets ? -1 : 1); }}
                className={`w-4 h-4 sm:w-8 sm:h-8 rounded-full border-2 border-white/40 cursor-pointer transition-all ${
                  i < sets ? 'bg-white shadow-[0_0_15px_#fff]' : 'bg-white/20'
                }`}
              />
            ))}
          </div>

          {/* Timeout Ticks */}
          <div className="flex justify-center gap-2 sm:gap-3">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); if (i < timeouts) toggleTimeout(side); }}
                className={`w-[25px] sm:w-[50px] h-[4px] sm:h-[8px] rounded-[4px] border border-white/5 cursor-pointer transition-all ${
                  i < (2-timeouts) ? 'bg-white/30' : 'bg-white'
                }`}
              />
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#0f172a] text-white flex flex-col font-sans overflow-hidden p-3 sm:p-5 box-border">
      {/* Portrait Orientation Hint */}
      <div className="fixed inset-0 z-[100] bg-[#0f172a] flex flex-col items-center justify-center p-10 text-center sm:hidden portrait:flex hidden">
        <motion.div
          animate={{ rotate: 90 }}
          transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
          className="mb-8 p-6 bg-slate-800 rounded-3xl"
        >
          <ArrowLeftRight size={64} className="text-[#facc15]" />
        </motion.div>
        <h3 className="text-2xl font-black mb-4">建議旋轉螢幕</h3>
        <p className="text-slate-400 font-medium">使用橫向模式以獲得最佳計分體驗</p>
      </div>

      {/* Header - Highly simplified */}
      <header className="flex justify-between items-center h-[35px] sm:h-[50px] mb-2 sm:mb-4 px-2">
        <div className="bg-[#1e293b] border border-[#334155] rounded-full px-4 sm:px-6 py-1 text-[#94a3b8] font-bold text-xs sm:text-base tracking-widest uppercase">
          SET {state.setsA + state.setsB + 1}
        </div>
        
        <div className="flex items-center gap-6 sm:gap-12 text-sm sm:text-xl font-black text-slate-400">
           <span className={state.setsA > state.setsB ? 'text-[#3b82f6]' : ''}>SETS {state.setsA}</span>
           <span className="text-xs opacity-30">|</span>
           <span className={state.setsB > state.setsA ? 'text-[#ef4444]' : ''}>SETS {state.setsB}</span>
        </div>

        <div className="bg-[#1e293b] border border-[#334155] rounded-full px-4 sm:px-6 py-1 text-[#94a3b8] font-bold text-xs sm:text-base tabular-nums">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </header>

      {/* Scoreboard Area */}
      <main className="flex-1 flex gap-2 sm:gap-5 relative">
        <TeamPanel side={isSwapped ? 'B' : 'A'} color={isSwapped ? 'red' : 'blue'} />
        <TeamPanel side={isSwapped ? 'A' : 'B'} color={isSwapped ? 'blue' : 'red'} />

        {/* Timeout Timer Overlay */}
        <AnimatePresence>
          {timeoutTimer !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-30 flex items-center justify-center pointer-events-none"
            >
              <div className="bg-slate-900/95 backdrop-blur-xl rounded-[20px] sm:rounded-[40px] p-8 sm:p-16 shadow-[0_0_100px_rgba(0,0,0,0.5)] border border-slate-700 flex flex-col items-center gap-2 sm:gap-6 pointer-events-auto">
                <span className="text-xs sm:text-xl uppercase font-black tracking-[0.4em] text-[#facc15]">Timeout</span>
                <span className="text-7xl sm:text-[10rem] leading-none font-black text-white">{timeoutTimer}</span>
                <button 
                  onClick={() => setTimeoutTimer(null)}
                  className="mt-2 sm:mt-4 px-6 py-2 sm:px-10 sm:py-4 bg-[#facc15] text-black rounded-xl sm:rounded-2xl font-black uppercase text-xs sm:text-lg hover:brightness-110 transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Control Bar - Simplified */}
      <div className="h-[50px] sm:h-[100px] flex justify-center items-center gap-2 sm:gap-6 mt-2 sm:mt-4 grow-0">
        <button 
          onClick={undo}
          disabled={history.length === 0}
          className="bg-[#1e293b] border border-[#334155] text-white px-4 sm:px-10 py-2 sm:py-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[150px] transition-all disabled:opacity-20 flex flex-col items-center justify-center"
        >
          <span className="text-xs sm:text-lg font-bold">UNDO</span>
        </button>

        <button 
          onClick={() => setIsSwapped(!isSwapped)}
          className="bg-[#1e293b] border border-[#334155] text-white px-4 sm:px-10 py-2 sm:py-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[150px] transition-all flex flex-col items-center justify-center"
        >
          <span className="text-xs sm:text-lg font-bold">SWAP</span>
        </button>

        <button 
          onClick={resetSet}
          className="bg-[#1e293b] border border-[#334155] text-white px-4 sm:px-10 py-2 sm:py-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[150px] transition-all hover:bg-[#2d3a4f] flex flex-col items-center justify-center"
        >
          <span className="text-xs sm:text-lg font-bold">NEXT SET</span>
        </button>

        <button 
          onClick={resetMatch}
          className="bg-[#1e293b] border border-[#334155] text-white px-4 sm:px-10 py-2 sm:py-4 rounded-xl sm:rounded-2xl min-w-[70px] sm:min-w-[150px] opacity-50 hover:opacity-100 transition-all flex flex-col items-center justify-center"
        >
          <span className="text-xs sm:text-lg font-bold">RESET</span>
        </button>
      </div>
    </div>
  );
}


