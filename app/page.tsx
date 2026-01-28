'use client';
import { useState, useEffect, useCallback } from 'react';
import { User } from '@supabase/supabase-js'; 
import { supabase } from '../src/lib/supabase'; 
import { useAppSelector, useAppDispatch } from '../src/lib/hooks';
import { setService, setProfessional, resetBooking } from '../src/lib/features/booking/bookingSlice';

// IMPORTACIÓN DE COMPONENTES
import CalendarSelector from '../src/components/CalendarSelector';
import TimeSelector from '../src/components/TimeSelector';
import AuthModal from '../src/components/AuthModal'; 
import MyBookings from '../src/components/MyBookings';
import AdminDashboard from '../src/components/AdminDashboard'; 
import OnboardingModal from '../src/components/OnboardingModal'; 
import SuccessModal from '../src/components/SuccessModal';

// CASTEOS PARA TYPESCRIPT
const CalendarStep = CalendarSelector as React.FC<{ onSelect: () => void }>;
const TimeStep = TimeSelector as React.FC<{ onSelect: () => void }>;
const ADMIN_EMAILS = ['bmxbrunito@gmail.com'];

export default function Home() {
  const dispatch = useAppDispatch();
  
  // ESTADOS PRINCIPALES
  const [step, setStep] = useState(3); // Paso 3 = Calendario
  const [user, setUser] = useState<User | null>(null);
  const [profileName, setProfileName] = useState<string | null>(null); 
  const [checkingProfile, setCheckingProfile] = useState(true);
  const [view, setView] = useState<'booking' | 'my-bookings'>('booking'); 
  const booking = useAppSelector((state) => state.booking);
  const [showSuccess, setShowSuccess] = useState(false);

  // NAVEGACIÓN
  const nextStep = () => setStep((prev) => prev + 1);
  const prevStep = () => setStep((prev) => prev - 1);

  // DETECTAR SI EL USUARIO ES ADMIN
  const isAdmin = user && ADMIN_EMAILS.includes(user.email || '');

  /**
   * FUNCIÓN DE LOGOUT SEGURA
   */
  const handleLogout = useCallback(async () => {
    try {
      await supabase.auth.signOut(); // Sin paréntesis extra
      dispatch(resetBooking());
      setUser(null);
      setProfileName(null);
      setView('booking');
      setStep(3);
      localStorage.clear();
      window.location.href = '/';
    } catch (error) {
      console.error("Error logout:", error);
      window.location.href = '/';
    }
  }, [dispatch]);

  /**
   * CARGA DE PERFIL Y SESIÓN (Optimizada 2026)
   */
  const loadProfile = useCallback(async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .single();

      if (!error && data) {
        setProfileName(data.full_name);
      }
    } catch (error) {
      console.error("Error cargando perfil", error);
    }
  }, []);

  useEffect(() => {
    let isMounted = true;

    const checkSession = async () => {
      try {
        // Usamos getUser para validar contra el servidor de auth (más seguro)
        const { data: { user: currentUser }, error } = await supabase.auth.getUser();
        
        if (isMounted) {
            if (currentUser && !error) {
            setUser(currentUser);
            await loadProfile(currentUser.id);
            } else {
            setUser(null);
            }
            setCheckingProfile(false);
        }
      } catch (error) {
        console.error("Error check session", error);
        if (isMounted) setCheckingProfile(false);
      }
    };

    checkSession();

    // LISTENER DE AUTH: Maneja Login, Logout y Refresco de Token (suspensión de PC)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      console.log("Auth Event:", event);
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          setUser(session.user);
          loadProfile(session.user.id);
        }
      } else if (event === 'SIGNED_OUT') {
        setUser(null);
        setProfileName(null);
        setCheckingProfile(false);
      }
    });

    // LISTENER DE VISIBILIDAD: Solo revalida, no rompe el cliente
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        console.log("Pestaña visible, verificando sesión...");
        supabase.auth.getUser().then(({ data }) => {
           if (data.user) setUser(data.user);
        });
      }
    };
    window.addEventListener('visibilitychange', handleVisibility);

    return () => {
      isMounted = false;
      subscription.unsubscribe();
      window.removeEventListener('visibilitychange', handleVisibility);
    };
  }, [loadProfile]);

  // SETEO DE DATOS POR DEFECTO
  useEffect(() => {
    if (user) {
      dispatch(setService("Entrenamiento Personalizado"));
      dispatch(setProfessional("Pamela"));
    }
  }, [user, dispatch]);

  /**
   * GUARDADO DE RESERVA
   */
const handleConfirmBooking = async () => {
    if (!user) return;
    if (!booking.date || !booking.time) {
      alert("Por favor, seleccioná fecha y hora.");
      return;
    }

    try {
      const { error } = await supabase.from('bookings').insert({
        service: booking.service || "Entrenamiento Personalizado",
        professional: booking.professional || "Pamela",
        booking_date: booking.date,
        booking_time: booking.time,
        user_id: user.id
      });

      if (error) throw error;

      // 1. Activamos el modal de éxito
      setShowSuccess(true);
      
      // 2. Limpiamos el estado de la reserva inmediatamente
      dispatch(resetBooking());

      // NOTA: El cambio de vista (setView) lo haremos en el onClose del modal
      // para que el usuario tenga tiempo de ver el mensaje de éxito.

    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : "Error desconocido";
      console.error("Error en reserva:", errorMessage);
      alert('Error al reservar: ' + errorMessage);
    }
  };

  // Pantalla de carga inicial (Efecto)
  if (checkingProfile) {
    return (
      <div className="min-h-screen bg-zinc-950 flex items-center justify-center">
        <h1 className="font-black italic text-emerald-500 animate-pulse text-2xl tracking-widest">PAMELA AVALLE...</h1>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-zinc-950 text-white overflow-hidden font-sans">
      <div className="max-w-xl mx-auto px-4 pt-10">
        
        {!user ? (
          <div className="flex flex-col items-center justify-center min-h-[70vh] animate-in fade-in duration-700">
             <h1 className="text-5xl font-black italic tracking-tighter mb-10">PAMELA AVALLE</h1>
             <AuthModal />
          </div>
        ) : (
          <>
            {/* Registro de nombre para alumnos nuevos */}
            {!profileName && !isAdmin && (
              <OnboardingModal userId={user.id} onComplete={(name) => setProfileName(name)} />
            )}

            {/* HEADER */}
            <header className="mb-8 flex items-center justify-between bg-zinc-900/40 p-3 rounded-2xl border border-zinc-800/50 shadow-xl">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-zinc-800 flex items-center justify-center font-black text-emerald-500 overflow-hidden border-2 border-emerald-500/20 shadow-lg">
                  {user?.user_metadata?.avatar_url ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={user.user_metadata.avatar_url} alt="profile" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-sm">{(profileName || 'U').charAt(0).toUpperCase()}</span>
                  )}
                </div>
                
                <div className="flex flex-col">
                  <span className="text-[8px] text-emerald-500 font-black uppercase tracking-[0.2em] leading-none mb-1">
                    {isAdmin ? 'ADMIN MAESTRO' : 'ALUMNO'}
                  </span>
                  <p className="text-xs font-black text-white truncate max-w-[120px]">
                    {profileName || user?.email?.split('@')[0]}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                {!isAdmin ? (
                  <button 
                    onClick={() => { setView(view === 'booking' ? 'my-bookings' : 'booking'); setStep(3); }}
                    className="bg-white text-black text-[10px] font-black px-4 py-2 rounded-xl hover:scale-105 transition-all active:scale-95 shadow-md"
                  >
                    {view === 'booking' ? 'MIS TURNOS' : 'CALENDARIO'}
                  </button>
                ) : (
                  <div className="bg-emerald-500 text-black px-3 py-1.5 rounded-lg">
                    <p className="text-[9px] font-black uppercase tracking-widest">LIVE</p>
                  </div>
                )}

                {/* Botón de logout */}
                <button 
                  onClick={handleLogout} 
                  className="p-2.5 bg-zinc-800/50 text-zinc-500 hover:text-red-500 rounded-xl transition-all active:scale-90"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
                    <polyline points="16 17 21 12 16 7"/>
                    <line x1="21" y1="12" x2="9" y2="12"/>
                  </svg>
                </button>
              </div>
            </header>

            {/* VISTAS PRINCIPALES */}
            {view === 'my-bookings' ? (
              <MyBookings userId={user.id} />
            ) : isAdmin ? (
              <AdminDashboard adminEmail={user.email || ''} />
            ) : (
              /* FLUJO DE RESERVA */
              <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                {step > 3 && (
                  <button 
                    onClick={prevStep} 
                    className="mb-4 text-zinc-500 hover:text-white text-[10px] font-black flex items-center gap-1 transition-all uppercase tracking-widest"
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
                    Atrás
                  </button>
                )}

                <div className="relative w-full max-w-md mx-auto overflow-hidden"> 
                  <div 
                    className="flex transition-transform duration-500 ease-in-out" 
                    style={{ transform: `translateX(-${(step - 3) * 100}%)`, width: '100%' }}
                  >
                    {/* PASO 3: CALENDARIO */}
                    <div className={`w-full flex-shrink-0 transition-opacity duration-300 ${step !== 3 ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                      <CalendarStep onSelect={nextStep} />
                    </div>

                    {/* PASO 4: HORARIOS */}
                    <div className={`w-full flex-shrink-0 transition-opacity duration-300 ${step !== 4 ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                      <TimeStep onSelect={nextStep} />
                    </div>

                    {/* PASO 5: RESUMEN */}
                    <div className={`w-full flex-shrink-0 transition-opacity duration-300 pt-6 px-4 ${step !== 5 ? 'pointer-events-none opacity-0' : 'opacity-100'}`}>
                      <div className="text-center">
                        <div className="bg-emerald-500/10 border border-emerald-500/20 py-2 px-4 rounded-full inline-block mb-6">
                          <p className="text-emerald-500 text-[10px] font-black tracking-widest uppercase">Confirmá tu entrenamiento</p>
                        </div>

                        <div className="bg-zinc-900 p-8 rounded-[3rem] border border-zinc-800 text-left space-y-4 shadow-2xl relative overflow-hidden">
                          <div className="absolute right-0 top-0 p-6 opacity-10">
                            <svg xmlns="http://www.w3.org/2000/svg" width="80" height="80" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 20V10"/><path d="M12 20V4"/><path d="M6 20v-6"/></svg>
                          </div>
                          <p className="font-black text-2xl italic tracking-tighter uppercase leading-tight">{booking.service}</p>
                          <hr className="border-zinc-800" />
                          <div className="space-y-1">
                            <p className="text-zinc-500 text-[10px] font-black uppercase tracking-widest">Fecha y Hora</p>
                            <p className="text-emerald-400 font-black text-xl italic uppercase">
                              {booking.date ? new Date(booking.date + 'T00:00:00').toLocaleDateString('es-ES', { weekday: 'long', day: 'numeric', month: 'long' }) : ''}
                            </p>
                            <p className="text-white font-black text-5xl tracking-tighter italic">
                              {booking.time} HS
                            </p>
                          </div>
                        </div>

                        <button 
                          onClick={handleConfirmBooking}
                          className="w-full bg-emerald-500 text-black font-black py-6 rounded-3xl mt-8 hover:bg-emerald-400 active:scale-95 transition-all shadow-[0_20px_40px_rgba(16,185,129,0.2)] text-lg"
                        >
                          CONFIRMAR TURNO
                        </button>
                      </div>
                    </div>
                  </div> 
                </div> 
              </div>
            )}
          </>
        )}
        <SuccessModal 
        isOpen={showSuccess} 
        message="¡Turno Confirmado!" 
        onClose={() => {
        setShowSuccess(false);
        setStep(3);           // Volvemos al inicio del flujo
        setView('my-bookings'); // Lo mandamos a ver sus turnos
        }} 
        />
      </div>
    </main>
  );
}