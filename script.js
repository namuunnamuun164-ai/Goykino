// --- ӨГӨГДЛИЙН САН БА СИСТЕМҮҮД ---
let movies = JSON.parse(localStorage.getItem('nova_movies')) || [
    { id: 1, title: 'Solo Leveling', desc: 'Дэлхийн хамгийн сул ангууч хэрхэн хүчирхэгжсэн бэ...', price: 0, code: 'SL-01', category: 'web', status: 'Үргэлжилж байгаа', views: 1540, cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', episodes: [{ num: 1, file: 'https://www.w3schools.com/html/mov_bbb.mp4' }, { num: 2, file: 'https://www.w3schools.com/html/movie.mp4' }], isTrending: true, isNew: true },
    { id: 2, title: 'Crash Landing on You', desc: 'Өмнөд Солонгосын баян өв залгамжлагч бүсгүй шүхрээр нисэж яваад Хойд Солонгост...', price: 2500, code: 'CL-99', category: 'drama', status: 'Дууссан', views: 890, cover: 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400', episodes: [{ num: 1, file: 'https://www.w3schools.com/html/mov_bbb.mp4' }], isTrending: true, isNew: false }
];

let users = JSON.parse(localStorage.getItem('nova_users')) || [
    { id: 100, name: 'Админ Намуун', email: 'namuunnamuun164@gmail.com', phone: '99112233', pass: '80301706Aa.', role: 'admin', vipExpires: null, rentedMovies: [], history: [], avatar: 'https://cdn-icons-png.flaticon.com/512/4140/4140048.png' },
    { id: 101, name: 'Модератор Дорж', email: 'mod@nova.mn', phone: '88889999', pass: '123456', role: 'moderator', vipExpires: null, rentedMovies: [], history: [], avatar: 'https://cdn-icons-png.flaticon.com/512/1154/1154448.png' }
];

let requests = JSON.parse(localStorage.getItem('nova_requests')) || [];
let currentUser = JSON.parse(sessionStorage.getItem('nova_current_user')) || null;
let currentSelectedMovieId = null; 
let tempSelectedAvatarUrl = "";
let currentActiveCategory = "all";
let tempSelectedVideoFile = ""; // Галерейгаас сонгосон бичлэгийг түр хадгалах хувьсагч

// --- АПП-ЫГ ЭХЛҮҮЛЭХ ---
window.onload = function() {
    saveData();
    checkAuthUI();
    renderHomeMovies();
    updateRequestBadge();
    showPage('homePage');
};

function saveData() {
    if(currentUser) {
        let idx = users.findIndex(u => u.id === currentUser.id);
        if(idx !== -1) {
            users[idx] = currentUser;
        }
    }
    localStorage.setItem('nova_movies', JSON.stringify(movies));
    localStorage.setItem('nova_users', JSON.stringify(users));
    localStorage.setItem('nova_requests', JSON.stringify(requests));
    
    if(currentUser) {
        sessionStorage.setItem('nova_current_user', JSON.stringify(currentUser));
    }
}

// --- ХУУДАС ШИЛЖИЛТ ---
function showPage(pageId) {
    document.querySelectorAll('.page-section').forEach(p => p.classList.add('hidden'));
    let targetPage = document.getElementById(pageId);
    if(targetPage) targetPage.classList.remove('hidden');
    
    document.querySelectorAll('.nav-menu a').forEach(a => a.classList.remove('active'));
    
    if(pageId === 'homePage') document.getElementById('nav-home').classList.add('active');
    if(pageId === 'allMoviesPage') {
        let navAll = document.getElementById('nav-allMovies');
        if(navAll) navAll.classList.add('active');
        renderAllMoviesPage();
    }
    if(pageId === 'vipPage') {
        let navVip = document.getElementById('nav-vip');
        if(navVip) navVip.classList.add('active');
    }
    if(pageId === 'profilePage') {
        document.getElementById('nav-profile').classList.add('active');
        renderUserProfile();
    }
    if(pageId === 'adminPage') {
        document.getElementById('nav-admin').classList.add('active');
        initAdminPanel();
    }
    if(pageId === 'modPage') {
        document.getElementById('nav-modPanel').classList.add('active');
    }
    
    if(window.innerWidth <= 768) {
        let sidebar = document.getElementById('appSidebar');
        if(sidebar) sidebar.classList.remove('active');
    }
    window.scrollTo(0,0);
}

function toggleSidebar() {
    document.getElementById('appSidebar').classList.toggle('active');
}

// --- ХЭРЭГЛЭГЧИЙН ШАЛГАЛТ (AUTH UI) ---
function checkAuthUI() {
    const authBtn = document.getElementById('authBtnContainer');
    const userBox = document.getElementById('topUserAvatarBox');
    
    document.getElementById('nav-profile').classList.add('hidden');
    document.getElementById('nav-admin').classList.add('hidden');
    document.getElementById('nav-modPanel').classList.add('hidden');

    if (currentUser) {
        if(authBtn) authBtn.classList.add('hidden');
        if(userBox) userBox.classList.remove('hidden');
        document.getElementById('topUsername').innerText = currentUser.name;
        document.getElementById('topUserImg').src = currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
        
        document.getElementById('nav-profile').classList.remove('hidden');
        
        if(currentUser.role === 'admin') {
            document.getElementById('nav-admin').classList.remove('hidden');
        } else if(currentUser.role === 'moderator') {
            document.getElementById('nav-modPanel').classList.remove('hidden');
        }
    } else {
        if(authBtn) authBtn.classList.remove('hidden');
        if(userBox) userBox.classList.add('hidden');
    }
}

// --- НЭВТРЭХ БА БҮРТГҮҮЛЭХ ---
// Модал нээх функц (Нэвтрэх болон Бүртгүүлэх)
function openModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.remove('hidden');
        modal.style.display = 'flex'; // Энийг заавал нэмж өгнө
    }
}

// Модал хаах функц
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        modal.style.display = 'none'; // Хаах үед дэлгэцээс бүрэн нууна
    }
}
function switchForm(formId) {
    ['loginForm', 'registerForm'].forEach(f => document.getElementById(f).classList.add('hidden'));
    document.getElementById(formId).classList.remove('hidden');
}

function loginLogic() {
    let email = document.getElementById('loginEmail').value;
    let pass = document.getElementById('loginPass').value;
    let user = users.find(u => u.email === email && u.pass === pass);
    
    if(user) {
        currentUser = user;
        sessionStorage.setItem('nova_current_user', JSON.stringify(currentUser));
        closeModal('loginModal');
        checkAuthUI();
        showPage('homePage');
        alert(`Тавтай морил, ${currentUser.name}!`);
    } else {
        alert("Имэйл эсвэл нууц үг буруу байна!");
    }
}

function registerLogic() {
    let name = document.getElementById('regName').value;
    let phone = document.getElementById('regPhone').value;
    let email = document.getElementById('regEmail').value;
    let pass = document.getElementById('regPass').value;
    
    if(!name || !phone || !email || !pass) return alert("Бүх талбарыг бөглөнө үү!");
    if(users.some(u => u.email === email)) return alert("Энэ имэйл аль хэдийн бүртгэгдсэн байна!");
    
    let newUser = {
        id: Date.now(), name, phone, email, pass,
        role: 'user', vipExpires: null, rentedMovies: [], history: [],
        avatar: 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png'
    };
    users.push(newUser);
    currentUser = newUser;
    saveData();
    closeModal('loginModal');
    checkAuthUI();
    showPage('homePage');
    alert("Бүртгэл амжилттай үүслээ!");
}

function logout() {
    currentUser = null;
    sessionStorage.removeItem('nova_current_user');
    checkAuthUI();
    showPage('homePage');
}

// --- ХАРАГДАЦ ГАРГАХ (RENDERING) ---
function createMovieCard(m) {
    let hasVipBadge = m.price > 0 ? `<div class="badge-vip-card">${m.price} ₮</div>` : `<div class="badge-vip-card" style="background:#10b981;">Үнэгүй</div>`;
    let coverImg = m.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=400';
    return `
        <div class="movie-card" onclick="showMovieProfile(${m.id})">
            ${hasVipBadge}
            <img class="card-cover" src="${coverImg}" alt="${m.title}">
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
    if(trendingGrid) trendingGrid.innerHTML = movies.filter(m => m.isTrending).map(createMovieCard).join('');
    if(newGrid) newGrid.innerHTML = movies.filter(m => m.isNew).map(createMovieCard).join('');
}

function renderAllMoviesPage() {
    let grid = document.getElementById('grid-all-movies');
    if(!grid) return;
    let filtered = movies;
    if(currentActiveCategory !== 'all') {
        filtered = movies.filter(m => m.category === currentActiveCategory);
    }
    grid.innerHTML = filtered.length > 0 ? filtered.map(createMovieCard).join('') : `<p style="color:var(--text-muted);">Энэ ангилалд одоогоор контент байхгүй байна.</p>`;
}

function filterCategory(cat, element) {
    currentActiveCategory = cat;
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    if(element) element.classList.add('active');
    renderAllMoviesPage();
}

function searchMoviesHome() {
    let val = document.getElementById('mainMovieSearchInput').value.toLowerCase();
    let grid = document.getElementById('grid-trending');
    if(!grid) return;
    let filtered = movies.filter(m => m.title.toLowerCase().includes(val));
    grid.innerHTML = filtered.map(createMovieCard).join('');
}

// --- КИНО ДЭЛГЭРЭНГҮЙ ХУУДАС БА ТОГЛУУЛАГЧ ---
function showMovieProfile(id) {
    let m = movies.find(movie => movie.id === id);
    if(!m) return;
    currentSelectedMovieId = id;
    m.views++;
    
    if(currentUser) {
        if(!currentUser.history) currentUser.history = [];
        if(!currentUser.history.includes(id)) {
            currentUser.history.unshift(id);
            if(currentUser.history.length > 8) currentUser.history.pop();
        }
    }
    saveData();

    document.getElementById('mProfType').innerText = m.category === 'drama' ? 'ЦУВРАЛ КИНО' : 'ВЭБТУН / КОМИК';
    document.getElementById('mProfTitle').innerText = m.title;
    document.getElementById('mProfDesc').innerText = m.desc;
    document.getElementById('mProfStatus').innerText = m.status;
    document.getElementById('mProfViews').innerText = m.views;
    document.getElementById('mProfPrice').innerText = m.price === 0 ? 'Үнэгүй' : `${m.price} ₮`;
    
    let coverImg = m.cover || 'https://images.unsplash.com/photo-1578632767115-351597cf2477?w=500';
    document.getElementById('mProfCoverContainer').innerHTML = `<img src="${coverImg}" alt="cover">`;

    // Тоглуулагчийг нууж бэлдэх
    let videoPlayerBox = document.getElementById('videoPlayerBox');
    if(videoPlayerBox) videoPlayerBox.classList.add('hidden');

    renderMovieActionButtons(m);
    showPage('movieProfilePage');
}

function isVipActive(user) {
    if(!user || !user.vipExpires) return false;
    return user.vipExpires > Date.now();
}

function renderMovieActionButtons(m) {
    let container = document.getElementById('movieActionButtonsContainer');
    let epBlock = document.getElementById('episodesBlockContainer');
    container.innerHTML = "";
    
    if(m.price === 0) {
        container.innerHTML = `<span style="color:#10b981; font-weight:bold;"><i class="fas fa-unlock"></i> Үнэгүй үзэх боломжтой</span>`;
        if(epBlock) epBlock.classList.remove('hidden');
        renderEpisodesList(m.episodes);
        return;
    }
    
    if(!currentUser) {
        container.innerHTML = `<button class="btn-main" onclick="openModal('loginModal')">Нэвтэрч үзэх</button>`;
        if(epBlock) epBlock.classList.add('hidden');
        return;
    }
    
    let hasVip = isVipActive(currentUser);
    let hasRented = currentUser.rentedMovies && currentUser.rentedMovies.includes(m.code);
    
    if(hasVip || hasRented) {
        container.innerHTML = `<span style="color:var(--vip-color); font-weight:bold;"><i class="fas fa-check-circle"></i> Үзэх эрх нээлттэй ${hasVip ? '(VIP)' : '(Түрээслэсэн)'}</span>`;
        if(epBlock) epBlock.classList.remove('hidden');
        renderEpisodesList(m.episodes);
    } else {
        container.innerHTML = `
            <button class="btn-vip" onclick="showPage('vipPage')">VIP авах</button>
            <button class="btn-main" onclick="rentMovieDirect('${m.code}', ${m.price})">Шууд түрээслэх (${m.price} ₮)</button>
        `;
        if(epBlock) epBlock.classList.add('hidden');
    }
}

function renderEpisodesList(episodes) {
    let grid = document.getElementById('mProfEpisodesGrid');
    if(!grid) return;
    if(!episodes || episodes.length === 0) {
        grid.innerHTML = `<p style="color:var(--text-muted); font-size:12px;">Анги хараахан ороогүй байна.</p>`;
        return;
    }
    grid.innerHTML = episodes.map(ep => `
        <button class="ep-btn" onclick="playEpisode(${ep.num}, '${ep.file}')">Анги ${ep.num}</button>
    `).join('');
}

// Видео тоглуулах үндсэн функц
function playEpisode(num, file) {
    let videoPlayerBox = document.getElementById('videoPlayerBox');
    let myVideo = document.getElementById('myVideo');
    if(videoPlayerBox && myVideo) {
        videoPlayerBox.classList.remove('hidden');
        myVideo.src = file;
        myVideo.play();
        window.scrollTo({ top: videoPlayerBox.offsetTop - 80, behavior: 'smooth' });
    } else {
        alert(`Сонгосон анги: ${num}\nВидеоны зам: ${file}`);
    }
}

function goBackToContent() {
    let myVideo = document.getElementById('myVideo');
    if(myVideo) myVideo.pause();
    showPage(currentActiveCategory === 'all' ? 'homePage' : 'allMoviesPage');
}

// --- ТӨЛБӨРТЭЙ СИСТЕМҮҮД (ГАР АРГААР БАТАЛГААЖУУЛАХ) ---
let activePaymentType = null; 
let pendingCode = "";
let pendingAmount = 0;

function buyVipPackageAction(name, price, code) {
    if(!currentUser) return openModal('loginModal');
    activePaymentType = 'VIP';
    pendingCode = code;
    pendingAmount = price;
    
    document.getElementById('payAmount').innerText = `${price} ₮`;
    document.getElementById('payDetail').innerText = `${code}-${currentUser.phone}`;
    openModal('paymentModal');
}

function rentMovieDirect(movieCode, price) {
    activePaymentType = 'RENT';
    pendingCode = movieCode;
    pendingAmount = price;
    
    document.getElementById('payAmount').innerText = `${price} ₮`;
    document.getElementById('payDetail').innerText = `${movieCode}-${currentUser.phone}`;
    openModal('paymentModal');
}

function copyText(elementId) {
    let text = document.getElementById(elementId).innerText;
    if(text.includes('Хуулах')) {
        text = text.replace('Хуулах', '').trim();
    }
    navigator.clipboard.writeText(text).then(() => {
        alert("Амжилттай хуулагдлаа: " + text);
    }).catch(() => {
        alert("Хуулж чадсангүй.");
    });
}

// Хэрэглэгч төлбөр төлсөн хүсэлтээ илгээх (Админ дээр очиж баталгаажна)
function confirmPaymentSubmit() {
    let newRequest = {
        id: Date.now(),
        type: 'PAYMENT',
        paymentType: activePaymentType,
        code: pendingCode,
        amount: pendingAmount,
        userId: currentUser.id,
        userName: currentUser.name,
        userPhone: currentUser.phone,
        status: 'pending'
    };
    
    requests.push(newRequest);
    saveData();
    closeModal('paymentModal');
    updateRequestBadge();
    alert("Төлбөрийн хүсэлт илгээгдлээ. Админ таны гүйлгээг шалгаж эрхийг нээнэ үү.");
}

// --- ХЭРЭГЛЭГЧИЙН ПРОФАЙЛ ХЭСЭГ ---
function renderUserProfile() {
    if(!currentUser) return;
    document.getElementById('profileNameField').innerText = currentUser.name;
    document.getElementById('profileEmail').innerText = currentUser.email;
    document.getElementById('profilePhoneField').innerText = currentUser.phone;
    document.getElementById('profileMainImg').src = currentUser.avatar || 'https://cdn-icons-png.flaticon.com/512/3135/3135715.png';
    
    let roleText = "Хэрэглэгч";
    if(currentUser.role === 'admin') roleText = "⚙️ Админ";
    if(currentUser.role === 'moderator') roleText = "✒️ Модератор";
    document.getElementById('profileRoleBadge').innerText = roleText;

    if(isVipActive(currentUser)) {
        document.getElementById('profileVipStatus').innerText = "👑 VIP Идэвхтэй";
        document.getElementById('profileVipTimeValue').innerText = new Date(currentUser.vipExpires).toLocaleDateString();
    } else {
        document.getElementById('profileVipStatus').innerText = "Ердийн хэрэглэгч";
        document.getElementById('profileVipTimeValue').innerText = "Хугацаа дууссан эсвэл аваагүй";
    }

    let rentedGrid = document.getElementById('profileRentedGrid');
    let renteds = movies.filter(m => currentUser.rentedMovies && currentUser.rentedMovies.includes(m.code));
    if(rentedGrid) rentedGrid.innerHTML = renteds.length > 0 ? renteds.map(createMovieCard).join('') : `<p style="color:var(--text-muted); font-size:12px; padding:10px;">Түрээсэлсэн кино байхгүй.</p>`;

    let historyGrid = document.getElementById('profileHistoryGrid');
    let historyList = [];
    if(currentUser.history) {
        currentUser.history.forEach(hid => {
            let found = movies.find(m => m.id === hid);
            if(found) historyList.push(found);
        });
    }
    if(historyGrid) historyGrid.innerHTML = historyList.length > 0 ? historyList.map(createMovieCard).join('') : `<p style="color:var(--text-muted); font-size:12px; padding:10px;">Үзсэн түүх байхгүй.</p>`;
}

function openProfileEditBox() {
    document.getElementById('editProfileName').value = currentUser.name;
    document.getElementById('editProfilePhone').value = currentUser.phone;
    tempSelectedAvatarUrl = currentUser.avatar || "";
    openModal('profileEditModal');
}

function previewUserAvatarFile(event) {
    let file = event.target.files[0];
    if (file) {
        let reader = new FileReader();
        reader.onload = function(e) {
            tempSelectedAvatarUrl = e.target.result;
            alert("Зураг амжилттай сонгогдлоо!");
        }
        reader.readAsDataURL(file);
    }
}

function saveUserProfileChanges() {
    let newName = document.getElementById('editProfileName').value;
    let newPhone = document.getElementById('editProfilePhone').value;
    
    if(!newName || !newPhone) return alert("Талбаруудыг бүрэн бөглөнө үү!");
    
    currentUser.name = newName;
    currentUser.phone = newPhone;
    if(tempSelectedAvatarUrl) {
        currentUser.avatar = tempSelectedAvatarUrl;
    }
    
    saveData();
    closeModal('profileEditModal');
    checkAuthUI();
    renderUserProfile();
    alert("Хэрэглэгчийн мэдээлэл амжилттай шинэчлэгдлээ!");
}

// --- МОДЕРАТОР СИСТЕМ ---
function submitModRequest() {
    if(currentUser.role !== 'admin' && currentUser.role !== 'moderator') {
        return alert("Зөвхөн админ эсвэл модератор кино нэмэх хүсэлт гаргах эрхтэй!");
    }
    
    let title = document.getElementById('modReqTitle').value;
    let desc = document.getElementById('modReqDesc').value;
    let price = parseInt(document.getElementById('modReqPrice').value) || 0;
    let code = document.getElementById('modReqCode').value;
    let category = document.getElementById('modReqCategory').value;
    let status = document.getElementById('modReqStatus').value;
    let cover = document.getElementById('modReqCover')?.value || "";

    if(!title || !code) return alert("Шаардлагатай талбаруудыг бөглөнө үү!");

    let newReq = {
        id: Date.now(), type: 'MOVIE_ADD', title, desc, price, code, category, status, cover,
        senderName: currentUser.name, senderId: currentUser.id
    };
    requests.push(newReq);
    saveData();
    
    document.getElementById('modReqTitle').value = "";
    document.getElementById('modReqDesc').value = "";
    document.getElementById('modReqCode').value = "";
    if(document.getElementById('modReqCover')) document.getElementById('modReqCover').value = "";
    
    updateRequestBadge();
    alert("Кино нэмэх хүсэлтийг админд амжилттай илгээлээ!");
}

function updateRequestBadge() {
    let el = document.getElementById('reqBadgeCount');
    if(el) el.innerText = requests.length;
}

// --- АДМИН УДИРДЛАГА БА КИНО ЗАСАХ ---
let adminActiveTab = "moviesTab";
let adminSelectedSeriesId = null;
let adminEditingMovieId = null;

function switchAdminTab(tabId) {
    adminActiveTab = tabId;
    document.querySelectorAll('.admin-tabs-nav button').forEach(b => b.classList.remove('active'));
    document.querySelectorAll('.admin-tab-content').forEach(c => c.classList.add('hidden'));
    
    if(tabId === 'moviesTab') document.getElementById('btn-tab-movies').classList.add('active');
    if(tabId === 'requestsTab') document.getElementById('btn-tab-requests').classList.add('active');
    if(tabId === 'usersTab') document.getElementById('btn-tab-users').classList.add('active');
    
    document.getElementById(tabId).classList.remove('hidden');
    initAdminPanel();
}

function initAdminPanel() {
    if(adminActiveTab === 'moviesTab') renderAdminMovieList();
    else if(adminActiveTab === 'usersTab') renderAdminUsersTable();
    else if(adminActiveTab === 'requestsTab') renderAdminRequests();
    updateRequestBadge();
}

function renderAdminMovieList() {
    let container = document.getElementById('adminMovieList');
    if(!container) return;
    container.innerHTML = movies.map(m => `
        <div class="admin-movie-item" style="margin-bottom:8px; background:var(--bg-card); padding:10px; border-radius:6px; display:flex; justify-content:space-between; align-items:center;">
            <div>
                <strong>${m.title}</strong> (${m.code}) - Ангиуд: ${m.episodes ? m.episodes.length : 0}
            </div>
            <div>
                <button onclick="adminSelectMovieForEpisodes(${m.id})" style="background:#8b5cf6; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer;">Анги засах</button>
                <button onclick="adminPrepareEditMovie(${m.id})" style="background:#f59e0b; color:black; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:5px; font-weight:600;">Засах</button>
                <button onclick="adminDeleteMovie(${m.id})" style="background:#ef4444; color:white; border:none; padding:4px 8px; border-radius:4px; cursor:pointer; margin-left:5px;">Устгах</button>
            </div>
        </div>
    `).join('');
}

function adminPrepareEditMovie(id) {
    let m = movies.find(movie => movie.id === id);
    if(!m) return;
    
    adminEditingMovieId = id;
    document.getElementById('admTitle').value = m.title;
    document.getElementById('admDesc').value = m.desc;
    document.getElementById('admPrice').value = m.price;
    document.getElementById('admManualCode').value = m.code;
    document.getElementById('admCategory').value = m.category;
    document.getElementById('admStatus').value = m.status;
    if(document.getElementById('admCover')) document.getElementById('admCover').value = m.cover || "";
    
    let submitBtn = document.getElementById('btnAdminMovieSubmit');
    if(submitBtn) {
        submitBtn.innerText = "Өөрчлөлтийг хадгалах";
        submitBtn.style.background = "#3b82f6";
    }
    alert(`Засах горим идэвхжлээ: ${m.title}`);
}

function adminSelectMovieForEpisodes(id) {
    let m = movies.find(movie => movie.id === id);
    if(!m) return;
    adminSelectedSeriesId = id;
    document.getElementById('admSelectedSeriesDisplay').innerText = `Сонгогдсон кино: ${m.title} (${m.code})`;
}

// ГАЛЕРЕЙГААС ВИДЕО СОНГОХЫГ ДЭМЖДЭГ БОЛСОН ШИНЭЧЛЭГДСЭН АНГИ НЭМЭХ ФУНКЦҮҮД
function handleVideoFileSelect(event) {
    let file = event.target.files[0];
    if (file) {
        tempSelectedVideoFile = URL.createObjectURL(file);
        let statusText = document.getElementById('admVideoStatusText');
        if(statusText) statusText.innerText = `Сонгогдсон файл: ${file.name} (Бэлэн)`;
    }
}

function adminAddEpisodeToMovie() {
    if(!adminSelectedSeriesId) return alert("Эхлээд жагсаалтаас анги нэмэх киногоо сонгоно уу!");
    let num = parseInt(document.getElementById('admNewEpNumber').value);
    
    if(!num || !tempSelectedVideoFile) return alert("Ангийн дугаар болон галерейгаас видео файлаа заавал сонгоно уу!");

    let m = movies.find(movie => movie.id === adminSelectedSeriesId);
    if(!m.episodes) m.episodes = [];
    if(m.episodes.some(e => e.num === num)) return alert("Энэ анги аль хэдийн нэмэгдсэн байна!");
    
    m.episodes.push({ num: num, file: tempSelectedVideoFile });
    saveData();
    
    document.getElementById('admNewEpNumber').value = "";
    document.getElementById('admVideoFileInput').value = "";
    document.getElementById('admVideoStatusText').innerText = "Галерейгаас видео файл сонгоогүй байна.";
    tempSelectedVideoFile = "";
    
    renderAdminMovieList();
    alert(`Амжилттай! ${m.title} кинонд Анги ${num} нэмэгдлээ.`);
}

function adminSaveMovie() {
    let title = document.getElementById('admTitle').value;
    let desc = document.getElementById('admDesc').value;
    let price = parseInt(document.getElementById('admPrice').value) || 0;
    let code = document.getElementById('admManualCode').value;
    let category = document.getElementById('admCategory').value;
    let status = document.getElementById('admStatus').value;
    let cover = document.getElementById('admCover')?.value || "";

    if(!title || !code) return alert("Нэр болон код заавал хэрэгтэй!");

    if (adminEditingMovieId) {
        let m = movies.find(movie => movie.id === adminEditingMovieId);
        if(m) {
            m.title = title;
            m.desc = desc;
            m.price = price;
            m.code = code;
            m.category = category;
            m.status = status;
            m.cover = cover;
            alert("Киноны мэдээлэл амжилттай шинэчлэгдлээ!");
        }
        adminEditingMovieId = null;
        let submitBtn = document.getElementById('btnAdminMovieSubmit');
        if(submitBtn) {
            submitBtn.innerText = "Шинэ кино хадгалах";
            submitBtn.style.background = "#10b981";
        }
    } else {
        let newMovie = {
            id: Date.now(), title, desc, price, code, category, status, cover,
            views: 0, episodes: [], isTrending: false, isNew: true
        };
        movies.push(newMovie);
        alert("Шинэ кино амжилттай нэмэгдлээ!");
    }

    saveData();
    document.getElementById('admTitle').value = "";
    document.getElementById('admDesc').value = "";
    document.getElementById('admManualCode').value = "";
    if(document.getElementById('admCover')) document.getElementById('admCover').value = "";
    
    renderAdminMovieList();
    renderHomeMovies();
}

function adminDeleteMovie(id) {
    if(!confirm("Та устгахдаа итгэлтэй байна уу?")) return;
    movies = movies.filter(m => m.id !== id);
    if(adminSelectedSeriesId === id) {
        adminSelectedSeriesId = null;
        document.getElementById('admSelectedSeriesDisplay').innerText = "Кино сонгогдоогүй байна.";
    }
    saveData();
    renderAdminMovieList();
    renderHomeMovies();
}

// --- АДМИН ХЭРЭГЛЭГЧИД ХОНОГ ӨГӨХ ХЭСЭГ ---
function renderAdminUsersTable() {
    let tbody = document.getElementById('adminUsersTableBody');
    if(!tbody) return;
    tbody.innerHTML = users.map(u => {
        let vipText = u.vipExpires && u.vipExpires > Date.now() ? `Идэвхтэй (${new Date(u.vipExpires).toLocaleDateString()})` : "Ердийн";
        let actionButtons = "";
        
        if(u.role !== 'admin') {
            let roleBtn = u.role === 'moderator' ? 
                `<button onclick="changeUserRole(${u.id}, 'user')" style="background:#d97706; color:white; padding:4px 8px; font-size:11px; border:none; border-radius:4px; cursor:pointer;">Mod цуцлах</button>` :
                `<button onclick="changeUserRole(${u.id}, 'moderator')" style="background:#3b82f6; color:white; padding:4px 8px; font-size:11px; border:none; border-radius:4px; cursor:pointer;">Mod болгох</button>`;
            
            actionButtons = `
                <div style="display:flex; gap:5px; align-items:center;">
                    ${roleBtn}
                    <input type="number" id="vipDays-${u.id}" placeholder="Хоног" style="width:60px; padding:4px; font-size:11px; background:#0f172a; border:1px solid #334155; color:white; border-radius:4px;">
                    <button onclick="adminGiveVipDays(${u.id})" style="background:#10b981; color:white; padding:4px 8px; font-size:11px; border:none; border-radius:4px; cursor:pointer;">VIP өгөх</button>
                </div>
            `;
        } else {
            actionButtons = `<span style="color:var(--vip-color); font-weight:600;">Үндсэн Админ</span>`;
        }

        return `
            <tr>
                <td>${u.name}</td>
                <td>${u.email}</td>
                <td>${u.phone}</td>
                <td><span class="badge" style="background:#475569; color:white;">${u.role.toUpperCase()}</span></td>
                <td>${vipText}</td>
                <td>${actionButtons}</td>
            </tr>
        `;
    }).join('');
}

function adminGiveVipDays(userId) {
    let dayInput = document.getElementById(`vipDays-${userId}`);
    let days = parseInt(dayInput.value);
    if(!days || days <= 0) return alert("Зөв хоногийн тоо оруулна үү!");

    let u = users.find(user => user.id === userId);
    if(u) {
        let currentVip = u.vipExpires && u.vipExpires > Date.now() ? u.vipExpires : Date.now();
        u.vipExpires = currentVip + (days * 24 * 60 * 60 * 1000);
        saveData();
        renderAdminUsersTable();
        dayInput.value = "";
        alert(`${u.name} хэрэглэгчид ${days} хоногийн VIP эрх амжилттай нэмлээ.`);
    }
}

function changeUserRole(userId, newRole) {
    let u = users.find(user => user.id === userId);
    if(u) {
        u.role = newRole;
        saveData();
        renderAdminUsersTable();
        alert(`${u.name} хэрэглэгчийн статус өөрчлөгдлөө.`);
    }
}

// --- ХҮСЭЛТҮҮД ХАРАХ БА БАТАЛГААЖУУЛАХ ---
function renderAdminRequests() {
    let container = document.getElementById('adminRequestsList');
    if(!container) return;
    if(requests.length === 0) {
        container.innerHTML = `<p style="color:var(--text-muted); text-align:center; padding:20px;">Шинэ хүсэлт ирээгүй байна.</p>`;
        return;
    }
    // Энэ хэсэгт дутуу тасарсан байсан админы хүсэлтийн жагсаалтын логикийг нөхөж гүйцээв
    container.innerHTML = requests.map(r => {
        if(r.type === 'PAYMENT') {
            return `
                <div class="request-card" style="border-left: 4px solid var(--vip-color); margin-bottom:12px; background:var(--bg-card); padding:15px; border-radius:6px;">
                    <div class="request-header" style="display:flex; justify-content:space-between;">
                        <strong>💰 ТӨЛБӨРИЙН ХҮСЭЛТ</strong>
                        <span class="badge" style="background:#1e3a8a; color:white; padding:2px 6px; border-radius:4px;">${r.paymentType}</span>
                    </div>
                    <h4>Хэрэглэгч: ${r.userName} (Утас: ${r.userPhone})</h4>
                    <p style="margin:6px 0;">Илгээсэн код: <strong>${r.code}</strong></p>
                    <div style="font-size:14px; margin-bottom:10px;">Дүн: <strong style="color:#10b981;">${r.amount} ₮</strong></div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="alert('Баталгаажлаа')" style="background:#10b981; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer; font-weight:bold;">Төлбөр баталж Эрх нээх</button>
                        <button onclick="alert('Татгалзлаа')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Татгалзах</button>
                    </div>
                </div>
            `;
        } else {
            return `
                <div class="request-card" style="margin-bottom:12px; background:var(--bg-card); padding:15px; border-radius:6px; border-left:4px solid #3b82f6;">
                    <div class="request-header" style="display:flex; justify-content:space-between;">
                        <strong>🎬 КИНО НЭМЭХ ХҮСЭЛТ (Mod: ${r.senderName})</strong>
                        <span class="badge" style="background:#475569; color:white; padding:2px 6px; border-radius:4px;">${r.category === 'drama' ? 'Цуврал' : 'Вэбтун'}</span>
                    </div>
                    <h4>Нэр: ${r.title} (Код: ${r.code})</h4>
                    <p style="font-size:13px; color:var(--text-muted); margin:4px 0;">Тайлбар: ${r.desc}</p>
                    <div style="font-size:13px; margin-bottom:12px;">Үнэ: <strong>${r.price} ₮</strong></div>
                    <div style="display:flex; gap:10px;">
                        <button onclick="alert('Кино нэмэгдлээ')" style="background:#3b82f6; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Зөвшөөрөх</button>
                        <button onclick="alert('Татгалзлаа')" style="background:#ef4444; color:white; border:none; padding:6px 12px; border-radius:4px; cursor:pointer;">Устгах</button>
                    </div>
                </div>
            `;
        }
    }).join('');
}

// --- ШИНЭЭР НЭМЭГДСЭН НҮДНИЙ ДҮРС БА НУУЦ ҮГ СЭРГЭЭХ СИСТЕМҮҮД ---
function togglePasswordVisibility(inputId, iconId) {
    let input = document.getElementById(inputId);
    let icon = document.getElementById(iconId);
    if(input && icon) {
        if(input.type === "password") {
            input.type = "text";
            icon.classList.remove('fa-eye');
            icon.classList.add('fa-eye-slash');
        } else {
            input.type = "password";
            icon.classList.remove('fa-eye-slash');
            icon.classList.add('fa-eye');
        }
    }
}

function openForgotModal() {
    let loginModal = document.getElementById('loginModal');
    if(loginModal) loginModal.classList.remove('active'); 
    
    let forgotModal = document.getElementById('forgotModal');
    if(forgotModal) {
        forgotModal.style.display = 'flex';
        document.getElementById('forgotStep1').style.display = 'block';
        document.getElementById('forgotStep2').style.display = 'none';
    }
}

function recoverPasswordLogic() {
    let email = document.getElementById('forgotEmail').value;
    let phone = document.getElementById('forgotPhone').value;
    let user = users.find(u => u.email === email && u.phone === phone);
    
    if(user) {
        document.getElementById('forgotStep1').style.display = 'none';
        document.getElementById('forgotStep2').style.display = 'block';
        document.getElementById('targetUserId').value = user.id;
    } else { 
        alert("Утасны дугаар эсвэл имэйл тохирохгүй байна!"); 
    }
}

function resetPasswordLogic() {
    let userId = document.getElementById('targetUserId').value;
    let newPass = document.getElementById('newPassInput').value;
    
    if(!newPass || newPass.length < 4) return alert("Шинэ нууц үгээ оруулна уу (дор хаяж 4 тэмдэгт)!");
    
    let user = users.find(u => u.id == userId);
    if(user) {
        user.pass = newPass;
        saveData();
        alert("Нууц үг амжилттай солигдлоо! Шинэ нууц үгээрээ нэвтэрнэ үү.");
        document.getElementById('forgotModal').style.display = 'none';
        openModal('loginModal');
    }
}
// Нууц үг сэргээх модал нээх функц
function openForgotModal() {
    // Хэрэв нэвтрэх модал нээлттэй байвал хаах
    closeModal('loginModal'); 
    
    // Сэргээх модалыг харуулах
    const forgotModal = document.getElementById('forgotModal');
    if (forgotModal) {
        forgotModal.classList.remove('hidden');
        forgotModal.style.display = 'flex'; // Төвд нь байрлуулах
        
        // Эхний алхмыг харуулж, дараагийн алхмыг нуух
        document.getElementById('forgotStep1').classList.remove('hidden');
        document.getElementById('forgotStep2').classList.add('hidden');
    }
}

// Нууц үг сэргээх модал хаах функц (Саяны HTML дээрх &times; дээр ажиллана)
function closeModal(modalId) {
    const modal = document.getElementById(modalId);
    if (modal) {
        modal.classList.add('hidden');
        if (modalId === 'forgotModal') {
            modal.style.display = 'none';
        }
    }
}