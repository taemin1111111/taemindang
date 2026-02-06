import { useState, useEffect } from 'react';
import './ChatAppointment.css';
import api from '../utils/axios.js';

const TIME_OPTIONS = [];
for (let h = 9; h <= 21; h++) {
  TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:00`);
  if (h < 21) TIME_OPTIONS.push(`${String(h).padStart(2, '0')}:30`);
}

function ChatAppointment({ chatId, appointmentId, onClose }) {
  const [otherUserName, setOtherUserName] = useState('');
  const [date, setDate] = useState('');
  const [time, setTime] = useState('14:00');
  const [location, setLocation] = useState('');
  const [showTimeDropdown, setShowTimeDropdown] = useState(false);
  const [showCalendar, setShowCalendar] = useState(false);
  const [calendarView, setCalendarView] = useState(() => {
    const t = new Date();
    return { year: t.getFullYear(), month: t.getMonth() };
  });
  const [loading, setLoading] = useState(true);
  const [viewMode, setViewMode] = useState(false);
  const [isCreator, setIsCreator] = useState(false);
  const [createdByNickname, setCreatedByNickname] = useState('');
  const [showConfirmed, setShowConfirmed] = useState(false);
  const [appointmentStatus, setAppointmentStatus] = useState(null);
  const [currentUserId, setCurrentUserId] = useState(null);

  useEffect(() => {
    const userStr = localStorage.getItem('user');
    if (userStr) {
      try {
        const u = JSON.parse(userStr);
        setCurrentUserId(u.id);
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    if (!chatId) return;
    const fetchChat = async () => {
      try {
        const res = await api.get(`/chats/${chatId}`);
        if (res.data.success && res.data.data) {
          setOtherUserName(res.data.data.other_user_nickname || '상대방');
        }
      } catch (e) {
        console.error(e);
      } finally {
        if (!appointmentId) setLoading(false);
      }
    };
    fetchChat();
  }, [chatId, appointmentId]);

  useEffect(() => {
    if (!chatId || !appointmentId) return;
    const fetchAppointment = async () => {
      try {
        const res = await api.get(`/chats/${chatId}/appointments/${appointmentId}`);
        if (res.data.success && res.data.data) {
          const a = res.data.data;
          setCreatedByNickname(a.created_by_nickname || '상대방');
          let uid = null;
          try {
            const u = JSON.parse(localStorage.getItem('user') || '{}');
            uid = u.id;
          } catch (e) {}
          setIsCreator(uid !== null && a.created_by === uid);
          const d = a.meet_date ? new Date(String(a.meet_date).includes('T') ? a.meet_date : a.meet_date + 'T12:00:00') : null;
          if (d && !Number.isNaN(d.getTime())) {
            setDate(`${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`);
          }
          if (a.meet_time) setTime(String(a.meet_time).slice(0, 5));
          if (a.place) setLocation(a.place);
          setViewMode(true);
          setAppointmentStatus(a.status || null);
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchAppointment();
  }, [chatId, appointmentId]);

  const formatDisplayDate = (d) => {
    if (!d) return '';
    const dateObj = typeof d === 'string' ? new Date(d) : d;
    const weekdays = ['일요일', '월요일', '화요일', '수요일', '목요일', '금요일', '토요일'];
    const m = dateObj.getMonth() + 1;
    const day = dateObj.getDate();
    const week = weekdays[dateObj.getDay()];
    return `${m}월 ${day}일 ${week}`;
  };

  const handleDateChange = (e) => {
    const v = e.target.value;
    setDate(v);
  };

  const openCalendar = () => {
    if (date) {
      const d = new Date(date);
      setCalendarView({ year: d.getFullYear(), month: d.getMonth() });
    } else {
      const t = new Date();
      setCalendarView({ year: t.getFullYear(), month: t.getMonth() });
    }
    setShowCalendar(true);
  };

  const getCalendarDays = (year, month) => {
    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const startDay = first.getDay();
    const daysInMonth = last.getDate();
    const cells = [];
    for (let i = 0; i < startDay; i++) cells.push({ day: null, date: null });
    for (let d = 1; d <= daysInMonth; d++) {
      cells.push({
        day: d,
        date: `${year}-${String(month + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`
      });
    }
    while (cells.length < 42) cells.push({ day: null, date: null });
    return cells;
  };

  const handleSelectDate = (ymd) => {
    if (!ymd) return;
    setDate(ymd);
    setShowCalendar(false);
  };

  const monthNames = ['1월', '2월', '3월', '4월', '5월', '6월', '7월', '8월', '9월', '10월', '11월', '12월'];

  const handleComplete = async () => {
    if (!chatId || !date || !time || !location.trim()) return;
    try {
      const res = await api.post(`/chats/${chatId}/appointments`, {
        meet_date: date,
        meet_time: time,
        place: location.trim()
      });
      if (res.data.success) {
        onClose?.();
      } else {
        alert(res.data.message || '약속 등록에 실패했습니다');
      }
    } catch (error) {
      console.error('약속 등록 오류:', error);
      alert(error.response?.data?.message || '약속 등록 중 오류가 발생했습니다');
    }
  };

  const handleConfirm = async () => {
    if (!chatId || !appointmentId) return;
    try {
      const res = await api.patch(`/chats/${chatId}/appointments/${appointmentId}/confirm`);
      if (res.data.success) {
        onClose?.();
      } else {
        alert(res.data.message || '확인에 실패했습니다');
      }
    } catch (error) {
      alert(error.response?.data?.message || '확인 중 오류가 발생했습니다');
    }
  };

  const displayDate = date ? formatDisplayDate(new Date(date)) : '';
  const isComplete = Boolean(date && time && location.trim());

  return (
    <div className="chat-appointment-container">
      <div className="chat-appointment-screen">
        {/* 상단 44px 상태바 공간 */}
        <div className="chat-appointment-status-bar" aria-hidden="true" />
        {/* 네비게이션 바 */}
        <div className="chat-appointment-nav">
          <button type="button" className="chat-appointment-close" onClick={onClose} aria-label="닫기">
            <CloseIcon />
          </button>
          <h1 className="chat-appointment-title">{otherUserName ? `${otherUserName}님과 약속` : '약속 잡기'}</h1>
          <div className="chat-appointment-nav-right" />
        </div>

        {loading ? (
          <div className="chat-appointment-loading">로딩 중...</div>
        ) : (
          <div className="chat-appointment-content">
            {/* 상대방이 확인 누른 후: Figma 2938-3602 "(닉네임)님이 약속을 잡았어요." */}
            {showConfirmed ? (
              <p className="chat-appointment-confirmed-text">
                {createdByNickname}님이 약속을 잡았어요.
              </p>
            ) : (
            <>
            <div className={`chat-appointment-form ${viewMode && appointmentStatus === 'CONFIRMED' ? 'chat-appointment-form-confirmed' : ''}`}>
              <div className="chat-appointment-row">
                <label className="chat-appointment-label">날짜</label>
                <div
                  className={`chat-appointment-field-wrap chat-appointment-date-wrap ${viewMode ? 'chat-appointment-readonly' : ''}`}
                  role={viewMode ? null : 'button'}
                  tabIndex={viewMode ? -1 : 0}
                  onClick={viewMode ? undefined : openCalendar}
                  onKeyDown={viewMode ? undefined : (e) => e.key === 'Enter' && openCalendar()}
                  aria-label={viewMode ? undefined : '날짜 선택'}
                >
                  <span className="chat-appointment-field-display">{displayDate || '날짜 선택'}</span>
                  {!viewMode && <span className="chat-appointment-chevron" aria-hidden><ChevronDownIcon /></span>}
                </div>
              </div>

              {/* 화면 중앙 캘린더 모달 (Figma 3030-5244) - 작성 모드에서만 */}
              {!viewMode && showCalendar && (
                <>
                  <div
                    className="chat-appointment-calendar-overlay"
                    onClick={() => setShowCalendar(false)}
                    onKeyDown={(e) => e.key === 'Escape' && setShowCalendar(false)}
                    role="button"
                    tabIndex={0}
                    aria-label="닫기"
                  />
                  <div className="chat-appointment-calendar" role="dialog" aria-modal="true" aria-label="날짜 선택">
                    <div className="chat-appointment-calendar-header">
                      <span className="chat-appointment-calendar-title">
                        {calendarView.year}년 {monthNames[calendarView.month]}
                      </span>
                      <div className="chat-appointment-calendar-nav">
                        <button
                          type="button"
                          className="chat-appointment-calendar-arrow"
                          onClick={() => setCalendarView((v) => (v.month === 0 ? { year: v.year - 1, month: 11 } : { year: v.year, month: v.month - 1 }))}
                          aria-label="이전 달"
                        >
                          <ArrowLeftIcon />
                        </button>
                        <button
                          type="button"
                          className="chat-appointment-calendar-arrow"
                          onClick={() => setCalendarView((v) => (v.month === 11 ? { year: v.year + 1, month: 0 } : { year: v.year, month: v.month + 1 }))}
                          aria-label="다음 달"
                        >
                          <ArrowRightIcon />
                        </button>
                      </div>
                    </div>
                    <div className="chat-appointment-calendar-weekdays">
                      {['일', '월', '화', '수', '목', '금', '토'].map((w) => (
                        <span key={w} className="chat-appointment-calendar-weekday">{w}</span>
                      ))}
                    </div>
                    <div className="chat-appointment-calendar-grid">
                      {getCalendarDays(calendarView.year, calendarView.month).map((cell, i) => (
                        <button
                          key={i}
                          type="button"
                          className={`chat-appointment-calendar-day ${cell.date === date ? 'chat-appointment-calendar-day-selected' : ''} ${!cell.day ? 'chat-appointment-calendar-day-empty' : ''}`}
                          onClick={() => handleSelectDate(cell.date)}
                          disabled={!cell.day}
                        >
                          {cell.day ?? ''}
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}

              <div className="chat-appointment-row">
                <label className="chat-appointment-label">시간</label>
                <div className={`chat-appointment-field-wrap chat-appointment-time-wrap ${viewMode ? 'chat-appointment-readonly' : ''}`}>
                  {viewMode ? (
                    <span className="chat-appointment-field chat-appointment-time-btn">{time}</span>
                  ) : (
                    <>
                      <button
                        type="button"
                        className="chat-appointment-field chat-appointment-time-btn"
                        onClick={() => setShowTimeDropdown(!showTimeDropdown)}
                      >
                        {time}
                      </button>
                      <span className="chat-appointment-chevron" aria-hidden><ChevronDownIcon /></span>
                      {showTimeDropdown && (
                        <div className="chat-appointment-time-dropdown">
                          {TIME_OPTIONS.map((t) => (
                            <button
                              key={t}
                              type="button"
                              className="chat-appointment-time-option"
                              onClick={() => { setTime(t); setShowTimeDropdown(false); }}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>

              <div className="chat-appointment-row">
                <label className="chat-appointment-label">장소</label>
                <input
                  type="text"
                  className="chat-appointment-field chat-appointment-location-input"
                  placeholder="장소 입력"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  readOnly={viewMode}
                />
              </div>
            </div>

            {/* 작성 모드: 완료 버튼 / 보기 모드(상대방, 미확정): 확인 버튼 / 확정됐으면 버튼 없음 */}
            {viewMode && appointmentStatus === 'CONFIRMED' ? null : viewMode ? (
              !isCreator && (
                <button
                  type="button"
                  className="chat-appointment-complete-btn"
                  onClick={handleConfirm}
                >
                  확인
                </button>
              )
            ) : (
              <button
                type="button"
                className={`chat-appointment-complete-btn ${!isComplete ? 'chat-appointment-complete-btn-disabled' : ''}`}
                onClick={handleComplete}
                disabled={!isComplete}
              >
                완료
              </button>
            )}
            </>
            )}
          </div>
        )}

        {/* Indicator 제거, 공간만 padding-bottom: 34px 로 유지 */}
      </div>
    </div>
  );
}

function CloseIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ChevronDownIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M6 9l6 6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowLeftIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

function ArrowRightIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M9 18l6-6-6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  );
}

export default ChatAppointment;
