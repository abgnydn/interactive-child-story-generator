import React from 'react';
import {
  Modal,
  View,
  Image,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  StatusBar,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface FullScreenImageProps {
  visible: boolean;
  imageUrl: string;
  onClose: () => void;
}

const { width, height } = Dimensions.get('window');

export default function FullScreenImage({ visible, imageUrl, onClose }: FullScreenImageProps) {
  // Simplified function to get the image source
  // Assumes the parent component provides a valid URI (http, https, or data:)
  const getImageSource = (url: string | undefined): { uri: string } | null => {
    if (!url) {
      // Handle case where imageUrl might be undefined or empty
      console.warn('FullScreenImage received empty imageUrl');
      return null; // Or return a fallback image source if preferred
    }
    return { uri: url }; // Directly use the provided URL/Data URL
  };

  const imageSource = getImageSource(imageUrl);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <StatusBar hidden />
      <View style={styles.container}>
        <TouchableOpacity style={styles.closeButton} onPress={onClose}>
          <MaterialIcons name="close" size={32} color="white" />
        </TouchableOpacity>
        {/* Conditionally render Image only if source is valid */}
        {imageSource ? (
          <Image
            source={imageSource}
            style={styles.image}
            resizeMode="contain"
            onError={(e) => console.error('FullScreenImage loading error:', e.nativeEvent.error)}
          />
        ) : (
          // Optional: Display a placeholder or error message if imageSource is null
          <View style={styles.errorContainer}>
            <MaterialIcons name="error-outline" size={50} color="#aaa" />
          </View>
        )}
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  image: {
    width: width,
    height: height,
  },
  closeButton: {
    position: 'absolute',
    top: 40, // Adjust for status bar height if not hidden or on notches
    right: 20,
    zIndex: 1,
    padding: 10,
  },
  // Optional: Style for error display
  errorContainer: {
    // Styles for a placeholder when image fails to load
  }
}); 