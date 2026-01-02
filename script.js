// ==================================================
// 1. LOAD MANGA LIST FROM JSON
// ==================================================
let mangaList = [];

async function loadMangaList() {
    try {
        const response = await fetch('manga.json');
        mangaList = await response.json();
    } catch (error) {
        console.error('Failed to load manga list:', error);
        // Fallback to hardcoded list
        mangaList = [
            { id: "dick", title: "Dick", type: "manhwa" },
            { id: "one_piece", title: "One Piece", type: "manga" }
        ];
    }
}


// ==================================================
// 2. HOMEPAGE FILTER & GENERATOR
// ==================================================
const grid = document.getElementById('auto-grid');
const searchInput = document.getElementById('search-input');
let currentCategory = 'all';
let currentSearch = '';

// This function clears the grid and rebuilds it based on what you clicked
function filterContent(category, search = currentSearch) {
    if (!grid) return; // Stop if we are not on the homepage

    currentCategory = category;
    currentSearch = search;

    // 1. Clear the current grid
    grid.innerHTML = "";

    // 2. Filter the list
    let filteredList = mangaList.filter(item => {
        const matchesCategory = category === 'all' || item.type === category;
        const matchesSearch = item.title.toLowerCase().includes(search.toLowerCase());
        return matchesCategory && matchesSearch;
    });
    
    if (category === 'favorites') {
        const favorites = getFavorites();
        filteredList = filteredList.filter(item => favorites.includes(item.id));
    }

    // 3. Build the cards
    filteredList.forEach(manga => {
        const card = document.createElement('div');
        card.className = 'manga-card';
        
        const isFavorite = getFavorites().includes(manga.id);
        
        card.innerHTML = `
            <div class="card-badge ${manga.type}">${manga.type.toUpperCase()}</div>
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-id="${manga.id}">❤️</button>
            <img src="Images/${manga.id}/cover.jpg" class="card-img" onerror="this.src='https://via.placeholder.com/300?text=Cover+Missing'">
            <h3>${manga.title}</h3>
            <a href="reader.html?series=${manga.id}&chapter=1" class="read-btn" id="btn-${manga.id}">Read Chapter 1</a>
        `;
        
        grid.appendChild(card);
        
        // Check Memory
        const savedCh = localStorage.getItem('progress_' + manga.id);
        if (savedCh) {
            const btn = document.getElementById(`btn-${manga.id}`);
            if (btn) {
                btn.innerText = "▶ Continue Ch " + savedCh;
                btn.href = `reader.html?series=${manga.id}&chapter=${savedCh}`;
                btn.classList.add('continue-active');
            }
        }
    });

    // 4. Update Button Colors
    document.querySelectorAll('.filter-btn').forEach(btn => btn.classList.remove('active'));
    const activeBtn = document.getElementById('btn-' + category);
    if (activeBtn) activeBtn.classList.add('active');
}

// Run this when the page loads to show everything first
if (grid) {
    loadMangaList().then(() => {
        filterContent('all');
        
        // Event listeners for filter buttons
        document.getElementById('btn-all').addEventListener('click', () => filterContent('all'));
        document.getElementById('btn-manga').addEventListener('click', () => filterContent('manga'));
        document.getElementById('btn-manhwa').addEventListener('click', () => filterContent('manhwa'));
        document.getElementById('btn-favorites').addEventListener('click', () => filterContent('favorites'));
        
        // Search input
        if (searchInput) {
            searchInput.addEventListener('input', (e) => filterContent(currentCategory, e.target.value));
        }
        
        // Favorites
        grid.addEventListener('click', (e) => {
            if (e.target.classList.contains('favorite-btn')) {
                const id = e.target.dataset.id;
                toggleFavorite(id);
                e.target.classList.toggle('favorited');
            }
        });
    });
}


// ==================================================
// FAVORITES SYSTEM
// ==================================================
function getFavorites() {
    return JSON.parse(localStorage.getItem('favorites') || '[]');
}

function toggleFavorite(id) {
    const favorites = getFavorites();
    if (favorites.includes(id)) {
        const index = favorites.indexOf(id);
        favorites.splice(index, 1);
    } else {
        favorites.push(id);
    }
    localStorage.setItem('favorites', JSON.stringify(favorites));
}


// ==================================================
// THEME TOGGLE
// ==================================================
const themeToggle = document.getElementById('theme-toggle');
if (themeToggle) {
    const currentTheme = localStorage.getItem('theme') || 'dark';
    if (currentTheme === 'light') {
        document.body.classList.add('light');
    }
    themeToggle.textContent = currentTheme === 'dark' ? '🌙' : '☀️';
    
    themeToggle.addEventListener('click', () => {
        const newTheme = document.body.classList.contains('light') ? 'dark' : 'light';
        document.body.classList.toggle('light');
        localStorage.setItem('theme', newTheme);
        themeToggle.textContent = newTheme === 'dark' ? '🌙' : '☀️';
    });
}


// ==================================================
// USER ACCOUNTS (SIMPLE LOCALSTORAGE)
// ==================================================
const loginBtn = document.getElementById('login-btn');
if (loginBtn) {
    const user = localStorage.getItem('user');
    if (user) {
        loginBtn.textContent = `Hi, ${user}`;
        loginBtn.addEventListener('click', logout);
    } else {
        loginBtn.addEventListener('click', login);
    }
}

function login() {
    const username = prompt('Enter username:');
    if (username) {
        localStorage.setItem('user', username);
        loginBtn.textContent = `Hi, ${username}`;
        loginBtn.removeEventListener('click', login);
        loginBtn.addEventListener('click', logout);
    }
}

function logout() {
    localStorage.removeItem('user');
    loginBtn.textContent = 'Login';
    loginBtn.removeEventListener('click', logout);
    loginBtn.addEventListener('click', login);
}


// ==================================================
// 3. READER ENGINE (SAME AS BEFORE)
// ==================================================
const readerContainer = document.getElementById('reader-container');

if (readerContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const series = urlParams.get('series');
    const chapter = parseInt(urlParams.get('chapter')) || 1;
    const titleDisplay = document.getElementById('chapter-title');

    const mangaObj = mangaList.find(m => m.id === series);
    const niceTitle = mangaObj ? mangaObj.title : series;
    if (titleDisplay) titleDisplay.innerText = `${niceTitle} - Ch ${chapter}`;

    if (series) localStorage.setItem('progress_' + series, chapter);

    let pageNum = 1;
    let keepLoading = true;

    function loadNextPage() {
        if (!keepLoading) return;
        const img = document.createElement('img');
        img.src = `Images/${series}/ch${chapter}/${pageNum.toString().padStart(2, '0')}.jpg`;
        img.onload = function() {
            readerContainer.appendChild(img);
            pageNum++;
            loadNextPage();
        };
        img.onerror = function() {
            keepLoading = false;
            if (pageNum === 1) {
                readerContainer.innerHTML = "<h2 style='text-align:center; padding:50px; color:white;'>No images found.<br><small>Use 01.jpg, 02.jpg...</small></h2>";
            } else {
                const endMsg = document.createElement('h3');
                endMsg.innerText = "— END OF CHAPTER —";
                endMsg.style.textAlign = "center";
                endMsg.style.color = "#555";
                endMsg.style.padding = "20px";
                readerContainer.appendChild(endMsg);
            }
        };
    }
    loadNextPage();

    window.changeChapter = function(dir) {
        window.location.href = `reader.html?series=${series}&chapter=${chapter + dir}`;
    };
    
    // Keyboard navigation
    document.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') changeChapter(-1);
        if (e.key === 'ArrowRight') changeChapter(1);
    });
}

