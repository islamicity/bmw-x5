import React, { useState } from 'react';
import { VehicleTelemetry, HistoricalTrip, UserPreferences } from '../types';

interface AnalyticsChartsProps {
  telemetry: VehicleTelemetry;
  trips: HistoricalTrip[];
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
  onOpenExport: () => void;
}

export const AnalyticsCharts: React.FC<AnalyticsChartsProps> = ({
  telemetry,
  trips,
  preferences,
  onUpdatePreferences,
  onOpenExport,
}) => {
  const [activeChartTab, setActiveChartTab] = useState<'daily' | 'hourly' | 'monthly'>('daily');

  // Simulated 24-hour cycle energy distribution
  const hourlyData = [
    { hour: '06:00', dischargeKwh: 2.1, gensetKwh: 0.0, regenKwh: 0.4 },
    { hour: '08:00', dischargeKwh: 4.8, gensetKwh: 1.5, regenKwh: 0.9 },
    { hour: '10:00', dischargeKwh: 1.4, gensetKwh: 0.0, regenKwh: 0.2 },
    { hour: '12:00', dischargeKwh: 3.2, gensetKwh: 1.8, regenKwh: 0.6 },
    { hour: '14:00', dischargeKwh: 2.5, gensetKwh: 0.0, regenKwh: 0.5 },
    { hour: '17:00', dischargeKwh: 5.4, gensetKwh: 2.4, regenKwh: 1.1 },
    { hour: '19:00', dischargeKwh: 3.8, gensetKwh: 0.8, regenKwh: 0.7 },
    { hour: '21:00', dischargeKwh: 1.2, gensetKwh: 0.0, regenKwh: 0.3 },
  ];

  // Current monthly cumulative
  const currentMonthTotalKwh = 342;
  const isExceedingBudget = currentMonthTotalKwh > preferences.monthlyEnergyLimitKwh;
  const budgetPercent = Math.min(100, Math.round((currentMonthTotalKwh / preferences.monthlyEnergyLimitKwh) * 100));

  return (
    <div className="space-y-6">
      {/* Overview & Limit Alert Card */}
      <div className={`p-6 rounded-2xl border transition-all ${
        isExceedingBudget 
          ? 'bg-rose-950/20 border-rose-500/60' 
          : 'bg-slate-900/60 border-slate-800'
      }`}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="text-xs font-semibold text-cyan-400">Analisis Konsumsi Statistik Mendalam</div>
            <h2 className="text-xl font-bold text-white mt-1">Tren Penggunaan Energi Harian & Bulanan</h2>
            <p className="text-sm text-slate-400 mt-1 max-w-2xl">
              Memantau rasio konsumsi baterai listrik murni dibandingkan output pembangkit genset mesin untuk mempertahankan efisiensi puncak.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenExport}
              className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
            >
              Ekspor Data (PDF / CSV / Excel)
            </button>
          </div>
        </div>

        {/* Budget Warning Alert Banner */}
        <div className="mt-6 pt-4 border-t border-slate-800">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs mb-2">
            <div className="flex items-center gap-2">
              <span className={`font-semibold ${isExceedingBudget ? 'text-rose-400' : 'text-slate-300'}`}>
                {isExceedingBudget 
                  ? '⚠️ PERINGATAN: Konsumsi energi melampaui batas bulanan yang ditentukan!' 
                  : 'Batas Kuota Penggunaan Energi Bulanan'}
              </span>
            </div>
            <div className="font-mono text-slate-400">
              <span className="text-white font-bold">{currentMonthTotalKwh} kWh</span> / {preferences.monthlyEnergyLimitKwh} kWh ({budgetPercent}%)
            </div>
          </div>

          <div className="w-full bg-slate-800 h-2.5 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 ${
                isExceedingBudget ? 'bg-rose-500' : budgetPercent > 80 ? 'bg-amber-400' : 'bg-cyan-400'
              }`}
              style={{ width: `${budgetPercent}%` }}
            />
          </div>

          <div className="mt-3 flex items-center justify-between text-xs text-slate-500">
            <span>Ubah Batas Kuota Bulanan:</span>
            <div className="flex items-center gap-2">
              {[300, 400, 500, 650].map((kwh) => (
                <button
                  key={kwh}
                  onClick={() => onUpdatePreferences({ monthlyEnergyLimitKwh: kwh })}
                  className={`px-2 py-0.5 rounded text-[11px] font-mono cursor-pointer ${
                    preferences.monthlyEnergyLimitKwh === kwh
                      ? 'bg-cyan-500 text-slate-950 font-bold'
                      : 'bg-slate-800 text-slate-400 hover:text-white'
                  }`}
                >
                  {kwh} kWh
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Interactive Visual Graph View */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveChartTab('daily')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeChartTab === 'daily'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Statistik Harian (7 Hari Terakhir)
            </button>
            <button
              onClick={() => setActiveChartTab('hourly')}
              className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition-colors cursor-pointer ${
                activeChartTab === 'hourly'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Distribusi Per Jam (Siklus 24 Jam)
            </button>
          </div>

          <div className="flex items-center gap-4 text-xs font-mono text-slate-400">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-cyan-400" />
              <span>Daya Listrik (kWh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-amber-400" />
              <span>Genset Mesin (kWh)</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded bg-emerald-400" />
              <span>Regenerasi (kWh)</span>
            </div>
          </div>
        </div>

        {/* Visual Bar Graph */}
        {activeChartTab === 'daily' ? (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-5 gap-4 items-end h-48 border-b border-slate-800 pb-2">
              {trips.map((trip) => {
                const total = trip.electricKwhUsed + trip.gensetKwhGenerated;
                const heightElectric = (trip.electricKwhUsed / 25) * 100;
                const heightGenset = (trip.gensetKwhGenerated / 25) * 100;

                return (
                  <div key={trip.id} className="flex flex-col items-center gap-2 h-full justify-end group">
                    <div className="text-[11px] font-mono text-slate-400 group-hover:text-cyan-400">
                      {total.toFixed(1)} kWh
                    </div>
                    <div className="w-full max-w-[48px] bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-36">
                      <div
                        className="w-full bg-amber-400 transition-all duration-300"
                        style={{ height: `${heightGenset}%` }}
                        title={`Genset: ${trip.gensetKwhGenerated} kWh`}
                      />
                      <div
                        className="w-full bg-cyan-400 transition-all duration-300"
                        style={{ height: `${heightElectric}%` }}
                        title={`Listrik: ${trip.electricKwhUsed} kWh`}
                      />
                    </div>
                    <div className="text-[11px] text-slate-400 font-mono text-center">
                      {trip.date.slice(5)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : (
          <div className="space-y-4 pt-2">
            <div className="grid grid-cols-8 gap-2 items-end h-48 border-b border-slate-800 pb-2">
              {hourlyData.map((d) => (
                <div key={d.hour} className="flex flex-col items-center gap-2 h-full justify-end group">
                  <div className="text-[10px] font-mono text-slate-400">
                    {(d.dischargeKwh + d.gensetKwh).toFixed(1)}
                  </div>
                  <div className="w-full max-w-[28px] bg-slate-800 rounded-t-lg overflow-hidden flex flex-col justify-end h-36">
                    <div
                      className="w-full bg-emerald-400"
                      style={{ height: `${(d.regenKwh / 6) * 100}%` }}
                    />
                    <div
                      className="w-full bg-amber-400"
                      style={{ height: `${(d.gensetKwh / 6) * 100}%` }}
                    />
                    <div
                      className="w-full bg-cyan-400"
                      style={{ height: `${(d.dischargeKwh / 6) * 100}%` }}
                    />
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">
                    {d.hour}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2 text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400">Rata-rata Konsumsi Harian:</span>
            <div className="text-lg font-bold font-mono text-white mt-1">18.8 kWh / 100 km</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400">Rasio Penggerak EV vs Genset:</span>
            <div className="text-lg font-bold font-mono text-cyan-400 mt-1">74% EV : 26% Genset</div>
          </div>
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400">Efisiensi Siklus Regenerasi:</span>
            <div className="text-lg font-bold font-mono text-emerald-400 mt-1">+16.4% Energi Pulih</div>
          </div>
        </div>
      </div>
    </div>
  );
};
