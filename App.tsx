import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Layout, 
  List, 
  Sprout, 
  Trash2,
  CalendarDays,
  Menu,
  X,
  Loader2,
  Cloud,
  CloudOff,
  ChevronLeft,
  ChevronRight,
  Sun,
  PenTool,
  AlertTriangle,
  Filter,
  ArrowRight,
  CloudSun
} from 'lucide-react';
import { Task as TaskType, ViewMode, CATEGORY_LABELS, MONTH_NAMES, DailyLog, UrgencyType } from './types';
import { loadTasks, createTask, updateTaskStatus, deleteTaskFromDb, saveDailyLog, getLatestLogs } from './services/storageService';
import { isSupabaseConfigured } from './services/supabaseClient';
import TaskForm from './components/TaskForm';
import AssistantModal from './components/AssistantModal';

const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [logs, setLogs] = useState<DailyLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  
  // Filtros
  const [filterUrgency, setFilterUrgency] = useState<UrgencyType | 'all'>('all');
  const [filterCategory, setFilterCategory] = useState<string | 'all'>('all');

  const [calDate, setCalDate] = useState(new Date());
  const [logInput, setLogInput] = useState('');
  const [isSavingLog, setIsSavingLog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const [tData, lData] = await Promise.all([loadTasks(), getLatestLogs()]);
      setTasks(tData);
      setLogs(lData);
      setLoading(false);
    };
    fetchData();
  }, []);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    const newStatus = !task.isCompleted;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: newStatus } : t));
    await updateTaskStatus(taskId, newStatus);
  };

  const deleteTask = async (taskId: string) => {
    if (window.confirm('Pai, deseja mesmo apagar esta tarefa?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await deleteTaskFromDb(taskId);
    }
  };

  const addTask = async (newTaskData: any) => {
    const createdTask = await createTask(newTaskData);
    if (createdTask) setTasks(prev => [createdTask, ...prev]);
  };

  const handleSaveLog = async () => {
    if (!logInput.trim()) return;
    setIsSavingLog(true);
    await saveDailyLog(logInput);
    const updatedLogs = await getLatestLogs();
    setLogs(updatedLogs);
    setLogInput('');
    setIsSavingLog(false);
  };

  const filteredTasks = useMemo(() => {
    return tasks.filter(t => {
      const matchUrgency = filterUrgency === 'all' || t.urgency === filterUrgency;
      const matchCategory = filterCategory === 'all' || t.category === filterCategory;
      return matchUrgency && matchCategory;
    });
  }, [tasks, filterUrgency, filterCategory]);

  const calendarDays = useMemo(() => {
    const year = calDate.getFullYear();
    const month = calDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);
    return days;
  }, [calDate]);

  const getTasksForDay = (day: number | null) => {
    if (!day) return [];
    const dateStr = `${calDate.getFullYear()}-${String(calDate.getMonth() + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
    return tasks.filter(t => t.specificDate === dateStr);
  };

  const plantingTips = useMemo(() => {
    const month = new Date().getMonth();
    const tips = [
      ["Alface", "Couve", "Rabanete"], ["Cenoura", "Beterraba", "Salsa"],
      ["Brócolis", "Espinafre", "Ervilha"], ["Alho", "Cebola", "Morango"],
      ["Couve-flor", "Repolho", "Feijão"], ["Milho", "Abóbora", "Pepino"],
      ["Batata", "Tomate", "Pimentão"], ["Melancia", "Melão", "Quiabo"],
      ["Berinjela", "Jiló", "Vagem"], ["Arroz", "Amendoim", "Soja"],
      ["Mandioca", "Inhame", "Batata-doce"], ["Girassol", "Gergelim", "Chia"]
    ];
    return tips[month] || ["Hortaliças em geral"];
  }, []);

  const renderTaskCard = (task: TaskType) => {
    const urgencyStyles = {
      high: 'border-l-red-500 bg-red-50/30',
      medium: 'border-l-nature-moss bg-white',
      low: 'border-l-stone-300 bg-white'
    };

    return (
      <div key={task.id} className={`group p-5 rounded-2xl border-2 border-stone-100 transition-all duration-300 hover:shadow-xl hover:scale-[1.01] flex flex-col gap-3 border-l-8 ${task.isCompleted ? 'opacity-50 grayscale border-l-stone-200' : urgencyStyles[task.urgency]}`}>
        <div className="flex items-start gap-4">
          <button onClick={() => toggleTask(task.id)} className={`mt-1 transition-transform active:scale-75 ${task.isCompleted ? 'text-nature-moss' : 'text-stone-300 hover:text-nature-moss'}`}>
            {task.isCompleted ? <CheckCircle2 size={32} /> : <Circle size={32} />}
          </button>
          
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <h3 className={`font-black text-xl leading-tight ${task.isCompleted ? 'line-through text-stone-400' : 'text-stone-800'}`}>
                {task.title}
              </h3>
              <button onClick={() => deleteTask(task.id)} className="text-stone-300 hover:text-red-500 transition-opacity opacity-0 group-hover:opacity-100 p-1">
                <Trash2 size={20} />
              </button>
            </div>
            
            {task.description && !task.isCompleted && (
              <p className="text-sm text-stone-600 mt-2 bg-white/50 p-2 rounded-lg border border-dashed border-stone-200 italic">
                {task.description}
              </p>
            )}

            <div className="flex flex-wrap gap-2 mt-3">
              <span className="text-[10px] font-black uppercase text-nature-earth bg-nature-sand px-3 py-1 rounded-full shadow-sm">{CATEGORY_LABELS[task.category]}</span>
              {task.urgency === 'high' && !task.isCompleted && (
                <span className="text-[10px] font-black uppercase text-red-600 bg-red-100 px-3 py-1 rounded-full flex items-center gap-1">
                  <AlertTriangle size={10} /> Urgente
                </span>
              )}
              {task.specificDate && <span className="text-[10px] font-black text-stone-500 bg-stone-100 px-3 py-1 rounded-full">{new Date(task.specificDate + 'T12:00:00').toLocaleDateString('pt-BR')}</span>}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-nature-offWhite text-stone-800 font-sans flex flex-col lg:flex-row">
      {/* Mobile Nav */}
      <div className="lg:hidden bg-nature-mossDark text-white p-5 flex justify-between items-center sticky top-0 z-30 shadow-lg">
        <span className="font-black text-xl flex items-center gap-3"><Sprout size={24} /> Agenda do Pai</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-3 bg-white/10 rounded-xl">{mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}</button>
      </div>

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 left-0 z-40 w-80 bg-nature-mossDark text-nature-sand flex flex-col transition-transform duration-500 ease-in-out ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}`}>
        <div className="p-10 hidden lg:block">
          <h1 className="text-3xl font-black tracking-tighter flex items-center gap-4"><Sprout className="text-nature-moss" size={40} /> Agenda Rural</h1>
          <p className="text-nature-sand/30 text-[10px] mt-2 uppercase font-black tracking-[0.3em]">Gestão de Chácara</p>
        </div>
        
        <nav className="flex-1 px-6 space-y-3 py-6">
          <button onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all font-black text-lg ${view === 'dashboard' ? 'bg-nature-moss text-white shadow-xl scale-[1.02]' : 'hover:bg-white/5 text-stone-500'}`}><Layout size={28} /> Painel</button>
          <button onClick={() => { setView('calendar'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all font-black text-lg ${view === 'calendar' ? 'bg-nature-moss text-white shadow-xl scale-[1.02]' : 'hover:bg-white/5 text-stone-500'}`}><CalendarIcon size={28} /> Calendário</button>
          <button onClick={() => { setView('tasks'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-5 px-6 py-5 rounded-[1.5rem] transition-all font-black text-lg ${view === 'tasks' ? 'bg-nature-moss text-white shadow-xl scale-[1.02]' : 'hover:bg-white/5 text-stone-500'}`}><List size={28} /> Ver Tudo</button>
        </nav>

        <div className="p-8 space-y-6">
          <button onClick={() => setIsAssistantOpen(true)} className="w-full flex items-center justify-center gap-4 bg-nature-earth text-white py-5 rounded-[2rem] shadow-2xl hover:bg-[#7a6845] active:scale-95 transition-all font-black border-b-8 border-[#6a5b3d]"><Sprout size={32} /> Conversar com Agrônomo</button>
          <div className="flex items-center gap-4 px-6 py-4 bg-black/30 rounded-2xl">
            {isSupabaseConfigured ? <Cloud className="text-green-400" size={20} /> : <CloudOff className="text-amber-400" size={20} />}
            <span className="text-[10px] uppercase font-black tracking-widest text-stone-400">{isSupabaseConfigured ? 'Seguro na Nuvem' : 'Apenas no Celular'}</span>
          </div>
        </div>
      </aside>

      {/* Backdrop */}
      {mobileMenuOpen && <div className="fixed inset-0 bg-black/60 z-30 lg:hidden" onClick={() => setMobileMenuOpen(false)}></div>}

      {/* Main */}
      <main className="flex-1 overflow-y-auto p-6 lg:p-12">
        <div className="max-w-4xl mx-auto space-y-12">
          {loading ? (
            <div className="h-[70vh] flex flex-col items-center justify-center text-stone-400">
              <Loader2 className="animate-spin mb-6 text-nature-moss" size={64} />
              <p className="font-black text-2xl uppercase tracking-widest">Organizando a lida...</p>
            </div>
          ) : (
            <>
              {view === 'dashboard' && (
                <div className="space-y-12 animate-fade-in">
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Clima Mock */}
                    <div className="bg-gradient-to-br from-sky-400 to-blue-500 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
                       <div className="flex justify-between items-start">
                          <div>
                            <p className="text-white/60 font-black text-[10px] uppercase tracking-widest">Clima na Chácara</p>
                            <h4 className="text-4xl font-black">28°C</h4>
                          </div>
                          <CloudSun size={48} className="text-white/80" />
                       </div>
                       <p className="font-bold text-sm mt-4">Sol entre nuvens.<br/>Ideal para limpeza.</p>
                    </div>

                    <div className="bg-nature-mossDark p-8 rounded-[2.5rem] text-white shadow-xl md:col-span-2 relative overflow-hidden">
                       <div className="relative z-10">
                         <h2 className="text-4xl font-black mb-4 tracking-tighter">Bom dia, pai!</h2>
                         <p className="text-nature-sand/60 font-bold max-w-xs">Temos {tasks.filter(t => t.urgency === 'high' && !t.isCompleted).length} coisas urgentes hoje.</p>
                         <button onClick={() => setView('tasks')} className="mt-6 flex items-center gap-2 bg-nature-moss px-6 py-3 rounded-2xl font-black text-sm hover:gap-4 transition-all uppercase tracking-widest">Ver Urgências <ArrowRight size={18}/></button>
                       </div>
                       <Sprout size={180} className="absolute -bottom-10 -right-10 opacity-10 rotate-12" />
                    </div>
                  </div>

                  {/* Diário Compacto */}
                  <div className="bg-white p-8 rounded-[2.5rem] border-2 border-stone-100 shadow-sm space-y-6">
                    <div className="flex items-center gap-4 text-nature-mossDark">
                      <div className="p-3 bg-nature-sand rounded-2xl"><PenTool size={28} /></div>
                      <div>
                        <h3 className="font-black text-xl">O que aconteceu hoje?</h3>
                        <p className="text-stone-400 text-xs font-bold uppercase tracking-widest">Diário de Observações</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <input 
                        value={logInput}
                        onChange={(e) => setLogInput(e.target.value)}
                        placeholder="Ex: Começamos a colheita, choveu granizo..." 
                        className="flex-1 bg-stone-50 border-2 border-stone-100 rounded-[1.5rem] px-6 py-4 text-lg font-bold focus:border-nature-moss outline-none transition-all"
                      />
                      <button 
                        onClick={handleSaveLog}
                        disabled={isSavingLog || !logInput.trim()}
                        className="px-8 bg-nature-earth text-white rounded-[1.5rem] font-black active:scale-95 disabled:opacity-50 transition-all shadow-lg shadow-nature-earth/20"
                      >
                        {isSavingLog ? '...' : 'SALVAR'}
                      </button>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-6">
                      {logs.slice(0, 4).map(log => (
                        <div key={log.id} className="text-xs bg-stone-50 p-4 rounded-2xl flex flex-col gap-2 border-l-4 border-nature-earth shadow-sm">
                          <p className="text-stone-800 font-bold leading-relaxed">"{log.content}"</p>
                          <span className="text-stone-400 font-black uppercase text-[9px]">{new Date(log.log_date + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: 'long' })}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Urgentes */}
                  <section>
                    <div className="flex justify-between items-center mb-6">
                       <h2 className="text-2xl font-black text-nature-mossDark flex items-center gap-3"><AlertTriangle className="text-red-500" /> Coisas Urgentes</h2>
                    </div>
                    <div className="space-y-4">
                      {tasks.filter(t => t.urgency === 'high' && !t.isCompleted).length > 0 ? (
                        tasks.filter(t => t.urgency === 'high' && !t.isCompleted).map(renderTaskCard)
                      ) : (
                        <div className="py-12 border-4 border-dashed border-stone-100 rounded-[2.5rem] text-center text-stone-300 font-black uppercase tracking-widest">Tudo tranquilo por enquanto!</div>
                      )}
                    </div>
                  </section>
                </div>
              )}

              {view === 'calendar' && (
                <div className="bg-white rounded-[3rem] border-2 border-stone-100 shadow-2xl overflow-hidden animate-fade-in">
                  <div className="bg-nature-mossDark p-10 flex flex-col sm:flex-row justify-between items-center gap-6 text-white">
                    <h2 className="text-4xl font-black capitalize tracking-tighter">{MONTH_NAMES[calDate.getMonth()]} {calDate.getFullYear()}</h2>
                    <div className="flex gap-3">
                      <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() - 1))} className="p-4 hover:bg-white/10 rounded-2xl transition-all"><ChevronLeft size={32} /></button>
                      <button onClick={() => setCalDate(new Date())} className="px-8 py-3 bg-white text-nature-mossDark rounded-2xl font-black text-sm uppercase tracking-widest shadow-lg">Hoje</button>
                      <button onClick={() => setCalDate(new Date(calDate.getFullYear(), calDate.getMonth() + 1))} className="p-4 hover:bg-white/10 rounded-2xl transition-all"><ChevronRight size={32} /></button>
                    </div>
                  </div>
                  <div className="p-8">
                    <div className="grid grid-cols-7 mb-6">
                      {['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB'].map(d => (
                        <div key={d} className="text-center text-[10px] font-black text-stone-400 tracking-[0.2em]">{d}</div>
                      ))}
                    </div>
                    <div className="grid grid-cols-7 gap-4">
                      {calendarDays.map((day, i) => (
                        <div key={i} className={`aspect-square rounded-[2rem] border-2 flex flex-col items-center justify-center relative transition-all ${day ? 'border-stone-50 bg-stone-50/50 hover:bg-white hover:shadow-xl hover:scale-110 cursor-pointer' : 'border-transparent'}`}>
                          {day && (
                            <>
                              <span className="font-black text-xl text-stone-700">{day}</span>
                              <div className="flex gap-1 mt-2">
                                {getTasksForDay(day).slice(0, 3).map((t, idx) => (
                                  <div key={idx} className={`w-2 h-2 rounded-full ${t.urgency === 'high' ? 'bg-red-500' : 'bg-nature-moss'}`}></div>
                                ))}
                              </div>
                            </>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {view === 'tasks' && (
                <div className="space-y-8 animate-fade-in">
                  <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
                    <h2 className="text-5xl font-black text-nature-mossDark tracking-tighter">Tarefas</h2>
                    
                    {/* Filtros */}
                    <div className="flex flex-wrap gap-2">
                       <select 
                         value={filterUrgency} 
                         onChange={(e) => setFilterUrgency(e.target.value as any)}
                         className="bg-white border-2 border-stone-100 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-nature-moss"
                       >
                         <option value="all">Todas Urgências</option>
                         <option value="high">Apenas URGENTE</option>
                         <option value="medium">Média Prioridade</option>
                         <option value="low">Baixa Prioridade</option>
                       </select>
                       <select 
                         value={filterCategory} 
                         onChange={(e) => setFilterCategory(e.target.value)}
                         className="bg-white border-2 border-stone-100 rounded-xl px-4 py-2 text-xs font-black uppercase outline-none focus:border-nature-moss"
                       >
                         <option value="all">Todas Categorias</option>
                         <option value="planting">Plantio</option>
                         <option value="maintenance">Manutenção</option>
                         <option value="animals">Animais</option>
                       </select>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {filteredTasks.length > 0 ? (
                      filteredTasks.map(renderTaskCard)
                    ) : (
                      <div className="py-20 text-center bg-white rounded-[2.5rem] border-2 border-dashed border-stone-100">
                        <Filter className="mx-auto text-stone-200 mb-4" size={48} />
                        <p className="text-stone-400 font-black uppercase tracking-widest">Nenhuma tarefa encontrada com esses filtros.</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* FAB Principal */}
        <button onClick={() => setIsFormOpen(true)} className="fixed bottom-10 right-10 w-20 h-20 bg-nature-moss text-white rounded-[2rem] shadow-2xl flex items-center justify-center hover:scale-110 hover:rotate-90 active:scale-90 transition-all z-50 border-b-8 border-nature-mossDark">
          <Plus size={48} />
        </button>
      </main>

      {/* Modais */}
      {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} onSave={addTask} />}
      {isAssistantOpen && <AssistantModal onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};

export default App;