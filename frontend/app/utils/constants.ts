import { StyleChoice } from '../types';

// API Configuration
export const USE_MOCK_DATA = false;  // Set to false to use real API
export const API_URL = 'http://192.168.0.101:3000';  // Using your computer's IP address

// Story Styles
export const STORY_STYLES: StyleChoice[] = [
  {
    id: 'fantasy',
    title: 'Magical World',
    name: 'Magical World',
    description: 'Dragons, wizards, and enchanted creatures',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    prompt: 'fantasy adventure with magical elements',
    color: '#9C27B0',
    icon: 'auto-stories'
  },
  {
    id: 'space',
    title: 'Space Adventure',
    name: 'Space Adventure',
    description: 'Journey through the stars with aliens',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    prompt: 'space exploration sci-fi adventure',
    color: '#2196F3',
    icon: 'rocket'
  },
  {
    id: 'nature',
    title: 'Forest Explorer',
    name: 'Forest Explorer',
    description: 'Discover animals and plants in nature',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    prompt: 'nature exploration adventure',
    color: '#4CAF50',
    icon: 'park'
  },
  {
    id: 'ocean',
    title: 'Ocean World',
    name: 'Ocean World',
    description: 'Dive with friendly sea creatures',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    prompt: 'ocean adventure with sea creatures',
    color: '#00BCD4',
    icon: 'waves'
  }
];

// Character Types
export const CHARACTER_TYPES: StyleChoice[] = [
  {
    id: 'human',
    title: 'Brave Hero',
    name: 'Brave Hero',
    description: 'A courageous kid with special powers',
    imageUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=800',
    prompt: 'human protagonist',
    color: '#FF5722',
    icon: 'person'
  },
  {
    id: 'animal',
    title: 'Friendly Pet',
    name: 'Friendly Pet',
    description: 'A magical animal friend',
    imageUrl: 'https://images.unsplash.com/photo-1546182990-dffeafbe841d?w=800',
    prompt: 'animal protagonist',
    color: '#795548',
    icon: 'pets'
  },
  {
    id: 'robot',
    title: 'Robot Buddy',
    name: 'Robot Buddy',
    description: 'A helpful robot with cool gadgets',
    imageUrl: 'https://images.unsplash.com/photo-1535378620166-273708d44e4c?w=800',
    prompt: 'robot protagonist',
    color: '#607D8B',
    icon: 'smart-toy'
  },
  {
    id: 'magical',
    title: 'Magical Friend',
    name: 'Magical Friend',
    description: 'A magical creature with special powers',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    prompt: 'magical creature protagonist',
    color: '#E91E63',
    icon: 'auto-awesome'
  }
];

// Settings
export const SETTINGS: StyleChoice[] = [
  {
    id: 'forest',
    title: 'Enchanted Forest',
    name: 'Enchanted Forest',
    description: 'A magical forest with talking trees',
    imageUrl: 'https://images.unsplash.com/photo-1441974231531-c6227db76b6e?w=800',
    prompt: 'forest setting',
    color: '#8BC34A',
    icon: 'forest'
  },
  {
    id: 'castle',
    title: 'Royal Castle',
    name: 'Royal Castle',
    description: 'A grand castle with knights and princesses',
    imageUrl: 'https://images.unsplash.com/photo-1541872703-74c5e44368f9?w=800',
    prompt: 'castle setting',
    color: '#9C27B0',
    icon: 'castle'
  },
  {
    id: 'space',
    title: 'Space Station',
    name: 'Space Station',
    description: 'A futuristic space station with robots',
    imageUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?w=800',
    prompt: 'space station setting',
    color: '#3F51B5',
    icon: 'apartment'
  },
  {
    id: 'ocean',
    title: 'Underwater City',
    name: 'Underwater City',
    description: 'A city beneath the waves with mermaids',
    imageUrl: 'https://images.unsplash.com/photo-1507525428034-b723cf961d3e?w=800',
    prompt: 'underwater city setting',
    color: '#03A9F4',
    icon: 'water'
  }
];

// Themes
export const THEMES: StyleChoice[] = [
  {
    id: 'friendship',
    title: 'Friendship',
    name: 'Friendship',
    description: 'Making new friends and working together',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
    prompt: 'friendship theme',
    color: '#FF69B4',
    icon: 'favorite'
  },
  {
    id: 'courage',
    title: 'Courage',
    name: 'Courage',
    description: 'Being brave and facing fears',
    imageUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?w=800',
    prompt: 'courage theme',
    color: '#FFA500',
    icon: 'shield'
  },
  {
    id: 'discovery',
    title: 'Discovery',
    name: 'Discovery',
    description: 'Exploring new places and learning',
    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800',
    prompt: 'discovery theme',
    color: '#9370DB',
    icon: 'explore'
  },
  {
    id: 'kindness',
    title: 'Kindness',
    name: 'Kindness',
    description: 'Being kind and helping others',
    imageUrl: 'https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?w=800',
    prompt: 'kindness theme',
    color: '#98FB98',
    icon: 'volunteer-activism'
  }
];

// Storage Keys
export const STORIES_KEY = '@stories';

// Mock Story Data
export const MOCK_STORY_SEGMENT = {
  text: "Once upon a time, in a magical forest, there lived a brave hero named Alex. Alex loved to explore the enchanted woods and make friends with the magical creatures who lived there. One day, Alex discovered a mysterious glowing flower that seemed to be calling out for help.",
  imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
};

export const MOCK_QUESTION = "What should happen next?";

export const MOCK_CHOICES = [
  "Pick",
  "Leave",
  "Call",
  "Study"
];

export const VISUAL_STYLES: StyleChoice[] = [
  {
    id: 'vs1',
    title: 'Cartoon',
    name: 'Cartoon',
    description: 'Bright, simple, and friendly cartoon style.',
    imageUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=800',
    icon: 'mood',
    color: '#FFC107',
    prompt: 'simple cartoon style',
  },
  {
    id: 'vs2',
    title: 'Watercolor',
    name: 'Watercolor',
    description: 'Soft, blended colors like a watercolor painting.',
    imageUrl: 'https://images.unsplash.com/photo-1536924940846-227afb31e2a5?w=800',
    icon: 'brush',
    color: '#81D4FA',
    prompt: 'soft watercolor painting style',
  },
  {
    id: 'vs3',
    title: 'Pixel Art',
    name: 'Pixel Art',
    description: 'Retro pixelated video game look.',
    imageUrl: 'https://images.unsplash.com/photo-1593438359719-1a6b0a48849e?w=800',
    icon: 'grid-on',
    color: '#9575CD',
    prompt: 'pixel art style',
  },
  {
    id: 'vs4',
    title: 'Detailed Illustration',
    name: 'Detailed Illustration',
    description: 'More detailed and intricate drawings.',
    imageUrl: 'https://images.unsplash.com/photo-1579783900882-c0d3dad7b119?w=800',
    icon: 'palette',
    color: '#EF5350',
    prompt: 'detailed storybook illustration style',
  },
]; 