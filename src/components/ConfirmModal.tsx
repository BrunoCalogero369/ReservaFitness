'use client';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  onConfirm: () => void;
  onCancel: () => void;
  confirmText?: string;
  cancelText?: string;
  isLoading?: boolean;
}

export default function ConfirmModal({
  isOpen,
  title,
  message,
  onConfirm,
  onCancel,
  confirmText = "Confirmar",
  cancelText = "Cancelar",
  isLoading = false
}: ConfirmModalProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Fondo desenfocado y oscuro */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-in fade-in duration-300"
        onClick={onCancel}
      />
      
      {/* Caja del Modal */}
      <div className="relative bg-zinc-900 border border-zinc-800 w-full max-w-sm p-8 rounded-[2.5rem] shadow-[0_0_50px_-12px_rgba(16,185,129,0.2)] animate-in zoom-in-95 duration-200">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-1/3 h-[1px] bg-gradient-to-r from-transparent via-emerald-500/50 to-transparent" />
        <div className="text-center">
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-2">
            {title}
          </h3>
          <p className="text-zinc-400 text-sm font-medium leading-relaxed mb-8 px-2">
            {message}
          </p>
        </div>

        <div className="flex flex-col gap-3">
          <button
            onClick={onConfirm}
            disabled={isLoading}
            className="w-full py-4 bg-white text-black font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all hover:bg-emerald-400"
          >
            {isLoading ? 'Procesando...' : confirmText}
          </button>
          
          <button
            onClick={onCancel}
            disabled={isLoading}
            className="w-full py-4 bg-zinc-800 text-zinc-400 font-black uppercase tracking-widest rounded-2xl active:scale-95 transition-all hover:text-white"
          >
            {cancelText}
          </button>
        </div>
      </div>
    </div>
  );
}