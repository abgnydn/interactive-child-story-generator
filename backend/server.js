import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import cors from 'cors';
// Use Together SDK for text and images
import Together from 'together-ai';
import Redis from 'ioredis'; // <<< Import ioredis
import { v4 as uuidv4 } from 'uuid'; // <<< Uncomment UUID import

const app = express();
const port = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// --- API Key Checks & Initialization ---

// Together AI API Key (for Text & Images)
if (!process.env.TOGETHER_API_KEY) {
  console.error('Error: TOGETHER_API_KEY is not configured in .env file');
  process.exit(1);
}
const togetherApiKey = process.env.TOGETHER_API_KEY;
console.log(`TOGETHER_API_KEY loaded: ${togetherApiKey ? '...' + togetherApiKey.slice(-4) : 'Not Loaded or Empty'}`);

// Initialize Together client (used for both text and images)
const together = new Together({ apiKey: togetherApiKey });

// --- Redis Session Storage Setup ---
// const storySessions = new Map(); // <<< Remove in-memory Map

// Use REDIS_URL from environment variables (provided by Render)
const redisUrl = process.env.REDIS_URL;
if (!redisUrl) {
  console.warn('Warning: REDIS_URL is not set. Session storage will not be persistent. Falling back to basic in-memory store for local dev (NOT RECOMMENDED FOR PRODUCTION).');
  // Provide a simple Map fallback for local development if Redis isn't configured
  // NOTE: This fallback WILL lose data on server restarts.
  global.storySessions = new Map(); 
  global.redisClient = null; // No Redis client
} else {
  console.log('Connecting to Redis...');
  const redis = new Redis(redisUrl, {
    // Optional: Configure TLS if needed for your Redis provider
    // tls: { rejectUnauthorized: false }, 
    maxRetriesPerRequest: 3, 
    enableReadyCheck: true,
    showFriendlyErrorStack: process.env.NODE_ENV !== 'production' // More detail in dev
  });

  redis.on('connect', () => console.log('Redis connected successfully.'));
  redis.on('error', (err) => console.error('Redis connection error:', err));
  redis.on('reconnecting', () => console.log('Redis reconnecting...'));
  redis.on('end', () => console.log('Redis connection ended.'));

  global.redisClient = redis; // Make client available globally (or pass via req context)
  global.storySessions = null; // Clear the Map reference if Redis is used
}

// Helper to get the active session storage (Redis or fallback Map)
// This avoids needing `global.` everywhere but keeps the fallback logic
const sessionStore = global.redisClient || global.storySessions; 
const SESSION_TTL_SECONDS = 60 * 60 * 2; // 2 hours session expiry

// --- Helper Functions ---

// Function to generate story text using Together AI (Llama 3.3 JSON Mode)
async function generateText(prompt, isFinalStep = false) {
  try {
    const promptType = isFinalStep ? 'Conclusion' : 'Continuation';
    console.log(`Generating text (${promptType}) via Together AI (Llama 3.3 JSON Mode) with prompt:`, prompt.substring(0, 150) + '...');

    let finalPrompt;
    const responseFormat = { type: "json_object" };
    let maxTokens = 250;

    if (isFinalStep) {
        // Prompt for conclusion - ask for JSON with ONLY a "story" key
        finalPrompt = `[INST] You are a creative children's story writer concluding a story based on the user's input. Write a short concluding paragraph (around 50-70 words).

User input/previous context:
${prompt}

Your response MUST be a valid JSON object containing ONLY the key "story".
"story": string (The concluding story paragraph).

Example JSON output:
{
  "story": "And so, Lily and the fairy became the best of friends, sharing many more adventures."
}

Output ONLY the JSON object. [/INST]`;
        maxTokens = 150; // Less needed for just text in one key
    } else {
        // Prompt asking for JSON output (story, question, choices)
        finalPrompt = `[INST] You are a creative children's story writer. Write a short story continuation (around 50-70 words) based on the user's input.

User input/context:
${prompt}

Your response MUST be a valid JSON object containing ONLY the following keys: "story", "question", and "choices".
"story": string (The story continuation text).
"question": string (A short question asking what the main character should do next?).
"choices": array of 3 strings (Three short action choices).

Example JSON output:
{
  "story": "Lily looked closer and saw tiny wings fluttering inside the jar!",
  "question": "Should Lily open the jar?",
  "choices": ["Open", "Wait", "Shake"]
}

Output ONLY the JSON object. [/INST]`;
         maxTokens = 250; // Keep original token count
    }

    const completion = await together.chat.completions.create({
        model: "meta-llama/Llama-3.3-70B-Instruct-Turbo-Free",
        messages: [
            { role: "user", content: finalPrompt }
        ],
        temperature: 0.7,
        max_tokens: maxTokens,
        response_format: responseFormat // Always json_object now
    });

    if (completion.choices && completion.choices[0] && completion.choices[0].message && completion.choices[0].message.content) {
        const jsonString = completion.choices[0].message.content.trim();

        if (isFinalStep) {
            console.log('Together AI Text generation successful (Received JSON for Conclusion):', jsonString);
            try {
                // Parse the JSON string for the conclusion
                const conclusionData = JSON.parse(jsonString);
                if (conclusionData && typeof conclusionData.story === 'string' && conclusionData.story.length > 0) {
                    console.log('Parsed Conclusion JSON successfully:', conclusionData);
                    // Return structure expected by generateStorySegment for final step
                    return { story: conclusionData.story, question: null, choices: [] };
                } else {
                    console.error('Parsed Conclusion JSON does not have the expected structure:', conclusionData);
                    throw new Error('Invalid JSON structure received for conclusion');
                }
            } catch (parseError) {
                 console.error('Error parsing Conclusion JSON response from AI:', parseError, 'Raw string:', jsonString);
                 // Return fallback structure for final step
                 return { story: "And they all lived happily ever after... (almost!).", question: null, choices: [] };
            }
        } else { // Handle steps 1-4 (JSON with story, question, choices)
            console.log('Together AI Text generation successful (Received JSON string):', jsonString);
            try {
                const storyData = JSON.parse(jsonString);
                if (storyData && typeof storyData.story === 'string' && typeof storyData.question === 'string' && Array.isArray(storyData.choices) && storyData.choices.length >= 3) {
                    storyData.choices = storyData.choices.slice(0, 3).map(String);
                    while(storyData.choices.length < 3) storyData.choices.push("...");
                    console.log('Parsed JSON successfully:', storyData);
                    return storyData;
                } else {
                    console.error('Parsed JSON does not have the expected structure:', storyData);
                    throw new Error('Invalid JSON structure received');
                }
            } catch (parseError) {
                console.error('Error parsing JSON response from AI:', parseError, 'Raw string:', jsonString);
                 return { story: "The story reached a confusing point!", question: "Try again?", choices: ["Yes", "No", "Maybe"] };
            }
        }
    } else {
        console.error('Together AI API Error (Text): Unexpected response structure', completion);
        throw new Error('Unexpected response structure from Together AI');
    }

  } catch (error) {
    const errorDetails = error.response ? { status: error.response.status, data: error.response.data } : error.message;
    console.error(`Error calling Together AI API (Text - Llama 3.3 ${isFinalStep ? 'Conclusion JSON' : 'JSON'}):`, errorDetails);
     // Return fallback structure appropriate for the step
     return {
         story: "Oops! The connection fizzled.",
         question: isFinalStep ? null : "Try again?",
         choices: isFinalStep ? [] : ["Yes", "No", "Maybe"]
     };

  }
}

// Function to generate an image using Together AI (FLUX Schnell Free)
// Add visualStyle as an optional parameter
async function generateImage(textPrompt, visualStyle = 'simple cartoon style') { // Default style
  const fallbackImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

  if (!textPrompt || textPrompt.trim().length === 0) {
      console.warn('generateImage called with empty prompt, returning fallback.');
      return fallbackImageUrl;
  }

  try {
    console.log(`Generating image via Together AI (FLUX Schnell Free) with prompt: "${textPrompt.substring(0, 80)}..." and style: "${visualStyle}"`);
    // Incorporate the visualStyle into the prompt
    const togetherPrompt = `Children's storybook illustration, ${visualStyle}: ${textPrompt}`;
    console.log('Image Gen Prompt:', togetherPrompt);

    const response = await together.images.create({
        model: "black-forest-labs/FLUX.1-schnell-Free",
        prompt: togetherPrompt,
        n: 1,
        steps: 4,
        response_format: "b64_json"
    });

    if (response.data && response.data[0] && response.data[0].b64_json) {
        console.log('Together AI Image generation successful.');
        return `data:image/jpeg;base64,${response.data[0].b64_json}`;
    } else {
      console.error('Together AI Image Generation Failed or Unexpected Response:', response);
      return fallbackImageUrl;
    }

  } catch (error) {
     const errorMessage = error.response?.data?.error || error.message || 'Unknown error';
     console.error('Error calling Together AI Image API:', errorMessage);
     if (typeof errorMessage === 'string' && errorMessage.includes('quota')) {
        console.warn('Together AI quota may be exceeded.')
     }
     return fallbackImageUrl;
  }
}

// --- API Endpoints --- 

// Health check endpoint
app.get('/health', (req, res) => {
  console.log('Health check requested');
  res.json({ status: 'ok', timestamp: new Date().toISOString(), textGenerator: 'TogetherAI', imageGenerator: 'TogetherAI' });
});

// Endpoint to start a new story session
app.post('/start-story', async (req, res) => {
  try {
    console.log('Received start-story request:', req.body);
    const { style, character, setting, theme, visualStylePrompt } = req.body;

    if (!style || !character || !setting || !theme || !visualStylePrompt) {
        console.warn('Missing required fields for start-story:', { style, character, setting, theme, visualStylePrompt });
        return res.status(400).json({ success: false, error: 'Missing required fields: style, character, setting, theme, visualStylePrompt' });
    }
    const effectiveTheme = theme || '';

    // Ensure Redis is connected (Keep this check)
    if (!global.redisClient || global.redisClient.status !== 'ready') {
        console.error('Redis connection is not ready');
        return res.status(500).json({ success: false, error: 'Redis connection is not ready' });
    }

    // Use UUID for session ID generation (ensure uuid is installed: npm install uuid @types/uuid)
    // If you haven't installed uuid yet, run: npm install uuid @types/uuid
    // Then uncomment the next two lines and comment out the Date.now line
    // import { v4 as uuidv4 } from 'uuid'; 
    const sessionId = uuidv4(); // <<< Use UUID
    // const sessionId = Date.now().toString() + Math.random().toString(36).substring(2, 7); // <<< Comment out fallback
    console.log('Created session ID:', sessionId);
    
    const sessionData = {
      style,
      character,
      setting,
      theme: effectiveTheme,
      visualStylePrompt,
      stepCount: 1, 
      segments: [],
      // lastUpdated: new Date() // Less critical with TTL, Redis handles expiry
    };

    // Use Redis directly (No if(useRedis) check needed)
    await global.redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', SESSION_TTL_SECONDS);
    console.log(`Session ${sessionId} created and stored in Redis.`);

    console.log('Generating first story segment (Step 1) using Together AI...');
    const initialPrompt = `Start a children's story (around 50-70 words, simple language) with:\nStyle: ${style}\nCharacter: ${character}\nSetting: ${setting}\nTheme: ${effectiveTheme}`;

    console.log('Using prompt for Together AI text generation:', initialPrompt);

    const storyData = await generateText(initialPrompt);

    // Check if storyData has fallback content due to error
    if (!storyData || storyData.story.includes("Oops")) { // Basic check for error markers
        console.warn('Text generation returned fallback/error data', storyData);
    }

    console.log('Generating first segment image using Together AI...');
    const firstImageUrl = await generateImage(storyData.story, visualStylePrompt);

    // <<< Update session in Redis/Map with first segment >>>
    sessionData.segments.push({ // Update the local object first
        text: storyData.story,
        imageUrl: firstImageUrl
    });
    if (global.redisClient) {
         // Re-set the updated data in Redis, keeping the TTL
         // Using SET KEEPTTL (requires Redis 6.0+) would be more efficient if available
         // For simplicity, we just SET with the original TTL again.
        await global.redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', SESSION_TTL_SECONDS); 
        console.log(`Session ${sessionId} updated in Redis with first segment.`);
      } else {
        // Update the map
        global.storySessions.set(sessionId, sessionData);
        console.log(`Session ${sessionId} updated in fallback Map with first segment.`);
    }

    console.log('Sending response to client for Step 1');
    res.json({
      success: true,
      sessionId,
      story: storyData.story,
      imageUrl: firstImageUrl,
      question: storyData.question,
      choices: storyData.choices
    });
  } catch (error) {
    console.error('Error in /start-story:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to start story due to an internal server error.'
    });
  }
});


// Endpoint to generate the next story segment
app.post('/generate-next', async (req, res) => {
  try {
    const { sessionId, userChoice } = req.body;
    console.log(`Received /generate-next request with sessionId: ${sessionId}, userChoice: ${userChoice}`);

    if (!sessionId || !userChoice) {
        console.warn('/generate-next missing sessionId or userChoice');
        return res.status(400).json({ success: false, error: 'Missing sessionId or userChoice' });
    }

    // Ensure Redis is connected (Keep this check)
    if (!global.redisClient || global.redisClient.status !== 'ready') {
        console.error('Redis connection is not ready');
        return res.status(500).json({ success: false, error: 'Redis connection is not ready' });
    }

    // Get session data directly from Redis (No if(useRedis) check needed)
    const sessionDataString = await global.redisClient.get(sessionId);
    if (!sessionDataString) {
        console.warn(`Session ${sessionId} not found in Redis.`);
        return res.status(404).json({ success: false, error: 'Story session not found or has expired.' });
    }
    const sessionData = JSON.parse(sessionDataString);

    console.log(`Continuing story for session ${sessionId}. Step: ${sessionData.stepCount}`);
    const currentStoryText = sessionData.segments[sessionData.stepCount - 1].text;
    const nextPrompt = `Continue this children's story based on the user choice.
Story So Far:
${currentStoryText}

User chose: "${userChoice}".

Write the next short part (around 50-70 words). Maintain style: ${sessionData.style}, character: ${sessionData.character}, setting: ${sessionData.setting}, theme: ${sessionData.theme}.`;

    sessionData.stepCount += 1;
    const isFinalStep = sessionData.stepCount >= 5;

    const result = await generateStorySegment(sessionData, nextPrompt, isFinalStep);
    if (result.error) {
        throw new Error(result.error);
    }

    sessionData.segments.push({
      text: result.story,
      imageUrl: result.imageUrl
    });
    sessionData.lastUpdated = new Date().toISOString();

    // Store updated session data directly in Redis (No if(useRedis) check needed)
    await global.redisClient.set(sessionId, JSON.stringify(sessionData), 'EX', SESSION_TTL_SECONDS);
    console.log(`Session ${sessionId} updated in Redis. Step: ${sessionData.stepCount}`);
    
    res.json({
      success: true,
      story: result.story,
      imageUrl: result.imageUrl,
      question: result.question,
      choices: result.choices
    });

  } catch (error) {
    // Log error with session ID if possible
    const sid = req.body?.sessionId || 'unknown';
    console.error(`Error in /generate-next for session ${sid}:`, error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate next part of the story due to an internal server error.'
    });
  }
});


// Helper function to generate subsequent story segments
async function generateStorySegment(session, context, userChoice) {
  try {
    const currentStep = session.stepCount || 2; // Default to 2 if somehow missing
    const isFinalStep = currentStep >= 5; // Treat step 5 (or higher just in case) as final

    console.log(`Generating story ${isFinalStep ? 'conclusion' : 'continuation'} (Step ${currentStep}) using Together AI...`);
    const { style, character, setting, theme, visualStylePrompt } = session;

    // Prepare prompt (context might differ slightly for conclusion)
    const continuationPrompt = isFinalStep ?
        `Conclude this children's story based on the user's last choice.
Story So Far:
        ${context}
        
User chose: "${userChoice}".

Write a short concluding paragraph (around 50-70 words). Maintain style: ${style}, character: ${character}, setting: ${setting}, theme: ${theme}.`
      :
        `Continue this children's story based on the user choice.
Story So Far:
${context}

User chose: "${userChoice}".

Write the next short part (around 50-70 words). Maintain style: ${style}, character: ${character}, setting: ${setting}, theme: ${theme}.`;

    console.log('Using prompt for Together AI text generation:', continuationPrompt);

    // Call generateText, passing isFinalStep
    const storyData = await generateText(continuationPrompt, isFinalStep);

    // ... (check for errors in storyData) ...
     if (!storyData || (!storyData.story && !isFinalStep)) { // Check if story text is missing (except for final step maybe?)
        console.warn('generateText returned invalid data within generateStorySegment');
        return { 
             story: "Error generating text.", 
             question: isFinalStep ? null : "Try again?", 
             choices: isFinalStep ? [] : ["Yes", "No", "Maybe"],
             imageUrl: fallbackImageUrl
           }; 
    }

    console.log(`Generating image for ${isFinalStep ? 'conclusion' : 'continuation'} using Together AI...`);
    // Use the stored visual style
    const imageUrl = await generateImage(storyData.story, session.visualStylePrompt);

    // Return data (question/choices will be null/empty if final)
    return {
      story: storyData.story,
      imageUrl: imageUrl,
      question: storyData.question,
      choices: storyData.choices
    };

  } catch (error) {
    console.error('Error within generateStorySegment helper (TogetherAI):', error);
    return { // Return fallback structure on unexpected error
      story: "Oops! The story generation hit a snag.",
      imageUrl: fallbackImageUrl,
      question: "What should happen next?",
      choices: ["Retry", "Explore", "Wait"]
    };
  }
}

// Declare fallbackImageUrl globally
const fallbackImageUrl = "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8z8BQDwAEhQGAhKmMIQAAAABJRU5ErkJggg==";

// Start server
app.listen(port, () => {
  console.log(`Node.js backend server running on port ${port}`);
  console.log('Using Together AI (Llama 3.3 Instruct Turbo Free JSON Mode) for text generation.');
  console.log('Using Together AI (FLUX Schnell Free) for image generation.');
  if (!togetherApiKey) console.warn("Warning: TOGETHER_API_KEY is missing!");
});