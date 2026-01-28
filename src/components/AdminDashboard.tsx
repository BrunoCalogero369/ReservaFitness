'use client';
import { useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import RoutineEditor from './RoutineEditor'
import ConfirmModal from './ConfirmModal';

// --- INTERFACES PARA TIPADO SEGURO ---
interface FormattedBooking {
  id: string;
  service: string;
  professional: string;
  booking_date: string;
  booking_time: string;
  user_name: string;
}

interface Student {
  id: string;
  full_name: string | null;
}

interface ProfileData {
  full_name: string | null;
}

interface BookingRow {
  id: string;
  service: string;
  professional: string;
  booking_date: string;
  booking_time: string;
  profiles: ProfileData | ProfileData[] | null;
}

export default function AdminDashboard({ adminEmail }: { adminEmail: string }) {
  const [tab, setTab] = useState<'agenda' | 'students'>('agenda');
  const [allBookings, setAllBookings] = useState<FormattedBooking[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectingId, setSelectingId] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<{id: string, name: string} | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [idToDelete, setIdToDelete] = useState<string | null>(null);

  // FETCH: AGENDA
  const fetchAll = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const { data, error } = await supabase
        .from('bookings')
        .select(`id, service, professional, booking_date, booking_time, profiles(full_name)`)
        .gte('booking_date', today)
        .order('booking_date', { ascending: true })
        .order('booking_time', { ascending: true });

      if (error) throw error;
      if (data) {
        const formatted = (data as unknown as BookingRow[]).map((b) => {
          let name = 'Sin nombre';
          if (b.profiles) {
            name = Array.isArray(b.profiles) ? b.profiles[0]?.full_name || 'Sin nombre' : b.profiles.full_name || 'Sin nombre';
          }
          return {
            id: b.id,
            service: b.service,
            professional: b.professional,
            booking_date: b.booking_date,
            booking_time: b.booking_time,
            user_name: name,
          };
        });
        setAllBookings(formatted);
      }
    } catch (err) { console.error('Error agenda:', err); }
  };

  // FETCH: ALUMNOS
  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, full_name')
        .order('full_name', { ascending: true });
      if (error) throw error;
      if (data) setStudents(data);
    } catch (err) { console.error('Error alumnos:', err); }
  };

  useEffect(() => {
    const loadAll = async () => {
      setLoading(true);
      await Promise.all([fetchAll(), fetchStudents()]);
      setLoading(false);
    };
    loadAll();

    const channel = supabase
      .channel('admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bookings' }, () => fetchAll())
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const deleteAnyBooking = async (id: string) => {
  setIdToDelete(id);
  setModalOpen(true); // Abrimos el modal
  };
  const confirmDelete = async () => {
  if (!idToDelete) return;
  const { error } = await supabase.from('bookings').delete().eq('id', idToDelete);
  if (!error) {
    setAllBookings(prev => prev.filter(b => b.id !== idToDelete));
  }
  setModalOpen(false);
  setIdToDelete(null);
  };

  if (loading) return <div className="text-center py-20 animate-pulse text-zinc-500 font-black uppercase italic">Cargando Sistema...</div>;
  if (selectedStudent) {
  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      <RoutineEditor 
        studentId={selectedStudent.id} 
        studentName={selectedStudent.name} 
        onBack={() => setSelectedStudent(null)} 
      />
    </div>
  );
}
  return (
    <div className="p-4 max-w-2xl mx-auto pb-24">
      {/* HEADER DINÁMICO LIMPIO */}
      <div className="flex justify-between items-center mb-10">
        <div>
          <p className="text-emerald-500 font-black text-[10px] tracking-[0.3em] uppercase mb-1">
            Admin Panel
          </p>
          <h1 className="text-4xl font-black italic tracking-tighter text-white uppercase leading-none">
            {tab === 'agenda' ? 'Agenda' : 'Alumnos'}
          </h1>
        </div>
        
        {/* NAVEGACIÓN TABS */}
        <div className="flex bg-zinc-950 p-1 rounded-2xl border border-zinc-800 shadow-inner">
          <button 
            onClick={() => setTab('agenda')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${tab === 'agenda' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Turnos
          </button>
          <button 
            onClick={() => setTab('students')}
            className={`px-4 py-2 rounded-xl text-[10px] font-black uppercase transition-all duration-300 ${tab === 'students' ? 'bg-emerald-500 text-black shadow-lg shadow-emerald-500/20' : 'text-zinc-600 hover:text-zinc-400'}`}
          >
            Rutinas
          </button>
        </div>
      </div>

      {/* CONTENIDO: AGENDA */}
      {tab === 'agenda' && (
        <div className="space-y-3 animate-in fade-in duration-500">
          {allBookings.length === 0 ? (
            <p className="text-center py-10 text-zinc-600 font-bold uppercase text-xs">No hay reservas</p>
          ) : (
            allBookings.map((b) => (
      <div key={b.id} className="bg-zinc-900 border border-zinc-800 p-4 rounded-2xl flex justify-between items-center group hover:border-zinc-700 transition-all mb-3 shadow-lg">
    
           {/* IZQUIERDA: USUARIO Y TURNO */}
           <div className="flex flex-col gap-1">
           {/* Nombre del Alumno */}
           <div className="flex items-center gap-2 mb-0.5">
             <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)] animate-pulse" />
             <p className="text-white font-black uppercase text-sm tracking-tight">{b.user_name}</p>
           </div>

           {/* Info del Turno (Fecha y Hora) */}
           <div className="flex items-center gap-3">
             <div className="bg-zinc-950 px-3 py-1 rounded-lg border border-zinc-800 text-zinc-500 font-bold text-[10px] uppercase tracking-wider">
               {new Date(b.booking_date + 'T00:00:00').toLocaleDateString('es-ES', {
                 day: '2-digit',
                 month: 'short',
                 year: 'numeric'
               }).toUpperCase().replace('.', '')}
             </div> 
             <p className="text-emerald-400 font-black text-xl italic uppercase leading-none">
               {b.booking_time} HS
             </p>
           </div>
        </div>

    {/* DERECHA: BOTÓN BORRAR */}
    <button 
      onClick={() => deleteAnyBooking(b.id)} 
      className="bg-zinc-950 border border-zinc-800 hover:border-red-500/50 hover:bg-red-500/10 text-zinc-600 hover:text-red-500 p-3.5 rounded-xl transition-all active:scale-90"
    >
      <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/>
      </svg>
    </button>
  </div>
))
          )}
        </div>
      )}

      {/* CONTENIDO: ALUMNOS */}
      {tab === 'students' && (
        <div className="grid grid-cols-1 gap-3 animate-in fade-in slide-in-from-right-4 duration-500">
          {students.map((s) => (
  <div 
    key={s.id}
    className="bg-zinc-900 border border-zinc-800 p-5 rounded-[2rem] flex justify-between items-center transition-all"
  >
    <div>
      <p className="text-zinc-500 font-bold text-[10px] uppercase tracking-widest mb-1">Cliente</p>
      <p className="text-white font-black text-xl italic tracking-tighter uppercase leading-none">
        {s.full_name || 'Sin nombre'}
      </p>
    </div>
        <button 
         onClick={() => {
         setSelectingId(s.id);
         setTimeout(() => {
         setSelectedStudent({ id: s.id, name: s.full_name || 'Sin nombre' });
         setSelectingId(null);
         }, 300);
         }}
         className={`
         h-10 px-6 rounded-2xl transition-all flex items-center justify-center active:scale-90
         ${selectingId === s.id 
          ? 'bg-emerald-500 text-black shadow-[0_0_15px_rgba(16,185,129,0.4)]' 
          : 'bg-zinc-800 text-white'}
         `}
        >
        <span className="text-[10px] font-black uppercase leading-none tracking-widest pt-[1px]">
        {selectingId === s.id ? 'ABRIENDO...' : 'Rutina'}
        </span>
       </button>
       </div>
       ))}
        </div>
      )}
      <ConfirmModal 
       isOpen={modalOpen}
       title="¿Eliminar Reserva?"
       message="Esta acción no se puede deshacer. El alumno perderá su lugar."
       onConfirm={confirmDelete}
       onCancel={() => setModalOpen(false)}
       confirmText="Eliminar"
      />
    </div>
  );
}