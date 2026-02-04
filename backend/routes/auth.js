import express from 'express';
import pool from '../config/database.js';
import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

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
      'SELECT id, email, password, nickname, neighborhood, temperature FROM members WHERE email = ?',
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
      'SELECT id, email, nickname, neighborhood, temperature FROM members WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    res.status(200).json({
      success: true,
      data: users[0]
    });
  } catch (error) {
    console.error('사용자 정보 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '사용자 정보 조회 중 오류가 발생했습니다'
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
