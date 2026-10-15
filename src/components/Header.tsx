import React from 'react';
import { PowertrainMode } from '../types';

interface HeaderProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  powertrainMode: PowertrainMode;
  gensetActive: boolean;
  onToggleGenset: () => void;
  batterySoc: number;
  onOpenExport: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  powertrainMode,
  gensetActive,
  onToggleGenset,
  batterySoc,
  onOpenExport,
}) => {
  const navItems = [
    { id: 'telemetry', label: 'Telemetri IoT' },
    { id: 'powertrain', label: 'Aliran Daya' },
    { id: 'diagnostics', label: 'Diagnosa Hardware' },
    { id: 'eco', label: 'Mode Hemat' },
    { id: 'emissions', label: 'Analisis Emisi' },
    { id: 'finance', label: 'Keuangan & Bank' },
    { id: 'security', label: 'Keamanan' },
  ];

  return (
    <header className="border-b border-slate-800 bg-slate-950/80 backdrop-blur-md sticky top-0 z-40 px-6 py-3.5 transition-colors duration-200">
      <div className="max-w-7xl mx-auto flex items-center justify-between gap-8">
        {/* Zone 1: Single text element Brand wordmark */}
        <a
          href="#dashboard"
          onClick={(e) => {
            e.preventDefault();
            setActiveTab('telemetry');
          }}
          className="text-lg font-bold tracking-tight text-white hover:text-cyan-400 transition-colors whitespace-nowrap shrink-0 flex items-center gap-2"
        >
          <span className="font-extrabold tracking-wider text-cyan-400">BMW X5</span>
          <span className="text-slate-300 font-medium">E53 Hybrid OS</span>
        </a>

        {/* Zone 2: 4-5 concise single-line nav links */}
        <nav className="hidden lg:flex items-center gap-6 text-sm font-medium text-slate-400">
          {navItems.map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveTab(item.id)}
              className={`hover:text-white transition-colors whitespace-nowrap shrink-0 pb-1 cursor-pointer ${
                activeTab === item.id
                  ? 'text-cyan-400 border-b-2 border-cyan-400 font-semibold'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Zone 3: 1 primary action */}
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={onToggleGenset}
            className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-all cursor-pointer whitespace-nowrap shrink-0 border ${
              gensetActive
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-cyan-500 text-slate-950 border-cyan-400 hover:bg-cyan-400 font-bold'
            }`}
          >
            {gensetActive ? 'Matikan Genset Mesin' : 'Nyalakan Genset (2,200 RPM)'}
          </button>

          <button
            onClick={onOpenExport}
            className="px-3.5 py-1.5 text-xs font-medium text-slate-200 bg-slate-900 border border-slate-700 rounded-lg hover:bg-slate-800 transition-colors whitespace-nowrap shrink-0 cursor-pointer hidden sm:block"
          >
            Ekspor Laporan
          </button>
        </div>
      </div>
    </header>
  );
};
