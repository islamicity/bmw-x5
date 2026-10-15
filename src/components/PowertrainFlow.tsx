import React from 'react';
import { VehicleTelemetry, PowertrainMode } from '../types';

interface PowertrainFlowProps {
  telemetry: VehicleTelemetry;
  powertrainMode: PowertrainMode;
  onToggleGenset: () => void;
  powertrainImage: string;
}

export const PowertrainFlow: React.FC<PowertrainFlowProps> = ({
  telemetry,
  powertrainMode,
  onToggleGenset,
  powertrainImage,
}) => {
  const isGensetGenerating = telemetry.gensetActive && telemetry.gensetPower > 0;
  const isRegenerating = telemetry.regenPower > 0;
  const isMotorDrawing = telemetry.motorPower > 0;

  return (
    <div className="space-y-6">
      {/* Title & Architecture Brief */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900/60 border border-slate-800">
        <div>
          <div className="text-xs font-semibold text-cyan-400">Arsitektur EREV / REEV BMW E53</div>
          <h2 className="text-xl font-bold text-white mt-1">Diagram Aliran Energi & Siklus Genset Hibrida</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Mesin bensin asli dioptimalkan khusus sebagai genset putaran konstan (RPM decouple dari roda), menghasilkan listrik 3-fase AC yang disearahkan oleh inverter 400V untuk mengisi baterai atau langsung menyuplai motor traksi.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={onToggleGenset}
            className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
              telemetry.gensetActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
            }`}
          >
            {telemetry.gensetActive ? 'Matikan Genset' : 'Jalankan Genset (2,200 RPM)'}
          </button>
        </div>
      </div>

      {/* Schematic Diagram Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-stretch">
        {/* Left: Interactive Node Schematic */}
        <div className="lg:col-span-7 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between">
          <div className="text-xs font-semibold text-slate-400 mb-4">
            Aliran Daya Saat Ini ({isGensetGenerating ? 'Genset Mengisi Baterai' : isRegenerating ? 'Regenerasi Energi Kinetik' : 'Pelepasan Baterai'})
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 my-auto py-4">
            {/* Node 1: ICE Engine Genset */}
            <div className={`p-4 rounded-xl border transition-all ${
              telemetry.gensetActive 
                ? 'border-amber-500/80 bg-amber-950/20 shadow-lg shadow-amber-500/5' 
                : 'border-slate-800 bg-slate-900/80'
            }`}>
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-white">Mesin Genset M54</span>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                  telemetry.gensetActive ? 'bg-amber-500/20 text-amber-300' : 'bg-slate-800 text-slate-500'
                }`}>
                  {telemetry.gensetActive ? 'RUNNING' : 'OFF'}
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Putaran:</span>
                  <span className="text-white font-bold">{telemetry.gensetRpm} RPM</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Output Daya:</span>
                  <span className="text-amber-400 font-bold">{telemetry.gensetPower.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Bahan Bakar:</span>
                  <span className="text-slate-300">{telemetry.fuelBurnRate.toFixed(1)} L/h</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Efisiensi BSFC:</span>
                  <span className="text-slate-300">{telemetry.gensetEfficiency} g/kWh</span>
                </div>
              </div>
            </div>

            {/* Node 2: Central Inverter & 400V Battery */}
            <div className="p-4 rounded-xl border border-cyan-500/50 bg-cyan-950/20 shadow-lg shadow-cyan-500/5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-white">Baterai 48.5 kWh</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                  400V DC
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Level SoC:</span>
                  <span className="text-cyan-400 font-bold">{telemetry.batterySoc.toFixed(1)}%</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Tegangan:</span>
                  <span className="text-white font-bold">{telemetry.batteryVoltage.toFixed(0)} V</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Arus Listrik:</span>
                  <span className={telemetry.batteryCurrent > 0 ? 'text-rose-400' : 'text-emerald-400'}>
                    {telemetry.batteryCurrent > 0 ? `-${telemetry.batteryCurrent.toFixed(1)} A` : `+${Math.abs(telemetry.batteryCurrent).toFixed(1)} A`}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Suhu Paket:</span>
                  <span className="text-slate-300">{telemetry.batteryTemp.toFixed(1)}°C</span>
                </div>
              </div>
            </div>

            {/* Node 3: Traction Motor & Wheels */}
            <div className="p-4 rounded-xl border border-emerald-500/50 bg-emerald-950/20 shadow-lg shadow-emerald-500/5">
              <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
                <span className="font-semibold text-white">Motor Traksi</span>
                <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">
                  160 kW
                </span>
              </div>
              <div className="space-y-1.5 text-xs font-mono">
                <div className="flex justify-between text-slate-400">
                  <span>Konsumsi:</span>
                  <span className="text-white font-bold">{telemetry.motorPower.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Torsi:</span>
                  <span className="text-emerald-400 font-bold">{telemetry.motorTorque} Nm</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Regenerasi:</span>
                  <span className="text-emerald-300 font-bold">+{telemetry.regenPower.toFixed(1)} kW</span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>Kecepatan:</span>
                  <span className="text-slate-300">{telemetry.speed} km/h</span>
                </div>
              </div>
            </div>
          </div>

          {/* Energy Path Indicators */}
          <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-slate-400">
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-amber-400 inline-block" />
                <span>Genset → Baterai: {telemetry.gensetActive ? `${telemetry.gensetPower.toFixed(1)} kW (Mengisi)` : '0.0 kW (Off)'}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 inline-block" />
                <span>Baterai → Motor Traksi: {telemetry.motorPower.toFixed(1)} kW</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-400 inline-block" />
                <span>Pengereman Regeneratif: +{telemetry.regenPower.toFixed(1)} kW</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right: Technical Cutaway Blueprint */}
        <div className="lg:col-span-5 rounded-2xl overflow-hidden border border-slate-800 bg-slate-900/50 flex flex-col">
          <div className="relative flex-1 min-h-[280px]">
            <img
              src={powertrainImage}
              alt="BMW X5 E53 Powertrain Genset Architecture"
              referrerPolicy="no-referrer"
              className="w-full h-full object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-950 via-transparent to-transparent" />
            <div className="absolute top-3 left-3 px-2.5 py-1 bg-slate-950/80 backdrop-blur-md rounded-md text-[11px] font-mono text-cyan-300 border border-slate-800">
              CHASSIS E53 (2002) HYBRID ARCHITECTURE
            </div>
          </div>
          <div className="p-4 border-t border-slate-800 bg-slate-950 text-xs text-slate-400 space-y-1">
            <div className="font-semibold text-white">Spesifikasi Modul Genset Terpasang:</div>
            <div>• Genset Coupling: Permanent Magnet Synchronous Generator (PMSG 45 kW)</div>
            <div>• Rasio Transmisi Genset: 1:1 Direct Coupling ke Crankshaft M54</div>
            <div>• Inverter DC Bus: SiC MOSFET 400V 300A dengan pendingin cairan</div>
          </div>
        </div>
      </div>
    </div>
  );
};
