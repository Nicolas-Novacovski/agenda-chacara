import React, { useState, useEffect, useMemo } from 'react';
import { 
  Calendar as CalendarIcon, 
  CheckCircle2, 
  Circle, 
  Plus, 
  Layout, 
  List, 
  ChevronLeft, 
  ChevronRight, 
  Sprout, 
  Trash2,
  CalendarDays,
  Menu,
  X,
  Loader2
} from 'lucide-react';
import { Task as TaskType, ViewMode, MONTH_NAMES, CATEGORY_LABELS } from './types';
import { loadTasks, createTask, updateTaskStatus, deleteTaskFromDb } from './services/storageService';
import TaskForm from './components/TaskForm';
import AssistantModal from './components/AssistantModal';

const isTaskRelevantForDate = (task: TaskType, targetDate: Date): boolean => {
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  if (task.monthReference !== undefined) {
    return task.monthReference === targetMonth;
  }

  if (task.specificDate) {
    const taskDate = new Date(task.specificDate + 'T12:00:00');
    if (taskDate.getMonth() === targetMonth && taskDate.getFullYear() === targetYear) return true;
    if (task.recurrence === 'monthly') return taskDate <= new Date(targetYear, targetMonth + 1, 0);
    if (task.recurrence === 'yearly') return taskDate.getMonth() === targetMonth;
  }

  return false;
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const fetchTasks = async () => {
      setLoading(true);
      const data = await loadTasks();
      setTasks(data);
      setLoading(false);
    };
    fetchTasks();
  }, []);

  const toggleTask = async (taskId: string) => {
    const task = tasks.find(t => t.id === taskId);
    if (!task) return;
    
    const newStatus = !task.isCompleted;
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, isCompleted: newStatus } : t));
    await updateTaskStatus(taskId, newStatus);
  };

  const deleteTask = async (taskId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta tarefa?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
      await deleteTaskFromDb(taskId);
    }
  };

  const addTask = async (newTaskData: any) => {
    const createdTask = await createTask(newTaskData);
    if (createdTask) {
      setTasks(prev => [createdTask, ...prev]);
    }
  };

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return tasks.filter(t => {
      if (t.isCompleted) return false;
      if (t.specificDate) {
        const d = new Date(t.specificDate + 'T12:00:00');
        return d >= now && d <= nextWeek;
      }
      return false;
    }).sort((a, b) => (a.specificDate || '') > (b.specificDate || '') ? 1 : -1);
  }, [tasks]);

  const currentMonthTasks = useMemo(() => {
    return tasks.filter(t => isTaskRelevantForDate(t, currentDate));
  }, [tasks, currentDate]);

  const seasonalTasks = currentMonthTasks.filter(t => t.monthReference !== undefined);
  const dateTasks = currentMonthTasks.filter(t => t.specificDate !== undefined);

  const renderTaskCard = (task: TaskType, showDate = true) => (
    <div key={task.id} className={`group bg-white p-4 rounded-xl border transition-all duration-200 hover:shadow-md flex items-start gap-3 ${task.isCompleted ? 'border-stone-100 opacity-60' : 'border-stone-200 border-l-4 border-l-nature-moss'}`}>
      <button 
        onClick={() => toggleTask(task.id)}
        className={`mt-1 transition-colors ${task.isCompleted ? 'text-nature-moss' : 'text-stone-300 hover:text-nature-moss'}`}
      >
        {task.isCompleted ? <CheckCircle2 size={22} /> : <Circle size={22} />}
      </button>
      
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <h3 className={`font-medium text-lg leading-tight ${task.isCompleted ? 'line-through text-stone-400' : 'text-stone-800'}`}>
            {task.title}
          </h3>
          <button onClick={() => deleteTask(task.id)} className="text-stone-300 hover:text-red-400 opacity-0 group-hover:opacity-100 transition-opacity">
            <Trash2 size={16} />
          </button>
        </div>
        
        <div className="flex flex-wrap gap-2 mt-2 text-sm text-stone-500">
          <span className="px-2 py-0.5 bg-nature-sand rounded-full text-nature-earth font-medium text-xs uppercase tracking-wide">
            {CATEGORY_LABELS[task.category]}
          </span>
          {showDate && task.specificDate && (
             <span className="flex items-center gap-1">
               <CalendarDays size={14} />
               {new Date(task.specificDate + 'T12:00:00').toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })}
             </span>
          )}
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-nature-offWhite text-stone-800 font-sans">
      <div className="lg:hidden bg-nature-mossDark text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <span className="font-bold text-xl flex items-center gap-2"><Sprout /> Agenda Rural</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-nature-mossDark text-nature-sand transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 hidden lg:block">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Sprout className="text-nature-moss" /> Agenda Rural</h1>
          </div>
          <nav className="px-4 space-y-2 mt-4 lg:mt-0">
            <button onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-nature-moss text-white' : 'hover:bg-white/10 text-stone-300'}`}><Layout size={20} /> Dashboard</button>
            <button onClick={() => { setView('calendar'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'calendar' ? 'bg-nature-moss text-white' : 'hover:bg-white/10 text-stone-300'}`}><CalendarIcon size={20} /> Calendário</button>
            <button onClick={() => { setView('tasks'); setMobileMenuOpen(false); }} className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'tasks' ? 'bg-nature-moss text-white' : 'hover:bg-white/10 text-stone-300'}`}><List size={20} /> Todas as Tarefas</button>
          </nav>
          <div className="absolute bottom-8 left-4 right-4">
             <button onClick={() => setIsAssistantOpen(true)} className="w-full flex items-center justify-center gap-2 bg-nature-earth text-white py-3 rounded-xl shadow-lg hover:bg-[#7a6845] font-medium"><Sprout size={20} /> Agrônomo Virtual</button>
          </div>
        </aside>

        <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen relative">
          <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
            {loading ? (
              <div className="flex flex-col items-center justify-center h-[60vh] text-stone-400">
                <Loader2 className="animate-spin mb-2" size={32} />
                <p>Sincronizando com a nuvem...</p>
              </div>
            ) : (
              <>
                {view === 'dashboard' && (
                  <div className="space-y-8 animate-fade-in">
                    <div className="bg-nature-mossDark text-nature-sand p-6 rounded-2xl shadow-lg relative overflow-hidden">
                      <div className="relative z-10">
                        <h1 className="text-3xl font-bold">Agenda Online</h1>
                        <p className="opacity-90 mt-1">Seus dados agora estão salvos no Supabase.</p>
                      </div>
                      <Sprout className="absolute -bottom-4 -right-4 text-nature-moss opacity-20 w-32 h-32" />
                    </div>
                    <section>
                      <h2 className="text-xl font-bold text-nature-mossDark mb-4 flex items-center gap-2"><CalendarDays className="text-nature-earth" /> Próximos 7 Dias</h2>
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {upcomingTasks.length > 0 ? upcomingTasks.map(t => renderTaskCard(t)) : <div className="col-span-full p-8 text-center bg-white rounded-xl border border-stone-200 border-dashed text-stone-400">Tudo em dia!</div>}
                      </div>
                    </section>
                  </div>
                )}
                {view === 'calendar' && <div className="p-4 bg-white rounded-2xl shadow-sm border border-stone-200">Em desenvolvimento com Supabase...</div>}
                {view === 'tasks' && (
                  <div className="space-y-4 animate-fade-in">
                    <h2 className="text-2xl font-bold text-nature-mossDark">Todas as Tarefas</h2>
                    {tasks.map(t => renderTaskCard(t))}
                  </div>
                )}
              </>
            )}
          </div>

          <button onClick={() => setIsFormOpen(true)} className="fixed bottom-6 right-6 w-14 h-14 bg-nature-moss text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 z-30">
            <Plus size={28} />
          </button>
        </main>
      </div>

      {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} onSave={addTask} />}
      {isAssistantOpen && <AssistantModal onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};

export default App;