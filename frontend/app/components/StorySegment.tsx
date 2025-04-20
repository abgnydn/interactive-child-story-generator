import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView, Platform } from 'react-native';
import { StorySegment as StorySegmentType } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import FullScreenImage from './FullScreenImage';

interface StorySegmentProps {
  segment: StorySegmentType;
  index: number;
  question?: string;
  choices?: string[];
  onChoiceSelect?: (choice: string) => void;
  speakText?: (text: string) => void;
}

export default function StorySegmentComponent({
  segment,
  index,
  question,
  choices,
  onChoiceSelect,
  speakText,
}: StorySegmentProps): JSX.Element {
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);

  // Function to check if a string is a base64 image
  const isBase64Image = (str: string): boolean => {
    if (!str) return false;
    // Check if it's a data URL
    if (str.startsWith('data:image')) return true;
    // Check if it's a valid base64 string
    try {
      // Try to decode the base64 string to see if it's valid
      const decoded = atob(str);
      return true;
    } catch (e) {
      return false;
    }
  };

  // Function to get the appropriate image source
  const getImageSource = (url: string | undefined): { uri: string } | null => {
    if (!url) return null;
    
    try {
      // If it's already a data URL, use it directly
      if (url.startsWith('data:image')) {
        return { uri: url };
      }
      
      // If it's a base64 string, convert it to a data URL
      if (isBase64Image(url)) {
        return { uri: `data:image/jpeg;base64,${url}` };
      }
      
      // If it's a regular URL, ensure it has a protocol
      if (url.startsWith('http://') || url.startsWith('https://')) {
        return { uri: url };
      }
      
      // Add http:// if no protocol is specified
      return { uri: `http://${url}` };
    } catch (error) {
      console.error('Error processing image URL:', error);
      return null;
    }
  };

  // Ensure segment exists and has required properties
  if (!segment) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Story segment not available</Text>
      </View>
    );
  }
  if (!segment.text) {
     // Still render container for potential image/question even if text is missing briefly
     segment.text = "..."; // Placeholder or handle appropriately
  }

  const imageSource = getImageSource(segment.imageUrl);

  return (
    <View style={styles.segmentOuterContainer}> 
      {/* FullScreenImage modal */} 
      {imageSource && (
        <FullScreenImage
          visible={isImageFullScreen}
          imageUrl={segment.imageUrl || ''}
          onClose={() => setIsImageFullScreen(false)}
        />
      )}

      {/* Always render story content */} 
      <View style={styles.storyContainer}>
        {imageSource && (
          <TouchableOpacity
            style={styles.imageWrapper}
            onPress={() => setIsImageFullScreen(true)}
          >
            <Image
              source={imageSource}
              style={styles.storyImage}
              resizeMode="cover"
              onError={(e) => console.log('Image loading error:', e.nativeEvent.error)}
            />
          </TouchableOpacity>
        )}
        
        <View style={styles.textContainer}>
            {/* Display User's Previous Choice */}
            {segment.userChoiceText && (
              <View style={styles.userChoiceContainer}>
                <Text style={styles.userChoiceText}>
                  You chose: <Text style={{fontWeight: 'bold'}}>{segment.userChoiceText}</Text>
                </Text>
              </View>
            )}

            <View style={styles.textAndSpeakerContainer}>
              <View style={styles.textBubble}>
                <ScrollView style={styles.scrollViewStyle}>
                  <Text style={styles.storyText}>{segment.text}</Text>
                </ScrollView>
              </View>
              {Platform.OS === 'web' && speakText && segment.text && (
                <TouchableOpacity 
                  onPress={() => speakText(segment.text)} 
                  style={styles.speakerButton}
                >
                  <MaterialIcons name="volume-up" size={24} color="#FFA726" />
                </TouchableOpacity>
              )}
            </View>
        </View>
      </View>

      {/* Conditionally render Question and Choices below the story content */} 
      {question && choices && choices.length > 0 && (
        <View style={styles.questionChoicesContainer}>
          <View style={styles.questionBubble}>
            <Text style={styles.questionText}>{question}</Text>
          </View>
          
          <View style={styles.choicesGridContainer}> 
            {choices.map((choice, choiceIndex) => (
              <TouchableOpacity
                key={choiceIndex}
                style={styles.choiceButton}
                onPress={() => onChoiceSelect?.(choice)} 
              >
                <Text style={styles.choiceText}>{choice}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  segmentOuterContainer: {
    marginBottom: 20, 
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 5,
    elevation: 2,
  },
  container: {
  },
  storyContainer: {
    width: '100%',
    flexDirection: 'column',
    marginBottom: 25,
  },
  imageWrapper: {
    width: '100%',
    height: 250,
    overflow: 'hidden',
    borderRadius: 10,
    marginBottom: 15,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    paddingHorizontal: 5,
    alignItems: 'center',
  },
  userChoiceContainer: {
    backgroundColor: '#eeeeee',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
    marginBottom: 10,
    alignSelf: 'flex-start',
    marginLeft: 5,
  },
  userChoiceText: {
    fontSize: 13,
    color: '#555555',
    fontStyle: 'italic',
  },
  textAndSpeakerContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
  },
  textBubble: {
    backgroundColor: '#ffffff',
    borderRadius: 15,
    padding: 15,
    width: 'auto',
    flex: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 2,
    maxHeight: 250,
    marginRight: 8,
    borderColor: '#eee',
    borderWidth: 1,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  speakerButton: {
    padding: 5,
    marginTop: 10,
    alignSelf: 'flex-start',
  },
  questionChoicesContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  questionBubble: {
    backgroundColor: '#e3f2fd',
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: 15,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  questionText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1565c0',
    textAlign: 'center',
  },
  choicesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  choiceButton: {
    backgroundColor: '#66bb6a',
    paddingVertical: 12,
    paddingHorizontal: 20,
    borderRadius: 25,
    margin: 6,
    alignItems: 'center',
    minWidth: '40%',
    flexGrow: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 3,
  },
  choiceText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: 'red',
    textAlign: 'center',
    marginTop: 10,
  },
  scrollViewStyle: {},
}); 
