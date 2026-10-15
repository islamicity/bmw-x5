import React from 'react';
import { UserPreferences } from '../types';

interface AppearanceSettingsProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const AppearanceSettings: React.FC<AppearanceSettingsProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  return (
    <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-6">
      <div>
        <div className="text-xs font-semibold text-cyan-400">Preferensi Pengguna & Personalisasi UI</div>
        <h3 className="text-base font-bold text-white mt-1">Kustomisasi Antarmuka & Mode Gelap</h3>
        <p className="text-xs text-slate-400 mt-1 max-w-xl">
          Atur kenyamanan visual kokpit, palet warna pencahayaan instrumen BMW E53, serta satuan pengukuran yang Anda inginkan.
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {/* Dark / Light Mode */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-white block">Tema Tampilan (Mode Gelap)</label>
          <div className="flex gap-2">
            <button
              onClick={() => onUpdatePreferences({ theme: 'dark' })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border cursor-pointer ${
                preferences.theme === 'dark'
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Mode Gelap (Malam)
            </button>
            <button
              onClick={() => onUpdatePreferences({ theme: 'light' })}
              className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-medium border cursor-pointer ${
                preferences.theme === 'light'
                  ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                  : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
              }`}
            >
              Mode Terang (Siang)
            </button>
          </div>
        </div>

        {/* Accent Colors */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-white block">Warna Aksen Instrumen E53</label>
          <div className="flex gap-2">
            {[
              { id: 'blue', label: 'BMW M Blue' },
              { id: 'emerald', label: 'Night Emerald' },
              { id: 'amber', label: 'Classic Amber' },
            ].map((c) => (
              <button
                key={c.id}
                onClick={() => onUpdatePreferences({ accentColor: c.id as any })}
                className={`flex-1 py-1.5 px-2 rounded-lg text-[11px] font-medium border cursor-pointer ${
                  preferences.accentColor === c.id
                    ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300 font-bold'
                    : 'border-slate-800 bg-slate-900 text-slate-400 hover:text-white'
                }`}
              >
                {c.label}
              </button>
            ))}
          </div>
        </div>

        {/* Audio Alerts */}
        <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
          <label className="text-xs font-semibold text-white block">Peringatan Suara Kritis (Web Audio)</label>
          <div className="flex items-center justify-between pt-1">
            <span className="text-xs text-slate-400">Alarm Audio Level Baterai</span>
            <input
              type="checkbox"
              checked={preferences.soundAlertsEnabled}
              onChange={(e) => onUpdatePreferences({ soundAlertsEnabled: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>
        </div>
      </div>
    </div>
  );
};
