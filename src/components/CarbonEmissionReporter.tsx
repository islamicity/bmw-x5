import React from 'react';
import { VehicleTelemetry, HistoricalTrip } from '../types';
import { LinearRegressionEmissionPredictor } from './LinearRegressionEmissionPredictor';

interface CarbonEmissionReporterProps {
  telemetry: VehicleTelemetry;
  trips: HistoricalTrip[];
  onOpenExport: () => void;
  onExportCsv: () => void;
}

export const CarbonEmissionReporter: React.FC<CarbonEmissionReporterProps> = ({
  telemetry,
  trips,
  onOpenExport,
  onExportCsv,
}) => {
  const stockBaselineGPerKm = telemetry.co2BaselineStock; // 320 g/km
  const currentGPerKm = telemetry.co2Rate;
  const reductionPercent = Math.max(0, Math.round(((stockBaselineGPerKm - currentGPerKm) / stockBaselineGPerKm) * 100));
  const treesEquiv = Math.round(telemetry.co2SavedTotalKg / 22); // ~22kg CO2 absorbed per tree per year
  const fuelSavedLiters = Math.round(telemetry.co2SavedTotalKg / 2.31); // ~2.31kg CO2 per liter petrol

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400">Audit Jejak Karbon & Sertifikasi Hijau Otomatis</div>
          <h2 className="text-xl font-bold text-white mt-1">Laporan Emisi & Dekarbonisasi BMW X5 E53</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Sistem telemetri IoT menghitung pengurangan gas buang secara presisi per kilometer dibandingkan spesifikasi emisi pabrikan BMW X5 tahun 2002 (standar Euro 3 bensin).
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={onOpenExport}
            className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Cetak Sertifikat PDF
          </button>
          <button
            onClick={onExportCsv}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
          >
            Unduh CSV Telemetri
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">Tingkat Penurunan Emisi</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-400 mt-1.5 tabular-nums">
            -{reductionPercent}%
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dibandingkan X5 3.0i/4.4i Standar 2002</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">Total Karbon Terhindar (Offset)</div>
          <div className="text-3xl font-extrabold font-mono text-white mt-1.5 tabular-nums">
            {telemetry.co2SavedTotalKg.toFixed(1)} <span className="text-base text-slate-400">kg CO₂</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Tercatat sejak konversi powertrain</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">Ekuivalen Serapan Pohon</div>
          <div className="text-3xl font-extrabold font-mono text-emerald-300 mt-1.5 tabular-nums">
            {treesEquiv} <span className="text-base text-slate-400">Pohon</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Dampak serapan CO₂ tahunan pohon dewasa</div>
        </div>

        <div className="p-5 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="text-xs text-slate-400">BBM Bensin Terhemat</div>
          <div className="text-3xl font-extrabold font-mono text-amber-400 mt-1.5 tabular-nums">
            {fuelSavedLiters} <span className="text-base text-slate-400">Liter</span>
          </div>
          <div className="text-[11px] text-slate-500 mt-1">Setara ~Rp 9.200.000,- biaya BBM</div>
        </div>
      </div>

      {/* Linear Regression Emission Forecast & Optimal Genset Operating Windows */}
      <LinearRegressionEmissionPredictor currentMonthlyGensetHours={28} />

      {/* Comparison Table & Historical Trip Emissions */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-base font-bold text-white">Log Emisi Riwayat Perjalanan Terverifikasi</h3>
          <span className="text-xs text-slate-400 font-mono">Format Standar ISO 14064-1</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-slate-800 text-slate-400">
                <th className="py-2.5 px-3 font-semibold">Tanggal Trip</th>
                <th className="py-2.5 px-3 font-semibold">Jarak Tempuh</th>
                <th className="py-2.5 px-3 font-semibold">Listrik Digunakan</th>
                <th className="py-2.5 px-3 font-semibold">BBM Genset</th>
                <th className="py-2.5 px-3 font-semibold">Emisi Bersih (g/km)</th>
                <th className="py-2.5 px-3 font-semibold text-right">CO₂ Dicegah</th>
                <th className="py-2.5 px-3 font-semibold text-right">Hemat Biaya</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {trips.map((trip) => (
                <tr key={trip.id} className="hover:bg-slate-800/30 transition-colors">
                  <td className="py-3 px-3 text-slate-300">{trip.date}</td>
                  <td className="py-3 px-3 text-white font-bold">{trip.distanceKm.toFixed(1)} km</td>
                  <td className="py-3 px-3 text-cyan-400">{trip.electricKwhUsed.toFixed(1)} kWh</td>
                  <td className="py-3 px-3 text-amber-400">{trip.fuelUsedLiters.toFixed(1)} L</td>
                  <td className="py-3 px-3 text-slate-200">
                    <span className="inline-block px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                      {trip.co2EmittedGPerKm.toFixed(1)} g/km
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right text-emerald-400 font-bold">
                    +{trip.co2SavedKg.toFixed(1)} kg
                  </td>
                  <td className="py-3 px-3 text-right text-slate-300">
                    Rp {trip.costSavedIdr.toLocaleString('id-ID')}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
