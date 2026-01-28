'use client';
import { useEffect } from 'react';

interface SuccessModalProps {
  isOpen: boolean;
  onClose: () => void;
  message: string;
}

export default function SuccessModal({ isOpen, onClose, message }: SuccessModalProps) {
  useEffect(() => {
    if (isOpen) {
      const timer = setTimeout(() => {
        onClose();
      }, 2000); // Se cierra solo a los 2 segundos
      return () => clearTimeout(timer);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[110] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-md animate-in fade-in duration-500" />
      
      <div className="relative bg-zinc-900 border border-emerald-500/30 p-10 rounded-[3rem] shadow-[0_0_50px_rgba(16,185,129,0.2)] flex flex-col items-center animate-in zoom-in-90 duration-300">
        {/* Círculo con el Check */}
        <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mb-6 shadow-[0_0_30px_rgba(16,185,129,0.5)]">
          <svg xmlns="http://www.w3.org/2000/svg" width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12"/>
          </svg>
        </div>
        
        <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white text-center">
          {message}
        </h3>
        <p className="text-emerald-500 font-bold text-[10px] uppercase tracking-[0.3em] mt-2">
          ¡Te esperamos!
        </p>
      </div>
    </div>
  );
}