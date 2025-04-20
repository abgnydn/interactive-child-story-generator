import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function App(): JSX.Element {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#4A4E69' : '#FFF0F5',
        },
        headerTintColor: colorScheme === 'dark' ? '#FFFACD' : '#6A0DAD',
        headerTitleStyle: {
          fontWeight: 'bold',
          fontSize: 18,
        },
      }}
    />
  );
} 