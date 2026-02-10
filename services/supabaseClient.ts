import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || '';

// Só inicializa se tivermos uma URL válida que comece com http
// Isso evita o erro "supabaseUrl is required" durante o carregamento do script
export const supabase = (supabaseUrl && supabaseUrl.startsWith('http')) 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

if (!supabase) {
  console.warn('Supabase: Variáveis de ambiente SUPABASE_URL ou SUPABASE_ANON_KEY não encontradas ou inválidas.');
}