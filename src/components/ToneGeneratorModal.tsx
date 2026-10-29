import React, { useState } from 'react';
import { Activity, Power, X } from 'lucide-react';
import { AudioEngine } from '../audio/AudioEngine';

interface ToneGeneratorModalProps {
  isOpen: boolean;
  onClose: () => void;
  engine: AudioEngine;
}

export const ToneGeneratorModal: React.FC<ToneGeneratorModalProps> = ({
  isOpen,
  onClose,
  engine,
}) => {
  const [waveType, setWaveType] = useState<OscillatorType | 'noise'>('sine');
  const [frequency, setFrequency] = useState<number>(440);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleToggleGenerator = () => {
    if (isGenerating) {
      engine.stopToneGenerator();
      setIsGenerating(false);
    } else {
      engine.startToneGenerator(waveType, frequency);
      setIsGenerating(true);
    }
  };

  const handleFreqChange = (freq: number) => {
    setFrequency(freq);
    if (isGenerating) {
      engine.startToneGenerator(waveType, freq);
    }
  };

  const handleWaveTypeChange = (type: OscillatorType | 'noise') => {
    setWaveType(type);
    if (isGenerating) {
      engine.startToneGenerator(type, frequency);
    }
  };

  const quickFreqs = [
    { label: '20Hz Sub', hz: 20 },
    { label: '40Hz Sub-Bass', hz: 40 },
    { label: '60Hz Bass', hz: 60 },
    { label: '440Hz A4', hz: 440 },
    { label: '1kHz Mid', hz: 1000 },
    { label: '10kHz Treble', hz: 10000 },
  ];

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4">
      <div className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-slate-800">
          <div className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-amber-400" />
            <h2 className="text-base font-bold text-white">Audio Signal &amp; Frequency Generator</h2>
          </div>
          <button
            onClick={() => {
              if (isGenerating) {
                engine.stopToneGenerator();
                setIsGenerating(false);
              }
              onClose();
            }}
            className="p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="p-4 flex flex-col gap-5">
          {/* Waveform Switcher */}
          <div className="flex flex-col gap-2">
            <label className="text-xs uppercase font-bold text-slate-400">Waveform Type</label>
            <div className="grid grid-cols-3 gap-1.5">
              {(['sine', 'square', 'sawtooth', 'triangle', 'noise'] as const).map((w) => (
                <button
                  key={w}
                  onClick={() => handleWaveTypeChange(w)}
                  className={`py-2 text-xs font-bold rounded-xl uppercase transition-colors ${
                    waveType === w
                      ? 'bg-amber-500 text-slate-950 shadow-md'
                      : 'bg-slate-950 text-slate-400 hover:text-slate-200 border border-slate-800'
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>
          </div>

          {/* Frequency Controls (if not noise) */}
          {waveType !== 'noise' && (
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between text-xs font-bold text-slate-300">
                <span>Frequency</span>
                <span className="font-mono text-amber-400 text-base">{frequency} Hz</span>
              </div>

              <input
                type="range"
                min="20"
                max="20000"
                step="1"
                value={frequency}
                onChange={(e) => handleFreqChange(parseInt(e.target.value))}
                className="w-full h-2 accent-amber-400 cursor-pointer"
              />

              {/* Quick Freq Preset Buttons */}
              <div className="grid grid-cols-3 gap-1.5">
                {quickFreqs.map((q) => (
                  <button
                    key={q.hz}
                    onClick={() => handleFreqChange(q.hz)}
                    className="py-1 px-2 text-[10px] font-semibold bg-slate-950 border border-slate-800 text-slate-300 hover:text-white rounded-lg transition-colors"
                  >
                    {q.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Start / Stop Power Button */}
          <button
            onClick={handleToggleGenerator}
            className={`w-full py-3 rounded-xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-lg ${
              isGenerating
                ? 'bg-red-500/20 text-red-300 border border-red-500/50 shadow-red-500/10'
                : 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-amber-500/20'
            }`}
          >
            <Power className="w-5 h-5" />
            <span>{isGenerating ? 'STOP SIGNAL' : 'START TONE GENERATOR'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
