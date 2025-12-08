import { createClient } from '@supabase/supabase-js';

// 1. Tenta pegar a variável de ambiente.
// 2. Se não encontrar (durante o build), usa uma URL válida FAKE para não travar o erro "Invalid URL".
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://example.com";
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "placeholder-key";

// Cria o cliente
export const supabase = createClient(supabaseUrl, supabaseKey);
