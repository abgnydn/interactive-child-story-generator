import React from 'react';
import { StyleSheet, Text, View, Image, TouchableOpacity } from 'react-native';
import { StyleChoice } from '../types';

interface ChoiceCardProps {
  choice: StyleChoice;
  onPress: (choice: StyleChoice) => void;
  isSelected?: boolean;
}

export default function ChoiceCard({ choice, onPress, isSelected = false }: ChoiceCardProps): JSX.Element {
  return (
    <TouchableOpacity
      style={[styles.card, isSelected && styles.selectedCard]}
      onPress={() => onPress(choice)}
      activeOpacity={0.8}
    >
      <Image
        source={{ uri: choice.imageUrl }}
        style={styles.image}
        resizeMode="cover"
      />
      <View style={styles.content}>
        <Text style={styles.title}>{choice.title}</Text>
        <Text style={styles.description}>{choice.description}</Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    marginBottom: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    width: '100%',
  },
  selectedCard: {
    borderColor: '#4CAF50',
    borderWidth: 3,
  },
  image: {
    width: '100%',
    height: 150,
  },
  content: {
    padding: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
    color: '#333',
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 20,
  },
}); 