const express = require('express');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

const app = express();

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
app.get('/media', (req, res) => res.sendFile(path.join(__dirname, 'public', 'media.html')));

// ============================
// API - VIEW COUNTER
// ============================

// Catat kunjungan (dipanggil dari client saat halaman dibuka)
app.post('/api/views/record', async (req, res) => {
    const { page } = req.body;
    const ip = req.headers['x-forwarded-for']?.split(',')[0].trim() || req.socket.remoteAddress || 'unknown';
    const userAgent = req.headers['user-agent'] || 'unknown';
    const pageToRecord = page || '/';

    try {
        // Cek apakah IP ini sudah mengunjungi halaman ini dalam 30 menit terakhir (hindari spam)
        const thirtyMinsAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString();
        const { data: existing } = await supabase
            .from('page_views')
            .select('id')
            .eq('ip_address', ip)
            .eq('page', pageToRecord)
            .gte('visited_at', thirtyMinsAgo)
            .limit(1);

        if (existing && existing.length > 0) {
            // Sudah dikunjungi, jangan catat lagi
            return res.json({ recorded: false, message: 'Already counted recently' });
        }

        // Catat kunjungan baru
        await supabase.from('page_views').insert([{
            ip_address: ip,
            user_agent: userAgent,
            page: pageToRecord,
            visited_at: new Date().toISOString()
        }]);

        res.json({ recorded: true });
    } catch (e) {
        console.error('Error record view:', e.message);
        res.status(500).json({ error: 'Gagal mencatat kunjungan.' });
    }
});

// Ambil statistik views
app.get('/api/views/stats', async (req, res) => {
    try {
        const now = new Date();
        const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
        const weekStart = new Date(now - 7 * 24 * 60 * 60 * 1000).toISOString();
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();

        // Total semua views
        const { data: allViews } = await supabase.from('page_views').select('id, page, visited_at, ip_address');

        const total = allViews?.length || 0;
        const today = allViews?.filter(v => v.visited_at >= todayStart).length || 0;
        const thisWeek = allViews?.filter(v => v.visited_at >= weekStart).length || 0;
        const thisMonth = allViews?.filter(v => v.visited_at >= monthStart).length || 0;

        // Unique visitors (by IP)
        const uniqueIPs = new Set(allViews?.map(v => v.ip_address) || []);
        const uniqueVisitors = uniqueIPs.size;

        // Per halaman
        const perPage = {};
        allViews?.forEach(v => {
            perPage[v.page] = (perPage[v.page] || 0) + 1;
        });

        // Views per hari (7 hari terakhir) untuk grafik
        const dailyData = {};
        for (let i = 6; i >= 0; i--) {
            const d = new Date(now - i * 24 * 60 * 60 * 1000);
            const key = d.toISOString().split('T')[0];
            dailyData[key] = 0;
        }
        allViews?.filter(v => v.visited_at >= weekStart).forEach(v => {
            const key = v.visited_at.split('T')[0];
            if (dailyData[key] !== undefined) dailyData[key]++;
        });

        res.json({ total, today, thisWeek, thisMonth, uniqueVisitors, perPage, dailyData });
    } catch (e) {
        console.error('Error get view stats:', e.message);
        res.status(500).json({ error: 'Gagal mengambil statistik.' });
    }
});

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
    if (!mode || !urgensi || !aduan) return res.status(400).json({ error: 'Field mode, urgensi, dan aduan wajib diisi.' });
    if (aduan.trim().length < 10) return res.status(400).json({ error: 'Aduan terlalu pendek. Minimal 10 karakter.' });
    try {
        const { data, error } = await supabase.from('konseling').insert([{
            mode, nama: nama || 'Anonim', nis: nis || '-', urgensi, aduan: aduan.trim()
        }]).select();
        if (error) throw error;
        res.status(201).json({ message: 'Aduan berhasil dikirim.', data: data[0] });
    } catch (e) {
        res.status(500).json({ error: 'Gagal menyimpan aduan.', detail: e.message });
    }
});

app.delete('/api/konseling/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
        const { error } = await supabase.from('konseling').delete().eq('id', parseInt(id));
        if (error) throw error;
        res.json({ message: `Aduan dengan ID ${id} berhasil dihapus.` });
    } catch (e) {
        res.status(500).json({ error: 'Gagal menghapus aduan.' });
    }
});

// ============================
// API - PENILAIAN VOTES
// ============================
app.get('/api/penilaian/votes', async (req, res) => {
    try {
        const { data, error } = await supabase.from('penilaian_votes').select('type');
        if (error) throw error;
        const likes = data.filter(v => v.type === 'like').length;
        const dislikes = data.filter(v => v.type === 'dislike').length;
        res.json({ likes, dislikes });
    } catch (e) {
        res.status(500).json({ error: 'Gagal mengambil data votes.' });
    }
});

app.post('/api/penilaian/vote', async (req, res) => {
    const { type } = req.body;
    if (!type || !['like', 'dislike'].includes(type)) return res.status(400).json({ error: 'Type harus "like" atau "dislike".' });
    try {
        await supabase.from('penilaian_votes').insert([{ type }]);
        const { data } = await supabase.from('penilaian_votes').select('type');
        const likes = data.filter(v => v.type === 'like').length;
        const dislikes = data.filter(v => v.type === 'dislike').length;
        res.status(201).json({ likes, dislikes });
    } catch (e) {
        res.status(500).json({ error: 'Gagal menyimpan vote.' });
    }
});

// ============================
// API - PENILAIAN KOMENTAR
// ============================
app.get('/api/penilaian/komentar', async (req, res) => {
    try {
        const { data, error } = await supabase.from('penilaian_komentar').select('*').order('created_at', { ascending: false });
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Gagal mengambil komentar.' });
    }
});

app.post('/api/penilaian/komentar', async (req, res) => {
    const { nama, komentar } = req.body;
    if (!komentar || komentar.trim().length < 5) return res.status(400).json({ error: 'Komentar terlalu pendek.' });
    try {
        const { data, error } = await supabase.from('penilaian_komentar').insert([{
            nama: nama || 'Anonim', komentar: komentar.trim()
        }]).select();
        if (error) throw error;
        res.status(201).json({ message: 'Komentar berhasil dikirim!', data: data[0] });
    } catch (e) {
        res.status(500).json({ error: 'Gagal menyimpan komentar.' });
    }
});

// ============================
// API - MEDIA (POSTER & BOOKLET)
// ============================

// Ambil semua media
app.get('/api/media', async (req, res) => {
    try {
        const { type } = req.query; // ?type=poster atau ?type=booklet
        let query = supabase.from('media').select('*').order('created_at', { ascending: false });
        if (type && ['poster', 'booklet'].includes(type)) query = query.eq('type', type);
        const { data, error } = await query;
        if (error) throw error;
        res.json(data);
    } catch (e) {
        res.status(500).json({ error: 'Gagal mengambil data media.' });
    }
});

// Tambah media baru
app.post('/api/media', async (req, res) => {
    const { type, judul, deskripsi, image_url, file_url } = req.body;
    if (!type || !['poster', 'booklet'].includes(type)) return res.status(400).json({ error: 'Type harus "poster" atau "booklet".' });
    if (!judul || judul.trim().length < 3) return res.status(400).json({ error: 'Judul minimal 3 karakter.' });
    if (!image_url) return res.status(400).json({ error: 'URL gambar wajib diisi.' });

    try {
        const { data, error } = await supabase.from('media').insert([{
            type, judul: judul.trim(), deskripsi: deskripsi?.trim() || '', image_url, file_url: file_url || null
        }]).select();
        if (error) throw error;
        res.status(201).json({ message: `${type} berhasil ditambahkan!`, data: data[0] });
    } catch (e) {
        res.status(500).json({ error: 'Gagal menyimpan media.', detail: e.message });
    }
});

// Hapus media
app.delete('/api/media/:id', async (req, res) => {
    const { id } = req.params;
    if (!id || isNaN(id)) return res.status(400).json({ error: 'ID tidak valid.' });
    try {
        const { error } = await supabase.from('media').delete().eq('id', parseInt(id));
        if (error) throw error;
        res.json({ message: `Media berhasil dihapus.` });
    } catch (e) {
        res.status(500).json({ error: 'Gagal menghapus media.' });
    }
});

// ============================
// API - Health Check
// ============================
app.get('/api/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ============================
// 404 Fallback
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
});

module.exports = app;