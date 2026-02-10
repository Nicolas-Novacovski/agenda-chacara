import { supabase } from './supabaseClient';
import { Task } from '../types';

export const loadTasks = async (): Promise<Task[]> => {
  if (!supabase) {
    console.error('Supabase não disponível');
    return [];
  }

  const { data, error } = await supabase
    .from('tasks')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Erro ao carregar tarefas:', error);
    return [];
  }

  return data.map(item => ({
    id: item.id,
    title: item.title,
    description: item.description,
    isCompleted: item.is_completed,
    recurrence: item.recurrence,
    specificDate: item.specific_date,
    monthReference: item.month_reference,
    category: item.category,
    createdAt: new Date(item.created_at).getTime()
  }));
};

export const createTask = async (task: Omit<Task, 'id' | 'createdAt' | 'isCompleted'>): Promise<Task | null> => {
  if (!supabase) return null;

  const { data, error } = await supabase
    .from('tasks')
    .insert([{
      title: task.title,
      category: task.category,
      recurrence: task.recurrence,
      specific_date: task.specificDate,
      month_reference: task.monthReference,
      is_completed: false
    }])
    .select()
    .single();

  if (error) {
    console.error('Erro ao criar tarefa:', error);
    return null;
  }

  return {
    id: data.id,
    title: data.title,
    isCompleted: data.is_completed,
    recurrence: data.recurrence,
    specificDate: data.specific_date,
    monthReference: data.month_reference,
    category: data.category,
    createdAt: new Date(data.created_at).getTime()
  };
};

export const updateTaskStatus = async (id: string, isCompleted: boolean): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase
    .from('tasks')
    .update({ is_completed: isCompleted })
    .eq('id', id);

  if (error) console.error('Erro ao atualizar tarefa:', error);
};

export const deleteTaskFromDb = async (id: string): Promise<void> => {
  if (!supabase) return;
  const { error } = await supabase
    .from('tasks')
    .delete()
    .eq('id', id);

  if (error) console.error('Erro ao excluir tarefa:', error);
};