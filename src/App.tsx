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
      <div className={`flex-1 relative overflow-hidden rounded-[16px] sm:rounded-[32px] shadow-[0_20px_50px_rgba(0,0,0,0.5)] flex flex-col ${bgGradient} transition-all duration-500`}>
        {/* Indicators Overlay (Top) */}
        <div className="absolute top-2 left-2 right-2 flex justify-between items-start pointer-events-none z-20">
          {/* Timeout Ticks (Top Left) */}
          <div className="flex gap-1.5 p-1 bg-black/10 rounded-full backdrop-blur-xs">
            {[...Array(2)].map((_, i) => (
              <div
                key={i}
                onClick={(e) => { e.stopPropagation(); if (i < timeouts) toggleTimeout(side); }}
                className={`w-[15px] sm:w-[30px] h-[4px] sm:h-[8px] rounded-full border border-white/5 cursor-pointer pointer-events-auto transition-all ${
                  i < (2-timeouts) ? 'bg-white/20' : 'bg-white shadow-[0_0_8px_#fff]'
                }`}
              />
            ))}
          </div>

          {/* Serve Indicator (Top Right) */}
          <AnimatePresence>
            {isServing && (
              <motion.div
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                className="w-6 h-6 sm:w-12 sm:h-12 bg-[#facc15] text-black rounded-full flex items-center justify-center font-black text-[10px] sm:text-sm shadow-[0_0_20px_rgba(250,204,21,0.6)]"
              >
                S
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Score Area - Centralized and maximized */}
        <div 
          className="flex-1 flex flex-col items-center justify-center cursor-pointer select-none group relative pt-4"
          onClick={() => updateScore(side, 1)}
        >
          <motion.div
            key={score}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="text-[42vh] sm:text-[50vh] font-black text-white leading-none tabular-nums drop-shadow-[0_10px_30px_rgba(0,0,0,0.4)]"
          >
            {score}
          </motion.div>

          {/* Decrease button - Bottom zone overlay */}
          <div 
            className="absolute bottom-0 left-0 right-0 h-[35%] flex items-center justify-center opacity-0 group-hover:opacity-40 hover:bg-black/10 transition-all z-10"
            onClick={(e) => { e.stopPropagation(); updateScore(side, -1); }}
          >
            <ChevronDown size={48} className="text-white drop-shadow-sm" />
          </div>
        </div>

        {/* Set Dots (Bottom Overlay) */}
        <div className="absolute bottom-3 left-0 right-0 flex justify-center gap-2 sm:gap-4 pointer-events-none z-20">
          {[...Array(3)].map((_, i) => (
            <div 
              key={i}
              onClick={(e) => { e.stopPropagation(); updateSets(side, i < sets ? -1 : 1); }}
              className={`w-3 h-3 sm:w-6 sm:h-6 rounded-full border-2 border-white/40 cursor-pointer pointer-events-auto transition-all ${
                i < sets ? 'bg-white shadow-[0_0_15px_rgba(255,255,255,0.8)]' : 'bg-white/20'
              }`}
            />
          ))}
        </div>
      </div>
    );
  };

  return (
    <div className="h-screen bg-[#020617] text-white flex flex-col font-sans overflow-hidden p-2 sm:p-4 box-border">
      {/* Portrait Orientation Hint */}
      <div className="fixed inset-0 z-[100] bg-[#020617] flex flex-col items-center justify-center p-10 text-center sm:hidden portrait:flex hidden">
        <motion.div
          animate={{ scale: [1, 1.1, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="mb-8 p-8 bg-slate-900 rounded-[40px] border border-slate-800"
        >
          <ArrowLeftRight size={80} className="text-[#facc15]" />
        </motion.div>
        <h3 className="text-3xl font-black mb-4">建議旋轉設備</h3>
        <p className="text-slate-500 text-lg">使用橫向模式以獲得最佳視野</p>
      </div>

      {/* Header - Auto-height flex row */}
      <header className="flex-none flex justify-between items-center px-2 py-1 sm:py-2">
        <div className="bg-white/5 border border-white/10 rounded-full px-3 py-1 text-[#94a3b8] font-black text-[10px] sm:text-xs tracking-widest uppercase">
          SET {state.setsA + state.setsB + 1}
        </div>
        
        <div className="flex items-center gap-6 sm:gap-12 text-xs sm:text-lg font-black text-slate-500">
           <span className={state.setsA > state.setsB ? 'text-[#3b82f6]' : ''}>SETS {state.setsA}</span>
           <span className="opacity-20 text-[10px]">|</span>
           <span className={state.setsB > state.setsA ? 'text-[#ef4444]' : ''}>SETS {state.setsB}</span>
        </div>

        <div className="text-slate-600 font-bold text-[10px] sm:text-sm tabular-nums">
          {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })}
        </div>
      </header>

      {/* Scoreboard Area - Flex-1 with horizontal gap */}
      <main className="flex-1 flex gap-2 sm:gap-4 relative my-1 sm:my-2 overflow-hidden">
        <TeamPanel side={isSwapped ? 'B' : 'A'} color={isSwapped ? 'red' : 'blue'} />
        <TeamPanel side={isSwapped ? 'A' : 'B'} color={isSwapped ? 'blue' : 'red'} />

        {/* Timeout Timer Overlay */}
        <AnimatePresence>
          {timeoutTimer !== null && (
            <motion.div
              initial={{ opacity: 0, scale: 1.1 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              className="absolute inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4"
            >
              <div className="bg-slate-900 rounded-[30px] sm:rounded-[60px] p-8 sm:p-20 shadow-[0_0_100px_rgba(0,0,0,1)] border border-slate-700 flex flex-col items-center gap-2 sm:gap-6 pointer-events-auto">
                <span className="text-xs sm:text-xl uppercase font-black tracking-[0.6em] text-[#facc15]">Timeout</span>
                <span className="text-8xl sm:text-[15rem] leading-none font-black text-white">{timeoutTimer}</span>
                <button 
                  onClick={() => setTimeoutTimer(null)}
                  className="mt-2 sm:mt-10 px-8 py-3 sm:px-16 sm:py-6 bg-white text-black rounded-3xl font-black uppercase text-xs sm:text-xl hover:bg-[#facc15] transition-all"
                >
                  Dismiss
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Control Actions - Responsive row */}
      <div className="flex-none grid grid-cols-4 gap-2 sm:gap-4 pt-1">
        <button 
          onClick={undo}
          disabled={history.length === 0}
          className="bg-white/5 border border-white/10 text-white rounded-xl sm:rounded-2xl py-2 sm:py-4 font-black text-[10px] sm:text-sm active:scale-95 disabled:opacity-20"
        >
          UNDO
        </button>

        <button 
          onClick={() => setIsSwapped(!isSwapped)}
          className="bg-white/5 border border-white/10 text-white rounded-xl sm:rounded-2xl py-2 sm:py-4 font-black text-[10px] sm:text-sm active:scale-95"
        >
          SWAP
        </button>

        <button 
          onClick={resetSet}
          className="bg-white/10 border border-white/20 text-[#facc15] rounded-xl sm:rounded-2xl py-2 sm:py-4 font-black text-[10px] sm:text-sm active:scale-95"
        >
          NEXT SET
        </button>

        <button 
          onClick={resetMatch}
          className="bg-white/5 border border-white/10 text-slate-500 rounded-xl sm:rounded-2xl py-2 sm:py-4 font-black text-[10px] sm:text-sm active:scale-95"
        >
          RESET
        </button>
      </div>
    </div>
  );
}


