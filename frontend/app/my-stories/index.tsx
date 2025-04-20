import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  FlatList,
  Image,
  Alert,
  RefreshControl,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { Stack, router } from 'expo-router';
import { Story } from '../types';
import { getStories, deleteStory } from '../utils/storage';
import LoadingSpinner from '../components/LoadingSpinner';

export default function MyStories(): JSX.Element {
  const [stories, setStories] = useState<Story[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const loadSavedStories = async () => {
    try {
      const savedStories = await getStories();
      // Ensure unique stories by ID and sort by last updated
      const uniqueStories = Array.from(
        new Map(savedStories.map(story => [story.id, story])).values()
      ).sort((a, b) => 
        new Date(b.lastUpdated).getTime() - new Date(a.lastUpdated).getTime()
      );
      setStories(uniqueStories);
    } catch (error) {
      console.error('Error loading stories:', error);
      Alert.alert('Error', 'Failed to load saved stories');
    } finally {
      setIsLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    loadSavedStories();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    loadSavedStories();
  };

  const handleDelete = async (storyId: string) => {
    Alert.alert(
      'Delete Story',
      'Are you sure you want to delete this story?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteStory(storyId);
              setStories(stories.filter(story => story.id !== storyId));
            } catch (error) {
              console.error('Error deleting story:', error);
              Alert.alert('Error', 'Failed to delete story');
            }
          },
        },
      ]
    );
  };

  const renderStoryItem = ({ item }: { item: Story }) => {
    // Check if item and segments exist
    if (!item || !item.segments || item.segments.length === 0) {
      return (
        <View style={styles.storyCard}>
          <View style={styles.storyContent}>
            <View style={styles.storyInfo}>
              <Text style={styles.storyTitle}>{item?.title || 'Untitled Story'} ⚠️</Text>
              <Text style={styles.storySubtitle}>This story has no content</Text>
            </View>
          </View>
        </View>
      );
    }
    
    // Get the first segment's image URL or use a default
    let imageUrl = item.segments[0]?.imageUrl || 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800';
    
    // Check if the image URL is a base64 string
    if (imageUrl && !imageUrl.startsWith('http') && !imageUrl.startsWith('data:')) {
      // Convert base64 to data URL if it's not already in that format
      imageUrl = `data:image/png;base64,${imageUrl}`;
    }
    
    // Get a random fun emoji for each story
    const funEmojis = ['🌟', '🌈', '🦄', '🐉', '🧚‍♀️', '🎨', '🎭', '🎪', '🎯', '🎲'];
    const randomEmoji = funEmojis[Math.floor(Math.random() * funEmojis.length)];
    
    return (
      <TouchableOpacity
        style={styles.storyCard}
        onPress={() => router.push(`/story-viewer/${item.id}`)}
      >
        <View style={styles.storyContent}>
          <View style={styles.storyInfo}>
            <Text style={styles.storyTitle}>{item.title || 'Untitled Story'} {randomEmoji}</Text>
            <Text style={styles.storySubtitle}>Tap to read this magical tale!</Text>
          </View>
          
          <View style={styles.imageContainer}>
            <Image
              source={{ uri: imageUrl }}
              style={styles.thumbnail}
              resizeMode="cover"
              onError={(error) => {
                console.error('Image loading error:', error.nativeEvent.error);
                // Force a re-render with the default image
                if (item.segments && item.segments.length > 0) {
                  item.segments[0] = {
                    ...item.segments[0],
                    imageUrl: 'https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800'
                  };
                }
              }}
            />
          </View>
        </View>
        
        <TouchableOpacity
          onPress={() => handleDelete(item.id)}
          style={styles.deleteButton}
        >
          <MaterialIcons name="delete" size={24} color="#FF5252" />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  if (isLoading) {
    return <LoadingSpinner message="Loading your magical stories..." />;
  }

  return (
    <View style={styles.container}>
      <Stack.Screen
        options={{
          title: 'My Magical Stories',
          headerStyle: {
            backgroundColor: '#FFE5B4',
          },
          headerTintColor: '#333',
          headerTitleStyle: {
            fontWeight: 'bold',
            fontSize: 24,
          },
        }}
      />

      {stories.length === 0 ? (
        <View style={styles.emptyContainer}>
          <MaterialIcons name="auto-stories" size={64} color="#FFB74D" />
          <Text style={styles.emptyText}>No magical stories yet</Text>
          <TouchableOpacity
            style={styles.createButton}
            onPress={() => router.push('/story-builder')}
          >
            <Text style={styles.createButtonText}>Create New Story ✨</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={stories}
          renderItem={renderStoryItem}
          keyExtractor={item => item.id}
          contentContainerStyle={styles.listContainer}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              colors={['#FFB74D']}
            />
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFF8E1',
  },
  listContainer: {
    padding: 16,
  },
  storyCard: {
    backgroundColor: 'white',
    borderRadius: 20,
    padding: 16,
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
    borderWidth: 2,
    borderColor: '#FFE0B2',
  },
  storyContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  storyInfo: {
    flex: 1,
    marginRight: 12,
  },
  storyTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#FF9800',
    marginBottom: 8,
  },
  storySubtitle: {
    fontSize: 16,
    color: '#FFB74D',
    fontStyle: 'italic',
  },
  imageContainer: {
    width: 100,
    height: 100,
    borderRadius: 15,
    overflow: 'hidden',
    borderWidth: 3,
    borderColor: '#FFE0B2',
    backgroundColor: '#FFF8E1',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFF8E1',
  },
  deleteButton: {
    position: 'absolute',
    top: 12,
    right: 12,
    padding: 8,
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    fontSize: 20,
    color: '#FF9800',
    marginTop: 16,
    marginBottom: 24,
    fontWeight: 'bold',
  },
  createButton: {
    backgroundColor: '#FF9800',
    borderRadius: 25,
    padding: 16,
    width: '80%',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.2,
    shadowRadius: 8,
    elevation: 5,
  },
  createButtonText: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
}); 