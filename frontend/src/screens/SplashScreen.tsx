import React, { useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Animated } from 'react-native';
import { useFonts, Poppins_800ExtraBold } from '@expo-google-fonts/poppins';
import { StackNavigationProp } from '@react-navigation/stack';
import { RootStackParamList } from '../types';

type SplashScreenNavigationProp = StackNavigationProp<RootStackParamList, 'InputScreen'>;

type Props = Readonly<{
  navigation: SplashScreenNavigationProp;
}>;

export default function SplashScreen({ navigation }: Props) {
  const [fontsLoaded] = useFonts({ Poppins_800ExtraBold });
  const titleOpacity = useRef(new Animated.Value(1)).current;
  const taglineOpacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const titleFadeTimer = setTimeout(() => {
      Animated.timing(titleOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2000);

    const taglineFadeTimer = setTimeout(() => {
      Animated.timing(taglineOpacity, {
        toValue: 0,
        duration: 600,
        useNativeDriver: true,
      }).start();
    }, 2500);

    const navigateTimer = setTimeout(() => {
      navigation.replace('InputScreen');
    }, 3100);

    return () => {
      clearTimeout(titleFadeTimer);
      clearTimeout(taglineFadeTimer);
      clearTimeout(navigateTimer);
    };
  }, [navigation, titleOpacity, taglineOpacity]);

  return (
    <View style={styles.container}> 
      <View style={styles.content}> 
        <Animated.Text 
          style={[
            styles.title,
            { opacity: titleOpacity },
            fontsLoaded ? { fontFamily: 'Poppins_800ExtraBold' } : null,
          ]}
        >
          FITTED AI
        </Animated.Text>
        <Animated.Text style={[styles.tagline, { opacity: taglineOpacity }]}>See It. Wear It. Love It.</Animated.Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0b0b0c',
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    alignItems: 'center',
  },
  title: {
    color: '#ffffff',
    fontSize: 40,
    fontWeight: '800',
    letterSpacing: 2,
    textAlign: 'center',
  },
  tagline: {
    marginTop: 8,
    color: '#d1d5db',
    fontSize: 18,
    textAlign: 'center',
  },
});


