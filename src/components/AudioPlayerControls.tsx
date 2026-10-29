import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Gauge,
  Music2,
} from 'lucide-react';
import { AudioTrack, AudioEngineStats } from '../types/audio';

interface AudioPlayerControlsProps {
  currentTrack: AudioTrack | null;
  stats: AudioEngineStats;
  isPlaying: boolean;
  onTogglePlay: () => void;
  onNextTrack: () => void;
  onPrevTrack: () => void;
  onSeek: (seconds: number) => void;
  playbackRate: number;
  onChangePlaybackRate: (rate: number) => void;
  masterVolume: number;
  onChangeMasterVolume: (vol: number) => void;
  shuffle: boolean;
  onToggleShuffle: () => void;
  repeatMode: 'off' | 'all' | 'one';
  onToggleRepeat: () => void;
  onOpenLibrary: () => void;
}

export const AudioPlayerControls: React.FC<AudioPlayerControlsProps> = ({
  currentTrack,
  stats,
  isPlaying,
  onTogglePlay,
  onNextTrack,
  onPrevTrack,
  onSeek,
  playbackRate,
  onChangePlaybackRate,
  masterVolume,
  onChangeMasterVolume,
  shuffle,
  onToggleShuffle,
  repeatMode,
  onToggleRepeat,
  onOpenLibrary,
}) => {
  const formatTime = (secs: number) => {
    if (isNaN(secs) || secs < 0) return '0:00';
    const m = Math.floor(secs / 60);
    const s = Math.floor(secs % 60);
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const progressPercent = stats.duration > 0 ? (stats.currentTime / stats.duration) * 100 : 0;

  return (
    <div className="w-full bg-slate-900/90 backdrop-blur-md border border-slate-800/80 p-4 rounded-2xl shadow-xl flex flex-col gap-3">
      {/* Waveform / Scrubbing Progress Bar */}
      <div className="flex items-center gap-3">
        <span className="text-[11px] font-mono text-slate-400 w-10 text-right">
          {formatTime(stats.currentTime)}
        </span>

        <div className="relative flex-1 h-3 bg-slate-950 rounded-full border border-slate-800/80 cursor-pointer overflow-hidden group">
          {/* Active Fill */}
          <div
            className="absolute top-0 bottom-0 left-0 bg-gradient-to-r from-cyan-500 to-pink-500 rounded-full transition-all duration-100"
            style={{ width: `${progressPercent}%` }}
          />

          <input
            type="range"
            min="0"
            max={stats.duration || 100}
            value={stats.currentTime || 0}
            onChange={(e) => onSeek(parseFloat(e.target.value))}
            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          />
        </div>

        <span className="text-[11px] font-mono text-slate-400 w-10">
          {formatTime(stats.duration)}
        </span>
      </div>

      {/* Main Track Info & Player Action Row */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        {/* Track Info Lockup */}
        <div
          onClick={onOpenLibrary}
          className="flex items-center gap-3 cursor-pointer group hover:opacity-90 transition-opacity max-w-xs"
        >
          <div className="w-12 h-12 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-center overflow-hidden shrink-0 shadow-md">
            {currentTrack?.coverUrl ? (
              <img
                src={currentTrack.coverUrl}
                alt={currentTrack.title}
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            ) : (
              <Music2 className="w-6 h-6 text-cyan-400 group-hover:scale-110 transition-transform" />
            )}
          </div>
          <div className="truncate">
            <h3 className="text-sm font-bold text-white truncate group-hover:text-cyan-400 transition-colors">
              {currentTrack ? currentTrack.title : 'No Track Selected'}
            </h3>
            <p className="text-xs text-slate-400 truncate">
              {currentTrack ? `${currentTrack.artist} · ${currentTrack.album}` : 'Tap to open library'}
            </p>
          </div>
        </div>

        {/* Center Transport Controls */}
        <div className="flex items-center gap-3">
          {/* Shuffle Toggle */}
          <button
            onClick={onToggleShuffle}
            className={`p-2 rounded-xl transition-colors ${
              shuffle ? 'text-cyan-400 bg-cyan-950/60 border border-cyan-800/60' : 'text-slate-400 hover:text-slate-200'
            }`}
            title="Toggle Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          {/* Previous Track */}
          <button
            onClick={onPrevTrack}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Previous Track"
          >
            <SkipBack className="w-5 h-5" />
          </button>

          {/* Play / Pause Primary CTA */}
          <button
            onClick={onTogglePlay}
            className="w-12 h-12 rounded-2xl bg-gradient-to-r from-cyan-500 to-pink-500 text-slate-950 font-bold shadow-lg shadow-cyan-500/20 hover:scale-105 active:scale-95 flex items-center justify-center transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-6 h-6 fill-current" />
            ) : (
              <Play className="w-6 h-6 fill-current ml-0.5" />
            )}
          </button>

          {/* Next Track */}
          <button
            onClick={onNextTrack}
            className="p-2 text-slate-300 hover:text-white hover:bg-slate-800/80 rounded-xl transition-colors"
            title="Next Track"
          >
            <SkipForward className="w-5 h-5" />
          </button>

          {/* Repeat Toggle */}
          <button
            onClick={onToggleRepeat}
            className={`p-2 rounded-xl transition-colors ${
              repeatMode !== 'off'
                ? 'text-pink-400 bg-pink-950/60 border border-pink-800/60'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={`Repeat: ${repeatMode.toUpperCase()}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Speed / Pitch & Volume Control */}
        <div className="flex items-center gap-4 shrink-0">
          {/* Playback Rate Speed/Pitch */}
          <div className="flex items-center gap-1.5 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            <Gauge className="w-3.5 h-3.5 text-cyan-400" />
            <span className="text-[10px] font-mono font-bold text-slate-300 w-8">
              {playbackRate.toFixed(2)}x
            </span>
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={playbackRate}
              onChange={(e) => onChangePlaybackRate(parseFloat(e.target.value))}
              className="w-16 h-1 accent-cyan-400 cursor-pointer"
              title="Pitch / Speed Control"
            />
          </div>

          {/* Master Volume */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-2.5 py-1.5 rounded-xl border border-slate-800">
            {masterVolume === 0 ? (
              <VolumeX className="w-4 h-4 text-slate-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-slate-300" />
            )}
            <input
              type="range"
              min="0"
              max="1.2"
              step="0.02"
              value={masterVolume}
              onChange={(e) => onChangeMasterVolume(parseFloat(e.target.value))}
              className="w-20 h-1 accent-pink-500 cursor-pointer"
              title="Master Volume"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
