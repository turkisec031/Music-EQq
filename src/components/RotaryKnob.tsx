import React, { useState, useRef, useCallback } from 'react';

interface RotaryKnobProps {
  label: string;
  value: number; // e.g. 0 to 100 or -12 to 12
  min: number;
  max: number;
  step?: number;
  unit?: string;
  glowColor?: string; // e.g. #00f3ff
  onChange: (val: number) => void;
  onReset?: () => void;
}

export const RotaryKnob: React.FC<RotaryKnobProps> = ({
  label,
  value,
  min,
  max,
  step = 1,
  unit = '%',
  glowColor = '#00f3ff',
  onChange,
  onReset,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const startValueRef = useRef(value);

  // Map value to angle (-135 deg to +135 deg)
  const norm = (value - min) / (max - min);
  const angle = -135 + norm * 270;

  const handlePointerDown = (e: React.PointerEvent) => {
    setIsDragging(true);
    startYRef.current = e.clientY;
    startValueRef.current = value;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
  };

  const handlePointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!isDragging) return;
      const deltaY = startYRef.current - e.clientY; // drag up to increase
      const range = max - min;
      const sensitivity = range / 160; // 160px for full sweep
      let newValue = startValueRef.current + deltaY * sensitivity;

      if (step) {
        newValue = Math.round(newValue / step) * step;
      }

      newValue = Math.max(min, Math.min(max, newValue));
      onChange(newValue);
    },
    [isDragging, min, max, step, onChange]
  );

  const handlePointerUp = (e: React.PointerEvent) => {
    setIsDragging(false);
    try {
      (e.target as HTMLElement).releasePointerCapture(e.pointerId);
    } catch {}
  };

  const handleDoubleClick = () => {
    if (onReset) onReset();
    else onChange((min + max) / 2);
  };

  return (
    <div className="flex flex-col items-center justify-center select-none group">
      {/* Knob Container */}
      <div
        className="relative w-16 h-16 flex items-center justify-center cursor-ns-resize touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onDoubleClick={handleDoubleClick}
        title={`Double click to reset. Drag up/down to adjust ${label}`}
      >
        {/* Outer Metallic Ring */}
        <div className="absolute inset-0 rounded-full border border-slate-700/80 bg-gradient-to-b from-slate-800 to-slate-950 shadow-inner" />

        {/* Neon Arc Ring Background */}
        <svg className="absolute inset-0 w-full h-full p-1" viewBox="0 0 100 100">
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke="#1e293b"
            strokeWidth="6"
            strokeDasharray="200"
            strokeDashoffset="50"
            transform="rotate(135 50 50)"
            strokeLinecap="round"
          />
          {/* Active Arc */}
          <circle
            cx="50"
            cy="50"
            r="42"
            fill="none"
            stroke={glowColor}
            strokeWidth="6"
            strokeDasharray="200"
            strokeDashoffset={200 - norm * 150}
            transform="rotate(135 50 50)"
            strokeLinecap="round"
            className="transition-all duration-75"
            style={{
              filter: `drop-shadow(0 0 4px ${glowColor})`,
            }}
          />
        </svg>

        {/* Center Rotary Disc */}
        <div
          className="relative w-11 h-11 rounded-full bg-gradient-to-br from-slate-800 via-slate-900 to-slate-950 border border-slate-700/60 shadow-md flex items-center justify-center transition-transform duration-75"
          style={{ transform: `rotate(${angle}deg)` }}
        >
          {/* Tactile Indicator Dot / Notch */}
          <div
            className="absolute top-1.5 w-1.5 h-3 rounded-full shadow-sm"
            style={{
              backgroundColor: glowColor,
              boxShadow: `0 0 6px ${glowColor}`,
            }}
          />
        </div>
      </div>

      {/* Value Readout & Label */}
      <div className="mt-1.5 text-center">
        <div className="text-[11px] font-mono font-bold text-slate-200 tracking-wider">
          {value > 0 && min < 0 ? `+${value.toFixed(1)}` : value.toFixed(1)}
          <span className="text-[9px] text-slate-400 ml-0.5">{unit}</span>
        </div>
        <div className="text-[10px] uppercase font-semibold tracking-wider text-slate-400 group-hover:text-slate-200 transition-colors">
          {label}
        </div>
      </div>
    </div>
  );
};
