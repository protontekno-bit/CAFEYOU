import React, { useState } from 'react';

interface QrShareModalProps {
  isOpen: boolean;
  initialIp?: string;
  onClose: () => void;
  onSaveIp?: (ip: string) => void;
}

export const QrShareModal: React.FC<QrShareModalProps> = ({
  isOpen,
  initialIp,
  onClose,
  onSaveIp,
}) => {
  const [activeTab, setActiveTab] = useState<'player' | 'operator'>('player');
  const [copied, setCopied] = useState(false);

  // Deteksi dan Override IP Wi-Fi Lokal (Prioritas: Firebase Cloud cafeSettings -> LocalStorage -> Fallback)
  const isLocalhost =
    typeof window !== 'undefined' &&
    (window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1');

  const [customLocalIp, setCustomLocalIp] = useState(() => {
    if (initialIp && initialIp.trim()) return initialIp.trim();
    try {
      return (
        localStorage.getItem('cafeyou_server_local_ip') ||
        (isLocalhost ? '192.168.1.50:3000' : '')
      );
    } catch {
      return '192.168.1.50:3000';
    }
  });

  // Sinkronkan jika initialIp dari cloud berubah
  React.useEffect(() => {
    if (initialIp && initialIp.trim()) {
      setCustomLocalIp(initialIp.trim());
    }
  }, [initialIp]);

  const [showIpEditor, setShowIpEditor] = useState(false);

  if (!isOpen) return null;

  let effectiveOrigin =
    typeof window !== 'undefined'
      ? window.location.href.split('#')[0]
      : 'http://localhost:3000/';

  if (isLocalhost && customLocalIp.trim()) {
    effectiveOrigin = `http://${customLocalIp.trim().replace(/^https?:\/\//, '').replace(/\/$/, '')}/`;
  }

  const targetUrl = `${effectiveOrigin}#${activeTab}`;
  const qrImageUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(
    targetUrl
  )}&bgcolor=1e293b&color=ffffff&margin=10`;

  const handleSaveIp = (ip: string) => {
    const trimmed = ip.trim();
    setCustomLocalIp(trimmed);
    try {
      localStorage.setItem('cafeyou_server_local_ip', trimmed);
    } catch {}
    if (onSaveIp) {
      onSaveIp(trimmed);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(targetUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fadeIn">
      <div className="bg-slate-800 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl space-y-5 text-center">
        {/* Header */}
        <div className="flex justify-between items-center pb-2 border-b border-slate-700/60 text-left">
          <div className="flex items-center gap-2">
            <span className="text-2xl">📱</span>
            <div>
              <h2 className="text-base font-bold text-white">Scan QR / Buka di HP & TV</h2>
              <p className="text-xs text-slate-400">
                Akses nirkabel tanpa perlu kabel HDMI
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white p-1.5 rounded-lg hover:bg-slate-700 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Pilihan */}
        <div className="flex bg-slate-900/80 p-1 rounded-xl border border-slate-700/60">
          <button
            onClick={() => setActiveTab('player')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'player'
                ? 'bg-emerald-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            📺 Layar Proyektor (#player)
          </button>
          <button
            onClick={() => setActiveTab('operator')}
            className={`flex-1 py-2 rounded-lg text-xs font-bold transition-all ${
              activeTab === 'operator'
                ? 'bg-blue-600 text-white shadow-md'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            💻 Dasbor Kasir (#operator)
          </button>
        </div>

        {/* IP Wi-Fi Server Warning / Configurator */}
        {isLocalhost && (
          <div className="bg-amber-950/40 border border-amber-500/30 rounded-xl p-2.5 text-xs text-left space-y-1.5">
            <div className="flex items-center justify-between gap-2">
              <span className="text-amber-300 font-semibold text-[11px] flex items-center gap-1.5">
                <span>📶</span>
                <span>IP Wi-Fi Server Lokal</span>
              </span>
              <button
                type="button"
                onClick={() => setShowIpEditor(!showIpEditor)}
                className="text-[10px] px-2 py-0.5 bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 rounded border border-amber-500/30 transition-colors"
              >
                {showIpEditor ? 'Tutup' : '⚙️ Ubah IP'}
              </button>
            </div>
            {showIpEditor ? (
              <div className="pt-1.5 border-t border-amber-500/20 flex gap-1.5">
                <input
                  type="text"
                  value={customLocalIp}
                  onChange={(e) => handleSaveIp(e.target.value)}
                  placeholder="192.168.1.50:3000"
                  className="flex-1 px-2.5 py-1 bg-slate-900 border border-amber-500/50 rounded-lg text-amber-200 font-mono text-xs focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowIpEditor(false)}
                  className="px-2.5 py-1 bg-amber-600 text-slate-950 font-bold rounded-lg text-xs"
                >
                  OK
                </button>
              </div>
            ) : (
              <div className="text-[10px] font-mono text-amber-200/80 truncate">
                Host aktif: {effectiveOrigin}
              </div>
            )}
          </div>
        )}

        {/* Display QR Code */}
        <div className="flex flex-col items-center justify-center p-4 bg-slate-900 rounded-2xl border border-slate-700/70 shadow-inner">
          <img
            src={qrImageUrl}
            alt="QR Code"
            className="w-48 h-48 rounded-xl shadow-lg border border-slate-700 bg-slate-800"
          />
          <p className="text-xs text-slate-400 mt-3 max-w-xs">
            Arahkan kamera HP atau Smart TV untuk membuka{' '}
            <strong className="text-white">
              {activeTab === 'player' ? 'Layar Proyektor' : 'Dasbor Kasir'}
            </strong>
          </p>
        </div>

        {/* Direct Link Box */}
        <div className="space-y-2 text-left">
          <div className="text-[11px] font-semibold text-slate-400">Tautan Langsung:</div>
          <div className="flex items-center gap-2 bg-slate-900 p-2 rounded-xl border border-slate-700 font-mono text-xs text-slate-300">
            <input
              type="text"
              readOnly
              value={targetUrl}
              className="bg-transparent flex-1 outline-none truncate text-slate-300"
            />
            <button
              onClick={handleCopy}
              className="px-3 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold rounded-lg shrink-0 transition-colors"
            >
              {copied ? 'Tersalin! ✓' : 'Salin'}
            </button>
          </div>
        </div>

        {/* Close Button */}
        <div className="pt-2">
          <button
            onClick={onClose}
            className="w-full py-2.5 bg-slate-700 hover:bg-slate-600 text-slate-200 text-xs font-semibold rounded-xl transition-colors"
          >
            Tutup
          </button>
        </div>
      </div>
    </div>
  );
};
