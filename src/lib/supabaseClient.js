import { createClient } from '@supabase/supabase-js'

const supabaseUrl = 'https://zejraxsjieajrqsrcxhd.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InplanJheHNqaWVhanJxc3JjeGhkIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODU3ODkzODYsImV4cCI6MjEwMTM2NTM4Nn0.VBDVlI23Q_24shhj1xfo837K0fyojCdyHu7BBUNbkXs'

export const supabase = createClient(supabaseUrl, supabaseAnonKey)