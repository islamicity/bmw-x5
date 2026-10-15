import React, { useState } from 'react';
import { VehicleTelemetry, UserPreferences } from '../types';

interface SmartEcoManagerProps {
  telemetry: VehicleTelemetry;
  ecoModeActive: boolean;
  setEcoModeActive: (active: boolean) => void;
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const SmartEcoManager: React.FC<SmartEcoManagerProps> = ({
  telemetry,
  ecoModeActive,
  setEcoModeActive,
  preferences,
  onUpdatePreferences,
}) => {
  const [regenLevel, setRegenLevel] = useState<number>(3);
  const [hvacEcoLimit, setHvacEcoLimit] = useState<boolean>(true);
  const [thermalPreconditioning, setThermalPreconditioning] = useState<boolean>(true);
  const [smoothTorqueRamp, setSmoothTorqueRamp] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      {/* Overview Banner */}
      <div className={`p-6 rounded-2xl border transition-all ${
        ecoModeActive
          ? 'bg-emerald-950/20 border-emerald-500/50 shadow-lg shadow-emerald-500/5'
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
              <span>Algoritma Penghematan Daya Otomatis</span>
              <span aria-hidden="true">·</span>
              <span>Proteksi Degradasi Baterai LiFePO4</span>
            </div>
            <h2 className="text-xl font-bold text-white">Mode Hemat Daya Cerdas (Smart Eco Active)</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Memperpanjang durasi penggunaan harian mobil BMW X5 E53 dengan meratakan kurva pelepasan arus listrik, mengoptimalkan titik efisiensi putaran genset, dan memaksimalkan pemulihan energi kinetik.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setEcoModeActive(!ecoModeActive)}
              className={`px-5 py-2.5 text-sm font-bold rounded-xl border transition-all cursor-pointer ${
                ecoModeActive
                  ? 'bg-emerald-500 text-slate-950 border-emerald-400 hover:bg-emerald-400'
                  : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
              }`}
            >
              {ecoModeActive ? 'Eco Mode: AKTIF' : 'Aktifkan Eco Mode'}
            </button>
          </div>
        </div>

        {/* Benefits Strip */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-6 pt-6 border-t border-slate-800/80">
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Tambahan Jangkauan Harian</div>
            <div className="text-xl font-bold font-mono text-emerald-400 mt-1">+24.5 km</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Lewat regenerasi & pembatasan beban tambahan</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Peningkatan Usia Pakai Sel</div>
            <div className="text-xl font-bold font-mono text-cyan-400 mt-1">+45% Siklus</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Pencegahan deep discharge & over-heat</div>
          </div>
          <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800">
            <div className="text-xs text-slate-400">Efisiensi Bahan Bakar Genset</div>
            <div className="text-xl font-bold font-mono text-amber-400 mt-1">+18.2% BSFC</div>
            <div className="text-[11px] text-slate-500 mt-0.5">Penguncian RPM pada titik termal optimal</div>
          </div>
        </div>
      </div>

      {/* Auto Trigger & Customization Controls */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Auto-Engage Threshold */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Ambang Batas Aktivasi Otomatis (Auto-Trigger)</h3>
          <p className="text-xs text-slate-400">
            Sistem cerdas akan mengaktifkan mode hemat daya secara otomatis jika daya baterai turun di bawah persentase berikut:
          </p>

          <div className="space-y-2 pt-2">
            <div className="flex justify-between items-center text-sm">
              <span className="text-slate-300">Batas Persentase SoC Otomatis</span>
              <span className="font-mono text-emerald-400 font-bold text-base">
                {preferences.autoEcoThreshold}%
              </span>
            </div>
            <input
              type="range"
              min="15"
              max="50"
              step="5"
              value={preferences.autoEcoThreshold}
              onChange={(e) => onUpdatePreferences({ autoEcoThreshold: Number(e.target.value) })}
              className="w-full accent-emerald-400 cursor-pointer h-2 bg-slate-800 rounded-lg appearance-none"
            />
            <div className="flex justify-between text-[11px] text-slate-500 font-mono">
              <span>15% (Agresif)</span>
              <span>30% (Rekomendasi Standar)</span>
              <span>50% (Maksimal)</span>
            </div>
          </div>

          <div className="pt-4 border-t border-slate-800 text-xs text-slate-400 space-y-2">
            <div className="flex items-center justify-between">
              <span>Status Pemicu Saat Ini:</span>
              <span className={`font-semibold ${
                telemetry.batterySoc <= preferences.autoEcoThreshold
                  ? 'text-emerald-400'
                  : 'text-slate-400'
              }`}>
                {telemetry.batterySoc <= preferences.autoEcoThreshold
                  ? `Aktif Otomatis (Baterai ${telemetry.batterySoc.toFixed(1)}% ≤ ${preferences.autoEcoThreshold}%)`
                  : `Standby (Baterai ${telemetry.batterySoc.toFixed(1)}% > ${preferences.autoEcoThreshold}%)`}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Fine-grained Eco Controls */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <h3 className="text-base font-bold text-white">Parameter Pengaturan Efisiensi Kendaraan</h3>

          <div className="space-y-3">
            {/* Regen Level Selector */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-white">Intensitas Pengereman Regeneratif</div>
                <div className="text-[11px] text-slate-500">Tingkat pemulihan energi kinetik saat pedal gas dilepas</div>
              </div>
              <div className="flex items-center gap-1">
                {[1, 2, 3].map((lvl) => (
                  <button
                    key={lvl}
                    onClick={() => setRegenLevel(lvl)}
                    className={`px-2.5 py-1 text-xs font-mono font-bold rounded cursor-pointer ${
                      regenLevel === lvl
                        ? 'bg-emerald-500 text-slate-950'
                        : 'bg-slate-800 text-slate-400 hover:text-white'
                    }`}
                  >
                    L{lvl}
                  </button>
                ))}
              </div>
            </div>

            {/* Smooth Torque Curve */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-white">Perataan Kurva Torsi (Anti-Spike)</div>
                <div className="text-[11px] text-slate-500">Mencegah lonjakan arus berlebih pada inverter</div>
              </div>
              <input
                type="checkbox"
                checked={smoothTorqueRamp}
                onChange={(e) => setSmoothTorqueRamp(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* HVAC Power Limiter */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-white">Pembatasan Daya Kompresor AC (HVAC)</div>
                <div className="text-[11px] text-slate-500">Membatasi konsumsi AC maksimal 1.2 kW saat mode eco</div>
              </div>
              <input
                type="checkbox"
                checked={hvacEcoLimit}
                onChange={(e) => setHvacEcoLimit(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>

            {/* Battery Thermal Preconditioning */}
            <div className="flex items-center justify-between p-3 rounded-xl bg-slate-950 border border-slate-800">
              <div>
                <div className="text-xs font-semibold text-white">Prakondisi Termal Sel Baterai</div>
                <div className="text-[11px] text-slate-500">Menjaga temperatur sel di zona ideal 25°C - 32°C</div>
              </div>
              <input
                type="checkbox"
                checked={thermalPreconditioning}
                onChange={(e) => setThermalPreconditioning(e.target.checked)}
                className="w-4 h-4 accent-emerald-500 cursor-pointer"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
