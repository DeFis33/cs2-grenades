import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());

const VIDEOS_PATH = path.join(__dirname, 'public', 'videos');
const MARKERS_PATH = path.join(__dirname, 'public', 'markers.json');

// Создаём папку videos если нет
if (!fs.existsSync(VIDEOS_PATH)) {
  fs.mkdirSync(VIDEOS_PATH, { recursive: true });
}

// Настройка multer для загрузки видео
const storage = multer.diskStorage({
  destination: VIDEOS_PATH,
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + '_' + file.originalname.replace(/\s/g, '_');
    cb(null, uniqueName);
  }
});
const upload = multer({ storage, limits: { fileSize: 500 * 1024 * 1024 } });

// Загрузка видео
app.post('/api/upload-video', upload.single('video'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'Файл не получен' });
  }
  const filePath = '/videos/' + req.file.filename;
  res.json({ url: filePath });
});

// Сохранить метки
app.post('/api/save-markers', express.json({ limit: '10mb' }), (req, res) => {
  try {
    fs.writeFileSync(MARKERS_PATH, JSON.stringify(req.body, null, 2));
    res.json({ ok: true });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log('API сервер запущен на http://localhost:3001');
});