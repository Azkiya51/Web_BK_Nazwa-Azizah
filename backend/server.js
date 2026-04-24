const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

// ✅ Isi kredensial Supabase kamu di sini
const SUPABASE_URL = "https://bkjswutcsgohfmidvtnq.supabase.co";
const SUPABASE_ANON_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJranN3dXRjc2dvaGZtaWR2dG5xIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzY5MzI5NzMsImV4cCI6MjA5MjUwODk3M30.uM1npu510my6Q4h8gSGH26BWj-ffaX56pcc2ayo7ciY";

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

// ============================
// ROUTES - Halaman HTML
// ============================
app.get('/', (req, res) => res.sendFile(path.join(__dirname, 'public', 'index.html')));
app.get('/admin', (req, res) => res.sendFile(path.join(__dirname, 'public', 'admin.html')));
app.get('/penilaian', (req, res) => res.sendFile(path.join(__dirname, 'public', 'penilaian.html')));

// ============================
// API - KONSELING
// ============================
app.get('/api/konseling', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('konseling')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Error GET /api/konseling:', e.message);
        res.status(500).json({ error: 'Gagal mengambil data dari database.' });
    }
});

app.post('/api/konseling', async (req, res) => {
    const { mode, nama, nis, urgensi, aduan } = req.body;

    if (!mode || !urgensi || !aduan) {
        return res.status(400).json({ error: 'Field mode, urgensi, dan aduan wajib diisi.' });
    }
    if (aduan.trim().length < 10) {
        return res.status(400).json({ error: 'Aduan terlalu pendek. Minimal 10 karakter.' });
    }

    try {
        const { data, error } = await supabase
            .from('konseling')
            .insert([{
                mode: mode,
                nama: nama || 'Anonim',
                nis: nis || '-',
                urgensi: urgensi,
                aduan: aduan.trim()
            }])
            .select();
        if (error) throw error;
        res.status(201).json({ message: 'Aduan berhasil dikirim. Guru BK akan segera merespons.', data: data[0] });
    } catch (e) {
        console.error('Error POST /api/konseling:', e.message);
        res.status(500).json({ error: 'Gagal menyimpan aduan.', detail: e.message });
    }
});

app.delete('/api/konseling/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
        const { error } = await supabase
            .from('konseling')
            .delete()
            .eq('id', parseInt(id));
        if (error) throw error;
        res.json({ message: `Aduan dengan ID ${id} berhasil dihapus.` });
    } catch (e) {
        console.error('Error DELETE /api/konseling:', e.message);
        res.status(500).json({ error: 'Gagal menghapus aduan.' });
    }
});

// ============================
// API - PENILAIAN VOTES
// ============================
app.get('/api/penilaian/votes', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('penilaian_votes')
            .select('type');
        if (error) throw error;
        const likes = data.filter(v => v.type === 'like').length;
        const dislikes = data.filter(v => v.type === 'dislike').length;
        res.json({ likes, dislikes });
    } catch (e) {
        console.error('Error GET /api/penilaian/votes:', e.message);
        res.status(500).json({ error: 'Gagal mengambil data votes.' });
    }
});

app.post('/api/penilaian/vote', async (req, res) => {
    const { type } = req.body;
    if (!type || !['like', 'dislike'].includes(type)) {
        return res.status(400).json({ error: 'Type harus "like" atau "dislike".' });
    }
    try {
        const { error } = await supabase
            .from('penilaian_votes')
            .insert([{ type }]);
        if (error) throw error;
        const { data } = await supabase.from('penilaian_votes').select('type');
        const likes = data.filter(v => v.type === 'like').length;
        const dislikes = data.filter(v => v.type === 'dislike').length;
        res.status(201).json({ likes, dislikes });
    } catch (e) {
        console.error('Error POST /api/penilaian/vote:', e.message);
        res.status(500).json({ error: 'Gagal menyimpan vote.' });
    }
});

// ============================
// API - PENILAIAN KOMENTAR
// ============================
app.get('/api/penilaian/komentar', async (req, res) => {
    try {
        const { data, error } = await supabase
            .from('penilaian_komentar')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        console.error('Error GET /api/penilaian/komentar:', e.message);
        res.status(500).json({ error: 'Gagal mengambil komentar.' });
    }
});

app.post('/api/penilaian/komentar', async (req, res) => {
    const { nama, komentar } = req.body;
    if (!komentar || komentar.trim().length < 5) {
        return res.status(400).json({ error: 'Komentar terlalu pendek. Minimal 5 karakter.' });
    }
    try {
        const { data, error } = await supabase
            .from('penilaian_komentar')
            .insert([{ nama: nama || 'Anonim', komentar: komentar.trim() }])
            .select();
        if (error) throw error;
        res.status(201).json({ message: 'Komentar berhasil dikirim!', data: data[0] });
    } catch (e) {
        console.error('Error POST /api/penilaian/komentar:', e.message);
        res.status(500).json({ error: 'Gagal menyimpan komentar.' });
    }
});

// ============================
// API - Health Check
// ============================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================
// 404 Fallback (HARUS PALING BAWAH)
// ============================
app.use((req, res) => {
    res.status(404).json({ error: 'Endpoint tidak ditemukan.' });
});

// ============================
// Start Server
// ============================
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`✅ Server BK-Care berjalan di http://localhost:${PORT}`);
    console.log(`📊 Supabase URL: ${SUPABASE_URL ? '✔ Terhubung' : '✘ Belum dikonfigurasi'}`);
    console.log(`🔑 Supabase ANON Key: ${SUPABASE_ANON_KEY ? '✔ Terhubung' : '✘ Belum dikonfigurasi'}`);
});

module.exports = app;