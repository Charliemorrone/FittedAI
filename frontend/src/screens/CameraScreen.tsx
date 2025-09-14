import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  SafeAreaView,
  Alert,
  Dimensions,
} from 'react-native';
import { StackNavigationProp } from '@react-navigation/stack';
import { RouteProp } from '@react-navigation/native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { RootStackParamList } from '../types';
import { PhotoStorageService } from '../services/photoStorageService';

const { width, height } = Dimensions.get('window');

type CameraScreenNavigationProp = StackNavigationProp<RootStackParamList, 'CameraScreen'>;
type CameraScreenRouteProp = RouteProp<RootStackParamList, 'CameraScreen'>;

interface Props {
  navigation: CameraScreenNavigationProp;
  route: CameraScreenRouteProp;
}

export default function CameraScreen({ navigation }: Props) {
  const [isLaunching, setIsLaunching] = useState(false);

  useEffect(() => {
    console.log('📸 CameraScreen: Component mounted, auto-launching camera...');
    // Auto-launch camera immediately when screen loads
    launchCamera();
  }, []);

  const launchCamera = async () => {
    if (isLaunching) return; // Prevent multiple launches
    
    setIsLaunching(true);
    console.log('📸 CameraScreen: launchCamera function called');
    
    try {
      console.log('🔐 CameraScreen: Requesting camera permissions...');
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      console.log('🔐 CameraScreen: Camera permission result:', permissionResult);
      
      if (permissionResult.granted === false) {
        console.log('❌ CameraScreen: Camera permission denied');
        Alert.alert('Permission Required', 'Permission to access camera is required!');
        navigation.goBack();
        return;
      }

      console.log('📱 CameraScreen: Launching camera...');
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ['images'],
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
      });
      
      console.log('📱 CameraScreen: Camera result:', result);

      if (!result.canceled && result.assets && result.assets[0]) {
        const photoUri = result.assets[0].uri;
        console.log('📷 CameraScreen: Photo taken, URI:', photoUri);
        
        // Save photo to local storage
        console.log('💾 CameraScreen: Saving photo to storage...');
        await PhotoStorageService.saveReferencePhoto(photoUri);
        console.log('✅ CameraScreen: Photo saved to storage, navigating back...');
        navigation.goBack();
      } else {
        console.log('❌ CameraScreen: Camera was canceled, navigating back...');
        navigation.goBack();
      }
    } catch (error) {
      console.error('💥 CameraScreen: Error in launchCamera:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      navigation.goBack();
    } finally {
      setIsLaunching(false);
    }
  };

  const handleClose = () => {
    console.log('❌ CameraScreen: Close button pressed, navigating back...');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
          <Ionicons name="close" size={24} color="#ffffff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Take Photo</Text>
        <View style={styles.placeholder} />
      </View>
      
      <View style={styles.loadingContainer}>
        <Ionicons name="camera" size={80} color="#ffffff" />
        <Text style={styles.loadingText}>
          {isLaunching ? 'Opening Camera...' : 'Camera Ready'}
        </Text>
        <Text style={styles.loadingSubtext}>
          Tap the button below to take a photo
        </Text>
        
        {!isLaunching && (
          <TouchableOpacity style={styles.retryButton} onPress={launchCamera}>
            <Ionicons name="camera" size={20} color="#ffffff" />
            <Text style={styles.retryButtonText}>Take Photo</Text>
          </TouchableOpacity>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingTop: 20,
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  placeholder: {
    width: 40,
    height: 40,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  loadingText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  loadingSubtext: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 24,
    marginTop: 32,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#ffffff',
    marginLeft: 8,
  },
});
