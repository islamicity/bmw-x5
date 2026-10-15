import React, { useState, useRef, useEffect } from 'react';
import {
  VibrationTelemetryState,
  VibrationHarmonicPeak,
  BearingHealthMetrics,
} from '../types';

interface VibrationAnalyzerProps {
  vibrationData: VibrationTelemetryState;
  onSimulateFault: (fault: VibrationTelemetryState['activeSimulationFault']) => void;
  onResetBalanced: () => void;
  onSelectGensetRpm?: (rpm: number) => void;
  onScheduleService?: (component: string) => void;
}

export const VibrationAnalyzer: React.FC<VibrationAnalyzerProps> = ({
  vibrationData,
  onSimulateFault,
  onResetBalanced,
  onSelectGensetRpm,
  onScheduleService,
}) => {
  const [activeGraphTab, setActiveGraphTab] = useState<'FFT' | 'TIME_WAVEFORM' | 'POLAR_BALANCE'>('FFT');
  const [selectedBearingLocation, setSelectedBearingLocation] = useState<string>('DRIVE_END_ALTERNATOR');
  const [hoveredFreq, setHoveredFreq] = useState<{ freqHz: number; ampMmS: number; x: number; y: number } | null>(null);
  const [audioActive, setAudioActive] = useState<boolean>(false);
  const audioContextRef = useRef<AudioContext | null>(null);
  const oscillatorRef = useRef<OscillatorNode | null>(null);
  const gainNodeRef = useRef<GainNode | null>(null);

  const selectedBearing =
    vibrationData.bearings.find((b) => b.bearingLocation === selectedBearingLocation) ||
    vibrationData.bearings[0];

  // ISO 10816 Zone Color & Text
  const getIsoZoneBadge = (zone: VibrationTelemetryState['iso10816Zone']) => {
    switch (zone) {
      case 'ZONE_A_GOOD':
        return {
          label: 'ZONA A: SANGAT BAIK (< 1.12 mm/s)',
          color: 'text-emerald-400',
          bg: 'bg-emerald-950/70 border-emerald-800/60',
          desc: 'Mesin berputar presisi tinggi tanpa getaran mekanis signifikan.',
        };
      case 'ZONE_B_ACCEPTABLE':
        return {
          label: 'ZONA B: DAPAT DITERIMA (1.12 - 2.80 mm/s)',
          color: 'text-cyan-300',
          bg: 'bg-cyan-950/70 border-cyan-800/60',
          desc: 'Operasi normal berkelanjutan tanpa pembatasan waktu operasional.',
        };
      case 'ZONE_C_UNSATISFACTORY':
        return {
          label: 'ZONA C: PERLU PERHATIAN (2.80 - 4.50 mm/s)',
          color: 'text-amber-400',
          bg: 'bg-amber-950/70 border-amber-800/60',
          desc: 'Getaran tinggi. Perlu pemeriksaan berkala dan kalibrasi balancing terencana.',
        };
      case 'ZONE_D_UNACCEPTABLE':
        return {
          label: 'ZONA D: KRITIS / BAHAYA (> 4.50 mm/s)',
          color: 'text-rose-300',
          bg: 'bg-rose-950/90 border-rose-800 animate-pulse',
          desc: 'Bahaya kerusakan fatal pada bantalan/poros engkol. Diperlukan tindakan segera!',
        };
    }
  };

  const isoInfo = getIsoZoneBadge(vibrationData.iso10816Zone);

  // SVG Chart dimensions
  const svgWidth = 760;
  const svgHeight = 230;
  const paddingLeft = 48;
  const paddingRight = 24;
  const paddingTop = 28;
  const paddingBottom = 32;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const maxHz = 360;
  const maxAmp = Math.max(5.5, Math.ceil(vibrationData.overallVelocityRmsMmS * 1.3));

  // Points conversion for FFT Spectrum
  const fftPolylinePoints = vibrationData.fftSpectrumPoints
    .map((pt) => {
      const x = paddingLeft + (pt.freqHz / maxHz) * plotWidth;
      const y = paddingTop + plotHeight - (pt.ampMmS / maxAmp) * plotHeight;
      return `${x},${y}`;
    })
    .join(' ');

  // Points conversion for Raw Waveform
  const maxTime = 50; // ms
  const maxAccelG = 3.5;
  const waveformPolylinePoints = vibrationData.timeWaveformPoints
    .map((pt) => {
      const x = paddingLeft + (pt.timeMs / maxTime) * plotWidth;
      const y = paddingTop + plotHeight / 2 - (pt.accelG / maxAccelG) * (plotHeight / 2);
      return `${x},${y}`;
    })
    .join(' ');

  // Handle SVG Mouse Move for FFT Point Inspection
  const handleSvgMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    if (activeGraphTab !== 'FFT') return;
    const svgRect = e.currentTarget.getBoundingClientRect();
    const mouseX = e.clientX - svgRect.left;
    const viewBoxX = (mouseX / svgRect.width) * svgWidth;

    if (viewBoxX < paddingLeft || viewBoxX > paddingLeft + plotWidth) {
      setHoveredFreq(null);
      return;
    }

    const freqHz = Math.round(((viewBoxX - paddingLeft) / plotWidth) * maxHz);
    // Find closest point in spectrum points
    let closest = vibrationData.fftSpectrumPoints[0];
    let minDiff = 9999;
    vibrationData.fftSpectrumPoints.forEach((pt) => {
      const diff = Math.abs(pt.freqHz - freqHz);
      if (diff < minDiff) {
        minDiff = diff;
        closest = pt;
      }
    });

    if (closest) {
      const plotX = paddingLeft + (closest.freqHz / maxHz) * plotWidth;
      const plotY = paddingTop + plotHeight - (closest.ampMmS / maxAmp) * plotHeight;
      setHoveredFreq({
        freqHz: closest.freqHz,
        ampMmS: closest.ampMmS,
        x: plotX,
        y: plotY,
      });
    }
  };

  const handleSvgMouseLeave = () => {
    setHoveredFreq(null);
  };

  // Web Audio Acoustic Synthesizer for FFT harmonics
  const toggleAcousticAudio = () => {
    if (audioActive) {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (_) {}
      }
      setAudioActive(false);
      return;
    }

    try {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      const ctx = new AudioCtx();
      audioContextRef.current = ctx;

      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      // Pitch based on fundamental running speed 1X (e.g. 35 Hz to 70 Hz for base sound, scaled for audibility)
      // When bearing defect is active, modulate with high pitch BPFO (~125 Hz)
      let toneFreq = Math.max(55, vibrationData.runningFrequency1xHz * 2);
      if (vibrationData.activeSimulationFault === 'BEARING_BPFO') {
        toneFreq = 125.3;
      } else if (vibrationData.activeSimulationFault === 'BEARING_BPFI') {
        toneFreq = 189.7;
      } else if (vibrationData.activeSimulationFault === 'MISALIGNMENT') {
        toneFreq = vibrationData.runningFrequency1xHz * 2;
      }

      osc.type = vibrationData.activeSimulationFault === 'BEARING_BPFO' ? 'sawtooth' : 'sine';
      osc.frequency.setValueAtTime(toneFreq, ctx.currentTime);

      // Low safe volume
      gain.gain.setValueAtTime(0.04, ctx.currentTime);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();

      oscillatorRef.current = osc;
      gainNodeRef.current = gain;
      setAudioActive(true);
    } catch (_) {
      setAudioActive(false);
    }
  };

  useEffect(() => {
    return () => {
      if (oscillatorRef.current) {
        try {
          oscillatorRef.current.stop();
          oscillatorRef.current.disconnect();
        } catch (_) {}
      }
    };
  }, []);

  // Nearest harmonic peak match for hovered frequency
  const hoveredHarmonic = hoveredFreq
    ? vibrationData.harmonicPeaks.find(
        (p) => Math.abs(p.frequencyHz - hoveredFreq.freqHz) < 8
      )
    : null;

  // Bearing specs database
  const bearingSpecsMap: Record<string, { model: string; pitchDia: string; ballDia: string; numBalls: number; specDesc: string }> = {
    DRIVE_END_ALTERNATOR: {
      model: 'SKF 6208-2RSH/C3',
      pitchDia: '60.0 mm',
      ballDia: '12.0 mm',
      numBalls: 9,
      specDesc: 'Bantalan deep-groove beban radial tinggi di sisi puli poly-V M54B30.',
    },
    NON_DRIVE_END_ALTERNATOR: {
      model: 'SKF 6207-2RSH/C3',
      pitchDia: '53.5 mm',
      ballDia: '11.1 mm',
      numBalls: 9,
      specDesc: 'Bantalan sisi belakang slip-ring penyearah generator 45 kW.',
    },
    CRANK_HARMONIC_DAMPER: {
      model: 'BMW OEM Dual-Mass Elastomer Damper (Corteco)',
      pitchDia: '168.0 mm',
      ballDia: 'N/A (Bonded Rubber)',
      numBalls: 0,
      specDesc: 'Peredam getaran puntir kruk-as M54 dengan frekuensi resonansi terkalibrasi 142 Hz.',
    },
    EWP_PUMP: {
      model: 'Pierburg CWA400 Ceramic Hydro-Bushings',
      pitchDia: '38.0 mm',
      ballDia: 'Canned Magnetic',
      numBalls: 0,
      specDesc: 'Bantalan keramik pelumas air pendingin bldc water pump sirkulasi inverter.',
    },
  };

  const currentBearingSpec = bearingSpecsMap[selectedBearing.bearingLocation] || bearingSpecsMap['DRIVE_END_ALTERNATOR'];

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      {/* Header & ISO Rating Badge */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Analisis Spektrum Vibrasi FFT & Kesehatan Bantalan</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span>Genset M54B30 3.0L & Alternator 45 kW</span>
            <span aria-hidden="true" className="text-slate-600">·</span>
            <span className="font-mono text-slate-400">Standar ISO 10816-3 & ISO 1940-1</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Analisis Vibrasi FFT (Fast Fourier Transform) & Ketidakseimbangan Mekanis
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Mendeteksi anomali dinamis rotasi pada poros engkol M54B30, bantalan alternator generator (Drive-End & Non-Drive End), serta ketidaksejajaran kopling fleksibel guna mencegah keausan fatik beruntun.
          </p>
        </div>

        {/* Current ISO 10816 Status Box */}
        <div className={`p-3.5 rounded-xl border flex flex-col justify-between shrink-0 font-mono ${isoInfo.bg}`}>
          <div className="text-[10px] uppercase font-bold text-slate-400">Keparahan Getaran ISO 10816-3</div>
          <div className={`text-sm font-black mt-0.5 ${isoInfo.color}`}>{isoInfo.label}</div>
          <div className="text-[10px] mt-1 text-slate-300 max-w-xs">{isoInfo.desc}</div>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Kecepatan Getaran (RMS)</span>
          <div className="text-xl font-black text-white mt-0.5 tabular-nums">
            {vibrationData.overallVelocityRmsMmS.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-normal">mm/s</span>
          </div>
          <span
            className={`text-[10px] font-bold ${
              vibrationData.overallVelocityRmsMmS > 4.5
                ? 'text-rose-400'
                : vibrationData.overallVelocityRmsMmS > 2.8
                  ? 'text-amber-400'
                  : 'text-emerald-400'
            }`}
          >
            {vibrationData.overallVelocityRmsMmS > 4.5
              ? 'BAHAYA KERUSAKAN'
              : vibrationData.overallVelocityRmsMmS > 2.8
                ? 'PERLU KALIBRASI'
                : 'Ambang Aman < 2.8'}
          </span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Akselerasi Puncak (g)</span>
          <div className="text-xl font-black text-cyan-400 mt-0.5 tabular-nums">
            {vibrationData.overallPeakAccelG.toFixed(2)}{' '}
            <span className="text-xs text-slate-400 font-normal">g pk-pk</span>
          </div>
          <span className="text-[10px] text-slate-400">Puncak Impulsif Shock</span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Crest Factor (CF)</span>
          <div className="text-xl font-black text-white mt-0.5 tabular-nums">
            {vibrationData.crestFactor.toFixed(1)}
          </div>
          <span className="text-[10px] text-slate-400">
            {vibrationData.crestFactor > 3.5 ? 'Indikasi Cacat Bantalan' : 'Pola Sinusoidal Halus'}
          </span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Frekuensi Putaran 1X</span>
          <div className="text-xl font-black text-amber-400 mt-0.5 tabular-nums">
            {vibrationData.runningFrequency1xHz.toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">Hz</span>
          </div>
          <span className="text-[10px] text-slate-400">
            {vibrationData.currentRpm} RPM Genset
          </span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Indeks Unbalance (1X)</span>
          <div
            className={`text-xl font-black mt-0.5 tabular-nums ${
              vibrationData.unbalanceSeverityPercent > 50 ? 'text-rose-400' : 'text-emerald-400'
            }`}
          >
            {vibrationData.unbalanceSeverityPercent}%
          </div>
          <span className="text-[10px] text-slate-400">
            Fasa: {vibrationData.unbalancePhaseAngleDeg || 28}°
          </span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Koreksi Balancing</span>
          <div
            className={`text-xl font-black mt-0.5 tabular-nums ${
              (vibrationData.balanceCorrectionWeightGram || 1.2) > 10 ? 'text-rose-400' : 'text-cyan-400'
            }`}
          >
            {(vibrationData.balanceCorrectionWeightGram || 1.2).toFixed(1)}{' '}
            <span className="text-xs text-slate-400 font-normal">g</span>
          </div>
          <span className="text-[10px] text-slate-400">
            @ {vibrationData.balanceCorrectionAngleDeg || 208}° Bobot
          </span>
        </div>
      </div>

      {/* Main Interactive Spectrum, Waveform & Polar Balance Display */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className="inline-flex rounded-lg bg-slate-900 p-1 border border-slate-800 text-xs font-semibold">
              <button
                onClick={() => setActiveGraphTab('FFT')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeGraphTab === 'FFT'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Spektrum Frekuensi FFT (Hz)
              </button>
              <button
                onClick={() => setActiveGraphTab('TIME_WAVEFORM')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeGraphTab === 'TIME_WAVEFORM'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Bentuk Gelombang Waktu Raw (ms)
              </button>
              <button
                onClick={() => setActiveGraphTab('POLAR_BALANCE')}
                className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                  activeGraphTab === 'POLAR_BALANCE'
                    ? 'bg-cyan-500 text-slate-950 font-bold'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                Diagram Polar Unbalance & Fasa (°)
              </button>
            </div>

            <button
              onClick={toggleAcousticAudio}
              className={`px-2.5 py-1.5 rounded-md border text-xs font-mono transition-colors cursor-pointer flex items-center gap-1.5 ${
                audioActive
                  ? 'bg-amber-400 text-slate-950 border-amber-300 font-bold animate-pulse'
                  : 'bg-slate-900 text-slate-300 border-slate-700 hover:bg-slate-800'
              }`}
              title="Dengarkan representasi frekuensi getaran audio"
            >
              <span>{audioActive ? '🔊 Stop Audio FFT' : '🔈 Monitor Audio FFT'}</span>
            </button>
          </div>

          {/* Active Anomaly Banner */}
          {vibrationData.lastAnomalyDetected && (
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-rose-950/80 border border-rose-800/80 text-rose-300 text-xs font-mono">
              <span className="font-bold text-rose-400">PERINGATAN:</span>
              <span className="truncate max-w-sm">{vibrationData.lastAnomalyDetected}</span>
            </div>
          )}
        </div>

        {/* Tab 1: FFT Spectrum or Raw Waveform Canvas */}
        {activeGraphTab !== 'POLAR_BALANCE' && (
          <div className="w-full overflow-x-auto relative">
            <svg
              viewBox={`0 0 ${svgWidth} ${svgHeight}`}
              className="w-full h-auto min-w-[640px] bg-slate-950/90 rounded-lg select-none cursor-crosshair"
              onMouseMove={handleSvgMouseMove}
              onMouseLeave={handleSvgMouseLeave}
            >
              <defs>
                <linearGradient id="fftGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.45" />
                  <stop offset="100%" stopColor="#06b6d4" stopOpacity="0.0" />
                </linearGradient>
                <linearGradient id="waveGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#38bdf8" stopOpacity="0.4" />
                  <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.0" />
                </linearGradient>
              </defs>

              {/* Gridlines & Axis */}
              {[0, 1, 2, 3, 4, 5].map((val) => {
                const y = paddingTop + plotHeight - (val / maxAmp) * plotHeight;
                if (val > maxAmp) return null;
                return (
                  <g key={val}>
                    <line
                      x1={paddingLeft}
                      y1={y}
                      x2={paddingLeft + plotWidth}
                      y2={y}
                      stroke="#1e293b"
                      strokeDasharray="3 3"
                      strokeWidth="1"
                    />
                    <text
                      x={paddingLeft - 8}
                      y={y + 3}
                      textAnchor="end"
                      fill="#64748b"
                      fontSize="9"
                      fontFamily="JetBrains Mono, monospace"
                    >
                      {val}
                    </text>
                  </g>
                );
              })}

              {/* ISO 10816 Threshold guideline (2.8 mm/s Warning, 4.5 mm/s Critical) */}
              {activeGraphTab === 'FFT' && (
                <>
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + plotHeight - (2.8 / maxAmp) * plotHeight}
                    x2={paddingLeft + plotWidth}
                    y2={paddingTop + plotHeight - (2.8 / maxAmp) * plotHeight}
                    stroke="#f59e0b"
                    strokeDasharray="4 2"
                    strokeWidth="1.2"
                    opacity="0.6"
                  />
                  <text
                    x={paddingLeft + plotWidth - 10}
                    y={paddingTop + plotHeight - (2.8 / maxAmp) * plotHeight - 4}
                    textAnchor="end"
                    fill="#f59e0b"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    Batas Zona B/C (2.8 mm/s)
                  </text>

                  <line
                    x1={paddingLeft}
                    y1={paddingTop + plotHeight - (4.5 / maxAmp) * plotHeight}
                    x2={paddingLeft + plotWidth}
                    y2={paddingTop + plotHeight - (4.5 / maxAmp) * plotHeight}
                    stroke="#f43f5e"
                    strokeDasharray="4 2"
                    strokeWidth="1.2"
                    opacity="0.8"
                  />
                  <text
                    x={paddingLeft + plotWidth - 10}
                    y={paddingTop + plotHeight - (4.5 / maxAmp) * plotHeight - 4}
                    textAnchor="end"
                    fill="#f43f5e"
                    fontSize="8"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    Batas Bahaya Zona D (4.5 mm/s)
                  </text>
                </>
              )}

              {/* Vertical Frequency / Time Gridlines */}
              {activeGraphTab === 'FFT'
                ? [0, 50, 100, 150, 200, 250, 300, 350].map((hz) => {
                    const x = paddingLeft + (hz / maxHz) * plotWidth;
                    return (
                      <g key={hz}>
                        <line
                          x1={x}
                          y1={paddingTop}
                          x2={x}
                          y2={paddingTop + plotHeight}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={paddingTop + plotHeight + 15}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {hz} Hz
                        </text>
                      </g>
                    );
                  })
                : [0, 10, 20, 30, 40, 50].map((t) => {
                    const x = paddingLeft + (t / maxTime) * plotWidth;
                    return (
                      <g key={t}>
                        <line
                          x1={x}
                          y1={paddingTop}
                          x2={x}
                          y2={paddingTop + plotHeight}
                          stroke="#1e293b"
                          strokeDasharray="3 3"
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={paddingTop + plotHeight + 15}
                          textAnchor="middle"
                          fill="#64748b"
                          fontSize="9"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {t} ms
                        </text>
                      </g>
                    );
                  })}

              {/* Plot Lines */}
              {activeGraphTab === 'FFT' ? (
                <>
                  {/* Filled spectrum area */}
                  <polygon
                    points={`${paddingLeft},${paddingTop + plotHeight} ${fftPolylinePoints} ${
                      paddingLeft + plotWidth
                    },${paddingTop + plotHeight}`}
                    fill="url(#fftGradient)"
                  />
                  {/* Polyline curve */}
                  <polyline
                    fill="none"
                    stroke="#22d3ee"
                    strokeWidth="2"
                    points={fftPolylinePoints}
                  />

                  {/* Harmonic Peak Markers & Tooltip Flags */}
                  {vibrationData.harmonicPeaks.map((peak) => {
                    const x = paddingLeft + (peak.frequencyHz / maxHz) * plotWidth;
                    const y = paddingTop + plotHeight - (peak.amplitudeMmS / maxAmp) * plotHeight;
                    const isSevere = peak.severity === 'CRITICAL' || peak.severity === 'WARNING';

                    return (
                      <g key={peak.order}>
                        <line
                          x1={x}
                          y1={y}
                          x2={x}
                          y2={paddingTop + 10}
                          stroke={isSevere ? '#f43f5e' : '#38bdf8'}
                          strokeWidth="1"
                          strokeDasharray="2 2"
                        />
                        <circle
                          cx={x}
                          cy={y}
                          r={isSevere ? 5.5 : 3.5}
                          fill={isSevere ? '#f43f5e' : '#0284c7'}
                          stroke="#ffffff"
                          strokeWidth="1.5"
                        />
                        {/* Label tag above peak */}
                        <rect
                          x={x - 22}
                          y={paddingTop - 2}
                          width="44"
                          height="16"
                          rx="4"
                          fill="#090d16"
                          stroke={isSevere ? '#f43f5e' : '#334155'}
                          strokeWidth="1"
                        />
                        <text
                          x={x}
                          y={paddingTop + 10}
                          textAnchor="middle"
                          fill={isSevere ? '#f43f5e' : '#e2e8f0'}
                          fontSize="9"
                          fontWeight="bold"
                          fontFamily="JetBrains Mono, monospace"
                        >
                          {peak.order}
                        </text>
                      </g>
                    );
                  })}

                  {/* Hover Crosshair and Inspection Tooltip */}
                  {hoveredFreq && (
                    <g>
                      <line
                        x1={hoveredFreq.x}
                        y1={paddingTop}
                        x2={hoveredFreq.x}
                        y2={paddingTop + plotHeight}
                        stroke="#38bdf8"
                        strokeWidth="1"
                        strokeDasharray="2 2"
                      />
                      <circle
                        cx={hoveredFreq.x}
                        cy={hoveredFreq.y}
                        r="4.5"
                        fill="#38bdf8"
                        stroke="#ffffff"
                        strokeWidth="1.5"
                      />
                      <rect
                        x={Math.min(hoveredFreq.x + 8, svgWidth - 160)}
                        y={Math.max(hoveredFreq.y - 35, paddingTop)}
                        width="150"
                        height="40"
                        rx="6"
                        fill="#020617"
                        stroke="#0ea5e9"
                        strokeWidth="1"
                      />
                      <text
                        x={Math.min(hoveredFreq.x + 16, svgWidth - 152)}
                        y={Math.max(hoveredFreq.y - 18, paddingTop + 15)}
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {hoveredFreq.freqHz} Hz · {hoveredFreq.ampMmS.toFixed(2)} mm/s
                      </text>
                      <text
                        x={Math.min(hoveredFreq.x + 16, svgWidth - 152)}
                        y={Math.max(hoveredFreq.y - 4, paddingTop + 29)}
                        fill="#38bdf8"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {hoveredHarmonic ? `${hoveredHarmonic.order}: ${hoveredHarmonic.label}` : 'Amplitudo Spektral'}
                      </text>
                    </g>
                  )}
                </>
              ) : (
                <>
                  {/* Zero center axis for raw waveform */}
                  <line
                    x1={paddingLeft}
                    y1={paddingTop + plotHeight / 2}
                    x2={paddingLeft + plotWidth}
                    y2={paddingTop + plotHeight / 2}
                    stroke="#334155"
                    strokeWidth="1.5"
                  />
                  <polyline
                    fill="none"
                    stroke="#38bdf8"
                    strokeWidth="2"
                    points={waveformPolylinePoints}
                  />
                </>
              )}

              {/* Axis Titles */}
              <text
                x={paddingLeft - 32}
                y={paddingTop - 12}
                fill="#94a3b8"
                fontSize="9"
                fontFamily="JetBrains Mono, monospace"
              >
                {activeGraphTab === 'FFT' ? 'Amplitudo (mm/s RMS)' : 'Akselerasi Raw (g)'}
              </text>
            </svg>
          </div>
        )}

        {/* Tab 2: Polar Dynamic Balancing Diagram */}
        {activeGraphTab === 'POLAR_BALANCE' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center p-4 bg-slate-950/80 rounded-xl border border-slate-800">
            {/* Polar SVG Compass */}
            <div className="flex justify-center">
              <svg viewBox="0 0 280 280" className="w-64 h-64 select-none">
                {/* Polar Circles */}
                {[30, 60, 90, 115].map((r, i) => (
                  <circle
                    key={r}
                    cx="140"
                    cy="140"
                    r={r}
                    fill="none"
                    stroke="#1e293b"
                    strokeWidth="1"
                    strokeDasharray={i === 3 ? 'none' : '3 3'}
                  />
                ))}

                {/* Angle Radial Lines */}
                {[0, 45, 90, 135, 180, 225, 270, 315].map((deg) => {
                  const rad = (deg * Math.PI) / 180;
                  const x2 = 140 + 115 * Math.cos(rad);
                  const y2 = 140 + 115 * Math.sin(rad);
                  return (
                    <g key={deg}>
                      <line x1="140" y1="140" x2={x2} y2={y2} stroke="#1e293b" strokeWidth="1" />
                      <text
                        x={140 + 128 * Math.cos(rad)}
                        y={140 + 128 * Math.sin(rad) + 4}
                        textAnchor="middle"
                        fill="#64748b"
                        fontSize="9"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {deg}°
                      </text>
                    </g>
                  );
                })}

                {/* Heavy Spot Unbalance Vector */}
                {(() => {
                  const angleDeg = vibrationData.unbalancePhaseAngleDeg || 28;
                  const rad = (angleDeg * Math.PI) / 180;
                  const normMag = Math.min(110, (vibrationData.overallVelocityRmsMmS / 5.5) * 110);
                  const x = 140 + normMag * Math.cos(rad);
                  const y = 140 + normMag * Math.sin(rad);

                  // Correction counter-weight vector (opposite phase 180 deg)
                  const corrRad = ((angleDeg + 180) * Math.PI) / 180;
                  const corrX = 140 + (normMag * 0.75) * Math.cos(corrRad);
                  const corrY = 140 + (normMag * 0.75) * Math.sin(corrRad);

                  return (
                    <>
                      {/* Heavy spot line */}
                      <line
                        x1="140"
                        y1="140"
                        x2={x}
                        y2={y}
                        stroke="#f43f5e"
                        strokeWidth="2.5"
                        strokeLinecap="round"
                      />
                      <circle cx={x} cy={y} r="5" fill="#f43f5e" stroke="#ffffff" strokeWidth="1.5" />

                      {/* Counter-weight target line */}
                      <line
                        x1="140"
                        y1="140"
                        x2={corrX}
                        y2={corrY}
                        stroke="#22d3ee"
                        strokeWidth="2"
                        strokeDasharray="4 2"
                      />
                      <circle cx={corrX} cy={corrY} r="4.5" fill="#22d3ee" stroke="#ffffff" strokeWidth="1.5" />

                      {/* Center hub */}
                      <circle cx="140" cy="140" r="4" fill="#38bdf8" />
                    </>
                  );
                })()}
              </svg>
            </div>

            {/* Polar Analysis Details */}
            <div className="space-y-4 font-mono text-xs">
              <div>
                <span className="text-slate-400">Status Keseimbangan Dinamis ISO 1940-1:</span>
                <div className="text-lg font-bold text-white mt-1">
                  Grade {vibrationData.dynamicBalanceQualityGrade || 'G1.0_PRECISION'}
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Toleransi sisa ketidakseimbangan yang diizinkan untuk rotor alternator kecepatan hingga 3,000 RPM.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-slate-800">
                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Titik Berat (Heavy Spot)</span>
                  <div className="text-base font-bold text-rose-400 mt-1">
                    {vibrationData.unbalancePhaseAngleDeg || 28}°
                  </div>
                  <span className="text-[10px] text-slate-500">Sudut fasa unbalance</span>
                </div>

                <div className="p-3 rounded-lg bg-slate-900 border border-slate-800">
                  <span className="text-slate-400 text-[11px]">Bobot Koreksi Diperlukan</span>
                  <div className="text-base font-bold text-cyan-400 mt-1">
                    {(vibrationData.balanceCorrectionWeightGram || 1.2).toFixed(1)} g @ {vibrationData.balanceCorrectionAngleDeg || 208}°
                  </div>
                  <span className="text-[10px] text-slate-500">Pemasangan bobot balancing</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-cyan-950/40 border border-cyan-800/40 text-cyan-200 text-xs">
                <strong>Rekomendasi Penyetelan Rotor:</strong> Posisikan counter-weight timbal {((vibrationData.balanceCorrectionWeightGram || 1.2)).toFixed(1)} gram pada bidang flens puli alternator di sudut {vibrationData.balanceCorrectionAngleDeg || 208}° berlawanan dari vektor eksentrisitas untuk mencapai getaran di bawah 0.8 mm/s.
              </div>
            </div>
          </div>
        )}

        {/* Harmonic Orders Diagnostic Table */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-2.5 pt-2">
          {vibrationData.harmonicPeaks.map((peak) => {
            const isCritical = peak.severity === 'CRITICAL';
            const isWarning = peak.severity === 'WARNING';

            return (
              <div
                key={peak.order}
                className={`p-3 rounded-xl border text-xs font-mono transition-all ${
                  isCritical
                    ? 'bg-rose-950/40 border-rose-500/80 text-rose-200'
                    : isWarning
                      ? 'bg-amber-950/40 border-amber-500/60 text-amber-200'
                      : 'bg-slate-900/60 border-slate-800 text-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span className="font-bold text-white text-sm">{peak.order}</span>
                  <span
                    className={`text-[9px] px-1.5 py-0.5 rounded font-bold ${
                      isCritical
                        ? 'bg-rose-500 text-slate-950'
                        : isWarning
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-950 text-emerald-300 border border-emerald-800/40'
                    }`}
                  >
                    {peak.severity}
                  </span>
                </div>
                <div className="text-base font-black text-white mt-1 tabular-nums">
                  {peak.amplitudeMmS.toFixed(2)} <span className="text-[10px] text-slate-400">mm/s</span>
                </div>
                <div className="text-[10px] text-cyan-400 mt-0.5">
                  Frekuensi: <strong>{peak.frequencyHz.toFixed(1)} Hz</strong>
                </div>
                <div className="text-[10px] text-slate-400 truncate mt-1" title={peak.sourceComponent}>
                  {peak.label}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rotating Machinery & Bearing Condition Monitoring Grid */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white">
              Status Kesehatan Bantalan (Bearings) & Komponen Berputar M54B30
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Menghitung frekuensi cacat spesifik: BPFO (Outer Race), BPFI (Inner Race), BSF (Ball Spin), dan FTF (Cage Train).
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Metode: High-Frequency Envelope Demodulation
          </span>
        </div>

        {/* 4 Critical Bearings / Rotating Components Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          {vibrationData.bearings.map((b) => {
            const isSelected = b.bearingLocation === selectedBearingLocation;
            const isCritical = b.status === 'CRITICAL';
            const isFair = b.status === 'FAIR';

            return (
              <button
                key={b.bearingLocation}
                onClick={() => setSelectedBearingLocation(b.bearingLocation)}
                className={`p-3.5 rounded-xl border text-left transition-all cursor-pointer ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/30 ring-1 ring-cyan-400 shadow-md'
                    : isCritical
                      ? 'border-rose-500/70 bg-rose-950/20 hover:border-rose-400'
                      : isFair
                        ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                        : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                  <span className="text-slate-400 truncate max-w-[140px]">{b.name}</span>
                  <span
                    className={`px-1.5 py-0.5 rounded font-bold ${
                      isCritical
                        ? 'bg-rose-500 text-slate-950'
                        : isFair
                          ? 'bg-amber-400 text-slate-950'
                          : 'bg-emerald-950 text-emerald-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="flex items-baseline justify-between mt-2">
                  <span className="text-xs text-slate-400 font-mono">Skor Integritas:</span>
                  <span
                    className={`text-xl font-black font-mono tabular-nums ${
                      b.healthScore < 60
                        ? 'text-rose-400'
                        : b.healthScore < 80
                          ? 'text-amber-400'
                          : 'text-emerald-400'
                    }`}
                  >
                    {b.healthScore}%
                  </span>
                </div>

                {/* Progress bar */}
                <div className="w-full bg-slate-800 h-1.5 rounded-full overflow-hidden mt-1.5">
                  <div
                    className={`h-full rounded-full transition-all duration-300 ${
                      b.healthScore < 60 ? 'bg-rose-500' : b.healthScore < 80 ? 'bg-amber-400' : 'bg-emerald-400'
                    }`}
                    style={{ width: `${b.healthScore}%` }}
                  />
                </div>

                <div className="grid grid-cols-2 gap-1 text-[9px] font-mono text-slate-400 mt-2.5 pt-2 border-t border-slate-800/80">
                  <span>BPFO: {b.bpfoHz.toFixed(1)}Hz</span>
                  <span>BPFI: {b.bpfiHz.toFixed(1)}Hz</span>
                  <span>BSF: {b.bsfHz.toFixed(1)}Hz</span>
                  <span>FTF: {b.ftfHz.toFixed(1)}Hz</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Bearing Detailed Diagnostic Banner & Physical Specs */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="font-bold text-cyan-400">Komponen Diinspeksi:</span>
              <span className="text-white font-bold">{selectedBearing.name}</span>
            </div>
            <div className="text-slate-400 text-[11px]">
              Tipe Part: <strong className="text-slate-200">{currentBearingSpec.model}</strong> · Pitch Dia: {currentBearingSpec.pitchDia} · Bola: {currentBearingSpec.numBalls || 'Elastomer'}
            </div>
            <div className="text-slate-400 text-[11px]">
              Tipe Cacat Terindikasi:{' '}
              <strong className={selectedBearing.defectType !== 'NONE' ? 'text-amber-400' : 'text-emerald-400'}>
                {selectedBearing.defectType || 'Tidak Ada (Toleransi Pabrik Standar)'}
              </strong>
            </div>
          </div>

          <div className="text-left md:text-right flex flex-col md:items-end gap-1.5">
            <div className="text-[10px] text-slate-400">Rekomendasi Teknisi Genset:</div>
            <div className="text-xs text-slate-200 max-w-md">
              {selectedBearing.status === 'CRITICAL'
                ? 'Lakukan penggantian bearing SKF dan uji Run-Out poros sebelum siklus pengisian daya berikutnya.'
                : selectedBearing.status === 'FAIR'
                  ? 'Periksa keselarasan kopling fleksibel dan pastikan baut flens ber-torsi 85 Nm.'
                  : 'Bantalan berada dalam kondisi prima. Gemuk pelumas sintetik HT-500 bekerja optimal.'}
            </div>
            {selectedBearing.status === 'CRITICAL' && onScheduleService && (
              <button
                onClick={() => onScheduleService(selectedBearing.name)}
                className="mt-1 px-3 py-1 bg-cyan-400 text-slate-950 font-bold rounded-lg text-xs hover:bg-cyan-300 transition-colors cursor-pointer"
              >
                Jadwalkan Penggantian di Bengkel Resmi
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Interactive Simulation Panel for Mechanical Fault Testing */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-3 text-xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="font-mono text-cyan-400 font-bold">Uji Injeksi Gangguan Mekanis & Putaran:</span>
            <span className="text-slate-400 text-[11px]">
              Simulasikan variasi beban putaran atau kerusakan komponen berputar secara presisi.
            </span>
          </div>
          {/* Quick RPM Presets if supported */}
          {onSelectGensetRpm && (
            <div className="flex items-center gap-2 mt-2 font-mono text-[11px] text-slate-400">
              <span>Kecepatan Genset:</span>
              {[
                { rpm: 750, label: '750 Idle' },
                { rpm: 1800, label: '1800 Eco' },
                { rpm: 2100, label: '2100 Charge' },
                { rpm: 2400, label: '2400 Boost' },
              ].map((p) => (
                <button
                  key={p.rpm}
                  onClick={() => onSelectGensetRpm(p.rpm)}
                  className={`px-2 py-0.5 rounded border transition-colors cursor-pointer ${
                    vibrationData.currentRpm === p.rpm
                      ? 'bg-cyan-950 text-cyan-300 border-cyan-700 font-bold'
                      : 'bg-slate-900 border-slate-800 hover:text-white'
                  }`}
                >
                  {p.label}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => onSimulateFault('MASS_UNBALANCE')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              vibrationData.activeSimulationFault === 'MASS_UNBALANCE'
                ? 'bg-rose-500 text-slate-950 font-bold'
                : 'bg-rose-950/70 text-rose-300 border-rose-800/60 hover:bg-rose-900/60'
            }`}
          >
            Ketidakseimbangan Massa (1X Spike)
          </button>

          <button
            onClick={() => onSimulateFault('BEARING_BPFO')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              vibrationData.activeSimulationFault === 'BEARING_BPFO'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-amber-950/70 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
            }`}
          >
            Cacat Cincin Luar (BPFO)
          </button>

          <button
            onClick={() => onSimulateFault('BEARING_BPFI')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              vibrationData.activeSimulationFault === 'BEARING_BPFI'
                ? 'bg-amber-400 text-slate-950 font-bold'
                : 'bg-amber-950/70 text-amber-300 border-amber-800/60 hover:bg-amber-900/60'
            }`}
          >
            Cacat Cincin Dalam (BPFI)
          </button>

          <button
            onClick={() => onSimulateFault('MISALIGNMENT')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              vibrationData.activeSimulationFault === 'MISALIGNMENT'
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-cyan-950/70 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60'
            }`}
          >
            Salah Penyelarasan Poros (2X)
          </button>

          <button
            onClick={() => onSimulateFault('MECHANICAL_LOOSENESS')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              vibrationData.activeSimulationFault === 'MECHANICAL_LOOSENESS'
                ? 'bg-purple-500 text-slate-950 font-bold'
                : 'bg-purple-950/70 text-purple-300 border-purple-800/60 hover:bg-purple-900/60'
            }`}
          >
            Kelonggaran Baut (0.5X)
          </button>

          <button
            onClick={onResetBalanced}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Reset Seimbang
          </button>
        </div>
      </div>
    </div>
  );
};
