import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, ScrollView, SafeAreaView } from 'react-native';
import { Link } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

export default function Home() {
  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <Text style={styles.title}>Story Maker</Text>
          <Text style={styles.subtitle}>Make Your Own Stories!</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.card}>
            <View style={[styles.cardImage, { backgroundColor: '#E8F5E9' }]}>
              <MaterialIcons name="auto-stories" size={64} color="#4CAF50" />
              <Text style={[styles.imageTitle, { color: '#4CAF50' }]}>Make a New Story</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardDescription}>
                Let's make a fun new story! Pick how it starts.
              </Text>
              <Link href="/story-builder" asChild>
                <TouchableOpacity style={styles.button}>
                  <MaterialIcons name="add-circle" size={24} color="white" />
                  <Text style={styles.buttonText}>Make New Story</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>

          <View style={styles.card}>
            <View style={[styles.cardImage, { backgroundColor: '#FFF3E0' }]}>
              <MaterialIcons name="book" size={64} color="#FF9800" />
              <Text style={[styles.imageTitle, { color: '#FF9800' }]}>Saved Stories</Text>
            </View>
            <View style={styles.cardContent}>
              <Text style={styles.cardDescription}>
                Read the stories you saved.
              </Text>
              <Link href="/my-stories" asChild>
                <TouchableOpacity style={styles.myStoriesButton}>
                  <MaterialIcons name="book" size={24} color="white" />
                  <Text style={styles.buttonText}>See Saved Stories</Text>
                </TouchableOpacity>
              </Link>
            </View>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F5F5F5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    padding: 12,
  },
  header: {
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 16,
  },
  title: {
    fontSize: 30,
    color: '#333',
    marginBottom: 4,
    textAlign: 'center',
    fontFamily: 'Quicksand_700Bold',
  },
  subtitle: {
    fontSize: 17,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  content: {
    flex: 1,
    gap: 16,
  },
  card: {
    backgroundColor: 'white',
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
    marginBottom: 12,
  },
  cardImage: {
    width: '100%',
    height: 140,
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageTitle: {
    fontSize: 22,
    marginTop: 12,
    textAlign: 'center',
    fontFamily: 'Quicksand_700Bold',
  },
  cardContent: {
    padding: 16,
  },
  cardDescription: {
    fontSize: 15,
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Quicksand_500Medium',
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4CAF50',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  myStoriesButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FF9800',
    padding: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 3,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    marginLeft: 8,
    fontFamily: 'Quicksand_700Bold',
  },
}); 