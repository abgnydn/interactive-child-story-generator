import React from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';

interface PlaceholderImageProps {
  icon: keyof typeof MaterialIcons.glyphMap;
  title: string;
  color: string;
  backgroundColor: string;
}

export default function PlaceholderImage({ icon, title, color, backgroundColor }: PlaceholderImageProps) {
  return (
    <View style={[styles.container, { backgroundColor }]}>
      <MaterialIcons name={icon} size={64} color={color} />
      <Text style={[styles.title, { color }]}>{title}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 16,
    textAlign: 'center',
  },
}); 