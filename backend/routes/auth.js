import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const router = express.Router();

const uploadsDir = path.join(__dirname, '../uploads');
const profileStorage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1e9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const profileFileFilter = (req, file, cb) => {
  const allowedExt = /\.(jpeg|jpg|png|gif|webp)$/i;
  const ok = allowedExt.test(file.originalname) && (file.mimetype || '').startsWith('image/');
  cb(null, ok);
};
const uploadProfileImage = multer({
  storage: profileStorage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: profileFileFilter
});

// 이메일 중복 확인
router.post('/check-email', async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: '이메일을 입력해주세요'
      });
    }

    const [existingUsers] = await pool.execute(
      'SELECT id FROM members WHERE email = ?',
      [email]
    );

    if (existingUsers.length > 0) {
      return res.status(200).json({
        success: false,
        isDuplicate: true,
        message: '중복된 이메일입니다'
      });
    }

    return res.status(200).json({
      success: true,
      isDuplicate: false,
      message: '사용 가능한 이메일입니다'
    });
  } catch (error) {
    console.error('이메일 중복 확인 오류:', error);
    res.status(500).json({
      success: false,
      message: '이메일 중복 확인 중 오류가 발생했습니다'
    });
  }
});

// 회원가입
router.post('/signup', async (req, res) => {
  try {
    const { email, password, nickname } = req.body;

    // 비밀번호 해싱 (프론트엔드에서 이미 이메일 중복 확인 완료)
    const hashedPassword = await bcrypt.hash(password, 10);

    // 회원가입 처리
    const [result] = await pool.execute(
      'INSERT INTO members (email, password, nickname, neighborhood, temperature) VALUES (?, ?, ?, NULL, 36.5)',
      [email.trim(), hashedPassword, nickname.trim()]
    );

    res.status(201).json({
      success: true,
      message: '회원가입이 완료되었습니다',
      data: {
        id: result.insertId,
        email: email.trim(),
        nickname: nickname.trim()
      }
    });
  } catch (error) {
    console.error('회원가입 오류:', error);
    res.status(500).json({
      success: false,
      message: '회원가입 중 오류가 발생했습니다'
    });
  }
});

// 로그인
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    // 입력값 검증
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: '이메일과 비밀번호를 입력해주세요'
      });
    }

    // 이메일로 사용자 찾기
    const [users] = await pool.execute(
      'SELECT id, email, password, nickname, neighborhood, temperature, profile_image FROM members WHERE email = ?',
      [email.trim()]
    );

    if (users.length === 0) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 잘못 되었습니다. 이메일과 비밀번호를 정확히 입력해 주세요.'
      });
    }

    const user = users[0];

    // 비밀번호 확인
    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: '이메일 또는 비밀번호가 잘못 되었습니다. 이메일과 비밀번호를 정확히 입력해 주세요.'
      });
    }

    // JWT 토큰 생성
    const token = jwt.sign(
      { 
        userId: user.id,
        email: user.email
      },
      process.env.JWT_SECRET || 'your-secret-key-change-in-production',
      { expiresIn: '24h' }
    );

    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    const profileImageUrl = user.profile_image ? `${baseUrl}${user.profile_image}` : null;

    // 로그인 성공
    res.status(200).json({
      success: true,
      message: '로그인 성공',
      data: {
        id: user.id,
        email: user.email,
        nickname: user.nickname,
        neighborhood: user.neighborhood,
        temperature: user.temperature,
        profile_image: profileImageUrl,
        token: token
      }
    });
  } catch (error) {
    console.error('로그인 오류:', error);
    res.status(500).json({
      success: false,
      message: '로그인 중 오류가 발생했습니다'
    });
  }
});

// 현재 로그인한 사용자 정보 가져오기
router.get('/me', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const [users] = await pool.execute(
      'SELECT id, email, nickname, neighborhood, temperature, profile_image FROM members WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    const data = {
      ...users[0],
      profile_image: users[0].profile_image ? `${baseUrl}${users[0].profile_image}` : null
    };

    res.status(200).json({
      success: true,
      data
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// 프로필 사진 변경 (업로드)
router.put('/profile-image', authenticateToken, uploadProfileImage.single('profile_image'), async (req, res) => {
  try {
    const userId = req.user.userId;
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: '이미지 파일을 선택해주세요.'
      });
    }
    const profilePath = '/uploads/' + req.file.filename;
    await pool.execute('UPDATE members SET profile_image = ? WHERE id = ?', [profilePath, userId]);

    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    const profile_image = `${baseUrl}${profilePath}`;

    res.status(200).json({
      success: true,
      message: '프로필 사진이 변경되었습니다.',
      data: { profile_image }
    });
  } catch (error) {
    console.error('프로필 사진 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '프로필 사진 변경 중 오류가 발생했습니다.'
    });
  }
});

// 닉네임 수정
router.put('/nickname', authenticateToken, async (req, res) => {
  try {
    const { nickname } = req.body;
    const userId = req.user.userId;

    const trimmed = typeof nickname === 'string' ? nickname.trim() : '';
    if (!trimmed) {
      return res.status(400).json({
        success: false,
        message: '닉네임을 입력해주세요.'
      });
    }

    await pool.execute('UPDATE members SET nickname = ? WHERE id = ?', [trimmed, userId]);

    res.status(200).json({
      success: true,
      message: '닉네임이 변경되었습니다.',
      data: { nickname: trimmed }
    });
  } catch (error) {
    console.error('닉네임 수정 오류:', error);
    res.status(500).json({
      success: false,
      message: '닉네임 수정 중 오류가 발생했습니다.'
    });
  }
});

// 동네 설정 업데이트
router.put('/neighborhood', authenticateToken, async (req, res) => {
  try {
    const { neighborhood } = req.body;
    const userId = req.user.userId;

    if (!neighborhood) {
      return res.status(400).json({
        success: false,
        message: '동네를 선택해주세요'
      });
    }

    // 동네 업데이트 (NULL이었으면 새로 저장, 이미 값이 있었으면 업데이트)
    await pool.execute(
      'UPDATE members SET neighborhood = ? WHERE id = ?',
      [neighborhood.trim(), userId]
    );

    res.status(200).json({
      success: true,
      message: '동네가 설정되었습니다',
      data: {
        neighborhood: neighborhood.trim()
      }
    });
  } catch (error) {
    console.error('동네 설정 오류:', error);
    res.status(500).json({
      success: false,
      message: '동네 설정 중 오류가 발생했습니다'
    });
  }
});

export default router;
