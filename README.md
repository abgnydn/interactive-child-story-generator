# Interactive Children's Story Builder

A Proof-of-Concept (POC) mobile application that creates interactive children's stories using AI-generated text and images.

## Features

- Interactive story generation using Google Gemini AI
- AI-generated illustrations using Stability AI
- Simple, child-friendly interface
- Multiple-choice story progression
- Real-time story and image generation

## Prerequisites

- Node.js (v14 or higher)
- npm or yarn
- Expo CLI
- Google Gemini API key
- Stability AI API key

## Project Structure

```
child-story-generator/
├── frontend/           # React Native (Expo) frontend
└── backend/           # Node.js/Express backend
```

## Setup Instructions

### Backend Setup

1. Navigate to the backend directory:
   ```bash
   cd backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create a `.env` file in the backend directory with your API keys:
   ```
   GOOGLE_GEMINI_API_KEY=your_gemini_api_key_here
   STABILITY_AI_API_KEY=your_stability_ai_api_key_here
   PORT=3000
   ```

4. Start the backend server:
   ```bash
   node server.js
   ```

### Frontend Setup

1. Navigate to the frontend directory:
   ```bash
   cd frontend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Start the Expo development server:
   ```bash
   npm start
   ```

4. Use the Expo Go app on your mobile device to scan the QR code, or press 'i' for iOS simulator or 'a' for Android emulator.

## Usage

1. Launch the app
2. Tap "Start Story" to begin
3. Choose from the presented options to progress the story
4. Each choice generates new story text and an accompanying illustration
5. Continue until you reach the end of the story

## API Integration

- Google Gemini AI is used for generating story text and questions
- Stability AI is used for generating illustrations
- All API calls are handled through the backend server to protect API keys

## Notes

- This is a POC version with basic functionality
- API rate limits may apply based on your API key tiers
- The story generation is limited to a few iterations for the POC 