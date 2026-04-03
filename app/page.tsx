"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { Calendar as CalendarIcon, LogOut, Loader2, CheckCircle2, History, CreditCard, ArrowUpRight } from 'lucide-react';
import { supabase } from '../supabaseClient';
import { User as SupabaseUser } from '@supabase/supabase-js';

// --- AD to BS Converter Logic ---
const getNepaliDate = (date: Date) => {
  const nepaliMonths = ["Baisakh", "Jestha", "Ashadh", "Shrawan", "Bhadra", "Ashwin", "Kartik", "Mangsir", "Poush", "Magh", "Falgun", "Chaitra"];
  const adYear = date.getFullYear();
  const bsYear = adYear + 56 + (date.getMonth() > 3 || (date.getMonth() === 3 && date.getDate() > 13) ? 1 : 0);
  const monthIndex = (date.getMonth() + 8) % 12;
  return `${date.getDate()} ${nepaliMonths[monthIndex]}, ${bsYear} BS`;
};

// Transaction type interface
interface Transaction {
  id: string;
  user_id: string;
  amount_npr: number;
  gold_grams: number;
  rate_at_purchase: number;
  payment_token: string;
  created_at: string;
}

// Helper function outside component to avoid purity issues
const generateRandomToken = () => {
  // This is okay because it's outside the component
  return "SIM_KHALTI_" + Math.random().toString(36).substr(2, 9);
};

export default function SunauloApp() {
  const [nprAmount, setNprAmount] = useState<string>("1000");
  const [goldRatePerTola] = useState<number>(135000);
  const [currentTime, setCurrentTime] = useState<string>("");
  const [nepaliDate, setNepaliDate] = useState<string>("");
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [isMounted, setIsMounted] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'paying' | 'saving' | 'success'>('idle');
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [totalGold, setTotalGold] = useState<number>(0);
  const [totalInvested, setTotalInvested] = useState<number>(0);
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [loginError, setLoginError] = useState<string | null>(null);

  const fetchTransactions = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    
    if (!error && data) {
      setTransactions(data);
      const totalG = data.reduce((acc, curr) => acc + parseFloat(curr.gold_grams.toString()), 0);
      const totalI = data.reduce((acc, curr) => acc + parseFloat(curr.amount_npr.toString()), 0);
      setTotalGold(totalG);
      setTotalInvested(totalI);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setIsMounted(true);
    const checkUser = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        setUser(session?.user ?? null);
        if (session?.user) fetchTransactions(session.user.id);
      } catch (error) {
        console.error('Auth error:', error);
      } finally {
        setAuthLoading(false);
      }
    };
    checkUser();
    
    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) fetchTransactions(session.user.id);
      else { setTransactions([]); setTotalGold(0); setTotalInvested(0); }
      setAuthLoading(false);
    });

    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleString('en-NP', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
      setNepaliDate(getNepaliDate(now));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => { clearInterval(timer); authListener.subscription.unsubscribe(); };
  }, [fetchTransactions]);

  const handlePaymentAndSave = async () => {
    if (!user) return;
    setSaveStatus('paying');
    const confirmed = window.confirm(
      `Sunaulo Secure Payment (PROTOTYPE)\n--------------------------\nAmount: रू ${nprAmount}\nGold: ${weightInGrams.toFixed(4)}g\n\nClick OK to simulate successful Khalti payment.`
    );
    if (confirmed) {
      const fakeToken = generateRandomToken();
      await saveGoldToDB(fakeToken);
    } else {
      setSaveStatus('idle');
    }
  };

  const saveGoldToDB = async (paymentToken: string) => {
    setSaveStatus('saving');
    const amount = parseFloat(nprAmount);
    const grams = (amount / goldRatePerTola) * 11.6638;
    const { error } = await supabase.from('transactions').insert([
      { user_id: user?.id, amount_npr: amount, gold_grams: grams, rate_at_purchase: goldRatePerTola, payment_token: paymentToken }
    ]);
    if (error) {
      alert("Database Error: " + error.message);
      setSaveStatus('idle');
    } else {
      setSaveStatus('success');
      if (user) fetchTransactions(user.id);
      setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleLogin = async () => {
    const email = window.prompt("Enter your email for login:");
    if (!email) return;
    
    setLoginError(null);
    try {
      const { error } = await supabase.auth.signInWithOtp({ email });
      if (error) throw error;
      alert("Check your email for the login link!");
    } catch (error) {
      setLoginError((error as Error).message || "Login failed. Please try again.");
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
  };

  const weightInGrams = (Math.max(0, parseFloat(nprAmount) || 0) / goldRatePerTola) * 11.6638;

  if (!isMounted) return <div className="min-h-screen bg-slate-50" />;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center p-4 md:p-8 font-sans text-slate-900 pb-24">
      {/* Header */}
      <header className="w-full max-w-md flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <div className="bg-amber-500 p-2 rounded-xl shadow-lg">
            <LandmarkIcon className="text-white w-6 h-6" />
          </div>
          <h1 className="text-2xl font-black text-slate-800 tracking-tight italic uppercase">Sunaulo</h1>
        </div>
        {authLoading ? (
          <div className="w-8 h-8 border-2 border-slate-300 border-t-slate-600 rounded-full animate-spin" />
        ) : user ? (
          <button onClick={handleLogout} className="bg-white p-2 rounded-full border border-slate-200 shadow-sm hover:bg-red-50 transition-colors"><LogOut size={18} className="text-slate-400" /></button>
        ) : (
          <div className="flex flex-col items-end gap-1">
            <button onClick={handleLogin} className="bg-slate-900 text-white px-5 py-2.5 rounded-xl text-[10px] font-bold uppercase tracking-widest hover:bg-black transition-colors">Login</button>
            {loginError && <p className="text-[9px] text-red-500 max-w-[120px] text-right">{loginError}</p>}
          </div>
        )}
      </header>

      {/* Vault Card */}
      {user && (
        <div className="w-full max-w-md bg-slate-900 rounded-[2.5rem] p-8 mb-6 relative overflow-hidden shadow-2xl shadow-slate-300 border border-slate-800">
           <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 rounded-full -mr-12 -mt-12 blur-3xl" />
           <div className="flex justify-between items-center mb-4 relative z-10">
              <p className="text-slate-500 text-[10px] font-bold uppercase tracking-[0.3em]">Vault Ownership</p>
              <div className="flex items-center gap-1 bg-green-500/10 px-2 py-1 rounded-full">
                 <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
                 <span className="text-[8px] font-black text-green-400 uppercase tracking-widest">Verified</span>
              </div>
           </div>
           <div className="flex items-baseline gap-2 mb-6 relative z-10">
              <span className="text-5xl font-black text-amber-400 tracking-tighter" suppressHydrationWarning>{totalGold.toFixed(4)}</span>
              <span className="text-xl font-bold text-amber-200/50 uppercase italic">grams</span>
           </div>
           <div className="grid grid-cols-2 gap-4 border-t border-slate-800 pt-5 relative z-10">
              <div>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Savings Total</p>
                <p className="text-sm font-black text-white">रू {totalInvested.toLocaleString()}</p>
              </div>
              <div className="text-right">
                 <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mb-1">Portfolio Value</p>
                 <p className="text-sm font-black text-green-400">रू {(totalGold * (goldRatePerTola / 11.6638)).toLocaleString(undefined, {maximumFractionDigits: 0})}</p>
              </div>
           </div>
        </div>
      )}

      {/* Main Calculator */}
      <main className="w-full max-w-md bg-white rounded-[2.5rem] shadow-xl p-8 border border-slate-100 mb-8 relative">
        <div className="flex justify-between items-center mb-6">
           <div className="flex items-center gap-1 text-[9px] font-bold text-slate-400 uppercase"><CalendarIcon size={10}/> {nepaliDate}</div>
           <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{currentTime}</div>
        </div>
        <section className="mb-6 flex justify-between items-end">
          <div><p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">24K Market Rate</p><p className="text-2xl font-black text-slate-800 tracking-tight">रू {goldRatePerTola.toLocaleString()}<span className="text-xs text-slate-300 ml-1">/tola</span></p></div>
          <span className="bg-green-100 text-green-600 text-[9px] font-black px-2 py-1 rounded-lg animate-pulse tracking-widest uppercase">Live</span>
        </section>
        <section className="mb-8">
          <label className="block text-[11px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Investment Amount (NPR)</label>
          <div className="relative">
            <span className="absolute left-0 top-1/2 -translate-y-1/2 text-2xl font-black text-slate-200">रू</span>
            <input type="number" value={nprAmount} onChange={(e) => setNprAmount(e.target.value)} className="w-full pl-8 py-2 bg-transparent border-b-2 border-slate-100 focus:border-amber-400 text-3xl font-black outline-none transition-all" />
          </div>
        </section>
        <div className="bg-amber-50 rounded-[1.5rem] p-6 text-center border border-amber-100 mb-6">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-[0.2em] mb-1">Add to your vault</p>
          <p className="text-3xl font-black text-amber-800" suppressHydrationWarning>+{weightInGrams.toFixed(4)} g</p>
        </div>
        <button 
          disabled={!user || saveStatus !== 'idle'}
          onClick={handlePaymentAndSave}
          className={`w-full py-5 rounded-[2rem] font-bold transition-all shadow-xl flex justify-center items-center gap-3 tracking-widest uppercase text-xs ${user ? (saveStatus === 'success' ? 'bg-green-500 text-white' : 'bg-slate-900 text-white hover:bg-black') : 'bg-slate-100 text-slate-300'}`}
        >
          {saveStatus === 'idle' ? <>{user ? <><CreditCard size={18}/> Pay & Invest</> : "Login to Save Gold"}</> : <Loader2 className="animate-spin" />}
          {saveStatus === 'success' && <CheckCircle2 />}
        </button>
      </main>

      {/* History Log */}
      {user && (
        <section className="w-full max-w-md mt-4">
          <div className="flex items-center justify-between mb-4 px-2">
            <div className="flex items-center gap-2">
               <History size={16} className="text-slate-400" />
               <h2 className="text-[11px] font-black text-slate-500 uppercase tracking-[0.2em]">Transaction Log</h2>
            </div>
            <span className="text-[9px] font-bold text-slate-300">{transactions.length} entries</span>
          </div>
          <div className="space-y-3">
            {transactions.length === 0 ? (
              <div className="bg-white/50 p-10 rounded-[2rem] border-2 border-dashed border-slate-200 text-center text-[10px] font-bold text-slate-400 uppercase">The vault is currently empty</div>
            ) : (
              transactions.map((tx) => (
                <div key={tx.id} className="bg-white p-5 rounded-[1.8rem] shadow-sm border border-slate-50 flex justify-between items-center hover:scale-[1.01] transition-transform">
                  <div className="flex gap-4 items-center">
                    <div className="bg-green-50 p-2.5 rounded-xl"><ArrowUpRight size={18} className="text-green-600" /></div>
                    <div>
                      <p className="text-sm font-black text-slate-800 tracking-tight">रू {tx.amount_npr.toLocaleString()}</p>
                      <div className="flex items-center gap-2 mt-0.5">
                        <p className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{new Date(tx.created_at).toLocaleDateString()}</p>
                        <span className="w-1 h-1 bg-slate-200 rounded-full" />
                        <p className="text-[9px] font-bold text-amber-600 uppercase tracking-tighter italic">Rate: रू {tx.rate_at_purchase.toLocaleString()}</p>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-md font-black text-slate-900 tracking-tighter">+{tx.gold_grams.toFixed(4)} <span className="text-[10px] text-slate-400">g</span></p>
                    <p className="text-[8px] font-black text-slate-300 tracking-widest mt-1 uppercase">ID: {tx.payment_token?.slice(-6) || 'TOKEN'}</p>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>
      )}
    </div>
  );
}

// Fixed Landmark Icon
const LandmarkIcon = ({ className }: { className: string }) => (
  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
    <polyline points="9 22 9 12 15 12 15 22" />
  </svg>
);
