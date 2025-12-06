import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import OutfitCard from '../components/OutfitCard';
import { chatAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';

interface Product {
  id?: string;
  product_id?: string;
  name?: string;
  title?: string;
  url?: string;
  productUrl?: string;
  image_url?: string;
  imageUrl?: string;
  price?: string;
  retailer?: string;
  brand?: string;
  onSale?: boolean;
  originalPrice?: number;
  discount?: number;
}

interface OutfitItem {
  slot: string;
  category?: string;
  name: string;
  price?: string;
  priceValue?: number;
  url?: string;
  productUrl?: string;
  image_url?: string;
  imageUrl?: string;
  retailer?: string;
  brand?: string;
  product_id?: string;
}

interface OutfitReasoning {
  occasion?: string;
  weather?: string;
  color?: string;
  fit?: string;
  trend?: string;
}

interface Outfit {
  id?: string;
  outfit_id?: number;
  name: string;
  summary?: string;
  items: OutfitItem[];
  total_price?: string;
  totalPrice?: number;
  score?: number;
  reasoning?: OutfitReasoning;
  style?: string;
  tags?: string[];
}

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  products?: Product[];
  outfits?: Outfit[];
}

interface ConversationSummary {
  conversationId: string;
  messageCount: number;
  messages: Message[];
  metadata?: {
    startedAt?: string;
    lastMessageAt?: string;
    messageCount?: number;
  };
}

// Thinking stages for the AI processing indicator
const THINKING_STAGES = [
  { icon: '🔍', text: 'Understanding your request...', duration: 1500 },
  { icon: '🎨', text: 'Analyzing style preferences...', duration: 2000 },
  { icon: '🛍️', text: 'Searching fashion sources...', duration: 3000 },
  { icon: '👗', text: 'Finding perfect matches...', duration: 2500 },
  { icon: '✨', text: 'Preparing recommendations...', duration: 2000 },
];

const Chat: React.FC = () => {
  // Core state
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [location, setLocation] = useState('New York');
  const [thinkingStage, setThinkingStage] = useState(0);

  // Sidebar state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;

    setLoadingConversations(true);
    try {
      const response = await chatAPI.getConversations(1, 50);
      const convs = response.data.conversations || [];
      setConversations(convs);
    } catch (err) {
      console.error('Failed to load conversations:', err);
    } finally {
      setLoadingConversations(false);
    }
  }, [isAuthenticated, user?._id]);

  // Initial load
  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, thinkingStage]);

  // Cycle through thinking stages while loading
  useEffect(() => {
    if (!loading) {
      setThinkingStage(0);
      return;
    }

    let currentStage = 0;
    setThinkingStage(0);

    const cycleStages = () => {
      if (currentStage < THINKING_STAGES.length - 1) {
        currentStage++;
        setThinkingStage(currentStage);
      }
    };

    const timeouts: NodeJS.Timeout[] = [];
    let accumulatedTime = 0;

    THINKING_STAGES.forEach((stage, index) => {
      if (index === 0) return;
      accumulatedTime += THINKING_STAGES[index - 1].duration;
      const timeout = setTimeout(cycleStages, accumulatedTime);
      timeouts.push(timeout);
    });

    return () => {
      timeouts.forEach(clearTimeout);
    };
  }, [loading]);

  // Start a new conversation
  const startNewConversation = async () => {
    if (!user?._id) return;

    try {
      const response = await chatAPI.createConversation(user._id);
      const newConvId = response.data.conversation.conversationId;
      setConversationId(newConvId);
      setMessages([]);

      // Refresh conversations list
      await loadConversations();
    } catch (err) {
      console.error('Failed to create new conversation:', err);
    }
  };

  // Load a specific conversation
  const loadConversation = async (convId: string) => {
    if (convId === conversationId) return; // Already loaded

    setLoadingMessages(true);
    try {
      const response = await chatAPI.getConversation(convId);
      const conv = response.data;

      setConversationId(convId);

      // Map backend messages to frontend format
      const loadedMessages: Message[] = (conv.messages || []).map((msg: any, idx: number) => ({
        id: msg._id || msg.id || `msg-${idx}`,
        role: msg.role === 'user' ? 'user' : 'assistant',
        content: msg.content || '',
        timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
        products: msg.data?.products || [],
        outfits: msg.data?.outfits || [],
      }));

      setMessages(loadedMessages);
    } catch (err) {
      console.error('Failed to load conversation:', err);
    } finally {
      setLoadingMessages(false);
    }
  };

  // Delete a conversation
  const deleteConversation = async (convId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (!window.confirm('Delete this conversation?')) return;

    try {
      await chatAPI.deleteConversation(convId);

      // If we deleted the current conversation, clear it
      if (convId === conversationId) {
        setConversationId(null);
        setMessages([]);
      }

      // Refresh list
      await loadConversations();
    } catch (err) {
      console.error('Failed to delete conversation:', err);
    }
  };

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    // If no conversation, create one first
    let currentConvId = conversationId;
    if (!currentConvId && user?._id) {
      try {
        const response = await chatAPI.createConversation(user._id);
        currentConvId = response.data.conversation.conversationId;
        setConversationId(currentConvId);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(input, {
        location,
        profile: user?.profile // Include user profile for brand preferences
      }, currentConvId!);

      // Extract products and outfits from response
      const products = response.data?.response?.data?.products || [];
      const outfits = response.data?.response?.data?.outfits || [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response?.message || response.data.error || 'Here are my recommendations!',
        timestamp: new Date().toISOString(),
        products: products.length > 0 ? products : undefined,
        outfits: outfits.length > 0 ? outfits : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Refresh conversations to update the list
      await loadConversations();
    } catch (err: any) {
      console.error('Failed to send message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Handle suggestion click
  const handleSuggestion = async (msg: string) => {
    setInput(msg);

    // Auto-submit
    let currentConvId = conversationId;
    if (!currentConvId && user?._id) {
      try {
        const response = await chatAPI.createConversation(user._id);
        currentConvId = response.data.conversation.conversationId;
        setConversationId(currentConvId);
      } catch (err) {
        console.error('Failed to create conversation:', err);
        return;
      }
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: msg,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    try {
      const response = await chatAPI.sendMessage(msg, {
        location,
        profile: user?.profile // Include user profile for brand preferences
      }, currentConvId!);
      const products = response.data?.response?.data?.products || [];
      const outfits = response.data?.response?.data?.outfits || [];

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: response.data.response?.message || 'Here are my recommendations!',
        timestamp: new Date().toISOString(),
        products: products.length > 0 ? products : undefined,
        outfits: outfits.length > 0 ? outfits : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);
      await loadConversations();
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  // Get conversation title from first message
  const getConversationTitle = (conv: ConversationSummary): string => {
    const firstUserMsg = conv.messages?.find((m) => m.role === 'user');
    if (firstUserMsg?.content) {
      const content = firstUserMsg.content;
      return content.length > 35 ? content.slice(0, 35) + '...' : content;
    }
    return 'New conversation';
  };

  // Format date for display
  const formatDate = (dateStr?: string): string => {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const now = new Date();
    const diffDays = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    return date.toLocaleDateString();
  };

  return (
    <div className="h-screen flex flex-col">
      <Navbar />
      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar */}
        <div
          className={`${
            sidebarOpen ? 'w-72' : 'w-0'
          } bg-gray-900 text-white flex flex-col transition-all duration-300 overflow-hidden`}
        >
          {/* Sidebar Header */}
          <div className="p-4 border-b border-gray-700">
            <button
              onClick={startNewConversation}
              className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-purple-600 hover:bg-purple-700 rounded-lg font-medium transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              New Chat
            </button>
          </div>

          {/* Conversations List */}
          <div className="flex-1 overflow-y-auto">
            {loadingConversations ? (
              <div className="p-4 text-center text-gray-400">
                <div className="animate-spin w-6 h-6 border-2 border-gray-400 border-t-purple-500 rounded-full mx-auto"></div>
              </div>
            ) : conversations.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <p className="text-sm">No conversations yet</p>
                <p className="text-xs mt-1">Start a new chat!</p>
              </div>
            ) : (
              <div className="py-2">
                {conversations.map((conv) => (
                  <div
                    key={conv.conversationId}
                    onClick={() => loadConversation(conv.conversationId)}
                    className={`group px-4 py-3 cursor-pointer hover:bg-gray-800 transition-colors ${
                      conv.conversationId === conversationId ? 'bg-gray-800 border-l-2 border-purple-500' : ''
                    }`}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-200 truncate">
                          {getConversationTitle(conv)}
                        </p>
                        <p className="text-xs text-gray-500 mt-1">
                          {formatDate(conv.metadata?.lastMessageAt)} · {conv.messageCount || conv.messages?.length || 0} msgs
                        </p>
                      </div>
                      <button
                        onClick={(e) => deleteConversation(conv.conversationId, e)}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-gray-700 rounded transition-opacity"
                        title="Delete conversation"
                      >
                        <svg className="w-4 h-4 text-gray-400 hover:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* User Info */}
          <div className="p-4 border-t border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-purple-600 flex items-center justify-center text-sm font-bold">
                {user?.firstName?.charAt(0) || 'U'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-200 truncate">
                  {user?.firstName} {user?.lastName}
                </p>
                <p className="text-xs text-gray-500 truncate">{user?.email}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Main Chat Area */}
        <div className="flex-1 flex flex-col bg-gray-50">
          {/* Chat Header */}
          <div className="bg-white border-b px-4 py-3 flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
            >
              <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="flex-1">
              <h1 className="text-lg font-semibold text-gray-900">
                {conversationId ? 'Fashion Chat' : 'Start a New Chat'}
              </h1>
              <p className="text-xs text-gray-500">
                {conversationId
                  ? `Conversation ID: ${conversationId.slice(0, 8)}...`
                  : 'Ask for outfit suggestions, product search, or fashion advice'}
              </p>
            </div>
            {/* Location Input */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-gray-500">Location:</span>
              <input
                type="text"
                placeholder="City"
                value={location}
                onChange={(e) => setLocation(e.target.value)}
                className="px-3 py-1.5 text-sm border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent w-32"
              />
            </div>
          </div>

          {/* Messages Area */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {loadingMessages ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <div className="animate-spin w-8 h-8 border-2 border-gray-300 border-t-purple-500 rounded-full mx-auto"></div>
                  <p className="text-gray-500 mt-2 text-sm">Loading conversation...</p>
                </div>
              </div>
            ) : messages.length === 0 ? (
              <WelcomeMessage onSuggestion={handleSuggestion} />
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-xl px-4 py-3 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-purple-600 text-white rounded-br-md'
                          : 'bg-white text-gray-800 shadow-sm border border-gray-100 rounded-bl-md'
                      }`}
                    >
                      <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                      <p className={`text-xs mt-1 ${msg.role === 'user' ? 'text-purple-200' : 'text-gray-400'}`}>
                        {new Date(msg.timestamp).toLocaleTimeString()}
                      </p>
                    </div>

                    {/* Display outfits if available */}
                    {msg.role === 'assistant' && msg.outfits && msg.outfits.length > 0 && (
                      <div className="mt-4 w-full max-w-6xl">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {msg.outfits.map((outfit, index) => (
                            <OutfitCard key={outfit.id || `outfit-${index}`} outfit={outfit} index={index} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display products if available */}
                    {msg.role === 'assistant' && msg.products && msg.products.length > 0 && !msg.outfits?.length && (
                      <div className="mt-4 w-full max-w-6xl">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                          {msg.products.map((product, index) => (
                            <ProductCard key={product.id || product.product_id || index} product={product} />
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                ))}
              </>
            )}

            {loading && <ThinkingIndicator stage={thinkingStage} />}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="bg-white border-t p-4">
            <form onSubmit={handleSendMessage} className="flex gap-3">
              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask for outfit suggestions, product search, or fashion advice..."
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading}
              />
              <button
                type="submit"
                disabled={loading || !input.trim()}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                  </svg>
                )}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

// Welcome Message Component
function WelcomeMessage({ onSuggestion }: { onSuggestion: (msg: string) => void }) {
  const suggestions = [
    { text: 'Show me red dresses under $150', emoji: '👗' },
    { text: 'Create a professional outfit for a job interview', emoji: '💼' },
    { text: 'Find summer casual looks', emoji: '☀️' },
    { text: "What's trending this season?", emoji: '🔥' },
  ];

  return (
    <div className="flex flex-col items-center justify-center h-full max-w-2xl mx-auto text-center px-4 py-12">
      <div className="w-20 h-20 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center mb-6 shadow-lg">
        <span className="text-3xl">✨</span>
      </div>

      <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Elara</h1>
      <p className="text-gray-600 mb-8 max-w-md">
        Your AI fashion assistant. I can help you find clothes, create outfits, and discover your perfect style.
      </p>

      <div className="w-full space-y-3">
        <p className="text-sm text-gray-500 font-medium">Try asking:</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {suggestions.map((suggestion, index) => (
            <button
              key={index}
              onClick={() => onSuggestion(suggestion.text)}
              className="p-4 text-left text-sm text-gray-700 bg-white hover:bg-purple-50 hover:text-purple-700 rounded-xl border border-gray-200 hover:border-purple-300 transition-all shadow-sm hover:shadow-md group"
            >
              <span className="text-xl mr-2 group-hover:scale-110 inline-block transition-transform">
                {suggestion.emoji}
              </span>
              {suggestion.text}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// Enhanced Thinking Indicator Component
function ThinkingIndicator({ stage }: { stage: number }) {
  const currentStage = THINKING_STAGES[stage] || THINKING_STAGES[0];

  return (
    <div className="flex gap-3 py-4 animate-fadeIn">
      <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center text-white flex-shrink-0">
        <span className="font-bold">E</span>
      </div>
      <div className="flex-1 max-w-md">
        <div className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-3">
            <div className="relative">
              <div className="absolute inset-0 bg-purple-400/20 rounded-full animate-ping" />
              <div className="relative w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <span className="text-xl">{currentStage.icon}</span>
              </div>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-800">{currentStage.text}</p>
              <div className="flex gap-1 mt-2">
                {THINKING_STAGES.map((_, index) => (
                  <div
                    key={index}
                    className={`w-1.5 h-1.5 rounded-full transition-all duration-300 ${
                      index <= stage ? 'bg-purple-500' : 'bg-gray-300'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>

          <div className="mt-3 space-y-2">
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer" />
            <div className="h-3 bg-gradient-to-r from-gray-200 via-gray-100 to-gray-200 rounded animate-shimmer w-3/4" />
          </div>
        </div>
      </div>

      <style>{`
        @keyframes shimmer {
          0% { background-position: -200% 0; }
          100% { background-position: 200% 0; }
        }
        .animate-shimmer {
          background-size: 200% 100%;
          animation: shimmer 1.5s ease-in-out infinite;
        }
        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}

export default Chat;
