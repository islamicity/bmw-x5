import React from 'react';
import { VehicleTelemetry, PowertrainMode } from '../types';

interface TelemetryCockpitProps {
  telemetry: VehicleTelemetry;
  powertrainMode: PowertrainMode;
  setPowertrainMode: (mode: PowertrainMode) => void;
  ecoModeActive: boolean;
  onSpeedChange: (speed: number) => void;
  onThrottleChange: (throttle: number) => void;
  onSimulateCriticalBattery: () => void;
  onToggleGenset: () => void;
  onOpenDiagnostics?: () => void;
  heroImage: string;
}

export const TelemetryCockpit: React.FC<TelemetryCockpitProps> = ({
  telemetry,
  powertrainMode,
  setPowertrainMode,
  ecoModeActive,
  onSpeedChange,
  onThrottleChange,
  onSimulateCriticalBattery,
  onToggleGenset,
  onOpenDiagnostics,
  heroImage,
}) => {
  const isCriticalBattery = telemetry.batterySoc < 15;
  const isWarningBattery = telemetry.batterySoc >= 15 && telemetry.batterySoc < 25;

  return (
    <div className="space-y-6">
      {/* Hero Vehicle Status Card */}
      <div className="relative rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50">
        <div className="grid grid-cols-1 lg:grid-cols-12 items-stretch">
          <div className="lg:col-span-7 p-6 lg:p-8 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center gap-2 text-xs font-medium text-cyan-400 mb-2">
                <span>Konversi Seri-Paralel E53 REEV</span>
                <span aria-hidden="true">·</span>
                <span>Mesin Genset M54 + 400V HV Pack</span>
                <span aria-hidden="true">·</span>
                <span>Dual 160 kW e-Drive</span>
              </div>
              <h1 className="text-2xl lg:text-3xl font-bold tracking-tight text-white text-balance">
                Infrastruktur Telemetri IoT & Kontrol Genset Cerdas BMW X5 2002
              </h1>
              <p className="mt-2 text-sm text-slate-400 leading-relaxed max-w-2xl">
                Arsitektur hibrida berdaya tinggi yang memanfaatkan mesin pembakaran internal BMW asli sebagai genset beroperasi di kurva RPM paling efisien untuk memompa daya ke paket baterai 48.5 kWh dan motor listrik traksi secara berkelanjutan.
              </p>
            </div>

            {/* Powertrain Mode Selector */}
            <div className="space-y-2">
              <label className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Mode Penggerak Hibrida (Powertrain Logic)
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: 'AUTO_GENSET', label: 'Cerdas Otomatis', desc: 'Genset hidup saat SoC < 30%' },
                  { id: 'PURE_EV', label: 'Murni Listrik (EV)', desc: 'Senyap, genset mati total' },
                  { id: 'GENSET_FORCE_CHARGE', label: 'Fast Charge Genset', desc: 'Isi baterai cepat (2,400 RPM)' },
                  { id: 'SPORT_HYBRID', label: 'Sport Dual-Drive', desc: 'Respons instan motor & genset' },
                ].map((mode) => (
                  <button
                    key={mode.id}
                    onClick={() => setPowertrainMode(mode.id as PowertrainMode)}
                    className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer ${
                      powertrainMode === mode.id
                        ? 'border-cyan-500 bg-cyan-950/40 text-white shadow-sm ring-1 ring-cyan-500/50'
                        : 'border-slate-800 bg-slate-900/60 text-slate-400 hover:border-slate-700 hover:text-slate-300'
                    }`}
                  >
                    <div className="text-xs font-bold leading-tight">{mode.label}</div>
                    <div className="text-[10px] text-slate-500 mt-0.5 leading-snug">{mode.desc}</div>
                  </button>
                ))}
              </div>
            </div>

            {/* Interactive Simulation Controls */}
            <div className="pt-2 border-t border-slate-800/80 flex flex-wrap items-center gap-4">
              <div className="flex-1 min-w-[200px]">
                <div className="flex justify-between text-xs text-slate-400 mb-1">
                  <span>Simulasi Kecepatan Kendaraan</span>
                  <span className="font-mono text-cyan-400 font-semibold">{telemetry.speed} km/h</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="160"
                  value={telemetry.speed}
                  onChange={(e) => onSpeedChange(Number(e.target.value))}
                  className="w-full accent-cyan-400 cursor-pointer h-1.5 bg-slate-800 rounded-lg appearance-none"
                />
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={onSimulateCriticalBattery}
                  className="px-3 py-1.5 text-xs font-medium text-rose-300 bg-rose-950/40 border border-rose-800/50 rounded-lg hover:bg-rose-900/50 transition-colors cursor-pointer"
                >
                  Uji Level Baterai Kritis (12%)
                </button>
                <button
                  onClick={onToggleGenset}
                  className="px-3 py-1.5 text-xs font-medium text-cyan-300 bg-cyan-950/40 border border-cyan-800/50 rounded-lg hover:bg-cyan-900/50 transition-colors cursor-pointer"
                >
                  {telemetry.gensetActive ? 'Hentikan Genset' : 'Paksa Crank Genset'}
                </button>
              </div>
            </div>
          </div>

          <div className="lg:col-span-5 relative min-h-[260px] lg:min-h-full">
            <img
              src={heroImage}
              alt="BMW X5 E53 Hybrid Conversion Studio View"
              referrerPolicy="no-referrer"
              className="absolute inset-0 w-full h-full object-cover object-center"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-slate-950/20 to-transparent lg:bg-gradient-to-r lg:from-slate-950/90 lg:via-slate-950/20 lg:to-transparent" />
            
            <div className="absolute bottom-4 left-4 right-4 p-3 bg-slate-950/80 backdrop-blur-md rounded-xl border border-slate-800 text-xs">
              <div className="flex justify-between items-center text-slate-400">
                <span>Estimasi Jangkauan Total:</span>
                <span className="font-mono text-emerald-400 font-bold text-sm">
                  {telemetry.estimatedRangeKm + (telemetry.gensetActive || telemetry.fuelLevel > 0 ? 680 : 0)} km
                </span>
              </div>
              <div className="flex justify-between items-center text-slate-500 text-[11px] mt-1">
                <span>Listrik Murni: {telemetry.estimatedRangeKm} km</span>
                <span>Buffer Genset: +680 km (Bensin 78L)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Primary Telemetry Stat Grid (Tabular Numerals) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Metric 1: Battery SoC */}
        <div className={`p-5 rounded-xl border ${
          isCriticalBattery 
            ? 'border-rose-500 bg-rose-950/20' 
            : isWarningBattery 
              ? 'border-amber-500 bg-amber-950/20' 
              : 'border-slate-800 bg-slate-900/60'
        }`}>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Daya Baterai (SoC)</span>
            <span className="font-mono text-[11px] text-slate-500">400V LiFePO4</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className={`text-3xl font-extrabold font-mono tabular-nums ${
              isCriticalBattery ? 'text-rose-400 animate-pulse' : isWarningBattery ? 'text-amber-400' : 'text-cyan-400'
            }`}>
              {telemetry.batterySoc.toFixed(1)}%
            </span>
            <span className="text-xs text-slate-400 font-mono">({telemetry.batteryVoltage.toFixed(0)} V)</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className={`h-full transition-all duration-300 rounded-full ${
                isCriticalBattery ? 'bg-rose-500' : isWarningBattery ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${Math.min(100, Math.max(0, telemetry.batterySoc))}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Suhu Sel: {telemetry.batteryTemp.toFixed(1)}°C</span>
            <span>Kesehatan (SOH): {telemetry.batterySoh}%</span>
          </div>
        </div>

        {/* Metric 2: Converted Engine Genset Output */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Genset Mesin M54 (ICE)</span>
            <span className={`text-[11px] font-semibold ${telemetry.gensetActive ? 'text-amber-400' : 'text-slate-500'}`}>
              {telemetry.gensetActive ? 'Generating Power' : 'Standby / Idle'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
              {telemetry.gensetRpm}
            </span>
            <span className="text-xs text-slate-400 font-mono">RPM</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-amber-400 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (telemetry.gensetRpm / 3500) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Daya Listrik: {telemetry.gensetPower.toFixed(1)} kW</span>
            <span>Konsumsi: {telemetry.fuelBurnRate.toFixed(1)} L/h</span>
          </div>
        </div>

        {/* Metric 3: Traction Motor Draw */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Motor Listrik Traksi</span>
            <span className="font-mono text-[11px] text-slate-500">160 kW Inverter</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-white">
              {telemetry.motorPower.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">kW</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-400 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (telemetry.motorPower / 160) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Torsi: {telemetry.motorTorque} Nm</span>
            <span>Regenerasi: +{telemetry.regenPower.toFixed(1)} kW</span>
          </div>
        </div>

        {/* Metric 4: Real-time CO2 Emission & Savings */}
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/60">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Jejak Emisi Karbon Real-time</span>
            <span className="text-[11px] text-emerald-400 font-semibold">-81% vs Asli</span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono tabular-nums text-emerald-400">
              {telemetry.co2Rate.toFixed(0)}
            </span>
            <span className="text-xs text-slate-400 font-mono">g CO₂/km</span>
          </div>
          <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
            <div
              className="h-full bg-emerald-500 transition-all duration-300 rounded-full"
              style={{ width: `${Math.min(100, (telemetry.co2Rate / telemetry.co2BaselineStock) * 100)}%` }}
            />
          </div>
          <div className="flex justify-between items-center text-[11px] text-slate-400 mt-2 font-mono">
            <span>Asli 2002: {telemetry.co2BaselineStock} g/km</span>
            <span>Total Hemat: {telemetry.co2SavedTotalKg.toFixed(1)} kg</span>
          </div>
        </div>
      </div>

      {/* Quick Hardware Diagnostics Status Bar */}
      {onOpenDiagnostics && (
        <div className="p-4 rounded-xl bg-slate-900/70 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex flex-wrap items-center gap-3 text-slate-300 font-mono">
            <span className="text-cyan-400 font-bold">Diagnosa Hardware Terkini:</span>
            <span>BMS ΔV: <strong className="text-white">14 mV</strong> (Seimbang)</span>
            <span className="text-slate-600">·</span>
            <span>Suhu Inverter: <strong className="text-white">{telemetry.inverterTemp.toFixed(1)}°C</strong></span>
            <span className="text-slate-600">·</span>
            <span>Pendingin M54: <strong className="text-white">{telemetry.coolantTemp.toFixed(1)}°C</strong> (1.25 bar)</span>
          </div>
          <button
            onClick={onOpenDiagnostics}
            className="px-3 py-1.5 text-xs font-semibold text-cyan-300 bg-cyan-950/60 border border-cyan-800/60 hover:bg-cyan-900/50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Buka Panel Diagnosa Lengkap →
          </button>
        </div>
      )}
    </div>
  );
};
