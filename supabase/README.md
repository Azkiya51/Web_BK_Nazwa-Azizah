# BK-Care — Platform Bimbingan Konseling Digital

## 📁 Struktur Folder

```
bk-care/
├── server.js            ← Backend Express + Supabase
├── package.json
├── .env                 ← Konfigurasi rahasia (jangan di-commit!)
├── .env.example         ← Template .env
├── supabase_schema.sql  ← SQL untuk setup database
└── public/
    ├── index.html
    ├── admin.html
    ├── style.css
    └── script.js
```

---

## 🚀 Cara Setup (Langkah demi Langkah)

### 1. Setup Supabase

1. Buka [https://supabase.com](https://supabase.com) dan login/daftar
2. Klik **"New Project"** → isi nama, password database, pilih region terdekat (Singapore)
3. Tunggu project selesai dibuat (~1-2 menit)
4. Buka **SQL Editor** → klik **"New Query"**
5. Copy-paste isi file `supabase_schema.sql` → klik **Run**
6. Buka **Project Settings → API**:
   - Copy **Project URL** → simpan untuk `SUPABASE_URL`
   - Copy **anon/public** key → simpan untuk `SUPABASE_ANON_KEY`

### 2. Setup Project Lokal

```bash
# Clone / buat folder project
mkdir bk-care && cd bk-care

# Install dependencies
npm install

# Salin file environment
cp .env.example .env
```

### 3. Isi file `.env`

Buka file `.env` dan isi dengan kredensial Supabase kamu:

```env
SUPABASE_URL=https://xxxxxxxxxxx.supabase.co
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.xxxxx
PORT=3000
```

### 4. Letakkan File HTML/CSS/JS

Buat folder `public/` dan pindahkan semua file frontend ke dalamnya:
```
public/index.html
public/admin.html
public/style.css
public/script.js
```

### 5. Jalankan Server

```bash
# Mode production
npm start

# Mode development (auto-restart saat ada perubahan)
npm run dev
```

Server berjalan di: **http://localhost:3000**

---

## 🔌 API Endpoints

| Method | Endpoint | Deskripsi |
|--------|----------|-----------|
| `GET` | `/api/konseling` | Ambil semua aduan (terbaru dulu) |
| `POST` | `/api/konseling` | Kirim aduan baru |
| `DELETE` | `/api/konseling/:id` | Hapus aduan berdasarkan ID |
| `GET` | `/api/health` | Cek status server |

### Contoh Body POST `/api/konseling`
```json
{
  "mode": "public",
  "nama": "Budi Santoso",
  "nis": "12345",
  "urgensi": "sedang",
  "aduan": "Saya mengalami tekanan akademik yang berat belakangan ini."
}
```

---

## 🔐 Keamanan

- **Password admin** ada di `script.js` pada variabel `secretKey`. Ganti dengan password yang kuat.
- File `.env` **jangan pernah** di-commit ke Git. Tambahkan ke `.gitignore`:
  ```
  node_modules/
  .env
  ```
- Untuk production, pertimbangkan menggunakan `SUPABASE_SERVICE_ROLE_KEY` dengan autentikasi yang lebih ketat.

---

## 🛠️ Teknologi

- **Frontend**: HTML, CSS, JavaScript (Vanilla)
- **Backend**: Node.js + Express.js
- **Database**: Supabase (PostgreSQL)
- **Icons**: Font Awesome 6
- **Font**: Poppins (Google Fonts)
