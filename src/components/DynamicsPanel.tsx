import React from 'react';
import { VUMeter } from './VUMeter';
import { ShieldCheck, Cpu, Radio } from 'lucide-react';
import { AudioEngineStats } from '../types/audio';

interface DynamicsPanelProps {
  stats: AudioEngineStats;
}

export const DynamicsPanel: React.FC<DynamicsPanelProps> = ({ stats }) => {
  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-4 sm:p-5 rounded-2xl shadow-xl flex flex-col md:flex-row items-center justify-between gap-6">
      {/* VU Meter Output */}
      <div className="w-full md:w-1/2">
        <VUMeter leftPeak={stats.leftPeak} rightPeak={stats.rightPeak} isClipping={stats.isClipping} />
      </div>

      {/* Limiter / Dynamics Info Badge */}
      <div className="w-full md:w-1/2 grid grid-cols-2 gap-3">
        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <ShieldCheck className="w-5 h-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">Audio Limiter</div>
            <div className="text-xs font-semibold text-slate-200">Anti-Clip Active</div>
          </div>
        </div>

        <div className="bg-slate-950/80 p-3 rounded-xl border border-slate-800/80 flex items-center gap-3">
          <Cpu className="w-5 h-5 text-cyan-400 shrink-0" />
          <div>
            <div className="text-[10px] uppercase font-bold text-slate-400">DSP CPU Load</div>
            <div className="text-xs font-semibold text-slate-200">
              ~{stats.cpuLoadEstimate.toFixed(1)}% <span className="text-[9px] text-emerald-400">(Low Latency)</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
