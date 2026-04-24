// Fungsi navigasi antar halaman
function showPage(pageId) {
    const pages = document.querySelectorAll('.page');
    pages.forEach(page => page.classList.remove('active'));

    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');

    const navLinks = document.querySelectorAll('.nav-links a');
    navLinks.forEach(link => link.classList.remove('active'));

    const activeLink = document.getElementById('link-' + pageId);
    if (activeLink) activeLink.classList.add('active');

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
        document.getElementById('nama').value = '';
        document.getElementById('nis').value = '';
    }
}

// Submit Form Aduan
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
            this.reset();
            if (currentMode === 'anonim') setMode('anonim');
            showPopupPenilaian();
        } else {
            alert("Gagal: " + result.error);
        }
    } catch (error) {
        console.error("Error:", error);
        alert("Gagal terhubung ke server backend.");
    }
});

// ============================
// POPUP PENILAIAN
// ============================
function showPopupPenilaian() {
    document.getElementById('popupPenilaian').style.display = 'flex';
}

function closePopupPenilaian() {
    document.getElementById('popupPenilaian').style.display = 'none';
    loadPenilaianBeranda();
}

function kePenilaian() {
    window.location.href = '/penilaian';
}

// ============================
// PENILAIAN DI BERANDA
// ============================
async function loadPenilaianBeranda() {
    try {
        const voteRes = await fetch('/api/penilaian/votes');
        const voteData = await voteRes.json();

        const likes = voteData.likes || 0;
        const dislikes = voteData.dislikes || 0;
        const total = likes + dislikes;
        const likePct = total > 0 ? Math.round((likes / total) * 100) : 0;
        const dislikePct = 100 - likePct;

        animateNumber('berandaLikeCount', likes);
        animateNumber('berandaDislikeCount', dislikes);

        document.getElementById('berandaBarLike').style.width = likePct + '%';
        document.getElementById('berandaBarDislike').style.width = dislikePct + '%';
        document.getElementById('berandaLikePct').textContent = likePct;
        document.getElementById('berandaDislikePct').textContent = dislikePct;
        document.getElementById('berandaVoteTotal').textContent =
            total > 0
                ? `Total ${total} pengguna telah memberikan penilaian`
                : 'Belum ada penilaian. Jadilah yang pertama!';

    } catch (e) {
        document.getElementById('berandaVoteTotal').textContent = 'Gagal memuat data penilaian.';
        console.error('Error load votes:', e);
    }

    try {
        const komentarRes = await fetch('/api/penilaian/komentar');
        const komentarData = await komentarRes.json();

        const list = document.getElementById('berandaKomentarList');
        const badge = document.getElementById('berandaKomentarCount');

        badge.textContent = `${komentarData.length} komentar`;

        if (komentarData.length === 0) {
            list.innerHTML = `
                <div class="komentar-empty">
                    <i class="fas fa-comment-dots" style="font-size:1.8rem; display:block; margin-bottom:8px; opacity:0.3"></i>
                    Belum ada komentar. Jadilah yang pertama!
                </div>`;
            return;
        }

        const preview = komentarData.slice(0, 3);
        list.innerHTML = '';
        preview.forEach(item => {
            const el = document.createElement('div');
            el.className = 'komentar-preview-item';
            el.innerHTML = `
                <div class="komentar-preview-nama">
                    <i class="fas fa-${item.nama === 'Anonim' ? 'user-secret' : 'user'}"></i>
                    ${item.nama}
                </div>
                <div class="komentar-preview-isi">${item.komentar}</div>
            `;
            list.appendChild(el);
        });

        if (komentarData.length > 3) {
            const more = document.createElement('div');
            more.style.cssText = 'text-align:center; margin-top:12px;';
            more.innerHTML = `
                <a href="/penilaian" style="color:#74b9ff; font-size:0.85rem; text-decoration:none; font-weight:600;">
                    Lihat semua ${komentarData.length} komentar <i class="fas fa-arrow-right"></i>
                </a>`;
            list.appendChild(more);
        }

    } catch (e) {
        document.getElementById('berandaKomentarList').innerHTML =
            '<div class="komentar-empty">Gagal memuat komentar.</div>';
        console.error('Error load komentar:', e);
    }
}

// Animasi angka naik
function animateNumber(elementId, target) {
    const el = document.getElementById(elementId);
    if (!el) return;
    const duration = 800;
    const start = performance.now();
    const from = parseInt(el.textContent) || 0;

    function update(time) {
        const elapsed = time - start;
        const progress = Math.min(elapsed / duration, 1);
        const eased = 1 - Math.pow(1 - progress, 3);
        el.textContent = Math.round(from + (target - from) * eased);
        if (progress < 1) requestAnimationFrame(update);
    }
    requestAnimationFrame(update);
}

// ============================
// MODAL LOGIN GURU BK
// ============================
function loginGuru() {
    document.getElementById('adminModal').style.display = 'flex';
    document.getElementById('adminPass').focus();
}

function closeModal() {
    document.getElementById('adminModal').style.display = 'none';
    document.getElementById('adminPass').value = '';
    document.getElementById('loginError').style.display = 'none';
}

function validateLogin() {
    const passInput = document.getElementById('adminPass').value;
    const errorMsg = document.getElementById('loginError');
    const secretKey = "adminbk2026";

    if (passInput === secretKey) {
        alert("Selamat datang, Ibu Nazwa Azizah.");
        window.location.href = "admin.html";
    } else {
        errorMsg.style.display = 'block';
        const content = document.querySelector('.modal-content');
        content.style.animation = 'shake 0.3s ease';
        setTimeout(() => content.style.animation = '', 300);
    }
}

document.getElementById('adminPass')?.addEventListener('keypress', function(e) {
    if (e.key === 'Enter') validateLogin();
});

// ============================
// INIT
// ============================
window.addEventListener('load', () => {
    loadPenilaianBeranda();
});