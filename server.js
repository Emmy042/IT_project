// server.js
import 'dotenv/config';           // Load .env variables
import express from 'express';
import mysql from 'mysql2';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

// Needed to emulate __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer setup for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, 'uploads/'),
  filename: (req, file, cb) => cb(null, Date.now() + '-' + file.originalname)
});
const upload = multer({ storage });

// MySQL connection
const db = mysql.createConnection({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

db.connect(err => {
  if (err) throw err;
  console.log('MySQL connected!');
});

// API routes
app.get('/images', (req, res) => {
  db.query('SELECT * FROM images ORDER BY id DESC', (err, results) => {
    if (err) return res.status(500).json({ error: 'Database query failed' });
    const formatted = results.map(r => ({
      id: r.id,
      prompt: r.prompt,
      url: `http://localhost:5000/uploads/${r.filename}`
    }));
    res.json(formatted);
  });
});

app.post('/images', upload.single('image'), (req, res) => {
  const { prompt } = req.body;
  const filename = req.file.filename;

  db.query(
    'INSERT INTO images (prompt, filename) VALUES (?, ?)',
    [prompt, filename],
    (err, result) => {
      if (err) return res.status(500).json({ error: 'Database insert failed' });
      const savedImage = {
        id: result.insertId,
        prompt,
        url: `http://localhost:5000/uploads/${filename}`
      };
      res.json(savedImage);
    }
  );
});

// Start server
app.listen(5000, () => console.log('Server running on http://localhost:5000'));
