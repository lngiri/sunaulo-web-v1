"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../supabaseClient";
import { Gift } from "lucide-react";
import { User as SupabaseUser } from '@supabase/supabase-js';

export default function ReferralPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [referralCode, setReferralCode] = useState<string>("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);
  const [bonus, setBonus] = useState<number>(0);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        setReferralCode(session.user.id.slice(0, 8));
        // Simulate fetching referral bonus
        setBonus(0.005); // 5mg bonus for demo
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleCopy = () => {
    navigator.clipboard.writeText(referralCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-400">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-400">Please log in to view your referral code.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mt-10">
        <div className="flex items-center gap-3 mb-6">
          <Gift className="text-amber-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-800">Referral Program</h1>
        </div>
        <div className="mb-6">
          <p className="text-slate-700 font-bold mb-1">Your Referral Code:</p>
          <div className="flex items-center gap-2">
            <span className="text-xl font-mono bg-slate-100 px-4 py-2 rounded-lg border border-slate-200">{referralCode}</span>
            <button onClick={handleCopy} className="bg-amber-500 hover:bg-amber-600 text-white px-3 py-2 rounded-lg font-bold text-xs transition-all">
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
        <div className="mb-6">
          <p className="text-slate-700 font-bold mb-1">Invite friends and earn:</p>
          <p className="text-amber-600 font-black text-2xl">+{bonus} g</p>
          <p className="text-xs text-slate-500">(You and your friend both get 5mg gold when they join and save!)</p>
        </div>
        <div className="mt-8 text-xs text-slate-400">
          Share your code with friends. When they sign up and save, you both earn bonus gold!
        </div>
      </div>
    </div>
  );
}
