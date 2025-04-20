import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Image,
  Dimensions,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Story } from '../types';
import FullScreenImage from './FullScreenImage';

interface MyStoriesProps {
  stories: Story[];
  onStorySelect: (story: Story) => void;
  onDeleteStory: (storyId: string) => void;
}

export default function MyStories({ stories, onStorySelect, onDeleteStory }: MyStoriesProps) {
  const [selectedStoryId, setSelectedStoryId] = useState<string | null>(null);
  const [isImageFullScreen, setIsImageFullScreen] = useState(false);
  const [currentImageUrl, setCurrentImageUrl] = useState<string>('');

  const handleStoryPress = (story: Story) => {
    setSelectedStoryId(selectedStoryId === story.id ? null : story.id);
  };

  const handleImagePress = (imageUrl: string | undefined) => {
    if (imageUrl) {
      setCurrentImageUrl(imageUrl);
      setIsImageFullScreen(true);
    }
  };

  // Function to check if a string is a base64 image
  const isBase64Image = (str: string): boolean => {
    if (!str) return false;
    return str.startsWith('data:image') || /^[A-Za-z0-9+/=]+$/.test(str);
  };

  // Function to get the appropriate image source
  const getImageSource = (url: string | undefined): { uri: string } | null => {
    if (!url) return null;
    if (isBase64Image(url)) {
      return { uri: `data:image/jpeg;base64,${url}` };
    }
    return { uri: url.startsWith('http') ? url : `http://${url}` };
  };

  return (
    <View style={styles.container}>
      <FullScreenImage
        visible={isImageFullScreen}
        imageUrl={currentImageUrl}
        onClose={() => setIsImageFullScreen(false)}
      />
      <Text style={styles.title}>My Stories</Text>
      <ScrollView style={styles.storiesList}>
        {stories.map((story) => (
          <View key={story.id} style={styles.storyCard}>
            <TouchableOpacity
              style={styles.storyHeader}
              onPress={() => handleStoryPress(story)}
            >
              <Text style={styles.storyTitle}>{story.title}</Text>
              <MaterialIcons
                name={selectedStoryId === story.id ? 'expand-less' : 'expand-more'}
                size={24}
                color="#666"
              />
            </TouchableOpacity>

            {selectedStoryId === story.id && (
              <View style={styles.storyContent}>
                {story.segments.map((segment, index) => (
                  <View key={index} style={styles.segment}>
                    {segment.imageUrl && (
                      <TouchableOpacity
                        style={styles.imageWrapper}
                        onPress={() => handleImagePress(segment.imageUrl)}
                      >
                        {getImageSource(segment.imageUrl) && (
                          <Image
                            source={getImageSource(segment.imageUrl)!}
                            style={styles.storyImage}
                            resizeMode="cover"
                          />
                        )}
                      </TouchableOpacity>
                    )}
                    <View style={styles.textBubble}>
                      <Text style={styles.storyText}>{segment.text}</Text>
                    </View>
                  </View>
                ))}

                <View style={styles.buttonContainer}>
                  <TouchableOpacity
                    style={[styles.button, styles.continueButton]}
                    onPress={() => onStorySelect(story)}
                  >
                    <MaterialIcons name="play-arrow" size={24} color="white" />
                    <Text style={styles.buttonText}>Continue Story</Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.button, styles.deleteButton]}
                    onPress={() => onDeleteStory(story.id)}
                  >
                    <MaterialIcons name="delete" size={24} color="white" />
                    <Text style={styles.buttonText}>Delete Story</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    backgroundColor: '#F5F5F5',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#333',
  },
  storiesList: {
    flex: 1,
  },
  storyCard: {
    backgroundColor: 'white',
    borderRadius: 16,
    marginBottom: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  storyHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFF8E1',
  },
  storyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
  storyContent: {
    padding: 16,
  },
  segment: {
    marginBottom: 16,
  },
  imageWrapper: {
    width: '100%',
    height: 180,
    borderRadius: 12,
    overflow: 'hidden',
    marginBottom: 12,
  },
  storyImage: {
    width: '100%',
    height: '100%',
  },
  textBubble: {
    backgroundColor: '#FFF8E1',
    borderRadius: 12,
    padding: 12,
    marginBottom: 8,
  },
  storyText: {
    fontSize: 16,
    lineHeight: 24,
    color: '#333',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 16,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderRadius: 12,
    flex: 1,
    marginHorizontal: 4,
  },
  continueButton: {
    backgroundColor: '#4CAF50',
  },
  deleteButton: {
    backgroundColor: '#F44336',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 8,
  },
}); 