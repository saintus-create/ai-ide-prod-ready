import { XMarkIcon } from '@heroicons/react/24/outline';
import { useToast } from '@/hooks/useToast';

export default function ToastContainer() {
  const { toasts, removeToast } = useToast();

  const getToastStyles = (type: string) => {
    switch (type) {
      case 'success':
        return 'bg-green-600 text-white';
      case 'error':
        return 'bg-red-600 text-white';
      case 'info':
      default:
        return 'bg-blue-600 text-white';
    }
  };

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 px-4 py-2 rounded shadow-lg ${getToastStyles(toast.type)} min-w-[300px]`}
        >
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="text-white/80 hover:text-white transition-colors"
          >
            <XMarkIcon className="w-4 h-4" />
          </button>
        </div>
      ))}
    </div>
  );
}