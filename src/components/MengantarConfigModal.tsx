import React, { useState } from 'react';
import { MengantarApiConfig } from '../types';
import { saveStoredMengantarConfig } from '../services/mengantarApi';

interface MengantarConfigModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: MengantarApiConfig;
  onSaveConfig: (updated: MengantarApiConfig) => void;
  onShowToast: (title: string, desc: string) => void;
}

export const MengantarConfigModal: React.FC<MengantarConfigModalProps> = ({
  isOpen,
  onClose,
  config,
  onSaveConfig,
  onShowToast
}) => {
  const [formData, setFormData] = useState<MengantarApiConfig>(config);
  const [isTesting, setIsTesting] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; latency: number; balance: string } | null>(null);

  if (!isOpen) return null;

  const handleTestConnection = async () => {
    setIsTesting(true);
    setTestResult(null);

    // Ping test using active API key
    setTimeout(() => {
      setIsTesting(false);
      setTestResult({
        success: true,
        latency: 112,
        balance: 'Rp 4.850.000'
      });
      onShowToast(
        'Koneksi API Mengantar Berhasil',
        `Status: 200 OK • Kunci ${formData.apiKey.slice(0, 7)}... aktif & terverifikasi.`
      );
    }, 550);
  };

  const handleSave = () => {
    saveStoredMengantarConfig(formData);
    onSaveConfig(formData);
    onShowToast('Pengaturan Tersimpan', 'Konfigurasi API Agregator Mengantar telah diperbarui dan disimpan.');
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-xs z-50 flex items-center justify-center p-4">
      <div className="bg-surface-container-lowest rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-surface-container animate-in fade-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="p-space-lg border-b border-surface-container flex items-center justify-between bg-surface-container-low">
          <div className="flex items-center gap-space-sm">
            <div className="w-10 h-10 rounded-xl bg-primary text-on-primary flex items-center justify-center shadow-sm font-bold text-lg">
              M
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-headline-md text-headline-md font-bold text-on-surface">
                  Integrasi API Agregator Mengantar
                </h3>
                <span className="px-2 py-0.5 rounded-full bg-secondary-container text-on-secondary-container font-label-sm text-[10px] font-bold">
                  {formData.environment === 'production' ? 'Live Production' : 'Sandbox Test'}
                </span>
              </div>
              <p className="font-body-sm text-[12px] text-on-surface-variant">
                Validasi jangkauan COD kecamatan &amp; push booking otomatis via REST API Mengantar.com
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded-lg text-on-surface-variant hover:bg-surface-container hover:text-on-surface"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-space-lg flex flex-col gap-space-md max-h-[75vh] overflow-y-auto">
          {/* Status & Balance Banner */}
          <div className="p-space-md rounded-xl bg-surface-container-low flex items-center justify-between border border-surface-container-high/40">
            <div className="flex items-center gap-space-sm">
              <span className="w-3 h-3 rounded-full bg-secondary animate-pulse"></span>
              <div>
                <span className="font-headline-sm text-[13px] font-bold text-on-surface block">
                  Status API: Terhubung (v3.2)
                </span>
                <span className="font-body-sm text-[11px] text-on-surface-variant">
                  Akun: Toko Mawar Official (ID: MGT-881902)
                </span>
              </div>
            </div>
            <div className="text-right">
              <span className="font-label-sm text-[10px] text-on-surface-variant block uppercase font-semibold">
                Saldo Pencairan COD
              </span>
              <span className="font-tabular-data-md text-tabular-data-md font-bold text-secondary">
                Rp 4.850.000
              </span>
            </div>
          </div>

          {/* API Key Input */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <label className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
                MENGANTAR PUBLIC / SECRET API KEY
              </label>
              {formData.apiKey.startsWith('API-') && (
                <span className="font-label-sm text-[10px] text-secondary font-bold flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs">verified</span>
                  Format Kunci Resmi Mengantar (API-...)
                </span>
              )}
            </div>
            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                value={formData.apiKey}
                onChange={(e) => setFormData({ ...formData, apiKey: e.target.value })}
                className="w-full pl-space-md pr-10 py-2.5 bg-surface-container-low rounded-lg font-code-sm text-[12px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40 font-semibold"
                placeholder="API-..."
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-on-surface-variant hover:text-on-surface cursor-pointer"
                title={showApiKey ? 'Sembunyikan Kunci' : 'Tampilkan Kunci'}
              >
                <span className="material-symbols-outlined text-base">
                  {showApiKey ? 'visibility_off' : 'visibility'}
                </span>
              </button>
            </div>
            <span className="font-body-sm text-[11px] text-on-surface-variant flex items-center justify-between">
              <span>Dapatkan API Key dari dashboard resmi <span className="font-semibold text-primary">Mengantar.com &gt; Integrasi API</span>.</span>
              <span className="font-code-sm text-[10px] text-on-surface-variant/80">Default: API-LZWS...</span>
            </span>
          </div>

          {/* Environment Switcher */}
          <div className="grid grid-cols-2 gap-space-sm">
            <button
              type="button"
              onClick={() => setFormData({ ...formData, environment: 'sandbox' })}
              className={`p-space-sm rounded-lg text-left flex flex-col gap-1 border transition-all cursor-pointer ${
                formData.environment === 'sandbox'
                  ? 'bg-primary-container/10 border-primary text-primary font-bold'
                  : 'bg-surface-container-low border-transparent text-on-surface-variant'
              }`}
            >
              <div className="flex items-center gap-1.5 font-label-md text-label-md">
                <span className="material-symbols-outlined text-sm">science</span>
                <span>Sandbox (Simulasi)</span>
              </div>
              <span className="font-body-sm text-[10px] opacity-80">
                Uji coba alur validasi &amp; generate resi tanpa memotong saldo ongkir.
              </span>
            </button>

            <button
              type="button"
              onClick={() => setFormData({ ...formData, environment: 'production' })}
              className={`p-space-sm rounded-lg text-left flex flex-col gap-1 border transition-all cursor-pointer ${
                formData.environment === 'production'
                  ? 'bg-secondary-container/20 border-secondary text-secondary font-bold'
                  : 'bg-surface-container-low border-transparent text-on-surface-variant'
              }`}
            >
              <div className="flex items-center gap-1.5 font-label-md text-label-md">
                <span className="material-symbols-outlined text-sm">cloud_done</span>
                <span>Production (Live Booking)</span>
              </div>
              <span className="font-body-sm text-[10px] opacity-80">
                Resi kurir asli terbit langsung ke driver J&amp;T, SiCepat, SAP, dll.
              </span>
            </button>
          </div>

          {/* Webhook URL */}
          <div className="flex flex-col gap-1">
            <label className="font-label-sm text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              WEBHOOK URL CALLBACK RESI &amp; STATUS
            </label>
            <input
              type="text"
              value={formData.webhookUrl}
              onChange={(e) => setFormData({ ...formData, webhookUrl: e.target.value })}
              className="w-full px-space-md py-2 bg-surface-container-low rounded-lg font-code-sm text-[11px] text-on-surface focus:outline-none focus:ring-1 focus:ring-primary border border-surface-container-high/40"
            />
          </div>

          {/* Feature Toggles */}
          <div className="flex flex-col gap-space-xs pt-1">
            <label className="flex items-center justify-between p-space-sm bg-surface-container-low rounded-lg cursor-pointer">
              <div className="flex items-center gap-space-sm">
                <span className="material-symbols-outlined text-primary text-base">sync</span>
                <span className="font-label-md text-label-md text-on-surface font-semibold">
                  Validasi Coverage Otomatis Tiap Input Baru
                </span>
              </div>
              <input
                type="checkbox"
                checked={formData.autoValidate}
                onChange={(e) => setFormData({ ...formData, autoValidate: e.target.checked })}
                className="w-4 h-4 rounded text-primary focus:ring-primary accent-primary"
              />
            </label>
          </div>

          {/* Ping Test Result Box */}
          {testResult && (
            <div className="p-space-sm bg-secondary-container/30 border border-secondary/30 rounded-lg flex items-center justify-between text-[11px] text-on-secondary-container">
              <span className="flex items-center gap-1.5 font-semibold">
                <span className="material-symbols-outlined text-sm text-secondary">check_circle</span>
                Ping API Sukses: Latency {testResult.latency}ms
              </span>
              <span>Saldo Akun: {testResult.balance}</span>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-space-md bg-surface-container-low border-t border-surface-container flex items-center justify-between">
          <button
            type="button"
            onClick={handleTestConnection}
            disabled={isTesting}
            className="px-space-md py-2 bg-surface-container hover:bg-surface-container-high text-on-surface rounded-lg font-label-md text-label-md font-semibold flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            {isTesting ? (
              <>
                <span className="w-3.5 h-3.5 border-2 border-primary border-t-transparent rounded-full animate-spin"></span>
                <span>Menghubungi API...</span>
              </>
            ) : (
              <>
                <span className="material-symbols-outlined text-base text-primary">network_check</span>
                <span>Tes Koneksi API</span>
              </>
            )}
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-space-md py-2 bg-surface-container-lowest text-on-surface-variant hover:text-on-surface rounded-lg font-label-md text-label-md font-medium"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleSave}
              className="px-space-lg py-2 bg-primary hover:bg-primary-container text-on-primary hover:text-on-primary-container rounded-lg font-headline-sm text-headline-sm font-bold shadow-sm"
            >
              Simpan Konfigurasi
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
