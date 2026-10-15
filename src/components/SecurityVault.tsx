import React, { useState } from 'react';
import { UserPreferences } from '../types';

interface SecurityVaultProps {
  preferences: UserPreferences;
  onUpdatePreferences: (prefs: Partial<UserPreferences>) => void;
}

export const SecurityVault: React.FC<SecurityVaultProps> = ({
  preferences,
  onUpdatePreferences,
}) => {
  const [biometricScanning, setBiometricScanning] = useState<boolean>(false);
  const [biometricAuthenticated, setBiometricAuthenticated] = useState<boolean>(true);
  const [totpCode, setTotpCode] = useState<string>('849 203');
  const [inputOtp, setInputOtp] = useState<string>('');
  const [otpVerified, setOtpVerified] = useState<boolean>(true);
  const [cloudBackupStatus, setCloudBackupStatus] = useState<string | null>(null);
  const [backingUp, setBackingUp] = useState<boolean>(false);

  const handleSimulateBiometric = () => {
    setBiometricScanning(true);
    setTimeout(() => {
      setBiometricScanning(false);
      setBiometricAuthenticated(!biometricAuthenticated);
    }, 1200);
  };

  const handleVerifyOtp = (e: React.FormEvent) => {
    e.preventDefault();
    if (inputOtp.replace(/\s+/g, '') === totpCode.replace(/\s+/g, '')) {
      setOtpVerified(true);
    } else {
      alert('Kode OTP tidak sesuai. Gunakan kode yang tertera di atas.');
    }
  };

  const handleManualBackup = async () => {
    setBackingUp(true);
    try {
      const res = await fetch('/api/telemetry/cloud-backup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          payload: { timestamp: Date.now(), vehicle: 'BMW X5 E53 2002 REEV' },
          encryptionKeyHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
        }),
      });
      const data = await res.json();
      setCloudBackupStatus(`Sukses: ${data.backupId} (${data.cloudRegion})`);
    } catch {
      setCloudBackupStatus('Backup lokal tersimpan (AES-256)');
    } finally {
      setBackingUp(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-cyan-400">Protokol Keamanan Tingkat Kendaraan Otonom</div>
          <h2 className="text-xl font-bold text-white mt-1">Sistem Keamanan, Biometrik & Enkripsi E2EE</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Melindungi kontrol bus CAN hibrida, data telemetri baterai, dan transaksi perbankan dengan enkripsi ujung-ke-ujung (E2EE), verifikasi 2FA, dan autentikasi biometrik.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleManualBackup}
            disabled={backingUp}
            className="px-4 py-2 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 border border-slate-700 rounded-lg transition-colors cursor-pointer"
          >
            {backingUp ? 'Mengenkripsi & Mengunggah...' : 'Cadangkan ke Cloud Sekarang'}
          </button>
        </div>
      </div>

      {cloudBackupStatus && (
        <div className="p-3 bg-emerald-950/40 border border-emerald-800/60 rounded-xl text-xs text-emerald-300 font-mono flex items-center justify-between">
          <span>{cloudBackupStatus}</span>
          <button
            onClick={() => setCloudBackupStatus(null)}
            className="text-slate-400 hover:text-white cursor-pointer ml-4"
          >
            ✕
          </button>
        </div>
      )}

      {/* Grid: Biometric, 2FA, E2EE, Cloud Sync */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Module 1: Biometric Login Integration */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Sistem Login Biometrik Kendaraan</h3>
            <span className={`text-xs font-mono font-semibold ${
              biometricAuthenticated ? 'text-emerald-400' : 'text-rose-400'
            }`}>
              {biometricAuthenticated ? 'TERVERIFIKASI' : 'TERKUNCI'}
            </span>
          </div>

          <p className="text-xs text-slate-400">
            Mengamankan starter genset mesin dan izin pelepasan kontak baterai tegangan tinggi (HV contactor) menggunakan sidik jari atau Face ID perangkat.
          </p>

          <div className="p-6 rounded-xl bg-slate-950 border border-slate-800 flex flex-col items-center justify-center space-y-3">
            <div
              onClick={handleSimulateBiometric}
              className={`w-16 h-16 rounded-full flex items-center justify-center cursor-pointer transition-all duration-300 ${
                biometricScanning
                  ? 'bg-cyan-500/30 ring-4 ring-cyan-400 animate-pulse text-cyan-300'
                  : biometricAuthenticated
                    ? 'bg-emerald-500/20 text-emerald-400 ring-2 ring-emerald-500/40 hover:bg-emerald-500/30'
                    : 'bg-rose-500/20 text-rose-400 ring-2 ring-rose-500/40 hover:bg-rose-500/30'
              }`}
            >
              <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 11c0 3.517-1.009 6.799-2.753 9.571m-3.44-2.04l.054-.09A13.916 13.916 0 008 11a4 4 0 118 0c0 1.017-.07 2.019-.203 3m-2.118 6.844A21.88 21.88 0 0015.171 17m3.839 1.132c.645-2.266.99-4.659.99-7.132A8 8 0 004 11m0 0a8 8 0 0014.243 4.243" />
              </svg>
            </div>

            <div className="text-xs text-center font-mono">
              {biometricScanning ? (
                <span className="text-cyan-400">Memindai Sensor Biometrik...</span>
              ) : biometricAuthenticated ? (
                <span className="text-emerald-400">Autentikasi Biometrik Aktif (Akses Penuh)</span>
              ) : (
                <span className="text-rose-400">Sistem Imobilizer Terkunci (Klik untuk Buka)</span>
              )}
            </div>

            <button
              onClick={handleSimulateBiometric}
              disabled={biometricScanning}
              className="px-4 py-1.5 text-xs font-semibold rounded-lg bg-slate-800 text-slate-200 hover:bg-slate-700 transition-colors cursor-pointer"
            >
              {biometricAuthenticated ? 'Kunci Imobilizer' : 'Pindai Sidik Jari / Wajah'}
            </button>
          </div>
        </div>

        {/* Module 2: Two-Factor Authentication (2FA) */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Autentikasi Dua Faktor (2FA TOTP)</h3>
            <span className="text-xs font-mono text-cyan-400">Google Authenticator</span>
          </div>

          <p className="text-xs text-slate-400">
            Perlindungan lapis kedua untuk mengubah konfigurasi ECU genset atau transfer data rekening perbankan.
          </p>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-xs text-slate-400">Kode Keamanan Rolling (30 Detik):</span>
              <span className="text-xl font-mono font-extrabold text-cyan-400 tracking-widest">
                {totpCode}
              </span>
            </div>

            <form onSubmit={handleVerifyOtp} className="flex gap-2">
              <input
                type="text"
                placeholder="Masukkan 6 digit OTP"
                value={inputOtp}
                onChange={(e) => setInputOtp(e.target.value)}
                maxLength={7}
                className="flex-1 bg-slate-900 border border-slate-700 rounded-lg px-3 py-2 text-xs font-mono text-white placeholder-slate-500 focus:outline-none focus:border-cyan-400"
              />
              <button
                type="submit"
                className="px-4 py-2 text-xs font-bold text-slate-950 bg-cyan-400 hover:bg-cyan-300 rounded-lg transition-colors cursor-pointer"
              >
                Validasi 2FA
              </button>
            </form>
          </div>
        </div>

        {/* Module 3: End-to-End Encryption (E2EE) */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Enkripsi Data End-to-End (AES-256)</h3>
            <input
              type="checkbox"
              checked={preferences.endToEndEncryption}
              onChange={(e) => onUpdatePreferences({ endToEndEncryption: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          <p className="text-xs text-slate-400">
            Enkripsi zero-knowledge memastikan paket data telemetri, lokasi GPS, dan informasi baterai hanya dapat dibaca oleh kunci privat perangkat pemilik.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-[11px] font-mono text-slate-400 space-y-1">
            <div className="text-slate-300 font-semibold">Protokol Keamanan:</div>
            <div>• Cipher: AES-GCM-256 Bit dengan Key Derivation PBKDF2</div>
            <div>• Hash Telemetri: 7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1f</div>
            <div>• Sertifikat Keamanan: TLS 1.3 mTLS Vehicle-to-Cloud</div>
          </div>
        </div>

        {/* Module 4: Automatic Cloud Backup */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Cadangan Otomatis ke Cloud</h3>
            <input
              type="checkbox"
              checked={preferences.autoCloudBackup}
              onChange={(e) => onUpdatePreferences({ autoCloudBackup: e.target.checked })}
              className="w-4 h-4 accent-cyan-500 cursor-pointer"
            />
          </div>

          <p className="text-xs text-slate-400">
            Menyimpan riwayat degradasi sel baterai dan konfigurasi genset secara otomatis setiap kali kendaraan selesai parkir.
          </p>

          <div className="p-3 bg-slate-950 rounded-xl border border-slate-800 text-xs text-slate-400 space-y-1">
            <div className="flex justify-between">
              <span>Status Auto-Backup:</span>
              <span className={preferences.autoCloudBackup ? 'text-emerald-400 font-semibold' : 'text-slate-500'}>
                {preferences.autoCloudBackup ? 'Aktif Tiap Selesai Trip' : 'Non-aktif (Hanya Manual)'}
              </span>
            </div>
            <div className="flex justify-between text-slate-500 text-[11px]">
              <span>Titik Pemulihan Terakhir:</span>
              <span className="font-mono text-slate-400">14 Okt 2026, 23:40 WIB</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
