import React, { useState, useEffect, useRef } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  Image,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Dimensions,
  Animated,
  Alert,
  TextInput,
  Platform,
  Pressable,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { StorySegment, ApiResponse, Story, StyleChoice, StoryStep as ExistingStoryStep } from '../types';
import { saveStory, createNewStory } from '../utils/storage';
import * as ScreenOrientation from 'expo-screen-orientation';
import { 
  STORY_STYLES, 
  CHARACTER_TYPES, 
  SETTINGS, 
  THEMES, 
  VISUAL_STYLES,
  USE_MOCK_DATA,
  API_URL
} from '../utils/constants';

import StorySegmentComponent from '../components/StorySegment';
import LoadingSpinner from '../components/LoadingSpinner';
import SkeletonSegmentComponent from '../components/SkeletonSegment';
import UserChoiceBubble from '../components/UserChoiceBubble';

// Add 'visualStyle' to the possible steps
type StoryStep = ExistingStoryStep | 'visualStyle';

const { width } = Dimensions.get('window');


const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' // Use local backend in development
  : 'https://interactive-child-story-generator.onrender.com'; // Use deployed backend in production


export default function StoryBuilder(): JSX.Element {
  const [currentStep, setCurrentStep] = useState<StoryStep>('style');
  const [selectedChoices, setSelectedChoices] = useState<StyleChoice[]>([]);
  const [story, setStory] = useState<Story | null>({
    id: '',
    title: '',
    segments: [],
    lastUpdated: new Date().toISOString(),
    createdAt: new Date().toISOString()
  });
  const [isLoading, setIsLoading] = useState(false);
  const [currentQuestion, setCurrentQuestion] = useState<string>('');
  const [currentChoices, setCurrentChoices] = useState<string[]>([]);
  const [storyTitle, setStoryTitle] = useState<string>('');
  const [fadeAnim] = useState(new Animated.Value(0));
  const [activeViews, setActiveViews] = useState<Record<number, 'story' | 'question'>>({});
  const [error, setError] = useState<string | null>(null);
  const [sessionId, setSessionId] = useState<string | null>(null);
  const [stylePrompt, setStylePrompt] = useState<string>('');
  const [isRateLimited, setIsRateLimited] = useState(false);
  const [retryCountdown, setRetryCountdown] = useState<number>(0);
  const scrollViewRef = useRef<ScrollView>(null);

  useEffect(() => {
    lockOrientation();
    fadeIn();
  }, []);

  useEffect(() => {
    if (scrollViewRef.current && story?.segments && story.segments.length > 0) {
      setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 250);
    }
  }, [story?.segments]);

  const lockOrientation = async () => {
    try {
      await ScreenOrientation.lockAsync(
        ScreenOrientation.OrientationLock.PORTRAIT_UP
      );
    } catch (error) {
      console.error('Error locking orientation:', error);
    }
  };

  const fadeIn = (): void => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 500,
      useNativeDriver: true,
    }).start();
  };

  const getCurrentChoices = (): StyleChoice[] => {
    switch (currentStep) {
      case 'style':
        return STORY_STYLES;
      case 'character':
        return CHARACTER_TYPES;
      case 'setting':
        return SETTINGS;
      case 'theme':
        return THEMES;
      case 'visualStyle':
        return VISUAL_STYLES;
      default:
        return [];
    }
  };

  const handleStyleChoice = (choice: StyleChoice) => {
    setSelectedChoices(prev => [...prev, choice]);
    
    if (currentStep === 'style') {
      setCurrentStep('character');
    } else if (currentStep === 'character') {
      setCurrentStep('setting');
    } else if (currentStep === 'setting') {
      setCurrentStep('theme');
    } else if (currentStep === 'theme') {
      setCurrentStep('visualStyle');
    } else if (currentStep === 'visualStyle') {
      setCurrentStep('story');
      startStory();
    }
  };

  const handleRateLimitError = (retryAfter: number) => {
    setIsRateLimited(true);
    setRetryCountdown(retryAfter);
    const countdownInterval = setInterval(() => {
      setRetryCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(countdownInterval);
          setIsRateLimited(false);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startStory = async () => {
    setIsLoading(true);
    setError(null);
    setIsRateLimited(false);
    
    try {
      // Create a new story if we don't have one yet
      if (!story) {
        const newStory = createNewStory(storyTitle || 'My Adventure Story');
        setStory(newStory);
      }
      
      // Get the prompts from the selected choices
      const stylePrompt = selectedChoices[0]?.prompt || '';
      const characterPrompt = selectedChoices[1]?.prompt || '';
      const settingPrompt = selectedChoices[2]?.prompt || '';
      const themePrompt = selectedChoices[3]?.prompt || '';
      const visualStylePrompt = selectedChoices[4]?.prompt || 'simple cartoon style';
      
      // Start a new story session
      const response = await fetch(`${API_BASE_URL}/start-story`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          style: stylePrompt,
          character: characterPrompt,
          setting: settingPrompt,
          theme: themePrompt,
          visualStylePrompt: visualStylePrompt
        }),
      });

      // Handle rate limit error first
      if (response.status === 429) {
        const data = await response.json();
        handleRateLimitError(data.retryAfter || 30);
        throw new Error('Rate limit exceeded. Please try again later.');
      }

      // Handle other non-200 responses
      if (!response.ok) {
        throw new Error('Failed to start story session');
      }

      const data = await response.json();
      
      if (!data.success) {
        throw new Error(data.error || 'Failed to start story');
      }

      // Store the session ID
      setSessionId(data.sessionId);
      
      // Ensure we have a valid story object
      const currentStory = story || createNewStory(storyTitle || 'My Adventure Story');
      
      // Ensure segments array exists
      if (!currentStory.segments) {
        currentStory.segments = [];
      }
      
      // Update the story with the first segment
      const updatedStory = {
        ...currentStory,
        segments: [...currentStory.segments, {
          text: data.story || "Once upon a time, there was a magical adventure waiting to happen.",
          imageUrl: data.imageUrl || "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
        }],
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Updated story:', updatedStory);
      setStory(updatedStory);
      await saveStory(updatedStory);
      
      if (data.question && data.choices) {
        setCurrentQuestion(data.question);
        setCurrentChoices(data.choices);
        
        // Initialize the view state for the new segment
        setActiveViews(prev => ({
          ...prev,
          [updatedStory.segments.length - 1]: 'story'
        }));
      } else {
        // Set default question and choices if not provided
        setCurrentQuestion("What should happen next?");
        setCurrentChoices(["Explore", "Discover", "Adventure"]);
        
        // Initialize the view state for the new segment
        setActiveViews(prev => ({
          ...prev,
          [updatedStory.segments.length - 1]: 'story'
        }));
      }
    } catch (error) {
      console.error('Error starting story:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate story');
      // Only show alert if not rate limited
      if (!isRateLimited) {
        Alert.alert(
          'Error',
          'Failed to generate story. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleChoice = async (choice: string): Promise<void> => {
    if (!story || !story.segments || story.segments.length === 0 || !sessionId) {
      console.error('Cannot handle choice: prerequisite missing');
      return;
    }

    // --- Immediate UI Update --- 
    const lastSegmentIndex = story.segments.length - 1;
    const updatedSegments = [...story.segments];
    // Add the choice text to the segment the user just read
    updatedSegments[lastSegmentIndex] = { 
      ...updatedSegments[lastSegmentIndex],
      userChoiceText: choice 
    };

    // Update story state immediately with the choice text added to the last segment
    // Also clear current question/choices immediately
    setStory(prev => prev ? { ...prev, segments: updatedSegments } : null);
    setCurrentQuestion(''); 
    setCurrentChoices([]);
    // ------------------------

    setIsLoading(true); 
    setIsRateLimited(false);
    
    try {
      // --- API Call --- 
      const response = await fetch(`${API_BASE_URL}/generate-next`, {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify({ sessionId, userChoice: choice }),
      });

      const data = await response.json();
      if (!data.success) { throw new Error(data.error || 'Failed to generate segment'); }
      // ----------------------------

      // --- Update with New Segment --- 
      const newSegment: StorySegment = {
        text: data.story || "The story continues...",
        imageUrl: data.imageUrl || undefined, 
        // userChoiceText is NOT added here 
      };
      
      // Append the NEW segment, set NEW question/choices
      setStory(prev => prev ? { 
        ...prev, 
        segments: [...prev.segments, newSegment] 
      } : null);
      setCurrentQuestion(data.question || 'What should happen next?');
      setCurrentChoices(data.choices || []);
      // ----------------------------

    } catch (error) {
      console.error('Error generating next segment:', error);
      setError(error instanceof Error ? error.message : 'Failed to generate story segment');
      // Restore question/choices if API failed?
      // Maybe set currentQuestion = "Error fetching next part... Try again?" and provide limited choices?
      // Or revert the userChoiceText addition?
      // For now, just show alert.
      if (!isRateLimited) {
        Alert.alert(
          'Error',
          'Failed to generate the next part of your story. Please try again.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinishEarly = async () => {
    if (!story) return;
    
    Alert.alert(
      'Finish Story',
      'Are you sure you want to finish the story early?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Finish',
          onPress: async () => {
            try {
              // Add a conclusion segment
              const conclusionSegment: StorySegment = {
                text: "And so, the adventure came to an end. The character had learned valuable lessons about friendship, courage, and kindness. It was a journey that would be remembered forever.",
                imageUrl: "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
              };
              
              // Ensure story has an ID
              const storyWithId = story.id ? story : {
                ...story,
                id: Date.now().toString(),
                title: storyTitle || 'My Adventure Story'
              };
              
              // Ensure segments array exists
              if (!storyWithId.segments) {
                storyWithId.segments = [];
              }
              
              const updatedStory = {
                ...storyWithId,
                segments: [...storyWithId.segments, conclusionSegment],
                lastUpdated: new Date().toISOString()
              };
              
              console.log('Finishing story with conclusion:', updatedStory);
              await saveStory(updatedStory);
              
              // Navigate to the story viewer
              router.push(`/story-viewer/${updatedStory.id}`);
            } catch (error) {
              console.error('Error finishing story:', error);
              Alert.alert('Error', 'Failed to finish story. Please try again.');
            }
          },
        },
      ]
    );
  };

  const handleCreateNew = () => {
    setCurrentStep('style');
    setSelectedChoices([]);
    setStory(null);
    setCurrentQuestion('');
    setCurrentChoices([]);
    setStoryTitle('');
    setActiveViews({});
  };

  const toggleSegmentView = (index: number) => {
    setActiveViews(prev => ({
      ...prev,
      [index]: prev[index] === 'story' ? 'question' : 'story'
    }));
  };

  const renderStepTitle = (step: string) => {
    switch (step) {
      case 'style':
        return 'What kind of story do you want?';
      case 'character':
        return 'Who is the main character?';
      case 'setting':
        return 'Where does the story take place?';
      case 'theme':
        return 'What is the theme of the story?';
      case 'visualStyle':
        return 'Choose a Visual Style';
      case 'story':
        return story?.title || 'Your Story';
      case 'complete':
        return 'Story Complete!';
      default:
        return '';
    }
  };

  // Function to handle speaking text using browser's TTS
  const speakText = (text: string) => {
    if (Platform.OS === 'web') {
      if ('speechSynthesis' in window && text) {
        window.speechSynthesis.cancel(); // Cancel previous speech
        const utterance = new SpeechSynthesisUtterance(text);
        window.speechSynthesis.speak(utterance);
      } else {
        if (!text) console.warn('Attempted to speak empty text.');
        else console.warn('Browser Speech Synthesis not supported.');
      }
    } else {
      console.log('Speech Synthesis is only implemented for web.');
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: renderStepTitle(currentStep),
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {['style', 'character', 'setting', 'theme', 'visualStyle'].includes(currentStep) ? (
          <View style={styles.content}>
            <Text style={styles.stepTitle}>{renderStepTitle(currentStep)}</Text>
            <ScrollView contentContainerStyle={styles.choicesGrid}>
              {getCurrentChoices().map((choice) => (
                <View key={choice.id} style={styles.card}>
                  <View style={[styles.cardImage, { backgroundColor: choice.color + '20' }]}>
                    <MaterialIcons name={choice.icon} size={56} color={choice.color} /> 
                    <Text style={[styles.imageTitle, { color: choice.color }]}>{choice.name}</Text>
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={styles.cardDescription}>{choice.description}</Text>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: choice.color }]}
                      onPress={() => handleStyleChoice(choice)}
                    >
                      <MaterialIcons name="check-circle-outline" size={20} color="white" />
                      <Text style={styles.buttonText}>Select</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              ))}
            </ScrollView>
          </View>
        ) : currentStep === 'story' && story ? (
          <View style={styles.storyRenderContainer}>
            <ScrollView ref={scrollViewRef} contentContainerStyle={styles.storyScrollContent}>
              {isLoading && (!story.segments || story.segments.length === 0) ? (
                <View style={styles.loadingContainer}>
                  <LoadingSpinner message="Generating your story..." />
                </View>
              ) : (
                story.segments?.map((segment, index) => (
                  <React.Fragment key={index}>
                    <StorySegmentComponent
                      segment={segment}
                      index={index}
                      question={index === story.segments.length - 1 ? currentQuestion : undefined}
                      choices={index === story.segments.length - 1 ? currentChoices : undefined}
                      onChoiceSelect={handleChoice} 
                      speakText={speakText} 
                    />
                    {segment.userChoiceText && (
                      <UserChoiceBubble 
                        key={`choice-${index}`} 
                        text={segment.userChoiceText} 
                      />
                    )}
                  </React.Fragment>
                ))
              )}
              
              {isLoading && story.segments && story.segments.length > 0 && (
                <SkeletonSegmentComponent />
              )}
            </ScrollView>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={styles.finishButton}
                onPress={handleFinishEarly}
              >
                <MaterialIcons name="check-circle" size={24} color="white" />
                <Text style={styles.buttonText}>Finish Story</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={styles.newStoryButton}
                onPress={handleCreateNew}
              >
                <MaterialIcons name="add-circle" size={24} color="white" />
                <Text style={styles.buttonText}>New Story</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : currentStep === 'complete' ? (
          <View style={styles.completeContainer}>
            <View style={styles.titleInputContainer}>
              <TextInput
                style={styles.titleInput}
                placeholder="My Adventure Story"
                value={storyTitle}
                onChangeText={setStoryTitle}
                placeholderTextColor="#999"
              />
              <TouchableOpacity
                style={styles.saveButton}
                onPress={() => {
                  if (story) {
                    const updatedStory = {
                      ...story,
                      title: storyTitle || 'My Adventure Story'
                    };
                    saveStory(updatedStory);
                    router.push(`/story-viewer/${story.id}`);
                  }
                }}
              >
                <MaterialIcons name="save" size={24} color="white" />
                <Text style={styles.buttonText}>Save Story</Text>
              </TouchableOpacity>
            </View>
          </View>
        ) : null}
      </Animated.View>

      {isRateLimited && (
        <View style={styles.rateLimitContainer}>
          <Text style={styles.rateLimitText}>
            Rate limit reached. Please wait {retryCountdown} seconds before trying again.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsRateLimited(false);
              if (!story) {
                startStory();
                return;
              }
              if (story.segments.length === 0) {
                startStory();
              } else {
                handleChoice(story.segments[story.segments.length - 1].text);
              }
            }}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    padding: 16,
  },
  header: {
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: {
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 10,
    paddingBottom: 20,
  },
  card: {
    width: '46%',
    backgroundColor: 'white',
    borderRadius: 15,
    marginBottom: 15,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 5,
    elevation: 3,
  },
  cardImage: {
    paddingVertical: 20,
    alignItems: 'center',
    borderTopLeftRadius: 15,
    borderTopRightRadius: 15,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
  cardContent: {
    padding: 20,
  },
  cardTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  cardDescription: {
    fontSize: 16,
    color: '#666',
    lineHeight: 24,
    marginBottom: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
    borderRadius: 12,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  titleContainer: {
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  titleLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  scrollView: {
    flex: 1,
    padding: 16,
  },
  storyRenderContainer: {
    flex: 1,
  },
  storyScrollContent: {
    padding: 16,
    paddingBottom: 80,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#F5F5F5',
  },
  finishButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    width: '45%',
    justifyContent: 'center',
  },
  newStoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2196F3',
    borderRadius: 12,
    padding: 12,
    width: '45%',
    justifyContent: 'center',
  },
  completeContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  titleInputContainer: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#333',
    marginBottom: 16,
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 16,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#4CAF50',
    marginTop: 16,
  },
  rateLimitContainer: {
    backgroundColor: '#FFF3E0',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    alignItems: 'center',
  },
  rateLimitText: {
    fontSize: 16,
    color: '#E65100',
    textAlign: 'center',
    marginBottom: 12,
  },
  retryButton: {
    backgroundColor: '#FF9800',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 4,
  },
  retryButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 20, 
  },
}); 