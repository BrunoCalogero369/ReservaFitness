'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase';

export default function OnboardingModal({ userId, onComplete }: { userId: string, onComplete: (name: string) => void }) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (name.length < 3) return alert("Ingresa tu nombre real");
    
    setLoading(true);
    const { error } = await supabase.from('profiles').insert({ id: userId, full_name: name });

    if (error) {
      // Si ya existe pero por alguna razón saltó aquí, intentamos un update
      await supabase.from('profiles').update({ full_name: name }).eq('id', userId);
    }
    
    setLoading(false);
    onComplete(name);
  };

  return (
    <div className="fixed inset-0 bg-zinc-950/90 backdrop-blur-md z-[100] flex items-center justify-center p-4">
      <div className="bg-zinc-900 border border-zinc-800 p-8 rounded-[2.5rem] w-full max-w-sm text-center shadow-2xl">
        <h2 className="text-2xl font-black italic text-white mb-2 uppercase tracking-tighter">¿Cómo te llamás?</h2>
        <p className="text-zinc-500 text-sm mb-6 font-bold">El Pro necesita tu nombre para la agenda.</p>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <input 
            autoFocus
            type="text" 
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Ej: Juan Pérez"
            className="w-full bg-zinc-800 border-zinc-700 rounded-2xl py-4 px-6 text-white font-bold focus:ring-2 focus:ring-emerald-500 outline-none transition-all"
          />
          <button 
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-black py-4 rounded-2xl hover:bg-emerald-400 transition-all disabled:opacity-50"
          >
            {loading ? 'GUARDANDO...' : 'EMPEZAR A ENTRENAR'}
          </button>
        </form>
      </div>
    </div>
  );
}