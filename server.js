const express = require('express');
const path = require('path');
const app = express();

app.use(express.static(path.join(__dirname)));
app.use(express.json());

// Route halaman utama
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Route admin
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'admin.html'));
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server berjalan di port ${PORT}`));

module.exports = app;
