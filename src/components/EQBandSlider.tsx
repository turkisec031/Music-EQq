import React from 'react';

interface EQBandSliderProps {
  freqLabel: string;
  gain: number; // dB (-12 to +12)
  glowColor?: string;
  onChange: (gain: number) => void;
  onReset: () => void;
}

export const EQBandSlider: React.FC<EQBandSliderProps> = ({
  freqLabel,
  gain,
  glowColor = '#00f3ff',
  onChange,
  onReset,
}) => {
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onChange(parseFloat(e.target.value));
  };

  // Convert -12 to +12 into height percentage for active fill (0 to 100%)
  const norm = (gain + 12) / 24;
  const isPositive = gain >= 0;

  return (
    <div className="flex flex-col items-center justify-between h-56 w-10 sm:w-12 bg-slate-900/60 p-1.5 rounded-xl border border-slate-800/80 shadow-inner group select-none">
      {/* Top dB Readout */}
      <div className="text-[10px] font-mono font-bold tracking-tight text-slate-300">
        {gain > 0 ? `+${gain.toFixed(1)}` : gain.toFixed(1)}
      </div>

      {/* Slider Track Area */}
      <div
        className="relative flex-1 w-full flex items-center justify-center my-2 cursor-pointer"
        onDoubleClick={onReset}
        title={`Double click to reset ${freqLabel} to 0dB`}
      >
        {/* Outer Slot */}
        <div className="absolute w-2 h-full bg-slate-950 rounded-full border border-slate-800/80 shadow-inner overflow-hidden">
          {/* Zero Notch Reference Line */}
          <div className="absolute top-1/2 left-0 right-0 h-[1px] bg-slate-600/80 z-10" />

          {/* Active Gain Bar (Grows up or down from center zero) */}
          <div
            className="absolute left-0 right-0 transition-all duration-75 rounded-full"
            style={{
              top: isPositive ? `${(1 - norm) * 100}%` : '50%',
              height: isPositive ? `${(norm - 0.5) * 100}%` : `${(0.5 - norm) * 100}%`,
              backgroundColor: glowColor,
              boxShadow: `0 0 8px ${glowColor}`,
            }}
          />
        </div>

        {/* Vertical HTML Range Input */}
        <input
          type="range"
          min="-12"
          max="12"
          step="0.5"
          value={gain}
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
        />

        {/* Floating Tactile Fader Knob Handle */}
        <div
          className="absolute left-1/2 -translate-x-1/2 w-7 h-4 bg-gradient-to-b from-slate-700 via-slate-800 to-slate-950 border border-slate-600 rounded shadow-md pointer-events-none flex items-center justify-center transition-all duration-75"
          style={{
            bottom: `calc(${norm * 100}% - 8px)`,
            borderColor: gain !== 0 ? glowColor : '#475569',
            boxShadow: gain !== 0 ? `0 0 8px ${glowColor}` : '0 2px 4px rgba(0,0,0,0.5)',
          }}
        >
          {/* Horizontal Grip Line */}
          <div
            className="w-4 h-[2px] rounded"
            style={{ backgroundColor: gain !== 0 ? glowColor : '#94a3b8' }}
          />
        </div>
      </div>

      {/* Bottom Frequency Label */}
      <div className="text-[10px] font-semibold text-slate-400 group-hover:text-slate-200 tracking-wider">
        {freqLabel}
      </div>
    </div>
  );
};
