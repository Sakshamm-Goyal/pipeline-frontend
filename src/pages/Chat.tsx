import React, { useState, useEffect, useRef, useCallback } from 'react';
import Navbar from '../components/Navbar';
import ProductCard from '../components/ProductCard';
import OutfitCard from '../components/OutfitCard';
import { chatAPI, speechAPI } from '../services/api';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import {
  V2Product,
  V2Outfit,
  ResponseType,
  SuggestedAction,
  adaptProductToV2,
  adaptOutfitToV2,
} from '../types/v2';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
  products?: V2Product[];
  outfits?: V2Outfit[];
  responseType?: ResponseType;
  clarificationOptions?: string[];
  suggestedActions?: SuggestedAction[];
  imageUrl?: string;
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
  const [location, setLocation] = useState('');
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [thinkingStage, setThinkingStage] = useState(0);

  // Image upload state
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadingImage, setUploadingImage] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Voice recording state
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [processingVoice, setProcessingVoice] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const recordingTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Sidebar state
  const [conversations, setConversations] = useState<ConversationSummary[]>([]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [loadingConversations, setLoadingConversations] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Clarification state - tracks if we're waiting for user to respond to a clarification question
  const [isAwaitingClarification, setIsAwaitingClarification] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { user, isAuthenticated } = useAuthStore();

  // Detect user location
  const detectLocation = useCallback(async () => {
    setDetectingLocation(true);
    try {
      // First try browser geolocation
      if ('geolocation' in navigator) {
        const position = await new Promise<GeolocationPosition>((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject, {
            timeout: 5000,
            enableHighAccuracy: false,
          });
        });

        // Reverse geocode using a free API
        const { latitude, longitude } = position.coords;
        const response = await fetch(
          `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
        );
        const data = await response.json();

        const city =
          data.address?.city ||
          data.address?.town ||
          data.address?.village ||
          data.address?.municipality ||
          data.address?.county;

        if (city) {
          setLocation(city);
          toast.success(`Location detected: ${city}`);
          return;
        }
      }
    } catch (error) {
      console.log('Geolocation failed, trying IP-based detection');
    }

    // Fallback to IP-based location
    try {
      const response = await fetch('https://ipapi.co/json/');
      const data = await response.json();
      if (data.city) {
        setLocation(data.city);
        toast.success(`Location detected: ${data.city}`);
      } else {
        setLocation('New York'); // Default fallback
        toast('Using default location: New York', { icon: 'ℹ️' });
      }
    } catch (error) {
      console.error('Failed to detect location:', error);
      setLocation('New York');
      toast('Using default location: New York', { icon: 'ℹ️' });
    } finally {
      setDetectingLocation(false);
    }
  }, []);

  // Auto-detect location on mount
  useEffect(() => {
    if (!location) {
      detectLocation();
    }
  }, [location, detectLocation]);

  // Load conversations list
  const loadConversations = useCallback(async () => {
    if (!isAuthenticated || !user?._id) return;

    setLoadingConversations(true);
    try {
      const response = await chatAPI.getConversations(user._id, 50);
      // V2 API returns array directly or in conversations property
      const convs = response.data.conversations || response.data || [];
      setConversations(Array.isArray(convs) ? convs : []);
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
      // V2 API returns conversationId directly in response
      const newConvId = response.data.conversationId || response.data.conversation?.conversationId;
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
    if (convId === conversationId || !user?._id) return; // Already loaded or no user

    setLoadingMessages(true);
    try {
      const response = await chatAPI.getConversation(convId, user._id);
      const conv = response.data;

      console.log('[Chat] Loading conversation:', convId);
      console.log('[Chat] Loaded messages:', conv.messages?.length);

      setConversationId(convId);

      // Map backend messages to frontend format with V2 adaptation
      const loadedMessages: Message[] = (conv.messages || []).map((msg: any, idx: number) => {
        const rawProducts = msg.data?.products || [];
        const rawOutfits = msg.data?.outfits || [];

        // Adapt to V2 format if products/outfits exist
        const products: V2Product[] = rawProducts.map((p: any) => adaptProductToV2(p));
        const outfits: V2Outfit[] = rawOutfits.map((o: any, i: number) => adaptOutfitToV2(o, i));

        console.log(`[Chat] Message ${idx}: ${msg.role}, outfits: ${outfits.length}, products: ${products.length}`);

        return {
          id: msg._id || msg.id || `msg-${idx}`,
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || '',
          timestamp: msg.timestamp || msg.createdAt || new Date().toISOString(),
          products: products.length > 0 ? products : undefined,
          outfits: outfits.length > 0 ? outfits : undefined,
          responseType: msg.responseType as ResponseType,
          suggestedActions: msg.suggestedActions,
        };
      });

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
    if (!window.confirm('Delete this conversation?') || !user?._id) return;

    try {
      await chatAPI.deleteConversation(convId, user._id);

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

  // Handle image selection
  const handleImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        alert('Please select an image file');
        return;
      }

      // Validate file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        alert('Image size should be less than 10MB');
        return;
      }

      setSelectedImage(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  // Remove selected image
  const removeImage = () => {
    setSelectedImage(null);
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  // Upload image to server and get URL
  const uploadImage = async (file: File): Promise<string | null> => {
    if (!user?._id) return null;

    try {
      setUploadingImage(true);
      const response = await chatAPI.uploadImage(file, user._id);
      return response.data.imageUrl;
    } catch (error) {
      console.error('Failed to upload image:', error);
      // For now, use base64 as fallback (will be processed by backend vision service)
      return new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => {
          resolve(reader.result as string);
        };
        reader.readAsDataURL(file);
      });
    } finally {
      setUploadingImage(false);
    }
  };

  // Start voice recording
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const mediaRecorder = new MediaRecorder(stream, {
        mimeType: MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4',
      });

      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorder.onstop = async () => {
        // Stop all tracks
        stream.getTracks().forEach((track) => track.stop());

        if (audioChunksRef.current.length === 0) {
          toast.error('No audio recorded');
          return;
        }

        const audioBlob = new Blob(audioChunksRef.current, {
          type: mediaRecorder.mimeType,
        });

        // Process voice message
        await processVoiceMessage(audioBlob);
      };

      mediaRecorderRef.current = mediaRecorder;
      mediaRecorder.start(1000); // Collect data every second
      setIsRecording(true);
      setRecordingTime(0);

      // Start timer
      recordingTimerRef.current = setInterval(() => {
        setRecordingTime((prev) => prev + 1);
      }, 1000);

      toast.success('Recording started...', { duration: 1500 });
    } catch (error: any) {
      console.error('Failed to start recording:', error);
      if (error.name === 'NotAllowedError') {
        toast.error('Microphone access denied. Please allow microphone access.');
      } else {
        toast.error('Failed to start recording');
      }
    }
  };

  // Stop voice recording
  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);

      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
        recordingTimerRef.current = null;
      }
    }
  };

  // Process voice message
  const processVoiceMessage = async (audioBlob: Blob) => {
    if (!user?._id) {
      toast.error('Please log in to send voice messages');
      return;
    }

    setProcessingVoice(true);
    setLoading(true);

    try {
      // Create file from blob
      const audioFile = new File([audioBlob], 'voice-message.webm', {
        type: audioBlob.type,
      });

      // Send to speech API for transcription and chat processing
      const response = await speechAPI.chatWithVoice(
        audioFile,
        user._id,
        conversationId || undefined
      );

      const data = response.data;

      // Set conversationId if returned
      if (data.conversationId && !conversationId) {
        setConversationId(data.conversationId);
      }

      // Add user message with transcription
      const userMessage: Message = {
        id: Date.now().toString(),
        role: 'user',
        content: `🎤 ${data.transcription}`,
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, userMessage]);

      // Add assistant response
      const responseData = data.response;
      const rawProducts = responseData?.data?.products || [];
      const rawOutfits = responseData?.data?.outfits || [];

      const products: V2Product[] = rawProducts.map((p: any) => adaptProductToV2(p));
      const outfits: V2Outfit[] = rawOutfits.map((o: any, i: number) => adaptOutfitToV2(o, i));

      const clarificationOptions = data.needsClarification
        ? responseData?.data?.clarificationOptions
        : undefined;

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData?.message || 'Here are my recommendations!',
        timestamp: new Date().toISOString(),
        products: products.length > 0 ? products : undefined,
        outfits: outfits.length > 0 ? outfits : undefined,
        responseType: responseData?.type as ResponseType,
        clarificationOptions,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Track if we're awaiting clarification response
      if (data.needsClarification || (clarificationOptions && clarificationOptions.length > 0)) {
        setIsAwaitingClarification(true);
        console.log('[Voice] Awaiting clarification response');
      } else {
        setIsAwaitingClarification(false);
      }

      // Refresh conversations
      await loadConversations();

      toast.success('Voice message processed!', { duration: 2000 });
    } catch (error: any) {
      console.error('Failed to process voice message:', error);
      toast.error(
        error.response?.data?.message || 'Failed to process voice message. Please try again.'
      );

      // Add error message
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: 'Sorry, I couldn\'t process your voice message. Please try again or type your message.',
        timestamp: new Date().toISOString(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setProcessingVoice(false);
      setLoading(false);
      setRecordingTime(0);
    }
  };

  // Format recording time
  const formatRecordingTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  // Send a message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() && !selectedImage) return;

    // Upload image first if selected
    let imageUrl: string | undefined;
    if (selectedImage) {
      setUploadingImage(true);
      const uploadedUrl = await uploadImage(selectedImage);
      setUploadingImage(false);
      if (uploadedUrl) {
        imageUrl = uploadedUrl;
      }
    }

    // Need user ID
    if (!user?._id) {
      console.error('No user ID available');
      return;
    }

    const messageContent = input.trim() || (imageUrl ? 'What can you recommend based on this image?' : '');

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: messageContent,
      timestamp: new Date().toISOString(),
      imageUrl: imageUrl,
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    removeImage(); // Clear image after sending
    setLoading(true);

    try {
      // V2 API: pass userId and optional conversationId
      // If no conversationId, the API will create one automatically
      const response = await chatAPI.sendMessage(messageContent, user._id, conversationId || undefined, imageUrl);

      // V2 API response structure:
      // { conversationId, messageId, response: { type, message, data: { products, suggestedActions } }, needsClarification, processingTimeMs, nodesExecuted }
      const fullResponse = response.data;

      // Set conversationId if returned (for new conversations)
      if (fullResponse.conversationId && !conversationId) {
        setConversationId(fullResponse.conversationId);
      }

      // Extract response data - handle both V1 and V2 response formats
      const responseData = fullResponse?.response || fullResponse;

      // Debug logging for response structure
      console.log('[Chat] Full response:', fullResponse);
      console.log('[Chat] Extracted responseData:', responseData);
      console.log('[Chat] responseData.data:', responseData?.data);

      // V2 products are in response.data.products
      const rawProducts = responseData?.data?.products || [];
      const rawOutfits = responseData?.data?.outfits || [];
      const clarificationOptions = fullResponse?.clarificationData?.options?.map((o: any) => o.label || o) || responseData?.data?.clarificationOptions || [];
      const suggestedActions = responseData?.data?.suggestedActions || responseData?.suggestedActions || [];
      const responseType = responseData?.type as ResponseType;

      console.log('[Chat] rawOutfits:', rawOutfits);
      console.log('[Chat] rawOutfits length:', rawOutfits.length);

      // Adapt products and outfits to V2 format
      const products: V2Product[] = rawProducts.map((p: any) => adaptProductToV2(p));
      const outfits: V2Outfit[] = rawOutfits.map((o: any, i: number) => adaptOutfitToV2(o, i));

      console.log('[Chat] Adapted outfits:', outfits);
      console.log('[Chat] Adapted outfits length:', outfits.length);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData?.message || response.data.error || 'Here are my recommendations!',
        timestamp: new Date().toISOString(),
        products: products.length > 0 ? products : undefined,
        outfits: outfits.length > 0 ? outfits : undefined,
        responseType,
        clarificationOptions: clarificationOptions.length > 0 ? clarificationOptions : undefined,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Track if we're awaiting clarification response
      if (fullResponse?.needsClarification || clarificationOptions.length > 0) {
        setIsAwaitingClarification(true);
        console.log('[Chat] Awaiting clarification response');
      } else {
        setIsAwaitingClarification(false);
      }

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

    // Need user ID
    if (!user?._id) {
      console.error('No user ID available');
      return;
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
      // V2 API: pass userId and optional conversationId
      const response = await chatAPI.sendMessage(msg, user._id, conversationId || undefined);

      // V2 API response structure
      const fullResponse = response.data;

      // Set conversationId if returned (for new conversations)
      if (fullResponse.conversationId && !conversationId) {
        setConversationId(fullResponse.conversationId);
      }

      // Extract response data
      const responseData = fullResponse?.response || fullResponse;

      // Debug logging for response structure
      console.log('[Chat Suggestion] Full response:', fullResponse);
      console.log('[Chat Suggestion] rawOutfits:', responseData?.data?.outfits);

      const rawProducts = responseData?.data?.products || [];
      const rawOutfits = responseData?.data?.outfits || [];
      const clarificationOptions = fullResponse?.clarificationData?.options?.map((o: any) => o.label || o) || responseData?.data?.clarificationOptions || [];
      const suggestedActions = responseData?.data?.suggestedActions || responseData?.suggestedActions || [];
      const responseType = responseData?.type as ResponseType;

      // Adapt products and outfits to V2 format
      const products: V2Product[] = rawProducts.map((p: any) => adaptProductToV2(p));
      const outfits: V2Outfit[] = rawOutfits.map((o: any, i: number) => adaptOutfitToV2(o, i));

      console.log('[Chat Suggestion] Adapted outfits:', outfits.length);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData?.message || 'Here are my recommendations!',
        timestamp: new Date().toISOString(),
        products: products.length > 0 ? products : undefined,
        outfits: outfits.length > 0 ? outfits : undefined,
        responseType,
        clarificationOptions: clarificationOptions.length > 0 ? clarificationOptions : undefined,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Track if we're awaiting clarification response
      if (fullResponse?.needsClarification || clarificationOptions.length > 0) {
        setIsAwaitingClarification(true);
        console.log('[Chat Suggestion] Awaiting clarification response');
      } else {
        setIsAwaitingClarification(false);
      }

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

  // Handle clarification response - uses the dedicated /resume endpoint
  // This provides better context preservation than sending a new message
  const handleClarificationResponse = async (response: string) => {
    // Need user ID and conversation ID
    if (!user?._id) {
      console.error('No user ID available');
      return;
    }

    if (!conversationId) {
      console.error('No conversation ID available for resume');
      // Fallback to regular message if no conversation ID
      handleSuggestion(response);
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: response,
      timestamp: new Date().toISOString(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);
    setIsAwaitingClarification(false); // Clear clarification state

    try {
      // Use the dedicated resume endpoint for clarification responses
      console.log('[Chat] Resuming conversation after clarification:', conversationId);
      const apiResponse = await chatAPI.resumeConversation(conversationId, user._id, response);

      // Process response same as regular messages
      const fullResponse = apiResponse.data;
      const responseData = fullResponse?.response || fullResponse;

      console.log('[Chat Resume] Full response:', fullResponse);

      const rawProducts = responseData?.data?.products || [];
      const rawOutfits = responseData?.data?.outfits || [];
      const clarificationOptions = fullResponse?.clarificationData?.options?.map((o: any) => o.label || o) || responseData?.data?.clarificationOptions || [];
      const suggestedActions = responseData?.data?.suggestedActions || responseData?.suggestedActions || [];
      const responseType = responseData?.type as ResponseType;

      // Adapt products and outfits to V2 format
      const products: V2Product[] = rawProducts.map((p: any) => adaptProductToV2(p));
      const outfits: V2Outfit[] = rawOutfits.map((o: any, i: number) => adaptOutfitToV2(o, i));

      console.log('[Chat Resume] Adapted outfits:', outfits.length);

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseData?.message || 'Here are my recommendations!',
        timestamp: new Date().toISOString(),
        products: products.length > 0 ? products : undefined,
        outfits: outfits.length > 0 ? outfits : undefined,
        responseType,
        clarificationOptions: clarificationOptions.length > 0 ? clarificationOptions : undefined,
        suggestedActions: suggestedActions.length > 0 ? suggestedActions : undefined,
      };
      setMessages((prev) => [...prev, assistantMessage]);

      // Check if we need another clarification
      if (fullResponse?.needsClarification || clarificationOptions.length > 0) {
        setIsAwaitingClarification(true);
        console.log('[Chat Resume] Still awaiting clarification');
      }

      await loadConversations();
    } catch (err) {
      console.error('Failed to resume conversation:', err);
      // On error, try fallback to regular message
      console.log('[Chat Resume] Falling back to regular message');
      setIsAwaitingClarification(false);

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

  // Handle suggested action click
  const handleSuggestedAction = (action: SuggestedAction) => {
    // Handle different action types
    switch (action.action) {
      case 'save_outfit':
        // This would be handled by the OutfitCard component
        console.log('Save outfit action:', action.data);
        break;
      case 'modify_budget':
        handleSuggestion('Show me similar outfits but cheaper');
        break;
      case 'replace_item':
        handleSuggestion('Replace an item in the outfit');
        break;
      default:
        // For custom actions, use the label as the message
        handleSuggestion(action.label);
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
              <button
                type="button"
                onClick={detectLocation}
                disabled={detectingLocation}
                className="p-1.5 text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50"
                title="Detect my location"
              >
                {detectingLocation ? (
                  <div className="w-4 h-4 border-2 border-gray-300 border-t-purple-500 rounded-full animate-spin"></div>
                ) : (
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                )}
              </button>
              <input
                type="text"
                placeholder={detectingLocation ? 'Detecting...' : 'City'}
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
                      {/* Display uploaded image in user message */}
                      {msg.role === 'user' && msg.imageUrl && (
                        <div className="mb-2">
                          <img
                            src={msg.imageUrl}
                            alt="Uploaded"
                            className="max-w-full h-auto rounded-lg max-h-48 object-cover"
                          />
                        </div>
                      )}
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
                            <ProductCard key={product.id || index} product={product} />
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display clarification options - uses dedicated resume endpoint for better context */}
                    {msg.role === 'assistant' && msg.clarificationOptions && msg.clarificationOptions.length > 0 && (
                      <div className="mt-4 w-full max-w-xl">
                        <p className="text-sm text-gray-600 mb-2">Please select an option:</p>
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                          {msg.clarificationOptions.map((option, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleClarificationResponse(option)}
                              className="px-4 py-2 text-sm text-purple-700 bg-purple-50 hover:bg-purple-100 rounded-lg border border-purple-200 hover:border-purple-300 transition-all text-left"
                            >
                              {option}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Display suggested actions */}
                    {msg.role === 'assistant' && msg.suggestedActions && msg.suggestedActions.length > 0 && (
                      <div className="mt-3 w-full max-w-xl">
                        <div className="flex flex-wrap gap-2">
                          {msg.suggestedActions.map((action, idx) => (
                            <button
                              key={idx}
                              onClick={() => handleSuggestedAction(action)}
                              className="px-3 py-1.5 text-xs text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-full border border-purple-200 hover:border-purple-300 transition-all"
                            >
                              {action.label}
                            </button>
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
            {/* Image Preview */}
            {imagePreview && (
              <div className="mb-3 relative inline-block">
                <img
                  src={imagePreview}
                  alt="Selected"
                  className="h-24 w-24 object-cover rounded-lg border border-gray-200"
                />
                <button
                  type="button"
                  onClick={removeImage}
                  className="absolute -top-2 -right-2 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                {uploadingImage && (
                  <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center">
                    <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  </div>
                )}
              </div>
            )}

            <form onSubmit={handleSendMessage} className="flex gap-3">
              {/* Hidden file input */}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageSelect}
                accept="image/*"
                className="hidden"
              />

              {/* Image upload button */}
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                disabled={loading || uploadingImage || isRecording}
                className="p-3 text-gray-500 hover:text-purple-600 hover:bg-purple-50 rounded-xl border border-gray-200 hover:border-purple-300 disabled:opacity-50 disabled:cursor-not-allowed transition-all"
                title="Upload an image"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </button>

              {/* Voice recording button */}
              <button
                type="button"
                onClick={isRecording ? stopRecording : startRecording}
                disabled={loading || uploadingImage || processingVoice}
                className={`p-3 rounded-xl border transition-all ${
                  isRecording
                    ? 'bg-red-500 text-white border-red-500 hover:bg-red-600 animate-pulse'
                    : 'text-gray-500 hover:text-purple-600 hover:bg-purple-50 border-gray-200 hover:border-purple-300'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
                title={isRecording ? `Recording... ${formatRecordingTime(recordingTime)} - Click to stop` : 'Start voice recording'}
              >
                {processingVoice ? (
                  <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin"></div>
                ) : isRecording ? (
                  <div className="flex items-center gap-2">
                    <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                      <rect x="6" y="6" width="12" height="12" rx="2" />
                    </svg>
                    <span className="text-xs font-medium">{formatRecordingTime(recordingTime)}</span>
                  </div>
                ) : (
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                  </svg>
                )}
              </button>

              <input
                type="text"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  isRecording
                    ? '🎤 Recording... Click the red button to stop'
                    : imagePreview
                      ? "Describe what you'd like to find or leave empty..."
                      : 'Type or use voice 🎤 to ask for outfit suggestions...'
                }
                className="flex-1 px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                disabled={loading || uploadingImage || isRecording}
              />
              <button
                type="submit"
                disabled={loading || uploadingImage || (!input.trim() && !selectedImage)}
                className="px-6 py-3 bg-purple-600 text-white rounded-xl hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
              >
                {loading || uploadingImage ? (
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
    { text: 'What should I wear for hiking?', emoji: '🥾' },
    { text: 'Create a professional outfit for a job interview', emoji: '💼' },
    { text: 'Show me red dresses under $150', emoji: '👗' },
    { text: 'Beach vacation outfit ideas', emoji: '🏖️' },
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
