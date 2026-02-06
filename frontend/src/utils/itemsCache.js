/**
 * 홈 중고 물품 목록용 메모리 캐시 (카테고리별, TTL)
 * - 필터 탭 전환 시 불필요한 API 재호출 감소
 * - 글 등록 후에는 App에서 invalidateItemsCache() 호출 권장
 */

const CACHE_TTL_MS = 2 * 60 * 1000; // 2분

const cache = new Map();

function cacheKey(category) {
  return category === '전체' || !category ? '__all__' : category;
}

export function getItemsFromCache(category) {
  const key = cacheKey(category);
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

export function setItemsCache(category, data) {
  const key = cacheKey(category);
  cache.set(key, { data, at: Date.now() });
}

/** 글 등록 등으로 목록이 바뀌었을 때 호출 (예: App handleWritePostSuccess) */
export function invalidateItemsCache() {
  cache.clear();
}
