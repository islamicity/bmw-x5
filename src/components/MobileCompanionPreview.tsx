import React from 'react';
import { VehicleTelemetry, PowertrainMode } from '../types';

interface MobileCompanionPreviewProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: VehicleTelemetry;
  powertrainMode: PowertrainMode;
  onToggleGenset: () => void;
  ecoModeActive: boolean;
  onToggleEco: () => void;
}

export const MobileCompanionPreview: React.FC<MobileCompanionPreviewProps> = ({
  isOpen,
  onClose,
  telemetry,
  powertrainMode,
  onToggleGenset,
  ecoModeActive,
  onToggleEco,
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="relative max-w-sm w-full bg-slate-950 border border-slate-800 rounded-[38px] shadow-2xl p-4 ring-1 ring-slate-700/50">
        {/* Dynamic Island / Notch */}
        <div className="w-28 h-5 bg-black rounded-full mx-auto mb-3 flex items-center justify-center">
          <div className="w-3 h-3 rounded-full bg-slate-900 mr-2" />
          <div className="w-2 h-2 rounded-full bg-slate-800" />
        </div>

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-xs font-mono text-slate-400 hover:text-white p-1 cursor-pointer"
        >
          ✕ Tutup
        </button>

        {/* Mobile App Header */}
        <div className="text-center pb-2 border-b border-slate-800/80">
          <div className="text-[11px] font-bold text-cyan-400">BMW E53 MOBILE COMPANION</div>
          <div className="text-xs text-slate-400 font-mono">Sinkron Real-time (24ms)</div>
        </div>

        {/* Mobile Telemetry Body */}
        <div className="py-4 space-y-4">
          {/* Battery Circle & SoC */}
          <div className="p-4 rounded-2xl bg-slate-900 border border-slate-800 text-center">
            <div className="text-xs text-slate-400">Baterai Traksi 400V</div>
            <div className="text-4xl font-black font-mono text-cyan-400 my-1 tabular-nums">
              {telemetry.batterySoc.toFixed(1)}%
            </div>
            <div className="text-xs font-mono text-emerald-400 font-semibold">
              Jangkauan Listrik: {telemetry.estimatedRangeKm} km
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full mt-3 overflow-hidden">
              <div
                className="h-full bg-cyan-400 rounded-full"
                style={{ width: `${telemetry.batterySoc}%` }}
              />
            </div>
          </div>

          {/* Genset Mini Card */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Genset Mesin M54</div>
              <div className="text-[11px] font-mono text-slate-400">
                {telemetry.gensetActive ? `${telemetry.gensetRpm} RPM · ${telemetry.gensetPower.toFixed(1)} kW` : 'Standby / Mati'}
              </div>
            </div>
            <button
              onClick={onToggleGenset}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg border cursor-pointer ${
                telemetry.gensetActive
                  ? 'bg-amber-500/20 text-amber-300 border-amber-500/50'
                  : 'bg-cyan-500 text-slate-950 border-cyan-400'
              }`}
            >
              {telemetry.gensetActive ? 'Stop' : 'Crank'}
            </button>
          </div>

          {/* Quick Eco Mode Toggle */}
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex items-center justify-between">
            <div>
              <div className="text-xs font-bold text-white">Mode Hemat Daya</div>
              <div className="text-[11px] text-slate-400">Batasi beban & maksimalkan regen</div>
            </div>
            <button
              onClick={onToggleEco}
              className={`px-3 py-1.5 text-[11px] font-bold rounded-lg cursor-pointer ${
                ecoModeActive
                  ? 'bg-emerald-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300'
              }`}
            >
              {ecoModeActive ? 'Aktif' : 'Mati'}
            </button>
          </div>

          {/* Mobile Emission Offset */}
          <div className="p-3 bg-emerald-950/20 border border-emerald-800/40 rounded-xl text-center text-xs">
            <span className="text-slate-400">Total Karbon Terhindar:</span>
            <div className="font-mono text-emerald-400 font-bold text-base mt-0.5">
              {telemetry.co2SavedTotalKg.toFixed(1)} kg CO₂ (-81%)
            </div>
          </div>
        </div>

        {/* Mobile Home Bar */}
        <div className="w-32 h-1 bg-slate-600 rounded-full mx-auto mt-2" />
      </div>
    </div>
  );
};
