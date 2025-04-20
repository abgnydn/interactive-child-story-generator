import React, { useState } from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity, ScrollView } from 'react-native';
import { StorySegment as StorySegmentType } from '../types';
import { MaterialIcons } from '@expo/vector-icons';
import FullScreenImage from './FullScreenImage';

interface StorySegmentProps {
  segment: StorySegmentType;
  index: number;
  isQuestionView: boolean;
  question?: string;
  choices?: string[];
  onToggleView: () => void;
  onChoiceSelect?: (choice: string) => void;
}

export default function StorySegmentComponent({
  segment,
  index,
  isQuestionView,
  question,
  choices,
  onToggleView,
  onChoiceSelect,
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

  // Ensure segment has text property
  if (!segment.text) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>Story text not available</Text>
      </View>
    );
  }

  const imageSource = getImageSource(segment.imageUrl);

  return (
    <View style={styles.container}>
      {imageSource && (
        <FullScreenImage
          visible={isImageFullScreen}
          imageUrl={segment.imageUrl || ''}
          onClose={() => setIsImageFullScreen(false)}
        />
      )}
      {isQuestionView ? (
        <View style={styles.questionContainer}>
          <View style={styles.textBubble}>
            <Text style={styles.questionText}>{question || "What should happen next?"}</Text>
          </View>
          
          <View style={styles.choicesContainer}>
            {choices && choices.length > 0 ? (
              choices.map((choice, choiceIndex) => (
                <TouchableOpacity
                  key={choiceIndex}
                  style={styles.choiceButton}
                  onPress={() => onChoiceSelect?.(choice)}
                >
                  <Text style={styles.choiceText}>{choice}</Text>
                </TouchableOpacity>
              ))
            ) : (
              <Text style={styles.errorText}>No choices available</Text>
            )}
          </View>
          
          <TouchableOpacity
            style={styles.toggleButton}
            onPress={onToggleView}
          >
            <MaterialIcons name="book" size={24} color="white" />
            <Text style={styles.toggleButtonText}>Back to Story</Text>
          </TouchableOpacity>
        </View>
      ) : (
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
            <View style={styles.textBubble}>
              <ScrollView style={styles.scrollViewStyle}>
                <Text style={styles.storyText}>{segment.text}</Text>
              </ScrollView>
            </View>
            
            <TouchableOpacity
              style={styles.toggleButton}
              onPress={onToggleView}
            >
              <MaterialIcons name="help" size={24} color="white" />
              <Text style={styles.toggleButtonText}>What happens next?</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    marginBottom: 10,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: 'white',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,

  },
  storyContainer: {
    width: '100%',
    height: '100%',
    flexDirection: 'column',
  },
  imageWrapper: {
    width: '100%',
    height: 250,
    overflow: 'hidden',
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  textContainer: {
    padding: 12,
    alignItems: 'center',
  },
  questionContainer: {
    padding: 16,
    alignItems: 'center',
  },
  textBubble: {
    backgroundColor: '#FFF8E1',
    borderRadius: 20,
    padding: 12,
    marginBottom: 8,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    maxHeight: 250,
  },
  scrollViewStyle: {
    // flex: 1, // Might be useful if content isn't filling
  },
  storyText: {
    fontSize: 18,
    lineHeight: 26,
    color: '#333',
    textAlign: 'left',
  },
  questionText: {
    fontSize: 20,
    fontWeight: 'bold',
    lineHeight: 26,
    color: '#333',
    textAlign: 'center',
  },
  choicesContainer: {
    width: '100%',
    marginBottom: 12,
  },
  choiceButton: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 1,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  choiceText: {
    fontSize: 16,
    color: '#333',
    textAlign: 'center',
  },
  toggleButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FF9800',
    borderRadius: 12,
    padding: 10,
    marginTop: 6,
  },
  toggleButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
  errorText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: 'red',
    textAlign: 'center',
    marginTop: 20,
  },
}); 