import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';
import jwt from 'jsonwebtoken';

const router = express.Router();

// 목록 조회 GET / 캐시 (60초 TTL, 상품 등록 시 무효화)
const LIST_CACHE_TTL_MS = 60 * 1000;
const listCache = new Map();
function listCacheKey(q) {
  return `${q.category ?? '__all__'}|${(q.search || '').trim()}`;
}
function getListCache(key) {
  const ent = listCache.get(key);
  if (!ent || Date.now() - ent.at > LIST_CACHE_TTL_MS) return null;
  return ent.data;
}
function setListCache(key, data) {
  listCache.set(key, { data, at: Date.now() });
}
function invalidateListCache() {
  listCache.clear();
}

// __dirname 설정 (ES 모듈)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 업로드 폴더 경로
const uploadsDir = path.join(__dirname, '../uploads');

// multer 설정
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    // 파일명: timestamp_originalname
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// 파일 필터 (이미지만 허용)
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    cb(new Error('이미지 파일만 업로드 가능합니다 (jpeg, jpg, png, gif, webp)'));
  }
};

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 제한
  },
  fileFilter: fileFilter
});

// 상품 등록 (이미지 포함)
router.post('/', authenticateToken, upload.array('images', 5), async (req, res) => {
  try {
    const userId = req.user.userId;
    const { title, description, price, category, neighborhood } = req.body;
    const files = req.files;

    // 입력값 검증
    if (!title || !description || !price || !category || !neighborhood) {
      return res.status(400).json({
        success: false,
        message: '모든 필드를 입력해주세요'
      });
    }

    if (!files || files.length === 0) {
      return res.status(400).json({
        success: false,
        message: '최소 1개 이상의 이미지를 업로드해주세요'
      });
    }

    // 사용자 동네 정보 확인 (필요시)
    const [users] = await pool.execute(
      'SELECT neighborhood FROM members WHERE id = ?',
      [userId]
    );

    if (users.length === 0) {
      return res.status(404).json({
        success: false,
        message: '사용자를 찾을 수 없습니다'
      });
    }

    // items 테이블에 상품 정보 저장
    const [itemResult] = await pool.execute(
      `INSERT INTO items (seller_id, title, description, price, category, neighborhood, status) 
       VALUES (?, ?, ?, ?, ?, ?, 'SELLING')`,
      [userId, title.trim(), description.trim(), parseInt(price, 10), category.trim(), neighborhood.trim()]
    );

    const itemId = itemResult.insertId;

    // item_images 테이블에 이미지 정보 저장
    // 첫 번째 이미지는 is_thumbnail = 1, 나머지는 0
    const imagePromises = files.map((file, index) => {
      const imageUrl = `/uploads/${file.filename}`;
      const isThumbnail = index === 0 ? 1 : 0;
      
      return pool.execute(
        'INSERT INTO item_images (item_id, image_url, is_thumbnail) VALUES (?, ?, ?)',
        [itemId, imageUrl, isThumbnail]
      );
    });

    await Promise.all(imagePromises);

    invalidateListCache();
    res.status(201).json({
      success: true,
      message: '상품이 등록되었습니다',
      data: {
        itemId: itemId,
        imagesCount: files.length
      }
    });
  } catch (error) {
    console.error('상품 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 등록 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 상품 리스트 조회 (찜 갯수 포함, 대표사진만, 60초 캐시)
router.get('/', async (req, res) => {
  try {
    const { category, search } = req.query;
    const cacheKey = listCacheKey({ category, search });
    const cached = getListCache(cacheKey);
    if (cached) {
      return res.json({ success: true, data: cached });
    }

    // 기본 쿼리
    let query = `
      SELECT 
        i.id,
        i.seller_id,
        i.title,
        i.description,
        i.price,
        i.category,
        i.neighborhood,
        i.status,
        i.created_at,
        img.image_url,
        (SELECT COUNT(*) FROM item_likes l WHERE l.item_id = i.id) AS like_count,
        (SELECT COUNT(*) FROM chats c WHERE c.item_id = i.id) AS chat_count
      FROM items i
      LEFT JOIN item_images img
        ON img.item_id = i.id AND img.is_thumbnail = 1
      WHERE i.status = 'SELLING'
    `;
    
    const params = [];
    
    // 검색어 필터링
    if (search && search.trim()) {
      query += ' AND i.title LIKE ?';
      params.push(`%${search.trim()}%`);
    }
    
    // 카테고리 필터링
    if (category && category !== '전체') {
      query += ' AND i.category = ?';
      params.push(category);
    }
    
    query += ' ORDER BY i.created_at DESC';
    
    const [items] = await pool.execute(query, params);

    // 이미지 URL을 절대 경로로 변환
    const itemsWithFullImageUrl = items.map(item => ({
      ...item,
      image_url: item.image_url ? `http://localhost:5000${item.image_url}` : null,
      like_count: parseInt(item.like_count) || 0,
      chat_count: parseInt(item.chat_count) || 0,
      price: parseInt(item.price),
      comment_count: 0 // item_comments 테이블이 없으므로 기본값 0
    }));

    setListCache(cacheKey, itemsWithFullImageUrl);
    res.json({
      success: true,
      data: itemsWithFullImageUrl
    });
  } catch (error) {
    console.error('상품 리스트 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 리스트 조회 중 오류가 발생했습니다',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// 내 판매 목록 조회 (로그인 사용자 본인 상품만, status: SELLING | SOLD)
router.get('/my', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const status = (req.query.status || 'SELLING').toUpperCase();
    const validStatus = ['SELLING', 'SOLD'].includes(status) ? status : 'SELLING';

    const query = `
      SELECT 
        i.id,
        i.seller_id,
        i.title,
        i.description,
        i.price,
        i.category,
        i.neighborhood,
        i.status,
        i.created_at,
        img.image_url,
        (SELECT COUNT(*) FROM item_likes l WHERE l.item_id = i.id) AS like_count,
        (SELECT COUNT(*) FROM chats c WHERE c.item_id = i.id) AS chat_count
      FROM items i
      LEFT JOIN item_images img ON img.item_id = i.id AND img.is_thumbnail = 1
      WHERE i.seller_id = ? AND i.status = ?
      ORDER BY i.created_at DESC
    `;
    const [items] = await pool.execute(query, [userId, validStatus]);

    const itemsWithFullImageUrl = items.map(item => ({
      ...item,
      image_url: item.image_url ? `http://localhost:5000${item.image_url}` : null,
      like_count: parseInt(item.like_count) || 0,
      chat_count: parseInt(item.chat_count) || 0,
      price: parseInt(item.price)
    }));

    res.json({
      success: true,
      data: itemsWithFullImageUrl
    });
  } catch (error) {
    console.error('내 판매 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '내 판매 목록 조회 중 오류가 발생했습니다',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// 내 구매 목록 조회 (로그인 사용자가 구매한 상품만, status SOLD)
router.get('/purchased', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        i.id,
        i.seller_id,
        i.title,
        i.description,
        i.price,
        i.category,
        i.neighborhood,
        i.status,
        i.created_at,
        img.image_url,
        (SELECT COUNT(*) FROM item_likes l WHERE l.item_id = i.id) AS like_count,
        (SELECT COUNT(*) FROM chats c WHERE c.item_id = i.id) AS chat_count
      FROM items i
      LEFT JOIN item_images img ON img.item_id = i.id AND img.is_thumbnail = 1
      WHERE i.buyer_id = ? AND i.status = 'SOLD'
      ORDER BY i.created_at DESC
    `;
    const [items] = await pool.execute(query, [userId]);

    const itemsWithFullImageUrl = items.map(item => ({
      ...item,
      image_url: item.image_url ? `http://localhost:5000${item.image_url}` : null,
      like_count: parseInt(item.like_count) || 0,
      chat_count: parseInt(item.chat_count) || 0,
      price: parseInt(item.price)
    }));

    res.json({
      success: true,
      data: itemsWithFullImageUrl
    });
  } catch (error) {
    console.error('내 구매 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '내 구매 목록 조회 중 오류가 발생했습니다',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// 관심목록 조회 (로그인 사용자가 찜한 상품)
router.get('/liked', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    const query = `
      SELECT 
        i.id,
        i.seller_id,
        i.title,
        i.description,
        i.price,
        i.category,
        i.neighborhood,
        i.status,
        i.created_at,
        img.image_url,
        (SELECT COUNT(*) FROM item_likes l WHERE l.item_id = i.id) AS like_count,
        (SELECT COUNT(*) FROM chats c WHERE c.item_id = i.id) AS chat_count
      FROM items i
      INNER JOIN item_likes il ON il.item_id = i.id AND il.user_id = ?
      LEFT JOIN item_images img ON img.item_id = i.id AND img.is_thumbnail = 1
      ORDER BY i.created_at DESC
    `;
    const [items] = await pool.execute(query, [userId]);

    const itemsWithFullImageUrl = items.map(item => ({
      ...item,
      image_url: item.image_url ? `http://localhost:5000${item.image_url}` : null,
      like_count: parseInt(item.like_count) || 0,
      chat_count: parseInt(item.chat_count) || 0,
      price: parseInt(item.price)
    }));

    res.json({
      success: true,
      data: itemsWithFullImageUrl
    });
  } catch (error) {
    console.error('관심목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '관심목록 조회 중 오류가 발생했습니다',
      ...(process.env.NODE_ENV !== 'production' && { error: error.message })
    });
  }
});

// 상품 상세 조회 (모든 이미지 포함, 판매자 정보 포함)
router.get('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    
    // 토큰이 있으면 사용자 ID 추출 (선택적 인증)
    let userId = null;
    try {
      const authHeader = req.headers['authorization'];
      const token = authHeader && authHeader.split(' ')[1];
      if (token) {
        const decoded = jwt.verify(
          token,
          process.env.JWT_SECRET || 'your-secret-key-change-in-production'
        );
        userId = decoded.userId;
      }
    } catch (error) {
      // 토큰이 없거나 유효하지 않으면 userId는 null로 유지
      userId = null;
    }
    
    // 상품 기본 정보 + 판매자 정보 조회
    const [items] = await pool.execute(
      `SELECT 
        i.id,
        i.seller_id,
        i.title,
        i.description,
        i.price,
        i.category,
        i.neighborhood,
        i.status,
        i.created_at,
        (SELECT COUNT(*) FROM item_likes l WHERE l.item_id = i.id) AS like_count,
        m.nickname AS seller_nickname,
        m.neighborhood AS seller_neighborhood,
        m.temperature AS seller_temperature,
        m.profile_image AS seller_profile_image
      FROM items i
      LEFT JOIN members m ON i.seller_id = m.id
      WHERE i.id = ?`,
      [id]
    );
    
    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }
    
    const item = items[0];
    
    // 로그인한 사용자가 이 상품을 찜했는지 확인
    let isLiked = false;
    if (userId) {
      const [likes] = await pool.execute(
        'SELECT id FROM item_likes WHERE item_id = ? AND user_id = ?',
        [id, userId]
      );
      isLiked = likes.length > 0;
    }
    
    // 해당 상품의 채팅 개수 조회
    const [chatCountResult] = await pool.execute(
      'SELECT COUNT(*) AS chat_count FROM chats WHERE item_id = ?',
      [id]
    );
    const chatCount = parseInt(chatCountResult[0].chat_count) || 0;
    
    // 상품의 모든 이미지 조회
    const [images] = await pool.execute(
      `SELECT id, image_url, is_thumbnail 
       FROM item_images 
       WHERE item_id = ? 
       ORDER BY is_thumbnail DESC, id ASC`,
      [id]
    );
    
    // 판매자의 다른 상품 조회 (최대 2개)
    const [otherItems] = await pool.execute(
      `SELECT 
        i.id,
        i.title,
        i.price,
        img.image_url
      FROM items i
      LEFT JOIN item_images img ON img.item_id = i.id AND img.is_thumbnail = 1
      WHERE i.seller_id = ? AND i.id != ? AND i.status = 'SELLING'
      ORDER BY i.created_at DESC
      LIMIT 2`,
      [item.seller_id, id]
    );
    
    // 이미지 URL을 절대 경로로 변환
    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    const itemWithData = {
      ...item,
      price: parseInt(item.price),
      like_count: parseInt(item.like_count) || 0,
      is_liked: isLiked, // 찜 여부 추가
      chat_count: chatCount, // 채팅 개수 추가
      seller_temperature:
        item.seller_temperature !== null && item.seller_temperature !== undefined
          ? parseFloat(item.seller_temperature)
          : 36.5,
      seller_profile_image: item.seller_profile_image ? `${baseUrl}${item.seller_profile_image}` : null,
      images: images.map(img => ({
        id: img.id,
        image_url: `http://localhost:5000${img.image_url}`,
        is_thumbnail: img.is_thumbnail === 1
      })),
      other_items: otherItems.map(other => ({
        id: other.id,
        title: other.title,
        price: parseInt(other.price),
        image_url: other.image_url ? `http://localhost:5000${other.image_url}` : null
      }))
    };
    
    res.json({
      success: true,
      data: itemWithData
    });
  } catch (error) {
    console.error('상품 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '상품 상세 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 찜 추가/삭제 (토글)
router.post('/:id/like', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;

    // 이미 찜했는지 확인
    const [existingLikes] = await pool.execute(
      'SELECT id FROM item_likes WHERE item_id = ? AND user_id = ?',
      [id, userId]
    );

    if (existingLikes.length > 0) {
      // 이미 찜했으면 삭제
      await pool.execute(
        'DELETE FROM item_likes WHERE item_id = ? AND user_id = ?',
        [id, userId]
      );

      // 업데이트된 찜 개수 조회
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) AS count FROM item_likes WHERE item_id = ?',
        [id]
      );

      res.json({
        success: true,
        message: '찜이 해제되었습니다',
        data: {
          is_liked: false,
          like_count: parseInt(countResult[0].count)
        }
      });
    } else {
      // 찜하지 않았으면 추가
      await pool.execute(
        'INSERT INTO item_likes (item_id, user_id) VALUES (?, ?)',
        [id, userId]
      );

      // 업데이트된 찜 개수 조회
      const [countResult] = await pool.execute(
        'SELECT COUNT(*) AS count FROM item_likes WHERE item_id = ?',
        [id]
      );

      res.json({
        success: true,
        message: '찜이 추가되었습니다',
        data: {
          is_liked: true,
          like_count: parseInt(countResult[0].count)
        }
      });
    }
  } catch (error) {
    console.error('찜 추가/삭제 오류:', error);
    res.status(500).json({
      success: false,
      message: '찜 추가/삭제 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

export default router;
