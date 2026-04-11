const express = require('express');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Simulasi Database di Memori
let tempAduan = [];

app.post('/api/konseling', (req, res) => {
    const data = { 
        id: Date.now(), 
        ...req.body, 
        created_at: new Date() 
    };
    tempAduan.push(data);
    res.status(201).json({ message: "Berhasil disimpan (Temporary)" });
});

app.get('/api/konseling', (req, res) => {
    res.json(tempAduan);
});

app.delete('/api/konseling/:id', (req, res) => {
    tempAduan = tempAduan.filter(item => item.id != req.params.id);
    res.json({ message: "Terhapus" });
});

module.exports = app; // Penting untuk Vercel
