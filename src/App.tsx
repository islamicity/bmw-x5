/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  VehicleTelemetry,
  PowertrainMode,
  HistoricalTrip,
  BankAccount,
  RecurringBill,
  UserPreferences,
  BatteryCellDiagnostics,
  InverterDiagnostics,
  M54CoolingDiagnostics,
  PredictiveMaintenanceSummary,
  ThermalTelemetryState,
  VibrationTelemetryState,
} from './types';
import {
  INITIAL_TELEMETRY,
  INITIAL_TRIPS,
  INITIAL_BANKS,
  INITIAL_BILLS,
  createInitialCellDiagnostics,
  createInitialThermalTelemetry,
  createInitialVibrationTelemetry,
  generateVibrationData,
  INITIAL_INVERTER_DIAGNOSTICS,
  INITIAL_M54_COOLING_DIAGNOSTICS,
  INITIAL_PREDICTIVE_SUMMARY,
} from './services/telemetrySimulator';

import { Header } from './components/Header';
import { TelemetryCockpit } from './components/TelemetryCockpit';
import { PowertrainFlow } from './components/PowertrainFlow';
import { HardwareDiagnostics } from './components/HardwareDiagnostics';
import { SmartEcoManager } from './components/SmartEcoManager';
import { CarbonEmissionReporter } from './components/CarbonEmissionReporter';
import { AiAdvisor } from './components/AiAdvisor';
import { AnalyticsCharts } from './components/AnalyticsCharts';
import { BankingAndExpenses } from './components/BankingAndExpenses';
import { SecurityVault } from './components/SecurityVault';
import { MultiDeviceSync } from './components/MultiDeviceSync';
import { EmergencyAlertModal } from './components/EmergencyAlertModal';
import { ExportModal } from './components/ExportModal';
import { MobileCompanionPreview } from './components/MobileCompanionPreview';
import { AppearanceSettings } from './components/AppearanceSettings';

import heroBmwImage from './assets/images/hero_bmw_x5_e53_hybrid_1792047015393.jpg';
import powertrainArchImage from './assets/images/powertrain_genset_architecture_1792047034532.jpg';

export default function App() {
  const [activeTab, setActiveTab] = useState<string>('telemetry');
  const [telemetry, setTelemetry] = useState<VehicleTelemetry>(INITIAL_TELEMETRY);
  const [powertrainMode, setPowertrainMode] = useState<PowertrainMode>('AUTO_GENSET');
  const [ecoModeActive, setEcoModeActive] = useState<boolean>(true);
  const [trips, setTrips] = useState<HistoricalTrip[]>(INITIAL_TRIPS);
  const [accounts, setAccounts] = useState<BankAccount[]>(INITIAL_BANKS);
  const [bills, setBills] = useState<RecurringBill[]>(INITIAL_BILLS);

  const [cellDiag, setCellDiag] = useState<BatteryCellDiagnostics>(createInitialCellDiagnostics());
  const [inverterDiag, setInverterDiag] = useState<InverterDiagnostics>(INITIAL_INVERTER_DIAGNOSTICS);
  const [coolingDiag, setCoolingDiag] = useState<M54CoolingDiagnostics>(INITIAL_M54_COOLING_DIAGNOSTICS);
  const [purgeTesting, setPurgeTesting] = useState<boolean>(false);

  const [predictiveSummary, setPredictiveSummary] = useState<PredictiveMaintenanceSummary>(INITIAL_PREDICTIVE_SUMMARY);
  const [isAnalyzingPredictive, setIsAnalyzingPredictive] = useState<boolean>(false);

  const [thermalData, setThermalData] = useState<ThermalTelemetryState>(createInitialThermalTelemetry());
  const [isSimulatingSpike, setIsSimulatingSpike] = useState<boolean>(false);
  const [isChillerMax, setIsChillerMax] = useState<boolean>(false);

  const [vibrationData, setVibrationData] = useState<VibrationTelemetryState>(createInitialVibrationTelemetry());

  const [preferences, setPreferences] = useState<UserPreferences>({
    theme: 'dark',
    accentColor: 'blue',
    speedUnit: 'kmh',
    tempUnit: 'celsius',
    currency: 'IDR',
    autoEcoThreshold: 30,
    criticalBatteryThreshold: 15,
    monthlyBudgetLimitIdr: 2500000,
    monthlyEnergyLimitKwh: 450,
    soundAlertsEnabled: true,
    autoCloudBackup: true,
    twoFactorEnabled: true,
    biometricLockActive: false,
    endToEndEncryption: true,
  });

  const [isEmergencyModalOpen, setIsEmergencyModalOpen] = useState<boolean>(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState<boolean>(false);
  const [showMobilePreview, setShowMobilePreview] = useState<boolean>(false);

  // Real-time Telemetry Simulation Loop
  useEffect(() => {
    const timer = setInterval(() => {
      setTelemetry((prev) => {
        let newSoc = prev.batterySoc;
        let gensetPower = prev.gensetPower;
        let gensetRpm = prev.gensetRpm;
        let gensetActive = prev.gensetActive;
        let fuelBurnRate = prev.fuelBurnRate;
        let co2Rate = prev.co2Rate;

        // Auto Eco trigger
        if (newSoc <= preferences.autoEcoThreshold && !ecoModeActive) {
          setEcoModeActive(true);
        }

        // Auto Genset start logic
        if (powertrainMode === 'AUTO_GENSET') {
          if (newSoc < 28 && !gensetActive) {
            gensetActive = true;
          } else if (newSoc > 75 && gensetActive) {
            gensetActive = false;
          }
        } else if (powertrainMode === 'GENSET_FORCE_CHARGE') {
          gensetActive = true;
        } else if (powertrainMode === 'PURE_EV') {
          gensetActive = false;
        }

        // Genset parameters
        if (gensetActive) {
          gensetRpm = powertrainMode === 'GENSET_FORCE_CHARGE' ? 2400 : 2100;
          gensetPower = powertrainMode === 'GENSET_FORCE_CHARGE' ? 36.5 : 28.0;
          fuelBurnRate = 3.8;
          co2Rate = 58; // g/km while genset running vs 320 g/km baseline
        } else {
          gensetRpm = 0;
          gensetPower = 0;
          fuelBurnRate = 0;
          co2Rate = 0; // Pure EV zero tailpipe emissions
        }

        // Battery Power consumption calculation based on speed
        const speedFactor = prev.speed / 100;
        const baseMotorPower = Math.max(0, speedFactor * 42);
        const motorPower = ecoModeActive ? baseMotorPower * 0.82 : baseMotorPower;

        // Net energy balance (Genset Power - Motor Power - Aux)
        const netKw = gensetPower - motorPower - prev.auxiliaryLoad;
        // delta SoC in 1 second interval (48.5 kWh pack = 1% is 0.485 kWh = 1746 kW-s)
        const deltaSocPercent = (netKw / (48.5 * 3600)) * 100;

        newSoc = Math.min(100, Math.max(5, newSoc + deltaSocPercent));

        // Trigger critical alarm if below threshold
        if (newSoc < preferences.criticalBatteryThreshold && !isEmergencyModalOpen) {
          setIsEmergencyModalOpen(true);
        }

        const estKm = Math.round((newSoc / 100) * 180);

        return {
          ...prev,
          timestamp: Date.now(),
          batterySoc: newSoc,
          estimatedRangeKm: estKm,
          gensetActive,
          gensetRpm,
          gensetPower,
          fuelBurnRate,
          motorPower,
          co2Rate,
          batteryVoltage: 360 + (newSoc / 100) * 44, // 360V to 404V
        };
      });

      // Real-time thermal telemetry subtle updates
      setThermalData((prevThermal) => {
        const updatedZones = prevThermal.batteryZones.map((z) => {
          const isMod7 = z.moduleId === 7 && z.isHotspot;
          const drift = Math.sin(Date.now() / 2500 + z.moduleId) * 0.08;
          const nextCore = Number((z.coreTempC + drift).toFixed(1));
          return {
            ...z,
            coreTempC: isMod7 ? z.coreTempC : Math.max(24, Math.min(48, nextCore)),
            surfaceTempC: isMod7 ? z.surfaceTempC : Number((nextCore - 1.8).toFixed(1)),
            terminalTempC: isMod7 ? z.terminalTempC : Number((nextCore + 0.8).toFixed(1)),
          };
        });

        const updatedInverter = prevThermal.inverterZones.map((z) => {
          const isMosfet = z.category.startsWith('MOSFET');
          const drift = Math.cos(Date.now() / 2000 + (isMosfet ? 1 : 2)) * 0.12;
          const nextTemp = Number((z.tempC + drift).toFixed(1));
          return {
            ...z,
            tempC: Math.max(26, Math.min(85, nextTemp)),
          };
        });

        const bTemps = updatedZones.map((z) => z.coreTempC);
        const iTemps = updatedInverter.map((z) => z.tempC);

        return {
          ...prevThermal,
          batteryZones: updatedZones,
          inverterZones: updatedInverter,
          batteryMaxTempC: Math.max(...bTemps),
          batteryMinTempC: Math.min(...bTemps),
          batteryAvgTempC: Number((bTemps.reduce((a, b) => a + b, 0) / bTemps.length).toFixed(1)),
          batteryDeltaTempC: Number((Math.max(...bTemps) - Math.min(...bTemps)).toFixed(1)),
          inverterMaxTempC: Math.max(...iTemps),
          inverterMinTempC: Math.min(...iTemps),
          inverterAvgTempC: Number((iTemps.reduce((a, b) => a + b, 0) / iTemps.length).toFixed(1)),
        };
      });

      // Real-time vibration FFT telemetry linked to Genset mode
      setVibrationData((prevVib) => {
        const rpm = powertrainMode === 'PURE_EV' ? 0 : powertrainMode === 'GENSET_FORCE_CHARGE' ? 2400 : 2100;
        return generateVibrationData(rpm, prevVib.activeSimulationFault);
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [powertrainMode, ecoModeActive, preferences, isEmergencyModalOpen]);

  // Handlers
  const handleToggleGenset = () => {
    setTelemetry((prev) => {
      const nextActive = !prev.gensetActive;
      return {
        ...prev,
        gensetActive: nextActive,
        gensetRpm: nextActive ? 2200 : 0,
        gensetPower: nextActive ? 30.0 : 0,
        fuelBurnRate: nextActive ? 4.1 : 0,
      };
    });
  };

  const handleSimulateCriticalBattery = () => {
    setTelemetry((prev) => ({
      ...prev,
      batterySoc: 11.8,
      batteryVoltage: 364,
    }));
    setIsEmergencyModalOpen(true);
  };

  const handleEmergencyStartGenset = () => {
    setPowertrainMode('GENSET_FORCE_CHARGE');
    setTelemetry((prev) => ({
      ...prev,
      gensetActive: true,
      gensetRpm: 2400,
      gensetPower: 38.0,
      batterySoc: Math.max(prev.batterySoc, 16.0), // instant buffer
    }));
    setIsEmergencyModalOpen(false);
  };

  const handleTriggerCellBalance = () => {
    setCellDiag((prev) => {
      const nextActive = !prev.activeBalancingActive;
      const updatedCells = prev.cells.map((c) => {
        if (nextActive && c.voltage > prev.avgCellVoltage) {
          return { ...c, isBalancing: true, voltage: Number((c.voltage - 0.002).toFixed(3)) };
        }
        return { ...c, isBalancing: false };
      });
      const voltages = updatedCells.map((c) => c.voltage);
      return {
        ...prev,
        cells: updatedCells,
        activeBalancingActive: nextActive,
        minCellVoltage: Math.min(...voltages),
        maxCellVoltage: Math.max(...voltages),
        deltaMillivolts: Math.round((Math.max(...voltages) - Math.min(...voltages)) * 1000),
      };
    });
  };

  const handleRunCoolantPurgeTest = () => {
    setPurgeTesting(true);
    setCoolingDiag((prev) => ({
      ...prev,
      electricWaterPumpLpm: 68.0,
      electricWaterPumpPwm: 100,
      radiatorFanDutyPercent: 80,
      coolingLoopPressureBar: 1.42,
    }));

    setTimeout(() => {
      setCoolingDiag((prev) => ({
        ...prev,
        electricWaterPumpLpm: 44.5,
        electricWaterPumpPwm: 65,
        radiatorFanDutyPercent: 35,
        coolingLoopPressureBar: 1.25,
      }));
      setPurgeTesting(false);
    }, 3500);
  };

  const handleSimulateInverterThermalLoad = () => {
    setInverterDiag((prev) => ({
      ...prev,
      junctionTempC: 78.4,
      phaseCurrentsA: { a: 88.5, b: 89.1, c: 88.0 },
      thermalThrottling: false,
    }));
    setTimeout(() => {
      setInverterDiag((prev) => ({
        ...prev,
        junctionTempC: 45.2,
        phaseCurrentsA: { a: 42.1, b: 42.4, c: 41.9 },
      }));
    }, 4000);
  };

  const handleRunPredictiveAnalysis = async () => {
    setIsAnalyzingPredictive(true);
    try {
      const response = await fetch('/api/predictive-maintenance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          telemetry,
          cellDiag,
          coolingDiag,
          inverterDiag,
        }),
      });
      const data = await response.json();
      if (data && data.alerts) {
        setPredictiveSummary(data);
      }
    } catch (e) {
      console.warn('Predictive analysis fetch fallback:', e);
    } finally {
      setIsAnalyzingPredictive(false);
    }
  };

  const handleAcknowledgeAlert = (alertId: string) => {
    setPredictiveSummary((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === alertId ? { ...a, isAcknowledged: true } : a
      ),
    }));
  };

  const handleScheduleService = (alertId: string) => {
    const alert = predictiveSummary.alerts.find((a) => a.id === alertId);
    if (!alert) return;

    // Add to scheduled recurring bills / service maintenance ledger
    const newBill: RecurringBill = {
      id: `bill-pred-${Date.now()}`,
      title: `Servis Preventif: ${alert.component}`,
      category: alert.system === 'M54_GENSET' || alert.system === 'COOLING' ? 'genset' : 'maintenance',
      dueDate: '2026-11-20',
      amountIdr: alert.estCostIdr || 500000,
      status: 'pending',
      daysLeft: 35,
    };

    setBills((prev) => [newBill, ...prev]);

    setPredictiveSummary((prev) => ({
      ...prev,
      alerts: prev.alerts.map((a) =>
        a.id === alertId
          ? { ...a, isAcknowledged: true, scheduledDate: '20 Nov 2026' }
          : a
      ),
    }));
  };

  const handleSimulateExpansionFatigue = () => {
    // Elevate pressure and trigger critical predictive alert on M54 expansion tank
    setCoolingDiag((prev) => ({
      ...prev,
      coolingLoopPressureBar: 1.78,
      coolantTempC: 93.5,
    }));

    setPredictiveSummary((prev) => {
      const updatedAlerts = prev.alerts.map((a) => {
        if (a.id === 'pred-1' || a.system === 'COOLING') {
          return {
            ...a,
            riskLevel: 'CRITICAL' as const,
            failureProbabilityPercent: 94,
            estimatedTimeToFailure: '18 Jam Operasi (URGENT)',
            leadingIndicator: 'Tekanan loop melonjak ke 1.78 bar dekat batas tutup 2.0 bar; sensor acoustic micro-leak mendeteksi regangan polimer tangki!',
            recommendedAction: 'Segera lakukan depressurisasi genset dan ganti tangki ekspansi aluminium!',
          };
        }
        return a;
      });

      return {
        ...prev,
        criticalAlertCount: 1,
        overallReliabilityScore: 78,
        alerts: updatedAlerts,
      };
    });
  };

  const handleUpdateThermalPalette = (palette: ThermalTelemetryState['activePalette']) => {
    setThermalData((prev) => ({ ...prev, activePalette: palette }));
  };

  const handleSimulateThermalSpike = () => {
    setIsSimulatingSpike(true);
    setThermalData((prev) => {
      const spikedInverter = prev.inverterZones.map((z) => ({
        ...z,
        tempC: z.category.startsWith('MOSFET')
          ? Number((z.tempC + 16.5).toFixed(1))
          : Number((z.tempC + 7.2).toFixed(1)),
        powerLossW: z.category.startsWith('MOSFET') ? 148 : z.powerLossW,
      }));
      const spikedBattery = prev.batteryZones.map((z) => ({
        ...z,
        coreTempC: Number((z.coreTempC + 4.2).toFixed(1)),
        surfaceTempC: Number((z.surfaceTempC + 3.8).toFixed(1)),
        heatFluxW: Number((z.heatFluxW + 28).toFixed(1)),
      }));
      const bTemps = spikedBattery.map((z) => z.coreTempC);
      const iTemps = spikedInverter.map((z) => z.tempC);
      return {
        ...prev,
        inverterZones: spikedInverter,
        batteryZones: spikedBattery,
        inverterMaxTempC: Math.max(...iTemps),
        batteryMaxTempC: Math.max(...bTemps),
        chillerOutletTempC: 39.8,
        chillerPwmPercent: 85,
      };
    });

    setTimeout(() => {
      setThermalData((prev) => {
        const normalizedInverter = prev.inverterZones.map((z) => ({
          ...z,
          tempC: z.category.startsWith('MOSFET')
            ? Number((z.tempC - 16.0).toFixed(1))
            : Number((z.tempC - 7.0).toFixed(1)),
          powerLossW: z.category.startsWith('MOSFET') ? 82 : z.powerLossW,
        }));
        const normalizedBattery = prev.batteryZones.map((z) => ({
          ...z,
          coreTempC: Number((z.coreTempC - 3.8).toFixed(1)),
          surfaceTempC: Number((z.surfaceTempC - 3.5).toFixed(1)),
          heatFluxW: Number((z.heatFluxW - 25).toFixed(1)),
        }));
        const bTemps = normalizedBattery.map((z) => z.coreTempC);
        const iTemps = normalizedInverter.map((z) => z.tempC);
        return {
          ...prev,
          inverterZones: normalizedInverter,
          batteryZones: normalizedBattery,
          inverterMaxTempC: Math.max(...iTemps),
          batteryMaxTempC: Math.max(...bTemps),
          chillerOutletTempC: 34.2,
          chillerPwmPercent: 55,
        };
      });
      setIsSimulatingSpike(false);
    }, 4500);
  };

  const handleSimulateChillerMax = () => {
    setIsChillerMax((prev) => {
      const next = !prev;
      setThermalData((curr) => {
        const factor = next ? -4.5 : 0;
        const chilledBattery = curr.batteryZones.map((z) => ({
          ...z,
          coreTempC: Number((z.coreTempC + factor).toFixed(1)),
          surfaceTempC: Number((z.surfaceTempC + factor * 1.2).toFixed(1)),
        }));
        const chilledInverter = curr.inverterZones.map((z) => ({
          ...z,
          tempC: Number((z.tempC + factor * 1.5).toFixed(1)),
        }));
        const bTemps = chilledBattery.map((z) => z.coreTempC);
        const iTemps = chilledInverter.map((z) => z.tempC);
        return {
          ...curr,
          batteryZones: chilledBattery,
          inverterZones: chilledInverter,
          batteryMaxTempC: Math.max(...bTemps),
          batteryMinTempC: Math.min(...bTemps),
          batteryAvgTempC: Number((bTemps.reduce((a, b) => a + b, 0) / bTemps.length).toFixed(1)),
          batteryDeltaTempC: Number((Math.max(...bTemps) - Math.min(...bTemps)).toFixed(1)),
          inverterMaxTempC: Math.max(...iTemps),
          inverterMinTempC: Math.min(...iTemps),
          inverterAvgTempC: Number((iTemps.reduce((a, b) => a + b, 0) / iTemps.length).toFixed(1)),
          chillerInletTempC: next ? 21.8 : 28.5,
          chillerOutletTempC: next ? 27.2 : 34.2,
          chillerPwmPercent: next ? 100 : 55,
        };
      });
      return next;
    });
  };

  const handleSimulateBatteryHotspot = () => {
    setThermalData((prev) => {
      const updated = prev.batteryZones.map((z) => {
        if (z.moduleId === 7) {
          return {
            ...z,
            coreTempC: 41.8,
            surfaceTempC: 39.2,
            terminalTempC: 43.5,
            isHotspot: true,
            heatFluxW: 68.0,
          };
        }
        return z;
      });
      const bTemps = updated.map((z) => z.coreTempC);
      return {
        ...prev,
        batteryZones: updated,
        batteryMaxTempC: Math.max(...bTemps),
        batteryDeltaTempC: Number((Math.max(...bTemps) - Math.min(...bTemps)).toFixed(1)),
      };
    });
  };

  const handleResetThermalNorm = () => {
    setThermalData(createInitialThermalTelemetry());
    setIsChillerMax(false);
    setIsSimulatingSpike(false);
  };

  const handleSimulateVibrationFault = (fault: VibrationTelemetryState['activeSimulationFault']) => {
    const rpm = telemetry.gensetActive ? telemetry.gensetRpm : 2100;
    setVibrationData(generateVibrationData(rpm, fault));
  };

  const handleResetVibrationBalanced = () => {
    const rpm = telemetry.gensetActive ? telemetry.gensetRpm : 2100;
    setVibrationData(generateVibrationData(rpm, 'NONE'));
  };

  const handlePayBill = (billId: string) => {
    setBills((prev) =>
      prev.map((b) => (b.id === billId ? { ...b, status: 'auto_paid' as const } : b))
    );
  };

  const handleUpdatePreferences = (prefs: Partial<UserPreferences>) => {
    setPreferences((prev) => ({ ...prev, ...prefs }));
  };

  const handleExportCsv = () => {
    const headers = [
      'ID Trip',
      'Tanggal',
      'Jarak (km)',
      'Listrik (kWh)',
      'Genset (kWh)',
      'BBM (L)',
      'Emisi (g/km)',
      'CO2 Saved (kg)',
      'Hemat Biaya (IDR)',
    ];

    const rows = trips.map((t) => [
      t.id,
      t.date,
      t.distanceKm.toFixed(1),
      t.electricKwhUsed.toFixed(1),
      t.gensetKwhGenerated.toFixed(1),
      t.fuelUsedLiters.toFixed(1),
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
    link.setAttribute('download', `BMW_X5_E53_Telemetry_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isDarkMode = preferences.theme === 'dark';

  return (
    <div
      className={`min-h-screen transition-colors duration-200 ${
        isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-slate-100 text-slate-900'
      }`}
    >
      {/* Universal Top Bar */}
      <Header
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        powertrainMode={powertrainMode}
        gensetActive={telemetry.gensetActive}
        onToggleGenset={handleToggleGenset}
        batterySoc={telemetry.batterySoc}
        onOpenExport={() => setIsExportModalOpen(true)}
      />

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-8">
        {/* Render Tab Contents */}
        {activeTab === 'telemetry' && (
          <div className="space-y-8">
            <TelemetryCockpit
              telemetry={telemetry}
              powertrainMode={powertrainMode}
              setPowertrainMode={setPowertrainMode}
              ecoModeActive={ecoModeActive}
              onSpeedChange={(spd) => setTelemetry((p) => ({ ...p, speed: spd }))}
              onThrottleChange={() => {}}
              onSimulateCriticalBattery={handleSimulateCriticalBattery}
              onToggleGenset={handleToggleGenset}
              onOpenDiagnostics={() => setActiveTab('diagnostics')}
              heroImage={heroBmwImage}
            />

            <AiAdvisor
              telemetry={telemetry}
              trips={trips}
              ecoModeActive={ecoModeActive}
            />

            <AnalyticsCharts
              telemetry={telemetry}
              trips={trips}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'diagnostics' && (
          <div className="space-y-8">
            <HardwareDiagnostics
              telemetry={telemetry}
              cellDiag={cellDiag}
              inverterDiag={inverterDiag}
              coolingDiag={coolingDiag}
              predictiveSummary={predictiveSummary}
              thermalData={thermalData}
              vibrationData={vibrationData}
              onUpdatePalette={handleUpdateThermalPalette}
              onSimulateThermalSpike={handleSimulateThermalSpike}
              onSimulateChillerMax={handleSimulateChillerMax}
              onSimulateBatteryHotspot={handleSimulateBatteryHotspot}
              onResetThermalNorm={handleResetThermalNorm}
              isSimulatingSpike={isSimulatingSpike}
              isChillerMax={isChillerMax}
              onSimulateVibrationFault={handleSimulateVibrationFault}
              onResetVibrationBalanced={handleResetVibrationBalanced}
              onTriggerCellBalance={handleTriggerCellBalance}
              onRunCoolantPurgeTest={handleRunCoolantPurgeTest}
              onSimulateInverterThermalLoad={handleSimulateInverterThermalLoad}
              onRunPredictiveAnalysis={handleRunPredictiveAnalysis}
              onAcknowledgeAlert={handleAcknowledgeAlert}
              onScheduleService={handleScheduleService}
              onSimulateExpansionFatigue={handleSimulateExpansionFatigue}
              purgeTesting={purgeTesting}
              isAnalyzingPredictive={isAnalyzingPredictive}
            />
          </div>
        )}

        {activeTab === 'powertrain' && (
          <div className="space-y-8">
            <PowertrainFlow
              telemetry={telemetry}
              powertrainMode={powertrainMode}
              onToggleGenset={handleToggleGenset}
              powertrainImage={powertrainArchImage}
            />
            <SmartEcoManager
              telemetry={telemetry}
              ecoModeActive={ecoModeActive}
              setEcoModeActive={setEcoModeActive}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
          </div>
        )}

        {activeTab === 'eco' && (
          <div className="space-y-8">
            <SmartEcoManager
              telemetry={telemetry}
              ecoModeActive={ecoModeActive}
              setEcoModeActive={setEcoModeActive}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
            <AiAdvisor
              telemetry={telemetry}
              trips={trips}
              ecoModeActive={ecoModeActive}
            />
          </div>
        )}

        {activeTab === 'emissions' && (
          <div className="space-y-8">
            <CarbonEmissionReporter
              telemetry={telemetry}
              trips={trips}
              onOpenExport={() => setIsExportModalOpen(true)}
              onExportCsv={handleExportCsv}
            />
            <AnalyticsCharts
              telemetry={telemetry}
              trips={trips}
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'finance' && (
          <div className="space-y-8">
            <BankingAndExpenses
              accounts={accounts}
              bills={bills}
              onPayBill={handlePayBill}
              onOpenExport={() => setIsExportModalOpen(true)}
            />
          </div>
        )}

        {activeTab === 'security' && (
          <div className="space-y-8">
            <SecurityVault
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
            <MultiDeviceSync
              onSelectMobilePreview={() => setShowMobilePreview(!showMobilePreview)}
              showMobilePreview={showMobilePreview}
            />
            <AppearanceSettings
              preferences={preferences}
              onUpdatePreferences={handleUpdatePreferences}
            />
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 py-6 text-center text-xs text-slate-500 font-mono no-print">
        <div className="max-w-7xl mx-auto px-6 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            BMW X5 E53 Hybrid Genset OS · Arsitektur Seri-Paralel REEV (M54B30 + 400V HV Pack)
          </div>
          <div className="flex items-center gap-4 text-slate-400">
            <span>Enkripsi: AES-256</span>
            <span aria-hidden="true">·</span>
            <span>Standar Emisi: Euro 6 Certified</span>
            <span aria-hidden="true">·</span>
            <span>Sync: Multi-Device Realtime</span>
          </div>
        </div>
      </footer>

      {/* Emergency Alert Modal */}
      <EmergencyAlertModal
        isOpen={isEmergencyModalOpen}
        batterySoc={telemetry.batterySoc}
        batteryVoltage={telemetry.batteryVoltage}
        onAutoStartGenset={handleEmergencyStartGenset}
        onDismiss={() => setIsEmergencyModalOpen(false)}
        soundAlertsEnabled={preferences.soundAlertsEnabled}
      />

      {/* Official Export Modal */}
      <ExportModal
        isOpen={isExportModalOpen}
        onClose={() => setIsExportModalOpen(false)}
        telemetry={telemetry}
        trips={trips}
      />

      {/* Mobile Smartphone View Drawer/Modal */}
      <MobileCompanionPreview
        isOpen={showMobilePreview}
        onClose={() => setShowMobilePreview(false)}
        telemetry={telemetry}
        powertrainMode={powertrainMode}
        onToggleGenset={handleToggleGenset}
        ecoModeActive={ecoModeActive}
        onToggleEco={() => setEcoModeActive(!ecoModeActive)}
      />
    </div>
  );
}
