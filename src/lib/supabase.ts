'use client';

import { createBrowserClient } from '@supabase/ssr';

// Exportamos la instancia directamente. 
// @supabase/ssr maneja automáticamente la persistencia en cookies.
export const supabase = createBrowserClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);