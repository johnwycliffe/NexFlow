import apiClient from '../api/client';

/**
 * Normalizes snake_case keys from FastAPI/SQLAlchemy to camelCase
 * while preserving original keys for maximum compatibility.
 */
export const snakeToCamel = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => snakeToCamel(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z0-9])/g, (_, letter) => letter.toUpperCase());
      const val = snakeToCamel(obj[key]);
      result[camelKey] = val;
      if (camelKey !== key) {
        result[key] = val;
      }
      return result;
    }, {});
  }
  return obj;
};

/**
 * Normalizes camelCase keys from React components to snake_case for FastAPI Pydantic models.
 */
export const camelToSnake = (obj) => {
  if (Array.isArray(obj)) {
    return obj.map(v => camelToSnake(v));
  } else if (obj !== null && typeof obj === 'object' && obj.constructor === Object) {
    return Object.keys(obj).reduce((result, key) => {
      // Do not convert nested JSON or special keys
      const snakeKey = key.replace(/([A-Z])/g, '_$1').toLowerCase();
      result[snakeKey] = camelToSnake(obj[key]);
      return result;
    }, {});
  }
  return obj;
};

let cachedBackendOnline = null;
let lastCheckTime = 0;

export const checkBackendHealth = async (force = false) => {
  const now = Date.now();
  if (!force && cachedBackendOnline !== null && now - lastCheckTime < 10000) {
    return cachedBackendOnline;
  }
  try {
    const res = await apiClient.get('/health', { timeout: 2500 });
    cachedBackendOnline = res?.status === 'HEALTHY' || res?.database === 'CONNECTED';
    lastCheckTime = now;
    return cachedBackendOnline;
  } catch (err) {
    cachedBackendOnline = false;
    lastCheckTime = now;
    return false;
  }
};

export const createRestService = (endpoint, localStorageKey) => {
  return {
    async getAll(params = {}) {
      try {
        const res = await apiClient.get(endpoint, { params, timeout: 5000 });
        if (res && (Array.isArray(res) || res.items || res.data)) {
          const rawItems = Array.isArray(res) ? res : (res.items || res.data);
          const normalized = snakeToCamel(rawItems);
          if (localStorageKey && normalized.length > 0) {
            localStorage.setItem(localStorageKey, JSON.stringify(normalized));
          }
          return normalized;
        }
      } catch (err) {
        console.warn(`[API Adapter] Live GET ${endpoint} unavailable, using cached state.`, err?.message);
      }
      if (localStorageKey) {
        const raw = localStorage.getItem(localStorageKey);
        return raw ? JSON.parse(raw) : [];
      }
      return [];
    },

    async getById(id) {
      try {
        const res = await apiClient.get(`${endpoint}/${id}`, { timeout: 5000 });
        if (res) {
          return snakeToCamel(res);
        }
      } catch (err) {
        console.warn(`[API Adapter] Live GET ${endpoint}/${id} failed, falling back.`, err?.message);
      }
      if (localStorageKey) {
        const list = JSON.parse(localStorage.getItem(localStorageKey) || '[]');
        return list.find(item => String(item.id) === String(id) || item.sku === id || item.code === id);
      }
      return null;
    },

    async create(payload) {
      try {
        const snakePayload = camelToSnake(payload);
        const res = await apiClient.post(endpoint, snakePayload, { timeout: 6000 });
        if (res) {
          return snakeToCamel(res);
        }
      } catch (err) {
        console.warn(`[API Adapter] Live POST ${endpoint} failed:`, err?.response?.data || err?.message);
        throw err;
      }
      return payload;
    },

    async update(id, payload) {
      try {
        const snakePayload = camelToSnake(payload);
        const res = await apiClient.put(`${endpoint}/${id}`, snakePayload, { timeout: 6000 });
        if (res) {
          return snakeToCamel(res);
        }
      } catch (err) {
        console.warn(`[API Adapter] Live PUT ${endpoint}/${id} failed:`, err?.response?.data || err?.message);
        throw err;
      }
      return { id, ...payload };
    },

    async delete(id) {
      try {
        const res = await apiClient.delete(`${endpoint}/${id}`, { timeout: 6000 });
        return res || { success: true, id };
      } catch (err) {
        console.warn(`[API Adapter] Live DELETE ${endpoint}/${id} failed:`, err?.response?.data || err?.message);
        throw err;
      }
    }
  };
};
