import React, { useEffect, useState } from 'react';
import {
  StyleSheet,
  Text,
  View,
  ScrollView,
  Image,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
} from 'react-native';
import { Stack, useLocalSearchParams, router } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Story, StorySegment } from '../types';
import { getStories } from '../utils/storage';

const { width } = Dimensions.get('window');

export default function StoryViewer() {
  const { id } = useLocalSearchParams();
  const [story, setStory] = useState<Story | null>(null);
  const [currentSegment, setCurrentSegment] = useState(0);

  useEffect(() => {
    loadStory();
  }, [id]);

  const loadStory = async () => {
    try {
      const stories = await getStories();
      const foundStory = stories.find(s => s.id === id);
      if (foundStory) {
        setStory(foundStory);
      } else {
        console.error('Story not found');
        router.back();
      }
    } catch (error) {
      console.error('Error loading story:', error);
      router.back();
    }
  };

  const handleNext = () => {
    if (story && currentSegment < story.segments.length - 1) {
      setCurrentSegment(prev => prev + 1);
    }
  };

  const handlePrevious = () => {
    if (currentSegment > 0) {
      setCurrentSegment(prev => prev - 1);
    }
  };

  if (!story) {
    return (
      <SafeAreaView style={styles.container}>
        <Text>Loading...</Text>
      </SafeAreaView>
    );
  }

  const segment = story.segments[currentSegment];

  return (
    <SafeAreaView style={styles.container}>
      <Stack.Screen
        options={{
          title: story.title,
          headerStyle: {
            backgroundColor: 'white',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
          },
        }}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.segmentContainer}>
          {segment.imageUrl && (
            <Image
              source={{ uri: segment.imageUrl }}
              style={styles.image}
              resizeMode="cover"
            />
          )}
          <View style={styles.textBubble}>
            <Text style={styles.text}>{segment.text}</Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.navigationContainer}>
        <TouchableOpacity
          style={[styles.navButton, !currentSegment && styles.disabledButton]}
          onPress={handlePrevious}
          disabled={!currentSegment}
        >
          <MaterialIcons name="arrow-back" size={24} color={currentSegment ? 'white' : '#999'} />
          <Text style={[styles.navButtonText, !currentSegment && styles.disabledText]}>Previous</Text>
        </TouchableOpacity>

        <Text style={styles.pageIndicator}>
          {currentSegment + 1} of {story.segments.length}
        </Text>

        <TouchableOpacity
          style={[styles.navButton, currentSegment === story.segments.length - 1 && styles.disabledButton]}
          onPress={handleNext}
          disabled={currentSegment === story.segments.length - 1}
        >
          <Text style={[styles.navButtonText, currentSegment === story.segments.length - 1 && styles.disabledText]}>Next</Text>
          <MaterialIcons name="arrow-forward" size={24} color={currentSegment === story.segments.length - 1 ? '#999' : 'white'} />
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  segmentContainer: {
    padding: 16,
  },
  image: {
    width: width - 32,
    height: 250,
    borderRadius: 20,
    marginBottom: 16,
  },
  textBubble: {
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
  text: {
    fontSize: 18,
    lineHeight: 28,
    color: '#333',
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: 'white',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    padding: 12,
    minWidth: 120,
    justifyContent: 'center',
  },
  disabledButton: {
    backgroundColor: '#E0E0E0',
  },
  navButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginHorizontal: 8,
  },
  disabledText: {
    color: '#999',
  },
  pageIndicator: {
    fontSize: 16,
    color: '#666',
  },
}); 