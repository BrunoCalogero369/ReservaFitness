'use client';
import { useEffect, useState, useCallback } from 'react';
import { supabase } from '../lib/supabase'; 
import ConfirmModal from './ConfirmModal';

interface BookingRecord {
  id: string;
  service: string;
  professional: string;
  booking_date: string;
  booking_time: string;
  user_id: string;
  created_at: string;
}

export default function MyBookings({ userId }: { userId: string }) {
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // 1. Usamos useCallback para que la función sea estable y reutilizable
  const fetchBookings = useCallback(async () => {
    setLoading(true);
    try {
      const now = new Date();
      const todayStr = now.toLocaleDateString('sv-SE'); 
      const currentHour = now.getHours();

      const { data, error } = await supabase
        .from('bookings')
        .select('*')
        .eq('user_id', userId)
        .gte('booking_date', todayStr) 
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true })
        .returns<BookingRecord[]>();

      if (error) throw error;

      if (data) {
        const validBookings = data.filter((b: BookingRecord) => {
          if (b.booking_date > todayStr) return true;
          if (b.booking_date === todayStr) {
            const hour = parseInt(b.booking_time.split(':')[0]);
            // Mostramos turnos de hoy que aún no pasaron (1h de gracia)
            return hour >= currentHour - 1;
          }
          return false;
        });
        setBookings(validBookings);
      }
    } catch (err) {
      console.error('Error fetching bookings:', err);
    } finally {
      setLoading(false);
    }
  }, [userId]); // Solo depende de userId

  // 2. El useEffect ahora es súper simple
  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  // 3. Función para borrar
// Esta función solo abre el modal y guarda el ID
  const handleDelete = (id: string) => {
    setIdToDelete(id);
    setModalOpen(true);
  };

  // Esta se ejecuta cuando el usuario hace clic en "Eliminar/Confirmar" dentro del modal
  const confirmCancel = async () => {
    if (!idToDelete) return;

    try {
      const { error } = await supabase
        .from('bookings')
        .delete()
        .eq('id', idToDelete)
        .eq('user_id', userId);

      if (error) throw error;
      
      // Filtramos el estado local
      setBookings(prev => prev.filter(b => b.id !== idToDelete));
    } catch { 
      alert("No se pudo cancelar el turno.");
    } finally {
      // Pase lo que pase, cerramos el modal y limpiamos el ID
      setModalOpen(false);
      setIdToDelete(null);
    }
  };

  if (loading) return <div className="text-center py-10 animate-pulse text-zinc-500 font-black uppercase text-[10px]">Cargando tus turnos...</div>;

  return (
    <div className="px-6 space-y-4 animate-in fade-in duration-500 pb-20">
      <h2 className="text-xl font-black italic uppercase tracking-tighter text-white mb-6">Mis Próximos Turnos</h2>
      
      {bookings.length === 0 ? (
        <div className="bg-zinc-900/50 border border-zinc-800 p-8 rounded-[2rem] text-center">
          <p className="text-zinc-500 font-bold text-xs uppercase tracking-widest">No tenés reservas activas</p>
        </div>
      ) : (
        bookings.map((b) => (
          <div key={b.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center group hover:border-zinc-700 transition-all shadow-lg">
            
            {/* IZQUIERDA: FECHA Y HORA */}
            <div className="flex flex-col gap-1">
              <p className="text-emerald-500 font-black text-[10px] tracking-[0.2em] uppercase pl-1">
                {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric'
                  }).toUpperCase().replace('.', '')}
              </p>
              
              <div className="flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
                <p className="text-white font-black text-2xl italic tracking-tighter uppercase leading-none">
                  {b.booking_time} HS
                </p>
              </div>
              <p className="text-zinc-500 font-bold text-[8px] uppercase tracking-widest pl-4 opacity-60">
                {b.service}
              </p>
            </div>

            {/* DERECHA: PROFE + BOTÓN */}
            <div className="flex items-center gap-4">
              <div className="text-right">
                <p className="text-zinc-600 font-black text-[8px] uppercase tracking-widest leading-none mb-1">Profesor</p>
                <p className="text-zinc-300 font-black text-xs uppercase italic leading-none">{b.professional}</p>
              </div>
              
              <button 
                onClick={() => handleDelete(b.id)}
                className="bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-500 hover:text-red-500 p-3 rounded-xl transition-all active:scale-90"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
                </svg>
              </button>
            </div>
          </div>
        ))
      )}

      <ConfirmModal 
        isOpen={modalOpen}
        title="¿Cancelar Turno?"
        message="Si cancelas, el horario quedará disponible para todos."
        onConfirm={confirmCancel}
        onCancel={() => setModalOpen(false)}
        confirmText="Sí, cancelar"
      />
    </div>
  );
}