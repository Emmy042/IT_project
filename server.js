// server.js
import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import pkg from 'pg';
import { v2 as cloudinary } from 'cloudinary';
import streamifier from 'streamifier';

const { Pool } = pkg;
const app = express();

app.use(cors());
app.use(express.json());

//  PostgreSQL Configuration

const pool = new Pool({
  connectionString: process.env.DATABASE_URL, // From Render
  ssl: { rejectUnauthorized: false }
});


cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Multer memory storage
const upload = multer({ storage: multer.memoryStorage() });


// API Routes


// GET all images
app.get('/images', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM images ORDER BY id DESC');
    res.json(result.rows);
  } catch (err) {
    console.error('❌ Error fetching images:', err);
    res.status(500).json({ error: 'Database fetch failed' });
  }
});

// POST new image (upload to Cloudinary + save metadata in PostgreSQL)
app.post('/images', upload.single('image'), async (req, res) => {
  try {
    const { prompt } = req.body;
    const file = req.file;

    if (!file) return res.status(400).json({ error: 'No file uploaded' });

    // Upload to Cloudinary using stream
    const cloudUpload = await new Promise((resolve, reject) => {
      const stream = cloudinary.uploader.upload_stream(
        { folder: 'generated_images' },
        (error, result) => {
          if (result) resolve(result);
          else reject(error);
        }
      );
      streamifier.createReadStream(file.buffer).pipe(stream);
    });

    const imageUrl = cloudUpload.secure_url;

    // Save to PostgreSQL
    const result = await pool.query(
      'INSERT INTO images (prompt, url) VALUES ($1, $2) RETURNING *',
      [prompt, imageUrl]
    );

    res.json(result.rows[0]);
  } catch (err) {
    console.error('❌ Error uploading image:', err);
    res.status(500).json({ error: 'Upload or DB insert failed' });
  }
});


// Start Server

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => console.log(`✅ Server running on port ${PORT}`));
