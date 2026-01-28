'use client';
import { useState } from 'react';
import { supabase } from '../lib/supabase'; // Importación limpia

export default function AuthModal() {
  const [mode, setMode] = useState<'selection' | 'login' | 'signup' | 'waiting'>('selection');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirmPassword) return alert('Las contraseñas no coinciden');
    
    setLoading(true);
    // CORRECCIÓN: supabase.auth (sin paréntesis)
    const { error } = await supabase.auth.signUp({ 
      email, 
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`, // Importante para flow correcto
      }
    });
    
    if (error) alert(error.message);
    else setMode('waiting');
    setLoading(false);
  };

  const handleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    // CORRECCIÓN: supabase.auth (sin paréntesis)
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) alert(error.message);
    // No hace falta hacer nada más, el onAuthStateChange en page.tsx detectará el login
    setLoading(false);
  };

  if (mode === 'waiting') {
    return (
      <div className="text-center p-8 bg-zinc-900 rounded-3xl border border-zinc-800 border-t-emerald-500 border-t-4 shadow-2xl max-w-sm w-full">
        <div className="text-5xl mb-4">📩</div>
        <h2 className="text-xl font-bold mb-2 text-white">¡Revisá tu mail!</h2>
        <p className="text-zinc-400 text-sm">
          Te enviamos un link mágico a <span className="text-white font-bold">{email}</span>.
        </p>
        <button onClick={() => setMode('login')} className="mt-6 text-emerald-500 text-xs font-bold hover:underline">
          Ya lo confirmé, volver al login
        </button>
      </div>
    );
  }

  return (
    <div className="w-full max-w-sm transition-all duration-500 mx-auto">
      {mode === 'selection' && (
        <div className="flex flex-col gap-3 animate-in fade-in slide-in-from-bottom-4">
          <button 
            onClick={() => setMode('login')}
            className="w-full bg-white text-black font-black py-4 rounded-2xl hover:bg-zinc-200 transition-all active:scale-95 shadow-lg"
          >
            INICIAR SESIÓN
          </button>
          <button 
            onClick={() => setMode('signup')}
            className="w-full bg-zinc-900 text-white border border-zinc-800 font-black py-4 rounded-2xl hover:bg-zinc-800 transition-all active:scale-95"
          >
            CREAR CUENTA
          </button>
        </div>
      )}

      {(mode === 'login' || mode === 'signup') && (
        <form onSubmit={mode === 'login' ? handleSignIn : handleSignUp} className="space-y-3 bg-zinc-900/80 p-6 rounded-[2rem] border border-zinc-800 backdrop-blur-sm animate-in zoom-in duration-300">
          <button type="button" onClick={() => setMode('selection')} className="text-zinc-500 text-[10px] font-bold hover:text-white mb-2 uppercase tracking-widest flex items-center gap-1">
            ← Volver
          </button>
          
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-4">
            {mode === 'login' ? 'Bienvenido' : 'Registrate'}
          </h2>
          
          <div className="space-y-3">
            <input 
              type="email" placeholder="Email" required
              className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 focus:border-emerald-500 outline-none text-white transition-all font-medium placeholder:text-zinc-600"
              onChange={(e) => setEmail(e.target.value)}
            />
            <input 
              type="password" placeholder="Contraseña" required
              className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 focus:border-emerald-500 outline-none text-white transition-all font-medium placeholder:text-zinc-600"
              onChange={(e) => setPassword(e.target.value)}
            />
            {mode === 'signup' && (
              <input 
                type="password" placeholder="Repetir Contraseña" required
                className="w-full bg-zinc-950 p-4 rounded-xl border border-zinc-800 focus:border-emerald-500 outline-none text-white transition-all font-medium placeholder:text-zinc-600"
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            )}
          </div>

          <button 
            disabled={loading}
            className="w-full bg-emerald-500 text-black font-black py-4 rounded-xl mt-4 hover:bg-emerald-400 disabled:opacity-50 shadow-[0_10px_20px_rgba(16,185,129,0.1)] transition-all active:scale-95"
          >
            {loading ? 'CARGANDO...' : mode === 'login' ? 'ENTRAR AHORA' : 'CREAR CUENTA'}
          </button>
        </form>
      )}
    </div>
  );
}