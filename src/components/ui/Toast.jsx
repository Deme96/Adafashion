// ========== MODARE Toast Component ==========
import { useEffect, useState } from 'react';
import { CheckCircle, XCircle, Info, AlertTriangle, X } from 'lucide-react';

const icons = {
  success: <CheckCircle size={20} className="text-green-500" />,
  error: <XCircle size={20} className="text-red-500" />,
  info: <Info size={20} className="text-blue-500" />,
  warning: <AlertTriangle size={20} className="text-yellow-500" />,
};

const bgColors = {
  success: 'bg-green-50 border-green-200',
  error: 'bg-red-50 border-red-200',
  info: 'bg-blue-50 border-blue-200',
  warning: 'bg-yellow-50 border-yellow-200',
};

const ToastContainer = ({ toasts, removeToast }) => {
  if (!toasts.length) return null;

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`toast-enter flex items-center gap-3 px-4 py-3 rounded-xl border shadow-lg ${bgColors[toast.type] || bgColors.info}`}
        >
          {icons[toast.type] || icons.info}
          <span className="flex-1 text-sm font-medium text-gray-800">{toast.message}</span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-1 rounded-lg hover:bg-black/5 transition-colors"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      ))}
    </div>
  );
};

const GlobalToast = () => {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    let toastId = 0;

    const addToast = (message, type = 'info', duration = 4000) => {
      const id = ++toastId;
      setToasts(prev => [...prev, { id, message, type }]);
      window.setTimeout(() => {
        setToasts(prev => prev.filter(item => item.id !== id));
      }, duration);
    };

    const handleNotification = (event) => {
      const { message, type, duration } = event.detail || {};
      if (message) {
        addToast(message, type, duration);
      }
    };

    window.addEventListener('adafashion:toast', handleNotification);
    return () => window.removeEventListener('adafashion:toast', handleNotification);
  }, []);

  const removeToast = (id) => {
    setToasts(prev => prev.filter(item => item.id !== id));
  };

  return <ToastContainer toasts={toasts} removeToast={removeToast} />;
};

export default GlobalToast;
