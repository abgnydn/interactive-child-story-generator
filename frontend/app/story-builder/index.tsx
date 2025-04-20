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
import ConfirmModal from '../components/ConfirmModal';
import CompletionCard from '../components/CompletionCard';

// Revert StoryStep type - remove 'naming'
type StoryStep = ExistingStoryStep | 'visualStyle';

const { width } = Dimensions.get('window');


const API_BASE_URL = __DEV__ 
  ? 'http://localhost:3000' // Use local backend in development
  : 'https://interactive-child-story-generator.onrender.com'; // Use deployed backend in production

const TOTAL_CHOICE_STEPS = 5; // style, character, setting, theme, visualStyle

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
  const [isConfirmModalVisible, setIsConfirmModalVisible] = useState(false);
  const [isStoryComplete, setIsStoryComplete] = useState(false);

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
        throw new Error('Rate limit exceeded');
      }

      // Handle other non-200 responses
      if (!response.ok) {
        throw new Error(`Server error: ${response.statusText}`);
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
        // Check if the story is already complete from the start
        if (!data.question || !data.choices || data.choices.length === 0) {
          setIsStoryComplete(true);
        }
      } else {
        // Set default question and choices if not provided (should ideally indicate completion)
        setCurrentQuestion("What should happen next?"); // Or perhaps set empty/complete here?
        setCurrentChoices([]);
        setIsStoryComplete(true); // Assume completion if no question/choices
        
        // Initialize the view state for the new segment
        setActiveViews(prev => ({
          ...prev,
          [updatedStory.segments.length - 1]: 'story'
        }));
      }
    } catch (error) {
      handleApiError('start the story', error);
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
    setError(null);
    
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
      };
      
      // Append the NEW segment
      setStory(prev => prev ? { 
        ...prev, 
        segments: [...prev.segments, newSegment] 
      } : null);

      // Check for completion and update question/choices
      if (!data.question || !data.choices || data.choices.length === 0) {
        setIsStoryComplete(true);
        setCurrentQuestion('');
        setCurrentChoices([]);
      } else {
        setIsStoryComplete(false); // Ensure it's false if choices are provided
        setCurrentQuestion(data.question);
        setCurrentChoices(data.choices);
      }
      // ----------------------------

    } catch (error) {
      handleApiError('get the next part', error);
    } finally {
      setIsLoading(false);
    }
  };

  // Update finishStoryAndNavigate (called by back button confirm)
  // Now saves and navigates home
  const finishStoryAndNavigate = async () => {
    if (!story) return;
    setIsConfirmModalVisible(false); // Close the modal first
    
    try {
      // Add a conclusion segment
      const conclusionSegment: StorySegment = {
        text: "And so, the adventure came to an end. The character learned valuable lessons and created lasting memories. The end.",
        imageUrl: story.segments[story.segments.length - 1]?.imageUrl || "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800" // Use last image or default
      };
      
      // Ensure story has an ID and title (use current storyTitle or default)
      const finalTitle = storyTitle.trim() || 'My Awesome Story';
      const storyWithId = story.id ? story : { 
        ...story, 
        id: Date.now().toString(),
      };
      
      // Ensure segments array exists
      if (!storyWithId.segments) {
        storyWithId.segments = [];
      }
      
      const updatedStory = {
        ...storyWithId,
        title: finalTitle,
        segments: [...storyWithId.segments, conclusionSegment],
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Finishing story via back button:', updatedStory);
      await saveStory(updatedStory);
      
      // Navigate to the homepage
      router.replace('/'); // Use replace to clear history
    } catch (error) {
      console.error('Error finishing story via back button:', error);
      Alert.alert('Error', 'Failed to finish story. Please try again.');
    }
  };

  // Function to prompt the user before finishing
  const promptFinishStory = () => {
    setIsConfirmModalVisible(true);
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

  const renderStepTitle = (step: StoryStep, choicesCount: number) => {
    const stepNumber = choicesCount + 1;
    switch (step) {
      case 'style':
        return `Step ${stepNumber}: Pick a Story Type!`;
      case 'character':
        return `Step ${stepNumber}: Who's the Star?`;
      case 'setting':
        return `Step ${stepNumber}: Where Are We?`;
      case 'theme':
        return `Step ${stepNumber}: What's it About?`;
      case 'visualStyle':
        return `Step ${stepNumber}: How Should it Look?`;
      case 'story':
        return story?.title || 'Your Story Adventure';
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

  // Function to handle the save from the CompletionCard
  const handleFinalSave = async () => {
    if (!story) return;
    
    try {
      // Add a conclusion segment
      const conclusionSegment: StorySegment = {
        text: "And so, the adventure came to an end. The character learned valuable lessons and created lasting memories. The end.",
        imageUrl: story.segments[story.segments.length - 1]?.imageUrl || "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800"
      };
      
      const finalTitle = storyTitle.trim() || 'My Fun Story';
      const storyWithId = story.id ? story : { 
        ...story, 
        id: Date.now().toString(),
      };
      
      if (!storyWithId.segments) {
        storyWithId.segments = [];
      }
      
      const updatedStory = {
        ...storyWithId,
        title: finalTitle,
        segments: [...storyWithId.segments, conclusionSegment],
        lastUpdated: new Date().toISOString()
      };
      
      console.log('Saving final story from Completion Card:', updatedStory);
      await saveStory(updatedStory);
      
      // Navigate to the homepage
      router.replace('/'); 
    } catch (error) {
      console.error('Error saving final story:', error);
      Alert.alert('Oh no!', 'Couldn\'t save the story. Try again?');
    }
  };

  // Error handling adjustments
  const handleApiError = (context: string, error: any) => {
    console.error(`Error ${context}:`, error);
    const message = error instanceof Error ? error.message : 'Something went wrong';
    // Simple, consistent error message
    Alert.alert(
      'Oops!',
      `Couldn't ${context}. Please try again!\n(${message})`, // Keep technical error for debugging
      [{ text: 'OK' }]
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: renderStepTitle(currentStep, selectedChoices.length), // Pass selectedChoices.length
          headerStyle: {
            backgroundColor: '#FFF0F5', // Updated background color
          },
          headerTintColor: '#6A0DAD', // Updated tint color
          headerTitleStyle: {
            fontFamily: 'Quicksand_700Bold', // Apply font to header
            fontSize: 18, // Adjust if needed
          },
          headerBackVisible: false, // Explicitly hide default back button
          headerLeft: () => {
            if (currentStep === 'story') {
              // When in story mode, back button prompts to finish (which now saves and goes home)
              return (
                <TouchableOpacity onPress={promptFinishStory} style={{ marginLeft: 10 }}>
                  <MaterialIcons name="arrow-back" size={24} color="#6A0DAD" />
                </TouchableOpacity>
              );
            } else if (['character', 'setting', 'theme', 'visualStyle'].includes(currentStep)) {
               // When selecting choices (after first), go back one step
               return (
                 <TouchableOpacity onPress={() => {
                   // Revert previousStepMap - remove naming
                   const previousStepMap: Record<StoryStep, StoryStep> = {
                     character: 'style',
                     setting: 'character',
                     theme: 'setting',
                     visualStyle: 'theme',
                     style: 'style', 
                     story: 'visualStyle',
                     complete: 'story', 
                   };
                   setSelectedChoices(prev => prev.slice(0, -1));
                   setCurrentStep(previousStepMap[currentStep]);
                 }} style={{ marginLeft: 10 }}>
                  <MaterialIcons name="arrow-back" size={24} color="#6A0DAD" />
                </TouchableOpacity>
               );
            } else {
              // No back button on the first step ('style')
              return null;
            }
          },
        }}
      />

      <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
        {['style', 'character', 'setting', 'theme', 'visualStyle'].includes(currentStep) ? (
          <View style={styles.content}>
             <Text style={styles.stepQuestionTitle}>{
              currentStep === 'style' ? 'What kind of story do you want?' :
              currentStep === 'character' ? 'Who is the main character?' :
              currentStep === 'setting' ? 'Where does the story take place?' :
              currentStep === 'theme' ? 'What is the theme of the story?' :
              currentStep === 'visualStyle' ? 'Choose a Visual Style' : ''
            }</Text>
            <ScrollView contentContainerStyle={styles.choicesGrid}>
              {getCurrentChoices().map((choice) => (
                <View key={choice.id} style={styles.card}>
                  <View style={styles.cardImageContainer}>
                     {choice.imageUrl ? (
                       <Image 
                         source={{ uri: choice.imageUrl }}
                         style={styles.cardImage}
                         resizeMode="cover" 
                       />
                     ) : (
                       <View style={[styles.cardImage, { backgroundColor: choice.color + '20', justifyContent: 'center', alignItems: 'center' }]}>
                         <MaterialIcons name="image-not-supported" size={40} color={choice.color || '#ccc'} /> 
                       </View>
                     )}
                  </View>
                  <View style={styles.cardContent}>
                    <Text style={[styles.imageTitle, { color: choice.color }]}>{choice.name}</Text>
                    <Text style={styles.cardDescription}>{choice.description}</Text>
                    <TouchableOpacity
                      style={[styles.button, { backgroundColor: choice.color }]}
                      onPress={() => handleStyleChoice(choice)}
                    >
                      <MaterialIcons name="check-circle-outline" size={22} color="white" />
                      <Text style={styles.buttonText}>Choose This!</Text>
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
              
              {/* Render Completion Card ONLY when story is complete and not loading */} 
              {!isLoading && currentStep === 'story' && isStoryComplete && (
                <CompletionCard 
                  storyTitle={storyTitle}
                  onTitleChange={setStoryTitle}
                  onSave={handleFinalSave}
                />
              )}
            </ScrollView>
          </View>
        ) : null}
      </Animated.View>

      {isRateLimited && (
        <View style={styles.rateLimitContainer}>
          <Text style={styles.rateLimitText}>
            Whoa, too fast! Let's wait {retryCountdown} seconds.
          </Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={() => {
              setIsRateLimited(false);
              if (!story || story.segments.length === 0) {
                 startStory();
              } 
            }}
          >
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      )}

      <ConfirmModal
        visible={isConfirmModalVisible}
        title="All Done?"
        message="Want to finish the story now?"
        confirmText="Finish"
        cancelText="Keep Going"
        onConfirm={finishStoryAndNavigate}
        onCancel={() => setIsConfirmModalVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    paddingTop: 0, // Use SafeAreaView padding
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  header: { // This style seems unused, maybe remove later?
    alignItems: 'center',
    marginTop: 40,
    marginBottom: 32,
  },
  title: { // This style seems unused, maybe remove later?
    fontSize: 32,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: { // This style seems unused, maybe remove later?
    fontSize: 18,
    color: '#666',
  },
  content: {
    flex: 1,
    width: '100%',
  },
  stepQuestionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginVertical: 15,
    fontFamily: 'Quicksand_700Bold', // Apply new font
  },
  choicesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-around',
    paddingHorizontal: 5,
    paddingBottom: 20,
  },
  card: {
    width: '47%',
    backgroundColor: 'white',
    borderRadius: 18,
    marginBottom: 18,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  cardImageContainer: {
    width: '100%',
    height: 120,
    backgroundColor: '#f0f0f0',
  },
  cardImage: {
    width: '100%',
    height: '100%',
  },
  imageTitle: {
    fontSize: 17,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Quicksand_700Bold',
    color: '#444',
  },
  cardContent: {
    padding: 12,
    paddingTop: 0,
    alignItems: 'center',
  },
  cardDescription: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
    marginBottom: 15,
    minHeight: 40,
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 18,
    borderRadius: 15,
    width: '90%',
    alignSelf: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 17,
    fontWeight: 'bold',
    marginLeft: 8,
    fontFamily: 'Quicksand_700Bold',
  },
  titleContainer: { // This style seems unused, maybe remove later?
    padding: 16,
    backgroundColor: 'white',
    marginBottom: 16,
  },
  titleLabel: { // This style seems unused, maybe remove later?
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  scrollView: { // This style seems unused, maybe remove later?
    flex: 1,
    padding: 16,
  },
  storyRenderContainer: {
    flex: 1,
  },
  storyScrollContent: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 30, 
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 30,
  },
  loadingText: { // This style seems unused, maybe remove later?
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
});