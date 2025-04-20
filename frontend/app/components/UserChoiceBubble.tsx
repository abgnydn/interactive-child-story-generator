import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

interface UserChoiceBubbleProps {
  text: string;
}

export default function UserChoiceBubble({ text }: UserChoiceBubbleProps): JSX.Element {
  return (
    <View style={styles.bubbleContainer}>
      <View style={styles.bubble}>
        <Text style={styles.text}>{text}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  bubbleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    marginVertical: 15,
    paddingHorizontal: 15, 
  },
  bubble: {
    backgroundColor: '#e3f2fd',
    borderRadius: 15,
    paddingVertical: 10,
    paddingHorizontal: 15,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
    borderTopLeftRadius: 15,
    borderBottomLeftRadius: 15,
    borderTopRightRadius: 15,
    borderBottomRightRadius: 5,
  },
  text: {
    fontSize: 15,
    color: '#1565c0',
    fontWeight: '500',
  },
}); 