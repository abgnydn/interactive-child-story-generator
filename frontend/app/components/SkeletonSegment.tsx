import React from 'react';
import { StyleSheet, View } from 'react-native';

interface SkeletonSegmentProps {
  showImage?: boolean;
  showText?: boolean;
  showQuestion?: boolean;
  numberOfChoices?: number;
}

// Simple static skeleton placeholder for a story segment
export default function SkeletonSegmentComponent({
  showImage = true,
  showText = true,
  showQuestion = true,
  numberOfChoices = 2,
}: SkeletonSegmentProps): JSX.Element {
  const placeholderColor = '#e0e0e0'; // Light gray for placeholders

  return (
    <View style={styles.segmentOuterContainer}>
      {/* Skeleton for Image */}
      {showImage && (
        <View style={[styles.skeletonImage, { backgroundColor: placeholderColor }]} />
      )}

      {/* Skeleton for Text Bubble */}
      {showText && (
        <View style={styles.textContainer}>
          <View style={[styles.skeletonTextBubble, { backgroundColor: placeholderColor }]} />
        </View>
      )}

      {/* Skeleton for Question Bubble & Choices */}
      {showQuestion && (
        <View style={styles.questionChoicesContainer}>
          <View style={[styles.skeletonQuestionBubble, { backgroundColor: placeholderColor }]} />
          
          {/* Skeleton for Choice Buttons */}
          <View style={styles.choicesGridContainer}>
            {Array.from({ length: numberOfChoices }).map((_, index) => (
              <View
                key={`skeleton-choice-${index}`}
                style={[styles.skeletonChoiceButton, { backgroundColor: placeholderColor }]}
              />
            ))}
          </View>
        </View>
      )}
    </View>
  );
}

// Styles mimicking StorySegmentComponent layout but with fixed heights/placeholders
const styles = StyleSheet.create({
  segmentOuterContainer: {
    marginBottom: 20,
    backgroundColor: '#f9f9f9',
    borderRadius: 15,
    padding: 15,
    opacity: 0.6, // Make skeleton slightly transparent
  },
  skeletonImage: {
    width: '100%',
    height: 250, // Match image height
    borderRadius: 10,
    marginBottom: 15,
  },
  textContainer: {
    paddingHorizontal: 5,
    alignItems: 'center',
    marginBottom: 15, // Space between text and question areas
  },
  skeletonTextBubble: {
    width: '100%',
    height: 100, // Approximate height for text bubble
    borderRadius: 15,
  },
  questionChoicesContainer: {
    marginTop: 10,
    paddingHorizontal: 10,
  },
  skeletonQuestionBubble: {
    width: '100%',
    height: 40, // Approximate height for question bubble
    borderRadius: 10,
    marginBottom: 20,
  },
  choicesGridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-evenly',
    alignItems: 'center',
  },
  skeletonChoiceButton: {
    height: 45, // Match choice button height
    borderRadius: 25,
    margin: 6,
    minWidth: '40%',
    flexGrow: 1,
  },
}); 