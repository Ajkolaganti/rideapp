import { createClient } from '@supabase/supabase-js';
import { Database } from './database.types';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
  },
});

// Test the connection
supabase
  .from('drivers')
  .select('*')
  .limit(1)
  .then(({ data, error }) => {
    if (error) {
      console.error('Supabase connection error:', error);
    } else {
      console.log('Supabase connection successful, sample data:', data);
    }
  });

// Add error handling for network issues
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_OUT') {
    // Clear any cached data
    localStorage.removeItem('drivers');
  }
}); 