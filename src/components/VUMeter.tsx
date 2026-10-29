import React from 'react';

interface VUMeterProps {
  leftPeak: number; // 0 to 1
  rightPeak: number; // 0 to 1
  isClipping: boolean;
}

export const VUMeter: React.FC<VUMeterProps> = ({ leftPeak, rightPeak, isClipping }) => {
  const numSegments = 16;

  const renderMeterBar = (peak: number, label: string) => {
    const activeSegments = Math.round(peak * numSegments);

    return (
      <div className="flex items-center gap-1.5 w-full">
        <span className="text-[9px] font-mono font-bold text-slate-400 w-3">{label}</span>
        <div className="flex-1 flex gap-0.5 h-3 bg-slate-950 p-0.5 rounded border border-slate-800/80">
          {Array.from({ length: numSegments }).map((_, i) => {
            const isActive = i < activeSegments;
            let color = 'bg-emerald-500';
            if (i >= 11) color = 'bg-yellow-400';
            if (i >= 14) color = 'bg-red-500';

            return (
              <div
                key={i}
                className={`flex-1 h-full rounded-[1px] transition-opacity duration-75 ${
                  isActive ? `${color} opacity-100 shadow-[0_0_4px_currentColor]` : 'bg-slate-800/40 opacity-30'
                }`}
              />
            );
          })}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 w-full bg-slate-900/80 p-2 rounded-xl border border-slate-800/80 shadow-inner">
      <div className="flex items-center justify-between text-[10px] font-mono text-slate-400 mb-0.5">
        <span className="font-semibold uppercase tracking-wider">L / R Output Peak</span>
        {/* Clip Alert Badge */}
        <div className="flex items-center gap-1">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              isClipping ? 'bg-red-500 shadow-[0_0_8px_#ef4444] animate-pulse' : 'bg-slate-700'
            }`}
          />
          <span className={`text-[9px] font-bold ${isClipping ? 'text-red-400' : 'text-slate-500'}`}>
            CLIP
          </span>
        </div>
      </div>

      {renderMeterBar(leftPeak, 'L')}
      {renderMeterBar(rightPeak, 'R')}
    </div>
  );
};
