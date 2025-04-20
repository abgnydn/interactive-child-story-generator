import AsyncStorage from '@react-native-async-storage/async-storage';
import { Story } from '../types';
import { STORIES_KEY } from './constants';

/**
 * Saves a story to AsyncStorage
 */
export const saveStory = async (story: Story): Promise<void> => {
  try {
    const existingStories = await getStories();
    
    // Check if the story already exists
    const existingIndex = existingStories.findIndex(s => s.id === story.id);
    
    let updatedStories;
    if (existingIndex >= 0) {
      // Update existing story
      updatedStories = [...existingStories];
      updatedStories[existingIndex] = story;
    } else {
      // Add new story
      updatedStories = [...existingStories, story];
    }
    
    await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(updatedStories));
  } catch (error) {
    console.error('Error saving story:', error);
    throw error;
  }
};

/**
 * Retrieves all stories from AsyncStorage
 */
export const getStories = async (): Promise<Story[]> => {
  try {
    const stories = await AsyncStorage.getItem(STORIES_KEY);
    return stories ? JSON.parse(stories) : [];
  } catch (error) {
    console.error('Error getting stories:', error);
    return [];
  }
};

/**
 * Deletes a story from AsyncStorage
 */
export const deleteStory = async (storyId: string): Promise<void> => {
  try {
    const stories = await getStories();
    const updatedStories = stories.filter(story => story.id !== storyId);
    await AsyncStorage.setItem(STORIES_KEY, JSON.stringify(updatedStories));
  } catch (error) {
    console.error('Error deleting story:', error);
    throw error;
  }
};

/**
 * Creates a new story with the given title
 */
export const createNewStory = (title: string): Story => {
  const now = new Date().toISOString();
  return {
    id: Date.now().toString(),
    title,
    segments: [],
    createdAt: now,
    lastUpdated: now
  };
}; 