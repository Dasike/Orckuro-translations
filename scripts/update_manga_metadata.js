#!/usr/bin/env node
const fs = require('fs');
const fsp = fs.promises;
const path = require('path');

const ROOT = path.resolve(__dirname, '..');
const IMAGES_DIR = path.join(ROOT, 'Images');
const MANGA_JSON = path.join(ROOT, 'manga.json');

function parseChapterFromName(name) {
    // matches ch01, ch1, chapter01, Chapter 02, ch 03
    const m = name.match(/ch(?:apter)?\s*0*(\d+)/i);
    if (m) return parseInt(m[1], 10);
    return null;
}

async function readJson(file) {
    try {
        const txt = await fsp.readFile(file, 'utf8');
        return JSON.parse(txt);
    } catch (e) {
        return null;
    }
}

async function writeJson(file, data) {
    const txt = JSON.stringify(data, null, 4);
    await fsp.writeFile(file, txt, 'utf8');
}

async function scanImages() {
    const out = {};
    let seriesDirs = [];
    try {
        seriesDirs = await fsp.readdir(IMAGES_DIR, { withFileTypes: true });
    } catch (e) {
        console.error('Images directory not found:', IMAGES_DIR);
        return out;
    }

    for (const dirent of seriesDirs) {
        if (!dirent.isDirectory()) continue;
        const seriesName = dirent.name;
        const seriesPath = path.join(IMAGES_DIR, seriesName);

        try {
            const items = await fsp.readdir(seriesPath, { withFileTypes: true });
            // find chapter folders
            let maxChap = 0;
            for (const it of items) {
                if (it.isDirectory()) {
                    const chap = parseChapterFromName(it.name);
                    if (Number.isInteger(chap) && chap > maxChap) maxChap = chap;
                }
            }

            // also check files directly inside (in case images stored without ch folder)
            if (maxChap === 0) {
                for (const it of items) {
                    if (it.isFile()) {
                        // try to detect patterns like 01.jpg, 001.jpg
                        const m = it.name.match(/^(0*)(\d{1,3})\.(jpg|jpeg|png|webp)$/i);
                        if (m) maxChap = Math.max(maxChap, 1);
                    }
                }
            }

            out[seriesName] = { latestChapter: maxChap };
        } catch (e) {
            // ignore
        }
    }
    return out;
}

function normalizeId(name) {
    // keep existing casing but remove spaces for id mapping
    return name.replace(/\s+/g, '_');
}

async function updateMetadata() {
    const scanned = await scanImages();
    if (!scanned || Object.keys(scanned).length === 0) {
        console.log('No series found in Images/');
        return;
    }

    const manga = await readJson(MANGA_JSON) || [];

    // map by id (case-insensitive)
    const map = new Map();
    for (const m of manga) map.set((m.id || '').toLowerCase(), m);

    let changed = false;

    for (const folderName of Object.keys(scanned)) {
        const detectedLatest = scanned[folderName].latestChapter || 0;
        // try to find matching entry: by folder name (case-insensitive) or id
        const key = folderName.toLowerCase();
        let entry = map.get(key);

        if (!entry) {
            // try to match by id ignoring underscores/dashes/spaces
            for (const [k,v] of map.entries()) {
                if (k.replace(/[_\-\s]/g,'') === key.replace(/[_\-\s]/g,'')) {
                    entry = v; break;
                }
            }
        }

        if (!entry) {
            // create new entry
            entry = {
                id: normalizeId(folderName).toLowerCase(),
                title: folderName,
                type: 'manhwa',
                latestChapter: detectedLatest,
                isNew: true
            };
            manga.push(entry);
            map.set(entry.id.toLowerCase(), entry);
            changed = true;
            console.log('Added new series to manga.json:', entry.id, 'chap', detectedLatest);
            continue;
        }

        const prev = entry.latestChapter || 0;
        if (detectedLatest > prev) {
            entry.latestChapter = detectedLatest;
            entry.isNew = true;
            changed = true;
            console.log('Updated', entry.id, 'latestChapter', detectedLatest);
        } else if (detectedLatest === prev && entry.isNew) {
            // keep isNew as is
        } else {
            // clear isNew if nothing new
            if (entry.isNew) { entry.isNew = false; changed = true; }
        }
    }

    if (changed) {
        await writeJson(MANGA_JSON, manga);
        console.log('manga.json updated.');
    } else {
        console.log('No changes found.');
    }
}

function debounce(fn, wait = 300) {
    let t;
    return (...args) => {
        clearTimeout(t);
        t = setTimeout(() => fn(...args), wait);
    };
}

async function main() {
    const args = process.argv.slice(2);
    const watch = args.includes('--watch') || args.includes('-w');

    await updateMetadata();

    if (watch) {
        console.log('Watching Images/ for changes...');
        const deb = debounce(async () => {
            try { await updateMetadata(); } catch(e) { console.error(e); }
        }, 600);

        fs.watch(IMAGES_DIR, { recursive: true }, (ev, fname) => {
            if (!fname) return; deb();
        });
    }
}

if (require.main === module) main().catch(err => { console.error(err); process.exit(1); });
