'use client';

import * as React from 'react';
import { create } from 'zustand';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';
import { cn } from '@/lib/utils';

// --- Store ---

type ToastVariant = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  variant: ToastVariant;
}

interface ToastStore {
  toasts: Toast[];
  addToast: (message: string, variant?: ToastVariant) => void;
  removeToast: (id: string) => void;
}

let toastCounter = 0;

const useToastStore = create<ToastStore>((set) => ({
  toasts: [],
  addToast: (message, variant = 'info') => {
    const id = String(++toastCounter);
    set((state) => ({
      toasts: [...state.toasts, { id, message, variant }],
    }));
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter((t) => t.id !== id),
      }));
    }, 5000);
  },
  removeToast: (id) =>
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    })),
}));

// --- Hook ---

export function useToast() {
  const addToast = useToastStore((s) => s.addToast);

  return React.useMemo(
    () => ({
      success: (message: string) => addToast(message, 'success'),
      error: (message: string) => addToast(message, 'error'),
      info: (message: string) => addToast(message, 'info'),
    }),
    [addToast]
  );
}

// --- Components ---

const variantStyles: Record<ToastVariant, string> = {
  success: 'border-emerald-500/30 bg-emerald-500/10',
  error: 'border-rose-500/30 bg-rose-500/10',
  info: 'border-indigo-500/30 bg-indigo-500/10',
};

const variantIcons: Record<ToastVariant, React.ElementType> = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const variantIconColors: Record<ToastVariant, string> = {
  success: 'text-emerald-400',
  error: 'text-rose-400',
  info: 'text-indigo-400',
};

function ToastItem({ toast }: { toast: Toast }) {
  const removeToast = useToastStore((s) => s.removeToast);
  const Icon = variantIcons[toast.variant];

  return (
    <div
      className={cn(
        'flex items-center gap-3 rounded-lg border px-4 py-3 shadow-lg shadow-black/20',
        'bg-slate-900 backdrop-blur-sm',
        'animate-in slide-in-from-right duration-300',
        variantStyles[toast.variant]
      )}
    >
      <Icon className={cn('h-5 w-5 shrink-0', variantIconColors[toast.variant])} />
      <p className="flex-1 text-sm text-slate-200">{toast.message}</p>
      <button
        onClick={() => removeToast(toast.id)}
        className="shrink-0 rounded-md p-1 text-slate-400 hover:bg-slate-800 hover:text-slate-200 transition-colors"
        aria-label="Dismiss"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}

function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 w-full max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} />
      ))}
    </div>
  );
}

export { ToastContainer };
