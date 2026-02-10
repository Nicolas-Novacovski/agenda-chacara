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
  X
} from 'lucide-react';
import { Task, Task as TaskType, ViewMode, MONTH_NAMES, CATEGORY_LABELS } from './types';
import { loadTasks, saveTasks } from './services/storageService';
import TaskForm from './components/TaskForm';
import AssistantModal from './components/AssistantModal';

// Helper to determine if a task is relevant for the current view (Month/Year)
const isTaskRelevantForDate = (task: TaskType, targetDate: Date): boolean => {
  const targetMonth = targetDate.getMonth();
  const targetYear = targetDate.getFullYear();

  // 1. Seasonal Tasks (Month Reference)
  if (task.monthReference !== undefined) {
    if (task.monthReference !== targetMonth) return false;
    // For seasonal tasks without specific year, we might assume they recur yearly if recurrence is set
    // Or if it's a one-off seasonal task, we need to check creation year or just show it if active.
    // Simplifying: If it's month ref, show it in that month regardless of year unless completed and not recurring.
    if (task.recurrence === 'yearly' || task.recurrence === 'monthly') return true;
    
    // For non-recurring month tasks, maybe check if created this year? 
    // Let's keep it simple: Month tasks show up in that month.
    return true; 
  }

  // 2. Specific Date Tasks
  if (task.specificDate) {
    const taskDate = new Date(task.specificDate + 'T12:00:00'); // midday to avoid timezone issues
    
    // Exact Match
    if (taskDate.getMonth() === targetMonth && taskDate.getFullYear() === targetYear) {
      return true;
    }

    // Monthly Recurrence
    if (task.recurrence === 'monthly') {
      // Show if start date is before or in current month
      return taskDate <= new Date(targetYear, targetMonth + 1, 0); 
    }

    // Yearly Recurrence
    if (task.recurrence === 'yearly') {
      return taskDate.getMonth() === targetMonth;
    }
  }

  return false;
};

const App: React.FC = () => {
  const [tasks, setTasks] = useState<TaskType[]>([]);
  const [view, setView] = useState<ViewMode>('dashboard');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isAssistantOpen, setIsAssistantOpen] = useState(false);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Initial Load
  useEffect(() => {
    setTasks(loadTasks());
  }, []);

  // Save on change
  useEffect(() => {
    saveTasks(tasks);
  }, [tasks]);

  const toggleTask = (taskId: string) => {
    setTasks(prev => prev.map(t => 
      t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t
    ));
  };

  const deleteTask = (taskId: string) => {
    if (window.confirm('Tem certeza que deseja remover esta tarefa?')) {
      setTasks(prev => prev.filter(t => t.id !== taskId));
    }
  };

  const addTask = (newTask: Omit<TaskType, 'id' | 'createdAt' | 'isCompleted'>) => {
    const task: TaskType = {
      ...newTask,
      id: crypto.randomUUID(),
      createdAt: Date.now(),
      isCompleted: false
    };
    setTasks(prev => [...prev, task]);
  };

  // --- Derived State ---

  const upcomingTasks = useMemo(() => {
    const now = new Date();
    const nextWeek = new Date();
    nextWeek.setDate(now.getDate() + 7);

    return tasks.filter(t => {
      if (t.isCompleted) return false;
      if (t.specificDate) {
        const d = new Date(t.specificDate + 'T12:00:00');
        // Simple upcoming check for specific dates
        // Note: Does not perfectly handle recurrence logic for "next 7 days" calculation in this simple version
        // but handles direct dates well.
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

  // --- Render Helpers ---

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
          {task.recurrence !== 'none' && (
            <span className="text-nature-moss text-xs border border-nature-moss/30 px-1.5 rounded flex items-center">
              Recorrente
            </span>
          )}
        </div>
      </div>
    </div>
  );

  const DashboardView = () => (
    <div className="space-y-8 animate-fade-in">
      {/* Welcome Banner */}
      <div className="bg-nature-mossDark text-nature-sand p-6 rounded-2xl shadow-lg relative overflow-hidden">
        <div className="relative z-10">
          <h1 className="text-3xl font-bold font-sans">Olá, Bom dia!</h1>
          <p className="opacity-90 mt-1 text-lg">Aqui está o resumo da sua chácara para hoje.</p>
        </div>
        <Sprout className="absolute -bottom-4 -right-4 text-nature-moss opacity-20 w-32 h-32" />
      </div>

      {/* Upcoming */}
      <section>
        <h2 className="text-xl font-bold text-nature-mossDark mb-4 flex items-center gap-2">
          <CalendarDays className="text-nature-earth" /> Próximos 7 Dias
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {upcomingTasks.length > 0 ? (
            upcomingTasks.map(t => renderTaskCard(t))
          ) : (
            <div className="col-span-full p-8 text-center bg-white rounded-xl border border-stone-200 border-dashed text-stone-400">
              Nenhuma tarefa urgente para a próxima semana. Aproveite o descanso!
            </div>
          )}
        </div>
      </section>

      {/* Seasonal Overview */}
      <section>
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold text-nature-mossDark flex items-center gap-2">
            <Sprout className="text-nature-earth" /> Tarefas de {MONTH_NAMES[currentDate.getMonth()]}
          </h2>
          <button onClick={() => setView('calendar')} className="text-sm text-nature-moss font-semibold hover:underline">
            Ver Calendário Completo
          </button>
        </div>
        <div className="bg-nature-sand/30 p-6 rounded-2xl border border-nature-earth/10">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {seasonalTasks.length > 0 || dateTasks.length > 0 ? (
               currentMonthTasks.slice(0, 4).map(t => renderTaskCard(t))
             ) : (
               <p className="text-stone-500 italic">Nenhuma tarefa registrada para este mês.</p>
             )}
          </div>
        </div>
      </section>
    </div>
  );

  const CalendarViewComp = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    
    // Generate calendar grid
    const days = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let i = 1; i <= daysInMonth; i++) days.push(i);

    return (
      <div className="space-y-6 animate-fade-in">
        <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-stone-200">
          <button onClick={() => setCurrentDate(new Date(year, month - 1, 1))} className="p-2 hover:bg-stone-100 rounded-full">
            <ChevronLeft className="text-stone-600" />
          </button>
          <h2 className="text-2xl font-bold text-nature-mossDark capitalize">
            {MONTH_NAMES[month]} <span className="text-stone-400 font-light">{year}</span>
          </h2>
          <button onClick={() => setCurrentDate(new Date(year, month + 1, 1))} className="p-2 hover:bg-stone-100 rounded-full">
            <ChevronRight className="text-stone-600" />
          </button>
        </div>

        <div className="flex flex-col lg:flex-row gap-6">
          {/* Main Grid */}
          <div className="flex-1 bg-white p-6 rounded-2xl shadow-sm border border-stone-200">
             <div className="grid grid-cols-7 gap-2 mb-4 text-center">
               {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                 <div key={d} className="text-stone-400 font-bold text-sm">{d}</div>
               ))}
             </div>
             <div className="grid grid-cols-7 gap-2">
               {days.map((day, idx) => {
                 if (!day) return <div key={idx} className="aspect-square bg-transparent" />;
                 
                 // Find tasks for this day
                 const dayTasks = dateTasks.filter(t => {
                   if (!t.specificDate) return false;
                   const d = new Date(t.specificDate + 'T12:00:00');
                   // Handle recurrence display in calendar is complex, simplifying to exact date match for prototype
                   // Or simple monthly recurrence match
                   if (t.recurrence === 'monthly') {
                     return d.getDate() === day;
                   }
                   if (t.recurrence === 'yearly') {
                    return d.getDate() === day && d.getMonth() === month;
                   }
                   return d.getDate() === day && d.getMonth() === month && d.getFullYear() === year;
                 });

                 const hasCompleted = dayTasks.length > 0 && dayTasks.every(t => t.isCompleted);
                 const hasPending = dayTasks.some(t => !t.isCompleted);

                 return (
                   <div key={idx} className={`aspect-square rounded-lg border flex flex-col items-center justify-start pt-2 relative transition-all hover:border-nature-moss cursor-pointer ${
                     day === new Date().getDate() && month === new Date().getMonth() ? 'bg-nature-sand border-nature-earth' : 'bg-white border-stone-100'
                   }`}>
                     <span className={`text-sm font-medium ${dayTasks.length > 0 ? 'text-nature-mossDark' : 'text-stone-500'}`}>{day}</span>
                     
                     <div className="flex gap-1 mt-1">
                        {hasPending && <div className="w-1.5 h-1.5 rounded-full bg-nature-clay" />}
                        {hasCompleted && <div className="w-1.5 h-1.5 rounded-full bg-nature-moss" />}
                     </div>
                   </div>
                 );
               })}
             </div>
          </div>

          {/* Seasonal/Month Sidebar */}
          <div className="w-full lg:w-80 space-y-4">
            <div className="bg-nature-moss/10 p-5 rounded-2xl border border-nature-moss/20">
              <h3 className="font-bold text-nature-mossDark mb-3 flex items-center gap-2">
                <Sprout size={18} /> Sazonal ({MONTH_NAMES[month]})
              </h3>
              <div className="space-y-3">
                {seasonalTasks.length > 0 ? (
                   seasonalTasks.map(t => renderTaskCard(t, false))
                ) : (
                  <p className="text-sm text-stone-500 text-center py-4">Sem tarefas sazonais.</p>
                )}
              </div>
            </div>
            
            <div className="bg-white p-5 rounded-2xl border border-stone-200">
               <h3 className="font-bold text-stone-700 mb-3">Tarefas com Data</h3>
               <div className="space-y-3">
                 {dateTasks.filter(t => !t.isCompleted).slice(0, 5).map(t => renderTaskCard(t))}
                 {dateTasks.length === 0 && <p className="text-sm text-stone-500 text-center">Livre este mês!</p>}
               </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- Main Layout ---

  return (
    <div className="min-h-screen bg-nature-offWhite text-stone-800 font-sans selection:bg-nature-moss selection:text-white">
      {/* Mobile Header */}
      <div className="lg:hidden bg-nature-mossDark text-white p-4 flex justify-between items-center sticky top-0 z-30 shadow-md">
        <span className="font-bold text-xl flex items-center gap-2"><Sprout /> Agenda Rural</span>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)}>
          {mobileMenuOpen ? <X /> : <Menu />}
        </button>
      </div>

      <div className="flex">
        {/* Sidebar Navigation */}
        <aside className={`fixed inset-y-0 left-0 z-20 w-64 bg-nature-mossDark text-nature-sand transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:h-screen ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}`}>
          <div className="p-8 hidden lg:block">
            <h1 className="text-2xl font-bold flex items-center gap-2"><Sprout className="text-nature-moss" /> Agenda Rural</h1>
          </div>
          
          <nav className="px-4 space-y-2 mt-4 lg:mt-0">
            <button 
              onClick={() => { setView('dashboard'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'dashboard' ? 'bg-nature-moss text-white shadow-lg' : 'hover:bg-white/10 text-stone-300'}`}
            >
              <Layout size={20} /> Dashboard
            </button>
            <button 
              onClick={() => { setView('calendar'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'calendar' ? 'bg-nature-moss text-white shadow-lg' : 'hover:bg-white/10 text-stone-300'}`}
            >
              <CalendarIcon size={20} /> Calendário
            </button>
            <button 
              onClick={() => { setView('tasks'); setMobileMenuOpen(false); }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${view === 'tasks' ? 'bg-nature-moss text-white shadow-lg' : 'hover:bg-white/10 text-stone-300'}`}
            >
              <List size={20} /> Todas as Tarefas
            </button>
          </nav>

          <div className="absolute bottom-8 left-4 right-4">
             <button
               onClick={() => setIsAssistantOpen(true)}
               className="w-full flex items-center justify-center gap-2 bg-nature-earth text-white py-3 rounded-xl shadow-lg hover:bg-[#7a6845] transition-colors font-medium"
             >
               <Sprout size={20} /> Agrônomo Virtual
             </button>
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-4 lg:p-8 overflow-y-auto h-screen relative">
          <div className="max-w-6xl mx-auto pb-20 lg:pb-0">
            
            {view === 'dashboard' && <DashboardView />}
            {view === 'calendar' && <CalendarViewComp />}
            {view === 'tasks' && (
              <div className="space-y-6 animate-fade-in">
                <div className="flex justify-between items-center">
                  <h2 className="text-2xl font-bold text-nature-mossDark">Todas as Tarefas</h2>
                </div>
                <div className="grid gap-4">
                  {tasks.length > 0 ? (
                    tasks.sort((a,b) => Number(a.isCompleted) - Number(b.isCompleted)).map(t => renderTaskCard(t))
                  ) : (
                    <p className="text-center py-10 text-stone-500">Nenhuma tarefa cadastrada.</p>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Floating Action Button */}
          <button
            onClick={() => setIsFormOpen(true)}
            className="fixed bottom-6 right-6 lg:bottom-10 lg:right-10 w-14 h-14 bg-nature-moss hover:bg-nature-mossDark text-white rounded-full shadow-xl flex items-center justify-center transition-transform hover:scale-110 z-30"
          >
            <Plus size={28} />
          </button>
        </main>
      </div>

      {/* Modals */}
      {isFormOpen && <TaskForm onClose={() => setIsFormOpen(false)} onSave={addTask} />}
      {isAssistantOpen && <AssistantModal onClose={() => setIsAssistantOpen(false)} />}
    </div>
  );
};

export default App;