// ============================================
// KONFIGURASI SUPABASE - BK-Care
// Ganti nilai di bawah ini jika URL/KEY berubah
// ============================================
const SUPABASE_URL = "https://bkjswutcsgohfmidvtnq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJranN3dXRjc2dvaGZtaWR2dG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzI5NzMsImV4cCI6MjA5MjUwODk3M30.uM1npu510my6Q4h8gSGH26BWj-ffaX56pcc2ayo7ciY";

// Inisialisasi Supabase client (dari CDN)
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);