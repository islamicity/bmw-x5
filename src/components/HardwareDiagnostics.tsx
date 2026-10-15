import React, { useState } from 'react';
import {
  BatteryCellDiagnostics,
  InverterDiagnostics,
  M54CoolingDiagnostics,
  VehicleTelemetry,
  PredictiveMaintenanceSummary,
  ThermalTelemetryState,
  VibrationTelemetryState,
} from '../types';
import { ThermalHeatmapViewer } from './ThermalHeatmapViewer';
import { VibrationAnalyzer } from './VibrationAnalyzer';

interface HardwareDiagnosticsProps {
  telemetry: VehicleTelemetry;
  cellDiag: BatteryCellDiagnostics;
  inverterDiag: InverterDiagnostics;
  coolingDiag: M54CoolingDiagnostics;
  predictiveSummary: PredictiveMaintenanceSummary;
  thermalData: ThermalTelemetryState;
  vibrationData: VibrationTelemetryState;
  onUpdatePalette: (palette: ThermalTelemetryState['activePalette']) => void;
  onSimulateThermalSpike: () => void;
  onSimulateChillerMax: () => void;
  onSimulateBatteryHotspot: () => void;
  onResetThermalNorm: () => void;
  isSimulatingSpike: boolean;
  isChillerMax: boolean;
  onSimulateVibrationFault: (fault: VibrationTelemetryState['activeSimulationFault']) => void;
  onResetVibrationBalanced: () => void;
  onTriggerCellBalance: () => void;
  onRunCoolantPurgeTest: () => void;
  onSimulateInverterThermalLoad: () => void;
  onRunPredictiveAnalysis: () => void;
  onAcknowledgeAlert: (alertId: string) => void;
  onScheduleService: (alertId: string) => void;
  onSimulateExpansionFatigue: () => void;
  purgeTesting: boolean;
  isAnalyzingPredictive: boolean;
}

export const HardwareDiagnostics: React.FC<HardwareDiagnosticsProps> = ({
  telemetry,
  cellDiag,
  inverterDiag,
  coolingDiag,
  predictiveSummary,
  thermalData,
  vibrationData,
  onUpdatePalette,
  onSimulateThermalSpike,
  onSimulateChillerMax,
  onSimulateBatteryHotspot,
  onResetThermalNorm,
  isSimulatingSpike,
  isChillerMax,
  onSimulateVibrationFault,
  onResetVibrationBalanced,
  onTriggerCellBalance,
  onRunCoolantPurgeTest,
  onSimulateInverterThermalLoad,
  onRunPredictiveAnalysis,
  onAcknowledgeAlert,
  onScheduleService,
  onSimulateExpansionFatigue,
  purgeTesting,
  isAnalyzingPredictive,
}) => {
  const [selectedCellId, setSelectedCellId] = useState<number>(1);
  const [activeFilterSystem, setActiveFilterSystem] = useState<string>('ALL');
  const [activeDiagnosticTab, setActiveDiagnosticTab] = useState<'ALL' | 'HEATMAP' | 'VIBRATION' | 'PREDICTIVE' | 'CELLS'>('HEATMAP');

  const selectedCell = cellDiag.cells.find((c) => c.id === selectedCellId) || cellDiag.cells[0];

  const isCellDeltaOk = cellDiag.deltaMillivolts < 35;
  const isInverterTempOk = inverterDiag.junctionTempC < 65;
  const isCoolingPressureOk = coolingDiag.coolingLoopPressureBar >= 1.0 && coolingDiag.coolingLoopPressureBar <= 1.6;

  const filteredAlerts = predictiveSummary.alerts.filter((alert) => {
    if (activeFilterSystem === 'ALL') return true;
    return alert.system === activeFilterSystem;
  });

  return (
    <div className="space-y-6">
      {/* Overview Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-cyan-400 mb-1">
            <span>Diagnosa Perangkat Keras & Peta Panas E53</span>
            <span aria-hidden="true">·</span>
            <span>BMS 96S/120S LiFePO4</span>
            <span aria-hidden="true">·</span>
            <span>Genset M54B30 & SiC Inverter</span>
          </div>
          <h2 className="text-xl font-bold text-white">Panel Diagnosa Kesehatan, Peta Panas & AI Prediktif</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Pelacakan distribusi termal modul baterai dan semikonduktor inverter secara real-time dipadukan dengan analisis prediktif RUL untuk genset M54B30 dan sistem tegangan tinggi.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={onRunPredictiveAnalysis}
            disabled={isAnalyzingPredictive}
            className="px-3.5 py-2 text-xs font-bold rounded-lg bg-cyan-400 text-slate-950 hover:bg-cyan-300 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap shadow-sm"
          >
            {isAnalyzingPredictive ? 'Menganalisis Pola Kerusakan...' : 'Jalankan AI Prediktif'}
          </button>
          <button
            onClick={onTriggerCellBalance}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-cyan-950/60 text-cyan-300 border border-cyan-800/60 hover:bg-cyan-900/50 transition-colors cursor-pointer whitespace-nowrap"
          >
            {cellDiag.activeBalancingActive ? 'Penyeimbang Sel: AKTIF' : 'Picu Penyeimbang Sel'}
          </button>
          <button
            onClick={onRunCoolantPurgeTest}
            disabled={purgeTesting}
            className="px-3.5 py-2 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 border border-slate-700 hover:bg-slate-700 transition-colors cursor-pointer disabled:opacity-50 whitespace-nowrap"
          >
            {purgeTesting ? 'Menguji Pompa Pendingin...' : 'Uji Pompa EWP & Purge'}
          </button>
        </div>
      </div>

      {/* Sub-Tab Navigation for Diagnostics Views */}
      <div className="flex items-center gap-2 bg-slate-900/80 p-1.5 rounded-xl border border-slate-800 overflow-x-auto text-xs">
        <span className="text-slate-400 font-mono text-[11px] px-2">Mode Tampilan:</span>
        <button
          onClick={() => setActiveDiagnosticTab('HEATMAP')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeDiagnosticTab === 'HEATMAP'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span>Peta Panas Termal (Heatmap Baterai & Inverter)</span>
        </button>
        <button
          onClick={() => setActiveDiagnosticTab('VIBRATION')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeDiagnosticTab === 'VIBRATION'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
          <span>Analisis Vibrasi FFT (Bearing & Ketidakseimbangan)</span>
          {vibrationData.iso10816Zone === 'ZONE_D_UNACCEPTABLE' && (
            <span className="text-[10px] px-1.5 py-0.2 rounded bg-rose-500 text-white font-black animate-pulse">
              KRITIS
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveDiagnosticTab('PREDICTIVE')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeDiagnosticTab === 'PREDICTIVE'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Radar AI Prediktif (RUL & Komponen)</span>
          <span className="text-[10px] px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 font-black">
            {predictiveSummary.activeWatchlistCount}
          </span>
        </button>
        <button
          onClick={() => setActiveDiagnosticTab('CELLS')}
          className={`px-3.5 py-2 rounded-lg font-bold flex items-center gap-2 transition-colors cursor-pointer whitespace-nowrap ${
            activeDiagnosticTab === 'CELLS'
              ? 'bg-cyan-500 text-slate-950 shadow-md shadow-cyan-950'
              : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
          }`}
        >
          <span>Matriks Sel 96S & Integritas M54</span>
        </button>
        <button
          onClick={() => setActiveDiagnosticTab('ALL')}
          className={`px-3.5 py-2 rounded-lg font-medium transition-colors cursor-pointer whitespace-nowrap ${
            activeDiagnosticTab === 'ALL'
              ? 'bg-slate-800 text-white font-bold'
              : 'text-slate-400 hover:text-white'
          }`}
        >
          Tampilkan Semua Modul
        </button>
      </div>

      {/* Real-time Thermal Heatmap Viewer Module */}
      {(activeDiagnosticTab === 'ALL' || activeDiagnosticTab === 'HEATMAP') && (
        <ThermalHeatmapViewer
          thermalData={thermalData}
          onUpdatePalette={onUpdatePalette}
          onSimulateThermalSpike={onSimulateThermalSpike}
          onSimulateChillerMax={onSimulateChillerMax}
          onSimulateBatteryHotspot={onSimulateBatteryHotspot}
          onResetThermalNorm={onResetThermalNorm}
          isSimulatingSpike={isSimulatingSpike}
          isChillerMax={isChillerMax}
        />
      )}

      {/* Real-time FFT Vibration Analyzer Module */}
      {(activeDiagnosticTab === 'ALL' || activeDiagnosticTab === 'VIBRATION') && (
        <VibrationAnalyzer
          vibrationData={vibrationData}
          onSimulateFault={onSimulateVibrationFault}
          onResetBalanced={onResetVibrationBalanced}
          onScheduleService={onScheduleService}
        />
      )}

      {/* Predictive Maintenance Foresight Radar Section */}
      {(activeDiagnosticTab === 'ALL' || activeDiagnosticTab === 'PREDICTIVE') && (
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-cyan-500/30 space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-4">
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-white">Peringatan Dini Pemeliharaan Prediktif (Predictive Failure Radar)</h3>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-950 text-cyan-300 border border-cyan-800/50">
                PROACTIVE RUL ENGINE
              </span>
            </div>
            <p className="text-xs text-slate-400 mt-1">
              Deteksi dini tanda-tanda keausan mekanis, degradasi sel kimiawi, dan kelelahan polimer plastik OEM BMW E53.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onSimulateExpansionFatigue}
              className="text-[11px] font-mono text-amber-400 hover:text-amber-300 bg-amber-950/30 border border-amber-800/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
            >
              Simulasi Anomali Tekanan Tangki M54
            </button>
          </div>
        </div>

        {/* Predictive Summary KPI Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 font-mono text-xs">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Skor Keandalan Keseluruhan</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              {predictiveSummary.overallReliabilityScore}%
            </div>
            <span className="text-[10px] text-slate-500">Powertrain Siap Pakai</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Komponen Dalam Pengawasan</span>
            <div className="text-2xl font-black text-amber-400 mt-1">
              {predictiveSummary.activeWatchlistCount} <span className="text-xs text-slate-400">Unit</span>
            </div>
            <span className="text-[10px] text-slate-500">Perlu Servis Pencegahan</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Downtime Tercegah</span>
            <div className="text-2xl font-black text-cyan-400 mt-1">
              +{predictiveSummary.projectedDowntimeAvoidedHours} <span className="text-xs text-slate-400">Jam</span>
            </div>
            <span className="text-[10px] text-slate-500">Menghindari Mogok di Jalan</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800">
            <span className="text-slate-400 text-[11px]">Proyeksi Penghematan Kerusakan</span>
            <div className="text-2xl font-black text-emerald-400 mt-1">
              Rp {(predictiveSummary.estimatedMaintenanceSavingsIdr / 1000000).toFixed(1)}Jt
            </div>
            <span className="text-[10px] text-slate-500">Vs Biaya Turun Mesin</span>
          </div>
        </div>

        {/* System Category Filter Tabs */}
        <div className="flex items-center gap-2 pt-1 border-t border-slate-800/80 overflow-x-auto text-xs">
          <span className="text-slate-400 mr-2 text-[11px]">Filter Sistem:</span>
          {[
            { id: 'ALL', label: 'Semua Komponen' },
            { id: 'COOLING', label: 'Sistem Pendingin M54' },
            { id: 'M54_GENSET', label: 'Genset Mekanis M54' },
            { id: 'BATTERY_PACK', label: 'Paket Baterai 48.5 kWh' },
            { id: 'INVERTER', label: 'Inverter Daya SiC' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveFilterSystem(tab.id)}
              className={`px-3 py-1.5 rounded-lg font-medium whitespace-nowrap cursor-pointer transition-colors ${
                activeFilterSystem === tab.id
                  ? 'bg-cyan-500 text-slate-950 font-bold'
                  : 'bg-slate-950 text-slate-400 hover:text-white border border-slate-800'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Predictive Failure Alert Cards List */}
        <div className="space-y-3 pt-1">
          {filteredAlerts.map((alert) => {
            const isWarning = alert.riskLevel === 'WARNING';
            const isWatchlist = alert.riskLevel === 'WATCHLIST';
            const isCritical = alert.riskLevel === 'CRITICAL';
            const isOptimal = alert.riskLevel === 'OPTIMAL';

            return (
              <div
                key={alert.id}
                className={`p-4 rounded-xl border transition-all ${
                  isCritical
                    ? 'bg-rose-950/20 border-rose-500/80 shadow-md shadow-rose-950'
                    : isWarning
                      ? 'bg-amber-950/20 border-amber-500/60 shadow-md shadow-amber-950/30'
                      : isWatchlist
                        ? 'bg-slate-950 border-slate-700/80'
                        : 'bg-slate-950/60 border-slate-800'
                }`}
              >
                <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
                  {/* Left Info Column */}
                  <div className="space-y-2 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-bold text-white">{alert.component}</span>
                      <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded font-bold ${
                          isCritical
                            ? 'bg-rose-500 text-slate-950'
                            : isWarning
                              ? 'bg-amber-400 text-slate-950'
                              : isWatchlist
                                ? 'bg-cyan-950 text-cyan-300 border border-cyan-800/40'
                                : 'bg-emerald-950 text-emerald-400 border border-emerald-800/40'
                        }`}
                      >
                        {alert.riskLevel}
                      </span>
                      <span className="text-[11px] font-mono text-slate-400">
                        Probabilitas Kerusakan: <strong className={isWarning ? 'text-amber-400' : 'text-slate-300'}>{alert.failureProbabilityPercent}%</strong>
                      </span>
                    </div>

                    {/* Progress Bar of Failure Probability */}
                    <div className="w-full max-w-md bg-slate-800 h-1.5 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${
                          isCritical ? 'bg-rose-500' : isWarning ? 'bg-amber-400' : isWatchlist ? 'bg-cyan-400' : 'bg-emerald-400'
                        }`}
                        style={{ width: `${alert.failureProbabilityPercent}%` }}
                      />
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed pt-1">
                      <span className="text-cyan-400 font-semibold font-mono">Indikator Gejala Dini: </span>
                      {alert.leadingIndicator}
                    </div>

                    <div className="text-xs text-slate-300 leading-relaxed">
                      <span className="text-emerald-400 font-semibold font-mono">Tindakan Pencegahan: </span>
                      {alert.recommendedAction}
                    </div>
                  </div>

                  {/* Right Timing & Action Column */}
                  <div className="flex flex-col sm:items-end justify-between gap-3 shrink-0 lg:min-w-[220px] pt-1">
                    <div className="text-left sm:text-right font-mono">
                      <div className="text-[10px] text-slate-400">Estimasi Sisa Usia (RUL):</div>
                      <div className="text-xs font-bold text-amber-300 mt-0.5">
                        {alert.estimatedTimeToFailure}
                      </div>
                      {alert.estCostIdr > 0 && (
                        <div className="text-[11px] text-slate-400 mt-1">
                          Estimasi Biaya: <span className="text-white font-semibold">Rp {alert.estCostIdr.toLocaleString('id-ID')}</span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2">
                      {alert.isAcknowledged ? (
                        <span className="text-[11px] font-mono text-emerald-400 px-2 py-1 rounded bg-emerald-950/40 border border-emerald-800/40">
                          {alert.scheduledDate ? `Terjadwal (${alert.scheduledDate})` : 'Sudah Ditinjau'}
                        </span>
                      ) : (
                        <>
                          <button
                            onClick={() => onScheduleService(alert.id)}
                            className="px-2.5 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Jadwalkan Servis
                          </button>
                          <button
                            onClick={() => onAcknowledgeAlert(alert.id)}
                            className="px-2.5 py-1.5 text-xs font-semibold text-slate-300 bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                          >
                            Tandai Tinjau
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
      )}

      {/* Primary KPI Status Strip & Diagnostics */}
      {(activeDiagnosticTab === 'ALL' || activeDiagnosticTab === 'CELLS') && (
      <div className="space-y-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Cell Spread */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Deviasi Tegangan Sel (ΔV)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isCellDeltaOk ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
            }`}>
              {isCellDeltaOk ? 'NOMINAL' : 'PERHATIAN'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-cyan-400 tabular-nums">
              {cellDiag.deltaMillivolts}
            </span>
            <span className="text-xs text-slate-400 font-mono">mV</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>Min: {cellDiag.minCellVoltage.toFixed(3)}V</span>
            <span>Maks: {cellDiag.maxCellVoltage.toFixed(3)}V</span>
          </div>
        </div>

        {/* Inverter Junction Temp */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Suhu Junction Inverter (Tj)</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isInverterTempOk ? 'bg-emerald-950 text-emerald-400' : 'bg-rose-950 text-rose-400'
            }`}>
              {isInverterTempOk ? 'OPTIMAL' : 'PANAS'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-white tabular-nums">
              {inverterDiag.junctionTempC.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">°C</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>Efisiensi: {inverterDiag.inverterEfficiencyPercent}%</span>
            <span>Batas: 85.0°C</span>
          </div>
        </div>

        {/* Cooling System Pressure */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Tekanan Loop Pendingin M54</span>
            <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
              isCoolingPressureOk ? 'bg-emerald-950 text-emerald-400' : 'bg-amber-950 text-amber-400'
            }`}>
              {isCoolingPressureOk ? 'TERSEGEL' : 'ANOMALI'}
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-emerald-400 tabular-nums">
              {coolingDiag.coolingLoopPressureBar.toFixed(2)}
            </span>
            <span className="text-xs text-slate-400 font-mono">bar</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>Tutup Relief: 2.0 bar</span>
            <span>Level Tangki: {coolingDiag.expansionTankLevel}</span>
          </div>
        </div>

        {/* Engine Coolant Temp */}
        <div className="p-4 rounded-xl border border-slate-800 bg-slate-900/50">
          <div className="flex justify-between items-center text-xs text-slate-400">
            <span>Suhu Air Pendingin M54</span>
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-400">
              TARGET 86°C
            </span>
          </div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-3xl font-extrabold font-mono text-amber-400 tabular-nums">
              {coolingDiag.coolantTempC.toFixed(1)}
            </span>
            <span className="text-xs text-slate-400 font-mono">°C</span>
          </div>
          <div className="mt-2 text-[11px] text-slate-400 font-mono flex justify-between">
            <span>Oli Mesin: {coolingDiag.oilTempC.toFixed(1)}°C</span>
            <span>Gasket: {coolingDiag.headGasketIntegrityScore}%</span>
          </div>
        </div>
      </div>

      {/* Main Hardware Section 1: 16-Cell Battery Pack Health Matrix */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-base font-bold text-white">Matriks Kesehatan Sel Baterai 48.5 kWh (96S BMS Telemetry)</h3>
            <p className="text-xs text-slate-400">
              Menampilkan 16 modul seri dengan sensor presisi per modul. Tegangan seimbang menjamin transfer daya maksimal tanpa *over-discharge*.
            </p>
          </div>
          <div className="flex items-center gap-3 text-xs font-mono">
            <span className="text-slate-400">Isolasi Tegangan Tinggi:</span>
            <span className="text-emerald-400 font-bold">{cellDiag.isolationResistanceKohm} kΩ/V</span>
          </div>
        </div>

        {/* 16 Cell Matrix */}
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2.5 pt-2">
          {cellDiag.cells.map((cell) => {
            const isHighest = cell.voltage === cellDiag.maxCellVoltage;
            const isLowest = cell.voltage === cellDiag.minCellVoltage;
            const isSelected = cell.id === selectedCellId;

            return (
              <button
                key={cell.id}
                onClick={() => setSelectedCellId(cell.id)}
                className={`p-2.5 rounded-xl border text-left transition-all cursor-pointer relative ${
                  isSelected
                    ? 'border-cyan-400 bg-cyan-950/40 ring-1 ring-cyan-400'
                    : isHighest
                      ? 'border-amber-500/50 bg-amber-950/20 hover:border-amber-400'
                      : isLowest
                        ? 'border-rose-500/50 bg-rose-950/20 hover:border-rose-400'
                        : 'border-slate-800 bg-slate-950 hover:border-slate-700'
                }`}
              >
                <div className="flex items-center justify-between text-[10px] font-mono text-slate-400">
                  <span>MOD #{cell.id.toString().padStart(2, '0')}</span>
                  {cell.isBalancing && (
                    <span className="w-1.5 h-1.5 rounded-full bg-cyan-400" title="Balancing Active" />
                  )}
                </div>
                <div className="text-sm font-bold font-mono text-white mt-1 tabular-nums">
                  {cell.voltage.toFixed(3)} V
                </div>
                <div className="flex justify-between items-center text-[10px] font-mono text-slate-500 mt-1">
                  <span>{cell.tempC.toFixed(1)}°C</span>
                  <span>{cell.internalResistanceMilliOhm} mΩ</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Selected Cell Detailed Diagnostic Banner */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex flex-col md:flex-row items-center justify-between gap-4 text-xs font-mono">
          <div className="flex items-center gap-4">
            <span className="font-bold text-cyan-400">Detail Modul Sel #{selectedCell.id}:</span>
            <span className="text-slate-300">Tegangan: <strong className="text-white">{selectedCell.voltage.toFixed(3)} V</strong></span>
            <span className="text-slate-300">Suhu Sel: <strong className="text-white">{selectedCell.tempC}°C</strong></span>
            <span className="text-slate-300">Resistansi Internal: <strong className="text-white">{selectedCell.internalResistanceMilliOhm} mΩ</strong></span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Status Penyeimbang:</span>
            <span className={selectedCell.isBalancing ? 'text-cyan-400 font-bold' : 'text-slate-500'}>
              {selectedCell.isBalancing ? 'Sedang Menyeimbangkan (-1.2A)' : 'Seimbang / Standby'}
            </span>
          </div>
        </div>
      </div>

      {/* Grid: Inverter Semikonduktor & M54 Cooling System */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Inverter Diagnostics */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Diagnosa Inverter & Gerbang Pengemudi (Gate Driver)</h3>
            <button
              onClick={onSimulateInverterThermalLoad}
              className="text-[11px] font-mono text-cyan-400 hover:text-cyan-300 underline cursor-pointer"
            >
              Simulasi Beban Puncak
            </button>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Suhu Sambungan Semikonduktor (Tj):</span>
              <span className="font-bold text-white">{inverterDiag.junctionTempC.toFixed(1)}°C</span>
            </div>
            <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-300 ${
                  inverterDiag.junctionTempC > 75 ? 'bg-rose-500' : 'bg-cyan-400'
                }`}
                style={{ width: `${Math.min(100, (inverterDiag.junctionTempC / 85) * 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-3 gap-2 pt-2 border-t border-slate-800/80 text-center">
              <div className="p-2 rounded bg-slate-900">
                <div className="text-[10px] text-slate-400">Arus Fasa U</div>
                <div className="text-sm font-bold text-white mt-0.5">{inverterDiag.phaseCurrentsA.a.toFixed(1)} A</div>
              </div>
              <div className="p-2 rounded bg-slate-900">
                <div className="text-[10px] text-slate-400">Arus Fasa V</div>
                <div className="text-sm font-bold text-white mt-0.5">{inverterDiag.phaseCurrentsA.b.toFixed(1)} A</div>
              </div>
              <div className="p-2 rounded bg-slate-900">
                <div className="text-[10px] text-slate-400">Arus Fasa W</div>
                <div className="text-sm font-bold text-white mt-0.5">{inverterDiag.phaseCurrentsA.c.toFixed(1)} A</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Tegangan Suplai Gate Driver:</span>
                <span className="text-emerald-400 font-bold">{inverterDiag.gateDriverVoltageV.toFixed(1)} V (OK)</span>
              </div>
              <div className="flex justify-between">
                <span>Tegangan Bus DC & Ripple:</span>
                <span className="text-white font-bold">{inverterDiag.dcBusVoltageV.toFixed(1)} V (Ripple: {inverterDiag.dcBusRippleV.toFixed(2)}V)</span>
              </div>
              <div className="flex justify-between">
                <span>Frekuensi Switching PWM:</span>
                <span className="text-white">{inverterDiag.switchingFrequencyKhz} kHz (Modulasi: {inverterDiag.pwmModulationIndex})</span>
              </div>
            </div>
          </div>
        </div>

        {/* M54 Cooling System Integrity */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Integritas Sistem Pendingin Mesin M54B30</h3>
            <span className="text-xs font-mono text-emerald-400">Hidrolik Tertutup</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-mono text-xs">
            <div className="flex justify-between items-center text-slate-300">
              <span className="text-slate-400">Debit Pompa Listrik (EWP Flow):</span>
              <span className="font-bold text-cyan-400">{coolingDiag.electricWaterPumpLpm.toFixed(1)} L/menit ({coolingDiag.electricWaterPumpPwm}%)</span>
            </div>

            <div className="grid grid-cols-2 gap-3 pt-1">
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Inlet Radiator (Mesin Keluar)</div>
                <div className="text-sm font-bold text-amber-400 mt-0.5">{coolingDiag.radiatorInletTempC.toFixed(1)}°C</div>
              </div>
              <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800">
                <div className="text-[10px] text-slate-400">Outlet Radiator (Kembali ke Genset)</div>
                <div className="text-sm font-bold text-cyan-400 mt-0.5">{coolingDiag.radiatorOutletTempC.toFixed(1)}°C</div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-800/80 space-y-1.5 text-slate-400">
              <div className="flex justify-between">
                <span>Disipasi Radiator (ΔT Suhu):</span>
                <span className="text-emerald-400 font-bold">
                  -{(coolingDiag.radiatorInletTempC - coolingDiag.radiatorOutletTempC).toFixed(1)}°C (Pendinginan Efektif)
                </span>
              </div>
              <div className="flex justify-between">
                <span>Status Termostat Elektronik:</span>
                <span className="text-white font-bold">{coolingDiag.thermostatStatus}</span>
              </div>
              <div className="flex justify-between">
                <span>Kecepatan Kipas Elektrik Aux:</span>
                <span className="text-white">{coolingDiag.radiatorFanDutyPercent}% PWM</span>
              </div>
              <div className="flex justify-between">
                <span>Integritas Gasket Kepala Silinder:</span>
                <span className="text-emerald-400 font-bold">{coolingDiag.headGasketIntegrityScore}% (Tanpa Tekanan Gas Bakar)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Hardware Diagnostic Fault Bus (DTC Codes) */}
      <div className="p-5 rounded-2xl bg-slate-900/40 border border-slate-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs mb-3">
          <div className="font-semibold text-white">Status Bus Diagnosa CAN Terpadu (OBD-II / CAN Gateway)</div>
          <span className="text-slate-400 font-mono">Baud Rate: 500 kbps · ISO 15765-4</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 text-xs font-mono">
          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px]">BMS-0x1A</div>
              <div className="text-emerald-400 font-bold">PACK_NOMINAL</div>
            </div>
            <span className="text-[10px] text-slate-500">0 DTC</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px]">INV-0x02</div>
              <div className="text-emerald-400 font-bold">GATE_TIMING_OK</div>
            </div>
            <span className="text-[10px] text-slate-500">0 DTC</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px]">M54-0x3B</div>
              <div className="text-emerald-400 font-bold">COOL_FLOW_STABLE</div>
            </div>
            <span className="text-[10px] text-slate-500">0 DTC</span>
          </div>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800/80 flex items-center justify-between">
            <div>
              <div className="text-slate-400 text-[11px]">HVIL-0x08</div>
              <div className="text-emerald-400 font-bold">INTERLOCK_CLOSED</div>
            </div>
            <span className="text-[10px] text-slate-500">0 DTC</span>
          </div>
        </div>
      </div>
      </div>
      )}
    </div>
  );
};
