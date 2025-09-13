import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import { StatusBar } from 'expo-status-bar';
import { StyleSheet, View } from 'react-native';

// Import screens
import InputScreen from './src/screens/InputScreen';
import CameraScreen from './src/screens/CameraScreen';
import RecommendationScreen from './src/screens/RecommendationScreen';
import PurchaseScreen from './src/screens/PurchaseScreen';
import SplashScreen from './src/screens/SplashScreen';

// Import types
import { RootStackParamList } from './src/types';

const Stack = createStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <View style={styles.container}>
      <NavigationContainer>
        <Stack.Navigator
          initialRouteName="SplashScreen"
          screenOptions={{
            headerShown: false,
          }}
        >
          <Stack.Screen 
            name="SplashScreen" 
            component={SplashScreen}
            options={{ title: 'Splash' }}
          />
          <Stack.Screen 
            name="InputScreen" 
            component={InputScreen}
            options={{ title: 'FittedAI - Style Input' }}
          />
          <Stack.Screen 
            name="CameraScreen" 
            component={CameraScreen}
            options={{ title: 'Take Photo' }}
          />
          <Stack.Screen 
            name="RecommendationScreen" 
            component={RecommendationScreen}
            options={{ title: 'Outfit Recommendations' }}
          />
          <Stack.Screen 
            name="PurchaseScreen" 
            component={PurchaseScreen}
            options={{ title: 'Purchase Items' }}
          />
        </Stack.Navigator>
      </NavigationContainer>
      <StatusBar style="auto" />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#ffffff',
  },
});