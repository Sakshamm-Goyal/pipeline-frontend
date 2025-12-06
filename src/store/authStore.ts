import { create } from 'zustand';

interface UserProfile {
  gender?: string;
  primaryStyle?: string;
  selectedStyles?: string[];
  colorPreferences?: string[];
  avoidColors?: string[];
  bodyType?: string;
  budgetMin?: number;
  budgetMax?: number;
  occasionPreferences?: string[];
  sustainabilityPreference?: boolean;
  likedBrands?: string[];
  dislikedBrands?: string[];
  onboardingComplete?: boolean;
}

interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  profile?: UserProfile;
}

interface AuthStore {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isInitialized: boolean;
  setUser: (user: User | null) => void;
  setToken: (token: string | null) => void;
  logout: () => void;
  init: () => void;
  updateProfile: (profile: Partial<UserProfile>) => void;
}

// Helper to decode JWT token
function decodeJWT(token: string): any {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

// Check if token is expired (with 60s buffer for refresh)
function isTokenExpired(token: string): boolean {
  const decoded = decodeJWT(token);
  if (!decoded || !decoded.exp) return true;
  const now = Math.floor(Date.now() / 1000);
  return decoded.exp < now + 60; // 60 second buffer
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  user: null,
  token: null,
  isAuthenticated: false,
  isInitialized: false,

  setUser: (user) => {
    set({ user, isAuthenticated: !!user });
    // Persist user to localStorage
    if (user) {
      localStorage.setItem('user', JSON.stringify(user));
    } else {
      localStorage.removeItem('user');
    }
  },

  setToken: (token) => {
    if (token) {
      localStorage.setItem('accessToken', token);
    } else {
      localStorage.removeItem('accessToken');
    }
    set({ token });
  },

  logout: () => {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('user');
    set({ user: null, token: null, isAuthenticated: false });
  },

  updateProfile: (profile) => {
    const currentUser = get().user;
    if (currentUser) {
      const updatedUser = {
        ...currentUser,
        profile: { ...currentUser.profile, ...profile },
      };
      set({ user: updatedUser });
      localStorage.setItem('user', JSON.stringify(updatedUser));
    }
  },

  init: () => {
    const token = localStorage.getItem('accessToken');
    const storedUser = localStorage.getItem('user');

    if (token) {
      // Check if token is expired
      if (isTokenExpired(token)) {
        // Token expired, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
        return;
      }

      const decoded = decodeJWT(token);
      if (decoded && decoded.sub) {
        // Try to restore full user from localStorage, fallback to token data
        let user: User | null = null;
        if (storedUser) {
          try {
            user = JSON.parse(storedUser);
          } catch (e) {
            // Invalid stored user, ignore
          }
        }

        // If no stored user, create minimal user from token
        if (!user) {
          user = {
            _id: decoded.sub,
            email: decoded.email || '',
            firstName: '',
            lastName: '',
          };
        }

        set({
          token,
          user,
          isAuthenticated: true,
          isInitialized: true,
        });
      } else {
        // Invalid token, clear everything
        localStorage.removeItem('accessToken');
        localStorage.removeItem('user');
        set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
      }
    } else {
      // No token, clear user data
      localStorage.removeItem('user');
      set({ token: null, user: null, isAuthenticated: false, isInitialized: true });
    }
  },
}));
