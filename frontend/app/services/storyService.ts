// No longer need TensorFlow imports
// import * as tf from '@tensorflow/tfjs';
// import '@tensorflow/tfjs-react-native';

// Base URL for your backend server
// TODO: Replace with your actual backend URL, potentially from environment variables
const API_BASE_URL = 'http://localhost:3000'; // Make sure this matches your backend port

// Removed initTF function as it's no longer needed

// Function to start a new story by calling the backend
export const startStory = async (style: string, character: string, setting: string, theme: string): Promise<{
  success: boolean;
  sessionId?: string;
  story?: string;
  imageUrl?: string;
  question?: string;
  choices?: string[];
  error?: string;
}> => {
  try {
    console.log('Calling /start-story with:', { style, character, setting, theme });
    const response = await fetch(`${API_BASE_URL}/start-story`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ style, character, setting, theme }),
    });

    const responseData = await response.json();
    console.log('/start-story response status:', response.status);
    console.log('/start-story response data:', responseData);

    if (!response.ok) {
      throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }
    // Backend already includes success: true on OK response
    return responseData; 

  } catch (error: unknown) {
    console.error('Error starting story:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return { success: false, error: `Failed to start story: ${errorMessage}` }; 
  }
};


// Generate story continuation by calling the backend
export const generateStorySegment = async (
  sessionId: string, // Pass the session ID obtained from startStory
  userChoice: string
): Promise<{ 
  success: boolean;
  story?: string;
  imageUrl?: string;
  question?: string;
  choices?: string[];
  error?: string;
  retryAfter?: number; // For potential rate limits
}> => {
  // Ensure sessionId is provided
  if (!sessionId) {
    console.error('generateStorySegment called without sessionId');
    return { success: false, error: 'Session ID is required' };
  }
  
  try {
    console.log('Calling /generate-next with:', { sessionId, userChoice });
    const response = await fetch(`${API_BASE_URL}/generate-next`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ sessionId, userChoice }), // Send session ID and choice
    });

    const responseData = await response.json();
    console.log('/generate-next response status:', response.status);
    console.log('/generate-next response data:', responseData);

    if (!response.ok) {
        // Handle specific errors like rate limits (429)
        if (response.status === 429) {
            console.warn('Rate limit hit, retrying later.');
            // Ensure the response structure matches the Promise return type
            return { 
                success: false, 
                error: responseData.error || 'Rate limited', 
                retryAfter: responseData.retryAfter 
            };
        }
        // Handle other errors
        throw new Error(responseData.error || `HTTP error! status: ${response.status}`);
    }

    // Backend already includes success: true on OK response
    return responseData;

  } catch (error: unknown) {
    console.error('Error generating story segment:', error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    // Return an error structure for the UI
    return { success: false, error: `Failed to generate next segment: ${errorMessage}` }; 
  }
}; 