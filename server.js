const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Database Sementara (Data akan reset jika server restart/sleep)
let databaseAduan = [];

// --- API ENDPOINTS ---

// 1. Ambil semua aduan (Untuk Dashboard Guru BK)
app.get('/api/konseling', (req, res) => {
    res.status(200).json(databaseAduan);
});

// 2. Kirim aduan baru (Dari Form Siswa)
app.post('/api/konseling', (req, res) => {
    try {
        const { mode, nama, nis, urgensi, aduan } = req.body;

        // Validasi data
        if (!aduan || !urgensi) {
            return res.status(400).json({ error: "Isi aduan dan urgensi tidak boleh kosong." });
        }

        const dataBaru = {
            id: Date.now(),
            mode: mode || 'anonim',
            nama: mode === 'public' ? nama : 'Anonim',
            nis: mode === 'public' ? nis : '-',
            urgensi: urgensi,
            aduan: aduan,
            created_at: new Date()
        };

        databaseAduan.unshift(dataBaru); // Masukkan ke urutan paling atas
        console.log("Aduan baru masuk:", dataBaru);

        res.status(201).json({ 
            message: "Aduan berhasil dikirim secara " + dataBaru.mode 
        });
    } catch (error) {
        res.status(500).json({ error: "Terjadi kesalahan pada server." });
    }
});

// 3. Hapus aduan (Dari Dashboard Guru BK)
app.delete('/api/konseling/:id', (req, res) => {
    const { id } = req.params;
    const initialLength = databaseAduan.length;
    databaseAduan = databaseAduan.filter(item => item.id != id);

    if (databaseAduan.length < initialLength) {
        res.json({ message: "Aduan berhasil dihapus." });
    } else {
        res.status(404).json({ error: "Data tidak ditemukan." });
    }
});

// Root route untuk cek status server
app.get('/api/status', (req, res) => {
    res.json({ status: "Server BK Online Aktif", total_aduan: databaseAduan.length });
});

// Ekspor aplikasi untuk Vercel
module.exports = app;
