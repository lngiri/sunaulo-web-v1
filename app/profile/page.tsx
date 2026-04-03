"use client";
import React, { useEffect, useState } from "react";
import { supabase } from "../../supabaseClient";
import { User as SupabaseUser } from "@supabase/supabase-js";
import { ShieldCheck, User, Loader2 } from "lucide-react";

export default function ProfilePage() {
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [fullName, setFullName] = useState("");
  const [phone, setPhone] = useState("");
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    const fetchUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        const { data, error } = await supabase
          .from("profiles")
          .select("id, full_name, phone_number")
          .eq("id", session.user.id)
          .single();
        if (error) setError("Could not fetch profile");
        else if (data) {
          setFullName(data.full_name || "");
          setPhone(data.phone_number || "");
        }
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSuccess(false);
    const { error } = await supabase
      .from("profiles")
      .upsert({ id: user.id, full_name: fullName, phone_number: phone });
    setSaving(false);
    if (error) setError("Could not save profile");
    else setSuccess(true);
  };

  if (loading) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-400">Loading profile...</div>;
  if (!user) return <div className="min-h-screen flex items-center justify-center text-xl text-slate-400">Please log in to view your profile.</div>;

  return (
    <div className="min-h-screen flex flex-col items-center p-6 bg-slate-50">
      <div className="w-full max-w-md bg-white rounded-3xl shadow-xl p-8 border border-slate-100 mt-10">
        <div className="flex items-center gap-3 mb-6">
          <User className="text-amber-600 w-8 h-8" />
          <h1 className="text-2xl font-bold text-slate-800">My Profile</h1>
        </div>
        <form onSubmit={handleSave} className="space-y-6">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Full Name</label>
            <input type="text" value={fullName} onChange={e => setFullName(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-lg font-bold" />
          </div>
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">Phone Number</label>
            <input type="text" value={phone} onChange={e => setPhone(e.target.value)} className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-amber-500 outline-none text-lg font-bold" />
          </div>
          <button type="submit" disabled={saving} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg active:scale-95 flex items-center justify-center gap-2">
            {saving ? <Loader2 className="animate-spin" /> : "Save Profile"}
          </button>
          {success && <div className="text-green-600 text-sm flex items-center gap-2"><ShieldCheck /> Profile updated!</div>}
          {error && <div className="text-red-500 text-sm">{error}</div>}
        </form>
      </div>
    </div>
  );
}
