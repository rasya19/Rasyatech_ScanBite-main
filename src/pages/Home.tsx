import React, { useState, useEffect } from 'react';
import { 
  QrCode, 
  Coffee, 
  User, 
  ArrowRight, 
  MapPin, 
  AlertTriangle, 
  HelpCircle,
  Sparkles,
  ChevronRight,
  Compass
} from 'lucide-react';
import { supabase } from '../supabaseClient';

interface HomeProps {
  onNavigate: (page: string) => void;
}

export default function Home({ onNavigate }: HomeProps) {
  const [tableNumber, setTableNumber] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [error, setError] = useState('');
  const [logoSrc, setLogoSrc] = useState<string | null>(() => localStorage.getItem('scanbite_merchant_logo'));
  const [cafeNameText, setCafeNameText] = useState(() => localStorage.getItem('scanbite_cafe_name') || 'ScanBite');

  const [isValidatingTable, setIsValidatingTable] = useState(false);
  const [tableValidationError, setTableValidationError] = useState<string | null>(null);

  // Real-time validation function
  const validateTableRealTime = async (tableNumToCheck: string) => {
    if (!supabase) return true; // Fail safe if no supabase connection
    
    setIsValidatingTable(true);
    setTableValidationError(null);
    try {
      const activeTenant = localStorage.getItem('current_tenant') || 'scanbite_live';
      
      const { data: dbTables, error: queryErr } = await supabase
        .from('sb_tables')
        .select('*');
        
      if (queryErr) {
        console.warn('Real-time table lookup error:', queryErr.message);
        return true; // Fail-safe: allow proceeding if DB query is blocked
      }
      
      if (dbTables && dbTables.length > 0) {
        const formatNum = tableNumToCheck.padStart(2, '0');
        const numOnly = parseInt(tableNumToCheck, 10).toString();
        
        const isFound = dbTables.some((tbl: any) => {
          const colsToCheck = ['table_number', 'nomor_meja', 'nomor_meja_id', 'id'];
          return colsToCheck.some(col => {
            const val = tbl[col];
            if (val === undefined || val === null) return false;
            
            const strVal = val.toString().trim().replace('Meja ', '');
            return (
              strVal === tableNumToCheck ||
              strVal === formatNum ||
              strVal === numOnly ||
              tbl[col].toString() === `Meja ${tableNumToCheck}` ||
              tbl[col].toString() === `Meja ${formatNum}`
            );
          });
        });
        
        if (!isFound) {
          setTableValidationError('Meja tidak terdaftar. Sistem mendeteksi kode QR atau nomor meja ini belum didaftarkan di database restoran. Silakan tanyakan ke pelayan atau kasir kami.');
          return false;
        }
      }
      return true;
    } catch (err) {
      console.warn('Failed real-time table check:', err);
      return true; // Fail-safe
    } finally {
      setIsValidatingTable(false);
    }
  };

  // Read table parameter on mount and when URL search query changes
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const table = params.get('table');
    const tenant = params.get('tenant');
    if (tenant) {
      localStorage.setItem('current_tenant', tenant);
    }
    
    let activeTable: string | null = null;
    if (table) {
      activeTable = table;
      setTableNumber(table);
      localStorage.setItem('scanbite_table', table);
    } else {
      // Fallback: check if table is already in localStorage from previous scans
      const savedTable = localStorage.getItem('scanbite_table');
      if (savedTable) {
        activeTable = savedTable;
        setTableNumber(savedTable);
      }
    }

    if (activeTable) {
      validateTableRealTime(activeTable);
    }
    
    // Check if customer name already exists to prefill
    const savedName = localStorage.getItem('scanbite_customer_name');
    if (savedName) {
      setCustomerName(savedName);
    }

    // Fetch dynamic store logo and cafe name from Supabase to match the logo settings
    const fetchBrandingSettings = async () => {
      if (!supabase) return;
      try {
        const activeTenant = localStorage.getItem('current_tenant') || 'scanbite_live';
        const { data, error: fetchErr } = await supabase
          .from('sb_settings')
          .select('*')
          .eq('kode_tenant', activeTenant)
          .maybeSingle();

        if (data) {
          if (data.cafe_name) {
            localStorage.setItem('scanbite_cafe_name', data.cafe_name);
            setCafeNameText(data.cafe_name);
          }
          if (data.logo_url) {
            localStorage.setItem('scanbite_merchant_logo', data.logo_url);
            setLogoSrc(data.logo_url);
          }
        }
      } catch (err) {
        console.warn('Failed to dynamically fetch branding settings in Home view:', err);
      }
    };

    fetchBrandingSettings();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customerName.trim()) {
      setError('Masukkan nama lengkap Anda agar kami bisa menyapa Anda!');
      return;
    }
    if (customerName.trim().length < 2) {
      setError('Nama terlalu pendek, silakan masukkan minimal 2 karakter.');
      return;
    }

    if (tableNumber) {
      const isValid = await validateTableRealTime(tableNumber);
      if (!isValid) {
        return;
      }
    }

    // Save state to localStorage
    localStorage.setItem('scanbite_customer_name', customerName.trim());
    if (tableNumber) {
      localStorage.setItem('scanbite_table', tableNumber);
    }
    
    // Clear error
    setError('');
    
    // Navigate to Menu
    onNavigate('menu');
  };

  // Helper to simulate scanning a table QR code in sandbox
  const handleSimulateQR = (num: string) => {
    // Reload page with root path and tenant/table parameters to execute full verification flow
    const newUrl = `${window.location.origin}/?tenant=scanbite_live&table=${num}`;
    window.location.href = newUrl;
  };

  return (
    <div className="min-h-screen bg-[#FDFBF7] text-[#2C2520] flex flex-col justify-between tracking-normal font-sans antialiased relative overflow-hidden selection:bg-[#E6D5C3]">
      
      {/* Background Decorative Rings */}
      <div className="absolute top-[-20%] left-[-20%] w-[90%] aspect-square rounded-full bg-[#F4EDE2] opacity-50 blur-3xl pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[60%] aspect-square rounded-full bg-[#EFE6D5] opacity-60 blur-2xl pointer-events-none" />

      {/* Main Container */}
      <main className="flex-1 w-full max-w-md mx-auto px-6 pt-10 pb-8 flex flex-col justify-center z-10">
        
        {/* Header Branding */}
        <div id="brand-header" className="text-center mb-8">
          {logoSrc ? (
            <div className="inline-flex items-center justify-center p-0.5 bg-gradient-to-tr from-[#8C6239] to-amber-500 rounded-full mb-4 shadow-md hover:scale-105 transition-transform">
              <img 
                src={logoSrc} 
                alt={cafeNameText} 
                className="w-20 h-20 rounded-full object-cover border-2 border-white"
                referrerPolicy="no-referrer"
              />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center p-3 bg-[#EFE6D5] rounded-2xl mb-4 text-[#8C6239] shadow-inner border border-white/40">
              <Coffee className="w-8 h-8 stroke-[1.5]" />
            </div>
          )}
          <h1 className="text-3xl font-extrabold tracking-tight text-[#1C1612]">
            {cafeNameText}
          </h1>
          <p className="text-sm text-[#786455] font-medium mt-1">
            Pesan Cepat Mandiri Dari Meja Anda
          </p>
        </div>

        {/* Dynamic Card Content */}
        <div id="home-card" className="bg-white/80 backdrop-blur-md rounded-3xl p-6 shadow-xl shadow-[#2C2520]/5 border border-white/60">
          
          {tableNumber ? (
            /* CASE 1: Table Detected - Show Check-in Form */
            <div>
              <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[#F7F2EA]">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-[#8C6239]/10 text-[#8C6239]">
                  <MapPin className="w-5 h-5" />
                </div>
                <div>
                  <p className="text-xs text-[#9E8775] font-semibold uppercase tracking-wider">Lokasi Meja Anda</p>
                  <p className="text-lg font-bold text-[#2C2520]">Meja Nomor {tableNumber}</p>
                </div>
              </div>

              {tableValidationError ? (
                <div className="space-y-4 animate-fadeIn text-center py-2">
                  <div className="w-12 h-12 bg-red-50 text-red-650 rounded-2xl flex items-center justify-center mx-auto mb-2 border border-red-100 shadow-inner">
                    <AlertTriangle className="w-6 h-6 stroke-[2] text-red-650 animate-pulse" />
                  </div>
                  <h3 className="text-sm font-extrabold text-red-650 uppercase tracking-widest leading-none">Meja Tidak Terdaftar!</h3>
                  <p className="text-xs text-[#5B4E44] leading-relaxed font-bold">
                    {tableValidationError}
                  </p>
                  
                  <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-4 text-left space-y-2">
                    <p className="text-[10px] uppercase font-black text-[#8C6239] tracking-wider mb-1">💡 Solusi Cepat:</p>
                    <ul className="text-[11px] text-gray-500 font-semibold space-y-1.5 list-none pl-0">
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#8C6239] font-bold">✓</span> Scan kembali QR Code resmi yang tertempel pada meja fisik Anda.
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#8C6239] font-bold">✓</span> Minta kasir/pelayan mendaftarkan Meja {tableNumber} terlebih dahulu di menu "Tambahkan Meja" pada panel Admin.
                      </li>
                      <li className="flex items-start gap-1.5">
                        <span className="text-[#8C6239] font-bold">✓</span> Gunakan simulator meja sandbox di bawah untuk me-load meja pengujian yang sah.
                      </li>
                    </ul>
                  </div>
                </div>
              ) : (
                <>
                  <h2 className="text-xl font-bold text-[#1C1612] mb-2">Selamat Datang!</h2>
                  <p className="text-sm text-[#786455] mb-6 leading-relaxed">
                    Silakan masukkan nama lengkap Anda untuk memulai pesanan bersama anggota meja lainnya.
                  </p>

                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <label htmlFor="customer-name" className="block text-xs font-bold text-[#5B4E44] uppercase tracking-wider mb-2">
                        Nama Lengkap Anda
                      </label>
                      <div className="relative">
                        <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-[#9E8775] pointer-events-none">
                          <User className="w-5 h-5 stroke-[1.8]" />
                        </span>
                        <input
                          id="customer-name"
                          type="text"
                          className="w-full pl-11 pr-4 py-3.5 bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl text-base font-medium placeholder-[#B2A494] text-[#1C1612] focus:outline-none focus:ring-2 focus:ring-[#8C6239] focus:bg-white transition-all shadow-inner"
                          placeholder="Contoh: Budi Santoso"
                          value={customerName}
                          onChange={(e) => {
                            setCustomerName(e.target.value);
                            if (error) setError('');
                          }}
                          autoComplete="off"
                        />
                      </div>
                    </div>

                    {error && (
                      <div className="flex items-start gap-2 text-xs font-medium text-red-600 bg-red-50 p-3 rounded-xl border border-red-100 animate-fadeIn">
                        <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                        <span>{error}</span>
                      </div>
                    )}

                    <button
                      id="btn-lihat-menu"
                      type="submit"
                      className="w-full bg-[#8C6239] hover:bg-[#6D4926] text-white py-4 px-6 rounded-2xl font-bold text-base flex items-center justify-center gap-2 group transition-all duration-300 shadow-lg shadow-[#8C6239]/20 hover:scale-[1.01]"
                    >
                      <span>Lihat Menu & Pesan</span>
                      <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </form>
                </>
              )}
            </div>
          ) : (
            /* CASE 2: No Table Detected - Warn Customer */
            <div className="text-center py-4 animate-fadeIn">
              <div className="w-14 h-14 bg-[#FCE8E6] text-red-600 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-red-100 shadow-inner">
                <QrCode className="w-7 h-7 stroke-[1.5]" />
              </div>
              
              <h2 className="text-xl font-bold text-[#1C1612] mb-2">QR Code Meja Diperlukan</h2>
              <p className="text-sm text-[#786455] leading-relaxed mb-6">
                Aplikasi ini berjalan secara mandiri dari meja kafe kami. Silakan scan QR Code yang tertera di meja fisik Anda untuk langsung membuka pesanan otomatis.
              </p>

              <div className="bg-[#FAF8F5] border border-[#EBE3D5] rounded-2xl p-4 text-left mb-6">
                <div className="flex items-center gap-2 mb-2">
                  <span className="w-2 h-2 rounded-full bg-[#8C6239]" />
                  <p className="text-xs font-bold text-[#5B4E44] uppercase tracking-wider">Mengapa Scan QR?</p>
                </div>
                <ul className="text-xs text-[#786455] space-y-1.5 list-none pl-1">
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#8C6239] font-bold">✓</span> Tanpa mengantre panjang di meja kasir kencang
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#8C6239] font-bold">✓</span> Split Bill Real-time (hitung per orang di meja)
                  </li>
                  <li className="flex items-center gap-1.5">
                    <span className="text-[#8C6239] font-bold">✓</span> Request Lagu ke Jukebox kafe setelah checkout
                  </li>
                </ul>
              </div>
            </div>
          )}

        {process.env.NODE_ENV === 'development' && (
  <div id="qr-simulator-panel" className="mt-8 bg-[#F4EDE2]/80 backdrop-blur border border-[#E6D5C3]/60 rounded-2xl p-4 shadow-sm">
    <div className="flex items-center gap-2 mb-3 text-[#8C6239]">
      <Sparkles className="w-4 h-4 fill-[#8C6239]" />
      <h3 className="text-xs font-bold uppercase tracking-wider">Sandbox QR Code Simulator</h3>
    </div>
    <p className="text-xs text-[#786455] mb-3 leading-relaxed">
      Dalam mode pengembangan/preview, silakan pilih nomor meja di bawah untuk mensimulasikan pemindaian QR Code meja kafe fisik:
    </p>
    <div className="grid grid-cols-4 gap-2">
      {['03', '05', '12', '18'].map((num) => (
        <button
          key={num}
          type="button"
          onClick={() => handleSimulateQR(num)}
          className={`py-2 px-1 text-xs font-bold rounded-xl border transition-all text-center ${
            tableNumber === num 
              ? 'bg-[#8C6239] text-white border-[#8C6239]' 
              : 'bg-white text-[#5B4E44] border-[#EBE3D5] hover:bg-[#FAF8F5] hover:border-[#9E8775]'
          }`}
        >
          Meja {num}
        </button>
      ))}
    </div>
    {tableNumber && (
      <div className="mt-3 flex items-center justify-between border-t border-[#E6D5C3]/40 pt-2.5">
        <span className="text-[10px] text-[#9E8775] font-semibold uppercase tracking-wider">Mode Simulasi Aktif</span>
        <button
          type="button"
          onClick={() => {
            localStorage.removeItem('scanbite_table');
            window.location.href = window.location.pathname;
          }}
          className="text-[10px] font-bold text-red-600 hover:underline"
        >
          Hapus Sesi QR
        </button>
      </div>
    )}
  </div>
)}     
        </div>

      </main>

      {/* Footer Branding */}
      <footer className="w-full text-center py-6 text-xs text-[#9E8775] border-t border-[#F1E9DB] bg-[#FAF7F2]/40">
        <p>© 2026 {cafeNameText}. All rights reserved.</p>
        <p className="text-[10px] text-[#B2A494] mt-0.5">Powered by RasyaTech | Vibe Modern • Digital Jukebox • Real-time Split Billing</p>
      </footer>
    </div>
  );
}
