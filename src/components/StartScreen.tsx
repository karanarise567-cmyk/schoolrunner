import React from 'react';
import { Play, BookOpen, Volume2, VolumeX, Sparkles, Bike, Bus, Award, Compass } from 'lucide-react';
import { CHARACTERS } from '../game/constants';
import { CharacterProfile } from '../types/game';

interface StartScreenProps {
  selectedCharacterId: string;
  onSelectCharacter: (id: string) => void;
  onStartGame: () => void;
  onOpenHowToPlay: () => void;
  onOpenUnityProject: () => void;
  isMuted: boolean;
  onToggleMute: () => void;
  highScore: number;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  selectedCharacterId,
  onSelectCharacter,
  onStartGame,
  onOpenHowToPlay,
  onOpenUnityProject,
  isMuted,
  onToggleMute,
  highScore,
}) => {
  return (
    <div className="absolute inset-0 z-30 flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md overflow-y-auto">
      <div className="max-w-md w-full bg-slate-900 border border-slate-700/80 rounded-3xl p-6 text-white shadow-2xl flex flex-col gap-5 my-auto">
        {/* Title Header matching the PDF Page 1 */}
        <div className="text-center space-y-1">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/40 text-blue-300 text-xs font-semibold uppercase tracking-wider">
            <span>Created for SGSU Warrior</span>
            <span>•</span>
            <span>Theme: Jugaad</span>
          </div>

          <h1 className="text-4xl sm:text-5xl font-black tracking-tight bg-gradient-to-r from-blue-400 via-indigo-300 to-amber-300 bg-clip-text text-transparent uppercase drop-shadow">
            School Runner
          </h1>
          <p className="text-xs font-medium text-slate-300">
            Race Against Time: Reach College at 1,000m before the exam gate closes!
          </p>
        </div>

        {/* Story Objective Box */}
        <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-3.5 text-xs text-slate-300 leading-relaxed shadow-inner">
          <div className="font-bold text-amber-400 mb-1 flex items-center gap-1.5 text-xs">
            <Compass className="w-4 h-4" />
            <span>Mission Objective (10 Levels • 1,000m):</span>
          </div>
          You have <strong className="text-white">3 minutes</strong> to travel 1,000 meters across 10 Indian street levels. Dodge traffic & <strong className="text-amber-300">roadside cows 🐄</strong>, manage your <strong className="text-cyan-400">100 Stamina ⚡</strong> (no auto-regen; restore only via drink pickups 🥤), and activate clever <strong className="text-amber-300">Jugaad</strong> solutions!
        </div>

        {/* Feature Preview Cards: Stamina, Drinks, Cows & Jugaad */}
        <div className="grid grid-cols-2 gap-2 text-[11px]">
          <div className="bg-cyan-950/40 border border-cyan-500/30 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xl">⚡</span>
            <div>
              <div className="font-extrabold text-cyan-300">Stamina Boost</div>
              <div className="text-slate-400 text-[10px]">Hold Boost • No Auto-Regen</div>
            </div>
          </div>
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xl">🥤</span>
            <div>
              <div className="font-extrabold text-amber-300">Drink Pickups</div>
              <div className="text-slate-400 text-[10px]">Paani, Soda, Nimbu, Lassi</div>
            </div>
          </div>
          <div className="bg-emerald-950/40 border border-emerald-500/30 rounded-xl p-2 flex items-center gap-2">
            <span className="text-xl">🐄</span>
            <div>
              <div className="font-extrabold text-emerald-300">Indian Cows</div>
              <div className="text-slate-400 text-[10px]">Roadside & Crossing Fairly</div>
            </div>
          </div>
          <div className="bg-red-950/40 border border-red-500/30 rounded-xl p-2 flex items-center gap-2">
            <Bus className="w-5 h-5 text-red-400 shrink-0" />
            <div>
              <div className="font-extrabold text-red-300">Cycle / Bus Jugaad</div>
              <div className="text-slate-400 text-[10px]">30₹ Speed • 50₹ Ram</div>
            </div>
          </div>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-bold text-slate-300 uppercase tracking-wider flex items-center justify-between">
            <span>Choose Your Student:</span>
            <span className="text-[11px] text-blue-400 font-normal">Each has special traits</span>
          </label>
          <div className="grid grid-cols-3 gap-2">
            {CHARACTERS.map((char) => {
              const isSelected = char.id === selectedCharacterId;
              return (
                <button
                  key={char.id}
                  onClick={() => onSelectCharacter(char.id)}
                  className={`flex flex-col items-center p-2.5 rounded-2xl border text-center transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-blue-600/30 border-blue-400 ring-2 ring-blue-500/50 scale-102'
                      : 'bg-slate-800/60 border-slate-700/60 hover:bg-slate-800 text-slate-400'
                  }`}
                >
                  <div className="text-3xl mb-1">{char.avatar}</div>
                  <span className="text-xs font-bold text-white truncate max-w-full">
                    {char.name.split(' ')[0]}
                  </span>
                  <span className="text-[10px] text-slate-400 leading-tight">
                    {char.title}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        {/* High Score / Best Run Indicator */}
        {highScore > 0 && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-slate-950/60 border border-slate-800 rounded-xl text-xs">
            <span className="text-slate-400 flex items-center gap-1.5">
              <Award className="w-4 h-4 text-amber-400" /> Best Distance:
            </span>
            <span className="font-black text-amber-400 font-mono">{highScore}m / 1000m</span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2 pt-1">
          <button
            onClick={onStartGame}
            className="w-full py-3.5 px-6 rounded-2xl bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-500 hover:from-blue-500 hover:to-indigo-500 active:scale-98 font-black text-base tracking-wide text-white shadow-xl shadow-blue-900/40 border border-blue-400 flex items-center justify-center gap-2 transition-all cursor-pointer"
          >
            <Play className="w-5 h-5 fill-current" />
            <span>START SPRINT TO COLLEGE</span>
          </button>

          <div className="grid grid-cols-2 gap-2 mt-1">
            <button
              onClick={onOpenHowToPlay}
              className="py-2 px-3 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700 text-xs font-semibold text-slate-300 flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <BookOpen className="w-4 h-4 text-blue-400" />
              <span>Game Rules</span>
            </button>

            <button
              onClick={onOpenUnityProject}
              className="py-2 px-3 rounded-xl bg-gradient-to-r from-blue-900/60 to-indigo-900/60 hover:from-blue-800/60 hover:to-indigo-800/60 border border-blue-500/50 text-xs font-bold text-blue-200 flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow"
            >
              <span className="text-sm">🎮</span>
              <span>Unity Setup & C#</span>
            </button>
          </div>

          <div className="flex items-center justify-between px-1">
            <button
              onClick={onToggleMute}
              className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              {isMuted ? <VolumeX className="w-3.5 h-3.5 text-red-400" /> : <Volume2 className="w-3.5 h-3.5 text-emerald-400" />}
              <span>{isMuted ? 'Sound Muted' : 'Audio On'}</span>
            </button>
            <span className="text-[10px] text-slate-500">SGSU Warrior Edition</span>
          </div>
        </div>
      </div>
    </div>
  );
};
