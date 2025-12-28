import axios, { AxiosError } from 'axios';

const API_BASE = process.env.REACT_APP_API_URL || 'http://localhost:6900/api/v2';

// Default timeout: 30 seconds for most requests
// Chat requests get longer timeout (2 minutes) due to LLM processing
const DEFAULT_TIMEOUT = 30000;
const CHAT_TIMEOUT = 120000;

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
  timeout: DEFAULT_TIMEOUT,
});

// Add token and CSRF to requests
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('accessToken');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  // Add CSRF token for state-changing requests
  if (['post', 'put', 'patch', 'delete'].includes(config.method?.toLowerCase() || '')) {
    const csrfToken = getCsrfToken();
    if (csrfToken) {
      config.headers['x-csrf-token'] = csrfToken;
    }
  }
  return config;
});

// Helper function to get CSRF token from cookie
function getCsrfToken(): string | null {
  const name = 'XSRF-TOKEN';
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) {
    return parts.pop()?.split(';').shift() || null;
  }
  return null;
}

// Initialize CSRF token on app load
export function initializeCsrfToken(): void {
  const token = localStorage.getItem('accessToken');
  if (token) {
    // Make a simple GET request to initialize CSRF tokens
    api.get('/onboarding/profile').catch(() => {
      // Silently fail if not needed
    });
  }
}

// Custom error class for API errors
export class ApiError extends Error {
  status: number;
  code?: string;
  isTimeout: boolean;
  isNetworkError: boolean;

  constructor(
    message: string,
    status: number,
    code?: string,
    isTimeout = false,
    isNetworkError = false
  ) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
    this.code = code;
    this.isTimeout = isTimeout;
    this.isNetworkError = isNetworkError;
  }
}

// Helper to extract error message from response
function extractErrorMessage(error: AxiosError): string {
  const data = error.response?.data as { message?: string | string[]; error?: string } | undefined;

  if (data?.message) {
    return Array.isArray(data.message) ? data.message.join(', ') : data.message;
  }
  if (data?.error) {
    return data.error;
  }
  if (error.code === 'ECONNABORTED') {
    return 'Request timed out. Please try again.';
  }
  if (!error.response) {
    return 'Network error. Please check your connection.';
  }
  return error.message || 'An unexpected error occurred';
}

// Handle token refresh on 401
let isRefreshing = false;
let failedQueue: Array<{
  resolve: (value?: unknown) => void;
  reject: (reason?: any) => void;
}> = [];

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach((prom) => {
    if (error) {
      prom.reject(error);
    } else {
      prom.resolve(token);
    }
  });
  failedQueue = [];
};

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    // If error is 401 and we haven't already tried to refresh
    if (error.response?.status === 401 && !originalRequest._retry) {
      // If we're already refreshing, queue this request
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject });
        })
          .then((token) => {
            originalRequest.headers.Authorization = `Bearer ${token}`;
            return api(originalRequest);
          })
          .catch((err) => Promise.reject(err));
      }

      originalRequest._retry = true;
      isRefreshing = true;

      const refreshToken = localStorage.getItem('refreshToken');

      if (!refreshToken) {
        // No refresh token, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(error);
      }

      try {
        // Try to refresh the token
        const response = await axios.post(`${API_BASE}/auth/refresh`, {
          refreshToken,
        });

        const { accessToken, refreshToken: newRefreshToken } = response.data;

        // Store new tokens
        localStorage.setItem('accessToken', accessToken);
        if (newRefreshToken) {
          localStorage.setItem('refreshToken', newRefreshToken);
        }

        // Update authorization header
        api.defaults.headers.common.Authorization = `Bearer ${accessToken}`;
        originalRequest.headers.Authorization = `Bearer ${accessToken}`;

        processQueue(null, accessToken);

        return api(originalRequest);
      } catch (refreshError) {
        processQueue(refreshError, null);

        // Refresh failed, clear tokens and redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';

        return Promise.reject(refreshError);
      } finally {
        isRefreshing = false;
      }
    }

    return Promise.reject(error);
  }
);

export const authAPI = {
  register: (data: { email: string; password: string; firstName: string; lastName: string }) =>
    api.post('/auth/register', data),
  login: (email: string, password: string) =>
    api.post('/auth/login', { email, password }),
  refresh: () => api.post('/auth/refresh', {}),
};

export const chatAPI = {
  // Send a message to the chat - V2 API format
  // Uses longer timeout (2 min) for LLM processing
  sendMessage: (message: string, userId: string, conversationId?: string, imageUrl?: string) =>
    api.post('/chat/message',
      { message, conversationId, imageUrl },
      { headers: { 'x-user-id': userId }, timeout: CHAT_TIMEOUT }
    ),

  // Create a new conversation
  createConversation: (userId: string) =>
    api.post('/chat', {}, { headers: { 'x-user-id': userId } }),

  // Get user's conversations
  getConversations: (userId: string, limit = 10, offset = 0, status?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (offset) params.append('offset', String(offset));
    if (status) params.append('status', status);
    return api.get(`/chat?${params.toString()}`, { headers: { 'x-user-id': userId } });
  },

  // Get a specific conversation
  getConversation: (conversationId: string, userId: string) =>
    api.get(`/chat/${conversationId}`, { headers: { 'x-user-id': userId } }),

  // Get conversation messages
  getMessages: (conversationId: string, userId: string, limit?: number, before?: string) => {
    const params = new URLSearchParams();
    if (limit) params.append('limit', String(limit));
    if (before) params.append('before', before);
    return api.get(`/chat/${conversationId}/messages?${params.toString()}`, { headers: { 'x-user-id': userId } });
  },

  // Delete conversation
  deleteConversation: (conversationId: string, userId: string) =>
    api.delete(`/chat/${conversationId}`, { headers: { 'x-user-id': userId } }),

  // Upload image for chat
  uploadImage: (file: File, userId: string) => {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/chat/message/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-id': userId
      },
    });
  },

  // Resume conversation after clarification
  // Uses longer timeout (2 min) for LLM processing
  resumeConversation: (conversationId: string, userId: string, response: string) =>
    api.post(`/chat/${conversationId}/resume`,
      { response },
      { headers: { 'x-user-id': userId }, timeout: CHAT_TIMEOUT }
    ),
};

export const outfitAPI = {
  scoreOutfit: (items: any[]) =>
    api.post('/pipeline/outfit-scoring/score', { items }),
  generateOutfits: (data: any) =>
    api.post('/pipeline/outfit-scoring/generate', data),
  scoreWithContext: (items: any[], context: any) =>
    api.post('/pipeline/outfit-scoring/score-with-context', { items, context }),
};

export const wardrobeAPI = {
  // Create wardrobe item with image
  addItem: (formData: FormData) =>
    api.post('/wardrobe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Get user's wardrobe items with optional filters
  getItems: (query?: {
    category?: string;
    isFavorite?: boolean;
    brand?: string;
    tags?: string[];
  }) => {
    const params = new URLSearchParams();
    if (query?.category) params.append('category', query.category);
    if (query?.isFavorite !== undefined) params.append('isFavorite', String(query.isFavorite));
    if (query?.brand) params.append('brand', query.brand);
    if (query?.tags) query.tags.forEach(tag => params.append('tags', tag));

    return api.get(`/wardrobe${params.toString() ? `?${params.toString()}` : ''}`);
  },

  // Get wardrobe statistics
  getStats: () => api.get('/wardrobe/stats'),

  // Get single item by ID
  getItemById: (id: string) => api.get(`/wardrobe/${id}`),

  // Update item metadata
  updateItem: (id: string, data: any) => api.put(`/wardrobe/${id}`, data),

  // Update item image
  updateItemImage: (id: string, formData: FormData) =>
    api.put(`/wardrobe/${id}/image`, formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }),

  // Soft delete item
  deleteItem: (id: string) => api.delete(`/wardrobe/${id}`),

  // Restore deleted item
  restoreItem: (id: string) => api.post(`/wardrobe/${id}/restore`),

  // Permanently delete item
  permanentDeleteItem: (id: string) => api.delete(`/wardrobe/${id}/permanent`),

  // Toggle favorite status
  toggleFavorite: (id: string) => api.post(`/wardrobe/${id}/favorite`),

  // Increment times worn
  incrementTimesWorn: (id: string) => api.post(`/wardrobe/${id}/worn`),
};

export const onboardingAPI = {
  getProfile: () => api.get('/onboarding/profile'),
  updateProfile: (data: any) => api.put('/onboarding/profile', data),
  saveStep1: (data: any) => api.post('/onboarding/step1', data),
  saveStep2: (data: FormData) => api.post('/onboarding/step2', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  saveStep3: (data: any) => api.post('/onboarding/step3', data),
  saveStep4: (data: any) => api.post('/onboarding/step4', data),
  saveStep5: (data: any) => api.post('/onboarding/step5', data),
  saveStep6: (data: any) => api.post('/onboarding/step6', data),
  saveStep7: (data: any) => api.post('/onboarding/step7', data),
  saveStep8: (data: any) => api.post('/onboarding/step8', data),
  // Step 9 requires photo upload for virtual try-on (optional)
  saveStep9: (data: FormData) => api.post('/onboarding/step9', data, { headers: { 'Content-Type': 'multipart/form-data' } }),
  // Step 10: Data retention/consent (GDPR)
  saveStep10: (data: any) => api.post('/onboarding/step10', data),
};

export const feedbackAPI = {
  submitProductFeedback: (data: {
    productId: string;
    type: 'like' | 'dislike' | 'save' | 'purchase';
    reason?: string;
  }) => api.post('/feedback/product', data),

  submitOutfitFeedback: (data: {
    outfitId: string;
    rating: number;
    feedback?: string;
    wouldWear?: boolean;
  }) => api.post('/feedback/outfit', data),

  getUserFeedback: () => api.get('/feedback'),
  getSavedItems: () => api.get('/feedback/saved'),
};

export const speechAPI = {
  // Transcribe audio file to text
  transcribe: (audioFile: File, language?: string) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (language) formData.append('language', language);
    return api.post('/speech/transcribe', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },

  // Send voice message to chat (transcribes and processes)
  chatWithVoice: (audioFile: File, userId: string, conversationId?: string, language?: string) => {
    const formData = new FormData();
    formData.append('audio', audioFile);
    if (conversationId) formData.append('conversationId', conversationId);
    if (language) formData.append('language', language);
    return api.post('/speech/chat', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'x-user-id': userId,
      },
    });
  },

  // Transcribe from URL
  transcribeUrl: (audioUrl: string, language?: string) =>
    api.post('/speech/transcribe-url', { audioUrl, language }),
};

export default api;
