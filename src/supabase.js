import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://heuigzyutypfjpqzipik.supabase.co';
const supabaseKey ='eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImhldWlnenl1dHlwZmpwcXppcGlrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTg0MjA3MTYsImV4cCI6MjA3Mzk5NjcxNn0.DF8fjinfbOSiP6SjWlxo991auPxerIFjr-UicrRys88';

export const supabase = createClient(supabaseUrl, supabaseKey);
