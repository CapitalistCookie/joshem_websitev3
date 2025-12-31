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
  auth: {
    password: 'admin123'
  },
  menu: [
    {
      id: '1',
      name: 'Chicken Adobo',
      description: 'The national dish. Chicken marinated in vinegar, soy sauce, garlic, and peppercorns, braised to savory perfection.',
      prices: { small: 10.99, large: 15.99 },
      category: 'Main',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=800',
      visible: true,
      isDailySpecial: true
    }
  ],
  content: {
    hero: {
      images: [
        { id: 'h1', url: "https://images.unsplash.com/photo-1518509562904-e7ef99cdcc86?auto=format&fit=crop&q=80&w=1920", visible: true },
        { id: 'h2', url: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?auto=format&fit=crop&q=80&w=1920", visible: true },
        { id: 'h3', url: "https://images.unsplash.com/photo-1534944923498-84e45eb3dbf4?auto=format&fit=crop&q=80&w=1920", visible: true }
      ]
    },
    about: {
      title: "Our Heritage",
      subtitle: "Authentic Filipino flavors served with a smile.",
      storyTitle: "From Our Kitchen to Yours",
      storyText: "JoShem Foods brings the comforting, home-style flavors of the Philippines to your table. Everything we make is cooked with puso(heart)using time-honored recipes, quality ingredients, and the kind of care you can taste in every bite. Whether you are feeding a small gathering or a full celebration, we are here to serve Filipino food that feels warm, familiar, and unforgettable.",
      storyImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800"
    },
    contact: {
      address: "123 Manila Avenue, Food District, CA 90000",
      phone: "(555) 123-4567",
      email: "orders@joshemfoods.com",
      hours: {
        monFri: "10:00 AM - 9:00 PM",
        sat: "11:00 AM - 10:00 PM",
        sun: "Closed"
      }
    },
    socials: {
      facebook: "https://facebook.com/joshemfoods",
      instagram: "https://instagram.com/joshemfoods",
      twitter: "https://twitter.com/joshemfoods"
    }
  },
  testimonials: [
      { id: 1, name: "Maria Santos", rating: 5, text: "Absolutely the best Filipino food I've had outside of Manila. The Adobo tastes just like home!" }
  ]
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
}

const writeDb = (data) => {
    try {
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Critical DB write error:", err);
    }
};

const readDb = () => {
    try {
        if (!fs.existsSync(DB_FILE)) {
            writeDb(INITIAL_DATA);
            return INITIAL_DATA;
        }
        return JSON.parse(fs.readFileSync(DB_FILE, 'utf8'));
    } catch (err) {
        console.error("DB read error:", err);
        return INITIAL_DATA;
    }
};

// --- ROUTES ---

app.get('/api/data', (req, res) => {
    const data = readDb();
    // Security: Exclude auth object from public data
    const { auth, ...publicData } = data;
    res.json(publicData);
});

app.post('/api/menu', (req, res) => {
    const db = readDb();
    db.menu = req.body;
    writeDb(db);
    res.json({ success: true });
});

app.post('/api/content', (req, res) => {
    const db = readDb();
    db.content = req.body;
    writeDb(db);
    res.json({ success: true });
});

app.post('/api/testimonials', (req, res) => {
    const db = readDb();
    db.testimonials = req.body;
    writeDb(db);
    res.json({ success: true });
});

// --- AUTH ROUTES ---

app.post('/api/auth/verify', (req, res) => {
    const db = readDb();
    // Default to 'admin123' if auth object is missing
    const currentPassword = db.auth ? db.auth.password : 'admin123';
    
    if (req.body.password === currentPassword) {
        res.json({ success: true });
    } else {
        res.status(401).json({ success: false, message: 'Invalid credentials' });
    }
});

app.post('/api/auth/update', (req, res) => {
    const db = readDb();
    if (!db.auth) db.auth = {};
    db.auth.password = req.body.password;
    writeDb(db);
    res.json({ success: true });
});

// Static files for production
const distPath = path.join(ROOT_DIR, 'dist');
if (fs.existsSync(distPath)) {
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
        if (!req.path.startsWith('/api')) {
            res.sendFile(path.join(distPath, 'index.html'));
        }
    });
}

app.listen(PORT, () => {
  console.log(`JoShem Backend Server active on port ${PORT}`);
});