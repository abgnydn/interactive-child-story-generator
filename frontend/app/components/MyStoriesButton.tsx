import React from 'react';
import { TouchableOpacity, Text, StyleSheet } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { router } from 'expo-router';

interface MyStoriesButtonProps {
  style?: any;
  textStyle?: any;
  iconSize?: number;
  iconColor?: string;
}

const MyStoriesButton: React.FC<MyStoriesButtonProps> = ({
  style,
  textStyle,
  iconSize = 24,
  iconColor = '#333',
}) => {
  return (
    <TouchableOpacity 
      style={[styles.button, style]}
      onPress={() => router.push('/my-stories')}
    >
      <MaterialIcons name="book" size={iconSize} color={iconColor} />
      <Text style={[styles.text, textStyle]}>My Stories</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 10,
  },
  text: {
    marginLeft: 5,
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
});

export default MyStoriesButton; 