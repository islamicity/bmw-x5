import React, { useState } from 'react';
import { BankAccount, RecurringBill } from '../types';

interface BankingAndExpensesProps {
  accounts: BankAccount[];
  bills: RecurringBill[];
  onPayBill: (billId: string) => void;
  onOpenExport: () => void;
}

export const BankingAndExpenses: React.FC<BankingAndExpensesProps> = ({
  accounts,
  bills,
  onPayBill,
  onOpenExport,
}) => {
  const [syncingBankId, setSyncingBankId] = useState<string | null>(null);

  const handleSyncBank = (id: string) => {
    setSyncingBankId(id);
    setTimeout(() => {
      setSyncingBankId(null);
    }, 1200);
  };

  // Monthly expense comparison figures (IDR)
  const stockV8Cost = 5200000;
  const currentHybridCost = 1630000;
  const netSavings = stockV8Cost - currentHybridCost;
  const savingsPercent = Math.round((netSavings / stockV8Cost) * 100);

  return (
    <div className="space-y-6">
      {/* Overview & Savings Card */}
      <div className="p-6 rounded-2xl bg-slate-900/60 border border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="text-xs font-semibold text-emerald-400">Integrasi Open Banking & Manajemen Pengeluaran EV</div>
          <h2 className="text-xl font-bold text-white mt-1">Laporan Finansial & Sinkronisasi Perbankan</h2>
          <p className="text-sm text-slate-400 mt-1 max-w-2xl">
            Menghubungkan rekening bank dan kartu fleet secara real-time untuk memantau pengeluaran SPKLU, bahan bakar genset, dan tagihan pemeliharaan berkala BMW X5 E53.
          </p>
        </div>

        <button
          onClick={onOpenExport}
          className="px-4 py-2 text-xs font-semibold text-white bg-cyan-600 hover:bg-cyan-500 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
        >
          Ekspor Format Excel / PDF
        </button>
      </div>

      {/* Monthly Expense Comparison Chart & Numbers */}
      <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-6">
        <h3 className="text-base font-bold text-white">Komparasi Pengeluaran Bulanan: Bensin V8 Asli vs Sistem Hybrid E53</h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400">Biaya BBM BMW X5 Asli 2002 (V8/I6)</span>
            <div className="text-2xl font-extrabold font-mono text-rose-400 mt-1">
              Rp {stockV8Cost.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-500">Estimasi konsumsi 1:6 km/L Pertamax</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
            <span className="text-xs text-slate-400">Total Biaya Saat Ini (Hybrid Genset)</span>
            <div className="text-2xl font-extrabold font-mono text-cyan-400 mt-1">
              Rp {currentHybridCost.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-slate-500">Bensin Genset Rp 950rb + Listrik Rp 680rb</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-emerald-800/40 bg-emerald-950/20">
            <span className="text-xs text-emerald-300 font-semibold">Penghematan Bersih Bulanan</span>
            <div className="text-2xl font-extrabold font-mono text-emerald-400 mt-1">
              Rp {netSavings.toLocaleString('id-ID')}
            </div>
            <span className="text-[11px] text-emerald-400 font-semibold">Hemat {savingsPercent}% Anggaran Bulanan!</span>
          </div>
        </div>

        {/* Visual Bar Comparison */}
        <div className="space-y-3 pt-2">
          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Bensin Standar 2002 (Bore & Stroke M62/M54)</span>
              <span className="font-mono text-rose-400">Rp 5.200.000</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-rose-500 rounded-full w-full" />
            </div>
          </div>

          <div className="space-y-1">
            <div className="flex justify-between text-xs text-slate-400">
              <span>Konversi Hybrid REEV (Listrik + Genset Efisien)</span>
              <span className="font-mono text-cyan-400">Rp 1.630.000 (-68.6%)</span>
            </div>
            <div className="w-full bg-slate-800 h-3 rounded-full overflow-hidden">
              <div className="h-full bg-cyan-400 rounded-full w-[31%]" />
            </div>
          </div>
        </div>
      </div>

      {/* Linked Banking Accounts & Due Bills Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Linked Bank Accounts */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Rekening Bank Terhubung (Open Banking API)</h3>
            <span className="text-xs font-mono text-emerald-400">E2EE Terverifikasi</span>
          </div>

          <div className="space-y-3">
            {accounts.map((acc) => (
              <div
                key={acc.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
              >
                <div>
                  <div className="text-sm font-bold text-white">{acc.bankName}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    {acc.accountNumber} <span className="text-slate-600">·</span> {acc.type}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1 font-mono">
                    Saldo Tersedia: Rp {acc.balanceIdr.toLocaleString('id-ID')}
                  </div>
                </div>

                <button
                  onClick={() => handleSyncBank(acc.id)}
                  disabled={syncingBankId === acc.id}
                  className="px-3 py-1.5 text-xs font-medium text-cyan-400 bg-cyan-950/40 border border-cyan-800/50 hover:bg-cyan-900/50 rounded-lg transition-colors cursor-pointer"
                >
                  {syncingBankId === acc.id ? 'Menyinkronkan...' : 'Sinkronkan'}
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Upcoming Bills & Due Reminders */}
        <div className="p-6 rounded-2xl bg-slate-900/50 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-base font-bold text-white">Pengingat Tagihan & Jadwal Jatuh Tempo</h3>
            <span className="text-xs font-mono text-amber-400">{bills.filter(b => b.status === 'pending').length} Menunggu</span>
          </div>

          <div className="space-y-3">
            {bills.map((bill) => (
              <div
                key={bill.id}
                className="p-4 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between gap-3"
              >
                <div>
                  <div className="text-sm font-semibold text-white">{bill.title}</div>
                  <div className="text-xs text-slate-400 font-mono mt-0.5">
                    Jatuh Tempo: {bill.dueDate} ({bill.daysLeft} hari lagi)
                  </div>
                  <div className="text-xs font-mono text-emerald-400 font-bold mt-1">
                    Rp {bill.amountIdr.toLocaleString('id-ID')}
                  </div>
                </div>

                {bill.status === 'pending' ? (
                  <button
                    onClick={() => onPayBill(bill.id)}
                    className="px-3 py-1.5 text-xs font-bold text-slate-950 bg-emerald-400 hover:bg-emerald-300 rounded-lg transition-colors cursor-pointer whitespace-nowrap"
                  >
                    Bayar Otomatis
                  </button>
                ) : (
                  <span className="px-2.5 py-1 text-xs font-mono font-semibold rounded bg-emerald-950 text-emerald-400 border border-emerald-800/40 whitespace-nowrap">
                    Lunas
                  </span>
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
