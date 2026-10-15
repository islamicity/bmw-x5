import React, { useState } from 'react';
import { ConnectedDevice } from '../types';

interface MultiDeviceSyncProps {
  onSelectMobilePreview: () => void;
  showMobilePreview: boolean;
}

export const MultiDeviceSync: React.FC<MultiDeviceSyncProps> = ({
  onSelectMobilePreview,
  showMobilePreview,
}) => {
  const [devices, setDevices] = useState<ConnectedDevice[]>([
    {
      id: 'dev-1',
      name: 'BMW E53 Android Auto In-Dash Unit',
      type: 'cockpit_screen',
      os: 'Android Automotive 14',
      ip: '192.168.4.1 (CAN Gateway)',
      lastSeen: 'Aktif Real-time (0s)',
      isCurrent: false,
    },
    {
      id: 'dev-2',
      name: 'iPhone 15 Pro (Pengguna Utama)',
      type: 'mobile_phone',
      os: 'iOS 18.3 Hybrid App',
      ip: '10.8.0.12 (Cellular 5G)',
      lastSeen: 'Aktif Real-time (2s)',
      isCurrent: false,
    },
    {
      id: 'dev-3',
      name: 'MacBook Pro Fleet Workstation',
      type: 'desktop',
      os: 'macOS Sequoia (Chrome)',
      ip: '10.8.0.4 (Wi-Fi 6E)',
      lastSeen: 'Sesi Ini',
      isCurrent: true,
    },
  ]);

  const [syncHeartbeat, setSyncHeartbeat] = useState<boolean>(true);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-cyan-400">Arsitektur Multi-Perangkat Waktu Nyata</div>
          <h2 className="text-xl font-bold text-white mt-1">Sinkronisasi Data Seluler, Cockpit & Desktop</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Protokol sinkronisasi dua arah via WebSocket dan WebRTC menghubungkan instrumen dashboard mobil BMW X5 2002 dengan smartphone dan komputer kerja pengguna secara instan.
          </p>
        </div>

        <button
          onClick={onSelectMobilePreview}
          className={`px-4 py-2 text-xs font-bold rounded-lg border transition-all cursor-pointer whitespace-nowrap ${
            showMobilePreview
              ? 'bg-cyan-500 text-slate-950 border-cyan-400'
              : 'bg-slate-800 text-slate-200 border-slate-700 hover:bg-slate-700'
          }`}
        >
          {showMobilePreview ? 'Tutup Pratinjau HP' : 'Tampilkan Pratinjau HP Seluler'}
        </button>
      </div>

      {/* Connected Devices Grid & QR Pairing */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left: Device List */}
        <div className="lg:col-span-8 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Daftar Perangkat Terhubung (Active Peers)</h3>
            <span className="text-xs font-mono text-emerald-400">Sinkronisasi Waktu Nyata: Aktif (28ms)</span>
          </div>

          <div className="space-y-3">
            {devices.map((dev) => (
              <div
                key={dev.id}
                className={`p-4 rounded-xl border flex items-center justify-between transition-colors ${
                  dev.isCurrent
                    ? 'border-cyan-500/50 bg-cyan-950/20'
                    : 'border-slate-800 bg-slate-950'
                }`}
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-white">{dev.name}</span>
                    {dev.isCurrent && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-cyan-500/20 text-cyan-300">
                        Perangkat Ini
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-400 font-mono">
                    {dev.os} <span className="text-slate-600">·</span> IP: {dev.ip}
                  </div>
                  <div className="text-[11px] text-slate-500 font-mono">
                    Status Sinkronisasi: {dev.lastSeen}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono text-emerald-400 font-semibold">Tersambung</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Quick QR Pairing Card */}
        <div className="lg:col-span-4 p-6 rounded-2xl bg-slate-900/50 border border-slate-800 flex flex-col justify-between space-y-4 text-center">
          <div>
            <h3 className="text-base font-bold text-white">Hubungkan Smartphone Baru</h3>
            <p className="text-xs text-slate-400 mt-1">
              Pindai kode QR berikut menggunakan kamera HP untuk memasang aplikasi PWA Companion tanpa perlu instalasi rumit.
            </p>
          </div>

          {/* Clean stylized SVG QR Code simulation */}
          <div className="mx-auto p-4 bg-white rounded-xl shadow-lg w-44 h-44 flex items-center justify-center">
            <svg viewBox="0 0 100 100" className="w-full h-full text-slate-900">
              <rect x="0" y="0" width="30" height="30" fill="currentColor" />
              <rect x="5" y="5" width="20" height="20" fill="white" />
              <rect x="10" y="10" width="10" height="10" fill="currentColor" />

              <rect x="70" y="0" width="30" height="30" fill="currentColor" />
              <rect x="75" y="5" width="20" height="20" fill="white" />
              <rect x="80" y="10" width="10" height="10" fill="currentColor" />

              <rect x="0" y="70" width="30" height="30" fill="currentColor" />
              <rect x="5" y="75" width="20" height="20" fill="white" />
              <rect x="10" y="80" width="10" height="10" fill="currentColor" />

              <rect x="40" y="10" width="10" height="20" fill="currentColor" />
              <rect x="55" y="5" width="10" height="10" fill="currentColor" />
              <rect x="40" y="40" width="20" height="20" fill="currentColor" />
              <rect x="10" y="45" width="20" height="10" fill="currentColor" />
              <rect x="70" y="45" width="25" height="15" fill="currentColor" />
              <rect x="40" y="70" width="15" height="25" fill="currentColor" />
              <rect x="65" y="70" width="25" height="10" fill="currentColor" />
              <rect x="80" y="85" width="15" height="15" fill="currentColor" />
            </svg>
          </div>

          <div className="text-[11px] font-mono text-slate-500">
            ID Sanding Cepat: <span className="text-cyan-400 font-bold">BMW-E53-9941</span>
          </div>
        </div>
      </div>
    </div>
  );
};
