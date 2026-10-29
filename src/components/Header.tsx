import React from 'react';
import {
  Sliders,
  Battery,
  Maximize2,
  Library,
  Mic,
  Activity,
  Zap,
  BookmarkPlus,
} from 'lucide-react';
import { EQPreset, AudioInputSourceMode, BatterySettings } from '../types/audio';

interface HeaderProps {
  presets: EQPreset[];
  currentPresetId: string;
  onSelectPreset: (preset: EQPreset) => void;
  inputMode: AudioInputSourceMode;
  onSelectInputMode: (mode: AudioInputSourceMode) => void;
  battery: BatterySettings;
  onToggleBatterySaver: () => void;
  onOpenLibrary: () => void;
  onOpenPresetManager: () => void;
  onOpenToneGenerator: () => void;
  isFullscreenVisualizer: boolean;
  onToggleFullscreenVisualizer: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  presets,
  currentPresetId,
  onSelectPreset,
  inputMode,
  onSelectInputMode,
  battery,
  onToggleBatterySaver,
  onOpenLibrary,
  onOpenPresetManager,
  onOpenToneGenerator,
  isFullscreenVisualizer,
  onToggleFullscreenVisualizer,
}) => {
  return (
    <header className="w-full bg-slate-950/90 backdrop-blur-md border-b border-slate-800/80 px-4 py-3 sticky top-0 z-40 flex flex-wrap items-center justify-between gap-4">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-cyan-500 to-pink-600 p-0.5 shadow-lg shadow-cyan-500/20 flex items-center justify-center">
          <div className="w-full h-full bg-slate-950 rounded-[10px] flex items-center justify-center">
            <Sliders className="w-5 h-5 text-cyan-400" />
          </div>
        </div>
        <div>
          <h1 className="text-base font-bold tracking-tight text-white flex items-center gap-2">
            PowerBass EQ
            <span className="text-[9px] font-mono font-semibold text-cyan-400 bg-cyan-950/80 px-1.5 py-0.5 rounded border border-cyan-800/60">
              PRO DSP
            </span>
          </h1>
          <p className="text-[11px] text-slate-400 hidden sm:block">
            Low Latency Offline Audio Equalizer
          </p>
        </div>
      </div>

      {/* Center Zone: Input Source Selector */}
      <div className="flex items-center gap-1 bg-slate-900/90 p-1 rounded-xl border border-slate-800/80 shrink-0">
        <button
          onClick={() => {
            onSelectInputMode('demo-player');
            onOpenLibrary();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            inputMode === 'demo-player' || inputMode === 'local-files'
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Music Player Library & Demo Tracks"
        >
          <Library className="w-3.5 h-3.5" />
          <span>Library</span>
        </button>

        <button
          onClick={() => onSelectInputMode('microphone')}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            inputMode === 'microphone'
              ? 'bg-pink-500/20 text-pink-300 border border-pink-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Live Device Microphone Line-In Mode"
        >
          <Mic className="w-3.5 h-3.5" />
          <span>Mic Line-In</span>
        </button>

        <button
          onClick={() => {
            onSelectInputMode('tone-generator');
            onOpenToneGenerator();
          }}
          className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition-all ${
            inputMode === 'tone-generator'
              ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
          title="Tone & Frequency Signal Generator"
        >
          <Activity className="w-3.5 h-3.5" />
          <span>Tone Gen</span>
        </button>
      </div>

      {/* Right Action Zone: Quick Presets, Battery & Visualizer */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Quick Preset Picker */}
        <div className="relative flex items-center">
          <select
            value={currentPresetId}
            onChange={(e) => {
              const selected = presets.find((p) => p.id === e.target.value);
              if (selected) onSelectPreset(selected);
            }}
            className="bg-slate-900 border border-slate-700/80 text-xs font-semibold text-slate-200 py-1.5 pl-3 pr-8 rounded-xl focus:outline-none focus:border-cyan-500 cursor-pointer appearance-none"
          >
            {presets.map((p) => (
              <option key={p.id} value={p.id} className="bg-slate-900 text-slate-200">
                {p.name}
              </option>
            ))}
          </select>
          <BookmarkPlus className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 pointer-events-none" />
        </div>

        {/* Preset Manager Button */}
        <button
          onClick={onOpenPresetManager}
          className="p-2 text-slate-400 hover:text-cyan-400 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          title="Save & Export Custom EQ Presets"
        >
          <Zap className="w-4 h-4" />
        </button>

        {/* Battery Saver Toggle */}
        <button
          onClick={onToggleBatterySaver}
          className={`flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all ${
            battery.batterySaver
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 shadow-sm'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-slate-200'
          }`}
          title="Battery Saver Mode (Caps FPS & pauses rendering when hidden)"
        >
          <Battery className="w-3.5 h-3.5" />
          <span className="hidden md:inline">{battery.batterySaver ? 'Saver On' : '30/60 FPS'}</span>
        </button>

        {/* Fullscreen Visualizer Button */}
        <button
          onClick={onToggleFullscreenVisualizer}
          className="p-2 text-slate-300 bg-slate-900 hover:bg-slate-800 rounded-xl border border-slate-800 transition-colors"
          title="Toggle Fullscreen Beat Visualizer"
        >
          <Maximize2 className="w-4 h-4" />
        </button>
      </div>
    </header>
  );
};
