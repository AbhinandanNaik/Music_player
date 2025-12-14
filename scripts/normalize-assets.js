const fs = require('fs');
const path = require('path');

const LEGACY_DIR = path.join(__dirname, '../legacy/Music');
const ASSETS_DIR = path.join(__dirname, '../src/assets');
const MUSIC_OUT_DIR = path.join(ASSETS_DIR, 'music');

if (!fs.existsSync(MUSIC_OUT_DIR)) {
    fs.mkdirSync(MUSIC_OUT_DIR, { recursive: true });
}

function slugify(text) {
    return text.toString().toLowerCase()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start
        .replace(/-+$/, '');            // Trim - from end
}

function normalize() {
    const folders = fs.readdirSync(LEGACY_DIR);
    const playlist = [];
    let id = 1;

    folders.forEach(folder => {
        const folderPath = path.join(LEGACY_DIR, folder);
        if (fs.statSync(folderPath).isDirectory()) {
            const files = fs.readdirSync(folderPath);
            const songFile = files.find(f => f.endsWith('.mp3'));
            const imageFile = files.find(f => f.endsWith('.jpg') || f.endsWith('.jpeg') || f.endsWith('.png'));

            if (songFile) {
                const slug = slugify(folder);
                // Copy Song
                const newSongName = `${slug}.mp3`;
                fs.copyFileSync(path.join(folderPath, songFile), path.join(MUSIC_OUT_DIR, newSongName));

                // Copy Image
                let newImageName = null;
                if (imageFile) {
                    const ext = path.extname(imageFile);
                    newImageName = `${slug}${ext}`;
                    fs.copyFileSync(path.join(folderPath, imageFile), path.join(MUSIC_OUT_DIR, newImageName));
                }

                playlist.push({
                    id: id++,
                    title: folder, // Use folder name as title for now
                    url: `/assets/music/${newSongName}`,
                    cover: newImageName ? `/assets/music/${newImageName}` : null
                });

                console.log(`Processed: ${folder}`);
            }
        }
    });

    fs.writeFileSync(path.join(ASSETS_DIR, 'playlist.json'), JSON.stringify(playlist, null, 2));
    console.log('Playlist generated at src/assets/playlist.json');
}

normalize();
