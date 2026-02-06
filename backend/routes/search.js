import express from 'express';
import pool from '../config/database.js';

const router = express.Router();

// 연관 검색어 조회 (items와 life_posts 테이블에서 title 검색)
router.get('/suggestions', async (req, res) => {
  try {
    const { keyword } = req.query;

    if (!keyword || !keyword.trim()) {
      return res.json({
        success: true,
        data: []
      });
    }

    const searchKeyword = keyword.trim();

    // items 테이블에서 검색 (제목에 검색어 포함된 것)
    const [items] = await pool.execute(
      `SELECT DISTINCT title 
       FROM items 
       WHERE title LIKE ? 
       AND TRIM(title) != ''
       AND status = 'SELLING'
       LIMIT 10`,
      [`%${searchKeyword}%`]
    );

    // life_posts 테이블에서 검색
    const [posts] = await pool.execute(
      `SELECT DISTINCT title 
       FROM life_posts 
       WHERE title LIKE ? 
       AND TRIM(title) != ''
       LIMIT 10`,
      [`%${searchKeyword}%`]
    );

    // 두 결과를 합치고 중복 제거
    const allTitles = [...items, ...posts].map(item => item.title);
    const uniqueTitles = [...new Set(allTitles)];

    // 검색어로 시작하는 것을 우선순위로 정렬
    const sortedTitles = uniqueTitles.sort((a, b) => {
      const aStartsWith = a.startsWith(searchKeyword) ? 0 : 1;
      const bStartsWith = b.startsWith(searchKeyword) ? 0 : 1;
      if (aStartsWith !== bStartsWith) {
        return aStartsWith - bStartsWith;
      }
      return a.localeCompare(b);
    }).slice(0, 10); // 최대 10개

    res.json({
      success: true,
      data: sortedTitles
    });
  } catch (error) {
    console.error('연관 검색어 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '연관 검색어 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

export default router;
