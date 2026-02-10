import React, { useState } from 'react';
import { Task, RecurrenceType, UrgencyType, RECURRENCE_LABELS } from '../types';
import { X, Calendar, Leaf, PenTool, Clipboard, AlertCircle, MessageSquare } from 'lucide-react';

interface TaskFormProps {
  onClose: () => void;
  onSave: (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>) => void;
}

const TaskForm: React.FC<TaskFormProps> = ({ onClose, onSave }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [urgency, setUrgency] = useState<UrgencyType>('medium');
  const [type, setType] = useState<'date' | 'month'>('date');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [month, setMonth] = useState(new Date().getMonth());
  const [category, setCategory] = useState<Task['category']>('general');
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave({
      title,
      description: description.trim() || undefined,
      urgency,
      category,
      recurrence,
      specificDate: type === 'date' ? date : undefined,
      monthReference: type === 'month' ? month : undefined,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-[2rem] shadow-2xl w-full max-w-lg overflow-hidden border-t-8 border-nature-moss">
        <div className="p-6 bg-nature-offWhite border-b border-stone-200 flex justify-between items-center">
          <h2 className="text-2xl font-black text-nature-mossDark flex items-center gap-3">
            <PenTool size={28} /> Nova Tarefa
          </h2>
          <button onClick={onClose} className="p-2 hover:bg-stone-200 rounded-full text-stone-500 transition-colors">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto max-h-[75vh]">
          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">O que fazer?</label>
            <input
              required
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Plantar Milho, Vacinar Gado..."
              className="w-full px-5 py-4 rounded-2xl border-2 border-stone-100 focus:border-nature-moss bg-stone-50 text-lg font-bold outline-none transition-all"
            />
          </div>

          <div>
            <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2 flex items-center gap-2">
              <MessageSquare size={14} /> Detalhes (Opcional)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Ex: Usar 2 sacos de adubo, dosagem de 5ml..."
              className="w-full px-5 py-3 rounded-2xl border-2 border-stone-100 focus:border-nature-moss bg-stone-50 text-sm outline-none transition-all h-24 resize-none"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
             <div>
               <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Urgência</label>
               <select 
                 value={urgency} 
                 onChange={(e) => setUrgency(e.target.value as UrgencyType)}
                 className={`w-full p-3 rounded-xl border-2 font-bold outline-none ${
                    urgency === 'high' ? 'border-red-100 text-red-600 bg-red-50' : 
                    urgency === 'medium' ? 'border-amber-100 text-amber-600 bg-amber-50' : 
                    'border-green-100 text-green-600 bg-green-50'
                 }`}
               >
                 <option value="low">Baixa</option>
                 <option value="medium">Média</option>
                 <option value="high">ALTA (Urgente)</option>
               </select>
             </div>
             <div>
                <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-2">Categoria</label>
                <select 
                  value={category} 
                  onChange={(e) => setCategory(e.target.value as any)}
                  className="w-full p-3 rounded-xl border-2 border-stone-100 bg-stone-50 font-bold outline-none"
                >
                  <option value="planting">Plantio</option>
                  <option value="maintenance">Manutenção</option>
                  <option value="animals">Animais</option>
                  <option value="general">Geral</option>
                </select>
             </div>
          </div>

          <div className="bg-nature-sand/30 p-6 rounded-3xl space-y-4">
            <div className="flex gap-6 pb-2">
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                <input type="radio" checked={type === 'date'} onChange={() => setType('date')} className="w-4 h-4 text-nature-moss" />
                Data Específica
              </label>
              <label className="flex items-center gap-2 cursor-pointer font-bold text-sm">
                <input type="radio" checked={type === 'month'} onChange={() => setType('month')} className="w-4 h-4 text-nature-moss" />
                Por Mês
              </label>
            </div>

            {type === 'date' ? (
              <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-3 rounded-xl border-2 border-white bg-white font-bold outline-none" />
            ) : (
              <select value={month} onChange={(e) => setMonth(Number(e.target.value))} className="w-full p-3 rounded-xl border-2 border-white bg-white font-bold outline-none">
                {Array.from({ length: 12 }).map((_, i) => (
                  <option key={i} value={i}>{new Date(0, i).toLocaleString('pt-BR', { month: 'long' })}</option>
                ))}
              </select>
            )}

            <div>
              <label className="block text-xs font-black uppercase tracking-widest text-stone-400 mb-1">Repetição</label>
              <select
                value={recurrence}
                onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                className="w-full p-3 rounded-xl border-2 border-white bg-white font-bold outline-none"
              >
                {Object.entries(RECURRENCE_LABELS).map(([value, label]) => (
                  <option key={value} value={value}>{label}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="pt-4 flex gap-4">
            <button type="button" onClick={onClose} className="flex-1 py-4 px-4 bg-white border-2 border-stone-100 text-stone-500 font-bold rounded-2xl hover:bg-stone-50 transition-all">Cancelar</button>
            <button type="submit" className="flex-1 py-4 px-4 bg-nature-moss text-white font-black rounded-2xl hover:bg-nature-mossDark shadow-lg shadow-nature-moss/20 transition-all active:scale-95">SALVAR</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskForm;