import React, { useState } from 'react';
import { Task, RecurrenceType } from '../types';
import { X, Calendar, Leaf, PenTool, Clipboard } from 'lucide-react';

interface TaskFormProps {
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [type, setType] = useState<'date' | 'month'>('date');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [category, setCategory] = useState<Task['category']>('general');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      category,
      recurrence,
      specificDate: type === 'date' ? date : undefined,
      monthReference: type === 'month' ? month : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden border-t-4 border-nature-moss">
        <div className="p-4 bg-nature-offWhite border-b border-stone-200 flex justify-between items-center">
          <h2 className="text-xl font-bold text-nature-mossDark flex items-center gap-2">
            <PenTool size={20} /> Nova Tarefa
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-500">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-stone-700 mb-1">O que precisa ser feito?</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Consertar a cerca, Plantar milho..."
              className="w-full px-4 py-3 rounded-lg border border-stone-300 focus:ring-2 focus:ring-nature-moss focus:border-nature-moss bg-nature-offWhite text-lg"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-stone-700 mb-2">Categoria</label>
            <div className="grid grid-cols-2 gap-2">
              {[
                { id: 'planting', label: 'Plantio', icon: Leaf },
                { id: 'maintenance', label: 'Manutenção', icon: PenTool },
                { id: 'animals', label: 'Animais', icon: Clipboard }, // Using Clipboard as generic generic
                { id: 'general', label: 'Geral', icon: Calendar },
              ].map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setCategory(cat.id as any)}
                  className={`flex items-center justify-center gap-2 p-3 rounded-lg border transition-all ${
                    category === cat.id
                      ? 'bg-nature-moss text-white border-nature-moss'
                      : 'bg-white text-stone-600 border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <cat.icon size={16} />
                  <span>{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="bg-nature-sand/50 p-4 rounded-xl space-y-4">
            <div className="flex gap-4 border-b border-nature-earth/20 pb-2">
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'date'}
                  onChange={() => setType('date')}
                  className="text-nature-moss focus:ring-nature-moss"
                />
                <span className="text-stone-800">Data Exata</span>
              </label>
              <label className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  checked={type === 'month'}
                  onChange={() => setType('month')}
                  className="text-nature-moss focus:ring-nature-moss"
                />
                <span className="text-stone-800">Sazonal (Mês)</span>
              </label>
            </div>

            {type === 'date' ? (
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Data</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2 rounded-md border border-stone-300 bg-white"
                />
              </div>
            ) : (
              <div>
                <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Mês de Referência</label>
                <select
                  value={month}
                  onChange={(e) => setMonth(Number(e.target.value))}
                  className="w-full p-2 rounded-md border border-stone-300 bg-white"
                >
                  {Array.from({ length: 12 }).map((_, i) => (
                    <option key={i} value={i}>
                      {new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}
                    </option>
                  ))}
                </select>
              </div>
            )}

            <div>
              <label className="block text-xs uppercase font-bold text-stone-500 mb-1">Repetição</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full p-2 rounded-md border border-stone-300 bg-white"
              >
                <option value="none">Não repetir</option>
                <option value="monthly">Todo mês</option>
                <option value="yearly">Todo ano</option>
              </select>
            </div>
          </div>

          <div className="pt-2 flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-3 px-4 bg-white border border-stone-300 text-stone-700 font-medium rounded-xl hover:bg-stone-50 transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              className="flex-1 py-3 px-4 bg-nature-moss text-white font-medium rounded-xl hover:bg-nature-mossDark shadow-md transition-colors"
            >
              Salvar Tarefa
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;