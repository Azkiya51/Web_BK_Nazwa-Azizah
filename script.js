// Fungsi navigasi antar halaman
function showPage(pageId) {
    // 1. Ambil semua elemen dengan class 'page'
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => {
        page.classList.remove('active');
    });

    // 2. Tampilkan halaman yang dipilih
    const activePage = document.getElementById(pageId);
    if (activePage) {
        activePage.classList.add('active');
    }

    // 3. Atur status menu aktif di navbar
    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => {
        link.classList.remove('active');
    });
    document.getElementById('link-' + pageId).classList.add('active');

    // Scroll ke atas otomatis
    window.scrollTo(0, 0);
}

// Fungsi ganti mode (Anonim vs Publik)
let currentMode = 'anonim';

function setMode(mode) {
    currentMode = mode;
    const identitasField = document.getElementById('identitasField');
    const btnAnonim = document.getElementById('btnAnonim');
    const btnPublic = document.getElementById('btnPublic');

    if (mode === 'public') {
        identitasField.style.display = 'block';
        btnPublic.classList.add('active');
        btnAnonim.classList.remove('active');
    } else {
        identitasField.style.display = 'none';
        btnAnonim.classList.add('active');
        btnPublic.classList.remove('active');
        // Reset data input
        document.getElementById('nama').value = '';
        document.getElementById('nis').value = '';
    }
}

document.getElementById('counselingForm').addEventListener('submit', async function(e) {
    e.preventDefault();
    
    const payload = {
        mode: currentMode,
        nama: currentMode === 'public' ? document.getElementById('nama').value : 'Anonim',
        nis: currentMode === 'public' ? document.getElementById('nis').value : '-',
        urgensi: document.getElementById('urgensi').value,
        aduan: document.getElementById('aduan').value
    };

    try {
         const response = await fetch('/api/konseling', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        const result = await response.json();

        if (response.ok) {
            alert("Berhasil! " + result.message);
            this.reset();
            if(currentMode === 'anonim') setMode('anonim');
        } else {
            alert("Gagal: " + result.error);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Gagal terhubung ke server backend.");
    }
});
// Membuka Modal
function loginGuru() {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminPass').focus();
}

// Menutup Modal
function closeModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('adminPass').value = '';
    document.getElementById('loginError').style.display = 'none';
}

// Validasi Login
function validateLogin() {
    const passInput = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('loginError');
    const secretKey = "adminbk2026"; // Sesuaikan password kamu

    if (passInput === secretKey) {
        // Efek transisi sukses
        alert("Selamat datang, Ibu Nazwa Azizah.");
        window.location.href = "admin.html";
    } else {
        errorMsg.style.display = 'block';
        // Animasi getar sederhana jika salah
        const content = document.querySelector('.modal-content');
        content.style.animation = 'shake 0.3s ease';
        setTimeout(() => content.style.animation = '', 300);
    }
}

// Tambahkan listener Enter untuk input password
document.getElementById('adminPass')?.addEventListener('keypress', function (e) {
    if (e.key === 'Enter') validateLogin();
});

// Animasi Shake di CSS
/* Tambahkan ini ke style.css */
/* @keyframes shake {
    0%, 100% { transform: translateX(0); }
    25% { transform: translateX(-10px); }
    75% { transform: translateX(10px); }
}
*/
