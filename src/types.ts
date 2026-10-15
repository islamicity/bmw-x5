export type PowertrainMode = 'AUTO_GENSET' | 'PURE_EV' | 'GENSET_FORCE_CHARGE' | 'SPORT_HYBRID';

export interface VehicleTelemetry {
  timestamp: number;
  speed: number; // km/h
  odometer: number; // km
  // Battery Pack (400V 48.5 kWh LiFePO4)
  batterySoc: number; // % (State of Charge)
  batteryVoltage: number; // V
  batteryCurrent: number; // A (positive = discharge, negative = charge)
  batteryTemp: number; // °C
  batterySoh: number; // % (State of Health)
  estimatedRangeKm: number; // km pure electric
  totalHybridRangeKm: number; // km (electric + fuel genset buffer)
  // ICE Genset (Converted BMW M54B30 3.0L / M62B44)
  gensetActive: boolean;
  gensetRpm: number; // RPM (0 to 3500)
  gensetPower: number; // kW generated
  gensetEfficiency: number; // g/kWh (Brake Specific Fuel Consumption)
  fuelLevel: number; // % (Original 93L fuel tank repurposed for genset)
  fuelBurnRate: number; // L/h
  coolantTemp: number; // °C
  // Electric Drive Motor (Dual / Rear 160 kW)
  motorPower: number; // kW draw
  motorTorque: number; // Nm
  motorRpm: number;
  regenPower: number; // kW recovered
  inverterTemp: number; // °C
  // Aux & Cabin
  auxiliaryLoad: number; // kW (A/C, lights, infotainment)
  cabinTemp: number; // °C
  // Emissions
  co2Rate: number; // g/km current
  co2BaselineStock: number; // 315 g/km (2002 BMW X5 gasoline V8/I6)
  co2SavedTotalKg: number; // Total kg offset
}

export interface HistoricalTrip {
  id: string;
  date: string;
  distanceKm: number;
  durationMinutes: number;
  avgSpeedKmH: number;
  electricKwhUsed: number;
  gensetKwhGenerated: number;
  fuelUsedLiters: number;
  avgEfficiencyKwhPer100Km: number;
  co2EmittedGPerKm: number;
  co2SavedKg: number;
  costSavedIdr: number;
}

export interface EmissionRegressionDataPoint {
  id: string;
  label: string;
  gensetHours: number;
  gensetKwh: number;
  fuelUsedLiters: number;
  actualCo2EmittedKg: number;
  predictedCo2EmittedKg: number;
  residualError: number;
}

export interface EmissionRegressionModel {
  slope: number;
  intercept: number;
  rSquared: number;
  pearsonR: number;
  stdError: number;
  dataPoints: EmissionRegressionDataPoint[];
  monthlyProjectedCo2Kg: number;
  baselineStockX5Co2Kg: number;
  projectedReductionPercent: number;
  projectedCostSavingsIdr: number;
}

export interface GensetDispatchWindow {
  timeRange: string;
  title: string;
  category: 'PRIME_OPTIMAL' | 'RECOMMENDED' | 'SUB_OPTIMAL' | 'AVOID';
  bsfcEfficiencyGPerKwh: number;
  thermalEfficiencyPercent: number;
  idealSpeedKmH: string;
  ambientCondition: string;
  recommendationNote: string;
}

export interface AiRecommendationResult {
  systemStatusScore: number;
  executiveSummary: string;
  gensetOptimization: string;
  batteryLongevityAdvice: string;
  routeEfficiencyTip: string;
  estimatedMonthlySavingsIdr: number;
}

export interface BankAccount {
  id: string;
  bankName: string;
  accountNumber: string;
  type: string;
  balanceIdr: number;
  lastSync: string;
  status: 'connected' | 'syncing' | 'error';
}

export interface RecurringBill {
  id: string;
  title: string;
  category: 'charging' | 'maintenance' | 'insurance' | 'genset';
  dueDate: string;
  amountIdr: number;
  status: 'pending' | 'auto_paid' | 'overdue';
  daysLeft: number;
}

export interface ConnectedDevice {
  id: string;
  name: string;
  type: 'cockpit_screen' | 'mobile_phone' | 'desktop' | 'tablet';
  os: string;
  ip: string;
  lastSeen: string;
  isCurrent: boolean;
}

export interface AlertNotification {
  id: string;
  title: string;
  message: string;
  severity: 'critical' | 'warning' | 'info';
  timestamp: string;
  read: boolean;
  category: 'battery' | 'genset' | 'emission' | 'security' | 'billing';
}

export interface BatteryCellInfo {
  id: number;
  voltage: number; // Volts (e.g. 3.284)
  tempC: number; // °C
  internalResistanceMilliOhm: number; // mΩ
  isBalancing: boolean;
}

export interface BatteryCellDiagnostics {
  cells: BatteryCellInfo[];
  minCellVoltage: number;
  maxCellVoltage: number;
  deltaMillivolts: number;
  avgCellVoltage: number;
  activeBalancingActive: boolean;
  isolationResistanceKohm: number;
  packCycleCount: number;
  sohPercent: number;
}

export interface InverterDiagnostics {
  junctionTempC: number;
  gateDriverVoltageV: number;
  dcBusVoltageV: number;
  dcBusRippleV: number;
  phaseCurrentsA: { a: number; b: number; c: number };
  switchingFrequencyKhz: number;
  inverterEfficiencyPercent: number;
  thermalThrottling: boolean;
  pwmModulationIndex: number;
}

export interface M54CoolingDiagnostics {
  coolantTempC: number;
  radiatorInletTempC: number;
  radiatorOutletTempC: number;
  coolingLoopPressureBar: number;
  electricWaterPumpLpm: number;
  electricWaterPumpPwm: number;
  radiatorFanDutyPercent: number;
  thermostatStatus: 'CLOSED' | 'PARTIAL' | 'OPTIMAL_OPEN' | 'FULL_OPEN';
  expansionTankLevel: 'NORMAL' | 'LOW';
  headGasketIntegrityScore: number;
  oilTempC: number;
}

export interface BatteryThermalZone {
  moduleId: number;
  label: string;
  bank: 'BANK_A_FLOOR' | 'BANK_B_REAR';
  row: number;
  col: number;
  coreTempC: number;
  surfaceTempC: number;
  terminalTempC: number;
  coolantDeltaC: number;
  heatFluxW: number;
  isHotspot: boolean;
}

export interface InverterThermalZone {
  zoneId: string;
  label: string;
  category: 'MOSFET_U' | 'MOSFET_V' | 'MOSFET_W' | 'DC_CAPACITOR' | 'GATE_DRIVER' | 'COLD_PLATE';
  tempC: number;
  maxLimitC: number;
  powerLossW: number;
  xPercent: number;
  yPercent: number;
  isHotspot: boolean;
}

export interface ThermalTelemetryState {
  batteryZones: BatteryThermalZone[];
  inverterZones: InverterThermalZone[];
  batteryMaxTempC: number;
  batteryMinTempC: number;
  batteryAvgTempC: number;
  batteryDeltaTempC: number;
  inverterMaxTempC: number;
  inverterMinTempC: number;
  inverterAvgTempC: number;
  chillerInletTempC: number;
  chillerOutletTempC: number;
  chillerPwmPercent: number;
  activePalette: 'FLIR_IRON' | 'RAINBOW' | 'BMW_AMBER' | 'NEON_CYAN';
}

export interface VibrationHarmonicPeak {
  order: string;
  frequencyHz: number;
  amplitudeMmS: number;
  amplitudeG: number;
  label: string;
  sourceComponent: string;
  severity: 'GOOD' | 'SATISFACTORY' | 'WARNING' | 'CRITICAL';
}

export interface BearingHealthMetrics {
  bearingLocation: 'DRIVE_END_ALTERNATOR' | 'NON_DRIVE_END_ALTERNATOR' | 'CRANK_HARMONIC_DAMPER' | 'EWP_PUMP';
  name: string;
  bpfoHz: number;
  bpfiHz: number;
  bsfHz: number;
  ftfHz: number;
  healthScore: number;
  status: 'OPTIMAL' | 'FAIR' | 'DEFECT_SUSPECT' | 'CRITICAL';
  defectType?: 'NONE' | 'OUTER_RACE' | 'INNER_RACE' | 'ROLLER_ELEMENT' | 'CAGE_WEAR' | 'MASS_UNBALANCE' | 'MISALIGNMENT';
}

export interface VibrationTelemetryState {
  currentRpm: number;
  runningFrequency1xHz: number;
  overallVelocityRmsMmS: number;
  overallPeakAccelG: number;
  crestFactor: number;
  iso10816Zone: 'ZONE_A_GOOD' | 'ZONE_B_ACCEPTABLE' | 'ZONE_C_UNSATISFACTORY' | 'ZONE_D_UNACCEPTABLE';
  unbalanceSeverityPercent: number;
  misalignmentSeverityPercent: number;
  unbalancePhaseAngleDeg: number;
  balanceCorrectionWeightGram: number;
  balanceCorrectionAngleDeg: number;
  dynamicBalanceQualityGrade: 'G1.0_PRECISION' | 'G2.5_EXCELLENT' | 'G6.3_ACCEPTABLE' | 'G16_POOR';
  bearings: BearingHealthMetrics[];
  harmonicPeaks: VibrationHarmonicPeak[];
  fftSpectrumPoints: { freqHz: number; ampMmS: number }[];
  timeWaveformPoints: { timeMs: number; accelG: number }[];
  lastAnomalyDetected: string | null;
  activeSimulationFault: 'NONE' | 'MASS_UNBALANCE' | 'BEARING_BPFO' | 'BEARING_BPFI' | 'MISALIGNMENT' | 'MECHANICAL_LOOSENESS' | 'BELT_SLIP';
}

export type FailureRiskLevel = 'CRITICAL' | 'WARNING' | 'WATCHLIST' | 'OPTIMAL';

export interface PredictiveFailureAlert {
  id: string;
  component: string;
  system: 'M54_GENSET' | 'BATTERY_PACK' | 'INVERTER' | 'COOLING';
  riskLevel: FailureRiskLevel;
  failureProbabilityPercent: number;
  estimatedTimeToFailure: string;
  remainingUsefulLifeHours: number;
  leadingIndicator: string;
  recommendedAction: string;
  estCostIdr: number;
  isAcknowledged: boolean;
  scheduledDate?: string;
}

export interface PredictiveMaintenanceSummary {
  overallReliabilityScore: number;
  activeWatchlistCount: number;
  criticalAlertCount: number;
  projectedDowntimeAvoidedHours: number;
  estimatedMaintenanceSavingsIdr: number;
  lastAnalysisTimestamp: string;
  alerts: PredictiveFailureAlert[];
}

export interface UserPreferences {
  theme: 'dark' | 'light';
  accentColor: 'blue' | 'emerald' | 'amber';
  speedUnit: 'kmh' | 'mph';
  tempUnit: 'celsius' | 'fahrenheit';
  currency: 'IDR' | 'USD';
  autoEcoThreshold: number;
  criticalBatteryThreshold: number;
  monthlyBudgetLimitIdr: number;
  monthlyEnergyLimitKwh: number;
  soundAlertsEnabled: boolean;
  autoCloudBackup: boolean;
  twoFactorEnabled: boolean;
  biometricLockActive: boolean;
  endToEndEncryption: boolean;
}
