const express = require('express');
const multer = require('multer');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

// Yüklenen dosyaların ve metadata'nın saklanacağı klasörler
const UPLOAD_DIR = path.join(__dirname, 'uploads');
const DATA_FILE = path.join(__dirname, 'books.json');

if (!fs.existsSync(UPLOAD_DIR)) {
    fs.mkdirSync(UPLOAD_DIR);
}

if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, JSON.stringify([]));
}

// Multer ile dosya yükleme ayarları (.epub ve .zip)
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, UPLOAD_DIR);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});
const upload = multer({ storage: storage });

// Tüm kitapları getir (Ortak Liste)
app.get('/api/books', (req, res) => {
    fs.readFile(DATA_FILE, 'utf8', (err, data) => {
        if (err) return res.status(500).json({ error: 'Kitaplar okunamadı.' });
        res.json(JSON.parse(data));
    });
});

// Yeni kitap yükle
app.post('/api/books', upload.single('epubFile'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ error: 'Dosya yüklenmedi.' });
    }

    const books = JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    const newBook = {
        id: 'book-' + Date.now(),
        title: req.body.title || req.file.originalname.replace(/\.[^/.]+$/, ""),
        author: req.body.author || "Ortak Arşiv",
        filename: req.file.filename,
        size: req.file.size
    };

    books.push(newBook);
    fs.writeFileSync(DATA_FILE, JSON.stringify(books, null, 2));
    res.json(newBook);
});

// Kitap dosyasını sunucudan indir/görüntüle
app.use('/uploads', express.static(UPLOAD_DIR));

// Frontend dosyalarını sunmak için (index.html ana dizinde olmalı)
app.use(express.static(path.join(__dirname, 'public')));

app.listen(PORT, () => {
    console.log(`Sunucu çalışıyor: http://localhost:${PORT}`);
});