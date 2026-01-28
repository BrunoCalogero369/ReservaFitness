'use client';
import { useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { setDateTime } from '../lib/features/booking/bookingSlice';

const ALL_TIMES = ['08:00', '09:00', '10:00', '11:00', '16:00', '17:00', '18:00', '19:00', '20:00'];

interface TimeSelectorProps {
  onSelect: () => void;
}

// 1. Interfaz para el resultado de la consulta
interface OccupiedBooking {
  booking_time: string;
}

export default function TimeSelector({ onSelect }: TimeSelectorProps) {
  const dispatch = useAppDispatch();
  const { date, professional, time: selectedTime } = useAppSelector((state) => state.booking);
  
  const [availableTimes, setAvailableTimes] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    let isMounted = true;

    async function fetchOccupiedTimes() {
      if (!date || !professional) return;
      
      setLoading(true);
      
      try {
        // 2. Usamos .returns para tipar la respuesta de Supabase
        const { data, error } = await supabase
          .from('bookings')
          .select('booking_time')
          .eq('booking_date', date)
          .eq('professional', professional)
          .returns<OccupiedBooking[]>();

        if (error) throw error;

        if (isMounted && data) {
          // 3. Ya no necesitamos any, 'b' es de tipo OccupiedBooking
          const occupied = data.map((b: OccupiedBooking) => b.booking_time);
          
          const now = new Date();
          const todayStr = now.toLocaleDateString('sv-SE'); 
          const currentHour = now.getHours();
          const currentMinutes = now.getMinutes();

          const filtered = ALL_TIMES.filter(t => {
            if (occupied.includes(t)) return false;

            if (date === todayStr) {
              const [h, m] = t.split(':').map(Number);
              if (h < currentHour) return false;
              if (h === currentHour && m <= currentMinutes + 30) return false;
            }
            return true;
          });

          setAvailableTimes(filtered);
        }
      } catch (err: unknown) {
        // 4. Manejo de error seguro
        const errorMessage = err instanceof Error ? err.message : 'Error desconocido';
        console.error('Error al cargar horarios:', errorMessage);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchOccupiedTimes();

    return () => { isMounted = false; };
  }, [date, professional]);

  const handleTimeClick = (t: string) => {
    dispatch(setDateTime({ date: date!, time: t }));
    onSelect();
  };

  if (loading) return <div className="text-center py-10 animate-pulse text-zinc-500 font-bold uppercase text-[10px]">Buscando horarios...</div>;

  return (
    <div className="px-6 space-y-4">
      <h2 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-6">Seleccioná la hora</h2>
      
      <div className="grid grid-cols-3 gap-3">
        {availableTimes.length === 0 ? (
          <p className="col-span-3 text-center py-10 text-zinc-600 font-bold uppercase text-[10px]">No hay horarios disponibles</p>
        ) : (
          availableTimes.map((t) => (
            <button
              key={t}
              onClick={() => handleTimeClick(t)}
              className={`
                py-4 rounded-2xl font-black text-lg transition-all active:scale-95 border-2
                ${selectedTime === t 
                  ? 'bg-emerald-500 border-emerald-400 text-black shadow-[0_0_20px_rgba(16,185,129,0.4)]' 
                  : 'bg-zinc-900 border-zinc-800 text-white hover:border-zinc-600'}
              `}
            >
              {t}
            </button>
          ))
        )}
      </div>
    </div>
  );
}