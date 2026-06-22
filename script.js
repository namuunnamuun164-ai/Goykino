// ===== SUPABASE ТОХИРГОО =====
const SUPABASE_URL = 'https://mnglegavqvpysofyezwm.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1uZ2xlZ2F2cXZweXNvZnllendtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODE5NzA3NjcsImV4cCI6MjA5NzU0Njc2N30.X64AGOH8i-d_CKiC3SHYaSMNdMqvgxiYzMcu-YB8iks';

// Supabase client
const supabaseClient = window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY);


// Cloudflare R2 тохиргоо (public bucket URL)
const R2_PUBLIC_URL = 'https://YOUR_R2_BUCKET.r2.dev';

// EmailJS тохиргоо (Gmail OTP илгээхэд)
// EmailJS.com дээр бүртгүүлж, Gmail service нэмж Public Key авна уу
const EMAILJS_SERVICE_ID = 'YOUR_EMAILJS_SERVICE_ID';
const EMAILJS_TEMPLATE_ID = 'YOUR_EMAILJS_TEMPLATE_ID';
const EMAILJS_PUBLIC_KEY = 'YOUR_EMAILJS_PUBLIC_KEY';

// ===== ДОТООД ӨГӨГДЛИЙН ХАДГАЛАЛТ (Supabase холбоогүй үед) =====
let movies = JSON.parse(localStorage.getItem('nova_movies')) || [
    {
        id: 1, title: 'Solo Leveling',
        desc: 'Дэлхийн хамгийн сул ангууч хэрхэн хүчирхэгжсэн бэ...',
        price: 0, code: 'SL-01', category: 'web',
        status: 'Үргэлжилж байгаа', views: 1540,
        cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
        episodes: [
            { num: 1, title: '1-р анги', file: 'https://www.w3schools.com/html/mov_bbb.mp4', thumb: '' },
            { num: 2, title: '2-р анги', file: 'https://www.w3schools.com/html/movie.mp4', thumb: '' }
        ],
        isTrending: true, isNew: true
    },
    {
        id: 2, title: 'Crash Landing on You',
        desc: 'Өмнөд Солонгосын баян өв залгамжлагч бүсгүй шүхрээр нисэж яваад Хойд Солонгост очиход...',
        price: 2500, code: 'CL-99', category: 'drama',
        status: 'Дууссан', views: 890,
        cover: 'https://images.unsplash.com/photo-1533488765986-dfa2a9939acd?w=400',
        episodes: [
            { num: 1, title: '1-р анги', file: 'https://www.w3schools.com/html/mov_bbb.mp4', thumb: '' }
        ],
        isTrending: true, isNew: false
    }
];

let users = [];


let requests = JSON.parse(localStorage.getItem('nova_requests')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('nova_current_user')) || null;
let currentSelectedMovieId = null;
let tempSelectedAvatarUrl = '';
let currentActiveCategory = 'all';
let tempSelectedVideoFile = '';
let tempSelectedCoverFile = '';
let tempSelectedEpThumb = '';
let adminSelectedSeriesId = null;
let adminEditingMovieId = null;
let adminActiveTab = 'moviesTab';

// OTP хувьсагчид
let otpCode = '';
let otpTargetUser = null;
let otpTimerInterval = null;

// ===== APP ЭХЛҮҮЛЭХ =====
window.onload = function () {
    if (typeof emailjs !== 'undefined') {
        emailjs.init(EMAILJS_PUBLIC_KEY);
    }

    loadInitialDataFromSupabase();   // ← ШИНЭ
    checkAuthUI();
    updateRequestBadge();
    showPage('homePage');

    // Sidebar overlay нэмэх
    let overlay = document.createElement('div');
    overlay.className = 'sidebar-overlay';
    overlay.id = 'sidebarOverlay';
    overlay.onclick = closeSidebar;
    document.body.appendChild(overlay);
};

function saveData() {
    if (currentUser) {
        let idx = users.findIndex(u => u.id === currentUser.id);
        if (idx !== -1) users[idx] = currentUser;
    }
    localStorage.setItem('nova_movies', JSON.stringify(movies));
    localStorage.setItem('nova_users', JSON.stringify(users));
    localStorage.setItem('nova_requests', JSON.stringify(requests));
    if (currentUser) sessionStorage.setItem('nova_current_user', JSON.stringify(currentUser));
}

// ===== ХУУДАС ШИЛЖИЛТ =====
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
    let target = document.getElementById(pageId);
    if (target) target.classList.remove('hidden');

    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));

    let navMap = {
        homePage: 'nav-home', allMoviesPage: 'nav-allMovies',
        vipPage: 'nav-vip', profilePage: 'nav-profile',
        adminPage: 'nav-admin', modPage: 'nav-modPanel'
    };
    let navEl = document.getElementById(navMap[pageId]);
    if (navEl) navEl.classList.add('active');

    if (pageId === 'allMoviesPage') renderAllMoviesPage();
    if (pageId === 'profilePage') renderUserProfile();
    if (pageId === 'adminPage') initAdminPanel();

    if (window.innerWidth <= 768) closeSidebar();
    window.scrollTo(0, 0);
}

function toggleSidebar() {
    let sidebar = document.getElementById('appSidebar');
    let overlay = document.getElementById('sidebarOverlay');
    sidebar.classList.toggle('open');
    if (overlay) overlay.classList.toggle('active');
}

function closeSidebar() {
    let sidebar = document.getElementById('appSidebar');
    let overlay = document.getElementById('sidebarOverlay');
    if (sidebar) sidebar.classList.remove('open');
    if (overlay) overlay.classList.remove('active');
}

// ===== AUTH UI =====
function checkAuthUI() {
    const authBtn = document.getElementById('authBtnContainer');
    const userBox = document.getElementById('topUserAvatarBox');

    ['nav-profile', 'nav-admin', 'nav-modPanel'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });

    if (currentUser) {
        if (authBtn) authBtn.classList.add('hidden');
        if (userBox) userBox.classList.remove('hidden');
        document.getElementById('topUsername').innerText = currentUser.name;
        document.getElementById('topUserImg').src = currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

        let navProfile = document.getElementById('nav-profile');
        if (navProfile) navProfile.classList.remove('hidden');

        if (currentUser.role === 'admin') {
            let navAdmin = document.getElementById('nav-admin');
            if (navAdmin) navAdmin.classList.remove('hidden');
        } else if (currentUser.role === 'moderator') {
            let navMod = document.getElementById('nav-modPanel');
            if (navMod) navMod.classList.remove('hidden');
        }
    } else {
        if (authBtn) authBtn.classList.remove('hidden');
        if (userBox) userBox.classList.add('hidden');
    }
}

// ===== МОДАЛ НЭЭХ/ХААХ =====
function openModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'flex';
        modal.classList.remove('hidden');
    }
}

function closeModal(modalId) {
    let modal = document.getElementById(modalId);
    if (modal) {
        modal.style.display = 'none';
        modal.classList.add('hidden');
    }
}

function switchForm(formId) {
    ['loginForm', 'registerForm'].forEach(f => {
        let el = document.getElementById(f);
        if (el) el.classList.add('hidden');
    });
    let target = document.getElementById(formId);
    if (target) target.classList.remove('hidden');
}

// ===== НЭВТРЭХ / ГАРАХ =====
function loginLogic() {
    let email = document.getElementById('loginEmail').value.trim();
    let pass = document.getElementById('loginPass').value;
    let user = users.find(u => u.email === email && u.pass === pass);

    if (user) {
        currentUser = user;
        sessionStorage.setItem('nova_current_user', JSON.stringify(currentUser));
        closeModal('loginModal');
        checkAuthUI();
        showPage('homePage');
        // Нэвтрэх үед alert() биш тосогч мэдэгдэл харуулах
        showToast(`Тавтай морил, ${currentUser.name}! 👋`);
    } else {
        showToast('Имэйл эсвэл нууц үг буруу байна!', 'error');
    }
}

  async function registerLogic() {
    let name = document.getElementById('regName').value.trim();
    let phone = document.getElementById('regPhone').value.trim();
    let email = document.getElementById('regEmail').value.trim();
    let pass = document.getElementById('regPass').value;

    if (!name || !phone || !email || !pass)
        return showToast('Бүх талбарыг бөглөнө үү!', 'error');
    if (users.some(u => u.email === email))
        return showToast('Энэ имэйл аль хэдийн бүртгэгдсэн байна!', 'error');

    let newUser = {
        name,
        phone,
        email,
        pass,
        role: 'user',
        vipExpires: null,
        rentedMovies: [],
        history: [],
        avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    };

    // Локал массив + localStorage
    users.push(newUser);
    currentUser = newUser;
    saveData();

    // === ЭНЭ ХЭСЭГ НЬ SUPABASE РУУ ХАДГАЛАХ ===
   const { error } = await supabaseClient.from('profile').insert(newUser);
    if (error) {
        console.error('Supabase profile insert алдаа:', error);
        // хүсвэл алдаа гарвал toast харуулж болно
        // showToast('Сервер талд бүртгэл хадгалахад алдаа гарлаа', 'error');
    }
    // ==========================================

    closeModal('loginModal');
    checkAuthUI();
    showPage('homePage');
    showToast('Бүртгэл амжилттай үүслээ! 🎉');
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('nova_current_user');
    checkAuthUI();
    showPage('homePage');
}

// ===== ТОСТ МЭДЭГДЭЛ (alert-н оронд) =====
function showToast(message, type = 'success') {
    let existing = document.getElementById('toastBox');
    if (existing) existing.remove();

    let toast = document.createElement('div');
    toast.id = 'toastBox';
    toast.style.cssText = `
        position:fixed;bottom:30px;right:20px;z-index:9999;
        background:${type === 'error' ? '#ef4444' : '#10b981'};
        color:white;padding:14px 20px;border-radius:10px;
        font-size:14px;font-weight:600;max-width:320px;
        box-shadow:0 4px 20px rgba(0,0,0,0.3);
        animation:slideIn 0.3s ease;
    `;
    toast.innerHTML = `<i class="fas fa-${type === 'error' ? 'times-circle' : 'check-circle'}"></i> ${message}`;
    document.body.appendChild(toast);

    let style = document.createElement('style');
    style.textContent = '@keyframes slideIn{from{opacity:0;transform:translateX(100px);}to{opacity:1;transform:translateX(0);}}';
    document.head.appendChild(style);

    setTimeout(() => { if (toast.parentNode) toast.remove(); }, 3500);
}

// ===== КИНО КАРТ ҮҮСГЭХ =====
function createMovieCard(m) {
    let badge = m.price > 0
        ? `<div class="badge-vip-card">${m.price.toLocaleString()} ₮</div>`
        : `<div class="badge-vip-card" style="background:#10b981;">Үнэгүй</div>`;
    let cover = m.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
    return `
        <div class="movie-card" onclick="showMovieProfile(${m.id})">
            ${badge}
            <img class="card-cover" src="${cover}" alt="${m.title}" loading="lazy">
            <div class="card-info">
                <div class="card-title">${m.title}</div>
                <span class="badge">${m.category === 'drama' ? 'Цуврал' : 'Вэбтун'}</span>
            </div>
        </div>
    `;
}

function renderHomeMovies() {
    let trendingGrid = document.getElementById('grid-trending');
    let newGrid = document.getElementById('grid-new');
    if (trendingGrid) trendingGrid.innerHTML = movies.filter(m => m.isTrending).map(createMovieCard).join('') || '<p style="color:var(--text-muted);">Трэнд контент байхгүй байна.</p>';
    if (newGrid) newGrid.innerHTML = movies.filter(m => m.isNew).map(createMovieCard).join('') || '<p style="color:var(--text-muted);">Шинэ контент байхгүй байна.</p>';
}

function renderAllMoviesPage() {
    let grid = document.getElementById('grid-all-movies');
    if (!grid) return;
    let filtered = currentActiveCategory === 'all' ? movies : movies.filter(m => m.category === currentActiveCategory);
    grid.innerHTML = filtered.length > 0 ? filtered.map(createMovieCard).join('') : '<p style="color:var(--text-muted);">Энэ ангилалд одоогоор контент байхгүй байна.</p>';
}

function filterCategory(cat, element) {
    currentActiveCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if (element) element.classList.add('active');
    renderAllMoviesPage();
}

function searchMoviesHome() {
    let val = document.getElementById('mainMovieSearchInput').value.toLowerCase();
    let tGrid = document.getElementById('grid-trending');
    let nGrid = document.getElementById('grid-new');
    let filtered = movies.filter(m => m.title.toLowerCase().includes(val));
    if (tGrid) tGrid.innerHTML = filtered.filter(m => m.isTrending).map(createMovieCard).join('');
    if (nGrid) nGrid.innerHTML = filtered.filter(m => m.isNew).map(createMovieCard).join('');
}

// ===== КИНО ДЭЛГЭРЭНГҮЙ =====
function showMovieProfile(id) {
    let m = movies.find(mv => mv.id === id);
    if (!m) return;
    currentSelectedMovieId = id;
    m.views = (m.views || 0) + 1;

    if (currentUser) {
        if (!currentUser.history) currentUser.history = [];
        currentUser.history = currentUser.history.filter(hid => hid !== id);
        currentUser.history.unshift(id);
        if (currentUser.history.length > 8) currentUser.history = currentUser.history.slice(0, 8);
    }
    saveData();

    document.getElementById('mProfType').innerText = m.category === 'drama' ? 'ЦУВРАЛ КИНО' : 'ВЭБТУН / КОМИК';
    document.getElementById('mProfTitle').innerText = m.title;
    document.getElementById('mProfDesc').innerText = m.desc;
    document.getElementById('mProfStatus').innerText = m.status;
    document.getElementById('mProfViews').innerText = m.views.toLocaleString();
    document.getElementById('mProfPrice').innerText = m.price === 0 ? 'Үнэгүй' : `${m.price.toLocaleString()} ₮`;

    let cover = m.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
    document.getElementById('mProfCoverContainer').innerHTML = `<img src="${cover}" alt="cover">`;

    // Видео тоглуулагчийг нуух
    closeVideoPlayer();
    renderMovieActionButtons(m);
    showPage('movieProfilePage');
}

function isVipActive(user) {
    if (!user || !user.vipExpires) return false;
    return user.vipExpires > Date.now();
}

function renderMovieActionButtons(m) {
    let container = document.getElementById('movieActionButtonsContainer');
    let epBlock = document.getElementById('episodesBlockContainer');
    container.innerHTML = '';

    if (m.price === 0) {
        container.innerHTML = `<span style="color:#10b981;font-weight:bold;"><i class="fas fa-unlock"></i> Үнэгүй үзэх боломжтой</span>`;
        if (epBlock) epBlock.classList.remove('hidden');
        renderEpisodesList(m.episodes);
        return;
    }

    if (!currentUser) {
        container.innerHTML = `<button class="btn-main" onclick="openModal('loginModal')"><i class="fas fa-sign-in-alt"></i> Нэвтэрч үзэх</button>`;
        if (epBlock) epBlock.classList.add('hidden');
        return;
    }

    let hasVip = isVipActive(currentUser);
    let hasRented = currentUser.rentedMovies && currentUser.rentedMovies.includes(m.code);

    if (hasVip || hasRented) {
        container.innerHTML = `<span style="color:var(--vip-color);font-weight:bold;"><i class="fas fa-check-circle"></i> Үзэх эрх нээлттэй ${hasVip ? '(VIP)' : '(Түрээслэсэн)'}</span>`;
        if (epBlock) epBlock.classList.remove('hidden');
        renderEpisodesList(m.episodes);
    } else {
        container.innerHTML = `
            <button class="btn-vip" onclick="showPage('vipPage')"><i class="fas fa-crown"></i> VIP авах</button>
            <button class="btn-main" onclick="rentMovieDirect('${m.code}', ${m.price})"><i class="fas fa-key"></i> Түрээслэх (${m.price.toLocaleString()} ₮)</button>
        `;
        if (epBlock) epBlock.classList.add('hidden');
    }
}

function renderEpisodesList(episodes) {
    let grid = document.getElementById('mProfEpisodesGrid');
    if (!grid) return;
    if (!episodes || episodes.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted);font-size:12px;">Анги одоогоор оруулаагүй байна.</p>`;
        return;
    }

    let sorted = [...episodes].sort((a, b) => a.num - b.num);
    grid.innerHTML = sorted.map(ep => `
        <button class="ep-btn" id="epBtn-${ep.num}" onclick="playEpisode(${ep.num}, '${ep.file}', '${ep.title || ep.num + '-р анги'}')">
            <i class="fas fa-play" style="font-size:10px;"></i><br>
            Анги ${ep.num}
            ${ep.title ? `<br><span style="font-size:10px;font-weight:400;color:var(--text-muted);">${ep.title}</span>` : ''}
        </button>
    `).join('');
}

// ===== ВИДЕО ТОГЛУУЛАГЧ - Засварласан =====
function playEpisode(num, file, title) {
    let videoPlayerBox = document.getElementById('videoPlayerBox');
    let myVideo = document.getElementById('myVideo');
    let nowPlaying = document.getElementById('videoNowPlayingTitle');

    if (!file || file === 'undefined' || file === '') {
        showToast('Видео файл байхгүй байна.', 'error');
        return;
    }

    if (videoPlayerBox && myVideo) {
        videoPlayerBox.classList.remove('hidden');
        myVideo.src = file;
        myVideo.load();
        myVideo.play().catch(e => {
            console.log('Автоматаар тоглуулж чадсангүй:', e);
        });

        if (nowPlaying) nowPlaying.innerHTML = `<i class="fas fa-play-circle"></i> Анги ${num} ${title ? '- ' + title : ''} тоглуулж байна...`;

        // Идэвхтэй товчийг тэмдэглэх
        document.querySelectorAll('.ep-btn').forEach(btn => btn.classList.remove('active-ep'));
        let activeBtn = document.getElementById(`epBtn-${num}`);
        if (activeBtn) activeBtn.classList.add('active-ep');

        // Тоглуулагч руу скролл хийх
        setTimeout(() => {
            videoPlayerBox.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }, 100);
    }
}

function closeVideoPlayer() {
    let videoPlayerBox = document.getElementById('videoPlayerBox');
    let myVideo = document.getElementById('myVideo');
    if (videoPlayerBox) videoPlayerBox.classList.add('hidden');
    if (myVideo) {
        myVideo.pause();
        myVideo.src = '';
    }
    document.querySelectorAll('.ep-btn').forEach(btn => btn.classList.remove('active-ep'));
}

function goBackToContent() {
    closeVideoPlayer();
    if (currentActiveCategory !== 'all') showPage('allMoviesPage');
    else showPage('homePage');
}

// ===== VIP БА ТҮРЭЭС ТӨЛБӨР =====
let activePaymentType = null;
let pendingCode = '';
let pendingAmount = 0;

function buyVipPackageAction(name, price, code) {
    if (!currentUser) return openModal('loginModal');
    activePaymentType = 'VIP';
    pendingCode = code;
    pendingAmount = price;

    document.getElementById('payAmount').innerText = `${price.toLocaleString()} ₮`;
    document.getElementById('payDetail').innerText = `${code}-${currentUser.phone}`;
    openModal('paymentModal');
}

function rentMovieDirect(movieCode, price) {
    if (!currentUser) return openModal('loginModal');
    activePaymentType = 'RENT';
    pendingCode = movieCode;
    pendingAmount = price;

    document.getElementById('payAmount').innerText = `${price.toLocaleString()} ₮`;
    document.getElementById('payDetail').innerText = `${movieCode}-${currentUser.phone}`;
    openModal('paymentModal');
}

function copyText(elementId) {
    let el = document.getElementById(elementId);
    if (!el) return;
    let text = el.innerText.replace('Хуулах', '').trim();
    navigator.clipboard.writeText(text).then(() => {
        showToast('Амжилттай хуулагдлаа: ' + text);
    }).catch(() => {
        showToast('Хуулж чадсангүй.', 'error');
    });
}

function confirmPaymentSubmit() {
    let newRequest = {
        id: Date.now(), type: 'PAYMENT',
        paymentType: activePaymentType, code: pendingCode,
        amount: pendingAmount, userId: currentUser.id,
        userName: currentUser.name, userPhone: currentUser.phone,
        status: 'pending', createdAt: new Date().toISOString()
    };
    requests.push(newRequest);
    saveData();
    closeModal('paymentModal');
    updateRequestBadge();
    showToast('Төлбөрийн хүсэлт илгээгдлээ. Админ шалгаж эрхийг нээнэ.');
}

// ===== ПРОФАЙЛ =====
function renderUserProfile() {
    if (!currentUser) return;
    document.getElementById('profileNameField').innerText = currentUser.name;
    document.getElementById('profileEmail').innerText = currentUser.email;
    document.getElementById('profilePhoneField').innerText = currentUser.phone || 'Заагаагүй';
    document.getElementById('profileMainImg').src = currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';

    let roleText = '👤 Хэрэглэгч';
    if (currentUser.role === 'admin') roleText = '⚙️ Админ';
    if (currentUser.role === 'moderator') roleText = '✒️ Модератор';
    document.getElementById('profileRoleBadge').innerText = roleText;

    if (isVipActive(currentUser)) {
        document.getElementById('profileVipStatus').innerText = '👑 VIP Идэвхтэй';
        document.getElementById('profileVipTimeValue').innerText = new Date(currentUser.vipExpires).toLocaleDateString('mn-MN');
    } else {
        document.getElementById('profileVipStatus').innerText = 'Ердийн хэрэглэгч';
        document.getElementById('profileVipTimeValue').innerText = 'Хугацаа дууссан эсвэл аваагүй';
    }

    let rentedGrid = document.getElementById('profileRentedGrid');
    let renteds = movies.filter(m => currentUser.rentedMovies && currentUser.rentedMovies.includes(m.code));
    if (rentedGrid) rentedGrid.innerHTML = renteds.length > 0 ? renteds.map(createMovieCard).join('') : '<p style="color:var(--text-muted);font-size:12px;padding:10px;">Түрээсэлсэн кино байхгүй.</p>';

    let historyGrid = document.getElementById('profileHistoryGrid');
    let historyList = (currentUser.history || []).map(hid => movies.find(m => m.id === hid)).filter(Boolean);
    if (historyGrid) historyGrid.innerHTML = historyList.length > 0 ? historyList.map(createMovieCard).join('') : '<p style="color:var(--text-muted);font-size:12px;padding:10px;">Үзсэн түүх байхгүй.</p>';
}

function openProfileEditBox() {
    document.getElementById('editProfileName').value = currentUser.name;
    document.getElementById('editProfilePhone').value = currentUser.phone || '';
    tempSelectedAvatarUrl = currentUser.avatar || '';
    let statusEl = document.getElementById('editAvatarStatus');
    if (statusEl) statusEl.innerText = 'Сонгоогүй байна.';
    openModal('profileEditModal');
}

function previewUserAvatarFile(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            tempSelectedAvatarUrl = e.target.result;
            let statusEl = document.getElementById('editAvatarStatus');
            if (statusEl) statusEl.innerText = `✅ Сонгогдлоо: ${file.name}`;
        };
        reader.readAsDataURL(file);
    }
}

function saveUserProfileChanges() {
    let newName = document.getElementById('editProfileName').value.trim();
    let newPhone = document.getElementById('editProfilePhone').value.trim();
    if (!newName || !newPhone) return showToast('Талбаруудыг бүрэн бөглөнө үү!', 'error');
    currentUser.name = newName;
    currentUser.phone = newPhone;
    if (tempSelectedAvatarUrl) currentUser.avatar = tempSelectedAvatarUrl;
    saveData();
    closeModal('profileEditModal');
    checkAuthUI();
    renderUserProfile();
    showToast('Мэдээлэл амжилттай шинэчлэгдлээ!');
}

// ===== НУУЦ ҮГ ХАРУУЛАХ/НУУХ =====
function togglePasswordVisibility(inputId, iconId) {
    let input = document.getElementById(inputId);
    let icon = document.getElementById(iconId);
    if (input && icon) {
        if (input.type === 'password') {
            input.type = 'text';
            icon.classList.replace('fa-eye', 'fa-eye-slash');
        } else {
            input.type = 'password';
            icon.classList.replace('fa-eye-slash', 'fa-eye');
        }
    }
}

// ===== НУУЦ ҮГ СЭРГЭЭХ - Gmail OTP системтэй =====
function openForgotModal() {
    closeModal('loginModal');

    // Reset алхмуудыг
    ['forgotStep1', 'forgotStep2', 'forgotStep3'].forEach(id => {
        let el = document.getElementById(id);
        if (el) el.classList.add('hidden');
    });
    let step1 = document.getElementById('forgotStep1');
    if (step1) step1.classList.remove('hidden');

    // Form цэвэрлэх
    let emailEl = document.getElementById('forgotEmail');
    let phoneEl = document.getElementById('forgotPhone');
    if (emailEl) emailEl.value = '';
    if (phoneEl) phoneEl.value = '';

    openModal('forgotModal');
}

function generateOTP() {
    return Math.floor(100000 + Math.random() * 900000).toString();
}

function recoverPasswordLogic() {
    let email = document.getElementById('forgotEmail').value.trim();
    let phone = document.getElementById('forgotPhone').value.trim();
    let user = users.find(u => u.email === email && u.phone === phone);

    if (!user) {
        showToast('Утасны дугаар эсвэл имэйл тохирохгүй байна!', 'error');
        return;
    }

    otpTargetUser = user;
    otpCode = generateOTP();

    // EmailJS ашиглан Gmail рүү OTP илгээх
    sendOtpEmail(email, user.name, otpCode);

    // OTP алхам 2 руу шилжих
    document.getElementById('forgotStep1').classList.add('hidden');
    document.getElementById('forgotStep2').classList.remove('hidden');

    let otpEmailEl = document.getElementById('otpTargetEmail');
    if (otpEmailEl) otpEmailEl.innerText = email;

    startOtpTimer();
    showToast('OTP код таны Gmail руу илгээгдлээ!');
}

function sendOtpEmail(email, name, code) {
    // EmailJS ашиглан имэйл илгээх
    if (typeof emailjs !== 'undefined' && EMAILJS_SERVICE_ID !== 'YOUR_EMAILJS_SERVICE_ID') {
        emailjs.send(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, {
            to_email: email,
            to_name: name,
            otp_code: code,
            platform_name: 'NovaManwa'
        }).then(() => {
            console.log('OTP имэйл амжилттай илгээгдлээ');
        }).catch(err => {
            console.error('Имэйл илгээгдсэнгүй:', err);
            // Dev горимд консол дээр харуулах
            console.log(`[DEV MODE] OTP код: ${code}`);
            showToast(`[Тест] OTP: ${code} (EmailJS тохируулаагүй)`, 'error');
        });
    } else {
        // EmailJS тохируулаагүй үед консолд харуулах (тест горим)
        console.log(`[DEV MODE] OTP код: ${code} → ${email} рүү илгээх байсан`);
        showToast(`[Тест горим] OTP: ${code}`, 'error');
    }
}

function startOtpTimer() {
    if (otpTimerInterval) clearInterval(otpTimerInterval);
    let timeLeft = 60;
    let timerEl = document.getElementById('otpTimer');
    let countdownEl = document.getElementById('otpCountdown');
    let resendBtn = document.getElementById('otpResendBtn');

    if (resendBtn) resendBtn.style.display = 'none';
    if (countdownEl) countdownEl.style.display = 'inline';

    otpTimerInterval = setInterval(() => {
        timeLeft--;
        if (timerEl) timerEl.innerText = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(otpTimerInterval);
            if (countdownEl) countdownEl.style.display = 'none';
            if (resendBtn) resendBtn.style.display = 'inline';
        }
    }, 1000);
}

function resendOtp() {
    if (!otpTargetUser) return;
    otpCode = generateOTP();
    sendOtpEmail(otpTargetUser.email, otpTargetUser.name, otpCode);
    startOtpTimer();
    showToast('OTP код дахин илгээгдлээ!');
}

function verifyOtpLogic() {
    let inputCode = document.getElementById('otpInput').value.trim();
    if (inputCode === otpCode) {
        document.getElementById('targetUserId').value = otpTargetUser.id;
        document.getElementById('forgotStep2').classList.add('hidden');
        document.getElementById('forgotStep3').classList.remove('hidden');
        if (otpTimerInterval) clearInterval(otpTimerInterval);
        showToast('OTP баталгаажлаа! ✅');
    } else {
        showToast('OTP код буруу байна! Дахин оролдоно уу.', 'error');
        document.getElementById('otpInput').value = '';
    }
}

function resetPasswordLogic() {
    let userId = document.getElementById('targetUserId').value;
    let newPass = document.getElementById('newPassInput').value;
    if (!newPass || newPass.length < 4) return showToast('Нууц үг дор хаяж 4 тэмдэгт байх ёстой!', 'error');

    let user = users.find(u => u.id == userId);
    if (user) {
        user.pass = newPass;
        saveData();
        showToast('Нууц үг амжилттай солигдлоо! Шинэ нууц үгээрээ нэвтэрнэ үү.');
        closeModal('forgotModal');
        setTimeout(() => openModal('loginModal'), 500);
        otpCode = '';
        otpTargetUser = null;
    }
}

// ===== МОДЕРАТОР =====
function submitModRequest() {
    if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'moderator')) {
        return showToast('Зөвхөн админ эсвэл модератор хүсэлт гаргах боломжтой!', 'error');
    }
    let title = document.getElementById('modReqTitle').value.trim();
    let desc = document.getElementById('modReqDesc').value.trim();
    let price = parseInt(document.getElementById('modReqPrice').value) || 0;
    let code = document.getElementById('modReqCode').value.trim();
    let category = document.getElementById('modReqCategory').value;
    let status = document.getElementById('modReqStatus').value;

    if (!title || !code) return showToast('Нэр болон код заавал хэрэгтэй!', 'error');

    requests.push({
        id: Date.now(), type: 'MOVIE_ADD', title, desc, price, code,
        category, status, senderName: currentUser.name, senderId: currentUser.id,
        createdAt: new Date().toISOString()
    });
    saveData();
    updateRequestBadge();
    document.getElementById('modReqTitle').value = '';
    document.getElementById('modReqDesc').value = '';
    document.getElementById('modReqCode').value = '';
    showToast('Кино нэмэх хүсэлтийг админд амжилттай илгээлээ!');
}

function updateRequestBadge() {
    let el = document.getElementById('reqBadgeCount');
    if (el) el.innerText = requests.filter(r => r.status === 'pending').length;
}

// ===== ADMIN =====
function switchAdminTab(tabId) {
    adminActiveTab = tabId;
    document.querySelectorAll('.admin-tabs-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));

    let tabBtnMap = { moviesTab: 'btn-tab-movies', requestsTab: 'btn-tab-requests', usersTab: 'btn-tab-users' };
    let btn = document.getElementById(tabBtnMap[tabId]);
    if (btn) btn.classList.add('active');
    let tab = document.getElementById(tabId);
    if (tab) tab.classList.remove('hidden');
    initAdminPanel();
}

function initAdminPanel() {
    if (adminActiveTab === 'moviesTab') renderAdminMovieList();
    else if (adminActiveTab === 'usersTab') renderAdminUsersTable();
    else if (adminActiveTab === 'requestsTab') renderAdminRequests();
    updateRequestBadge();
}

// Cover файл сонгох
function handleCoverFileSelect(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            tempSelectedCoverFile = e.target.result;
            let preview = document.getElementById('coverPreviewImg');
            let previewBox = document.getElementById('coverPreviewBox');
            if (preview) preview.src = e.target.result;
            if (previewBox) previewBox.style.display = 'block';
        };
        reader.readAsDataURL(file);
    }
}

function toggleCoverUrlInput() {
    let urlInput = document.getElementById('admCoverUrl');
    if (urlInput) {
        urlInput.style.display = urlInput.style.display === 'none' ? 'block' : 'none';
        if (urlInput.style.display === 'block') {
            urlInput.focus();
            urlInput.oninput = function () {
                tempSelectedCoverFile = this.value;
                let preview = document.getElementById('coverPreviewImg');
                let previewBox = document.getElementById('coverPreviewBox');
                if (preview && this.value) {
                    preview.src = this.value;
                    if (previewBox) previewBox.style.display = 'block';
                }
            };
        }
    }
}

// Видео файл сонгох
function handleVideoFileSelect(event) {
    let file = event.target.files[0];
    if (file) {
        tempSelectedVideoFile = URL.createObjectURL(file);
        let statusText = document.getElementById('admVideoStatusText');
        if (statusText) statusText.innerText = `✅ Сонгогдсон: ${file.name}`;
    }
}

function toggleVideoUrlInput() {
    let urlInput = document.getElementById('admVideoUrl');
    if (urlInput) {
        urlInput.style.display = urlInput.style.display === 'none' ? 'block' : 'none';
        if (urlInput.style.display === 'block') {
            urlInput.focus();
            urlInput.oninput = function () {
                tempSelectedVideoFile = this.value;
                let statusText = document.getElementById('admVideoStatusText');
                if (statusText) statusText.innerText = `✅ URL оруулсан: ${this.value.substring(0, 40)}...`;
            };
        }
    }
}

function handleEpThumbSelect(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function (e) {
            tempSelectedEpThumb = e.target.result;
            let statusEl = document.getElementById('admThumbStatusText');
            if (statusEl) statusEl.innerText = `✅ Thumbnail: ${file.name}`;
        };
        reader.readAsDataURL(file);
    }
}

function adminAddEpisodeToMovie() {
    if (!adminSelectedSeriesId) return showToast('Эхлээд жагсаалтаас кино сонгоно уу!', 'error');
    let num = parseInt(document.getElementById('admNewEpNumber').value);
    let epTitle = document.getElementById('admNewEpTitle')?.value.trim() || `${num}-р анги`;

    if (!num) return showToast('Ангийн дугаар заавал оруулна уу!', 'error');
    if (!tempSelectedVideoFile) return showToast('Видео файл эсвэл URL оруулна уу!', 'error');

    let m = movies.find(mv => mv.id === adminSelectedSeriesId);
    if (!m.episodes) m.episodes = [];
    if (m.episodes.some(e => e.num === num)) return showToast('Энэ ангийн дугаар аль хэдийн байна!', 'error');

    m.episodes.push({ num, title: epTitle, file: tempSelectedVideoFile, thumb: tempSelectedEpThumb });
    m.episodes.sort((a, b) => a.num - b.num);
    saveData();

    document.getElementById('admNewEpNumber').value = '';
    if (document.getElementById('admNewEpTitle')) document.getElementById('admNewEpTitle').value = '';
    document.getElementById('admVideoFileInput').value = '';
    document.getElementById('admVideoStatusText').innerText = 'Файл сонгоогүй байна.';
    if (document.getElementById('admEpThumbInput')) document.getElementById('admEpThumbInput').value = '';
    if (document.getElementById('admThumbStatusText')) document.getElementById('admThumbStatusText').innerText = 'Thumbnail сонгоогүй.';
    tempSelectedVideoFile = '';
    tempSelectedEpThumb = '';

    renderAdminMovieList();
    showToast(`${m.title} кинонд Анги ${num} нэмэгдлээ!`);
}

function adminSaveMovie() {
    let title = document.getElementById('admTitle').value.trim();
    let desc = document.getElementById('admDesc').value.trim();
    let price = parseInt(document.getElementById('admPrice').value) || 0;
    let code = document.getElementById('admManualCode').value.trim();
    let category = document.getElementById('admCategory').value;
    let status = document.getElementById('admStatus').value;

    // Cover: файлаас сонгосон > URL-с оруулсан > одоогийн утга
    let cover = tempSelectedCoverFile || document.getElementById('admCoverUrl')?.value || '';

    if (!title || !code) return showToast('Нэр болон код заавал хэрэгтэй!', 'error');

    if (adminEditingMovieId) {
        let m = movies.find(mv => mv.id === adminEditingMovieId);
        if (m) {
            m.title = title; m.desc = desc; m.price = price;
            m.code = code; m.category = category; m.status = status;
            if (cover) m.cover = cover;
            showToast('Киноны мэдээлэл амжилттай шинэчлэгдлээ!');
        }
        adminEditingMovieId = null;
        let btn = document.getElementById('btnAdminMovieSubmit');
        if (btn) { btn.innerText = 'Шууд нийтлэх'; btn.style.background = '#10b981'; }
    } else {
        let newMovie = {
            id: Date.now(), title, desc, price, code, category, status,
            cover: cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
            views: 0, episodes: [], isTrending: false, isNew: true
        };
        movies.push(newMovie);
        showToast('Шинэ кино амжилттай нэмэгдлээ!');
    }

    saveData();
    // Form цэвэрлэх
    ['admTitle', 'admDesc', 'admManualCode'].forEach(id => { let el = document.getElementById(id); if (el) el.value = ''; });
    document.getElementById('admPrice').value = '0';
    if (document.getElementById('admCoverUrl')) document.getElementById('admCoverUrl').value = '';
    let previewBox = document.getElementById('coverPreviewBox');
    if (previewBox) previewBox.style.display = 'none';
    tempSelectedCoverFile = '';

    renderAdminMovieList();
    renderHomeMovies();
}

function adminPrepareEditMovie(id) {
    let m = movies.find(mv => mv.id === id);
    if (!m) return;
    adminEditingMovieId = id;
    document.getElementById('admTitle').value = m.title;
    document.getElementById('admDesc').value = m.desc;
    document.getElementById('admPrice').value = m.price;
    document.getElementById('admManualCode').value = m.code;
    document.getElementById('admCategory').value = m.category;
    document.getElementById('admStatus').value = m.status;

    if (m.cover) {
        tempSelectedCoverFile = m.cover;
        let preview = document.getElementById('coverPreviewImg');
        let previewBox = document.getElementById('coverPreviewBox');
        if (preview) preview.src = m.cover;
        if (previewBox) previewBox.style.display = 'block';
    }

    let btn = document.getElementById('btnAdminMovieSubmit');
    if (btn) { btn.innerText = 'Өөрчлөлтийг хадгалах'; btn.style.background = '#3b82f6'; }

    // Movies tab руу scroll
    switchAdminTab('moviesTab');
    window.scrollTo({ top: 0, behavior: 'smooth' });
    showToast(`Засах горим: ${m.title}`);
}

function adminSelectMovieForEpisodes(id) {
    let m = movies.find(mv => mv.id === id);
    if (!m) return;
    adminSelectedSeriesId = id;
    let display = document.getElementById('admSelectedSeriesDisplay');
    if (display) display.innerHTML = `✅ Сонгогдсон: <strong>${m.title}</strong> (${m.code}) - ${m.episodes ? m.episodes.length : 0} анги`;
}

function renderAdminMovieList() {
    let container = document.getElementById('adminMovieList');
    if (!container) return;
    if (movies.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:10px;">Кино байхгүй байна.</p>';
        return;
    }
    container.innerHTML = movies.map(m => `
        <div style="margin-bottom:8px;background:var(--bg-dark);padding:10px;border-radius:6px;display:flex;justify-content:space-between;align-items:center;border:1px solid var(--border-color);">
            <div style="display:flex;align-items:center;gap:10px;">
                ${m.cover ? `<img src="${m.cover}" style="width:40px;height:55px;object-fit:cover;border-radius:4px;">` : '<div style="width:40px;height:55px;background:#334155;border-radius:4px;"></div>'}
                <div>
                    <strong style="font-size:13px;">${m.title}</strong>
                    <div style="font-size:11px;color:var(--text-muted);">${m.code} · ${m.episodes ? m.episodes.length : 0} анги · ${m.price === 0 ? 'Үнэгүй' : m.price.toLocaleString() + ' ₮'}</div>
                </div>
            </div>
            <div style="display:flex;gap:5px;flex-wrap:wrap;">
                <button onclick="adminSelectMovieForEpisodes(${m.id})" style="background:#8b5cf6;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Анги+</button>
                <button onclick="adminPrepareEditMovie(${m.id})" style="background:#f59e0b;color:#000;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;font-weight:600;">Засах</button>
                <button onclick="adminDeleteMovie(${m.id})" style="background:#ef4444;color:#fff;border:none;padding:4px 8px;border-radius:4px;cursor:pointer;font-size:11px;">Устгах</button>
            </div>
        </div>
    `).join('');
}

function adminDeleteMovie(id) {
    if (!confirm('Та устгахдаа итгэлтэй байна уу?')) return;
    movies = movies.filter(m => m.id !== id);
    if (adminSelectedSeriesId === id) {
        adminSelectedSeriesId = null;
        let display = document.getElementById('admSelectedSeriesDisplay');
        if (display) display.innerText = 'Кино сонгогдоогүй байна.';
    }
    saveData();
    renderAdminMovieList();
    renderHomeMovies();
    showToast('Кино устгагдлаа.');
}

// ===== ХЭРЭГЛЭГЧДИЙН ХҮСНЭГТ =====
function renderAdminUsersTable() {
    let tbody = document.getElementById('adminUsersTableBody');
    if (!tbody) return;
    tbody.innerHTML = users.map(u => {
        let vipText = u.vipExpires && u.vipExpires > Date.now()
            ? `<span style="color:#10b981;">Идэвхтэй (${new Date(u.vipExpires).toLocaleDateString('mn-MN')})</span>`
            : '<span style="color:var(--text-muted);">Ердийн</span>';

        let actionButtons = u.role !== 'admin' ? `
            <div style="display:flex;gap:5px;align-items:center;flex-wrap:wrap;">
                ${u.role === 'moderator'
                    ? `<button onclick="changeUserRole(${u.id},'user')" style="background:#d97706;color:#fff;padding:4px 8px;font-size:11px;border:none;border-radius:4px;cursor:pointer;">Mod цуцлах</button>`
                    : `<button onclick="changeUserRole(${u.id},'moderator')" style="background:#3b82f6;color:#fff;padding:4px 8px;font-size:11px;border:none;border-radius:4px;cursor:pointer;">Mod болгох</button>`
                }
                <input type="number" id="vipDays-${u.id}" placeholder="Хоног" style="width:60px;padding:4px;font-size:11px;background:#0f172a;border:1px solid #334155;color:#fff;border-radius:4px;">
                <button onclick="adminGiveVipDays(${u.id})" style="background:#10b981;color:#fff;padding:4px 8px;font-size:11px;border:none;border-radius:4px;cursor:pointer;">VIP өгөх</button>
                <button onclick="adminApprovePayment(${u.id})" style="background:#8b5cf6;color:#fff;padding:4px 8px;font-size:11px;border:none;border-radius:4px;cursor:pointer;">Түрээс нээх</button>
            </div>
        ` : `<span style="color:var(--vip-color);font-weight:600;">Үндсэн Админ</span>`;

        return `
            <tr>
                <td><img src="${u.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'}" style="width:28px;height:28px;border-radius:50%;margin-right:8px;vertical-align:middle;">${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone || '-'}</td>
                <td><span class="badge" style="background:#475569;color:#fff;">${u.role.toUpperCase()}</span></td>
                <td>${vipText}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

function adminGiveVipDays(userId) {
    let dayInput = document.getElementById(`vipDays-${userId}`);
    let days = parseInt(dayInput.value);
    if (!days || days <= 0) return showToast('Зөв хоногийн тоо оруулна уу!', 'error');
    let u = users.find(us => us.id === userId);
    if (u) {
        let current = u.vipExpires && u.vipExpires > Date.now() ? u.vipExpires : Date.now();
        u.vipExpires = current + days * 24 * 60 * 60 * 1000;
        saveData();
        renderAdminUsersTable();
        dayInput.value = '';
        showToast(`${u.name} хэрэглэгчид ${days} хоногийн VIP нэмлээ!`);
    }
}

function adminApprovePayment(userId) {
    let u = users.find(us => us.id === userId);
    if (!u) return;
    let pendingPayments = requests.filter(r => r.userId === userId && r.type === 'PAYMENT' && r.status === 'pending');
    if (pendingPayments.length === 0) return showToast('Энэ хэрэглэгчид хүлээгдэж байгаа төлбөрийн хүсэлт байхгүй байна.', 'error');

    pendingPayments.forEach(r => {
        if (r.paymentType === 'VIP') {
            let vipDays = r.code === 'VIP-1M' ? 30 : r.code === 'VIP-3M' ? 90 : r.code === 'VIP-YEAR' ? 365 : 3650;
            let current = u.vipExpires && u.vipExpires > Date.now() ? u.vipExpires : Date.now();
            u.vipExpires = current + vipDays * 24 * 60 * 60 * 1000;
        } else if (r.paymentType === 'RENT') {
            if (!u.rentedMovies) u.rentedMovies = [];
            if (!u.rentedMovies.includes(r.code)) u.rentedMovies.push(r.code);
        }
        r.status = 'approved';
    });
    saveData();
    renderAdminUsersTable();
    showToast(`${u.name} хэрэглэгчийн ${pendingPayments.length} хүсэлт баталгаажлаа!`);
}

function changeUserRole(userId, newRole) {
    let u = users.find(us => us.id === userId);
    if (u) {
        u.role = newRole;
        saveData();
        renderAdminUsersTable();
        showToast(`${u.name} хэрэглэгчийн статус өөрчлөгдлөө.`);
    }
}

// ===== ХҮСЭЛТҮҮД ХАРАХ =====
function renderAdminRequests() {
    let container = document.getElementById('adminRequestsList');
    if (!container) return;

    let pendingReqs = requests.filter(r => r.status === 'pending');
    if (pendingReqs.length === 0) {
        container.innerHTML = '<p style="color:var(--text-muted);text-align:center;padding:20px;">Шинэ хүсэлт ирээгүй байна.</p>';
        return;
    }

    container.innerHTML = pendingReqs.map(r => {
        if (r.type === 'PAYMENT') {
            return `
                <div class="request-card" style="border-left:4px solid var(--vip-color);">
                    <div class="request-header">
                        <strong>💰 ТӨЛБӨРИЙН ХҮСЭЛТ</strong>
                        <span class="badge" style="background:#1e3a8a;color:#fff;">${r.paymentType || 'PAYMENT'}</span>
                    </div>
                    <p>Хэрэглэгч: <strong>${r.userName}</strong> (Утас: ${r.userPhone})</p>
                    <p>Код: <strong>${r.code}</strong> · Дүн: <strong style="color:#10b981;">${r.amount?.toLocaleString()} ₮</strong></p>
                    <p style="font-size:11px;color:var(--text-muted);">${new Date(r.createdAt).toLocaleString('mn-MN')}</p>
                    <div style="display:flex;gap:10px;margin-top:10px;">
                        <button onclick="approveRequest(${r.id})" style="background:#10b981;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;">✅ Баталгаажуулах</button>
                        <button onclick="rejectRequest(${r.id})" style="background:#ef4444;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">❌ Татгалзах</button>
                    </div>
                </div>
            `;
        } else if (r.type === 'MOVIE_ADD') {
            return `
                <div class="request-card" style="border-left:4px solid var(--primary);">
                    <div class="request-header">
                        <strong>🎬 КИНО НЭМЭХ ХҮСЭЛТ</strong>
                        <span class="badge">${r.category === 'drama' ? 'Цуврал' : 'Вэбтун'}</span>
                    </div>
                    <h4>${r.title} (${r.code})</h4>
                    <p style="color:var(--text-muted);font-size:13px;">${r.desc}</p>
                    <p>Үнэ: <strong>${r.price === 0 ? 'Үнэгүй' : r.price.toLocaleString() + ' ₮'}</strong> · Илгээсэн: <strong>${r.senderName}</strong></p>
                    <div style="display:flex;gap:10px;margin-top:10px;">
                        <button onclick="approveMovieRequest(${r.id})" style="background:#10b981;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;font-weight:bold;">✅ Нийтлэх</button>
                        <button onclick="rejectRequest(${r.id})" style="background:#ef4444;color:#fff;border:none;padding:6px 14px;border-radius:4px;cursor:pointer;">❌ Татгалзах</button>
                    </div>
                </div>
            `;
        }
        return '';
    }).join('');
}

function approveRequest(reqId) {
    let r = requests.find(req => req.id === reqId);
    if (!r) return;
    let u = users.find(us => us.id === r.userId);
    if (u) {
        if (r.paymentType === 'VIP') {
            let days = r.code === 'VIP-1M' ? 30 : r.code === 'VIP-3M' ? 90 : r.code === 'VIP-YEAR' ? 365 : 3650;
            let current = u.vipExpires && u.vipExpires > Date.now() ? u.vipExpires : Date.now();
            u.vipExpires = current + days * 24 * 60 * 60 * 1000;
        } else if (r.paymentType === 'RENT') {
            if (!u.rentedMovies) u.rentedMovies = [];
            if (!u.rentedMovies.includes(r.code)) u.rentedMovies.push(r.code);
        }
    }
    r.status = 'approved';
    saveData();
    renderAdminRequests();
    updateRequestBadge();
    showToast('Хүсэлт баталгаажлаа!');
}

function approveMovieRequest(reqId) {
    let r = requests.find(req => req.id === reqId);
    if (!r) return;
    let newMovie = {
        id: Date.now(), title: r.title, desc: r.desc, price: r.price,
        code: r.code, category: r.category, status: r.status,
        cover: r.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400',
        views: 0, episodes: [], isTrending: false, isNew: true
    };
    movies.push(newMovie);
    r.status = 'approved';
    saveData();
    renderAdminRequests();
    renderHomeMovies();
    updateRequestBadge();
    showToast('Кино нийтлэгдлээ!');
}

function rejectRequest(reqId) {
    let r = requests.find(req => req.id === reqId);
    if (r) {
        r.status = 'rejected';
        saveData();
        renderAdminRequests();
        updateRequestBadge();
        showToast('Хүсэлт татгалзагдлаа.', 'error');
    }
}

// ===== SUPABASE ИНТЕГРАЦИ (Тохируулсны дараа ашиглана) =====
// Энэ хэсгийг Supabase project үүсгэж тохируулсны дараа uncomment хийнэ

/*
async function loadMoviesFromSupabase() {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/movies?select=*&order=created_at.desc`, {
            headers: { 'apikey': SUPABASE_ANON_KEY, 'Authorization': `Bearer ${SUPABASE_ANON_KEY}` }
        });
        const data = await res.json();
        if (Array.isArray(data)) {
            movies = data;
            renderHomeMovies();
        }
    } catch (err) { console.error('Supabase алдаа:', err); }
}

async function saveMovieToSupabase(movie) {
    try {
        const res = await fetch(`${SUPABASE_URL}/rest/v1/movies`, {
            method: 'POST',
            headers: {
                'apikey': SUPABASE_ANON_KEY,
                'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
                'Content-Type': 'application/json',
                'Prefer': 'return=representation'
            },
            body: JSON.stringify(movie)
        });
        return await res.json();
    } catch (err) { console.error('Supabase хадгалах алдаа:', err); }
}

// Cloudflare R2 руу файл upload хийх
// R2 нь S3-compatible API дэмждэг. Presigned URL ашиглана.
async function uploadToR2(file, fileName) {
    // Энэ function-г server-side (Edge Function) дээр ажиллуулах ёстой
    // Client-дэс шууд R2 руу upload хийхэд presigned URL хэрэгтэй
    const presignedRes = await fetch(`${SUPABASE_URL}/functions/v1/get-r2-upload-url`, {
        method: 'POST',
        headers: {
            'Authorization': `Bearer ${SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ fileName, fileType: file.type })
    });
    const { uploadUrl, publicUrl } = await presignedRes.json();

    await fetch(uploadUrl, {
        method: 'PUT',
        headers: { 'Content-Type': file.type },
        body: file
    });

    return publicUrl;
}
*/
async function loadInitialDataFromSupabase() {
    // movies
    const { data: moviesData, error: moviesErr } = await supabaseClient
        .from('movies')
        .select('*')
        .order('id', { ascending: false });
    if (!moviesErr && Array.isArray(moviesData)) {
        movies = moviesData;
    }

    // profile
    const { data: usersData, error: usersErr } = await supabaseClient
        .from('profile')
        .select('*');
    if (!usersErr && Array.isArray(usersData)) {
        users = usersData;
    }

    // ШИНЭ: users массивыг консол дээр харж үзье
    console.log('USERS FROM SUPABASE:', users);

    // requests
    const { data: reqData, error: reqErr } = await supabaseClient
        .from('requests')
        .select('*');
    if (!reqErr && Array.isArray(reqData)) {
        requests = reqData;
    }

    renderHomeMovies();
    renderAllMoviesPage();
} 