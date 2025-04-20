import React from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface CompletionCardProps {
  storyTitle: string;
  onTitleChange: (text: string) => void;
  onSave: () => void; // The save function will handle getting the title itself
}

const CompletionCard: React.FC<CompletionCardProps> = ({
  storyTitle,
  onTitleChange,
  onSave,
}) => {
  return (
    <View style={styles.cardContainer}>
      <MaterialIcons name="celebration" size={50} color="#FFB74D" style={styles.icon} />
      <Text style={styles.title}>Your Story is Ready!</Text>
      <Text style={styles.subtitle}>Give your masterpiece a title:</Text>
      
      <TextInput
        style={styles.titleInput}
        placeholder="My Awesome Story"
        value={storyTitle}
        onChangeText={onTitleChange}
        placeholderTextColor="#999"
      />
      
      <TouchableOpacity style={styles.saveButton} onPress={onSave}>
        <MaterialIcons name="save" size={24} color="white" />
        <Text style={styles.buttonText}>Finish & Save</Text>
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  cardContainer: {
    backgroundColor: 'white',
    borderRadius: 15,
    padding: 25,
    marginVertical: 20,
    marginHorizontal: 5, // Add slight horizontal margin
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
  },
  icon: {
    marginBottom: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
  },
  titleInput: {
    borderWidth: 1,
    borderColor: '#DDD',
    borderRadius: 12,
    padding: 16,
    fontSize: 18,
    color: '#333',
    marginBottom: 20, // Increased margin
    width: '100%', // Take full width within card
  },
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50', // Green save button
    borderRadius: 12,
    paddingVertical: 14, // Slightly larger padding
    paddingHorizontal: 20,
    width: '100%', // Make button full width
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
    marginLeft: 10,
  },
});

export default CompletionCard; 