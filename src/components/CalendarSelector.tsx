'use client';
import { useAppDispatch, useAppSelector } from '../lib/hooks';
import { setDateTime } from '../lib/features/booking/bookingSlice';

interface CalendarProps {
  onSelect: () => void;
}

export default function CalendarSelector({ onSelect }: CalendarProps) {
  const dispatch = useAppDispatch();
  const selectedDate = useAppSelector((state) => state.booking.date);
  
  const now = new Date();
  const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
  const firstDayIndex = new Date(now.getFullYear(), now.getMonth(), 1).getDay();
  
  // Ajuste para que la semana empiece en Lunes
  const shift = firstDayIndex === 0 ? 6 : firstDayIndex - 1;
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const blanks = Array.from({ length: shift }, (_, i) => i);

  const handleDateClick = (day: number) => {
  // Creamos la fecha localmente
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(day).padStart(2, '0');
  
  // Formato: 2026-01-21 (Esto no falla con las zonas horarias)
  const dateStr = `${year}-${month}-${d}`; 
  
  dispatch(setDateTime({ date: dateStr, time: '' }));
  
  setTimeout(() => {
    onSelect();
  }, 300);
 };

  const monthName = now.toLocaleString('es-ES', { month: 'long' });

  return (
    <div className="max-w-md mx-auto bg-zinc-950 p-4 text-white">
      <h2 className="text-xl font-bold mb-6 text-zinc-400 uppercase tracking-widest text-center">
        {monthName} {now.getFullYear()}
      </h2>

      <div className="grid grid-cols-7 gap-2 mb-2 text-center text-zinc-500 text-xs font-bold">
        {['LU', 'MA', 'MI', 'JU', 'VI', 'SÁ', 'DO'].map(d => <div key={d}>{d}</div>)}
      </div>

      <div className="grid grid-cols-7 gap-2">
        {blanks.map(b => <div key={`b-${b}`} />)}
        
        {days.map(day => {
          const dayDate = new Date(now.getFullYear(), now.getMonth(), day);
          
          const today = new Date();
          today.setHours(0, 0, 0, 0);

          const isPast = dayDate < today;
          const isSunday = dayDate.getDay() === 0; // 0 es Domingo
          const isDisabled = isPast || isSunday; // Bloqueamos si pasó o si es domingo
          
          const isToday = day === now.getDate() && now.getMonth() === dayDate.getMonth();
          const dateFull = dayDate.toISOString();
          const isSelected = selectedDate === dateFull;

          return (
            <button
              key={day}
              disabled={isDisabled}
              onClick={() => handleDateClick(day)}
              className={`h-12 w-full rounded-xl flex items-center justify-center text-sm font-semibold transition-all
                ${isSelected 
                  ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
                  : isDisabled
                    ? 'text-zinc-800 cursor-not-allowed opacity-20' 
                    : 'hover:bg-zinc-800 border border-zinc-900 text-white'
                }
                ${isToday && !isSelected ? 'text-emerald-500 border-emerald-500/30 font-bold' : ''}
              `}
            >
              {day}
            </button>
          );
        })}
      </div>
      
      {/* Mini leyenda informativa */}
      <p className="text-[10px] text-zinc-600 mt-6 text-center italic">
        * Domingos cerrado por descanso del staff
      </p>
    </div>
  );
}