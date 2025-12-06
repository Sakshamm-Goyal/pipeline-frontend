import axios from 'axios';

const API_BASE = 'http://localhost:6900/api/v1';

const api = axios.create({
  baseURL: API_BASE,
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
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

// Handle token refresh on 401
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('accessToken');
      window.location.href = '/login';
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
  sendMessage: (message: string, userContext?: any, conversationId?: string) =>
    api.post('/chat/message', { message, userContext, conversationId }),
  createConversation: (userId: string) => api.post('/chat/conversations', { userId }),
  getConversations: (page = 1, limit = 10) =>
    api.get(`/chat/conversations?page=${page}&limit=${limit}`),
  getConversation: (id: string) => api.get(`/chat/conversations/${id}`),
  deleteConversation: (id: string) => api.post(`/chat/conversations/${id}/delete`),
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
  addItem: (data: any) => api.post('/wardrobe', data),
  getItems: () => api.get('/wardrobe'),
  deleteItem: (id: string) => api.delete(`/wardrobe/${id}`),
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
  saveStep9: (data: any) => api.post('/onboarding/step9', data),
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

export default api;
