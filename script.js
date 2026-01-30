// ==================================================
// 0. IMAGE PROTECTION (ENHANCED)
// ==================================================
// Disable right-click on images
document.addEventListener('contextmenu', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// Disable dragging images
document.addEventListener('dragstart', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// Disable text selection on images
document.addEventListener('selectstart', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// Disable copy operation on images
document.addEventListener('copy', function(e) {
    if (e.target.tagName === 'IMG') {
        e.preventDefault();
        return false;
    }
});

// ==================================================
// 1. LOAD MANGA LIST FROM JSON
// ==================================================
let mangaList = [];

async function loadMangaList() {
    try {
        const response = await fetch('manga.json');
        mangaList = await response.json();
        populateUploadSeries(); // Update upload form if present
    } catch (error) {
        console.error('Failed to load manga list:', error);
        // Fallback to hardcoded list
        mangaList = [
            { id: "dick", title: "Dick", type: "manhwa" },
            { id: "La_triste_vida_de_helen", title: "La triste vida de helen ", type: "manhwa" }
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
            <button class="favorite-btn ${isFavorite ? 'favorited' : ''}" data-id="${manga.id}" title="${isFavorite ? 'Remove from favorites' : 'Add to favorites'}" aria-label="${isFavorite ? 'Remove' : 'Add'} ${manga.title} to favorites">
                <span class="favorite-icon">${isFavorite ? '♥' : '♡'}</span>
            </button>
            <img src="Images/${manga.id}/cover.jpg" class="card-img" draggable="false" onerror="this.src='https://via.placeholder.com/300?text=Cover+Missing'">
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
        // Update hero banner with latest release
        updateHeroRelease();
        // Favorites
        grid.addEventListener('click', (e) => {
            const favBtn = e.target.closest('.favorite-btn');
            if (favBtn) {
                e.preventDefault();
                e.stopPropagation();
                const id = favBtn.dataset.id;
                toggleFavorite(id);
                const icon = favBtn.querySelector('.favorite-icon');
                const isFavorited = getFavorites().includes(id);
                icon.textContent = isFavorited ? '♥' : '♡';
                favBtn.classList.toggle('favorited', isFavorited);
                favBtn.setAttribute('title', isFavorited ? 'Remove from favorites' : 'Add to favorites');
                
                // Refresh the grid to update favorites section in real-time
                if (currentCategory === 'favorites') {
                    filterContent(currentCategory, currentSearch);
                }
            }
        });
    });
}

// Update hero banner based on manga metadata (manga.json)
function updateHeroRelease() {
    try {
        if (!Array.isArray(mangaList) || mangaList.length === 0) return;

        // Prefer an item explicitly marked as new, otherwise pick the one with highest latestChapter
        let release = mangaList.find(m => m.isNew === true);
        if (!release) {
            release = mangaList.slice().sort((a,b) => (b.latestChapter||0) - (a.latestChapter||0))[0];
        }
        if (!release) return;

        const banner = document.getElementById('hero-banner');
        const titleEl = document.getElementById('hero-title');
        const subEl = document.getElementById('hero-sub');
        const readBtn = document.getElementById('hero-read');
        const newTag = document.getElementById('hero-newtag');

        if (banner) banner.style.backgroundImage = `url('Images/${release.id}/cover.jpg')`;
        if (titleEl) titleEl.innerText = release.title || release.id;
        const chap = release.latestChapter || 1;
        if (subEl) subEl.innerText = `Chapter ${chap} is out now!`;
        if (readBtn) {
            readBtn.href = `reader.html?series=${release.id}&chapter=${chap}`;
            readBtn.setAttribute('id', 'hero-read');
        }
        if (newTag) newTag.style.display = release.isNew ? 'inline-block' : 'none';
    } catch (e) {
        console.error('Failed to update hero release:', e);
    }
}


// ==================================================
// FAVORITES SYSTEM (IMPROVED)
// ==================================================
function getFavorites() {
    try {
        return JSON.parse(localStorage.getItem('favorites') || '[]');
    } catch (e) {
        console.error('Error reading favorites:', e);
        return [];
    }
}

function isFavorite(id) {
    return getFavorites().includes(id);
}

function addFavorite(id) {
    const favorites = getFavorites();
    if (!favorites.includes(id)) {
        favorites.push(id);
        saveFavorites(favorites);
        return true;
    }
    return false;
}

function removeFavorite(id) {
    const favorites = getFavorites();
    const index = favorites.indexOf(id);
    if (index > -1) {
        favorites.splice(index, 1);
        saveFavorites(favorites);
        return true;
    }
    return false;
}

function toggleFavorite(id) {
    if (isFavorite(id)) {
        removeFavorite(id);
    } else {
        addFavorite(id);
    }
}

function saveFavorites(favorites) {
    try {
        localStorage.setItem('favorites', JSON.stringify(favorites));
    } catch (e) {
        console.error('Error saving favorites:', e);
    }
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
const AUTHORIZED_UPLOADERS = ['admin', 'uploader', 'marco']; // Specific persons allowed to upload
const loginBtn = document.getElementById('login-btn');
const uploadBtn = document.getElementById('upload-btn');

if (loginBtn) {
    const user = localStorage.getItem('user');
    if (user) {
        handleLoginState(user);
    } else {
        loginBtn.addEventListener('click', login);
    }
}

function login() {
    const username = prompt('Enter username:');
    if (username) {
        localStorage.setItem('user', username);
        handleLoginState(username);
    }
}

function handleLoginState(username) {
    loginBtn.textContent = `Hi, ${username}`;
    loginBtn.removeEventListener('click', login);
    loginBtn.addEventListener('click', logout);
    
    // Show upload button if user is authorized
    if (uploadBtn && AUTHORIZED_UPLOADERS.includes(username.toLowerCase())) {
        uploadBtn.style.display = 'inline-block';
    }
}

function logout() {
    localStorage.removeItem('user');
    loginBtn.textContent = 'Login';
    loginBtn.removeEventListener('click', logout);
    loginBtn.addEventListener('click', login);
    if (uploadBtn) uploadBtn.style.display = 'none';
}


// ==================================================
// UPLOAD SYSTEM
// ==================================================
const uploadModal = document.getElementById('upload-modal');
const closeModal = document.querySelector('.close-modal');
const uploadForm = document.getElementById('upload-form');
const seriesSelect = document.getElementById('series-select');
const newSeriesGroup = document.getElementById('new-series-group');

if (uploadBtn && uploadModal) {
    uploadBtn.addEventListener('click', () => {
        uploadModal.style.display = 'flex';
        populateUploadSeries();
    });

    closeModal.addEventListener('click', () => {
        uploadModal.style.display = 'none';
    });

    window.addEventListener('click', (e) => {
        if (e.target === uploadModal) uploadModal.style.display = 'none';
    });

    if (seriesSelect) {
        seriesSelect.addEventListener('change', (e) => {
            if (e.target.value === 'new') {
                newSeriesGroup.style.display = 'block';
            } else {
                newSeriesGroup.style.display = 'none';
            }
        });
    }

    if (uploadForm) {
        uploadForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const statusDiv = document.getElementById('upload-status');
            statusDiv.textContent = 'Uploading... Please wait.';
            statusDiv.style.color = '#bb86fc';

            const formData = new FormData();
            const isNew = seriesSelect.value === 'new';
            const seriesName = isNew ? document.getElementById('new-series-name').value : seriesSelect.value;
            
            if (!seriesName) {
                statusDiv.textContent = 'Error: Series name is required.';
                return;
            }

            formData.append('series', seriesName);
            formData.append('chapter', document.getElementById('chapter-num').value);
            
            const files = document.getElementById('chapter-files').files;
            for (let i = 0; i < files.length; i++) {
                formData.append('images', files[i]);
            }

            try {
                const res = await fetch('/upload', {
                    method: 'POST',
                    body: formData
                });
                
                if (res.ok) {
                    statusDiv.textContent = '✅ Upload Successful! Refreshing...';
                    statusDiv.style.color = '#00e676';
                    setTimeout(() => window.location.reload(), 1500);
                } else {
                    throw new Error(await res.text());
                }
            } catch (err) {
                statusDiv.textContent = '❌ Upload Failed: ' + err.message;
                statusDiv.style.color = '#ff4757';
            }
        });
    }
}

function populateUploadSeries() {
    if (!seriesSelect || !mangaList.length) return;
    // Save current selection
    const current = seriesSelect.value;
    
    seriesSelect.innerHTML = '<option value="new">+ New Series</option>';
    
    mangaList.forEach(m => {
        const opt = document.createElement('option');
        opt.value = m.id; // Use ID for folder name
        opt.textContent = m.title;
        seriesSelect.appendChild(opt);
    });

    // Restore selection if it wasn't 'new'
    if (current && current !== 'new') {
        seriesSelect.value = current;
        if (newSeriesGroup) newSeriesGroup.style.display = 'none';
    }
}


// ==================================================
// 3. READER ENGINE (WITH IMPROVEMENTS)
// ==================================================
const readerContainer = document.getElementById('reader-container');

if (readerContainer) {
    // Load manga list for reader page
    loadMangaList().then(() => {
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
            // Image protection attributes
            img.draggable = false;
            img.classList.add('protected-image');
            img.addEventListener('contextmenu', (e) => e.preventDefault());
            img.addEventListener('dragstart', (e) => e.preventDefault());
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
            const nextChapter = chapter + dir;
            if (nextChapter >= 1) {
                window.location.href = `reader.html?series=${series}&chapter=${nextChapter}`;
            }
        };
        
        // Keyboard navigation
        document.addEventListener('keydown', (e) => {
            if (e.key === 'ArrowLeft') window.changeChapter(-1);
            if (e.key === 'ArrowRight') window.changeChapter(1);
        });
    });
}
