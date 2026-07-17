import { useState } from 'react';
import Modal from './Modal';
import { Printer } from 'lucide-react';

const PrintDateModal = ({ isOpen, onClose, onConfirm, statusOptions = [] }) => {
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [status, setStatus] = useState('all');

  const handleConfirm = (e) => {
    e.preventDefault();
    onConfirm(startDate, endDate, status);
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Imprimir Relatório" size="sm">
      <form onSubmit={handleConfirm} className="space-y-4">
        <p className="text-sm text-gray-500 mb-4">
          Selecione o intervalo de datas e o status para gerar o relatório impresso.
        </p>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Início</label>
            <input
              type="date"
              required
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Data de Fim</label>
            <input
              type="date"
              required
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
            />
          </div>
        </div>

        {statusOptions.length > 0 && (
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-1">Status</label>
            <select
              className="w-full p-2.5 border border-gray-200 rounded-xl focus:outline-none focus:border-rose-300 bg-white"
              value={status}
              onChange={(e) => setStatus(e.target.value)}
            >
              <option value="all">Todos os Status</option>
              {statusOptions.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>
        )}

        <div className="pt-4 flex justify-end gap-3 border-t border-gray-100">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-gray-600 font-semibold hover:bg-gray-100 rounded-xl"
          >
            Cancelar
          </button>
          <button
            type="submit"
            className="flex items-center gap-2 px-5 py-2 bg-rose-400 font-bold text-white rounded-xl hover:bg-rose-500"
          >
            <Printer size={16} />
            Confirmar e Imprimir
          </button>
        </div>
      </form>
    </Modal>
  );
};

export default PrintDateModal;
