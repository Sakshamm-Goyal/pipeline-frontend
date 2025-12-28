# Elara Demo Script

## Introduction
"Welcome to Elara, your AI-powered fashion assistant. Today I'll demonstrate three major features we've just implemented."

## Feature 1: Smart Item Replacement

### Setup
1. "Let me start by asking for a hiking outfit"
   - Type: "I need an outfit for hiking in cold weather"
   - Wait for 3 outfit recommendations

### Demo Replacement
2. "Now, let's say I don't like the hat in the second outfit"
   - Type: "change the hat in outfit 2"
   - Show how it recognizes the intent and replaces just the hat

3. "I can also be more casual about it"
   - Type: "different shoes"
   - Show how it understands context and replaces shoes

4. "Or target specific items"
   - Type: "accessories"
   - Show how it knows to replace accessories

## Feature 2: Persistent Conversation History

### Create Rich Conversation
1. "Let me show you how conversations are saved"
   - Ask: "Show me summer dresses"
   - Get product recommendations

2. "Now let's get some outfits"
   - Ask: "Create a beach vacation outfit"
   - Get outfit recommendations

### Demonstrate Persistence
3. "Now watch what happens when I refresh"
   - Refresh the page (F5)
   - Click on the conversation in sidebar
   - Show: "All products and outfits are preserved!"

## Feature 3: Image-Based Recommendations

### Upload Image
1. "Now for the exciting part - image uploads!"
   - Click the camera icon
   - Select an image of clothing
   - Show the preview

2. "I can ask specific questions about it"
   - Type: "What can I wear with this shirt?"
   - Send message
   - Show how AI analyzes the image

### Image Only
3. "Or just let the AI suggest"
   - Upload another image
   - Send without text
   - Show outfit recommendations based on image

### Combined Demo
4. "Let's combine everything"
   - Upload image of jeans
   - Ask: "Create a casual outfit with these"
   - Get recommendations
   - Then: "change the top in outfit 1"
   - Show the complete flow

## Conclusion
"Elara now offers:
- Intelligent item replacement in outfits
- Full conversation history with visual content
- Image-based outfit recommendations
- Natural language understanding for all interactions

This makes fashion recommendations more interactive, personalized, and user-friendly than ever before."

## Technical Highlights

### Backend (NestJS)
- LLM-first intent classification with Claude/OpenAI
- Fallback detection for edge cases
- Multer for image upload handling
- MongoDB for conversation persistence

### Frontend (React)
- FileReader API for image preview
- FormData for multipart uploads
- Responsive image display
- Real-time upload progress

## Q&A Talking Points

1. **How does item replacement work?**
   - LLM classifies intent and extracts slot name
   - Fallback regex detection if LLM misses
   - Supports natural language outfit references

2. **How are images processed?**
   - Uploaded to server via multipart/form-data
   - Stored in uploads/chat-images/
   - URL passed to vision analyzer service
   - AI extracts clothing items and colors

3. **How is history preserved?**
   - Messages stored in MongoDB with full response data
   - Products/outfits serialized in responseData field
   - Frontend adapts data to V2 format on load

4. **What's next?**
   - Cloud storage for production (S3/Cloudinary)
   - Multiple image upload
   - Drag-and-drop support
   - Wardrobe integration
