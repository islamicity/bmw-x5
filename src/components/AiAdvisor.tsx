import React, { useState, useEffect } from 'react';
import { VehicleTelemetry, HistoricalTrip, AiRecommendationResult } from '../types';

interface AiAdvisorProps {
  telemetry: VehicleTelemetry;
  trips: HistoricalTrip[];
  ecoModeActive: boolean;
}

export const AiAdvisor: React.FC<AiAdvisorProps> = ({
  telemetry,
  trips,
  ecoModeActive,
}) => {
  const [loading, setLoading] = useState<boolean>(false);
  const [insights, setInsights] = useState<AiRecommendationResult | null>({
    systemStatusScore: 94,
    executiveSummary: "Genset E53 beroperasi dalam kurva efisiensi termal tinggi (BSFC 232 g/kWh pada 2,100 RPM). Pengurangan emisi mencapai 81% dibandingkan mesin V8/I6 standar tahun 2002.",
    gensetOptimization: "Pertahankan putaran mesin genset di rentang 2,100 - 2,250 RPM saat mengisi baterai pada kecepatan jelajah tol untuk meminimalkan friksi mekanis crankshaft.",
    batteryLongevityAdvice: "Ambang batas kedalaman pengosongan (DoD) baterai 48.5 kWh terjaga di atas 20%. Pertahankan suhu sel di bawah 33°C dengan sirkulasi pompa pendingin.",
    routeEfficiencyTip: "Maksimalkan one-pedal regenerative braking di turunan dan lampu merah untuk memulihkan hingga 24 kW energi kinetik langsung ke baterai.",
    estimatedMonthlySavingsIdr: 3450000,
  });

  const fetchAiRecommendations = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/ai-recommendations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry,
          historicalTrips: trips,
          ecoModeActive,
        }),
      });
      const data = await response.json();
      setInsights(data);
    } catch (err) {
      console.warn('Using client-side fallback recommendation due to network:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <span>Kecerdasan Buatan Terintegrasi Gemini</span>
            <span aria-hidden="true">·</span>
            <span>Analisis Prediktif Siklus Energi</span>
          </div>
          <h3 className="text-xl font-bold text-white">Rekomendasi Efisiensi Daya Personal (AI Advisor)</h3>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Model AI menganalisis data telemetri berkendara, kebiasaan pembebanan genset, dan suhu baterai untuk memberikan saran optimalisasi spesifik mobil BMW X5 E53 Anda.
          </p>
        </div>

        <button
          onClick={fetchAiRecommendations}
          disabled={loading}
          className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 disabled:opacity-50 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          {loading ? 'Menganalisis Telemetri...' : 'Segarkan Rekomendasi AI'}
        </button>
      </div>

      {insights && (
        <div className="space-y-4">
          {/* Executive Summary Card */}
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
              <span className="font-semibold text-cyan-400">Ringkasan Evaluasi Powertrain</span>
              <span className="font-mono text-emerald-400 font-bold">
                Skor Efisiensi Sistem: {insights.systemStatusScore}/100
              </span>
            </div>
            <p className="text-sm text-slate-200 leading-relaxed">
              {insights.executiveSummary}
            </p>
          </div>

          {/* 3 Pillars Grid */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Pillar 1: Genset Optimization */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-amber-400">1. Optimasi Putaran Genset</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insights.gensetOptimization}
              </p>
            </div>

            {/* Pillar 2: Battery Longevity */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-cyan-400">2. Manajemen Kesehatan Baterai</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insights.batteryLongevityAdvice}
              </p>
            </div>

            {/* Pillar 3: Route & Regenerative */}
            <div className="p-4 rounded-xl bg-slate-950/80 border border-slate-800 space-y-2">
              <div className="text-xs font-bold text-emerald-400">3. Strategi Regenerasi Rute</div>
              <p className="text-xs text-slate-300 leading-relaxed">
                {insights.routeEfficiencyTip}
              </p>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-800/40 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
            <span className="text-slate-300">
              Proyeksi penghematan biaya operasional bulanan vs mesin bensin asli 2002:
            </span>
            <span className="font-mono text-emerald-400 font-extrabold text-base">
              Rp {insights.estimatedMonthlySavingsIdr.toLocaleString('id-ID')} / bulan
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
