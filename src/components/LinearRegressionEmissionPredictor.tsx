import React, { useState } from 'react';
import {
  EmissionRegressionModel,
  GensetDispatchWindow,
} from '../types';
import {
  calculateEmissionRegression,
  GENSET_DISPATCH_WINDOWS,
} from '../services/telemetrySimulator';

interface LinearRegressionEmissionPredictorProps {
  currentMonthlyGensetHours?: number;
}

export const LinearRegressionEmissionPredictor: React.FC<LinearRegressionEmissionPredictorProps> = ({
  currentMonthlyGensetHours = 28,
}) => {
  const [projectedHours, setProjectedHours] = useState<number>(currentMonthlyGensetHours);
  const [selectedPointId, setSelectedPointId] = useState<string | null>(null);

  const model: EmissionRegressionModel = calculateEmissionRegression(undefined, projectedHours);

  // SVG Chart Dimensions
  const svgWidth = 680;
  const svgHeight = 260;
  const paddingLeft = 55;
  const paddingRight = 30;
  const paddingTop = 25;
  const paddingBottom = 35;
  const plotWidth = svgWidth - paddingLeft - paddingRight;
  const plotHeight = svgHeight - paddingTop - paddingBottom;

  const maxX = 35; // Max genset hours on X-axis
  const maxY = 180; // Max kg CO2 on Y-axis

  // Convert (x, y) to SVG canvas coordinates
  const getCoords = (x: number, y: number) => {
    const cx = paddingLeft + (Math.max(0, Math.min(maxX, x)) / maxX) * plotWidth;
    const cy = paddingTop + plotHeight - (Math.max(0, Math.min(maxY, y)) / maxY) * plotHeight;
    return { cx, cy };
  };

  // Trendline endpoints
  const lineStart = getCoords(0, model.intercept);
  const lineEnd = getCoords(maxX, model.slope * maxX + model.intercept);

  // Current projected point on trendline
  const currentProjPoint = getCoords(projectedHours, model.monthlyProjectedCo2Kg);

  const selectedPoint = model.dataPoints.find((p) => p.id === selectedPointId);

  return (
    <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 space-y-6">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 border-b border-slate-800 pb-5">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-emerald-400 mb-1">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span>Model Regresi Linier OLS (Ordinary Least Squares)</span>
            <span aria-hidden="true">·</span>
            <span>R² = {model.rSquared} (Korelasi Kuat)</span>
            <span aria-hidden="true">·</span>
            <span className="font-mono text-slate-400">Prediksi Jejak Karbon</span>
          </div>
          <h3 className="text-xl font-bold text-white">
            Prediksi Emisi Karbon Bulanan & Rekomendasi Waktu Genset M54
          </h3>
          <p className="text-xs text-slate-400 mt-1 max-w-2xl">
            Menganalisis korelasi matematis antara durasi operasional genset (jam) terhadap volume emisi CO₂ aktual, serta memetakan jadwal waktu pengisian daya paling hemat energi.
          </p>
        </div>

        {/* Regression Formula Badge */}
        <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 font-mono text-xs text-right shrink-0">
          <div className="text-[10px] text-slate-400">Persamaan Garis Tren Regresi:</div>
          <div className="text-sm font-bold text-cyan-300 mt-0.5">
            ŷ = {model.slope}x + {model.intercept}
          </div>
          <div className="text-[10px] text-emerald-400 mt-1">
            Koefisien Determinasi R² = {(model.rSquared * 100).toFixed(1)}%
          </div>
        </div>
      </div>

      {/* Interactive Monthly Projection Control & KPI Strip */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <span className="text-xs font-bold text-white uppercase tracking-wider font-mono">
              Simulasi Proyeksi Penggunaan Genset Bulanan
            </span>
            <p className="text-xs text-slate-400 mt-0.5">
              Geser nilai jam operasional genset per bulan untuk menghitung prediksi emisi dan persentase dekarbonisasi.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs text-slate-400 font-mono">Preset:</span>
            <button
              onClick={() => setProjectedHours(12)}
              className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-900 text-cyan-300 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Komuter (12 Jam)
            </button>
            <button
              onClick={() => setProjectedHours(28)}
              className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-900 text-emerald-300 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Seimbang (28 Jam)
            </button>
            <button
              onClick={() => setProjectedHours(48)}
              className="px-2.5 py-1 text-[11px] font-mono rounded bg-slate-900 text-amber-300 border border-slate-800 hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Touring (48 Jam)
            </button>
          </div>
        </div>

        {/* Range Slider */}
        <div className="space-y-2 pt-1">
          <div className="flex justify-between text-xs font-mono">
            <span className="text-slate-400">Target Waktu Genset:</span>
            <span className="text-cyan-400 font-bold text-sm">{projectedHours} Jam / Bulan</span>
          </div>
          <input
            type="range"
            min={4}
            max={65}
            step={1}
            value={projectedHours}
            onChange={(e) => setProjectedHours(Number(e.target.value))}
            className="w-full accent-cyan-400 bg-slate-800 h-2 rounded-lg cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-slate-400 font-mono">
            <span>4 Jam (Mayoritas Pure EV)</span>
            <span>30 Jam (Penggunaan Rata-rata)</span>
            <span>65 Jam (Ekspedisi Antar-Kota)</span>
          </div>
        </div>

        {/* KPI Prediction Cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2 font-mono text-xs">
          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Prediksi Emisi Bulanan (ŷ)</span>
            <div className="text-2xl font-black text-white mt-0.5 tabular-nums">
              {model.monthlyProjectedCo2Kg.toFixed(1)}{' '}
              <span className="text-xs text-slate-400 font-normal">kg CO₂</span>
            </div>
            <span className="text-[10px] text-slate-400">Hasil Regresi Linier</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Reduksi Vs X5 Bensin 2002</span>
            <div className="text-2xl font-black text-emerald-400 mt-0.5 tabular-nums">
              -{model.projectedReductionPercent}%
            </div>
            <span className="text-[10px] text-slate-400">Baseline 464 kg/bln</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Net Karbon Terhindar</span>
            <div className="text-2xl font-black text-cyan-400 mt-0.5 tabular-nums">
              +{(model.baselineStockX5Co2Kg - model.monthlyProjectedCo2Kg).toFixed(1)}{' '}
              <span className="text-xs text-slate-400 font-normal">kg CO₂</span>
            </div>
            <span className="text-[10px] text-slate-400">Karbon Offset Bersih</span>
          </div>

          <div className="p-3 bg-slate-900 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Proyeksi Penghematan BBM</span>
            <div className="text-xl font-black text-emerald-400 mt-0.5 tabular-nums">
              Rp {(model.projectedCostSavingsIdr / 1000).toLocaleString('id-ID')}rb
            </div>
            <span className="text-[10px] text-slate-400">Per Bulan vs Bensin M54</span>
          </div>
        </div>
      </div>

      {/* Regression Scatter Plot & Trendline Graph (SVG) */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <h4 className="text-sm font-bold text-white">
              Kurva Sebaran Data Historis (*Scatter Plot*) & Garis Tren Regresi
            </h4>
            <p className="text-xs text-slate-400 mt-0.5">
              Titik lingkaran biru mewakili log operasional mingguan aktual. Garis cyan mewakili prediksi regresi model OLS.
            </p>
          </div>
          <span className="text-xs font-mono text-cyan-400">
            Error Standar Se: ±{model.stdError} kg
          </span>
        </div>

        {/* SVG Plot */}
        <div className="w-full overflow-x-auto">
          <svg
            viewBox={`0 0 ${svgWidth} ${svgHeight}`}
            className="w-full h-auto min-w-[580px] bg-slate-950 rounded-lg select-none"
          >
            {/* Horizontal Gridlines */}
            {[0, 30, 60, 90, 120, 150, 180].map((val) => {
              const { cy } = getCoords(0, val);
              return (
                <g key={val}>
                  <line
                    x1={paddingLeft}
                    y1={cy}
                    x2={paddingLeft + plotWidth}
                    y2={cy}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={paddingLeft - 8}
                    y={cy + 3}
                    textAnchor="end"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {val} kg
                  </text>
                </g>
              );
            })}

            {/* Vertical Gridlines (Jam Genset) */}
            {[0, 5, 10, 15, 20, 25, 30, 35].map((hr) => {
              const { cx } = getCoords(hr, 0);
              return (
                <g key={hr}>
                  <line
                    x1={cx}
                    y1={paddingTop}
                    x2={cx}
                    y2={paddingTop + plotHeight}
                    stroke="#1e293b"
                    strokeDasharray="3 3"
                    strokeWidth="1"
                  />
                  <text
                    x={cx}
                    y={paddingTop + plotHeight + 16}
                    textAnchor="middle"
                    fill="#64748b"
                    fontSize="9"
                    fontFamily="JetBrains Mono, monospace"
                  >
                    {hr} Jam
                  </text>
                </g>
              );
            })}

            {/* Confidence Interval Shaded Band (approx ±1.96 * stdError) */}
            <polygon
              points={`
                ${getCoords(0, model.intercept - model.stdError * 1.6).cx},${getCoords(0, model.intercept - model.stdError * 1.6).cy}
                ${getCoords(maxX, model.slope * maxX + model.intercept - model.stdError * 1.6).cx},${getCoords(maxX, model.slope * maxX + model.intercept - model.stdError * 1.6).cy}
                ${getCoords(maxX, model.slope * maxX + model.intercept + model.stdError * 1.6).cx},${getCoords(maxX, model.slope * maxX + model.intercept + model.stdError * 1.6).cy}
                ${getCoords(0, model.intercept + model.stdError * 1.6).cx},${getCoords(0, model.intercept + model.stdError * 1.6).cy}
              `}
              fill="#06b6d4"
              fillOpacity="0.08"
            />

            {/* Linear Regression Trendline */}
            <line
              x1={lineStart.cx}
              y1={lineStart.cy}
              x2={lineEnd.cx}
              y2={lineEnd.cy}
              stroke="#22d3ee"
              strokeWidth="2.5"
            />

            {/* Historical Scatter Data Points */}
            {model.dataPoints.map((pt) => {
              const { cx, cy } = getCoords(pt.gensetHours, pt.actualCo2EmittedKg);
              const isSelected = pt.id === selectedPointId;

              return (
                <g
                  key={pt.id}
                  onClick={() => setSelectedPointId(pt.id)}
                  className="cursor-pointer group"
                >
                  <circle
                    cx={cx}
                    cy={cy}
                    r={isSelected ? 7 : 5}
                    fill={isSelected ? '#38bdf8' : '#0284c7'}
                    stroke="#ffffff"
                    strokeWidth="2"
                    className="transition-all duration-200"
                  />
                  {/* Tooltip on hover/select */}
                  {isSelected && (
                    <g>
                      <rect
                        x={cx - 50}
                        y={cy - 36}
                        width="100"
                        height="28"
                        rx="5"
                        fill="#090d16"
                        stroke="#38bdf8"
                        strokeWidth="1"
                      />
                      <text
                        x={cx}
                        y={cy - 22}
                        textAnchor="middle"
                        fill="#ffffff"
                        fontSize="9"
                        fontWeight="bold"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.label}
                      </text>
                      <text
                        x={cx}
                        y={cy - 11}
                        textAnchor="middle"
                        fill="#38bdf8"
                        fontSize="8"
                        fontFamily="JetBrains Mono, monospace"
                      >
                        {pt.gensetHours}h → {pt.actualCo2EmittedKg} kg
                      </text>
                    </g>
                  )}
                </g>
              );
            })}

            {/* Projected Point Marker (linked to user slider) */}
            <g>
              <line
                x1={currentProjPoint.cx}
                y1={paddingTop}
                x2={currentProjPoint.cx}
                y2={paddingTop + plotHeight}
                stroke="#f59e0b"
                strokeDasharray="2 2"
                strokeWidth="1.2"
              />
              <circle
                cx={currentProjPoint.cx}
                cy={currentProjPoint.cy}
                r="7"
                fill="#f59e0b"
                stroke="#ffffff"
                strokeWidth="2"
              />
              <rect
                x={currentProjPoint.cx - 55}
                y={paddingTop + 6}
                width="110"
                height="20"
                rx="4"
                fill="#78350f"
                stroke="#f59e0b"
                strokeWidth="1"
              />
              <text
                x={currentProjPoint.cx}
                y={paddingTop + 20}
                textAnchor="middle"
                fill="#ffffff"
                fontSize="9"
                fontWeight="bold"
                fontFamily="JetBrains Mono, monospace"
              >
                PROYEKSI: {model.monthlyProjectedCo2Kg.toFixed(1)} kg
              </text>
            </g>

            {/* Axis Titles */}
            <text
              x={paddingLeft - 30}
              y={paddingTop - 10}
              fill="#94a3b8"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              Emisi CO₂ (kg)
            </text>
            <text
              x={paddingLeft + plotWidth}
              y={paddingTop + plotHeight + 28}
              textAnchor="end"
              fill="#94a3b8"
              fontSize="9"
              fontFamily="JetBrains Mono, monospace"
            >
              Jam Genset Historis →
            </text>
          </svg>
        </div>

        {/* Selected Data Point Inspector */}
        {selectedPoint && (
          <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs font-mono">
            <div className="flex items-center gap-3">
              <span className="font-bold text-cyan-400">Inspeksi Data: {selectedPoint.label}</span>
              <span className="text-slate-300">
                Jam Genset: <strong className="text-white">{selectedPoint.gensetHours} Jam</strong>
              </span>
              <span className="text-slate-300">
                Energi: <strong className="text-cyan-300">{selectedPoint.gensetKwh} kWh</strong>
              </span>
              <span className="text-slate-300">
                BBM: <strong className="text-amber-300">{selectedPoint.fuelUsedLiters} L</strong>
              </span>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-slate-300">
                Emisi Aktual: <strong className="text-white">{selectedPoint.actualCo2EmittedKg} kg</strong>
              </span>
              <span className="text-slate-300">
                Prediksi Regresi: <strong className="text-cyan-400">{selectedPoint.predictedCo2EmittedKg} kg</strong>
              </span>
              <span className="text-emerald-400 font-bold">
                Residual: {selectedPoint.residualError} kg
              </span>
            </div>
          </div>
        )}
      </div>

      {/* SECTION 2: GENSET DISPATCH OPERATIONAL WINDOW RECOMMENDATIONS */}
      <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-3">
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-sm font-bold text-white">
                Rekomendasi Waktu Operasional Genset M54B30 Paling Efisien
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/40">
                Optimasi Termal & BSFC
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-0.5">
              Jadwal pengoperasian mesin genset yang disinkronkan dengan suhu ambien, kepadatan udara intake, dan profil kecepatan berkendara untuk meminimalkan jejak karbon.
            </p>
          </div>
          <span className="text-xs font-mono text-slate-400">
            Target BSFC: 232 g/kWh (2.100 RPM)
          </span>
        </div>

        {/* 4 Windows Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {GENSET_DISPATCH_WINDOWS.map((win) => {
            const isPrime = win.category === 'PRIME_OPTIMAL';
            const isRecommended = win.category === 'RECOMMENDED';
            const isAvoid = win.category === 'AVOID';
            const isSubOptimal = win.category === 'SUB_OPTIMAL';

            return (
              <div
                key={win.timeRange}
                className={`p-4 rounded-xl border space-y-2.5 transition-all ${
                  isPrime
                    ? 'bg-emerald-950/20 border-emerald-500/60 shadow-md shadow-emerald-950/20'
                    : isRecommended
                      ? 'bg-cyan-950/20 border-cyan-500/50'
                      : isAvoid
                        ? 'bg-rose-950/20 border-rose-500/60'
                        : 'bg-slate-900/60 border-slate-800'
                }`}
              >
                <div className="flex items-center justify-between text-xs font-mono">
                  <span className="text-base font-black text-white">{win.timeRange}</span>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      isPrime
                        ? 'bg-emerald-400 text-slate-950'
                        : isRecommended
                          ? 'bg-cyan-400 text-slate-950'
                          : isAvoid
                            ? 'bg-rose-500 text-white font-black animate-pulse'
                            : 'bg-slate-800 text-slate-300'
                    }`}
                  >
                    {isPrime
                      ? 'SANGAT OPTIMAL'
                      : isRecommended
                        ? 'DIREKOMENDASIKAN'
                        : isAvoid
                          ? 'HINDARI OPERASI'
                          : 'STANDBY / WALLBOX'}
                  </span>
                </div>

                <div className="text-xs font-bold text-slate-200">{win.title}</div>

                <div className="grid grid-cols-3 gap-2 text-[10px] font-mono text-slate-400 bg-slate-950/60 p-2 rounded-lg border border-slate-800/80">
                  <div>
                    <span className="text-slate-400">BSFC Bahan Bakar:</span>
                    <div className="font-bold text-white mt-0.5">
                      {win.bsfcEfficiencyGPerKwh > 0 ? `${win.bsfcEfficiencyGPerKwh} g/kWh` : 'Nol (PLN)'}
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Efisiensi Termal:</span>
                    <div className="font-bold text-emerald-400 mt-0.5">
                      {win.thermalEfficiencyPercent}%
                    </div>
                  </div>
                  <div>
                    <span className="text-slate-400">Kecepatan Ideal:</span>
                    <div className="font-bold text-cyan-300 mt-0.5">{win.idealSpeedKmH}</div>
                  </div>
                </div>

                <div className="text-[11px] text-slate-400 font-mono">
                  <span className="text-slate-400">Kondisi Fisik: </span>
                  {win.ambientCondition}
                </div>

                <p className="text-xs text-slate-300 leading-relaxed border-t border-slate-800/60 pt-2">
                  {win.recommendationNote}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
