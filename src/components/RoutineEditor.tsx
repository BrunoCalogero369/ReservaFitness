'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

interface RoutineEditorProps {
  studentId: string;
  studentName: string;
  onBack: () => void;
}

interface RoutineData {
  id?: string;
  day_of_week: number;
  content: string;
}

const DAYS = [
  { id: 1, label: 'LUN' },
  { id: 2, label: 'MAR' },
  { id: 3, label: 'MIÉ' },
  { id: 4, label: 'JUE' },
  { id: 5, label: 'VIE' },
  { id: 6, label: 'SÁB' },
];

export default function RoutineEditor({ studentId, studentName, onBack }: RoutineEditorProps) {
  const [selectedDay, setSelectedDay] = useState(1);
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  // Cargar rutina cuando cambia el día o el alumno
  useEffect(() => {
    async function fetchRoutine() {
      setLoading(true);
      const { data, error } = await supabase
        .from('routines')
        .select('content')
        .eq('user_id', studentId)
        .eq('day_of_week', selectedDay)
        .maybeSingle();

      if (!error && data) {
        setContent(data.content);
      } else {
        setContent(''); // Vacío si no hay nada
      }
      setLoading(false);
    }
    fetchRoutine();
  }, [selectedDay, studentId]);

  const handleSave = async () => {
    setSaving(true);
    // Upsert: Si existe lo actualiza, si no lo inserta
    const { error } = await supabase
      .from('routines')
      .upsert({ 
        user_id: studentId, 
        day_of_week: selectedDay, 
        content: content,
        updated_at: new Date().toISOString()
      }, { onConflict: 'user_id, day_of_week' });

    if (error) {
      alert("Error al guardar: " + error.message);
    } else {
      // Feedback visual rápido
      setSaving(false);
    }
  };

  return (
    <div className="animate-in fade-in slide-in-from-right-6 duration-500">
      {/* HEADER EDITOR */}
      <div className="flex items-center gap-4 mb-8">
        <button onClick={onBack} className="bg-zinc-900 p-3 rounded-2xl text-zinc-500 hover:text-white transition-colors">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <div>
          <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-[0.2em] leading-none mb-1">Editando Rutina</p>
          <h2 className="text-2xl font-black italic text-white uppercase tracking-tighter leading-none">{studentName}</h2>
        </div>
      </div>

      {/* SELECTOR DE DÍAS (SLIDER) */}
      <div className="flex gap-2 overflow-x-auto pb-4 no-scrollbar">
        {DAYS.map((d) => (
          <button
            key={d.id}
            onClick={() => setSelectedDay(d.id)}
            className={`
              flex-shrink-0 w-14 h-14 rounded-2xl font-black text-xs transition-all flex items-center justify-center
              ${selectedDay === d.id ? 'bg-emerald-500 text-black shadow-[0_10px_20px_rgba(16,185,129,0.3)]' : 'bg-zinc-900 text-zinc-500 border border-zinc-800'}
            `}
          >
            {d.label}
          </button>
        ))}
      </div>

      {/* ÁREA DE TEXTO */}
      <div className="mt-6 relative">
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder={`Escribí la rutina del ${DAYS.find(d => d.id === selectedDay)?.label}...`}
          className="w-full h-64 bg-zinc-900 border border-zinc-800 rounded-[2rem] p-6 text-white font-medium placeholder:text-zinc-700 outline-none focus:border-emerald-500/50 transition-all resize-none"
        />
        
        {loading && (
          <div className="absolute inset-0 bg-zinc-950/20 backdrop-blur-[2px] rounded-[2rem] flex items-center justify-center">
            <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
          </div>
        )}
      </div>

      {/* BOTÓN GUARDAR */}
      <button
        onClick={handleSave}
        disabled={saving}
        className={`
          w-full py-5 rounded-[2rem] font-black uppercase tracking-widest mt-6 transition-all active:scale-95
          ${saving ? 'bg-zinc-800 text-zinc-600' : 'bg-white text-black hover:bg-emerald-400'}
        `}
      >
        {saving ? 'Guardando...' : 'Guardar Cambios'}
      </button>
    </div>
  );
}