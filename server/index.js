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
      subtitle: "Authentic Filipino flavors served with a smile.",
      storyTitle: "From Our Kitchen to Yours",
      storyText: "JoShem Foods brings the authentic flavors of the Philippines to your plate. Our philosophy is simple: cook with 'Puso' (Heart).",
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
    }
  },
  testimonials: [
      { id: 1, name: "Maria Santos", rating: 5, text: "Absolutely the best Filipino food I've had outside of Manila. The Adobo tastes just like home!" },
      { id: 2, name: "Ricardo Batungbakal", rating: 5, text: "The Lumpia Shanghai is incredibly crispy! I ordered 50 pieces for my son's birthday and they were gone in minutes. Highly recommend JoShem for any party catering." },
      { id: 3, name: "Jocelyn Dimagiba", rating: 4, text: "The Kare-Kare sauce is thick and savory, just the way it should be. The bagoong on the side was the perfect compliment. A bit of a wait for delivery, but worth it." },
      { id: 4, name: "Renato de Guzman", rating: 5, text: "I've tried many Filipino restaurants in the city, but JoShem captures the 'Puso' of our cooking. Their Sinigang is sour enough to make you blink—exactly how I like it!" },
      { id: 5, name: "Maria Elena Soriano", rating: 5, text: "We hired JoShem for our company's cultural day. The presentation was beautiful and the Lechon Kawali was still crunchy when it arrived. Five stars for service!" },
      { id: 6, name: "Danilo Panganiban", rating: 4, text: "Great portions for the price. The Halo-halo has so many ingredients, it's a meal on its own. I wish they had more seating, but the food is top-notch." },
      { id: 7, name: "Teresita Mercado", rating: 5, text: "The Pancit Bihon brought back so many memories of fiestas in the province. It's not too greasy and packed with fresh vegetables. My kids loved it too." },
      { id: 8, name: "Francisco Balagtas", rating: 5, text: "A poetic harmony of flavors. The sweetness of the spaghetti and the saltiness of the fried chicken is a combination only JoShem can perfect. Truly authentic." },
      { id: 9, name: "Imelda Ramos", rating: 5, text: "Everything was pristine. The packaging for our catering order was very professional and leak-proof. The Arroz Caldo was a lifesaver when I was feeling under the weather." },
      { id: 10, name: "Benigno Silverio", rating: 4, text: "Solid food and very friendly staff. The Sisig has a nice kick to it. I'll definitely be coming back to try the desserts next time." },
      { id: 11, name: "Gloria Evangelista", rating: 5, text: "They never fail to impress. I've ordered their Bilao of noodles multiple times for office meetings and it's always a hit with my colleagues of all backgrounds." },
      { id: 12, name: "Rodrigo Morales", rating: 5, text: "The Bulalo soup is rich and full of marrow. It's hard to find authentic soup like this. The beef was tender enough to eat with a spoon." },
      { id: 13, name: "Emmanuel Santos", rating: 5, text: "A knockout performance by the kitchen team! The Bicol Express had just the right amount of spice without being overwhelming. Best dinner I've had all week." },
      { id: 14, name: "Pia Alonzo", rating: 5, text: "Confidently delicious! Every bite feels like a warm hug from your Lola. The Cassava Cake is the best in the city, hands down." },
      { id: 15, name: "Catriona Magnayon", rating: 5, text: "Lava-hot and fresh! The delivery was faster than expected and the food quality didn't suffer. Their Dinuguan is surprisingly clean and very tasty." },
      { id: 16, name: "Efren Cruz", rating: 4, text: "Very good service. They accommodated my last-minute change to the catering menu without any hassle. The Garlic Rice is so aromatic!" },
      { id: 17, name: "Lea Chiongbian", rating: 5, text: "World-class flavors right in our neighborhood. The Kaldereta is rich and the meat is premium. It's clear they don't cut corners with their ingredients." },
      { id: 18, name: "Arnel Garcia", rating: 5, text: "Hits all the right notes! The BBQ skewers have that perfect char and sweet glaze. Reminds me of the street food back in the Philippines." },
      { id: 19, name: "Bamboo Soliman", rating: 4, text: "Unique twist on some classics. The Ube cheesecake is a must-try. The atmosphere in the shop is very welcoming and homey." },
      { id: 20, name: "Regine Valera", rating: 5, text: "Song-worthy flavors! I could sing praises about their Leche Flan all day. It's silky smooth and not overly sweet. Perfect ending to a meal." },
      { id: 21, name: "Vilma Singson", rating: 5, text: "Always a classic choice for our family Sunday dinners. Their menu has something for everyone, from the picky eaters to the adventurous ones." }
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