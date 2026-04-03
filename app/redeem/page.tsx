"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { User as SupabaseUser } from '@supabase/supabase-js';
import { Store, Loader2, CheckCircle2 } from "lucide-react";

const PARTNER_SHOPS = [
  { name: "Shree Jewellers", address: "New Road, Kathmandu", phone: "01-1234567" },
  { name: "Butwal Gold House", address: "Traffic Chowk, Butwal", phone: "071-234567" },
  { name: "Pokhara Gold Mart", address: "Chipledhunga, Pokhara", phone: "061-345678" },
];

export default function RedeemPage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [totalGold, setTotalGold] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [requesting, setRequesting] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data, error } = await supabase
          .from("transactions")
          .select("gold_grams")
          .eq("user_id", session.user.id);
        if (!error && data) {
          const total = data.reduce((acc, curr) => acc + parseFloat(curr.gold_grams), 0);
          setTotalGold(total);
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleRedeem = async () => {
    setRequesting(true);
    // In a real app, this would send a request to admin/jeweler
    setTimeout(() => {
      setSuccess(true);
      setRequesting(false);
    }, 1500);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-400">Loading...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-400">Please log in to redeem gold.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mt-10">
        <div className="flex items-center gap-3 mb-6">
          <Store className="text-amber-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-800">Redeem Gold</h1>
        </div>
        <div className="mb-6">
          <p className="text-slate-700 font-bold mb-1">Your Total Gold:</p>
          <p className="text-3xl font-black text-amber-600">{totalGold.toFixed(4)} g</p>
        </div>
        <button onClick={handleRedeem} disabled={requesting || totalGold < 1} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2 disabled:opacity-60 disabled:cursor-not-allowed mb-6">
          {requesting ? <Loader2 className="animate-spin" /> : "Request Redemption"}
        </button>
        {success && <div className="text-green-600 text-sm flex items-center gap-2 mb-4"><CheckCircle2 /> Redemption request sent! Our team will contact you soon.</div>}
        <div className="mt-8">
          <h2 className="text-lg font-bold text-slate-700 mb-3">Partner Shops</h2>
          <ul className="space-y-4">
            {PARTNER_SHOPS.map(shop => (
              <li key={shop.name} className="bg-amber-50 rounded-xl p-4 border border-amber-100">
                <div className="font-bold text-amber-800">{shop.name}</div>
                <div className="text-slate-700 text-sm">{shop.address}</div>
                <div className="text-slate-500 text-xs">Phone: {shop.phone}</div>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}
