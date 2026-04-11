const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(bodyParser.json());

// Koneksi ke MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',      // Sesuaikan dengan user MySQL kamu
    password: '',      // Sesuaikan dengan password MySQL kamu
    database: 'bk_digital'
});

db.connect((err) => {
    if (err) {
        console.error('Gagal koneksi ke MySQL:', err);
        return;
    }
    console.log('Terhubung ke Database MySQL (bk_digital)');
});

// --- API ENDPOINTS ---

// 1. Kirim Aduan (POST)
app.post('/api/konseling', (req, res) => {
    const { mode, nama, nis, urgensi, aduan } = req.body;

    // Validasi sederhana
    if (!aduan || !urgensi) {
        return res.status(400).json({ error: "Aduan dan Urgensi wajib diisi" });
    }

    // Jika mode anonim, pastikan nama & nis dikosongkan untuk database
    const finalNama = mode === 'anonim' ? 'Anonim' : nama;
    const finalNis = mode === 'anonim' ? null : nis;

    const query = "INSERT INTO aduan (mode, nama, nis, urgensi, aduan) VALUES (?, ?, ?, ?, ?)";
    const values = [mode, finalNama, finalNis, urgensi, aduan];

    db.query(query, values, (err, result) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal menyimpan ke database" });
        }
        res.status(201).json({ message: "Aduan berhasil dikirim!", id: result.insertId });
    });
});

// 2. Ambil Semua Aduan (GET) - Digunakan untuk Dashboard Guru BK
app.get('/api/konseling', (req, res) => {
    const query = "SELECT * FROM aduan ORDER BY created_at DESC";
    
    db.query(query, (err, results) => {
        if (err) {
            console.error(err);
            return res.status(500).json({ error: "Gagal mengambil data" });
        }
        res.json(results);
    });
});

// 3. Hapus Aduan (DELETE)
app.delete('/api/konseling/:id', (req, res) => {
    const query = "DELETE FROM aduan WHERE id = ?";
    db.query(query, [req.params.id], (err, result) => {
        if (err) return res.status(500).json({ error: "Gagal menghapus" });
        res.json({ message: "Aduan berhasil dihapus" });
    });
});

app.listen(PORT, () => {
    console.log(`Server Backend BK aktif di: http://localhost:${PORT}`);
});