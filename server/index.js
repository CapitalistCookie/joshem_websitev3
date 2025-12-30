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
  menu: [
    {
      id: '1',
      name: 'Chicken Adobo',
      description: 'The national dish. Chicken marinated in vinegar, soy sauce, garlic, and peppercorns, braised to savory perfection.',
      price: 13.99,
      category: 'Main',
      image: 'https://images.unsplash.com/photo-1582878826629-29b7ad1cdc43?auto=format&fit=crop&q=80&w=800'
    }
  ],
  content: {
    about: {
      title: "Our Heritage",
      storyTitle: "From Our Kitchen to Yours",
      storyText: "JoShem Foods brings the authentic flavors of the Philippines to your plate. Our philosophy is simple: cook with 'Puso' (Heart).",
      storyImage: "https://images.unsplash.com/photo-1504674900247-0877df9cc836?auto=format&fit=crop&q=80&w=800"
    },
    contact: {
      address: "123 Manila Avenue, Food District, CA 90000",
      phone: "(555) 123-4567",
      email: "orders@joshemfoods.com"
    }
  },
  testimonials: [
      { id: 1, name: "Maria Santos", rating: 5, text: "Absolutely the best Filipino food I've had outside of Manila." }
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
    res.json(readDb());
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
