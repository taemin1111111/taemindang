import jwt from 'jsonwebtoken';

// JWT 토큰 검증 미들웨어
export const authenticateToken = (req, res, next) => {
  // Authorization 헤더에서 토큰 추출
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN 형식

  if (!token) {
    return res.status(401).json({
      success: false,
      message: '인증 토큰이 필요합니다'
    });
  }

  try {
    // 토큰 검증
    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET || 'your-secret-key-change-in-production'
    );

    // 검증된 사용자 정보를 req에 추가
    req.user = decoded;
    next();
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: '토큰이 만료되었습니다'
      });
    }
    
    return res.status(403).json({
      success: false,
      message: '유효하지 않은 토큰입니다'
    });
  }
};
