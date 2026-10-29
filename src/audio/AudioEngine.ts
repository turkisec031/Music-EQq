import {
  EQMode,
  EQPreset,
  ReverbPresetName,
  AudioInputSourceMode,
  AudioEngineStats,
} from '../types/audio';
import { FREQUENCIES_10_BAND, FREQUENCIES_15_BAND } from '../constants/presets';

export class AudioEngine {
  private ctx: AudioContext | null = null;
  private audioElement: HTMLAudioElement;

  // Nodes in chain
  private mediaSourceNode: MediaElementAudioSourceNode | null = null;
  private micStreamNode: MediaStreamAudioSourceNode | null = null;
  private micStream: MediaStream | null = null;
  private toneOscNode: OscillatorNode | null = null;
  private toneGainNode: GainNode | null = null;

  private inputSourceMode: AudioInputSourceMode = 'demo-player';

  private preampNode: GainNode | null = null;
  private eqFilters: BiquadFilterNode[] = [];
  private currentEQMode: EQMode = '10-band';
  private eqBypass: boolean = false;

  private bassBoostFilter: BiquadFilterNode | null = null;
  private trebleFilter: BiquadFilterNode | null = null;

  // 3D Virtualizer nodes
  private virtualizerDelay: DelayNode | null = null;
  private virtualizerGain: GainNode | null = null;

  // Reverb nodes
  private reverbConvolver: ConvolverNode | null = null;
  private reverbWetGain: GainNode | null = null;
  private reverbDryGain: GainNode | null = null;
  private currentReverbPreset: ReverbPresetName = 'off';

  // Compressor / Limiter
  private compressorNode: DynamicsCompressorNode | null = null;

  // Master Volume & Panner
  private masterGainNode: GainNode | null = null;
  private pannerNode: StereoPannerNode | null = null;

  // Metering & Analyser
  private analyserNode: AnalyserNode | null = null;
  private frequencyData: Uint8Array = new Uint8Array(0);
  private timeDomainData: Uint8Array = new Uint8Array(0);

  // Stats / Peak tracking
  private isPlayingState: boolean = false;
  private statsInterval: number | null = null;
  private onStatsUpdate?: (stats: AudioEngineStats) => void;
  private onTrackEndedCallback?: () => void;

  constructor() {
    this.audioElement = new Audio();
    this.audioElement.crossOrigin = 'anonymous';

    this.audioElement.addEventListener('ended', () => {
      this.isPlayingState = false;
      if (this.onTrackEndedCallback) {
        this.onTrackEndedCallback();
      }
    });

    this.audioElement.addEventListener('pause', () => {
      this.isPlayingState = false;
    });

    this.audioElement.addEventListener('play', () => {
      this.isPlayingState = true;
    });
  }

  // Ensure AudioContext is initialized on user interaction
  public async ensureContext(): Promise<AudioContext> {
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass({
        latencyHint: 'interactive',
      });
      this.buildAudioGraph();
    }

    if (this.ctx.state === 'suspended') {
      await this.ctx.resume();
    }

    return this.ctx;
  }

  private buildAudioGraph() {
    if (!this.ctx) return;

    // 1. Preamp Gain
    this.preampNode = this.ctx.createGain();
    this.preampNode.gain.value = 1.0;

    // 2. Build EQ Filters (Default 10-band)
    this.createEQFilters('10-band');

    // 3. Bass Boost & Treble
    this.bassBoostFilter = this.ctx.createBiquadFilter();
    this.bassBoostFilter.type = 'lowshelf';
    this.bassBoostFilter.frequency.value = 80;
    this.bassBoostFilter.gain.value = 0;

    this.trebleFilter = this.ctx.createBiquadFilter();
    this.trebleFilter.type = 'highshelf';
    this.trebleFilter.frequency.value = 6000;
    this.trebleFilter.gain.value = 0;

    // 4. Virtualizer 3D Surround
    this.virtualizerDelay = this.ctx.createDelay();
    this.virtualizerDelay.delayTime.value = 0.015; // 15ms phase delay
    this.virtualizerGain = this.ctx.createGain();
    this.virtualizerGain.gain.value = 0;

    // 5. Reverb Matrix
    this.reverbConvolver = this.ctx.createConvolver();
    this.reverbWetGain = this.ctx.createGain();
    this.reverbWetGain.gain.value = 0;
    this.reverbDryGain = this.ctx.createGain();
    this.reverbDryGain.gain.value = 1.0;

    // Generate initial procedural impulse response for synthetic reverb
    this.updateReverbImpulse('room', 0);

    // 6. Compressor / Limiter (Prevents Digital Clipping)
    this.compressorNode = this.ctx.createDynamicsCompressor();
    this.compressorNode.threshold.value = -1.5; // dB
    this.compressorNode.knee.value = 6.0;
    this.compressorNode.ratio.value = 12.0;
    this.compressorNode.attack.value = 0.003;
    this.compressorNode.release.value = 0.15;

    // 7. Master Panner & Gain
    this.pannerNode = this.ctx.createStereoPanner();
    this.pannerNode.pan.value = 0;

    this.masterGainNode = this.ctx.createGain();
    this.masterGainNode.gain.value = 1.0;

    // 8. Analyser Node
    this.analyserNode = this.ctx.createAnalyser();
    this.analyserNode.fftSize = 2048;
    this.analyserNode.smoothingTimeConstant = 0.82;

    this.frequencyData = new Uint8Array(this.analyserNode.frequencyBinCount);
    this.timeDomainData = new Uint8Array(this.analyserNode.fftSize);

    // Wire up static FX chain
    this.reconnectChain();

    // Start stats monitoring ticker
    this.startStatsMonitoring();
  }

  private createEQFilters(mode: EQMode) {
    if (!this.ctx) return;

    // Disconnect existing filters
    this.eqFilters.forEach((f) => f.disconnect());
    this.eqFilters = [];

    const freqs = mode === '10-band' ? FREQUENCIES_10_BAND : FREQUENCIES_15_BAND;

    this.eqFilters = freqs.map((freq) => {
      const filter = this.ctx!.createBiquadFilter();
      filter.type = 'peaking';
      filter.frequency.value = freq;
      filter.Q.value = mode === '10-band' ? 1.4 : 2.2;
      filter.gain.value = 0;
      return filter;
    });

    this.currentEQMode = mode;
  }

  private reconnectChain() {
    if (!this.ctx || !this.preampNode || !this.bassBoostFilter || !this.trebleFilter || !this.masterGainNode || !this.analyserNode) {
      return;
    }

    let lastNode: AudioNode = this.preampNode;

    // Chain EQ filters unless bypassed
    if (!this.eqBypass && this.eqFilters.length > 0) {
      this.eqFilters.forEach((filter) => {
        lastNode.connect(filter);
        lastNode = filter;
      });
    }

    // Connect Tone Controls
    lastNode.connect(this.bassBoostFilter);
    lastNode = this.bassBoostFilter;

    lastNode.connect(this.trebleFilter);
    lastNode = this.trebleFilter;

    // Connect 3D Virtualizer parallel delay
    if (this.virtualizerDelay && this.virtualizerGain) {
      lastNode.connect(this.virtualizerDelay);
      this.virtualizerDelay.connect(this.virtualizerGain);
      this.virtualizerGain.connect(this.masterGainNode);
    }

    // Connect Reverb parallel branch
    if (this.reverbDryGain && this.reverbConvolver && this.reverbWetGain) {
      lastNode.connect(this.reverbDryGain);
      this.reverbDryGain.connect(this.masterGainNode);

      lastNode.connect(this.reverbConvolver);
      this.reverbConvolver.connect(this.reverbWetGain);
      this.reverbWetGain.connect(this.masterGainNode);
    } else {
      lastNode.connect(this.masterGainNode);
    }

    // Connect Limiter / Compressor -> Panner -> Master -> Analyser -> Destination
    if (this.compressorNode && this.pannerNode) {
      this.masterGainNode.disconnect();
      this.masterGainNode.connect(this.compressorNode);
      this.compressorNode.connect(this.pannerNode);
      this.pannerNode.connect(this.analyserNode);
      this.analyserNode.connect(this.ctx.destination);
    }
  }

  // --- Source Selection & Media Controls ---

  public async loadAudioUrl(url: string) {
    await this.ensureContext();
    this.stopToneGenerator();

    if (this.inputSourceMode !== 'demo-player' && this.inputSourceMode !== 'local-files') {
      this.setInputSourceMode('demo-player');
    }

    // Connect media element if not connected
    if (!this.mediaSourceNode && this.ctx && this.preampNode) {
      this.mediaSourceNode = this.ctx.createMediaElementSource(this.audioElement);
      this.mediaSourceNode.connect(this.preampNode);
    }

    this.audioElement.src = url;
    this.audioElement.load();
  }

  public async play() {
    await this.ensureContext();
    if (this.inputSourceMode === 'tone-generator') {
      this.isPlayingState = true;
      return;
    }
    if (this.inputSourceMode === 'microphone') {
      this.isPlayingState = true;
      return;
    }
    try {
      await this.audioElement.play();
      this.isPlayingState = true;
    } catch (err) {
      console.warn('Audio playback error:', err);
    }
  }

  public pause() {
    if (this.inputSourceMode === 'tone-generator') {
      this.stopToneGenerator();
      this.isPlayingState = false;
      return;
    }
    if (this.inputSourceMode === 'microphone') {
      this.stopMicrophone();
      this.isPlayingState = false;
      return;
    }
    this.audioElement.pause();
    this.isPlayingState = false;
  }

  public seek(seconds: number) {
    if (this.audioElement.duration) {
      this.audioElement.currentTime = Math.max(0, Math.min(seconds, this.audioElement.duration));
    }
  }

  public setPlaybackRate(rate: number) {
    this.audioElement.playbackRate = Math.max(0.5, Math.min(2.0, rate));
  }

  // --- Input Source Modes (Player / Mic / Tone Generator) ---

  public async setInputSourceMode(mode: AudioInputSourceMode) {
    await this.ensureContext();
    this.inputSourceMode = mode;

    // Disconnect special inputs
    this.stopToneGenerator();
    this.stopMicrophone();

    if (mode === 'microphone') {
      this.audioElement.pause();
      try {
        this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true, video: false });
        if (this.ctx && this.preampNode && this.micStream) {
          this.micStreamNode = this.ctx.createMediaStreamSource(this.micStream);
          this.micStreamNode.connect(this.preampNode);
          this.isPlayingState = true;
        }
      } catch (err) {
        console.error('Microphone permission denied or unavailable:', err);
        this.inputSourceMode = 'demo-player';
      }
    }
  }

  public startToneGenerator(type: OscillatorType | 'noise', frequency: number = 440) {
    if (!this.ctx || !this.preampNode) return;
    this.stopToneGenerator();

    this.audioElement.pause();
    this.stopMicrophone();

    this.inputSourceMode = 'tone-generator';

    this.toneGainNode = this.ctx.createGain();
    this.toneGainNode.gain.value = 0.3;

    if (type === 'noise') {
      // White noise buffer generator
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      for (let i = 0; i < bufferSize; i++) {
        output[i] = Math.random() * 2 - 1;
      }
      const whiteNoise = this.ctx.createBufferSource();
      whiteNoise.buffer = noiseBuffer;
      whiteNoise.loop = true;
      whiteNoise.connect(this.toneGainNode);
      whiteNoise.start();
    } else {
      this.toneOscNode = this.ctx.createOscillator();
      this.toneOscNode.type = type;
      this.toneOscNode.frequency.setValueAtTime(frequency, this.ctx.currentTime);
      this.toneOscNode.connect(this.toneGainNode);
      this.toneOscNode.start();
    }

    this.toneGainNode.connect(this.preampNode);
    this.isPlayingState = true;
  }

  public stopToneGenerator() {
    if (this.toneOscNode) {
      try {
        this.toneOscNode.stop();
      } catch {}
      this.toneOscNode.disconnect();
      this.toneOscNode = null;
    }
    if (this.toneGainNode) {
      this.toneGainNode.disconnect();
      this.toneGainNode = null;
    }
  }

  public stopMicrophone() {
    if (this.micStream) {
      this.micStream.getTracks().forEach((track) => track.stop());
      this.micStream = null;
    }
    if (this.micStreamNode) {
      this.micStreamNode.disconnect();
      this.micStreamNode = null;
    }
  }

  // --- Equalizer & DSP Parameter Setters ---

  public setPreampGain(dB: number) {
    if (!this.ctx || !this.preampNode) return;
    const linearGain = Math.pow(10, dB / 20);
    this.preampNode.gain.setTargetAtTime(linearGain, this.ctx.currentTime, 0.02);
  }

  public setEQBandGain(index: number, dB: number) {
    if (!this.ctx || index < 0 || index >= this.eqFilters.length) return;
    const clampedDb = Math.max(-12, Math.min(12, dB));
    this.eqFilters[index].gain.setTargetAtTime(clampedDb, this.ctx.currentTime, 0.02);
  }

  public setEQMode(mode: EQMode) {
    if (this.currentEQMode === mode) return;
    this.createEQFilters(mode);
    this.reconnectChain();
  }

  public setEQBypass(bypass: boolean) {
    this.eqBypass = bypass;
    this.reconnectChain();
  }

  public setBassBoost(level: number) {
    // level: 0 to 100 -> converts to 0 to 18 dB boost
    if (!this.ctx || !this.bassBoostFilter) return;
    const dB = (level / 100) * 18;
    this.bassBoostFilter.gain.setTargetAtTime(dB, this.ctx.currentTime, 0.02);
  }

  public setTreble(level: number) {
    // level: 0 to 100 -> converts to 0 to 16 dB boost
    if (!this.ctx || !this.trebleFilter) return;
    const dB = (level / 100) * 16;
    this.trebleFilter.gain.setTargetAtTime(dB, this.ctx.currentTime, 0.02);
  }

  public setVirtualizer(level: number) {
    // level: 0 to 100 -> converts to 0 to 0.7 mix gain
    if (!this.ctx || !this.virtualizerGain) return;
    const gain = (level / 100) * 0.7;
    this.virtualizerGain.gain.setTargetAtTime(gain, this.ctx.currentTime, 0.02);
  }

  public setReverb(preset: ReverbPresetName, level: number) {
    if (!this.ctx) return;
    this.currentReverbPreset = preset;
    this.updateReverbImpulse(preset, level);
  }

  public setMasterVolume(volume: number) {
    // volume: 0 to 1.2
    if (!this.ctx || !this.masterGainNode) return;
    this.masterGainNode.gain.setTargetAtTime(volume, this.ctx.currentTime, 0.02);
  }

  public setStereoBalance(pan: number) {
    // pan: -1.0 to +1.0
    if (!this.ctx || !this.pannerNode) return;
    this.pannerNode.pan.setTargetAtTime(pan, this.ctx.currentTime, 0.02);
  }

  public applyPreset(preset: EQPreset) {
    if (preset.mode !== this.currentEQMode) {
      this.setEQMode(preset.mode);
    }

    this.setPreampGain(preset.preamp);
    preset.gains.forEach((gain, i) => {
      this.setEQBandGain(i, gain);
    });

    if (preset.bassBoost !== undefined) this.setBassBoost(preset.bassBoost);
    if (preset.treble !== undefined) this.setTreble(preset.treble);
    if (preset.virtualizer !== undefined) this.setVirtualizer(preset.virtualizer);
    if (preset.reverbPreset && preset.reverbLevel !== undefined) {
      this.setReverb(preset.reverbPreset, preset.reverbLevel);
    }
  }

  // Generate synthetic impulse response for spatial room environments
  private updateReverbImpulse(preset: ReverbPresetName, level: number) {
    if (!this.ctx || !this.reverbConvolver || !this.reverbWetGain || !this.reverbDryGain) return;

    const wetGain = (level / 100) * 0.8;
    this.reverbWetGain.gain.setTargetAtTime(wetGain, this.ctx.currentTime, 0.02);
    this.reverbDryGain.gain.setTargetAtTime(1.0 - wetGain * 0.3, this.ctx.currentTime, 0.02);

    if (preset === 'off' || level === 0) return;

    let duration = 0.5;
    let decay = 2.0;

    switch (preset) {
      case 'room':
        duration = 0.8;
        decay = 3.0;
        break;
      case 'studio':
        duration = 0.5;
        decay = 4.0;
        break;
      case 'hall':
        duration = 2.2;
        decay = 2.5;
        break;
      case 'arena':
        duration = 3.5;
        decay = 1.8;
        break;
      case 'club':
        duration = 1.4;
        decay = 3.5;
        break;
    }

    const sampleRate = this.ctx.sampleRate;
    const length = sampleRate * duration;
    const impulse = this.ctx.createBuffer(2, length, sampleRate);
    const left = impulse.getChannelData(0);
    const right = impulse.getChannelData(1);

    for (let i = 0; i < length; i++) {
      const n = i / length;
      const envelope = Math.exp(-n * decay);
      left[i] = (Math.random() * 2 - 1) * envelope;
      right[i] = (Math.random() * 2 - 1) * envelope;
    }

    this.reverbConvolver.buffer = impulse;
  }

  // --- Analyser Data Extraction for Visualizer & VU Meters ---

  public getFrequencyData(): Uint8Array {
    if (this.analyserNode && this.isPlayingState) {
      this.analyserNode.getByteFrequencyData(this.frequencyData);
    } else {
      this.frequencyData.fill(0);
    }
    return this.frequencyData;
  }

  public getTimeDomainData(): Uint8Array {
    if (this.analyserNode && this.isPlayingState) {
      this.analyserNode.getByteTimeDomainData(this.timeDomainData);
    } else {
      this.timeDomainData.fill(128);
    }
    return this.timeDomainData;
  }

  // --- Stats Monitoring (VU Meters & Peak Tracking) ---

  private startStatsMonitoring() {
    if (this.statsInterval) clearInterval(this.statsInterval);

    this.statsInterval = window.setInterval(() => {
      if (!this.onStatsUpdate) return;

      const timeData = this.getTimeDomainData();
      let leftSum = 0;
      let rightSum = 0;
      let maxPeak = 0;

      for (let i = 0; i < timeData.length; i++) {
        const sample = (timeData[i] - 128) / 128;
        const abs = Math.abs(sample);
        if (abs > maxPeak) maxPeak = abs;

        if (i % 2 === 0) leftSum += abs * abs;
        else rightSum += abs * abs;
      }

      const leftRms = Math.sqrt(leftSum / (timeData.length / 2));
      const rightRms = Math.sqrt(rightSum / (timeData.length / 2));

      this.onStatsUpdate({
        isPlaying: this.isPlayingState,
        currentTime: this.audioElement.currentTime || 0,
        duration: this.audioElement.duration || 0,
        sampleRate: this.ctx ? this.ctx.sampleRate : 44100,
        bufferSize: this.analyserNode ? this.analyserNode.fftSize : 2048,
        leftPeak: Math.min(1.0, leftRms * 2.8),
        rightPeak: Math.min(1.0, rightRms * 2.8),
        isClipping: maxPeak >= 0.98,
        cpuLoadEstimate: this.isPlayingState ? 1.8 : 0.2, // low % Web Audio CPU
      });
    }, 50); // 20 Hz meter update
  }

  // --- Callbacks & Getters ---

  public setOnStatsUpdate(cb: (stats: AudioEngineStats) => void) {
    this.onStatsUpdate = cb;
  }

  public setOnTrackEnded(cb: () => void) {
    this.onTrackEndedCallback = cb;
  }

  public getAudioElement(): HTMLAudioElement {
    return this.audioElement;
  }

  public getIsPlaying(): boolean {
    return this.isPlayingState;
  }

  public getCurrentInputMode(): AudioInputSourceMode {
    return this.inputSourceMode;
  }

  public destroy() {
    if (this.statsInterval) clearInterval(this.statsInterval);
    this.stopToneGenerator();
    this.stopMicrophone();
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}
