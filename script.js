// ============================
// NAVIGASI ANTAR HALAMAN
// ============================
function showPage(pageId) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const activePage = document.getElementById(pageId);
    if (activePage) activePage.classList.add('active');

    document.querySelectorAll('.nav-links a').forEach(l => l.classList.remove('active'));
    const activeLink = document.getElementById('link-' + pageId);
    if (activeLink) activeLink.classList.add('active');

    window.scrollTo(0, 0);
}

// ============================
// MODE KONSELING (Anonim/Publik)
// ============================
let currentMode = 'anonim';

function setMode(mode) {
    currentMode = mode;
    const identitasField = document.getElementById('identitasField');
    document.getElementById('btnAnonim').classList.toggle('active', mode === 'anonim');
    document.getElementById('btnPublic').classList.toggle('active', mode === 'public');

    if (mode === 'public') {
        identitasField.style.display = 'block';
    } else {
        identitasField.style.display = 'none';
        document.getElementById('nama').value = '';
        document.getElementById('nis').value = '';
    }
}

// ============================
// SUBMIT FORM ADUAN → SUPABASE
// ============================
document.getElementById('counselingForm').addEventListener('submit', async function(e) {
    e.preventDefault();

    const aduan = document.getElementById('aduan').value.trim();
    if (aduan.length < 10) {
        alert('Aduan terlalu pendek. Minimal 10 karakter.');
        return;
    }

    const payload = {
        mode: currentMode,
        nama: currentMode === 'public' ? (document.getElementById('nama').value || 'Anonim') : 'Anonim',
        nis: currentMode === 'public' ? (document.getElementById('nis').value || '-') : '-',
        urgensi: document.getElementById('urgensi').value,
        aduan: aduan
    };

    const btn = this.querySelector('.btn-submit');
    btn.disabled = true;
    btn.textContent = 'Mengirim...';

    try {
        const { error } = await db.from('konseling').insert([payload]);
        if (error) throw error;

        this.reset();
        if (currentMode === 'anonim') setMode('anonim');
        showPopupPenilaian();
    } catch (error) {
        console.error('Error:', error);
        alert('Gagal mengirim aduan: ' + error.message);
    } finally {
        btn.disabled = false;
        btn.textContent = 'Kirim Aduan Sekarang';
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
    window.location.href = 'penilaian.html';
}

// ============================
// PENILAIAN DI BERANDA → SUPABASE
// ============================
async function loadPenilaianBeranda() {
    // Load votes
    try {
        const { data, error } = await db.from('penilaian_votes').select('type');
        if (error) throw error;

        const likes = data.filter(v => v.type === 'like').length;
        const dislikes = data.filter(v => v.type === 'dislike').length;
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
    }

    // Load komentar
    try {
        const { data, error } = await db
            .from('penilaian_komentar')
            .select('*')
            .order('created_at', { ascending: false })
            .limit(3);
        if (error) throw error;

        const list = document.getElementById('berandaKomentarList');
        const badge = document.getElementById('berandaKomentarCount');

        // Ambil total count
        const { count } = await db
            .from('penilaian_komentar')
            .select('*', { count: 'exact', head: true });

        badge.textContent = `${count || 0} komentar`;

        if (!data || data.length === 0) {
            list.innerHTML = `
                <div class="komentar-empty">
                    <i class="fas fa-comment-dots" style="font-size:1.8rem;display:block;margin-bottom:8px;opacity:0.3"></i>
                    Belum ada komentar. Jadilah yang pertama!
                </div>`;
            return;
        }

        list.innerHTML = '';
        data.forEach(item => {
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

        if (count > 3) {
            const more = document.createElement('div');
            more.style.cssText = 'text-align:center;margin-top:12px;';
            more.innerHTML = `
                <a href="penilaian.html" style="color:#74b9ff;font-size:0.85rem;text-decoration:none;font-weight:600;">
                    Lihat semua ${count} komentar <i class="fas fa-arrow-right"></i>
                </a>`;
            list.appendChild(more);
        }
    } catch (e) {
        document.getElementById('berandaKomentarList').innerHTML =
            '<div class="komentar-empty">Gagal memuat komentar.</div>';
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
// VIEW COUNTER → SUPABASE
// ============================
async function recordPageView() {
    try {
        const key = 'view_recorded_' + (window.location.pathname || '/');
        if (!sessionStorage.getItem(key)) {
            await db.from('page_views').insert([{
                ip_address: 'client',
                user_agent: navigator.userAgent,
                page: window.location.pathname || '/',
                visited_at: new Date().toISOString()
            }]);
            sessionStorage.setItem(key, '1');
        }
    } catch (e) {
        console.log('View record skipped:', e.message);
    }
}

async function loadViewsCounter() {
    const el = document.getElementById('viewsCounter');
    if (!el) return;
    try {
        const { count, error } = await db
            .from('page_views')
            .select('*', { count: 'exact', head: true });
        if (error) throw error;

        // Animate number in
        el.innerHTML = '';
        const target = count || 0;
        const span = document.createElement('span');
        span.textContent = '0';
        el.appendChild(span);

        const duration = 1200;
        const start = performance.now();
        function update(time) {
            const elapsed = time - start;
            const progress = Math.min(elapsed / duration, 1);
            const eased = 1 - Math.pow(1 - progress, 3);
            span.textContent = Math.round(target * eased).toLocaleString('id-ID');
            if (progress < 1) requestAnimationFrame(update);
        }
        requestAnimationFrame(update);
    } catch (e) {
        if (el) el.textContent = '–';
    }
}

// ============================
// LOAD JURNAL DARI SUPABASE
// ============================
async function loadJurnalBeranda() {
    const grid = document.getElementById('jurnalGrid');
    if (!grid) return;
    try {
        const { data, error } = await db
            .from('jurnal')
            .select('*')
            .order('created_at', { ascending: false });
        if (error) throw error;

        if (!data || data.length === 0) {
            grid.innerHTML = `
                <div class="journal-card" style="text-align:center;color:#bbb;padding:40px 20px;grid-column:1/-1">
                    <i class="fas fa-book-open" style="font-size:2rem;display:block;margin-bottom:10px;opacity:0.3"></i>
                    Belum ada jurnal. Admin belum menambahkan konten.
                </div>`;
            return;
        }

        grid.innerHTML = '';
        data.forEach(item => {
            const card = document.createElement('div');
            card.className = 'journal-card';
            card.innerHTML = `
                <div class="journal-tag">${item.kategori}</div>
                <h3>${item.judul}</h3>
                <p>${item.ringkasan}</p>
                ${item.url
                    ? `<a href="${item.url}" target="_blank" class="read-more">Baca Jurnal Asli <i class="fas fa-external-link-alt"></i></a>`
                    : `<span style="font-size:0.8rem;color:#bbb"><i class="fas fa-link-slash"></i> Tidak ada link</span>`
                }
            `;
            grid.appendChild(card);
        });
    } catch (e) {
        if (grid) grid.innerHTML = `
            <div class="journal-card" style="color:#e74c3c;grid-column:1/-1;text-align:center;padding:30px">
                <i class="fas fa-exclamation-circle"></i> Gagal memuat jurnal: ${e.message}
            </div>`;
    }
}

// ============================
// INIT
// ============================
window.addEventListener('load', async () => {
    await recordPageView();   // catat dulu, baru load counter biar terhitung
    loadPenilaianBeranda();
    loadViewsCounter();
    loadJurnalBeranda();
});