import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface LoadingSpinnerProps {
  message?: string;
  onIconClick?: (iconName: string) => void;
}

export default function LoadingSpinner({ 
  message = 'Loading...',
  onIconClick 
}: LoadingSpinnerProps): JSX.Element {
  const [bounceAnim] = useState(new Animated.Value(0));
  const [iconIndex, setIconIndex] = useState(0);
  const [progress] = useState(new Animated.Value(0));
  const [clickedIcons, setClickedIcons] = useState<Set<string>>(new Set());
  const [showConfetti, setShowConfetti] = useState(false);
  
  const icons = ['auto-stories', 'book', 'star', 'favorite', 'emoji-events'] as const;
  const colors = ['#4CAF50', '#FF9800', '#2196F3', '#9C27B0', '#00BCD4'];
  const funMessages = [
    "✨ Creating magic for you ✨",
    "🎨 Painting your story...",
    "🌟 Sprinkling some stardust...",
    "📚 Writing the next bestseller...",
    "🎭 Adding some drama..."
  ];
  const [currentMessage, setCurrentMessage] = useState(funMessages[0]);
  
  useEffect(() => {
    // Bounce animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(bounceAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(bounceAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
    
    // Progress animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(progress, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: false,
        }),
        Animated.timing(progress, {
          toValue: 0,
          duration: 2000,
          useNativeDriver: false,
        }),
      ])
    ).start();
    
    // Icon rotation
    const interval = setInterval(() => {
      setIconIndex((prevIndex) => (prevIndex + 1) % icons.length);
      setCurrentMessage(funMessages[Math.floor(Math.random() * funMessages.length)]);
    }, 1500);
    
    return () => clearInterval(interval);
  }, []);
  
  const translateY = bounceAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, -20],
  });

  const progressWidth = progress.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  const handleIconClick = (iconName: string) => {
    if (!clickedIcons.has(iconName)) {
      setClickedIcons(new Set([...clickedIcons, iconName]));
      setShowConfetti(true);
      setTimeout(() => setShowConfetti(false), 1000);
      onIconClick?.(iconName);
    }
  };
  
  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, { transform: [{ translateY }] }]}>
        <TouchableOpacity 
          onPress={() => handleIconClick(icons[iconIndex])}
          style={styles.iconButton}
        >
          <MaterialIcons 
            name={icons[iconIndex]} 
            size={80} 
            color={colors[iconIndex]} 
          />
        </TouchableOpacity>
      </Animated.View>
      
      <View style={styles.progressContainer}>
        <Animated.View style={[styles.progressBar, { width: progressWidth }]} />
      </View>
      
      <Text style={styles.message}>{message}</Text>
      <Text style={styles.subMessage}>{currentMessage}</Text>
      
      <View style={styles.statsContainer}>
        <Text style={styles.statsText}>
          Icons collected: {clickedIcons.size}/{icons.length}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F5F5',
  },
  iconContainer: {
    marginBottom: 20,
  },
  iconButton: {
    padding: 10,
    borderRadius: 50,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  progressContainer: {
    width: '80%',
    height: 10,
    backgroundColor: '#E0E0E0',
    borderRadius: 5,
    marginBottom: 20,
    overflow: 'hidden',
  },
  progressBar: {
    height: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 5,
  },
  message: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
    textAlign: 'center',
  },
  subMessage: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  statsContainer: {
    marginTop: 20,
    padding: 10,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 10,
  },
  statsText: {
    fontSize: 14,
    color: '#666',
  },
}); 