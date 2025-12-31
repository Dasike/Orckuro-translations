// ==================================================
// 1. CONFIGURATION: YOUR MANGA LIST
// ==================================================
// Add new mangas here. Format: { id: "folder_name", title: "Nice Title" }
const mangaList = [
    { id: "dick",        title: "Dick" },
    { id: "one_piece",   title: "One Piece" }
];


// ==================================================
// 2. HOMEPAGE GENERATOR (Do Not Edit)
// ==================================================
const grid = document.getElementById('auto-grid');

if (grid) {
    mangaList.forEach(manga => {
        const card = document.createElement('div');
        card.className = 'manga-card';
        
        // Build HTML. Assumes cover is ALWAYS 'cover.jpg'
        card.innerHTML = `
            <img src="images/${manga.id}/cover.jpg" class="card-img" onerror="this.src='https://via.placeholder.com/300?text=Cover+Missing'">
            <h3>${manga.title}</h3>
            <a href="reader.html?series=${manga.id}&chapter=1" class="read-btn" id="btn-${manga.id}">Read Chapter 1</a>
        `;
        
        grid.appendChild(card);
        
        // CHECK MEMORY (Show "Continue" if started)
        const savedCh = localStorage.getItem('progress_' + manga.id);
        if (savedCh) {
            const btn = document.getElementById(`btn-${manga.id}`);
            if (btn) {
                btn.innerText = "▶ Continue Ch " + savedCh;
                btn.href = `reader.html?series=${manga.id}&chapter=${savedCh}`;
                btn.style.backgroundColor = "#03DAC6"; // Teal
                btn.style.color = "#000";
            }
        }
    });
}


// ==================================================
// 3. READER ENGINE (Do Not Edit)
// ==================================================
const readerContainer = document.getElementById('reader-container');

if (readerContainer) {
    const urlParams = new URLSearchParams(window.location.search);
    const series = urlParams.get('series');
    const chapter = parseInt(urlParams.get('chapter')) || 1;
    const titleDisplay = document.getElementById('chapter-title');

    // Display Title
    const mangaObj = mangaList.find(m => m.id === series);
    const niceTitle = mangaObj ? mangaObj.title : series;
    if (titleDisplay) titleDisplay.innerText = `${niceTitle} - Ch ${chapter}`;

    // Save Progress
    if (series) localStorage.setItem('progress_' + series, chapter);

    // --- SMART IMAGE LOADER ---
    // Loads 1.jpg, then 2.jpg, then 3.jpg... stops automatically on error.
    let pageNum = 1;
    let keepLoading = true;

    function loadNextPage() {
        if (!keepLoading) return;

        const img = document.createElement('img');
        // Looks for: images/folder_name/ch1/1.jpg
        img.src = `images/${series}/ch${chapter}/${pageNum}.jpg`;
        
        img.onload = function() {
            readerContainer.appendChild(img);
            pageNum++;
            loadNextPage();
        };

        img.onerror = function() {
            keepLoading = false;
            if (pageNum === 1) {
                readerContainer.innerHTML = "<h2 style='text-align:center; padding:50px; color:white;'>Chapter empty or files named wrong.<br><small>Use 1.jpg, 2.jpg...</small></h2>";
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

    // Nav Buttons
    window.changeChapter = function(dir) {
        window.location.href = `reader.html?series=${series}&chapter=${chapter + dir}`;
    };
}
