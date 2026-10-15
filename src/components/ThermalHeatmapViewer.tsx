import React, { useState } from 'react';
import {
  ThermalTelemetryState,
} from '../types';

interface ThermalHeatmapViewerProps {
  thermalData: ThermalTelemetryState;
  onUpdatePalette: (palette: ThermalTelemetryState['activePalette']) => void;
  onSimulateThermalSpike: () => void;
  onSimulateChillerMax: () => void;
  onSimulateBatteryHotspot: () => void;
  onResetThermalNorm: () => void;
  isSimulatingSpike: boolean;
  isChillerMax: boolean;
}

export const ThermalHeatmapViewer: React.FC<ThermalHeatmapViewerProps> = ({
  thermalData,
  onUpdatePalette,
  onSimulateThermalSpike,
  onSimulateChillerMax,
  onSimulateBatteryHotspot,
  onResetThermalNorm,
  isSimulatingSpike,
  isChillerMax,
}) => {
  const [activeView, setActiveView] = useState<'ALL' | 'BATTERY' | 'INVERTER'>('ALL');
  const [selectedModuleId, setSelectedModuleId] = useState<number>(7);
  const [selectedInverterZoneId, setSelectedInverterZoneId] = useState<string>('u_hi');
  const [showIsotherms, setShowIsotherms] = useState<boolean>(true);

  // Color mapping functions
  const getThermalColor = (
    temp: number,
    minTemp = 24,
    maxTemp = 75,
    palette = thermalData.activePalette
  ): { bg: string; text: string; hex: string; glow: string } => {
    // Normalize 0 to 1
    const norm = Math.max(0, Math.min(1, (temp - minTemp) / (maxTemp - minTemp)));

    if (palette === 'FLIR_IRON') {
      // Ironbow: deep navy/purple -> violet -> magenta -> orange -> bright yellow -> white
      if (norm < 0.2) return { bg: 'bg-indigo-950/90 text-indigo-200', text: 'text-indigo-300', hex: '#1e1b4b', glow: 'rgba(30, 27, 75, 0.4)' };
      if (norm < 0.4) return { bg: 'bg-purple-900/90 text-purple-100', text: 'text-purple-200', hex: '#581c87', glow: 'rgba(88, 28, 135, 0.5)' };
      if (norm < 0.6) return { bg: 'bg-fuchsia-700/90 text-fuchsia-50', text: 'text-fuchsia-100', hex: '#a21caf', glow: 'rgba(162, 28, 175, 0.6)' };
      if (norm < 0.8) return { bg: 'bg-amber-600/90 text-amber-50', text: 'text-amber-100', hex: '#d97706', glow: 'rgba(217, 119, 6, 0.7)' };
      return { bg: 'bg-yellow-400 text-slate-950 font-black', text: 'text-slate-950', hex: '#facc15', glow: 'rgba(250, 204, 21, 0.8)' };
    }

    if (palette === 'RAINBOW') {
      // Deep blue -> cyan -> green -> yellow -> red
      if (norm < 0.2) return { bg: 'bg-blue-950/90 text-blue-200', text: 'text-blue-300', hex: '#172554', glow: 'rgba(23, 37, 84, 0.4)' };
      if (norm < 0.4) return { bg: 'bg-cyan-800/90 text-cyan-50', text: 'text-cyan-100', hex: '#155e75', glow: 'rgba(21, 94, 117, 0.5)' };
      if (norm < 0.6) return { bg: 'bg-emerald-700/90 text-emerald-50', text: 'text-emerald-100', hex: '#047857', glow: 'rgba(4, 120, 87, 0.6)' };
      if (norm < 0.8) return { bg: 'bg-amber-500/90 text-amber-950 font-bold', text: 'text-amber-950', hex: '#f59e0b', glow: 'rgba(245, 158, 11, 0.7)' };
      return { bg: 'bg-rose-600 text-white font-black', text: 'text-white', hex: '#e11d48', glow: 'rgba(225, 29, 72, 0.8)' };
    }

    if (palette === 'BMW_AMBER') {
      // Classic BMW amber instrument cluster theme
      if (norm < 0.25) return { bg: 'bg-slate-950 text-amber-800', text: 'text-amber-700', hex: '#451a03', glow: 'rgba(69, 26, 3, 0.3)' };
      if (norm < 0.5) return { bg: 'bg-amber-950/80 text-amber-300', text: 'text-amber-400', hex: '#78350f', glow: 'rgba(120, 53, 15, 0.5)' };
      if (norm < 0.75) return { bg: 'bg-amber-700/90 text-amber-100', text: 'text-amber-100', hex: '#b45309', glow: 'rgba(180, 83, 9, 0.7)' };
      return { bg: 'bg-amber-400 text-slate-950 font-black', text: 'text-slate-950', hex: '#fbbf24', glow: 'rgba(251, 191, 36, 0.9)' };
    }

    // Default: NEON_CYAN
    if (norm < 0.25) return { bg: 'bg-slate-900 text-slate-400', text: 'text-slate-400', hex: '#0f172a', glow: 'rgba(15, 23, 42, 0.3)' };
    if (norm < 0.5) return { bg: 'bg-cyan-950/90 text-cyan-200', text: 'text-cyan-300', hex: '#083344', glow: 'rgba(8, 51, 68, 0.5)' };
    if (norm < 0.75) return { bg: 'bg-cyan-600/90 text-cyan-50', text: 'text-cyan-50', hex: '#0891b2', glow: 'rgba(8, 145, 178, 0.7)' };
    return { bg: 'bg-rose-500 text-white font-black', text: 'text-white', hex: '#f43f5e', glow: 'rgba(244, 63, 94, 0.9)' };
  };

  const selectedModule =
    thermalData.batteryZones.find((z) => z.moduleId === selectedModuleId) ||
    thermalData.batteryZones[0];

  const selectedInverterZone =
    thermalData.inverterZones.find((z) => z.zoneId === selectedInverterZoneId) ||
    thermalData.inverterZones[0];

  const bankAZones = thermalData.batteryZones.filter((z) => z.bank === 'BANK_A_FLOOR');
  const bankBZones = thermalData.batteryZones.filter((z) => z.bank === 'BANK_B_REAR');

  const isBatteryHotspotAlert = thermalData.batteryDeltaTempC > 4.5;
  const isInverterHotspotAlert = thermalData.inverterMaxTempC > 68;

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      {/* Top Header & View Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span>Peta Panas Real-Time Inframerah Termal</span>
            <span aria-hidden="true">·</span>
            <span>BMS 96S & SiC Inverter</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">Sampling 100ms</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Visualisasi Distribusi Suhu Modul Baterai & Inverter SiC
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Pelacakan termal multi-titik presisi tinggi pada sel baterai traksi 48.5 kWh BMW X5 E53 dan semikonduktor daya SiC MOSFET untuk mendeteksi *hotspot*, deviasi resistansi kontak terminal, dan efektivitas pelat pendingin cair (*chiller plate*).
          </p>
        </div>

        {/* View Switches & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* View mode toggle */}
          <div className="inline-flex rounded-lg bg-slate-950 p-1 border border-slate-800 text-xs font-semibold">
            <button
              onClick={() => setActiveView('ALL')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeView === 'ALL'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Semua Sistem
            </button>
            <button
              onClick={() => setActiveView('BATTERY')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeView === 'BATTERY'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Modul Baterai (16)
            </button>
            <button
              onClick={() => setActiveView('INVERTER')}
              className={`px-3 py-1.5 rounded-md transition-colors cursor-pointer ${
                activeView === 'INVERTER'
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Inverter SiC
            </button>
          </div>

          {/* Palette Selector */}
          <div className="inline-flex items-center gap-1.5 bg-slate-950 px-2.5 py-1 rounded-lg border border-slate-800 text-xs">
            <span className="text-slate-400 text-[11px]">Palet:</span>
            <select
              value={thermalData.activePalette}
              onChange={(e) =>
                onUpdatePalette(e.target.value as ThermalTelemetryState['activePalette'])
              }
              className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer"
            >
              <option value="FLIR_IRON" className="bg-slate-900 text-white">
                FLIR Ironbow (Standar)
              </option>
              <option value="RAINBOW" className="bg-slate-900 text-white">
                Thermal Rainbow
              </option>
              <option value="BMW_AMBER" className="bg-slate-900 text-white">
                BMW E53 Amber
              </option>
              <option value="NEON_CYAN" className="bg-slate-900 text-white">
                Electric Cyan
              </option>
            </select>
          </div>

          {/* Overlay Toggles */}
          <button
            onClick={() => setShowIsotherms(!showIsotherms)}
            className={`px-2.5 py-1.5 text-xs font-mono rounded-lg border transition-colors cursor-pointer ${
              showIsotherms
                ? 'bg-cyan-950/70 border-cyan-700 text-cyan-300'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:text-white'
            }`}
            title="Tampilkan garis kontur suhu isotermal"
          >
            Kontur {showIsotherms ? 'ON' : 'OFF'}
          </button>
        </div>
      </div>

      {/* KPI Thermal Telemetry Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-6 gap-3 font-mono text-xs">
        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Suhu Maks Baterai</span>
          <div className="text-xl font-black text-white mt-0.5 tabular-nums">
            {thermalData.batteryMaxTempC.toFixed(1)}°C
          </div>
          <span
            className={`text-[10px] font-bold ${
              isBatteryHotspotAlert ? 'text-amber-400' : 'text-emerald-400'
            }`}
          >
            {isBatteryHotspotAlert ? 'Peringatan Hotspot' : 'Nominal (<35°C)'}
          </span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Deviasi Baterai (ΔT)</span>
          <div
            className={`text-xl font-black mt-0.5 tabular-nums ${
              isBatteryHotspotAlert ? 'text-amber-400' : 'text-cyan-400'
            }`}
          >
            {thermalData.batteryDeltaTempC.toFixed(1)}°C
          </div>
          <span className="text-[10px] text-slate-400">Antar 16 Modul</span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Rata-rata Baterai</span>
          <div className="text-xl font-black text-emerald-400 mt-0.5 tabular-nums">
            {thermalData.batteryAvgTempC.toFixed(1)}°C
          </div>
          <span className="text-[10px] text-slate-400">Target Ideal: 28-32°C</span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Suhu Puncak Inverter (Tj)</span>
          <div
            className={`text-xl font-black mt-0.5 tabular-nums ${
              isInverterHotspotAlert ? 'text-rose-400' : 'text-white'
            }`}
          >
            {thermalData.inverterMaxTempC.toFixed(1)}°C
          </div>
          <span className="text-[10px] text-slate-400">Batas Tj: 125°C</span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Suhu Chiller Masuk/Keluar</span>
          <div className="text-base font-bold text-cyan-300 mt-1 tabular-nums">
            {thermalData.chillerInletTempC.toFixed(1)}° / {thermalData.chillerOutletTempC.toFixed(1)}°
          </div>
          <span className="text-[10px] text-slate-400">
            ΔT Chiller: +{(thermalData.chillerOutletTempC - thermalData.chillerInletTempC).toFixed(1)}°C
          </span>
        </div>

        <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
          <span className="text-slate-400 text-[11px]">Pompa Pendingin Chiller</span>
          <div className="text-xl font-black text-cyan-400 mt-0.5 tabular-nums">
            {thermalData.chillerPwmPercent}% PWM
          </div>
          <span className="text-[10px] text-emerald-400 font-bold">
            {isChillerMax ? 'MAX SUPERCOOL' : 'Loop Otomatis'}
          </span>
        </div>
      </div>

      {/* Main Thermal Visualization Display Canvas / Panels */}
      <div className="space-y-6">
        {/* SECTION 1: BATTERY PACK THERMAL HEATMAP */}
        {(activeView === 'ALL' || activeView === 'BATTERY') && (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Peta Panas Paket Baterai 48.5 kWh (Tata Letak Sasis BMW E53)
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/40">
                    2 Bank · 16 Modul Seri
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Klik modul mana saja untuk menginspeksi titik sensor core (inti sel), permukaan luar, terminal busbar, dan disipasi panas.
                </p>
              </div>

              {/* Thermal color scale legend */}
              <div className="flex items-center gap-2 text-[10px] font-mono">
                <span className="text-slate-400">24°C</span>
                <div
                  className="w-32 h-2.5 rounded-full"
                  style={{
                    background:
                      thermalData.activePalette === 'FLIR_IRON'
                        ? 'linear-gradient(to right, #1e1b4b, #581c87, #a21caf, #d97706, #facc15)'
                        : thermalData.activePalette === 'RAINBOW'
                          ? 'linear-gradient(to right, #172554, #155e75, #047857, #f59e0b, #e11d48)'
                          : thermalData.activePalette === 'BMW_AMBER'
                            ? 'linear-gradient(to right, #451a03, #78350f, #b45309, #fbbf24)'
                            : 'linear-gradient(to right, #0f172a, #083344, #0891b2, #f43f5e)',
                  }}
                />
                <span className="text-white font-bold">50°C+</span>
              </div>
            </div>

            {/* Bank A & Bank B Chassis Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              {/* Bank A: Mid Chassis Floor Pack */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-cyan-400">
                    BANK A: Bawah Lantai Tengah (Underfloor Pan)
                  </span>
                  <span className="text-slate-400">Modul #01 - #08</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {bankAZones.map((zone) => {
                    const isSelected = zone.moduleId === selectedModuleId;
                    const color = getThermalColor(zone.coreTempC, 25, 45);

                    return (
                      <button
                        key={zone.moduleId}
                        onClick={() => setSelectedModuleId(zone.moduleId)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg'
                            : 'border-slate-800 hover:border-slate-600'
                        } ${color.bg}`}
                        style={{
                          boxShadow: isSelected ? `0 0 16px ${color.glow}` : undefined,
                        }}
                      >
                        {/* Isotherm ring contour decoration */}
                        {showIsotherms && (
                          <div
                            aria-hidden="true"
                            className="absolute -top-4 -right-4 w-16 h-16 rounded-full border border-white/10 pointer-events-none"
                          />
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="opacity-80 font-bold">{zone.label}</span>
                          {zone.isHotspot && (
                            <span
                              className="px-1 py-0.2 rounded text-[8px] bg-rose-500 text-white font-black animate-pulse"
                              title="Hotspot terdeteksi: Suhu berada di atas deviasi normal"
                            >
                              HOT
                            </span>
                          )}
                        </div>

                        <div className="text-base font-extrabold font-mono tabular-nums">
                          {zone.coreTempC.toFixed(1)}°C
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-mono opacity-75 mt-1">
                          <span>S: {zone.surfaceTempC}°C</span>
                          <span>T: {zone.terminalTempC}°C</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Bank B: Rear Spare Wheel Well Pack */}
              <div className="p-4 rounded-xl bg-slate-900/60 border border-slate-800 space-y-3">
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="font-bold text-amber-400">
                    BANK B: Kompartemen Bagasi Belakang (Rear Well)
                  </span>
                  <span className="text-slate-400">Modul #09 - #16</span>
                </div>

                <div className="grid grid-cols-4 gap-2.5">
                  {bankBZones.map((zone) => {
                    const isSelected = zone.moduleId === selectedModuleId;
                    const color = getThermalColor(zone.coreTempC, 25, 45);

                    return (
                      <button
                        key={zone.moduleId}
                        onClick={() => setSelectedModuleId(zone.moduleId)}
                        className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative overflow-hidden group ${
                          isSelected
                            ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg'
                            : 'border-slate-800 hover:border-slate-600'
                        } ${color.bg}`}
                        style={{
                          boxShadow: isSelected ? `0 0 16px ${color.glow}` : undefined,
                        }}
                      >
                        {showIsotherms && (
                          <div
                            aria-hidden="true"
                            className="absolute -top-4 -right-4 w-16 h-16 rounded-full border border-white/10 pointer-events-none"
                          />
                        )}

                        <div className="flex items-center justify-between text-[10px] font-mono mb-1">
                          <span className="opacity-80 font-bold">{zone.label}</span>
                          {zone.isHotspot && (
                            <span
                              className="px-1 py-0.2 rounded text-[8px] bg-rose-500 text-white font-black animate-pulse"
                              title="Hotspot terdeteksi"
                            >
                              HOT
                            </span>
                          )}
                        </div>

                        <div className="text-base font-extrabold font-mono tabular-nums">
                          {zone.coreTempC.toFixed(1)}°C
                        </div>

                        <div className="flex justify-between items-center text-[9px] font-mono opacity-75 mt-1">
                          <span>S: {zone.surfaceTempC}°C</span>
                          <span>T: {zone.terminalTempC}°C</span>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Selected Module Detailed Probe Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
              <div className="flex flex-wrap items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-cyan-400">
                    Inspektor Sensor Termal {selectedModule.label}:
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                    {selectedModule.bank === 'BANK_A_FLOOR' ? 'Mid Chassis Pan' : 'Rear Well Pan'}
                  </span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    Suhu Inti (Tcore):{' '}
                    <strong className="text-white">{selectedModule.coreTempC.toFixed(1)}°C</strong>
                  </span>
                  <span className="text-slate-400">
                    Permukaan (Tsurf):{' '}
                    <strong className="text-white">{selectedModule.surfaceTempC.toFixed(1)}°C</strong>
                  </span>
                  <span className="text-slate-400">
                    Terminal Busbar (Tbus):{' '}
                    <strong className="text-white">{selectedModule.terminalTempC.toFixed(1)}°C</strong>
                  </span>
                  <span className="text-slate-400">
                    Disipasi Kalor:{' '}
                    <strong className="text-cyan-300">{selectedModule.heatFluxW} W</strong>
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Status Termal:</span>
                <span
                  className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                    selectedModule.isHotspot
                      ? 'bg-rose-950 text-rose-300 border border-rose-800/60'
                      : 'bg-emerald-950 text-emerald-300 border border-emerald-800/60'
                  }`}
                >
                  {selectedModule.isHotspot
                    ? 'HOTSPOT TERDETEKSI (+4.9°C Deviasi)'
                    : 'NOMINAL SEIMBANG'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: INVERTER SIC POWER STAGE THERMAL HEATMAP */}
        {(activeView === 'ALL' || activeView === 'INVERTER') && (
          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800/80 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-white">
                    Peta Panas Inverter Daya SiC 3-Fasa (Silicon-Carbide Power Stage)
                  </h4>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                    Topologi 6-Switch MOSFET · 160 kW Peak
                  </span>
                </div>
                <p className="text-xs text-slate-400 mt-0.5">
                  Visualisasi termal semikonduktor daya pada modul fasa U, V, W, kapasitor DC-link, dan pelat pendingin cair (*cold plate*).
                </p>
              </div>

              <div className="flex items-center gap-2 text-xs font-mono">
                <span className="text-slate-400">Suhu Cold Plate:</span>
                <span className="text-cyan-400 font-bold">
                  {thermalData.chillerInletTempC.toFixed(1)}°C → {thermalData.chillerOutletTempC.toFixed(1)}°C
                </span>
              </div>
            </div>

            {/* Inverter Physical Board & Cold Plate Schematic Visualizer */}
            <div className="p-5 rounded-xl bg-slate-900/50 border border-slate-800 relative min-h-[300px]">
              {/* Cold Plate Fluid Flow Background Layer */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-cyan-950/20 via-slate-900 to-indigo-950/20 pointer-events-none" />

              {/* Flow Arrows in Cold Plate Channel */}
              <div
                aria-hidden="true"
                className="absolute bottom-4 left-6 right-6 flex items-center justify-between text-[11px] font-mono text-cyan-500/70 border-t border-cyan-800/40 pt-2"
              >
                <div className="flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
                  <span>INLET PENDINGIN GLIKOL ({thermalData.chillerInletTempC.toFixed(1)}°C)</span>
                </div>
                <div className="flex items-center gap-1">
                  <span>→ ARUS SIRKULASI COLD PLATE E53 →</span>
                </div>
                <div className="flex items-center gap-2">
                  <span>OUTLET KE RADIATOR ({thermalData.chillerOutletTempC.toFixed(1)}°C)</span>
                  <span className="w-2 h-2 rounded-full bg-amber-400" />
                </div>
              </div>

              {/* Inverter Multi-zone Semiconductor Grid */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10 pb-8">
                {/* Column 1: Phase U */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-1.5">
                    <span>FASA U (SiC)</span>
                    <span className="text-[10px] text-slate-400">42.1 A</span>
                  </div>

                  {thermalData.inverterZones
                    .filter((z) => z.category === 'MOSFET_U')
                    .map((zone) => {
                      const color = getThermalColor(zone.tempC, 30, 85);
                      const isSelected = zone.zoneId === selectedInverterZoneId;

                      return (
                        <button
                          key={zone.zoneId}
                          onClick={() => setSelectedInverterZoneId(zone.zoneId)}
                          className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg'
                              : 'border-slate-800 hover:border-slate-700'
                          } ${color.bg}`}
                          style={{
                            boxShadow: isSelected ? `0 0 16px ${color.glow}` : undefined,
                          }}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold">{zone.label}</span>
                            <span>{zone.powerLossW}W</span>
                          </div>
                          <div className="text-lg font-black font-mono tabular-nums mt-1">
                            {zone.tempC.toFixed(1)}°C
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Column 2: Phase V */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-1.5">
                    <span>FASA V (SiC)</span>
                    <span className="text-[10px] text-slate-400">42.4 A</span>
                  </div>

                  {thermalData.inverterZones
                    .filter((z) => z.category === 'MOSFET_V')
                    .map((zone) => {
                      const color = getThermalColor(zone.tempC, 30, 85);
                      const isSelected = zone.zoneId === selectedInverterZoneId;

                      return (
                        <button
                          key={zone.zoneId}
                          onClick={() => setSelectedInverterZoneId(zone.zoneId)}
                          className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg'
                              : 'border-slate-800 hover:border-slate-700'
                          } ${color.bg}`}
                          style={{
                            boxShadow: isSelected ? `0 0 16px ${color.glow}` : undefined,
                          }}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold">{zone.label}</span>
                            <span>{zone.powerLossW}W</span>
                          </div>
                          <div className="text-lg font-black font-mono tabular-nums mt-1">
                            {zone.tempC.toFixed(1)}°C
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Column 3: Phase W */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-cyan-400 border-b border-slate-800 pb-1.5">
                    <span>FASA W (SiC)</span>
                    <span className="text-[10px] text-slate-400">41.9 A</span>
                  </div>

                  {thermalData.inverterZones
                    .filter((z) => z.category === 'MOSFET_W')
                    .map((zone) => {
                      const color = getThermalColor(zone.tempC, 30, 85);
                      const isSelected = zone.zoneId === selectedInverterZoneId;

                      return (
                        <button
                          key={zone.zoneId}
                          onClick={() => setSelectedInverterZoneId(zone.zoneId)}
                          className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg'
                              : 'border-slate-800 hover:border-slate-700'
                          } ${color.bg}`}
                          style={{
                            boxShadow: isSelected ? `0 0 16px ${color.glow}` : undefined,
                          }}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold">{zone.label}</span>
                            <span>{zone.powerLossW}W</span>
                          </div>
                          <div className="text-lg font-black font-mono tabular-nums mt-1">
                            {zone.tempC.toFixed(1)}°C
                          </div>
                        </button>
                      );
                    })}
                </div>

                {/* Column 4: DC Bus Caps & Gate Driver */}
                <div className="p-3.5 rounded-xl bg-slate-950/80 border border-slate-800 space-y-3">
                  <div className="flex items-center justify-between text-xs font-mono font-bold text-amber-400 border-b border-slate-800 pb-1.5">
                    <span>DC-LINK & DRIVER</span>
                    <span className="text-[10px] text-slate-400">400V Rail</span>
                  </div>

                  {thermalData.inverterZones
                    .filter(
                      (z) => z.category === 'DC_CAPACITOR' || z.category === 'GATE_DRIVER'
                    )
                    .map((zone) => {
                      const color = getThermalColor(zone.tempC, 28, 65);
                      const isSelected = zone.zoneId === selectedInverterZoneId;

                      return (
                        <button
                          key={zone.zoneId}
                          onClick={() => setSelectedInverterZoneId(zone.zoneId)}
                          className={`w-full p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                            isSelected
                              ? 'ring-2 ring-cyan-400 border-cyan-400 shadow-lg'
                              : 'border-slate-800 hover:border-slate-700'
                          } ${color.bg}`}
                          style={{
                            boxShadow: isSelected ? `0 0 16px ${color.glow}` : undefined,
                          }}
                        >
                          <div className="flex justify-between items-center text-[10px] font-mono">
                            <span className="font-bold">{zone.label}</span>
                            <span>{zone.powerLossW}W</span>
                          </div>
                          <div className="text-lg font-black font-mono tabular-nums mt-1">
                            {zone.tempC.toFixed(1)}°C
                          </div>
                        </button>
                      );
                    })}
                </div>
              </div>
            </div>

            {/* Selected Inverter Zone Detailed Banner */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row items-start md:items-center justify-between gap-4 text-xs font-mono">
              <div className="flex items-center gap-4">
                <span className="font-bold text-cyan-400">
                  Detail Zona Semikonduktor: {selectedInverterZone.label}
                </span>
                <span className="text-slate-300">
                  Suhu Sambungan (Tj): <strong className="text-white">{selectedInverterZone.tempC.toFixed(1)}°C</strong>
                </span>
                <span className="text-slate-300">
                  Batas Aman Maks: <strong className="text-white">{selectedInverterZone.maxLimitC}°C</strong>
                </span>
                <span className="text-slate-300">
                  Kehilangan Daya (Loss): <strong className="text-cyan-300">{selectedInverterZone.powerLossW} Watt</strong>
                </span>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-slate-400">Margin Termal:</span>
                <span className="text-emerald-400 font-bold">
                  {(selectedInverterZone.maxLimitC - selectedInverterZone.tempC).toFixed(1)}°C Headroom
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Interactive Simulation Controls for Stress Testing & Thermal Verification */}
      <div className="p-4 rounded-xl bg-slate-950 border border-slate-800/80 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2">
          <span className="font-mono text-cyan-400 font-bold">Uji Stres Termal Real-Time:</span>
          <span className="text-slate-400 text-[11px]">
            Simulasikan dinamika beban panas dan efektivitas disipasi sistem pendingin hibrida.
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onSimulateThermalSpike}
            disabled={isSimulatingSpike}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-rose-950/80 text-rose-300 border border-rose-800/60 hover:bg-rose-900/60 transition-colors cursor-pointer disabled:opacity-50"
          >
            {isSimulatingSpike ? 'Memanaskan Inverter (+15°C)...' : 'Simulasi Beban Arus Puncak'}
          </button>

          <button
            onClick={onSimulateBatteryHotspot}
            className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-amber-950/80 text-amber-300 border border-amber-800/60 hover:bg-amber-900/60 transition-colors cursor-pointer"
          >
            Picu Hotspot Modul #07
          </button>

          <button
            onClick={onSimulateChillerMax}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-colors cursor-pointer ${
              isChillerMax
                ? 'bg-cyan-500 text-slate-950 font-bold'
                : 'bg-cyan-950/80 text-cyan-300 border-cyan-800/60 hover:bg-cyan-900/60'
            }`}
          >
            {isChillerMax ? 'Chiller 100% Aktif' : 'Aktifkan Chiller Maks (-8°C)'}
          </button>

          <button
            onClick={onResetThermalNorm}
            className="px-3 py-1.5 rounded-lg text-xs font-medium bg-slate-800 text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            Reset Suhu Normal
          </button>
        </div>
      </div>
    </div>
  );
};
