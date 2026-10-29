import React, { useRef, useEffect } from 'react';
import { AudioEngine } from '../audio/AudioEngine';
import { VisualizerStyle, VisualizerTheme, BatterySettings } from '../types/audio';
import { THEME_PALETTES } from '../constants/presets';

interface VisualizerCanvasProps {
  engine: AudioEngine;
  style: VisualizerStyle;
  theme: VisualizerTheme;
  battery: BatterySettings;
  isFullscreen?: boolean;
}

interface Particle {
  x: number;
  y: number;
  vx: number;
  vy: number;
  radius: number;
  alpha: number;
  color: string;
}

export const VisualizerCanvas: React.FC<VisualizerCanvasProps> = ({
  engine,
  style,
  theme,
  battery,
  isFullscreen = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animFrameRef = useRef<number | null>(null);
  const lastFrameTimeRef = useRef<number>(0);
  const particlesRef = useRef<Particle[]>([]);

  const colors = THEME_PALETTES[theme] || THEME_PALETTES.cyberpunk;

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    let isRunning = true;

    // Handle Resize & Canvas Scaling
    const resizeCanvas = () => {
      const rect = canvas.getBoundingClientRect();
      const scale = battery.canvasScale;
      canvas.width = Math.floor(rect.width * scale);
      canvas.height = Math.floor(rect.height * scale);
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Render loop
    const render = (now: number) => {
      if (!isRunning) return;

      // Battery saver FPS cap
      const targetInterval = 1000 / battery.targetFPS;
      const elapsed = now - lastFrameTimeRef.current;

      if (elapsed < targetInterval) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      lastFrameTimeRef.current = now - (elapsed % targetInterval);

      // Auto-pause if document is hidden / tabbed away
      if (battery.autoPauseWhenHidden && document.hidden) {
        animFrameRef.current = requestAnimationFrame(render);
        return;
      }

      const width = canvas.width;
      const height = canvas.height;

      // Fetch audio data
      const freqData = engine.getFrequencyData();
      const timeData = engine.getTimeDomainData();
      const isPlaying = engine.getIsPlaying();

      // Calculate overall bass beat energy (0-250 Hz bins)
      let bassSum = 0;
      const bassBinCount = Math.floor(freqData.length * 0.1);
      for (let i = 0; i < bassBinCount; i++) {
        bassSum += freqData[i];
      }
      const bassAvg = bassSum / (bassBinCount || 1); // 0 to 255
      const bassIntensity = bassAvg / 255; // 0 to 1

      // Dark background with trailing fade for motion blur
      ctx.fillStyle = '#08090c';
      ctx.fillRect(0, 0, width, height);

      // Trigger beat particles on strong bass hits
      if (isPlaying && bassIntensity > 0.65 && particlesRef.current.length < 50) {
        for (let p = 0; p < 3; p++) {
          particlesRef.current.push({
            x: width / 2 + (Math.random() - 0.5) * width * 0.4,
            y: height / 2 + (Math.random() - 0.5) * height * 0.3,
            vx: (Math.random() - 0.5) * 4 * (1 + bassIntensity),
            vy: (Math.random() - 0.5) * 4 * (1 + bassIntensity),
            radius: Math.random() * 3 + 2,
            alpha: 1.0,
            color: Math.random() > 0.5 ? colors.primary : colors.secondary,
          });
        }
      }

      // Render selected visualizer style
      switch (style) {
        case 'neon-waves':
          drawVibrantNeonWaves(ctx, width, height, freqData, timeData, bassIntensity, colors, now);
          break;
        case '3d-bars':
          draw3DCyberBars(ctx, width, height, freqData, colors);
          break;
        case 'oscilloscope':
          drawCRTOscilloscope(ctx, width, height, timeData, colors);
          break;
        case 'radial-portal':
          drawRadialPortal(ctx, width, height, freqData, bassIntensity, colors, now);
          break;
      }

      // Render Floating Beat Particles
      updateAndDrawParticles(ctx, width, height);

      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      isRunning = false;
      if (animFrameRef.current) cancelAnimationFrame(animFrameRef.current);
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [engine, style, theme, battery]);

  // Update and draw floating beat particles
  const updateAndDrawParticles = (ctx: CanvasRenderingContext2D, width: number, height: number) => {
    particlesRef.current = particlesRef.current.filter((p) => p.alpha > 0.05);

    particlesRef.current.forEach((p) => {
      p.x += p.vx;
      p.y += p.vy;
      p.alpha *= 0.94; // fade out

      ctx.save();
      ctx.globalAlpha = p.alpha;
      ctx.fillStyle = p.color;
      ctx.shadowColor = p.color;
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    });
  };

  // --- STYLE 1: Vibrant Neon Waves ---
  const drawVibrantNeonWaves = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    timeData: Uint8Array,
    bassIntensity: number,
    themeColors: typeof colors,
    now: number
  ) => {
    const centerY = height / 2;
    const timeSec = now * 0.0015;

    // Draw 3 overlapping fluid neon wave layers
    const waveLayers = [
      { color: themeColors.primary, opacity: 0.8, freqIndex: 0.1, speed: 1.0, amplitude: 0.8 },
      { color: themeColors.secondary, opacity: 0.7, freqIndex: 0.3, speed: 1.4, amplitude: 0.6 },
      { color: themeColors.accent, opacity: 0.6, freqIndex: 0.6, speed: 1.8, amplitude: 0.4 },
    ];

    waveLayers.forEach((layer) => {
      ctx.save();
      ctx.lineWidth = 3 + bassIntensity * 2;
      ctx.strokeStyle = layer.color;
      ctx.shadowColor = layer.color;
      ctx.shadowBlur = 12 + bassIntensity * 16;
      ctx.globalAlpha = layer.opacity;

      ctx.beginPath();

      const numPoints = 80;
      const stepX = width / (numPoints - 1);

      for (let i = 0; i < numPoints; i++) {
        const x = i * stepX;
        const normI = i / numPoints;

        // Extract frequency bin energy for this point along the x-axis
        const dataIdx = Math.floor(normI * freqData.length * layer.freqIndex);
        const freqVal = freqData[dataIdx] || 0;
        const normVal = freqVal / 255;

        // Wave formula: Multi-harmonic sine + audio energy
        const wave1 = Math.sin(normI * Math.PI * 4 + timeSec * layer.speed);
        const wave2 = Math.cos(normI * Math.PI * 8 - timeSec * 1.5);
        const waveAmp = (wave1 + wave2 * 0.5) * (30 + normVal * 120 * layer.amplitude);

        const y = centerY + waveAmp * (1 + bassIntensity * 0.5);

        if (i === 0) ctx.moveTo(x, y);
        else ctx.lineTo(x, y);
      }

      ctx.stroke();

      // Mirror bottom fill with gradient
      ctx.lineTo(width, height);
      ctx.lineTo(0, height);
      ctx.closePath();

      const fillGrad = ctx.createLinearGradient(0, centerY, 0, height);
      fillGrad.addColorStop(0, `${layer.color}25`);
      fillGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = fillGrad;
      ctx.fill();

      ctx.restore();
    });
  };

  // --- STYLE 2: 3D Cyber Spectrogram Bars ---
  const draw3DCyberBars = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    themeColors: typeof colors
  ) => {
    const barCount = 48;
    const barWidth = (width / barCount) * 0.75;
    const gap = (width / barCount) * 0.25;

    const grad = ctx.createLinearGradient(0, height, 0, 0);
    grad.addColorStop(0, themeColors.primary);
    grad.addColorStop(0.6, themeColors.secondary);
    grad.addColorStop(1, themeColors.accent);

    for (let i = 0; i < barCount; i++) {
      const dataIdx = Math.floor((i / barCount) * (freqData.length * 0.7));
      const val = freqData[dataIdx] || 0;
      const barHeight = (val / 255) * (height * 0.75);

      const x = i * (barWidth + gap) + gap / 2;
      const y = height - barHeight;

      ctx.save();
      ctx.fillStyle = grad;
      ctx.shadowColor = themeColors.primary;
      ctx.shadowBlur = val > 150 ? 10 : 2;

      // Main Bar
      ctx.fillRect(x, y, barWidth, barHeight);

      // Peak Hold Cap Dot
      ctx.fillStyle = themeColors.accent;
      ctx.fillRect(x, y - 4, barWidth, 2);

      // Mirrored Reflection below
      ctx.globalAlpha = 0.15;
      ctx.fillRect(x, height, barWidth, barHeight * 0.3);

      ctx.restore();
    }
  };

  // --- STYLE 3: Analog CRT Oscilloscope Trace ---
  const drawCRTOscilloscope = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    timeData: Uint8Array,
    themeColors: typeof colors
  ) => {
    const centerY = height / 2;

    ctx.save();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = themeColors.primary;
    ctx.shadowColor = themeColors.primary;
    ctx.shadowBlur = 10;

    ctx.beginPath();

    const sliceWidth = width / timeData.length;
    let x = 0;

    for (let i = 0; i < timeData.length; i++) {
      const v = timeData[i] / 128.0; // 0.0 to 2.0
      const y = (v * height) / 2;

      if (i === 0) ctx.moveTo(x, y);
      else ctx.lineTo(x, y);

      x += sliceWidth;
    }

    ctx.lineTo(width, centerY);
    ctx.stroke();

    // Oscilloscope CRT Grid lines
    ctx.strokeStyle = '#1e293b55';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, centerY);
    ctx.lineTo(width, centerY);
    ctx.moveTo(width / 2, 0);
    ctx.lineTo(width / 2, height);
    ctx.stroke();

    ctx.restore();
  };

  // --- STYLE 4: Radial Portal Spectrum ---
  const drawRadialPortal = (
    ctx: CanvasRenderingContext2D,
    width: number,
    height: number,
    freqData: Uint8Array,
    bassIntensity: number,
    themeColors: typeof colors,
    now: number
  ) => {
    const centerX = width / 2;
    const centerY = height / 2;
    const baseRadius = Math.min(width, height) * 0.22 + bassIntensity * 25;

    ctx.save();

    // Central Pulsing Bass Sphere
    ctx.beginPath();
    ctx.arc(centerX, centerY, baseRadius * 0.8, 0, Math.PI * 2);
    ctx.fillStyle = `${themeColors.primary}33`;
    ctx.shadowColor = themeColors.primary;
    ctx.shadowBlur = 20 + bassIntensity * 30;
    ctx.fill();

    // Radial Spectrum Spokes
    const numSpokes = 64;
    const angleStep = (Math.PI * 2) / numSpokes;

    for (let i = 0; i < numSpokes; i++) {
      const angle = i * angleStep + now * 0.0005;
      const dataIdx = Math.floor((i / numSpokes) * (freqData.length * 0.6));
      const val = freqData[dataIdx] || 0;
      const spokeLength = (val / 255) * (Math.min(width, height) * 0.25);

      const x1 = centerX + Math.cos(angle) * baseRadius;
      const y1 = centerY + Math.sin(angle) * baseRadius;
      const x2 = centerX + Math.cos(angle) * (baseRadius + spokeLength);
      const y2 = centerY + Math.sin(angle) * (baseRadius + spokeLength);

      ctx.strokeStyle = i % 2 === 0 ? themeColors.primary : themeColors.secondary;
      ctx.lineWidth = 3;
      ctx.shadowColor = themeColors.primary;
      ctx.shadowBlur = val > 140 ? 8 : 2;

      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    }

    ctx.restore();
  };

  return (
    <div
      className={`relative w-full h-full overflow-hidden rounded-2xl border border-slate-800/80 bg-slate-950 shadow-2xl flex items-center justify-center ${
        isFullscreen ? 'fixed inset-0 z-50 rounded-none border-none' : ''
      }`}
    >
      <canvas ref={canvasRef} className="w-full h-full block touch-none" />

      {/* Battery Saver FPS Badge */}
      <div className="absolute top-3 left-3 flex items-center gap-2 px-2.5 py-1 bg-slate-900/80 backdrop-blur-md rounded-lg border border-slate-800 text-[10px] font-mono text-slate-400 select-none">
        <span
          className={`w-1.5 h-1.5 rounded-full ${
            battery.batterySaver ? 'bg-amber-400' : 'bg-emerald-400'
          }`}
        />
        <span>{battery.targetFPS} FPS</span>
        {battery.batterySaver && <span className="text-[9px] text-amber-400">(SAVER)</span>}
      </div>
    </div>
  );
};
