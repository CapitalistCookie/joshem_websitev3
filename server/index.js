import express from 'express';
import cors from 'cors';
import bodyParser from 'body-parser';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.join(__dirname, '..');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_DIR = path.join(ROOT_DIR, 'data');
const DB_FILE = path.join(DATA_DIR, 'db.json');

app.use(cors());
app.use(bodyParser.json({ limit: '100mb' }));
app.use(bodyParser.urlencoded({ limit: '100mb', extended: true }));

const INITIAL_DATA = {
  auth: { password: 'admin123' },
  menu: [],
  orders: [],
  content: {
    hero: { images: [] },
    about: { storyTitle: "", storyText: "", storyImage: "" },
    contact: { address: "", phone: "", email: "" },
    socials: { facebook: "", instagram: "", twitter: "" }
  },
  testimonials: []
};

if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });

const writeDb = (data) => {
    try { fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2)); }
    catch (err) { console.error("DB write error:", err); }
};

const readDb = () => {
    try {
        if (!fs.existsSync(DB_FILE)) { writeDb(INITIAL_DATA); return INITIAL_DATA; }
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) { return INITIAL_DATA; }
};

app.get('/api/data', (req, res) => {
    const { auth, ...publicData } = readDb();
    res.json(publicData);
});

app.post('/api/menu', (req, res) => {
    const db = readDb(); db.menu = req.body; writeDb(db);
    res.json({ success: true });
});

app.post('/api/content', (req, res) => {
    const db = readDb(); db.content = req.body; writeDb(db);
    res.json({ success: true });
});

app.post('/api/testimonials', (req, res) => {
    const db = readDb(); db.testimonials = req.body; writeDb(db);
    res.json({ success: true });
});

app.post('/api/orders', (req, res) => {
    const db = readDb(); db.orders = req.body; writeDb(db);
    res.json({ success: true });
});

app.post('/api/auth/verify', (req, res) => {
    const db = readDb();
    const currentPassword = db.auth?.password || 'admin123';
    if (req.body.password === currentPassword) res.json({ success: true });
    else res.status(401).json({ success: false });
});

app.post('/api/auth/update', (req, res) => {
    const db = readDb(); if (!db.auth) db.auth = {};
    db.auth.password = req.body.password; writeDb(db);
    res.json({ success: true });
});

const distPath = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) res.sendFile(path.join(distPath, 'index.html'));
    });
}

app.listen(PORT, () => console.log(`JoShem Server active on port ${PORT}`));