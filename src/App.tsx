import React, { useState, useEffect, useRef, useCallback } from 'react';
import { AudioEngine } from './audio/AudioEngine';
import { loadDefaultDemoTracks } from './audio/demoAudioGenerator';
import {
  AudioTrack,
  EQPreset,
  EQMode,
  ReverbPresetName,
  VisualizerStyle,
  VisualizerTheme,
  BatterySettings,
  AudioEngineStats,
  AudioInputSourceMode,
} from './types/audio';
import { DEFAULT_FACTORY_PRESETS, THEME_PALETTES } from './constants/presets';

// UI Components
import { Header } from './components/Header';
import { VisualizerCanvas } from './components/VisualizerCanvas';
import { EqualizerPanel } from './components/EqualizerPanel';
import { EffectsPanel } from './components/EffectsPanel';
import { DynamicsPanel } from './components/DynamicsPanel';
import { AudioPlayerControls } from './components/AudioPlayerControls';
import { TrackLibraryModal } from './components/TrackLibraryModal';
import { PresetManagerModal } from './components/PresetManagerModal';
import { ToneGeneratorModal } from './components/ToneGeneratorModal';

import { Activity, Sliders, Sparkles, Waves, BarChart3, Radio, Compass, Shield, Palette } from 'lucide-react';

export default function App() {
  // Single Audio Engine instance
  const engineRef = useRef<AudioEngine>(new AudioEngine());

  // Tracks & Library state
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState<number>(0);
  const [inputMode, setInputMode] = useState<AudioInputSourceMode>('demo-player');

  // Player Transport state
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackRate, setPlaybackRate] = useState<number>(1.0);
  const [masterVolume, setMasterVolume] = useState<number>(1.0);
  const [shuffle, setShuffle] = useState<boolean>(false);
  const [repeatMode, setRepeatMode] = useState<'off' | 'all' | 'one'>('off');

  // Stats & Metering
  const [stats, setStats] = useState<AudioEngineStats>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    sampleRate: 44100,
    bufferSize: 2048,
    leftPeak: 0,
    rightPeak: 0,
    isClipping: false,
    cpuLoadEstimate: 0,
  });

  // EQ & DSP Parameters
  const [presets, setPresets] = useState<EQPreset[]>(DEFAULT_FACTORY_PRESETS);
  const [activePresetId, setActivePresetId] = useState<string>('flat');
  const [eqMode, setEqMode] = useState<EQMode>('10-band');
  const [eqBypass, setEqBypass] = useState<boolean>(false);
  const [preamp, setPreamp] = useState<number>(0);
  const [bandGains, setBandGains] = useState<number[]>(new Array(10).fill(0));

  // Special FX Parameters
  const [bassBoost, setBassBoost] = useState<number>(0);
  const [treble, setTreble] = useState<number>(0);
  const [virtualizer, setVirtualizer] = useState<number>(0);
  const [reverbPreset, setReverbPreset] = useState<ReverbPresetName>('off');
  const [reverbLevel, setReverbLevel] = useState<number>(0);
  const [stereoBalance, setStereoBalance] = useState<number>(0);

  // Visualizer Customization
  const [visualizerStyle, setVisualizerStyle] = useState<VisualizerStyle>('neon-waves');
  const [visualizerTheme, setVisualizerTheme] = useState<VisualizerTheme>('cyberpunk');

  // Battery Efficiency Settings
  const [battery, setBattery] = useState<BatterySettings>({
    batterySaver: false,
    targetFPS: 60,
    canvasScale: 1.0,
    autoPauseWhenHidden: true,
  });

  // Modals visibility
  const [isLibraryOpen, setIsLibraryOpen] = useState<boolean>(false);
  const [isPresetManagerOpen, setIsPresetManagerOpen] = useState<boolean>(false);
  const [isToneGeneratorOpen, setIsToneGeneratorOpen] = useState<boolean>(false);
  const [isFullscreenVisualizer, setIsFullscreenVisualizer] = useState<boolean>(false);

  // Active track
  const currentTrack = tracks[currentTrackIndex] || null;

  // Load custom user presets from localStorage on initial boot
  useEffect(() => {
    try {
      const stored = localStorage.getItem('powerbass_user_presets');
      if (stored) {
        const parsed: EQPreset[] = JSON.parse(stored);
        setPresets([...DEFAULT_FACTORY_PRESETS, ...parsed]);
      }
    } catch (err) {
      console.warn('Failed to load stored custom presets:', err);
    }
  }, []);

  // Initialize offline synthesized demo audio tracks
  useEffect(() => {
    let isMounted = true;
    loadDefaultDemoTracks().then((demoTracks) => {
      if (isMounted) {
        setTracks(demoTracks);
        // Load first demo track into engine
        if (demoTracks.length > 0) {
          engineRef.current.loadAudioUrl(demoTracks[0].url);
        }
      }
    });
    return () => {
      isMounted = false;
    };
  }, []);

  // Connect AudioEngine stats listener & track ended callback
  useEffect(() => {
    const engine = engineRef.current;

    engine.setOnStatsUpdate((newStats) => {
      setStats(newStats);
      setIsPlaying(newStats.isPlaying);
    });

    engine.setOnTrackEnded(() => {
      handleNextTrack();
    });

    return () => {
      engine.destroy();
    };
  }, [currentTrackIndex, tracks, repeatMode, shuffle]);

  // Handle Next Track logic (Shuffle / Repeat support)
  const handleNextTrack = useCallback(() => {
    if (tracks.length === 0) return;

    if (repeatMode === 'one') {
      engineRef.current.seek(0);
      engineRef.current.play();
      return;
    }

    let nextIdx = currentTrackIndex + 1;
    if (shuffle) {
      nextIdx = Math.floor(Math.random() * tracks.length);
    } else if (nextIdx >= tracks.length) {
      nextIdx = repeatMode === 'all' ? 0 : tracks.length - 1;
    }

    setCurrentTrackIndex(nextIdx);
    const nextTrack = tracks[nextIdx];
    if (nextTrack) {
      engineRef.current.loadAudioUrl(nextTrack.url).then(() => {
        engineRef.current.play();
      });
    }
  }, [tracks, currentTrackIndex, shuffle, repeatMode]);

  // Handle Previous Track logic
  const handlePrevTrack = () => {
    if (tracks.length === 0) return;
    let prevIdx = currentTrackIndex - 1;
    if (prevIdx < 0) prevIdx = tracks.length - 1;

    setCurrentTrackIndex(prevIdx);
    const prevTrack = tracks[prevIdx];
    if (prevTrack) {
      engineRef.current.loadAudioUrl(prevTrack.url).then(() => {
        engineRef.current.play();
      });
    }
  };

  // Toggle Play / Pause
  const handleTogglePlay = async () => {
    await engineRef.current.ensureContext();
    if (isPlaying) {
      engineRef.current.pause();
    } else {
      if (!currentTrack && tracks.length > 0) {
        await engineRef.current.loadAudioUrl(tracks[0].url);
      }
      engineRef.current.play();
    }
  };

  // Select Track from Library
  const handleSelectTrack = async (track: AudioTrack) => {
    const idx = tracks.findIndex((t) => t.id === track.id);
    if (idx !== -1) setCurrentTrackIndex(idx);

    await engineRef.current.loadAudioUrl(track.url);
    engineRef.current.play();
  };

  // Upload Local Audio Files (MP3/FLAC/WAV)
  const handleUploadLocalFiles = (files: FileList) => {
    const newTracks: AudioTrack[] = [];

    Array.from(files).forEach((file, i) => {
      const url = URL.createObjectURL(file);
      const title = file.name.replace(/\.[^/.]+$/, '');

      newTracks.push({
        id: `local-${Date.now()}-${i}`,
        title: title,
        artist: 'Local Device Audio',
        album: 'My Music Storage',
        duration: 0,
        url: url,
        isDemo: false,
      });
    });

    const updated = [...newTracks, ...tracks];
    setTracks(updated);
    setInputMode('local-files');

    // Auto play first newly uploaded track
    if (newTracks.length > 0) {
      setCurrentTrackIndex(0);
      engineRef.current.loadAudioUrl(newTracks[0].url).then(() => {
        engineRef.current.play();
      });
    }
  };

  // --- EQ & DSP Event Handlers ---

  const handleApplyPreset = (preset: EQPreset) => {
    setActivePresetId(preset.id);
    setEqMode(preset.mode);
    setPreamp(preset.preamp);
    setBandGains([...preset.gains]);

    if (preset.bassBoost !== undefined) {
      setBassBoost(preset.bassBoost);
    }
    if (preset.treble !== undefined) {
      setTreble(preset.treble);
    }
    if (preset.virtualizer !== undefined) {
      setVirtualizer(preset.virtualizer);
    }
    if (preset.reverbPreset && preset.reverbLevel !== undefined) {
      setReverbPreset(preset.reverbPreset);
      setReverbLevel(preset.reverbLevel);
    }

    engineRef.current.applyPreset(preset);
  };

  const handleToggleEQMode = (mode: EQMode) => {
    setEqMode(mode);
    const newCount = mode === '10-band' ? 10 : 15;
    const newGains = new Array(newCount).fill(0);
    setBandGains(newGains);
    engineRef.current.setEQMode(mode);
  };

  const handleToggleBypass = () => {
    const newBypass = !eqBypass;
    setEqBypass(newBypass);
    engineRef.current.setEQBypass(newBypass);
  };

  const handleChangePreamp = (dB: number) => {
    setPreamp(dB);
    engineRef.current.setPreampGain(dB);
    setActivePresetId('custom');
  };

  const handleChangeBandGain = (index: number, dB: number) => {
    const updated = [...bandGains];
    updated[index] = dB;
    setBandGains(updated);
    engineRef.current.setEQBandGain(index, dB);
    setActivePresetId('custom');
  };

  const handleResetFlat = () => {
    const flat = new Array(bandGains.length).fill(0);
    setBandGains(flat);
    setPreamp(0);
    engineRef.current.setPreampGain(0);
    flat.forEach((_, i) => engineRef.current.setEQBandGain(i, 0));
    setActivePresetId('flat');
  };

  // Special FX Handlers
  const handleChangeBassBoost = (val: number) => {
    setBassBoost(val);
    engineRef.current.setBassBoost(val);
  };

  const handleChangeTreble = (val: number) => {
    setTreble(val);
    engineRef.current.setTreble(val);
  };

  const handleChangeVirtualizer = (val: number) => {
    setVirtualizer(val);
    engineRef.current.setVirtualizer(val);
  };

  const handleChangeReverb = (preset: ReverbPresetName, level: number) => {
    setReverbPreset(preset);
    setReverbLevel(level);
    engineRef.current.setReverb(preset, level);
  };

  const handleChangeStereoBalance = (pan: number) => {
    setStereoBalance(pan);
    engineRef.current.setStereoBalance(pan);
  };

  // Battery Saver Mode Toggle
  const handleToggleBatterySaver = () => {
    setBattery((prev) => {
      const isSaver = !prev.batterySaver;
      return {
        batterySaver: isSaver,
        targetFPS: isSaver ? 30 : 60,
        canvasScale: isSaver ? 0.75 : 1.0,
        autoPauseWhenHidden: true,
      };
    });
  };

  // Save Custom Preset
  const handleSaveCurrentAsPreset = (name: string) => {
    const newPreset: EQPreset = {
      id: `user-${Date.now()}`,
      name: name,
      category: 'user',
      mode: eqMode,
      preamp: preamp,
      gains: [...bandGains],
      bassBoost: bassBoost,
      treble: treble,
      virtualizer: virtualizer,
      reverbPreset: reverbPreset,
      reverbLevel: reverbLevel,
    };

    const updatedPresets = [...presets, newPreset];
    setPresets(updatedPresets);
    setActivePresetId(newPreset.id);

    // Save user presets to localStorage
    const userOnly = updatedPresets.filter((p) => p.category === 'user');
    localStorage.setItem('powerbass_user_presets', JSON.stringify(userOnly));
  };

  // Delete Custom Preset
  const handleDeleteUserPreset = (id: string) => {
    const filtered = presets.filter((p) => p.id !== id);
    setPresets(filtered);
    const userOnly = filtered.filter((p) => p.category === 'user');
    localStorage.setItem('powerbass_user_presets', JSON.stringify(userOnly));
  };

  // Import JSON Presets
  const handleImportPresetsJson = (jsonStr: string): boolean => {
    try {
      const parsed: EQPreset[] = JSON.parse(jsonStr);
      if (Array.isArray(parsed)) {
        const userPresets = parsed.map((p, i) => ({
          ...p,
          id: `user-import-${Date.now()}-${i}`,
          category: 'user' as const,
        }));
        const combined = [...presets, ...userPresets];
        setPresets(combined);
        const userOnly = combined.filter((p) => p.category === 'user');
        localStorage.setItem('powerbass_user_presets', JSON.stringify(userOnly));
        return true;
      }
    } catch {}
    return false;
  };

  return (
    <div className="min-h-screen bg-[#08090c] text-slate-100 flex flex-col font-sans antialiased selection:bg-cyan-500 selection:text-slate-950 pb-28">
      {/* Top Bar Header */}
      <Header
        presets={presets}
        currentPresetId={activePresetId}
        onSelectPreset={handleApplyPreset}
        inputMode={inputMode}
        onSelectInputMode={(mode) => {
          setInputMode(mode);
          engineRef.current.setInputSourceMode(mode);
        }}
        battery={battery}
        onToggleBatterySaver={handleToggleBatterySaver}
        onOpenLibrary={() => setIsLibraryOpen(true)}
        onOpenPresetManager={() => setIsPresetManagerOpen(true)}
        onOpenToneGenerator={() => setIsToneGeneratorOpen(true)}
        isFullscreenVisualizer={isFullscreenVisualizer}
        onToggleFullscreenVisualizer={() => setIsFullscreenVisualizer(!isFullscreenVisualizer)}
      />

      {/* Main Dashboard Container */}
      <main className="flex-1 w-full max-w-7xl mx-auto p-4 sm:p-6 flex flex-col gap-6">
        {/* TOP SECTION: Beat-Reactive Neon Visualizer Canvas */}
        <section className="w-full flex flex-col gap-3">
          <div className="w-full h-64 sm:h-80 md:h-96 relative">
            <VisualizerCanvas
              engine={engineRef.current}
              style={visualizerStyle}
              theme={visualizerTheme}
              battery={battery}
              isFullscreen={isFullscreenVisualizer}
            />

            {/* Exit Fullscreen Overlay Button */}
            {isFullscreenVisualizer && (
              <button
                onClick={() => setIsFullscreenVisualizer(false)}
                className="fixed top-4 right-4 z-50 px-4 py-2 bg-slate-900/90 text-white rounded-xl border border-slate-700 font-bold text-xs shadow-2xl backdrop-blur-md"
              >
                Exit Fullscreen
              </button>
            )}
          </div>

          {/* Visualizer Customization Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-3 bg-slate-950/80 p-3 rounded-xl border border-slate-800/80">
            {/* Visualizer Style Picker */}
            <div className="flex items-center gap-1 overflow-x-auto">
              <span className="text-[10px] uppercase font-bold text-slate-400 mr-2 flex items-center gap-1">
                <Waves className="w-3.5 h-3.5 text-cyan-400" />
                <span>Visualizer</span>
              </span>

              {[
                { id: 'neon-waves', label: 'Neon Waves' },
                { id: '3d-bars', label: '3D Spectrogram' },
                { id: 'oscilloscope', label: 'CRT Oscilloscope' },
                { id: 'radial-portal', label: 'Radial Portal' },
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setVisualizerStyle(style.id as VisualizerStyle)}
                  className={`px-3 py-1 text-xs font-semibold rounded-lg transition-all ${
                    visualizerStyle === style.id
                      ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-sm'
                      : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {style.label}
                </button>
              ))}
            </div>

            {/* Neon Theme Palette Picker */}
            <div className="flex items-center gap-1.5">
              <Palette className="w-3.5 h-3.5 text-pink-400 mr-1" />
              {(['cyberpunk', 'acid', 'solar', 'cobalt', 'violet'] as VisualizerTheme[]).map((thm) => {
                const palette = THEME_PALETTES[thm];
                const isSelected = visualizerTheme === thm;

                return (
                  <button
                    key={thm}
                    onClick={() => setVisualizerTheme(thm)}
                    className={`w-5 h-5 rounded-full border transition-transform ${
                      isSelected ? 'scale-125 border-white ring-2 ring-cyan-400/50' : 'border-slate-700 hover:scale-110'
                    }`}
                    style={{
                      background: `linear-gradient(135deg, ${palette.primary}, ${palette.secondary})`,
                    }}
                    title={`Theme: ${thm.toUpperCase()}`}
                  />
                );
              })}
            </div>
          </div>
        </section>

        {/* SECTION 2: Equalizer Panel (10/15-Band Faders & Preamp) */}
        <section className="w-full">
          <EqualizerPanel
            mode={eqMode}
            onToggleMode={handleToggleEQMode}
            bypass={eqBypass}
            onToggleBypass={handleToggleBypass}
            preamp={preamp}
            onChangePreamp={handleChangePreamp}
            gains={bandGains}
            onChangeBandGain={handleChangeBandGain}
            onResetFlat={handleResetFlat}
            activePreset={presets.find((p) => p.id === activePresetId) || null}
          />
        </section>

        {/* SECTION 3: Special FX & Processing (Bass Boost, Treble, 3D Virtualizer, Spatial Reverb) */}
        <section className="w-full">
          <EffectsPanel
            bassBoost={bassBoost}
            onChangeBassBoost={handleChangeBassBoost}
            treble={treble}
            onChangeTreble={handleChangeTreble}
            virtualizer={virtualizer}
            onChangeVirtualizer={handleChangeVirtualizer}
            reverbPreset={reverbPreset}
            reverbLevel={reverbLevel}
            onChangeReverb={handleChangeReverb}
            stereoBalance={stereoBalance}
            onChangeStereoBalance={handleChangeStereoBalance}
          />
        </section>

        {/* SECTION 4: Output Dynamics & VU Peak Meters */}
        <section className="w-full">
          <DynamicsPanel stats={stats} />
        </section>
      </main>

      {/* STICKY BOTTOM PLAYER CONTROLS */}
      <div className="fixed bottom-0 left-0 right-0 z-40 p-2 sm:p-4">
        <div className="max-w-7xl mx-auto">
          <AudioPlayerControls
            currentTrack={currentTrack}
            stats={stats}
            isPlaying={isPlaying}
            onTogglePlay={handleTogglePlay}
            onNextTrack={handleNextTrack}
            onPrevTrack={handlePrevTrack}
            onSeek={(secs) => engineRef.current.seek(secs)}
            playbackRate={playbackRate}
            onChangePlaybackRate={(rate) => {
              setPlaybackRate(rate);
              engineRef.current.setPlaybackRate(rate);
            }}
            masterVolume={masterVolume}
            onChangeMasterVolume={(vol) => {
              setMasterVolume(vol);
              engineRef.current.setMasterVolume(vol);
            }}
            shuffle={shuffle}
            onToggleShuffle={() => setShuffle(!shuffle)}
            repeatMode={repeatMode}
            onToggleRepeat={() => {
              if (repeatMode === 'off') setRepeatMode('all');
              else if (repeatMode === 'all') setRepeatMode('one');
              else setRepeatMode('off');
            }}
            onOpenLibrary={() => setIsLibraryOpen(true)}
          />
        </div>
      </div>

      {/* MODAL OVERLAYS */}
      <TrackLibraryModal
        isOpen={isLibraryOpen}
        onClose={() => setIsLibraryOpen(false)}
        tracks={tracks}
        currentTrackId={currentTrack?.id}
        onSelectTrack={handleSelectTrack}
        onUploadLocalFiles={handleUploadLocalFiles}
      />

      <PresetManagerModal
        isOpen={isPresetManagerOpen}
        onClose={() => setIsPresetManagerOpen(false)}
        presets={presets}
        activePresetId={activePresetId}
        onSelectPreset={handleApplyPreset}
        onSaveCurrentAsPreset={handleSaveCurrentAsPreset}
        onDeleteUserPreset={handleDeleteUserPreset}
        onImportPresetsJson={handleImportPresetsJson}
      />

      <ToneGeneratorModal
        isOpen={isToneGeneratorOpen}
        onClose={() => setIsToneGeneratorOpen(false)}
        engine={engineRef.current}
      />
    </div>
  );
}
