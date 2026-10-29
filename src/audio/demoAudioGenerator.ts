import { AudioTrack } from '../types/audio';

/**
 * Procedural offline audio generator that renders high-quality stereo audio buffers
 * directly in the browser using OfflineAudioContext. This guarantees zero-network,
 * 100% offline music playback with punchy beats, deep basslines, and synth melodies!
 */

// Helper to convert an AudioBuffer to an inline WAV Blob URL
export function audioBufferToWavBlobUrl(buffer: AudioBuffer): string {
  const numChannels = buffer.numberOfChannels;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length * numChannels * 2 + 44;
  const out = new DataView(new ArrayBuffer(length));

  function writeString(offset: number, str: string) {
    for (let i = 0; i < str.length; i++) {
      out.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  // RIFF header
  writeString(0, 'RIFF');
  out.setUint32(4, length - 8, true);
  writeString(8, 'WAVE');
  writeString(12, 'fmt ');
  out.setUint32(16, 16, true); // Subchunk1Size
  out.setUint16(20, 1, true); // AudioFormat (1 = PCM)
  out.setUint16(22, numChannels, true);
  out.setUint32(24, sampleRate, true);
  out.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
  out.setUint16(32, numChannels * 2, true); // BlockAlign
  out.setUint16(34, 16, true); // BitsPerSample

  writeString(36, 'data');
  out.setUint32(40, length - 44, true);

  // Write PCM audio samples
  let offset = 44;
  const channels: Float32Array[] = [];
  for (let c = 0; c < numChannels; c++) {
    channels.push(buffer.getChannelData(c));
  }

  for (let i = 0; i < buffer.length; i++) {
    for (let c = 0; c < numChannels; c++) {
      const sample = Math.max(-1, Math.min(1, channels[c][i]));
      const intSample = sample < 0 ? sample * 0x8000 : sample * 0x7fff;
      out.setInt16(offset, intSample, true);
      offset += 2;
    }
  }

  const blob = new Blob([out.buffer], { type: 'audio/wav' });
  return URL.createObjectURL(blob);
}

// Track 1: Cyberpunk Synthwave Beat (120 BPM, 30s Loop)
export async function generateCyberpunkSynthwaveTrack(): Promise<AudioTrack> {
  const sampleRate = 44100;
  const duration = 24; // 24 seconds loopable
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const bpm = 120;
  const beatTime = 60 / bpm;
  const sixteenth = beatTime / 4;
  const totalBeats = Math.floor(duration / beatTime);

  // Master bus
  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(offlineCtx.destination);

  // Sub bass kick drum
  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * beatTime;

    // Kick on every beat
    const kickOsc = offlineCtx.createOscillator();
    const kickGain = offlineCtx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(140, t);
    kickOsc.frequency.exponentialRampToValueAtTime(38, t + 0.12);

    kickGain.gain.setValueAtTime(1.2, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.35);

    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);
    kickOsc.start(t);
    kickOsc.stop(t + 0.36);

    // Snare on beats 2 & 4
    if (beat % 2 === 1) {
      const noiseBuffer = offlineCtx.createBuffer(1, sampleRate * 0.2, sampleRate);
      const data = noiseBuffer.getChannelData(0);
      for (let i = 0; i < data.length; i++) {
        data[i] = Math.random() * 2 - 1;
      }
      const noise = offlineCtx.createBufferSource();
      noise.buffer = noiseBuffer;

      const noiseFilter = offlineCtx.createBiquadFilter();
      noiseFilter.type = 'highpass';
      noiseFilter.frequency.value = 1000;

      const snareGain = offlineCtx.createGain();
      snareGain.gain.setValueAtTime(0.7, t);
      snareGain.gain.exponentialRampToValueAtTime(0.01, t + 0.18);

      noise.connect(noiseFilter);
      noiseFilter.connect(snareGain);
      snareGain.connect(masterGain);
      noise.start(t);
      noise.stop(t + 0.19);
    }

    // Hi-hats on 16ths
    for (let s = 0; s < 4; s++) {
      const st = t + s * sixteenth;
      const hatBuffer = offlineCtx.createBuffer(1, sampleRate * 0.05, sampleRate);
      const hData = hatBuffer.getChannelData(0);
      for (let i = 0; i < hData.length; i++) {
        hData[i] = (Math.random() * 2 - 1) * 0.3;
      }
      const hat = offlineCtx.createBufferSource();
      hat.buffer = hatBuffer;

      const hatGain = offlineCtx.createGain();
      const vol = s === 2 ? 0.35 : 0.2;
      hatGain.gain.setValueAtTime(vol, st);
      hatGain.gain.exponentialRampToValueAtTime(0.01, st + 0.04);

      hat.connect(hatGain);
      hatGain.connect(masterGain);
      hat.start(st);
      hat.stop(st + 0.05);
    }
  }

  // Driving Synthwave Sawtooth Bassline
  const bassNotes = [36, 36, 38, 41, 36, 36, 43, 41]; // Midi notes: C1, D1, F1, G1
  for (let s = 0; s < totalBeats * 4; s++) {
    const st = s * sixteenth;
    const note = bassNotes[Math.floor(s / 2) % bassNotes.length];
    const freq = 440 * Math.pow(2, (note - 69) / 12);

    const bassOsc = offlineCtx.createOscillator();
    const bassFilter = offlineCtx.createBiquadFilter();
    const bassGain = offlineCtx.createGain();

    bassOsc.type = 'sawtooth';
    bassOsc.frequency.setValueAtTime(freq, st);

    bassFilter.type = 'lowpass';
    bassFilter.frequency.setValueAtTime(800, st);
    bassFilter.frequency.exponentialRampToValueAtTime(150, st + 0.12);
    bassFilter.Q.value = 4;

    bassGain.gain.setValueAtTime(0.45, st);
    bassGain.gain.exponentialRampToValueAtTime(0.01, st + 0.14);

    bassOsc.connect(bassFilter);
    bassFilter.connect(bassGain);
    bassGain.connect(masterGain);
    bassOsc.start(st);
    bassOsc.stop(st + 0.15);
  }

  // Arpeggiator Lead Synth
  const arpNotes = [60, 63, 67, 72, 67, 63, 67, 70]; // C minor arp
  for (let s = 0; s < totalBeats * 4; s++) {
    const st = s * sixteenth;
    const note = arpNotes[s % arpNotes.length];
    const freq = 440 * Math.pow(2, (note - 69) / 12);

    const arpOsc = offlineCtx.createOscillator();
    const arpGain = offlineCtx.createGain();

    arpOsc.type = 'square';
    arpOsc.frequency.setValueAtTime(freq, st);

    arpGain.gain.setValueAtTime(0.2, st);
    arpGain.gain.exponentialRampToValueAtTime(0.005, st + 0.1);

    arpOsc.connect(arpGain);
    arpGain.connect(masterGain);
    arpOsc.start(st);
    arpOsc.stop(st + 0.11);
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavUrl = audioBufferToWavBlobUrl(renderedBuffer);

  return {
    id: 'demo-cyberpunk-synthwave',
    title: 'Neon Pulse (Cyberpunk Synthwave)',
    artist: 'PowerBass Synth Lab',
    album: 'Offline DSP Sessions',
    duration: duration,
    url: wavUrl,
    isDemo: true,
  };
}

// Track 2: Deep Sub-Bass EDM Drop
export async function generateEDMSubBassTrack(): Promise<AudioTrack> {
  const sampleRate = 44100;
  const duration = 24;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const bpm = 128;
  const beatTime = 60 / bpm;
  const totalBeats = Math.floor(duration / beatTime);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.9;
  masterGain.connect(offlineCtx.destination);

  // Deep Sub Bass 40Hz with Wobble Filter
  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * beatTime;

    // Sub Bass Sine + Square blend
    const subOsc = offlineCtx.createOscillator();
    const subGain = offlineCtx.createGain();
    const subFilter = offlineCtx.createBiquadFilter();

    subOsc.type = 'triangle';
    subOsc.frequency.setValueAtTime(45, t); // F#0 sub

    subFilter.type = 'lowpass';
    subFilter.frequency.setValueAtTime(120, t);
    subFilter.frequency.linearRampToValueAtTime(400, t + beatTime * 0.5);
    subFilter.frequency.linearRampToValueAtTime(80, t + beatTime);

    subGain.gain.setValueAtTime(0.7, t);

    subOsc.connect(subFilter);
    subFilter.connect(subGain);
    subGain.connect(masterGain);
    subOsc.start(t);
    subOsc.stop(t + beatTime);

    // Punchy EDM Kick
    const kickOsc = offlineCtx.createOscillator();
    const kickGain = offlineCtx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(180, t);
    kickOsc.frequency.exponentialRampToValueAtTime(32, t + 0.1);

    kickGain.gain.setValueAtTime(1.3, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.3);

    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);
    kickOsc.start(t);
    kickOsc.stop(t + 0.31);

    // Clap on 2 and 4
    if (beat % 2 === 1) {
      const clapBuffer = offlineCtx.createBuffer(1, sampleRate * 0.15, sampleRate);
      const cData = clapBuffer.getChannelData(0);
      for (let i = 0; i < cData.length; i++) {
        cData[i] = (Math.random() * 2 - 1) * Math.exp(-i / (sampleRate * 0.03));
      }
      const clap = offlineCtx.createBufferSource();
      clap.buffer = clapBuffer;

      const clapGain = offlineCtx.createGain();
      clapGain.gain.setValueAtTime(0.6, t);

      clap.connect(clapGain);
      clapGain.connect(masterGain);
      clap.start(t);
    }
  }

  // Synth Chords
  const chords = [
    [62, 65, 69], // Dm
    [60, 64, 67], // C
    [58, 62, 65], // Bb
    [57, 60, 64], // Am
  ];

  for (let b = 0; b < totalBeats; b += 2) {
    const t = b * beatTime;
    const chord = chords[Math.floor(b / 2) % chords.length];

    chord.forEach((note) => {
      const freq = 440 * Math.pow(2, (note - 69) / 12);
      const osc = offlineCtx.createOscillator();
      const gain = offlineCtx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(freq, t);

      gain.gain.setValueAtTime(0.12, t);
      gain.gain.exponentialRampToValueAtTime(0.01, t + beatTime * 1.8);

      osc.connect(gain);
      gain.connect(masterGain);
      osc.start(t);
      osc.stop(t + beatTime * 1.9);
    });
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavUrl = audioBufferToWavBlobUrl(renderedBuffer);

  return {
    id: 'demo-edm-sub-bass',
    title: 'Sub-Zero Drop (EDM Bassline)',
    artist: 'Bassline Dynamics',
    album: 'Offline DSP Sessions',
    duration: duration,
    url: wavUrl,
    isDemo: true,
  };
}

// Track 3: Acoustic Chill Lofi Guitar & Vibe
export async function generateAcousticChillTrack(): Promise<AudioTrack> {
  const sampleRate = 44100;
  const duration = 24;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const bpm = 85;
  const beatTime = 60 / bpm;
  const totalBeats = Math.floor(duration / beatTime);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(offlineCtx.destination);

  // Warm Guitar Plucks (Filtered Triangle + Sine combo)
  const guitarNotes = [52, 59, 64, 67, 55, 62, 67, 71, 50, 57, 62, 66, 53, 60, 65, 69];
  for (let i = 0; i < totalBeats * 2; i++) {
    const t = i * (beatTime / 2);
    const note = guitarNotes[i % guitarNotes.length];
    const freq = 440 * Math.pow(2, (note - 69) / 12);

    const osc = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();
    const filter = offlineCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, t);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1800, t);
    filter.frequency.exponentialRampToValueAtTime(300, t + 0.4);

    gain.gain.setValueAtTime(0.35, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.7);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(masterGain);
    osc.start(t);
    osc.stop(t + 0.75);
  }

  // Chill Lofi Kick and Rimshot
  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * beatTime;

    if (beat % 2 === 0 || beat % 4 === 3) {
      const kickOsc = offlineCtx.createOscillator();
      const kickGain = offlineCtx.createGain();
      kickOsc.type = 'sine';
      kickOsc.frequency.setValueAtTime(110, t);
      kickOsc.frequency.exponentialRampToValueAtTime(45, t + 0.15);

      kickGain.gain.setValueAtTime(0.8, t);
      kickGain.gain.exponentialRampToValueAtTime(0.01, t + 0.25);

      kickOsc.connect(kickGain);
      kickGain.connect(masterGain);
      kickOsc.start(t);
      kickOsc.stop(t + 0.26);
    }

    if (beat % 2 === 1) {
      const rimOsc = offlineCtx.createOscillator();
      const rimGain = offlineCtx.createGain();
      rimOsc.type = 'sine';
      rimOsc.frequency.setValueAtTime(800, t);
      rimOsc.frequency.exponentialRampToValueAtTime(300, t + 0.05);

      rimGain.gain.setValueAtTime(0.4, t);
      rimGain.gain.exponentialRampToValueAtTime(0.01, t + 0.06);

      rimOsc.connect(rimGain);
      rimGain.connect(masterGain);
      rimOsc.start(t);
      rimOsc.stop(t + 0.07);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavUrl = audioBufferToWavBlobUrl(renderedBuffer);

  return {
    id: 'demo-acoustic-chill',
    title: 'Midnight Lofi Guitar Vibe',
    artist: 'Velvet Acoustic',
    album: 'Offline DSP Sessions',
    duration: duration,
    url: wavUrl,
    isDemo: true,
  };
}

// Track 4: Heavy Metal Rock Drums & Riff
export async function generateMetalRockTrack(): Promise<AudioTrack> {
  const sampleRate = 44100;
  const duration = 24;
  const offlineCtx = new OfflineAudioContext(2, sampleRate * duration, sampleRate);

  const bpm = 140;
  const beatTime = 60 / bpm;
  const eighth = beatTime / 2;
  const totalBeats = Math.floor(duration / beatTime);

  const masterGain = offlineCtx.createGain();
  masterGain.gain.value = 0.85;
  masterGain.connect(offlineCtx.destination);

  // Distorted Heavy Power Chords (Sawtooth + Waveshaper Distortion)
  const waveShaper = offlineCtx.createWaveShaper();
  const curve = new Float32Array(4096);
  for (let i = 0; i < 4096; i++) {
    const x = (i * 2) / 4096 - 1;
    curve[i] = ((3 + 20) * x * 20 * (Math.PI / 180)) / (Math.PI + 20 * Math.abs(x));
  }
  waveShaper.curve = curve;
  waveShaper.connect(masterGain);

  const riffNotes = [40, 40, 43, 40, 45, 43, 40, 38]; // E power riff
  for (let e = 0; e < totalBeats * 2; e++) {
    const st = e * eighth;
    const note = riffNotes[e % riffNotes.length];
    const freq = 440 * Math.pow(2, (note - 69) / 12);

    const osc1 = offlineCtx.createOscillator();
    const osc2 = offlineCtx.createOscillator();
    const gain = offlineCtx.createGain();

    osc1.type = 'sawtooth';
    osc2.type = 'square';

    osc1.frequency.setValueAtTime(freq, st);
    osc2.frequency.setValueAtTime(freq * 1.498, st); // Fifth chord interval

    gain.gain.setValueAtTime(0.25, st);
    gain.gain.exponentialRampToValueAtTime(0.01, st + eighth * 0.9);

    osc1.connect(gain);
    osc2.connect(gain);
    gain.connect(waveShaper);
    osc1.start(st);
    osc2.start(st);
    osc1.stop(st + eighth);
    osc2.stop(st + eighth);
  }

  // Heavy Rock Drums (Double Kick + Snare + Crash)
  for (let beat = 0; beat < totalBeats; beat++) {
    const t = beat * beatTime;

    // Heavy Kick
    const kickOsc = offlineCtx.createOscillator();
    const kickGain = offlineCtx.createGain();
    kickOsc.type = 'sine';
    kickOsc.frequency.setValueAtTime(160, t);
    kickOsc.frequency.exponentialRampToValueAtTime(40, t + 0.1);

    kickGain.gain.setValueAtTime(1.1, t);
    kickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.2);

    kickOsc.connect(kickGain);
    kickGain.connect(masterGain);
    kickOsc.start(t);
    kickOsc.stop(t + 0.21);

    // Offbeat double kick
    if (beat % 2 === 1) {
      const kt2 = t - eighth * 0.5;
      const k2 = offlineCtx.createOscillator();
      const kg2 = offlineCtx.createGain();
      k2.type = 'sine';
      k2.frequency.setValueAtTime(150, kt2);
      k2.frequency.exponentialRampToValueAtTime(40, kt2 + 0.1);
      kg2.gain.setValueAtTime(0.8, kt2);
      kg2.gain.exponentialRampToValueAtTime(0.001, kt2 + 0.15);
      k2.connect(kg2);
      kg2.connect(masterGain);
      k2.start(kt2);
      k2.stop(kt2 + 0.16);
    }
  }

  const renderedBuffer = await offlineCtx.startRendering();
  const wavUrl = audioBufferToWavBlobUrl(renderedBuffer);

  return {
    id: 'demo-metal-rock-groove',
    title: 'Titanium Drive (Heavy Rock Riff)',
    artist: 'Overdrive Thrash',
    album: 'Offline DSP Sessions',
    duration: duration,
    url: wavUrl,
    isDemo: true,
  };
}

// Generate all 4 offline demo tracks
export async function loadDefaultDemoTracks(): Promise<AudioTrack[]> {
  const [t1, t2, t3, t4] = await Promise.all([
    generateCyberpunkSynthwaveTrack(),
    generateEDMSubBassTrack(),
    generateAcousticChillTrack(),
    generateMetalRockTrack(),
  ]);
  return [t1, t2, t3, t4];
}
