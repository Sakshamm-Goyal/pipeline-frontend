# Elara Frontend

A beautiful React + TypeScript + Tailwind CSS frontend for the Elara AI Fashion Assistant.

## Quick Start

### 1. Prerequisites

- Node.js 16+ installed
- Backend running on `http://localhost:5000`

### 2. Installation

```bash
npm install
```

### 3. Development

```bash
npm start
```

The frontend will open at `http://localhost:3000` (frontend port, not backend).

### 4. Build for Production

```bash
npm run build
```

## Features

### ✨ Auth System
- User registration with name, email, password
- Login with JWT token
- Secure token storage in localStorage
- Auto-logout on token expiration

### 🎯 Onboarding
- 4-step onboarding flow
- Gender selection
- Style preferences (6 styles)
- Color preferences (multi-select)
- Budget range configuration

### 💬 Chat Interface
- Real-time chat with Elara AI
- Location context for weather-aware suggestions
- Conversation history
- Support for outfit requests, product searches, fashion advice
- Streaming responses with loading indicators

### 👗 Wardrobe Management
- Add clothing items to your virtual wardrobe
- Categorize by type (tops, bottoms, dresses, outerwear, shoes, accessories)
- Tag by style (casual, formal, sporty, bohemian, minimalist, vintage)
- Delete items
- Color-coded visualization

### 📊 Dashboard
- Welcome screen with quick navigation
- Access all features in one place
- Quick tips and guidance

## API Integration

### Endpoints Used

**Auth**
- `POST /auth/register` - Register new user
- `POST /auth/login` - Login user
- `POST /auth/refresh` - Refresh token

**Chat**
- `POST /chat/message` - Send message to AI
- `POST /chat/conversations` - Create conversation
- `GET /chat/conversations` - List conversations
- `GET /chat/conversations/{id}` - Get conversation details

**Wardrobe**
- `POST /wardrobe` - Add item
- `GET /wardrobe` - Get all items
- `DELETE /wardrobe/{id}` - Delete item

**Onboarding**
- `GET /onboarding/profile` - Get user profile
- `PUT /onboarding/profile` - Update profile
- `POST /onboarding/complete` - Complete onboarding

**Outfit Scoring** (Future)
- `POST /pipeline/outfit-scoring/score` - Score outfit
- `POST /pipeline/outfit-scoring/generate` - Generate outfits

## Tech Stack

- **React 18** - UI framework
- **TypeScript** - Type safety
- **Tailwind CSS** - Styling
- **Zustand** - State management
- **Axios** - HTTP client
- **React Router** - Navigation

## File Structure

```
src/
├── pages/
│   ├── Login.tsx           # Login page
│   ├── Register.tsx        # Registration page
│   ├── Onboarding.tsx      # 4-step onboarding
│   ├── Dashboard.tsx       # Main dashboard
│   ├── Chat.tsx            # Chat interface
│   └── Wardrobe.tsx        # Wardrobe management
├── components/
│   ├── PrivateRoute.tsx    # Protected route wrapper
│   └── Navbar.tsx          # Navigation bar
├── services/
│   └── api.ts              # API client & endpoints
├── store/
│   └── authStore.ts        # Zustand auth store
├── App.tsx                 # Main app component
└── index.css               # Global styles + Tailwind
```

## User Flow

1. **Register/Login** → Get JWT token
2. **Onboarding** → Set preferences (gender, style, colors, budget)
3. **Dashboard** → See overview and features
4. **Chat** → Talk to Elara
   - Ask for outfit: "Create a casual summer outfit"
   - Search products: "Find me a black dress under $100"
   - Get advice: "What should I wear to a job interview?"
5. **Wardrobe** → Manage your clothing items

## Testing the Pipeline

### Test Scenario 1: Chat for Outfit Recommendation
1. Go to Chat page
2. Set location to "New York"
3. Send: "Create a casual summer outfit"
4. Backend will use weather, your preferences, and context to generate suggestions

### Test Scenario 2: Single Item Search
1. Go to Chat page
2. Send: "Find me a black dress under $150"
3. Backend will search across all sources and rank results

### Test Scenario 3: Wardrobe Management
1. Go to Wardrobe page
2. Add a few items with different categories, colors, and styles
3. Backend saves them to MongoDB
4. Use in Chat: "Create an outfit using my wardrobe"

## Troubleshooting

### "Cannot connect to backend"
- Ensure backend is running on port 5000
- Check if `REACT_APP_API_URL` in .env is correct
- Clear browser cache and cookies

### "Login failed"
- Verify credentials match backend user
- Check backend logs for errors
- Ensure MongoDB is running

### "Onboarding won't complete"
- Try a different budget range
- Ensure location has proper weather data
- Check browser console for errors

## Environment Variables

Create `.env` file in root:

```env
REACT_APP_API_URL=http://localhost:5000/api/v1
```

## Performance Tips

- Use React DevTools to check for unnecessary re-renders
- Messages are lazy-loaded in chat
- API calls are cached where appropriate
- Tailwind CSS is optimized for production builds

## Next Steps

- Add WebSocket support for real-time chat streaming
- Implement outfit history/saved combinations
- Add image upload for wardrobe items
- Add filters/search in wardrobe
- Implement wishlist functionality
- Add trend feeds
- Mobile-responsive improvements
