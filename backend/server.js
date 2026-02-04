import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import pool, { testConnection } from './config/database.js';
import authRoutes from './routes/auth.js';
import itemsRoutes from './routes/items.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// __dirname 설정 (ES 모듈)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 정적 파일 서빙 (업로드된 이미지)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Routes
app.get('/', (req, res) => {
  res.json({ message: 'Taemindang Backend API' });
});

app.get('/health', (req, res) => {
  res.json({ status: 'ok', message: 'Server is running' });
});

// Auth routes
app.use('/auth', authRoutes);

// Items routes
app.use('/items', itemsRoutes);

// Start server
app.listen(PORT, async () => {
  console.log(`Server is running on http://localhost:${PORT}`);
  // 데이터베이스 연결 테스트
  await testConnection();
});
