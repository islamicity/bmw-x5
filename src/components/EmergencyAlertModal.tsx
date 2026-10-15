import React, { useEffect } from 'react';
import { emergencyAudio } from '../services/telemetrySimulator';

interface EmergencyAlertModalProps {
  isOpen: boolean;
  batterySoc: number;
  batteryVoltage: number;
  onAutoStartGenset: () => void;
  onDismiss: () => void;
  soundAlertsEnabled: boolean;
}

export const EmergencyAlertModal: React.FC<EmergencyAlertModalProps> = ({
  isOpen,
  batterySoc,
  batteryVoltage,
  onAutoStartGenset,
  onDismiss,
  soundAlertsEnabled,
}) => {
  useEffect(() => {
    if (isOpen && soundAlertsEnabled) {
      emergencyAudio.startEmergencyLoop();
    } else {
      emergencyAudio.stopEmergencyLoop();
    }
    return () => {
      emergencyAudio.stopEmergencyLoop();
    };
  }, [isOpen, soundAlertsEnabled]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fadeIn">
      <div className="max-w-md w-full bg-slate-900 border-2 border-rose-500 rounded-2xl shadow-2xl p-6 space-y-5 text-center relative overflow-hidden">
        {/* Pulsing red top bar */}
        <div className="absolute top-0 left-0 right-0 h-1.5 bg-rose-500 animate-pulse" />

        {/* Warning Icon */}
        <div className="w-16 h-16 rounded-full bg-rose-500/20 text-rose-500 mx-auto flex items-center justify-center ring-4 ring-rose-500/30 animate-bounce">
          <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
        </div>

        <div>
          <span className="text-[11px] font-mono font-bold uppercase tracking-wider px-2.5 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/40">
            NOTIFIKASI DARURAT LEVEL KRITIS
          </span>
          <h2 className="text-xl font-black text-white mt-2">Daya Baterai Mencapai Batas Kritis!</h2>
          <p className="text-xs text-slate-300 mt-1 leading-relaxed">
            Paket baterai 400V berada pada level rendah (<span className="text-rose-400 font-mono font-bold">{batterySoc.toFixed(1)}%</span> / {batteryVoltage.toFixed(0)}V). Risiko penghentian mendadak inverter traksi jika daya tidak segera disuplai.
          </p>
        </div>

        {/* Tactical Recommendation Box */}
        <div className="p-3 bg-slate-950 rounded-xl border border-rose-900/50 text-left text-xs space-y-1 font-mono">
          <div className="text-slate-400 flex justify-between">
            <span>Tindakan Failsafe Otomatis:</span>
            <span className="text-rose-400 font-bold">Crank Genset M54</span>
          </div>
          <div className="text-slate-400 flex justify-between">
            <span>Target Putaran Pengisian:</span>
            <span className="text-amber-400">2,400 RPM (38 kW)</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          <button
            onClick={onAutoStartGenset}
            className="w-full py-3 px-4 text-xs font-bold text-slate-950 bg-rose-400 hover:bg-rose-300 rounded-xl transition-all shadow-lg shadow-rose-500/20 cursor-pointer"
          >
            Aktifkan Genset Pengisian Darurat Sekarang
          </button>
          <button
            onClick={onDismiss}
            className="w-full py-2 px-4 text-xs font-semibold text-slate-400 hover:text-white transition-colors cursor-pointer"
          >
            Abaikan Peringatan Sementara
          </button>
        </div>
      </div>
    </div>
  );
};
