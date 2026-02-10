import React, { useState } from 'react';
import { getFarmingAdvice } from '../services/geminiService';
import { Sprout, X, Send, Sparkles, Loader2 } from 'lucide-react';

interface AssistantModalProps {
  onClose: () => void;
}

const AssistantModal: React.FC<AssistantModalProps> = ({ onClose }) => {
  const [query, setQuery] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setResponse('');
    const result = await getFarmingAdvice(query);
    setResponse(result);
    setLoading(false);
  };

  return (
    <div className="fixed inset-0 bg-nature-mossDark/80 backdrop-blur-sm flex items-center justify-center z-50 p-4">
      <div className="bg-nature-offWhite rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="bg-nature-moss p-6 flex justify-between items-start text-white">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <Sprout className="text-nature-sand" /> Agrônomo Virtual
            </h2>
            <p className="text-nature-sand/80 text-sm mt-1">Tire suas dúvidas sobre plantio e manejo.</p>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-white/20 rounded-full transition">
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {response ? (
            <div className="prose prose-stone max-w-none">
              <div className="bg-white p-5 rounded-xl border border-stone-200 shadow-sm">
                 <div className="flex items-center gap-2 text-nature-moss font-semibold mb-2">
                    <Sparkles size={18} /> Resposta:
                 </div>
                 <div className="text-stone-700 whitespace-pre-wrap leading-relaxed">
                   {response}
                 </div>
              </div>
              <button 
                onClick={() => setResponse('')} 
                className="text-nature-moss text-sm font-medium hover:underline mt-4"
              >
                Fazer outra pergunta
              </button>
            </div>
          ) : (
            <div className="text-center py-10 text-stone-400">
               <Sprout size={48} className="mx-auto mb-4 opacity-20" />
               <p>Pergunte sobre:</p>
               <ul className="text-sm mt-2 space-y-1">
                 <li>"Qual a melhor época para plantar cenoura?"</li>
                 <li>"Como combater pulgões na couve?"</li>
                 <li>"Cuidados básicos com galinhas poedeiras"</li>
               </ul>
            </div>
          )}
        </div>

        {/* Input Area */}
        {!response && (
          <div className="p-4 bg-white border-t border-stone-200">
            <div className="relative">
              <textarea
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Digite sua dúvida aqui..."
                className="w-full pl-4 pr-12 py-3 rounded-xl border border-stone-300 focus:ring-2 focus:ring-nature-moss focus:border-nature-moss resize-none h-24 bg-stone-50"
              />
              <button
                onClick={handleAsk}
                disabled={loading || !query.trim()}
                className="absolute bottom-3 right-3 p-2 bg-nature-moss text-white rounded-lg hover:bg-nature-mossDark disabled:opacity-50 disabled:cursor-not-allowed transition-all"
              >
                {loading ? <Loader2 size={20} className="animate-spin" /> : <Send size={20} />}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AssistantModal;