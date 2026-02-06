import express from 'express';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

// 동네생활 글 작성
router.post('/posts', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const { topic, title, content } = req.body;

    // 입력값 검증
    if (!title || !title.trim()) {
      return res.status(400).json({
        success: false,
        message: '제목을 입력해주세요'
      });
    }

    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '본문을 입력해주세요'
      });
    }

    if (!topic || !topic.trim()) {
      return res.status(400).json({
        success: false,
        message: '주제를 선택해주세요'
      });
    }

    // 사용자 정보에서 neighborhood 가져오기
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

    const userNeighborhood = users[0].neighborhood;

    if (!userNeighborhood) {
      return res.status(400).json({
        success: false,
        message: '동네를 설정해주세요'
      });
    }

    // life_posts 테이블에 글 저장
    const [result] = await pool.execute(
      `INSERT INTO life_posts (user_id, neighborhood, category, title, content, view_count) 
       VALUES (?, ?, ?, ?, ?, 0)`,
      [userId, userNeighborhood, topic.trim(), title.trim(), content.trim()]
    );

    res.status(201).json({
      success: true,
      message: '글이 작성되었습니다',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('동네생활 글 작성 오류:', error);
    res.status(500).json({
      success: false,
      message: '글 작성 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 동네생활 글 목록 조회
router.get('/posts', async (req, res) => {
  try {
    const { filter, neighborhood, search } = req.query;

    let query = `
      SELECT 
        lp.id,
        lp.user_id,
        lp.neighborhood,
        lp.category,
        lp.title,
        lp.content,
        lp.view_count,
        lp.created_at,
        m.nickname AS user_nickname,
        COALESCE((SELECT COUNT(*) FROM life_comments lc WHERE lc.post_id = lp.id), 0) AS comment_count,
        (COALESCE((SELECT COUNT(*) FROM life_comments lc WHERE lc.post_id = lp.id), 0) + lp.view_count) AS popularity_score
      FROM life_posts lp
      LEFT JOIN members m ON lp.user_id = m.id
      WHERE 1=1
    `;
    
    const params = [];

    // 검색어 필터링
    if (search && search.trim()) {
      query += ' AND lp.title LIKE ?';
      params.push(`%${search.trim()}%`);
    }

    // 동네 필터링 (선택사항)
    if (neighborhood) {
      query += ' AND lp.neighborhood = ?';
      params.push(neighborhood);
    }

    // 필터별 처리
    if (!filter || filter === '추천') {
      // 추천: 전체 카테고리, 최신순
      query += ' ORDER BY lp.created_at DESC';
    } else if (filter === '인기') {
      // 인기: 댓글 수 + 조회수 합산, 내림차순
      query += ` ORDER BY popularity_score DESC, lp.created_at DESC`;
    } else {
      // 특정 카테고리: 해당 카테고리만, 최신순
      query += ' AND lp.category = ?';
      params.push(filter);
      query += ' ORDER BY lp.created_at DESC';
    }

    const [posts] = await pool.execute(query, params);

    // 데이터 포맷팅
    const formattedPosts = posts.map(post => ({
      id: post.id,
      topic: post.category,
      title: post.title,
      content: post.content,
      location: post.neighborhood,
      time: post.created_at,
      views: post.view_count,
      comments: post.comment_count || 0,
      user_nickname: post.user_nickname
    }));

    res.json({
      success: true,
      data: formattedPosts
    });
  } catch (error) {
    console.error('게시글 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '게시글 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 내가 작성한 동네생활 글 목록
router.get('/posts/my/written', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = `
      SELECT 
        lp.id,
        lp.user_id,
        lp.neighborhood,
        lp.category,
        lp.title,
        lp.content,
        lp.view_count,
        lp.created_at,
        m.nickname AS user_nickname,
        COALESCE((SELECT COUNT(*) FROM life_comments lc WHERE lc.post_id = lp.id), 0) AS comment_count
      FROM life_posts lp
      LEFT JOIN members m ON lp.user_id = m.id
      WHERE lp.user_id = ?
      ORDER BY lp.created_at DESC
    `;
    const [posts] = await pool.execute(query, [userId]);
    const formattedPosts = posts.map(post => ({
      id: post.id,
      topic: post.category,
      title: post.title,
      content: post.content,
      location: post.neighborhood,
      time: post.created_at,
      views: post.view_count,
      comments: post.comment_count || 0,
      user_nickname: post.user_nickname
    }));
    res.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error('내 작성 글 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 댓글단 글 목록 (내가 댓글 단 글)
router.get('/posts/my/commented', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;
    const query = `
      SELECT DISTINCT
        lp.id,
        lp.user_id,
        lp.neighborhood,
        lp.category,
        lp.title,
        lp.content,
        lp.view_count,
        lp.created_at,
        m.nickname AS user_nickname,
        COALESCE((SELECT COUNT(*) FROM life_comments lc WHERE lc.post_id = lp.id), 0) AS comment_count
      FROM life_posts lp
      LEFT JOIN members m ON lp.user_id = m.id
      INNER JOIN life_comments lc ON lc.post_id = lp.id AND lc.user_id = ?
      ORDER BY lp.created_at DESC
    `;
    const [posts] = await pool.execute(query, [userId]);
    const formattedPosts = posts.map(post => ({
      id: post.id,
      topic: post.category,
      title: post.title,
      content: post.content,
      location: post.neighborhood,
      time: post.created_at,
      views: post.view_count,
      comments: post.comment_count || 0,
      user_nickname: post.user_nickname
    }));
    res.json({ success: true, data: formattedPosts });
  } catch (error) {
    console.error('댓글단 글 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 동네생활 글 상세 조회
router.get('/posts/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 게시글 정보 조회 (작성자 정보 포함)
    const [posts] = await pool.execute(
      `SELECT 
        lp.id,
        lp.user_id,
        lp.neighborhood,
        lp.category,
        lp.title,
        lp.content,
        lp.view_count,
        lp.created_at,
        m.nickname AS user_nickname,
        m.profile_image AS user_profile_image
      FROM life_posts lp
      LEFT JOIN members m ON lp.user_id = m.id
      WHERE lp.id = ?`,
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다'
      });
    }

    const post = posts[0];

    // 조회수 증가
    await pool.execute(
      'UPDATE life_posts SET view_count = view_count + 1 WHERE id = ?',
      [id]
    );

    // 댓글 목록 조회 (작성자 정보 포함)
    let comments = [];
    let commentCount = 0;
    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    try {
      const [commentResult] = await pool.execute(
        `SELECT 
          lc.id,
          lc.post_id,
          lc.user_id,
          lc.content,
          lc.created_at,
          m.nickname AS user_nickname,
          m.profile_image AS user_profile_image
        FROM life_comments lc
        LEFT JOIN members m ON lc.user_id = m.id
        WHERE lc.post_id = ?
        ORDER BY lc.created_at ASC`,
        [id]
      );
      comments = commentResult.map(c => ({
        ...c,
        user_profile_image: c.user_profile_image ? `${baseUrl}${c.user_profile_image}` : null
      }));
      commentCount = comments.length;
    } catch (error) {
      // 댓글 테이블이 없으면 빈 배열
      comments = [];
      commentCount = 0;
    }

    res.json({
      success: true,
      data: {
        ...post,
        user_profile_image: post.user_profile_image ? `${baseUrl}${post.user_profile_image}` : null,
        view_count: post.view_count + 1, // 증가된 조회수 반환
        comment_count: commentCount,
        comments: comments
      }
    });
  } catch (error) {
    console.error('게시글 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '게시글 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 댓글 작성
router.post('/posts/:id/comments', authenticateToken, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.userId;
    const { content } = req.body;

    // 입력값 검증
    if (!content || !content.trim()) {
      return res.status(400).json({
        success: false,
        message: '댓글 내용을 입력해주세요'
      });
    }

    // 게시글 존재 확인
    const [posts] = await pool.execute(
      'SELECT id FROM life_posts WHERE id = ?',
      [id]
    );

    if (posts.length === 0) {
      return res.status(404).json({
        success: false,
        message: '게시글을 찾을 수 없습니다'
      });
    }

    // life_comments 테이블에 댓글 저장
    const [result] = await pool.execute(
      `INSERT INTO life_comments (post_id, user_id, content) 
       VALUES (?, ?, ?)`,
      [id, userId, content.trim()]
    );

    res.status(201).json({
      success: true,
      message: '댓글이 작성되었습니다',
      data: {
        id: result.insertId
      }
    });
  } catch (error) {
    console.error('댓글 작성 오류:', error);
    res.status(500).json({
      success: false,
      message: '댓글 작성 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

export default router;
