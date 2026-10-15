import React from 'react';
import { VehicleTelemetry, HistoricalTrip } from '../types';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  telemetry: VehicleTelemetry;
  trips: HistoricalTrip[];
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  telemetry,
  trips,
}) => {
  if (!isOpen) return null;

  const handlePrintPdf = () => {
    window.print();
  };

  const handleDownloadCsv = () => {
    const headers = [
      'ID Trip',
      'Tanggal',
      'Jarak (km)',
      'Durasi (menit)',
      'Konsumsi Listrik (kWh)',
      'Daya Genset (kWh)',
      'BBM Genset (L)',
      'Efisiensi (kWh/100km)',
      'Emisi Bersih (g/km)',
      'CO2 Dicegah (kg)',
      'Penghematan (IDR)',
    ];

    const rows = trips.map((t) => [
      t.id,
      t.date,
      t.distanceKm.toFixed(1),
      t.durationMinutes,
      t.electricKwhUsed.toFixed(1),
      t.gensetKwhGenerated.toFixed(1),
      t.fuelUsedLiters.toFixed(1),
      t.avgEfficiencyKwhPer100Km.toFixed(1),
      t.co2EmittedGPerKm.toFixed(1),
      t.co2SavedKg.toFixed(1),
      t.costSavedIdr,
    ]);

    const csvContent =
      'data:text/csv;charset=utf-8,' +
      [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `BMW_X5_E53_Hybrid_Report_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleDownloadExcel = () => {
    // Generate an Excel XML / TSV format
    const content =
      'ID Trip\tTanggal\tJarak (km)\tListrik (kWh)\tGenset (kWh)\tBensin (L)\tEmisi (g/km)\tCO2 Saved (kg)\tHemat (IDR)\n' +
      trips
        .map(
          (t) =>
            `${t.id}\t${t.date}\t${t.distanceKm}\t${t.electricKwhUsed}\t${t.gensetKwhGenerated}\t${t.fuelUsedLiters}\t${t.co2EmittedGPerKm}\t${t.co2SavedKg}\t${t.costSavedIdr}`
        )
        .join('\n');

    const blob = new Blob([content], { type: 'application/vnd.ms-excel;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `BMW_X5_E53_Hybrid_Ledger_${new Date().toISOString().slice(0, 10)}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md">
      <div className="max-w-3xl w-full bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl p-6 space-y-6 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div>
            <h2 className="text-lg font-bold text-white">Ekspor Laporan Resmi BMW X5 E53 Hybrid</h2>
            <p className="text-xs text-slate-400">Dokumentasi sertifikasi emisi, performa genset, dan audit pengeluaran energi</p>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white text-lg p-1 cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Printable Certificate Preview Sheet */}
        <div className="p-6 bg-slate-950 rounded-xl border border-slate-800 space-y-4 text-xs font-mono">
          <div className="flex justify-between border-b border-slate-800 pb-3">
            <div>
              <div className="font-bold text-white text-sm">SERTIFIKASI EMISI & AUDIT TELEMETRI HIBRIDA</div>
              <div className="text-slate-400">Chassis: BMW X5 E53 (2002) · Mesin: M54B30 REEV Genset</div>
            </div>
            <div className="text-right text-slate-400">
              <div>No. Dokumen: #E53-2026-X49</div>
              <div>Tanggal: {new Date().toLocaleDateString('id-ID')}</div>
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 py-2 text-slate-300">
            <div>
              <span className="text-slate-500">SoC Baterai:</span>
              <div className="text-white font-bold">{telemetry.batterySoc.toFixed(1)}% ({telemetry.batteryVoltage.toFixed(0)}V)</div>
            </div>
            <div>
              <span className="text-slate-500">Kesehatan Baterai (SOH):</span>
              <div className="text-emerald-400 font-bold">{telemetry.batterySoh}% (Grade A)</div>
            </div>
            <div>
              <span className="text-slate-500">Reduksi Emisi CO₂:</span>
              <div className="text-emerald-400 font-bold">-81% vs Emisi Asli</div>
            </div>
            <div>
              <span className="text-slate-500">Total Karbon Hemat:</span>
              <div className="text-cyan-400 font-bold">{telemetry.co2SavedTotalKg.toFixed(1)} kg CO₂</div>
            </div>
          </div>

          <div className="pt-2">
            <div className="font-bold text-slate-300 mb-1">Ringkasan 5 Perjalanan Terakhir:</div>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-[11px]">
                <thead>
                  <tr className="border-b border-slate-800 text-slate-400">
                    <th className="py-1">Tanggal</th>
                    <th className="py-1">Jarak</th>
                    <th className="py-1">Listrik</th>
                    <th className="py-1">Genset</th>
                    <th className="py-1">Emisi Bersih</th>
                    <th className="py-1 text-right">Hemat Biaya</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/40 text-slate-300">
                  {trips.map((t) => (
                    <tr key={t.id}>
                      <td className="py-1">{t.date}</td>
                      <td className="py-1">{t.distanceKm.toFixed(1)} km</td>
                      <td className="py-1">{t.electricKwhUsed.toFixed(1)} kWh</td>
                      <td className="py-1">{t.gensetKwhGenerated.toFixed(1)} kWh</td>
                      <td className="py-1 text-emerald-400">{t.co2EmittedGPerKm.toFixed(1)} g/km</td>
                      <td className="py-1 text-right">Rp {t.costSavedIdr.toLocaleString('id-ID')}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 pt-2">
          <button
            onClick={handlePrintPdf}
            className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
          >
            Cetak / Simpan PDF
          </button>
          <button
            onClick={handleDownloadCsv}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Unduh CSV (.csv)
          </button>
          <button
            onClick={handleDownloadExcel}
            className="px-4 py-2 text-xs font-semibold text-slate-200 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            Unduh Excel (.xls)
          </button>
        </div>
      </div>
    </div>
  );
};
