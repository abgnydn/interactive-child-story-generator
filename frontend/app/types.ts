import { MaterialIcons } from '@expo/vector-icons';

export interface StorySegment {
  text: string;
  imageUrl?: string;
}

export interface Story {
  id: string;
  title: string;
  segments: StorySegment[];
  createdAt: string;
  lastUpdated: string;
}

export interface StyleChoice {
  id: string;
  title: string;
  name: string;
  description: string;
  imageUrl: string;
  prompt: string;
  color: string;
  icon: keyof typeof MaterialIcons.glyphMap;
}

export interface ApiResponse {
  success: boolean;
  data?: Story;
  error?: string;
  story?: string;
  imageUrl?: string;
  question?: string;
  choices?: string[];
}

export type StoryStep = 'style' | 'character' | 'setting' | 'theme' | 'story' | 'complete'; 