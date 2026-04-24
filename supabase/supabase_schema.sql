-- ==================================
-- BK-Care - Supabase Database Schema
-- ==================================
-- Jalankan SQL ini di: Supabase Dashboard -> SQL Editor -> New Query

-- 1. Buat tabel konseling
CREATE TABLE IF NOT EXISTS public.konseling (
    id          BIGSERIAL PRIMARY KEY,
    mode        VARCHAR(10)  NOT NULL CHECK (mode IN ('anonim', 'public')),
    nama        VARCHAR(100) NOT NULL DEFAULT 'Anonim',
    nis         VARCHAR(20)           DEFAULT '-',
    urgensi     VARCHAR(10)  NOT NULL CHECK (urgensi IN ('rendah', 'sedang', 'tinggi')),
    aduan       TEXT         NOT NULL,
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT NOW()
);

-- 2. Aktifkan Row Level Security (RLS) - Penting untuk keamanan!
ALTER TABLE public.konseling ENABLE ROW LEVEL SECURITY;

-- 3. Policy: Siapa pun boleh INSERT (mengirim aduan)
CREATE POLICY "Allow public insert"
ON public.konseling
FOR INSERT
TO anon
WITH CHECK (true);

-- 4. Policy: Hanya service role (backend) yang bisa SELECT semua data
--    Karena kita pakai anon key di backend, aktifkan dulu SELECT untuk anon:
CREATE POLICY "Allow anon select"
ON public.konseling
FOR SELECT
TO anon
USING (true);

-- 5. Policy: Hanya service role yang bisa DELETE
CREATE POLICY "Allow anon delete"
ON public.konseling
FOR DELETE
TO anon
USING (true);

-- 6. Index untuk performa ORDER BY created_at
CREATE INDEX IF NOT EXISTS idx_konseling_created_at
ON public.konseling (created_at DESC);

-- ==================================
-- Verifikasi: Lihat semua data
-- ==================================
-- SELECT * FROM konseling ORDER BY created_at DESC;

-- Contoh insert manual untuk testing:
-- INSERT INTO konseling (mode, nama, nis, urgensi, aduan)
-- VALUES ('public', 'Budi Santoso', '12345', 'sedang', 'Saya sedang mengalami tekanan akademik yang berat.');
