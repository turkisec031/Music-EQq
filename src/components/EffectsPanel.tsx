import React from 'react';
import { RotaryKnob } from './RotaryKnob';
import { ReverbPresetName } from '../types/audio';
import { Sparkles, Disc, Radio, Building2 } from 'lucide-react';

interface EffectsPanelProps {
  bassBoost: number;
  onChangeBassBoost: (val: number) => void;
  treble: number;
  onChangeTreble: (val: number) => void;
  virtualizer: number;
  onChangeVirtualizer: (val: number) => void;
  reverbPreset: ReverbPresetName;
  reverbLevel: number;
  onChangeReverb: (preset: ReverbPresetName, level: number) => void;
  stereoBalance: number;
  onChangeStereoBalance: (pan: number) => void;
}

export const EffectsPanel: React.FC<EffectsPanelProps> = ({
  bassBoost,
  onChangeBassBoost,
  treble,
  onChangeTreble,
  virtualizer,
  onChangeVirtualizer,
  reverbPreset,
  reverbLevel,
  onChangeReverb,
  stereoBalance,
  onChangeStereoBalance,
}) => {
  const reverbOptions: { name: ReverbPresetName; label: string }[] = [
    { name: 'off', label: 'OFF' },
    { name: 'room', label: 'ROOM' },
    { name: 'studio', label: 'STUDIO' },
    { name: 'hall', label: 'HALL' },
    { name: 'arena', label: 'ARENA' },
    { name: 'club', label: 'CLUB' },
  ];

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col gap-5">
      <div className="flex items-center justify-between border-b border-slate-800/80 pb-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-pink-400" />
          <span>Audio FX &amp; Spatial Processing</span>
        </h3>
        <span className="text-[10px] font-mono text-slate-400">Poweramp DSP FX Core</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-5 gap-4 items-center">
        {/* Bass Boost Knob */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <RotaryKnob
            label="Bass Boost"
            value={bassBoost}
            min={0}
            max={100}
            unit="%"
            glowColor="#ff007f"
            onChange={onChangeBassBoost}
            onReset={() => onChangeBassBoost(0)}
          />
        </div>

        {/* Treble Knob */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <RotaryKnob
            label="Treble"
            value={treble}
            min={0}
            max={100}
            unit="%"
            glowColor="#ffe600"
            onChange={onChangeTreble}
            onReset={() => onChangeTreble(0)}
          />
        </div>

        {/* 3D Virtualizer Knob */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <RotaryKnob
            label="3D Surround"
            value={virtualizer}
            min={0}
            max={100}
            unit="%"
            glowColor="#00f3ff"
            onChange={onChangeVirtualizer}
            onReset={() => onChangeVirtualizer(0)}
          />
        </div>

        {/* Reverb Level Knob */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
          <RotaryKnob
            label="Reverb Wet"
            value={reverbLevel}
            min={0}
            max={100}
            unit="%"
            glowColor="#a100ff"
            onChange={(lvl) => onChangeReverb(reverbPreset, lvl)}
            onReset={() => onChangeReverb(reverbPreset, 0)}
          />
        </div>

        {/* Reverb Environment Selector */}
        <div className="col-span-2 sm:col-span-4 lg:col-span-1 flex flex-col gap-2 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 justify-center">
          <label className="text-[10px] uppercase font-semibold text-slate-400 tracking-wider text-center flex items-center justify-center gap-1">
            <Building2 className="w-3 h-3 text-purple-400" />
            <span>Room Acoustic</span>
          </label>
          <div className="grid grid-cols-3 gap-1">
            {reverbOptions.map((opt) => (
              <button
                key={opt.name}
                onClick={() => onChangeReverb(opt.name, reverbLevel || 25)}
                className={`px-2 py-1 text-[10px] font-bold rounded-lg transition-colors ${
                  reverbPreset === opt.name
                    ? 'bg-purple-600 text-white shadow-sm'
                    : 'bg-slate-900 text-slate-400 hover:text-slate-200'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Stereo Balance Slider */}
      <div className="flex items-center gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
        <Disc className="w-4 h-4 text-slate-400 shrink-0" />
        <span className="text-xs font-semibold text-slate-300 shrink-0 w-16">
          Balance L/R
        </span>
        <span className="text-[10px] font-mono text-slate-400 shrink-0">L</span>
        <input
          type="range"
          min="-1.0"
          max="1.0"
          step="0.05"
          value={stereoBalance}
          onChange={(e) => onChangeStereoBalance(parseFloat(e.target.value))}
          className="flex-1 h-1.5 accent-cyan-400 cursor-pointer"
        />
        <span className="text-[10px] font-mono text-slate-400 shrink-0">R</span>
        <button
          onClick={() => onChangeStereoBalance(0)}
          className="text-[10px] font-semibold text-slate-400 hover:text-white px-2 py-0.5 rounded bg-slate-900 border border-slate-800 shrink-0"
        >
          Center
        </button>
      </div>
    </div>
  );
};
