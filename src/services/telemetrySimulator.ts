import { VehicleTelemetry, HistoricalTrip, RecurringBill, BankAccount, AlertNotification } from '../types';

export const INITIAL_TELEMETRY: VehicleTelemetry = {
  timestamp: Date.now(),
  speed: 64, // km/h
  odometer: 184520, // km (2002 BMW X5 base chassis)
  batterySoc: 48, // %
  batteryVoltage: 384.2, // V
  batteryCurrent: 42.5, // A
  batteryTemp: 29.4, // °C
  batterySoh: 98.2, // %
  estimatedRangeKm: 86, // pure EV range
  totalHybridRangeKm: 780, // Hybrid with genset range
  gensetActive: false,
  gensetRpm: 0,
  gensetPower: 0,
  gensetEfficiency: 232, // g/kWh BSFC
  fuelLevel: 78, // %
  fuelBurnRate: 0, // L/h
  coolantTemp: 84, // °C
  motorPower: 28.5, // kW draw
  motorTorque: 210, // Nm
  motorRpm: 4200,
  regenPower: 0,
  inverterTemp: 44.1, // °C
  auxiliaryLoad: 1.8, // kW
  cabinTemp: 22.5, // °C
  co2Rate: 0, // Pure EV mode currently
  co2BaselineStock: 320, // g/km stock 2002 BMW X5 3.0i/4.4i
  co2SavedTotalKg: 1420.5,
};

export function createInitialCellDiagnostics(): import('../types').BatteryCellDiagnostics {
  const baseV = 3.288;
  const cells: import('../types').BatteryCellInfo[] = [];
  for (let i = 1; i <= 16; i++) {
    // Slight realistic spread of +/- 0.007V
    const offset = Math.sin(i * 1.7) * 0.007;
    const v = Number((baseV + offset).toFixed(3));
    cells.push({
      id: i,
      voltage: v,
      tempC: Number((28.8 + Math.cos(i) * 1.2).toFixed(1)),
      internalResistanceMilliOhm: Number((0.44 + (i % 3) * 0.02).toFixed(2)),
      isBalancing: i === 4 || i === 11, // Active balancer working on highest cells
    });
  }

  const voltages = cells.map((c) => c.voltage);
  const minV = Math.min(...voltages);
  const maxV = Math.max(...voltages);
  const delta = Math.round((maxV - minV) * 1000);
  const avgV = Number((voltages.reduce((a, b) => a + b, 0) / voltages.length).toFixed(3));

  return {
    cells,
    minCellVoltage: minV,
    maxCellVoltage: maxV,
    deltaMillivolts: delta,
    avgCellVoltage: avgV,
    activeBalancingActive: true,
    isolationResistanceKohm: 1250,
    packCycleCount: 342,
    sohPercent: 98.2,
  };
}

export function createInitialThermalTelemetry(): import('../types').ThermalTelemetryState {
  const batteryZones: import('../types').BatteryThermalZone[] = [];
  
  // 16 modules in 2 banks
  for (let i = 1; i <= 16; i++) {
    const isBankA = i <= 8;
    const bank = isBankA ? 'BANK_A_FLOOR' : 'BANK_B_REAR';
    const row = isBankA ? Math.floor((i - 1) / 4) : Math.floor((i - 9) / 4);
    const col = isBankA ? (i - 1) % 4 : (i - 9) % 4;
    
    // Module #7 has slightly higher resistance and temperature as noted in predictive watchlist
    const isMod7 = i === 7;
    const baseCore = isMod7 ? 33.4 : Number((28.5 + ((i * 1.3) % 2.6)).toFixed(1));
    const baseSurface = Number((baseCore - 1.8).toFixed(1));
    const baseTerminal = Number((baseCore + (isMod7 ? 1.9 : 0.8)).toFixed(1));
    
    batteryZones.push({
      moduleId: i,
      label: `MOD-${i.toString().padStart(2, '0')}`,
      bank,
      row,
      col,
      coreTempC: baseCore,
      surfaceTempC: baseSurface,
      terminalTempC: baseTerminal,
      coolantDeltaC: Number((baseCore - 24.2).toFixed(1)),
      heatFluxW: Number((32 + (i % 5) * 4.5).toFixed(1)),
      isHotspot: isMod7,
    });
  }

  const inverterZones: import('../types').InverterThermalZone[] = [
    { zoneId: 'u_hi', label: 'Phase U High-Side SiC', category: 'MOSFET_U', tempC: 45.8, maxLimitC: 125, powerLossW: 84, xPercent: 18, yPercent: 24, isHotspot: false },
    { zoneId: 'u_lo', label: 'Phase U Low-Side SiC', category: 'MOSFET_U', tempC: 44.2, maxLimitC: 125, powerLossW: 78, xPercent: 18, yPercent: 68, isHotspot: false },
    { zoneId: 'v_hi', label: 'Phase V High-Side SiC', category: 'MOSFET_V', tempC: 46.5, maxLimitC: 125, powerLossW: 88, xPercent: 44, yPercent: 24, isHotspot: false },
    { zoneId: 'v_lo', label: 'Phase V Low-Side SiC', category: 'MOSFET_V', tempC: 45.1, maxLimitC: 125, powerLossW: 81, xPercent: 44, yPercent: 68, isHotspot: false },
    { zoneId: 'w_hi', label: 'Phase W High-Side SiC', category: 'MOSFET_W', tempC: 46.0, maxLimitC: 125, powerLossW: 85, xPercent: 70, yPercent: 24, isHotspot: false },
    { zoneId: 'w_lo', label: 'Phase W Low-Side SiC', category: 'MOSFET_W', tempC: 44.8, maxLimitC: 125, powerLossW: 79, xPercent: 70, yPercent: 68, isHotspot: false },
    { zoneId: 'cap_1', label: 'DC-Link Cap C1 (Film)', category: 'DC_CAPACITOR', tempC: 38.2, maxLimitC: 85, powerLossW: 18, xPercent: 31, yPercent: 46, isHotspot: false },
    { zoneId: 'cap_2', label: 'DC-Link Cap C2 (Film)', category: 'DC_CAPACITOR', tempC: 38.6, maxLimitC: 85, powerLossW: 19, xPercent: 57, yPercent: 46, isHotspot: false },
    { zoneId: 'driver', label: 'Gate Driver & Isolated Power', category: 'GATE_DRIVER', tempC: 39.5, maxLimitC: 105, powerLossW: 22, xPercent: 88, yPercent: 46, isHotspot: false },
    { zoneId: 'cold_in', label: 'Cold Plate Inlet (Glycol)', category: 'COLD_PLATE', tempC: 28.5, maxLimitC: 65, powerLossW: 0, xPercent: 8, yPercent: 90, isHotspot: false },
    { zoneId: 'cold_out', label: 'Cold Plate Outlet (To Rad)', category: 'COLD_PLATE', tempC: 34.2, maxLimitC: 65, powerLossW: 0, xPercent: 88, yPercent: 90, isHotspot: false },
  ];

  const bTemps = batteryZones.map((z) => z.coreTempC);
  const iTemps = inverterZones.map((z) => z.tempC);

  return {
    batteryZones,
    inverterZones,
    batteryMaxTempC: Math.max(...bTemps),
    batteryMinTempC: Math.min(...bTemps),
    batteryAvgTempC: Number((bTemps.reduce((a, b) => a + b, 0) / bTemps.length).toFixed(1)),
    batteryDeltaTempC: Number((Math.max(...bTemps) - Math.min(...bTemps)).toFixed(1)),
    inverterMaxTempC: Math.max(...iTemps),
    inverterMinTempC: Math.min(...iTemps),
    inverterAvgTempC: Number((iTemps.reduce((a, b) => a + b, 0) / iTemps.length).toFixed(1)),
    chillerInletTempC: 28.5,
    chillerOutletTempC: 34.2,
    chillerPwmPercent: 55,
    activePalette: 'FLIR_IRON',
  };
}

export function generateVibrationData(
  rpm: number,
  fault: 'NONE' | 'MASS_UNBALANCE' | 'BEARING_BPFO' | 'BEARING_BPFI' | 'MISALIGNMENT' | 'MECHANICAL_LOOSENESS' | 'BELT_SLIP' = 'NONE'
): import('../types').VibrationTelemetryState {
  const effectiveRpm = rpm > 100 ? rpm : 2100;
  const f1x = Number((effectiveRpm / 60).toFixed(1)); // e.g. 35.0 Hz at 2100 RPM
  const f2x = Number((f1x * 2).toFixed(1)); // 70.0 Hz
  const f3x = Number((f1x * 3).toFixed(1)); // 105.0 Hz (M54 I6 Firing pulse)
  const f6x = Number((f1x * 6).toFixed(1)); // 210.0 Hz

  // Alternator bearing characteristic defect frequencies (SKF 6208 Deep Groove)
  const bpfo = Number((f1x * 3.58).toFixed(1)); // 125.3 Hz (Outer race)
  const bpfi = Number((f1x * 5.42).toFixed(1)); // 189.7 Hz (Inner race)
  const bsf = Number((f1x * 2.31).toFixed(1));  // 80.8 Hz (Ball spin)
  const ftf = Number((f1x * 0.41).toFixed(1));  // 14.4 Hz (Cage train)

  // Base harmonic amplitudes in mm/s RMS
  let a1x = 0.85; // 1X unbalance
  let a2x = 0.42; // 2X misalignment
  let a3x = 0.65; // 3X firing pulse
  let abpfo = 0.22; // Bearing outer race
  let abpfi = 0.18; // Bearing inner race
  let a0_5x = 0.08; // Subharmonic
  const noiseFloor = 0.12;

  let isoZone: import('../types').VibrationTelemetryState['iso10816Zone'] = 'ZONE_A_GOOD';
  let unbalancePercent = 14;
  let misalignmentPercent = 11;
  let anomalyMessage: string | null = null;
  let unbalancePhaseAngleDeg = 28;
  let balanceCorrectionWeightGram = 1.2;
  let dynamicBalanceQualityGrade: import('../types').VibrationTelemetryState['dynamicBalanceQualityGrade'] = 'G1.0_PRECISION';

  if (fault === 'MASS_UNBALANCE') {
    a1x = 4.85;
    unbalancePercent = 88;
    unbalancePhaseAngleDeg = 146;
    balanceCorrectionWeightGram = 18.5;
    dynamicBalanceQualityGrade = 'G16_POOR';
    isoZone = 'ZONE_D_UNACCEPTABLE';
    anomalyMessage = 'Ketidakseimbangan Massa Kritis: Puncak 1X (35.0 Hz) mencapai 4.85 mm/s dengan sudut fasa 146°. Rotor alternator memerlukan penambahan bobot kalibrasi 18.5g @ 326°!';
  } else if (fault === 'BEARING_BPFO') {
    abpfo = 3.65;
    abpfi = 1.85;
    dynamicBalanceQualityGrade = 'G6.3_ACCEPTABLE';
    isoZone = 'ZONE_C_UNSATISFACTORY';
    anomalyMessage = 'Kerusakan Cincin Luar Bantalan (BPFO): Frekuensi cacat 125.3 Hz beramplitudo tinggi terdeteksi pada bantalan Drive-End alternator generator (SKF 6208)!';
  } else if (fault === 'BEARING_BPFI') {
    abpfi = 4.15;
    abpfo = 1.10;
    dynamicBalanceQualityGrade = 'G6.3_ACCEPTABLE';
    isoZone = 'ZONE_C_UNSATISFACTORY';
    anomalyMessage = 'Cacat Cincin Dalam Bantalan (BPFI): Lonjakan 189.7 Hz disertai modulasi sideband 1X terdeteksi pada bantalan Non-Drive End alternator generator (SKF 6207)!';
  } else if (fault === 'MISALIGNMENT') {
    a2x = 3.82;
    a1x = 2.10;
    misalignmentPercent = 78;
    dynamicBalanceQualityGrade = 'G6.3_ACCEPTABLE';
    isoZone = 'ZONE_C_UNSATISFACTORY';
    anomalyMessage = 'Salah Penyelarasan Poros (Misalignment): Puncak 2X (70.0 Hz) mendominasi sinyal spektral. Fleksibel kopling M54-Genset mengalami angular & offset misalignment!';
  } else if (fault === 'MECHANICAL_LOOSENESS') {
    a1x = 2.45;
    a2x = 2.15;
    a3x = 1.85;
    a0_5x = 1.92;
    dynamicBalanceQualityGrade = 'G16_POOR';
    isoZone = 'ZONE_C_UNSATISFACTORY';
    anomalyMessage = 'Kelonggaran Mekanis (Mechanical Looseness): Terdeteksi harmonik sub-kelipatan 0.5X (17.5 Hz) dan truncated waveform. Baut mounting generator kendor!';
  } else if (fault === 'BELT_SLIP') {
    a1x = 1.95;
    dynamicBalanceQualityGrade = 'G2.5_EXCELLENT';
    isoZone = 'ZONE_B_ACCEPTABLE';
    anomalyMessage = 'Fluktuasi Tegang Sabuk Aux: Ketegangan sabuk poly-V alternator terdeteksi mengendur minor.';
  }

  const balanceCorrectionAngleDeg = (unbalancePhaseAngleDeg + 180) % 360;

  const overallVelocity = Math.sqrt(
    Math.pow(a1x, 2) + Math.pow(a2x, 2) + Math.pow(a3x, 2) + Math.pow(abpfo, 2) + Math.pow(abpfi, 2) + Math.pow(a0_5x, 2) + 0.3
  );

  const overallPeakAccelG = Number(((overallVelocity * (2 * Math.PI * f1x)) / 9806.65 * 1.8).toFixed(2));
  const crestFactor = Number((2.8 + (fault !== 'NONE' ? 1.6 : 0.2)).toFixed(1));

  // Generate 80 FFT spectral bins across 0 to 360 Hz
  const fftSpectrumPoints: { freqHz: number; ampMmS: number }[] = [];
  for (let hz = 0; hz <= 360; hz += 4) {
    let amp = noiseFloor + Math.random() * 0.08;

    // Subharmonic 0.5X
    if (a0_5x > 0.1) {
      const d0_5x = Math.abs(hz - f1x * 0.5);
      if (d0_5x < 8) amp += a0_5x * Math.exp(-Math.pow(d0_5x / 2.5, 2));
    }

    const d1x = Math.abs(hz - f1x);
    if (d1x < 8) amp += a1x * Math.exp(-Math.pow(d1x / 2.5, 2));

    const d2x = Math.abs(hz - f2x);
    if (d2x < 8) amp += a2x * Math.exp(-Math.pow(d2x / 2.5, 2));

    const d3x = Math.abs(hz - f3x);
    if (d3x < 8) amp += a3x * Math.exp(-Math.pow(d3x / 2.5, 2));

    const d6x = Math.abs(hz - f6x);
    if (d6x < 8) amp += 0.35 * Math.exp(-Math.pow(d6x / 2.5, 2));

    const dbpfo = Math.abs(hz - bpfo);
    if (dbpfo < 8) amp += abpfo * Math.exp(-Math.pow(dbpfo / 2.5, 2));

    const dbpfi = Math.abs(hz - bpfi);
    if (dbpfi < 8) amp += abpfi * Math.exp(-Math.pow(dbpfi / 2.5, 2));

    fftSpectrumPoints.push({
      freqHz: hz,
      ampMmS: Number(Math.max(0.02, amp).toFixed(3)),
    });
  }

  // Generate 50 raw time-domain waveform points
  const timeWaveformPoints: { timeMs: number; accelG: number }[] = [];
  for (let t = 0; t <= 50; t += 1) {
    const timeSec = t / 1000;
    const sig1 = a1x * Math.sin(2 * Math.PI * f1x * timeSec + (unbalancePhaseAngleDeg * Math.PI) / 180);
    const sig2 = a2x * Math.sin(2 * Math.PI * f2x * timeSec + 0.4);
    const sig3 = a3x * Math.sin(2 * Math.PI * f3x * timeSec + 0.8);
    const sigBpfo = abpfo * Math.sin(2 * Math.PI * bpfo * timeSec) * (Math.sin(2 * Math.PI * f1x * timeSec) + 1);
    const sigBpfi = abpfi * Math.sin(2 * Math.PI * bpfi * timeSec) * (Math.sin(2 * Math.PI * f1x * timeSec) + 1);
    const sigSub = a0_5x * Math.sin(2 * Math.PI * (f1x * 0.5) * timeSec);
    const noise = (Math.random() - 0.5) * 0.2;
    const accelG = Number(((sig1 + sig2 + sig3 + sigBpfo + sigBpfi + sigSub) * 0.25 + noise).toFixed(3));
    timeWaveformPoints.push({ timeMs: t, accelG });
  }

  const harmonicPeaks: import('../types').VibrationHarmonicPeak[] = [
    {
      order: '1X',
      frequencyHz: f1x,
      amplitudeMmS: Number(a1x.toFixed(2)),
      amplitudeG: Number((a1x * 0.18).toFixed(2)),
      label: 'Putaran Poros Utama (Running Speed)',
      sourceComponent: 'Rotor Alternator / Poros Engkol M54',
      severity: a1x > 4.0 ? 'CRITICAL' : a1x > 2.5 ? 'WARNING' : a1x > 1.2 ? 'SATISFACTORY' : 'GOOD',
    },
    {
      order: '2X',
      frequencyHz: f2x,
      amplitudeMmS: Number(a2x.toFixed(2)),
      amplitudeG: Number((a2x * 0.22).toFixed(2)),
      label: 'Harmonik Ke-2 (Misalignment Flag)',
      sourceComponent: 'Kopling Fleksibel Poros Genset',
      severity: a2x > 3.0 ? 'CRITICAL' : a2x > 1.8 ? 'WARNING' : 'GOOD',
    },
    {
      order: '3X',
      frequencyHz: f3x,
      amplitudeMmS: Number(a3x.toFixed(2)),
      amplitudeG: Number((a3x * 0.28).toFixed(2)),
      label: 'Frekuensi Pembakaran 6-Silinder',
      sourceComponent: 'Siklus Pembakaran M54B30 (3 firing/rev)',
      severity: 'GOOD',
    },
    {
      order: 'BPFO',
      frequencyHz: bpfo,
      amplitudeMmS: Number(abpfo.toFixed(2)),
      amplitudeG: Number((abpfo * 0.45).toFixed(2)),
      label: 'Ball Pass Frequency Outer Race',
      sourceComponent: 'Bantalan Generator DE (SKF 6208)',
      severity: abpfo > 2.5 ? 'CRITICAL' : abpfo > 1.0 ? 'WARNING' : 'GOOD',
    },
    {
      order: 'BPFI',
      frequencyHz: bpfi,
      amplitudeMmS: Number(abpfi.toFixed(2)),
      amplitudeG: Number((abpfi * 0.52).toFixed(2)),
      label: 'Ball Pass Frequency Inner Race',
      sourceComponent: 'Bantalan Generator NDE (SKF 6207)',
      severity: abpfi > 2.5 ? 'CRITICAL' : abpfi > 1.2 ? 'WARNING' : 'GOOD',
    },
  ];

  const bearings: import('../types').BearingHealthMetrics[] = [
    {
      bearingLocation: 'DRIVE_END_ALTERNATOR',
      name: 'Bantalan Depan Alternator / Generator (Drive-End)',
      bpfoHz: bpfo,
      bpfiHz: bpfi,
      bsfHz: bsf,
      ftfHz: ftf,
      healthScore: fault === 'BEARING_BPFO' ? 38 : fault === 'MASS_UNBALANCE' ? 72 : fault === 'MECHANICAL_LOOSENESS' ? 64 : 96,
      status: fault === 'BEARING_BPFO' ? 'CRITICAL' : fault === 'MASS_UNBALANCE' ? 'FAIR' : fault === 'MECHANICAL_LOOSENESS' ? 'FAIR' : 'OPTIMAL',
      defectType: fault === 'BEARING_BPFO' ? 'OUTER_RACE' : fault === 'MECHANICAL_LOOSENESS' ? 'ROLLER_ELEMENT' : 'NONE',
    },
    {
      bearingLocation: 'NON_DRIVE_END_ALTERNATOR',
      name: 'Bantalan Belakang Alternator (Non-Drive-End SKF 6207)',
      bpfoHz: Number((f1x * 3.42).toFixed(1)),
      bpfiHz: Number((f1x * 5.18).toFixed(1)),
      bsfHz: Number((f1x * 2.15).toFixed(1)),
      ftfHz: Number((f1x * 0.39).toFixed(1)),
      healthScore: fault === 'BEARING_BPFI' ? 34 : 94,
      status: fault === 'BEARING_BPFI' ? 'CRITICAL' : 'OPTIMAL',
      defectType: fault === 'BEARING_BPFI' ? 'INNER_RACE' : 'NONE',
    },
    {
      bearingLocation: 'CRANK_HARMONIC_DAMPER',
      name: 'Damper Harmonik Poros Engkol M54 (Crank Pulley)',
      bpfoHz: Number((f1x * 1.0).toFixed(1)),
      bpfiHz: Number((f1x * 2.0).toFixed(1)),
      bsfHz: Number((f1x * 6.0).toFixed(1)),
      ftfHz: Number((f1x * 0.5).toFixed(1)),
      healthScore: fault === 'MISALIGNMENT' ? 62 : fault === 'MASS_UNBALANCE' ? 74 : 92,
      status: fault === 'MISALIGNMENT' ? 'FAIR' : fault === 'MASS_UNBALANCE' ? 'FAIR' : 'OPTIMAL',
      defectType: fault === 'MISALIGNMENT' ? 'MISALIGNMENT' : fault === 'MASS_UNBALANCE' ? 'MASS_UNBALANCE' : 'NONE',
    },
    {
      bearingLocation: 'EWP_PUMP',
      name: 'Bantalan & Bushing Pompa Air Listrik (EWP Stewart Pierburg)',
      bpfoHz: 84.5,
      bpfiHz: 122.0,
      bsfHz: 45.2,
      ftfHz: 12.0,
      healthScore: fault === 'MECHANICAL_LOOSENESS' ? 58 : 88,
      status: fault === 'MECHANICAL_LOOSENESS' ? 'FAIR' : 'OPTIMAL',
      defectType: fault === 'MECHANICAL_LOOSENESS' ? 'ROLLER_ELEMENT' : 'NONE',
    },
  ];

  return {
    currentRpm: effectiveRpm,
    runningFrequency1xHz: f1x,
    overallVelocityRmsMmS: Number(overallVelocity.toFixed(2)),
    overallPeakAccelG,
    crestFactor,
    iso10816Zone: isoZone,
    unbalanceSeverityPercent: unbalancePercent,
    misalignmentSeverityPercent: misalignmentPercent,
    unbalancePhaseAngleDeg,
    balanceCorrectionWeightGram,
    balanceCorrectionAngleDeg,
    dynamicBalanceQualityGrade,
    bearings,
    harmonicPeaks,
    fftSpectrumPoints,
    timeWaveformPoints,
    lastAnomalyDetected: anomalyMessage,
    activeSimulationFault: fault,
  };
}

export function createInitialVibrationTelemetry(): import('../types').VibrationTelemetryState {
  return generateVibrationData(2100, 'NONE');
}

export const INITIAL_INVERTER_DIAGNOSTICS: import('../types').InverterDiagnostics = {
  junctionTempC: 44.5,
  gateDriverVoltageV: 15.2,
  dcBusVoltageV: 384.2,
  dcBusRippleV: 1.15,
  phaseCurrentsA: { a: 42.1, b: 42.4, c: 41.9 },
  switchingFrequencyKhz: 12.0,
  inverterEfficiencyPercent: 97.8,
  thermalThrottling: false,
  pwmModulationIndex: 0.68,
};

export const INITIAL_M54_COOLING_DIAGNOSTICS: import('../types').M54CoolingDiagnostics = {
  coolantTempC: 86.4,
  radiatorInletTempC: 85.8,
  radiatorOutletTempC: 66.2,
  coolingLoopPressureBar: 1.25,
  electricWaterPumpLpm: 44.5,
  electricWaterPumpPwm: 65,
  radiatorFanDutyPercent: 35,
  thermostatStatus: 'OPTIMAL_OPEN',
  expansionTankLevel: 'NORMAL',
  headGasketIntegrityScore: 99.4,
  oilTempC: 91.2,
};

export const INITIAL_PREDICTIVE_SUMMARY: import('../types').PredictiveMaintenanceSummary = {
  overallReliabilityScore: 91,
  activeWatchlistCount: 2,
  criticalAlertCount: 0,
  projectedDowntimeAvoidedHours: 48,
  estimatedMaintenanceSavingsIdr: 4850000,
  lastAnalysisTimestamp: '15 Okt 2026, 11:15 WIB',
  alerts: [
    {
      id: 'pred-1',
      component: 'Tangki Ekspansi Pendingin M54 (Expansion Tank)',
      system: 'COOLING',
      riskLevel: 'WARNING',
      failureProbabilityPercent: 74,
      estimatedTimeToFailure: '160 Jam Operasi (~5 Minggu)',
      remainingUsefulLifeHours: 160,
      leadingIndicator: '842 siklus termal tercatat; kurva tekanan 1.25 bar mengindikasikan kelelahan polimer plastik OEM E53 di seam sambungan bawah.',
      recommendedAction: 'Ganti tangki ekspansi ke versi aluminium aftermarket sebelum terjadi retak mendadak dan kebocoran air radiator.',
      estCostIdr: 1450000,
      isAcknowledged: false,
    },
    {
      id: 'pred-2',
      component: 'Modul Sel Baterai #07 (High-Voltage LiFePO4)',
      system: 'BATTERY_PACK',
      riskLevel: 'WATCHLIST',
      failureProbabilityPercent: 42,
      estimatedTimeToFailure: '1.450 Siklus Pengisian (~18 Bulan)',
      remainingUsefulLifeHours: 1450,
      leadingIndicator: 'Kenaikan resistansi internal internal +0.04 mΩ dibanding rata-rata modul (0.48 mΩ vs 0.44 mΩ). Laju pelepasan daya sedikit lambat.',
      recommendedAction: 'Jalankan active balancing semalam pada status parkir (DoD 50%) untuk menyetarakan resistansi kimia antar-sel.',
      estCostIdr: 0,
      isAcknowledged: false,
    },
    {
      id: 'pred-3',
      component: 'Bushing & Impeller Pompa Air Listrik (EWP M54)',
      system: 'M54_GENSET',
      riskLevel: 'WATCHLIST',
      failureProbabilityPercent: 38,
      estimatedTimeToFailure: '820 Jam Operasi (~6 Bulan)',
      remainingUsefulLifeHours: 820,
      leadingIndicator: 'Fluktuasi PWM minor (±4%) terdeteksi saat cold crank genset; keausan bushing mekanik terproyeksi 12%.',
      recommendedAction: 'Pembersihan kerak pendingin dan penggantian seal impeller pada jadwal servis berkala 195.000 km.',
      estCostIdr: 650000,
      isAcknowledged: false,
    },
    {
      id: 'pred-4',
      component: 'Kapasitor DC-Link Inverter Daya (SiC Power Stage)',
      system: 'INVERTER',
      riskLevel: 'OPTIMAL',
      failureProbabilityPercent: 9,
      estimatedTimeToFailure: '> 4.500 Jam Operasi (> 3 Tahun)',
      remainingUsefulLifeHours: 4500,
      leadingIndicator: 'Ripple tegangan bus DC 1.15V pada 384V berada jauh di bawah ambang batas kelelahan dielektrik (6.0V).',
      recommendedAction: 'Kondisi prima. Pertahankan suhu cairan pendingin inverter di bawah 65°C.',
      estCostIdr: 0,
      isAcknowledged: true,
    },
  ],
};

export const INITIAL_TRIPS: HistoricalTrip[] = [
  {
    id: 'trip-101',
    date: '2026-10-14',
    distanceKm: 52.4,
    durationMinutes: 48,
    avgSpeedKmH: 65.5,
    electricKwhUsed: 9.8,
    gensetKwhGenerated: 3.2,
    fuelUsedLiters: 1.1,
    avgEfficiencyKwhPer100Km: 18.7,
    co2EmittedGPerKm: 42.1,
    co2SavedKg: 14.8,
    costSavedIdr: 125000,
  },
  {
    id: 'trip-102',
    date: '2026-10-13',
    distanceKm: 88.0,
    durationMinutes: 92,
    avgSpeedKmH: 57.3,
    electricKwhUsed: 14.2,
    gensetKwhGenerated: 6.5,
    fuelUsedLiters: 2.3,
    avgEfficiencyKwhPer100Km: 19.4,
    co2EmittedGPerKm: 54.2,
    co2SavedKg: 23.4,
    costSavedIdr: 198000,
  },
  {
    id: 'trip-103',
    date: '2026-10-12',
    distanceKm: 34.6,
    durationMinutes: 35,
    avgSpeedKmH: 59.3,
    electricKwhUsed: 6.1,
    gensetKwhGenerated: 0,
    fuelUsedLiters: 0,
    avgEfficiencyKwhPer100Km: 17.6,
    co2EmittedGPerKm: 0,
    co2SavedKg: 11.1,
    costSavedIdr: 92000,
  },
  {
    id: 'trip-104',
    date: '2026-10-11',
    distanceKm: 112.5,
    durationMinutes: 124,
    avgSpeedKmH: 54.4,
    electricKwhUsed: 18.9,
    gensetKwhGenerated: 12.0,
    fuelUsedLiters: 4.1,
    avgEfficiencyKwhPer100Km: 20.1,
    co2EmittedGPerKm: 68.3,
    co2SavedKg: 28.5,
    costSavedIdr: 254000,
  },
  {
    id: 'trip-105',
    date: '2026-10-10',
    distanceKm: 41.2,
    durationMinutes: 42,
    avgSpeedKmH: 58.8,
    electricKwhUsed: 7.5,
    gensetKwhGenerated: 0,
    fuelUsedLiters: 0,
    avgEfficiencyKwhPer100Km: 18.2,
    co2EmittedGPerKm: 0,
    co2SavedKg: 13.2,
    costSavedIdr: 110000,
  },
];

export const INITIAL_BILLS: RecurringBill[] = [
  {
    id: 'bill-1',
    title: 'Tagihan SPKLU Fast Charging Bulanan',
    category: 'charging',
    dueDate: '2026-10-25',
    amountIdr: 485000,
    status: 'pending',
    daysLeft: 11,
  },
  {
    id: 'bill-2',
    title: 'Asuransi Paket Baterai HV & Sertifikasi Emisi',
    category: 'insurance',
    dueDate: '2026-11-04',
    amountIdr: 750000,
    status: 'pending',
    daysLeft: 21,
  },
  {
    id: 'bill-3',
    title: 'Ganti Oli & Filter Mesin Genset M54 E53',
    category: 'genset',
    dueDate: '2026-11-15',
    amountIdr: 620000,
    status: 'pending',
    daysLeft: 32,
  },
];

export const INITIAL_BANKS: BankAccount[] = [
  {
    id: 'bank-bca',
    bankName: 'Bank Central Asia (BCA)',
    accountNumber: '•••• 8821',
    type: 'EV Fleet Auto-Debit',
    balanceIdr: 28450000,
    lastSync: 'Baru saja',
    status: 'connected',
  },
  {
    id: 'bank-mandiri',
    bankName: 'Bank Mandiri',
    accountNumber: '•••• 4310',
    type: 'Direct Pay Fuel & Service',
    balanceIdr: 15200000,
    lastSync: '10 menit lalu',
    status: 'connected',
  },
];

export const INITIAL_ALERTS: AlertNotification[] = [
  {
    id: 'alt-1',
    title: 'Sistem Genset Hibrida Siap Operasi',
    message: 'Mesin M54B30 terhubung sempurna ke generator 45 kW dengan inverter DC-DC 400V.',
    severity: 'info',
    timestamp: '10:15 WIB',
    read: true,
    category: 'genset',
  },
  {
    id: 'alt-2',
    title: 'Sertifikasi Emisi Otomatis Sukses',
    message: 'Jejak karbon mingguan tercatat 82% lebih bersih dibandingkan emisi pabrikan 2002.',
    severity: 'info',
    timestamp: '08:42 WIB',
    read: false,
    category: 'emission',
  },
];

// Web Audio API Synthesizer for emergency alert beeping
class EmergencyAudioPlayer {
  private ctx: AudioContext | null = null;
  private intervalId: any = null;

  private initCtx() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
  }

  playCriticalBeep() {
    try {
      this.initCtx();
      if (!this.ctx) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(880, this.ctx.currentTime); // A5 note
      osc.frequency.exponentialRampToValueAtTime(440, this.ctx.currentTime + 0.18);
      gain.gain.setValueAtTime(0.12, this.ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.18);
      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start();
      osc.stop(this.ctx.currentTime + 0.2);
    } catch {
      // Audio autoplay policy fallback
    }
  }

  startEmergencyLoop() {
    if (this.intervalId) return;
    this.playCriticalBeep();
    this.intervalId = setInterval(() => {
      this.playCriticalBeep();
    }, 1200);
  }

  stopEmergencyLoop() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
}

export const emergencyAudio = new EmergencyAudioPlayer();

export const INITIAL_REGRESSION_DATA_POINTS: import('../types').EmissionRegressionDataPoint[] = [
  { id: 'dp-1', label: 'Minggu 1 (Komuter Tol)', gensetHours: 8.5, gensetKwh: 185.2, fuelUsedLiters: 19.5, actualCo2EmittedKg: 45.1, predictedCo2EmittedKg: 44.8, residualError: 0.3 },
  { id: 'dp-2', label: 'Minggu 2 (Jarak Jauh Luar Kota)', gensetHours: 15.2, gensetKwh: 342.0, fuelUsedLiters: 35.8, actualCo2EmittedKg: 82.7, predictedCo2EmittedKg: 81.6, residualError: 1.1 },
  { id: 'dp-3', label: 'Minggu 3 (Pure EV Dalam Kota)', gensetHours: 3.2, gensetKwh: 68.0, fuelUsedLiters: 7.2, actualCo2EmittedKg: 16.6, predictedCo2EmittedKg: 15.7, residualError: 0.9 },
  { id: 'dp-4', label: 'Minggu 4 (Cuaca Panas & Macet)', gensetHours: 12.0, gensetKwh: 260.4, fuelUsedLiters: 28.5, actualCo2EmittedKg: 65.8, predictedCo2EmittedKg: 64.0, residualError: 1.8 },
  { id: 'dp-5', label: 'Minggu 5 (Toll Jelajah Stabil)', gensetHours: 18.0, gensetKwh: 410.5, fuelUsedLiters: 42.1, actualCo2EmittedKg: 97.2, predictedCo2EmittedKg: 97.0, residualError: 0.2 },
  { id: 'dp-6', label: 'Minggu 6 (Kombinasi Harian)', gensetHours: 10.5, gensetKwh: 232.0, fuelUsedLiters: 24.2, actualCo2EmittedKg: 55.9, predictedCo2EmittedKg: 55.8, residualError: 0.1 },
  { id: 'dp-7', label: 'Minggu 7 (Jadwal Efisien)', gensetHours: 6.8, gensetKwh: 152.0, fuelUsedLiters: 15.6, actualCo2EmittedKg: 36.0, predictedCo2EmittedKg: 35.5, residualError: 0.5 },
];

export function calculateEmissionRegression(
  dataPoints: import('../types').EmissionRegressionDataPoint[] = INITIAL_REGRESSION_DATA_POINTS,
  projectedMonthlyHours = 32
): import('../types').EmissionRegressionModel {
  const n = dataPoints.length;
  const x = dataPoints.map((d) => d.gensetHours);
  const y = dataPoints.map((d) => d.actualCo2EmittedKg);

  const meanX = x.reduce((a, b) => a + b, 0) / n;
  const meanY = y.reduce((a, b) => a + b, 0) / n;

  let numerator = 0;
  let denominator = 0;
  for (let i = 0; i < n; i++) {
    numerator += (x[i] - meanX) * (y[i] - meanY);
    denominator += Math.pow(x[i] - meanX, 2);
  }

  const slope = denominator !== 0 ? numerator / denominator : 5.4;
  const intercept = meanY - slope * meanX;

  let ssTot = 0;
  let ssRes = 0;
  for (let i = 0; i < n; i++) {
    const yPred = slope * x[i] + intercept;
    ssTot += Math.pow(y[i] - meanY, 2);
    ssRes += Math.pow(y[i] - yPred, 2);
  }

  const rSquared = ssTot !== 0 ? Math.max(0, Math.min(1, 1 - ssRes / ssTot)) : 0.985;
  const pearsonR = Math.sqrt(rSquared);
  const stdError = n > 2 ? Math.sqrt(ssRes / (n - 2)) : 0.85;

  const pointsWithPred = dataPoints.map((d) => {
    const pred = Number((slope * d.gensetHours + intercept).toFixed(1));
    return {
      ...d,
      predictedCo2EmittedKg: pred,
      residualError: Number(Math.abs(d.actualCo2EmittedKg - pred).toFixed(2)),
    };
  });

  const monthlyProjected = Number((slope * projectedMonthlyHours + intercept).toFixed(1));
  const baselineStock = 464.0; // 320 g/km * 1,450 km monthly standard BMW X5 2002
  const reductionPercent = Number(Math.max(0, ((baselineStock - monthlyProjected) / baselineStock) * 100).toFixed(1));
  const projectedSavings = Math.round(((baselineStock - monthlyProjected) / 2.31) * 14500);

  return {
    slope: Number(slope.toFixed(2)),
    intercept: Number(intercept.toFixed(2)),
    rSquared: Number(rSquared.toFixed(3)),
    pearsonR: Number(pearsonR.toFixed(3)),
    stdError: Number(stdError.toFixed(2)),
    dataPoints: pointsWithPred,
    monthlyProjectedCo2Kg: monthlyProjected,
    baselineStockX5Co2Kg: baselineStock,
    projectedReductionPercent: reductionPercent,
    projectedCostSavingsIdr: projectedSavings,
  };
}

export const GENSET_DISPATCH_WINDOWS: import('../types').GensetDispatchWindow[] = [
  {
    timeRange: '05:30 - 08:30',
    title: 'Pagi Hari: Komuter Jelajah Tol & Jalur Terbuka',
    category: 'PRIME_OPTIMAL',
    bsfcEfficiencyGPerKwh: 232,
    thermalEfficiencyPercent: 38.6,
    idealSpeedKmH: '65 - 85 km/h',
    ambientCondition: 'Suhu 23-25°C · Kepadatan O₂ Udara Intake Maksimal',
    recommendationNote: 'Jendela waktu paling efisien! Aktifkan mode genset putaran tetap 2.100 RPM saat melaju di jalan tol untuk mengisi baterai dari 30% ke 75% dengan konsumsi bahan bakar terendah.',
  },
  {
    timeRange: '19:30 - 22:30',
    title: 'Malam Hari: Transit Tol Antar-Kota & Luar Kota',
    category: 'RECOMMENDED',
    bsfcEfficiencyGPerKwh: 236,
    thermalEfficiencyPercent: 37.8,
    idealSpeedKmH: '70 - 90 km/h',
    ambientCondition: 'Suhu 26°C · Disipasi Radiator Mantap Tanpa Panas Aspal',
    recommendationNote: 'Sangat direkomendasikan untuk perjalanan jarak jauh. Kecepatan jelajah stabil memungkinkan aliran daya generator 32 kW langsung mensuplai motor traksi tanpa siklus bolak-balik baterai berlebihan.',
  },
  {
    timeRange: '11:00 - 15:00',
    title: 'Siang Terik: Kemacetan Padat Kota & Panas Tropis',
    category: 'AVOID',
    bsfcEfficiencyGPerKwh: 284,
    thermalEfficiencyPercent: 31.4,
    idealSpeedKmH: '0 - 35 km/h (Stop & Go)',
    ambientCondition: 'Suhu Aspal >38°C · Beban Kompresor A/C Puncak (+2.8 kW)',
    recommendationNote: 'HINDARI menjalankan genset pada jam ini! Suhu udara masuk tinggi menurunkan efisiensi volumetrik mesin M54. Gunakan mode PURE_EV sepenuhnya untuk menjaga nol polusi di jalan kota.',
  },
  {
    timeRange: '23:00 - 05:00',
    title: 'Dini Hari: Parkir Garasi & Pengisian AC SPKLU Off-Peak',
    category: 'SUB_OPTIMAL',
    bsfcEfficiencyGPerKwh: 0,
    thermalEfficiencyPercent: 93.0,
    idealSpeedKmH: '0 km/h (Parkir)',
    ambientCondition: 'Tarif Listrik Rumah Off-Peak · Tanpa Beban Mesin',
    recommendationNote: 'Matikan genset total. Gunakan pengisian daya baterai lambat AC 7.4 kW di rumah saat tarif malam. Menghasilkan emisi lokal 0 g/km dan menghemat biaya BBM hingga 72%.',
  },
];
