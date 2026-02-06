import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import pool from '../config/database.js';
import { authenticateToken } from '../middleware/auth.js';

const router = express.Router();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadsDir = path.join(__dirname, '../uploads');

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '_' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

const fileFilter = (req, file, cb) => {
  const allowed = /jpeg|jpg|png|gif|webp/;
  const ok = allowed.test(path.extname(file.originalname).toLowerCase()) && allowed.test(file.mimetype);
  cb(null, !!ok);
};

const uploadChatImage = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 },
  fileFilter
});

// 상품에 메시지 전송 (채팅방 자동 생성)
router.post('/items/:itemId/messages', authenticateToken, async (req, res) => {
  try {
    const { itemId } = req.params;
    const { message } = req.body;
    const buyerId = req.user.userId; // JWT에서 구매자 ID 추출

    // 입력값 검증
    if (!message || !message.trim()) {
      return res.status(400).json({
        success: false,
        message: '메시지를 입력해주세요'
      });
    }

    // 상품 정보 조회
    const [items] = await pool.execute(
      'SELECT id, seller_id FROM items WHERE id = ?',
      [itemId]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    const item = items[0];
    const sellerId = item.seller_id;

    // 자신의 상품에 메시지 보내는 경우 체크 (선택사항 - 필요시 주석 해제)
    // if (buyerId === sellerId) {
    //   return res.status(400).json({
    //     success: false,
    //     message: '자신의 상품에는 메시지를 보낼 수 없습니다'
    //   });
    // }

    // 기존 채팅방 조회
    let [existingChats] = await pool.execute(
      'SELECT id FROM chats WHERE item_id = ? AND buyer_id = ? AND seller_id = ?',
      [itemId, buyerId, sellerId]
    );

    let chatId;

    if (existingChats.length > 0) {
      // 기존 채팅방이 있으면 사용
      chatId = existingChats[0].id;
    } else {
      // 채팅방이 없으면 생성
      const [chatResult] = await pool.execute(
        'INSERT INTO chats (item_id, seller_id, buyer_id) VALUES (?, ?, ?)',
        [itemId, sellerId, buyerId]
      );
      chatId = chatResult.insertId;
    }

    // 메시지 생성
    const [messageResult] = await pool.execute(
      'INSERT INTO chat_messages (chat_id, sender_id, message, msg_type) VALUES (?, ?, ?, ?)',
      [chatId, buyerId, message.trim(), 'TEXT']
    );

    const messageId = messageResult.insertId;

    // 구매자가 보낸 메시지이므로 buyer_last_read_msg_id 업데이트
    await pool.execute(
      'UPDATE chats SET buyer_last_read_msg_id = ? WHERE id = ?',
      [messageId, chatId]
    );

    res.status(201).json({
      success: true,
      message: '메시지가 전송되었습니다',
      data: {
        chat_id: chatId,
        message_id: messageId
      }
    });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '메시지 전송 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 채팅방 목록 조회 (안읽은 메시지 개수 포함)
router.get('/', authenticateToken, async (req, res) => {
  try {
    const userId = req.user.userId;

    // 사용자가 구매자 또는 판매자인 채팅방 조회
    const [chats] = await pool.execute(
      `SELECT 
        c.id,
        c.item_id,
        c.seller_id,
        c.buyer_id,
        c.buyer_last_read_msg_id,
        c.seller_last_read_msg_id,
        c.created_at,
        i.title AS item_title,
        img.image_url AS item_image,
        CASE 
          WHEN c.seller_id = ? THEN 
            (SELECT COUNT(*) FROM chat_messages cm 
             WHERE cm.chat_id = c.id 
             AND cm.id > COALESCE(c.seller_last_read_msg_id, 0)
             AND cm.sender_id != ?)
          ELSE 
            (SELECT COUNT(*) FROM chat_messages cm 
             WHERE cm.chat_id = c.id 
             AND cm.id > COALESCE(c.buyer_last_read_msg_id, 0)
             AND cm.sender_id != ?)
        END AS unread_count,
        CASE 
          WHEN c.seller_id = ? THEN 
            (SELECT m.nickname FROM members m WHERE m.id = c.buyer_id)
          ELSE 
            (SELECT m.nickname FROM members m WHERE m.id = c.seller_id)
        END AS other_user_nickname,
        CASE 
          WHEN c.seller_id = ? THEN 
            (SELECT m.profile_image FROM members m WHERE m.id = c.buyer_id)
          ELSE 
            (SELECT m.profile_image FROM members m WHERE m.id = c.seller_id)
        END AS other_user_profile_image,
        (SELECT cm.message FROM chat_messages cm 
         WHERE cm.chat_id = c.id 
         ORDER BY cm.created_at DESC 
         LIMIT 1) AS latest_message,
        (SELECT cm.created_at FROM chat_messages cm 
         WHERE cm.chat_id = c.id 
         ORDER BY cm.created_at DESC 
         LIMIT 1) AS latest_message_time
      FROM chats c
      LEFT JOIN items i ON c.item_id = i.id
      LEFT JOIN item_images img ON img.item_id = i.id AND img.is_thumbnail = 1
      WHERE c.seller_id = ? OR c.buyer_id = ?
      ORDER BY c.created_at DESC`,
      [userId, userId, userId, userId, userId, userId, userId]
    );

    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    // 데이터 포맷팅
    const formattedChats = chats.map(chat => ({
      id: chat.id,
      item_id: chat.item_id,
      item_title: chat.item_title,
      item_image: chat.item_image ? `${baseUrl}${chat.item_image}` : null,
      other_user_nickname: chat.other_user_nickname,
      other_user_profile_image: chat.other_user_profile_image ? `${baseUrl}${chat.other_user_profile_image}` : null,
      unread_count: parseInt(chat.unread_count) || 0,
      created_at: chat.created_at,
      is_seller: chat.seller_id === userId,
      latest_message: chat.latest_message || null,
      latest_message_time: chat.latest_message_time || null
    }));

    res.json({
      success: true,
      data: formattedChats
    });
  } catch (error) {
    console.error('채팅방 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 채팅방 상세 정보 조회
router.get('/:chatId', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;
    const chatIdNum = parseInt(chatId, 10);
    if (Number.isNaN(chatIdNum) || chatIdNum < 1) {
      return res.status(400).json({
        success: false,
        message: '잘못된 채팅방 번호입니다'
      });
    }

    // 채팅방 존재 여부 확인
    const [exists] = await pool.execute('SELECT id, seller_id, buyer_id FROM chats WHERE id = ?', [chatIdNum]);
    if (exists.length === 0) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다'
      });
    }
    const chatRow = exists[0];
    if (chatRow.seller_id !== userId && chatRow.buyer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '이 채팅방에 접근할 권한이 없습니다'
      });
    }

    // 채팅방 정보 조회 (참여자이므로 상세 조회)
    const [chats] = await pool.execute(
      `SELECT 
        c.id,
        c.item_id,
        c.seller_id,
        c.buyer_id,
        CASE 
          WHEN c.seller_id = ? THEN 
            (SELECT m.nickname FROM members m WHERE m.id = c.buyer_id)
          ELSE 
            (SELECT m.nickname FROM members m WHERE m.id = c.seller_id)
        END AS other_user_nickname,
        CASE 
          WHEN c.seller_id = ? THEN 
            (SELECT m.temperature FROM members m WHERE m.id = c.buyer_id)
          ELSE 
            (SELECT m.temperature FROM members m WHERE m.id = c.seller_id)
        END AS other_user_temperature,
        CASE 
          WHEN c.seller_id = ? THEN 
            (SELECT m.profile_image FROM members m WHERE m.id = c.buyer_id)
          ELSE 
            (SELECT m.profile_image FROM members m WHERE m.id = c.seller_id)
        END AS other_user_profile_image
      FROM chats c
      WHERE c.id = ?`,
      [userId, userId, userId, chatIdNum]
    );
    if (chats.length === 0) {
      return res.status(500).json({ success: false, message: '채팅방 정보를 불러올 수 없습니다' });
    }
    const chat = chats[0];

    const baseUrl = process.env.API_BASE || 'http://localhost:5000';
    res.json({
      success: true,
      data: {
        id: chat.id,
        item_id: chat.item_id,
        seller_id: chat.seller_id,
        buyer_id: chat.buyer_id,
        other_user_nickname: chat.other_user_nickname,
        other_user_temperature: parseFloat(chat.other_user_temperature) || 36.5,
        other_user_profile_image: chat.other_user_profile_image ? `${baseUrl}${chat.other_user_profile_image}` : null,
        is_seller: chat.seller_id === userId
      }
    });
  } catch (error) {
    console.error('채팅방 상세 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '채팅방 상세 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 채팅방 메시지 목록 조회 (읽음 처리 포함)
router.get('/:chatId/messages', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const userId = req.user.userId;

    // 채팅방 정보 조회 및 권한 확인
    const [chats] = await pool.execute(
      'SELECT id, seller_id, buyer_id, buyer_last_read_msg_id, seller_last_read_msg_id FROM chats WHERE id = ?',
      [parseInt(chatId)]
    );

    if (chats.length === 0) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다'
      });
    }

    const chat = chats[0];

    // 권한 확인 (판매자 또는 구매자만 접근 가능)
    if (chat.seller_id !== userId && chat.buyer_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '이 채팅방에 접근할 권한이 없습니다'
      });
    }

    // 메시지 목록 조회 (APPOINTMENT일 때 약속 정보 포함)
    const [messages] = await pool.execute(
      `SELECT 
        cm.id,
        cm.chat_id,
        cm.sender_id,
        cm.msg_type,
        cm.appointment_id,
        cm.message,
        cm.image_url,
        cm.created_at,
        m.nickname AS sender_nickname,
        ca.meet_date,
        ca.meet_time,
        ca.place AS appointment_place,
        ca.status AS appointment_status
      FROM chat_messages cm
      LEFT JOIN members m ON cm.sender_id = m.id
      LEFT JOIN chat_appointments ca ON cm.appointment_id = ca.id
      WHERE cm.chat_id = ?
      ORDER BY cm.created_at ASC`,
      [parseInt(chatId)]
    );

    // 가장 최근 메시지 ID
    const latestMessageId = messages.length > 0 ? messages[messages.length - 1].id : null;

    // 읽음 처리: 현재 사용자의 last_read_msg_id 업데이트
    if (latestMessageId) {
      if (chat.seller_id === userId) {
        // 판매자인 경우
        await pool.execute(
          'UPDATE chats SET seller_last_read_msg_id = ? WHERE id = ?',
          [latestMessageId, chatId]
        );
      } else {
        // 구매자인 경우
        await pool.execute(
          'UPDATE chats SET buyer_last_read_msg_id = ? WHERE id = ?',
          [latestMessageId, chatId]
        );
      }
    }

    // 데이터 포맷팅 (image_url은 절대 URL로, APPOINTMENT일 때 약속 정보 포함)
    const baseUrl = process.env.BASE_URL || 'http://localhost:5000';
    const formattedMessages = messages.map(msg => {
      const base = {
        id: msg.id,
        chat_id: msg.chat_id,
        sender_id: msg.sender_id,
        sender_nickname: msg.sender_nickname,
        msg_type: msg.msg_type,
        message: msg.message,
        image_url: msg.image_url ? `${baseUrl}${msg.image_url}` : null,
        created_at: msg.created_at,
        is_mine: msg.sender_id === userId
      };
      if (msg.msg_type === 'APPOINTMENT' && msg.appointment_id) {
        base.appointment_id = msg.appointment_id;
        base.meet_date = msg.meet_date;
        base.meet_time = msg.meet_time;
        base.place = msg.appointment_place;
        base.appointment_status = msg.appointment_status;
      }
      return base;
    });

    res.json({
      success: true,
      data: {
        chat_id: chatId,
        messages: formattedMessages
      }
    });
  } catch (error) {
    console.error('메시지 목록 조회 오류:', error);
    res.status(500).json({
      success: false,
      message: '메시지 목록 조회 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 채팅방 메시지 전송 (텍스트 또는 이미지, 이미지 시 message는 ''로 저장 - MESSAGE NOT NULL)
router.post('/:chatId/messages', authenticateToken, uploadChatImage.single('image'), async (req, res) => {
  try {
    const { chatId } = req.params;
    const messageText = (req.body.message && typeof req.body.message === 'string') ? req.body.message.trim() : '';
    const imageFile = req.file;
    const senderId = req.user.userId;

    // 텍스트도 없고 이미지도 없으면 에러
    if (!imageFile && !messageText) {
      return res.status(400).json({
        success: false,
        message: '메시지 또는 사진을 입력해주세요'
      });
    }

    // 채팅방 정보 조회 및 권한 확인
    const [chats] = await pool.execute(
      'SELECT id, seller_id, buyer_id FROM chats WHERE id = ?',
      [chatId]
    );

    if (chats.length === 0) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다'
      });
    }

    const chat = chats[0];

    if (chat.seller_id !== senderId && chat.buyer_id !== senderId) {
      return res.status(403).json({
        success: false,
        message: '이 채팅방에 메시지를 보낼 권한이 없습니다'
      });
    }

    const imageUrl = imageFile ? `/uploads/${imageFile.filename}` : null;
    const msgType = imageUrl ? 'IMAGE' : 'TEXT';
    const messageForDb = messageText || ''; // NOT NULL 컬럼이므로 이미지만 보낼 때는 ''

    const [messageResult] = await pool.execute(
      'INSERT INTO chat_messages (chat_id, sender_id, message, msg_type, image_url) VALUES (?, ?, ?, ?, ?)',
      [chatId, senderId, messageForDb, msgType, imageUrl]
    );

    const messageId = messageResult.insertId;

    if (chat.seller_id === senderId) {
      await pool.execute(
        'UPDATE chats SET seller_last_read_msg_id = ? WHERE id = ?',
        [messageId, chatId]
      );
    } else {
      await pool.execute(
        'UPDATE chats SET buyer_last_read_msg_id = ? WHERE id = ?',
        [messageId, chatId]
      );
    }

    res.status(201).json({
      success: true,
      message: '메시지가 전송되었습니다',
      data: {
        message_id: messageId,
        image_url: imageUrl ? `http://localhost:5000${imageUrl}` : null
      }
    });
  } catch (error) {
    console.error('메시지 전송 오류:', error);
    res.status(500).json({
      success: false,
      message: '메시지 전송 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 상품 거래 상태 변경 (판매자만): 거래완료 → buyer_id 저장 + SOLD, 판매중 되돌리기 → buyer_id NULL + SELLING
router.patch('/:chatId/item-status', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { status } = req.body; // 'SOLD' | 'SELLING'
    const userId = req.user.userId;

    if (!status || !['SOLD', 'SELLING'].includes(status)) {
      return res.status(400).json({
        success: false,
        message: 'status는 SOLD 또는 SELLING이어야 합니다'
      });
    }

    const [chats] = await pool.execute(
      'SELECT id, item_id, seller_id, buyer_id FROM chats WHERE id = ?',
      [parseInt(chatId)]
    );

    if (chats.length === 0) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다'
      });
    }

    const chat = chats[0];

    if (chat.seller_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '판매자만 거래 상태를 변경할 수 있습니다'
      });
    }

    const [items] = await pool.execute(
      'SELECT id, seller_id FROM items WHERE id = ?',
      [chat.item_id]
    );

    if (items.length === 0) {
      return res.status(404).json({
        success: false,
        message: '상품을 찾을 수 없습니다'
      });
    }

    if (items[0].seller_id !== userId) {
      return res.status(403).json({
        success: false,
        message: '본인 상품만 상태를 변경할 수 있습니다'
      });
    }

    if (status === 'SOLD') {
      await pool.execute(
        'UPDATE items SET buyer_id = ?, status = ? WHERE id = ?',
        [chat.buyer_id, 'SOLD', chat.item_id]
      );
    } else {
      await pool.execute(
        'UPDATE items SET buyer_id = NULL, status = ? WHERE id = ?',
        ['SELLING', chat.item_id]
      );
    }

    res.json({
      success: true,
      message: status === 'SOLD' ? '거래완료로 변경되었습니다' : '판매중으로 변경되었습니다',
      data: { status }
    });
  } catch (error) {
    console.error('거래 상태 변경 오류:', error);
    res.status(500).json({
      success: false,
      message: '거래 상태 변경 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

// 약속 단건 조회 (약속 보기 시 정보 채우기용)
router.get('/:chatId/appointments/:appointmentId', authenticateToken, async (req, res) => {
  try {
    const { chatId, appointmentId } = req.params;
    const userId = req.user.userId;

    const [chats] = await pool.execute(
      'SELECT id, seller_id, buyer_id FROM chats WHERE id = ?',
      [parseInt(chatId)]
    );
    if (chats.length === 0) {
      return res.status(404).json({ success: false, message: '채팅방을 찾을 수 없습니다' });
    }
    const chat = chats[0];
    if (chat.seller_id !== userId && chat.buyer_id !== userId) {
      return res.status(403).json({ success: false, message: '권한이 없습니다' });
    }

    const [rows] = await pool.execute(
      `SELECT ca.id, ca.chat_id, ca.created_by, ca.meet_date, ca.meet_time, ca.place, ca.status, ca.created_at,
              m.nickname AS created_by_nickname
       FROM chat_appointments ca
       LEFT JOIN members m ON ca.created_by = m.id
       WHERE ca.id = ? AND ca.chat_id = ?`,
      [parseInt(appointmentId), parseInt(chatId)]
    );
    if (rows.length === 0) {
      return res.status(404).json({ success: false, message: '약속을 찾을 수 없습니다' });
    }
    const row = rows[0];
    const meetTime = row.meet_time;
    const timeStr = meetTime ? String(meetTime).slice(0, 5) : '';

    res.json({
      success: true,
      data: {
        id: row.id,
        chat_id: row.chat_id,
        created_by: row.created_by,
        created_by_nickname: row.created_by_nickname || '사용자',
        meet_date: row.meet_date,
        meet_time: timeStr,
        place: row.place,
        status: row.status,
        created_at: row.created_at
      }
    });
  } catch (error) {
    console.error('약속 조회 오류:', error);
    res.status(500).json({ success: false, message: '약속 조회 중 오류가 발생했습니다', error: error.message });
  }
});

// 약속 확인 (상대방이 확인 누를 때 status → CONFIRMED)
router.patch('/:chatId/appointments/:appointmentId/confirm', authenticateToken, async (req, res) => {
  try {
    const { chatId, appointmentId } = req.params;
    const userId = req.user.userId;

    const [chats] = await pool.execute(
      'SELECT id, seller_id, buyer_id FROM chats WHERE id = ?',
      [parseInt(chatId)]
    );
    if (chats.length === 0) {
      return res.status(404).json({ success: false, message: '채팅방을 찾을 수 없습니다' });
    }
    const chat = chats[0];
    if (chat.seller_id !== userId && chat.buyer_id !== userId) {
      return res.status(403).json({ success: false, message: '권한이 없습니다' });
    }

    const [appointments] = await pool.execute(
      `SELECT ca.id, ca.created_by, m.nickname AS creator_nickname
       FROM chat_appointments ca
       LEFT JOIN members m ON ca.created_by = m.id
       WHERE ca.id = ? AND ca.chat_id = ?`,
      [parseInt(appointmentId), parseInt(chatId)]
    );
    if (appointments.length === 0) {
      return res.status(404).json({ success: false, message: '약속을 찾을 수 없습니다' });
    }
    if (appointments[0].created_by === userId) {
      return res.status(400).json({ success: false, message: '본인이 만든 약속은 확인할 수 없습니다' });
    }

    await pool.execute(
      "UPDATE chat_appointments SET status = 'CONFIRMED' WHERE id = ? AND chat_id = ?",
      [parseInt(appointmentId), parseInt(chatId)]
    );

    res.json({ success: true, message: '약속을 확인했습니다' });
  } catch (error) {
    console.error('약속 확인 오류:', error);
    res.status(500).json({ success: false, message: '약속 확인 중 오류가 발생했습니다', error: error.message });
  }
});

// 약속 등록 (chat_appointments 테이블에 저장)
router.post('/:chatId/appointments', authenticateToken, async (req, res) => {
  try {
    const { chatId } = req.params;
    const { meet_date, meet_time, place } = req.body;
    const createdBy = req.user.userId;

    if (!meet_date || !meet_time || !place || !place.trim()) {
      return res.status(400).json({
        success: false,
        message: '날짜, 시간, 장소를 모두 입력해주세요'
      });
    }

    const [chats] = await pool.execute(
      'SELECT id, seller_id, buyer_id FROM chats WHERE id = ?',
      [parseInt(chatId)]
    );

    if (chats.length === 0) {
      return res.status(404).json({
        success: false,
        message: '채팅방을 찾을 수 없습니다'
      });
    }

    const chat = chats[0];
    if (chat.seller_id !== createdBy && chat.buyer_id !== createdBy) {
      return res.status(403).json({
        success: false,
        message: '이 채팅방에 약속을 등록할 수 없습니다'
      });
    }

    const placeTrimmed = place.trim().slice(0, 100);

    const [appointmentResult] = await pool.execute(
      `INSERT INTO chat_appointments (chat_id, created_by, meet_date, meet_time, place, status)
       VALUES (?, ?, ?, ?, ?, 'REQUESTED')`,
      [parseInt(chatId), createdBy, meet_date, meet_time, placeTrimmed]
    );
    const appointmentId = appointmentResult.insertId;

    await pool.execute(
      `INSERT INTO chat_messages (chat_id, sender_id, msg_type, appointment_id, message)
       VALUES (?, ?, 'APPOINTMENT', ?, ?)`,
      [parseInt(chatId), createdBy, appointmentId, '약속을 만들었어요.']
    );

    res.status(201).json({
      success: true,
      message: '약속이 등록되었습니다'
    });
  } catch (error) {
    console.error('약속 등록 오류:', error);
    res.status(500).json({
      success: false,
      message: '약속 등록 중 오류가 발생했습니다',
      error: error.message
    });
  }
});

export default router;
