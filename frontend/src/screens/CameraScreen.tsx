import React, { useState, useRef, useEffect } from 'react';
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
  const [cameraType, setCameraType] = useState<'front' | 'back'>('front');

  useEffect(() => {
    console.log('📸 CameraScreen: Component mounted, auto-launching camera...');
    // Auto-launch camera when screen loads
    takePicture();
  }, []);

  const takePicture = async () => {
    console.log('📸 CameraScreen: takePicture function called');
    console.log('📸 CameraScreen: Current camera type:', cameraType);
    
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

      console.log('📱 CameraScreen: Launching camera with options:', {
        cameraType: cameraType === 'front' ? 'front' : 'back'
      });
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [4, 3],
        quality: 0.8,
        cameraType: cameraType === 'front' ? ImagePicker.CameraType.front : ImagePicker.CameraType.back,
      });
      
      console.log('📱 CameraScreen: Camera result:', result);

      if (!result.canceled) {
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
      console.error('💥 CameraScreen: Error in takePicture:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      navigation.goBack();
    }
  };

  const toggleCameraType = () => {
    const newType = cameraType === 'front' ? 'back' : 'front';
    console.log('🔄 CameraScreen: Toggling camera type from', cameraType, 'to', newType);
    setCameraType(newType);
    // Relaunch camera with new type
    console.log('⏱️ CameraScreen: Relaunching camera in 100ms...');
    setTimeout(() => takePicture(), 100);
  };

  const handleClose = () => {
    console.log('❌ CameraScreen: Close button pressed, navigating back...');
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.cameraPlaceholder}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <Ionicons name="close" size={24} color="#ffffff" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Take Photo</Text>
          <TouchableOpacity style={styles.flipButton} onPress={toggleCameraType}>
            <Ionicons name="camera-reverse" size={24} color="#ffffff" />
          </TouchableOpacity>
        </View>

        {/* Camera Placeholder Content */}
        <View style={styles.cameraContent}>
          <Ionicons name="camera" size={80} color="#ffffff" />
          <Text style={styles.cameraText}>Camera will open automatically</Text>
          <Text style={styles.cameraSubtext}>
            Current mode: {cameraType === 'front' ? 'Front Camera' : 'Back Camera'}
          </Text>
        </View>

        {/* Camera Controls */}
        <View style={styles.controls}>
          <View style={styles.controlsContent}>
            <View style={styles.leftControl} />
            
            <TouchableOpacity
              style={styles.captureButton}
              onPress={takePicture}
            >
              <View style={styles.captureButtonInner} />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.flipControlButton} onPress={toggleCameraType}>
              <Ionicons name="camera-reverse" size={28} color="#ffffff" />
            </TouchableOpacity>
          </View>
          
          <Text style={styles.instructionText}>
            Tap flip button to switch between front and back camera
          </Text>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraPlaceholder: {
    flex: 1,
    backgroundColor: '#000000',
  },
  cameraContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  cameraText: {
    fontSize: 18,
    color: '#ffffff',
    marginTop: 20,
    textAlign: 'center',
    fontWeight: '500',
  },
  cameraSubtext: {
    fontSize: 14,
    color: '#ffffff',
    marginTop: 8,
    textAlign: 'center',
    opacity: 0.8,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#ffffff',
  },
  flipButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  controls: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingBottom: 40,
    paddingTop: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  controlsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 40,
    marginBottom: 20,
  },
  leftControl: {
    width: 60,
  },
  captureButton: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ffffff',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 4,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  captureButtonInner: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#ffffff',
  },
  flipControlButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  instructionText: {
    fontSize: 14,
    color: '#ffffff',
    textAlign: 'center',
    opacity: 0.8,
  },
});
