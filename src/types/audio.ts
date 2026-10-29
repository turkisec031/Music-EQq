export type EQMode = '10-band' | '15-band';

export interface EQBand {
  id: string;
  frequency: number; // Hz
  label: string;
  gain: number; // dB (-12 to +12)
  type?: BiquadFilterType;
  q?: number; // Quality factor
}

export interface EQPreset {
  id: string;
  name: string;
  category: 'factory' | 'user';
  mode: EQMode;
  preamp: number; // dB
  gains: number[]; // Gain per band in dB
  bassBoost?: number; // 0 to 100
  treble?: number; // 0 to 100
  virtualizer?: number; // 0 to 100
  reverbPreset?: ReverbPresetName;
  reverbLevel?: number; // 0 to 100
}

export type ReverbPresetName = 'off' | 'room' | 'studio' | 'hall' | 'arena' | 'club';

export type VisualizerStyle = 'neon-waves' | '3d-bars' | 'oscilloscope' | 'radial-portal';

export type VisualizerTheme = 'cyberpunk' | 'acid' | 'solar' | 'cobalt' | 'violet';

export interface ThemeColors {
  primary: string; // Hex
  secondary: string;
  accent: string;
  glow: string;
  gradient: [string, string, string];
}

export interface AudioTrack {
  id: string;
  title: string;
  artist: string;
  album: string;
  duration: number; // seconds
  url: string; // Blob URL or data URL
  coverUrl?: string;
  isDemo?: boolean;
}

export type AudioInputSourceMode = 'demo-player' | 'local-files' | 'microphone' | 'tone-generator';

export interface AudioEngineStats {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  sampleRate: number;
  bufferSize: number;
  leftPeak: number; // 0 to 1
  rightPeak: number; // 0 to 1
  isClipping: boolean;
  cpuLoadEstimate: number;
}

export interface BatterySettings {
  batterySaver: boolean;
  targetFPS: 30 | 60;
  canvasScale: 0.5 | 0.75 | 1.0;
  autoPauseWhenHidden: boolean;
}
