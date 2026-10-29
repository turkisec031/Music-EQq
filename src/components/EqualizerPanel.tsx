import React from 'react';
import { EQMode, EQPreset } from '../types/audio';
import { FREQUENCY_LABELS_10_BAND, FREQUENCY_LABELS_15_BAND } from '../constants/presets';
import { EQBandSlider } from './EQBandSlider';
import { RotaryKnob } from './RotaryKnob';
import { Power, RotateCcw } from 'lucide-react';

interface EqualizerPanelProps {
  mode: EQMode;
  onToggleMode: (mode: EQMode) => void;
  bypass: boolean;
  onToggleBypass: () => void;
  preamp: number;
  onChangePreamp: (dB: number) => void;
  gains: number[];
  onChangeBandGain: (index: number, dB: number) => void;
  onResetFlat: () => void;
  activePreset: EQPreset | null;
}

export const EqualizerPanel: React.FC<EqualizerPanelProps> = ({
  mode,
  onToggleMode,
  bypass,
  onToggleBypass,
  preamp,
  onChangePreamp,
  gains,
  onChangeBandGain,
  onResetFlat,
  activePreset,
}) => {
  const freqLabels = mode === '10-band' ? FREQUENCY_LABELS_10_BAND : FREQUENCY_LABELS_15_BAND;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col gap-5">
      {/* Top Controls Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-800/80 pb-4">
        {/* Left: Power Bypass & Active Preset Badge */}
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleBypass}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-bold transition-all shadow-sm ${
              !bypass
                ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/50 shadow-cyan-500/10'
                : 'bg-slate-950 text-slate-500 border-slate-800 hover:text-slate-300'
            }`}
            title="Toggle EQ Bypass"
          >
            <Power className={`w-4 h-4 ${!bypass ? 'text-cyan-400' : 'text-slate-500'}`} />
            <span>{bypass ? 'EQ OFF' : 'EQ ACTIVE'}</span>
          </button>

          <div className="hidden sm:flex items-center gap-1.5 text-xs text-slate-400">
            <span>Preset:</span>
            <span className="font-semibold text-slate-200">
              {activePreset ? activePreset.name : 'Custom Curve'}
            </span>
          </div>
        </div>

        {/* Center: 10-Band vs 15-Band Segmented Mode Control */}
        <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800/80">
          <button
            onClick={() => onToggleMode('10-band')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              mode === '10-band'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            10-BAND
          </button>

          <button
            onClick={() => onToggleMode('15-band')}
            className={`px-3 py-1 text-xs font-bold rounded-lg transition-colors ${
              mode === '15-band'
                ? 'bg-gradient-to-r from-cyan-500 to-blue-600 text-slate-950 shadow-sm'
                : 'text-slate-400 hover:text-slate-200'
            }`}
          >
            15-BAND STUDIO
          </button>
        </div>

        {/* Right: Reset Flat */}
        <button
          onClick={onResetFlat}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-950 hover:bg-slate-800 border border-slate-800 text-xs font-semibold text-slate-300 hover:text-white transition-colors"
          title="Reset all bands to 0 dB Flat"
        >
          <RotateCcw className="w-3.5 h-3.5 text-slate-400" />
          <span>Reset Flat</span>
        </button>
      </div>

      {/* Main EQ Sliders Container with Preamp Knob */}
      <div className={`flex flex-col lg:flex-row items-center gap-6 ${bypass ? 'opacity-40 pointer-events-none' : ''}`}>
        {/* Preamp Knob Section */}
        <div className="flex flex-col items-center justify-center bg-slate-950/80 p-4 rounded-xl border border-slate-800/80 min-w-[120px] shrink-0">
          <RotaryKnob
            label="Preamp"
            value={preamp}
            min={-12}
            max={12}
            step={0.5}
            unit="dB"
            glowColor="#00f3ff"
            onChange={onChangePreamp}
            onReset={() => onChangePreamp(0)}
          />
        </div>

        {/* Frequency Band Sliders Horizontal Scroll / Grid */}
        <div className="flex-1 w-full overflow-x-auto pb-2 scrollbar-thin scrollbar-thumb-slate-800">
          <div className="flex items-center justify-between gap-2 min-w-max px-1">
            {freqLabels.map((label, idx) => (
              <EQBandSlider
                key={`${mode}-${idx}`}
                freqLabel={label}
                gain={gains[idx] ?? 0}
                glowColor="#00f3ff"
                onChange={(gain) => onChangeBandGain(idx, gain)}
                onReset={() => onChangeBandGain(idx, 0)}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
