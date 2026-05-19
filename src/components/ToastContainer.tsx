import { useToast } from '../contexts/ToastContext';
import { X, CheckCircle, AlertCircle, Info } from 'lucide-react';

const iconMap = {
  success: CheckCircle,
  error: AlertCircle,
  info: Info,
};

const colorMap = {
  success: 'bg-emerald-50 border-emerald-400 text-emerald-800',
  error: 'bg-red-50 border-red-400 text-red-800',
  info: 'bg-sky-50 border-sky-400 text-sky-800',
};

const iconColorMap = {
  success: 'text-emerald-500',
  error: 'text-red-500',
  info: 'text-sky-500',
};

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm w-full">
      {toasts.map((toast) => {
        const Icon = iconMap[toast.type];
        return (
          <div
            key={toast.id}
            className={`flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in ${colorMap[toast.type]}`}
          >
            <Icon className={`w-5 h-5 mt-0.5 shrink-0 ${iconColorMap[toast.type]}`} />
            <p className="text-sm font-medium flex-1">{toast.message}</p>
            <button
              onClick={() => removeToast(toast.id)}
              className="shrink-0 hover:opacity-70 transition-opacity"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        );
      })}
    </div>
  );
}
