import { Stack } from 'expo-router';
import { useColorScheme } from 'react-native';

export default function App(): JSX.Element {
  const colorScheme = useColorScheme();

  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: colorScheme === 'dark' ? '#000' : '#fff',
        },
        headerTintColor: colorScheme === 'dark' ? '#fff' : '#000',
        headerTitleStyle: {
          fontWeight: 'bold',
        },
      }}
    />
  );
} 