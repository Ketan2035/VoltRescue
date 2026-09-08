import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, Animated, ActivityIndicator } from 'react-native';
import storage from '../../services/storage';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const WelcomeScreen = ({ navigation }: any) => {
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const [isLoading, setIsLoading] = useState(false);
  const { connect } = useSocket();

  useEffect(() => {
    const checkAuth = async () => {
      const token = await storage.getItem('operatorToken');
      if (token) {
        connect(token);
        navigation.navigate('DriverDashboard');
      }
    };
    checkAuth();

    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.05,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, [pulseAnim]);

  const handleGetStarted = async () => {
    setIsLoading(true);
    try {
      let guestId = await storage.getItem('guestSessionId');
      
      const response = await api.post('/auth/guest', {
        deviceId: guestId || undefined,
      });

      const session = response.data.data.session;
      
      if (!guestId) {
        await storage.setItem('guestSessionId', session.deviceId);
      }
      
      // Connect to socket when entering flow
      connect();
      
      navigation.navigate('CustomerDashboard');
    } catch (error) {
      console.error('Error generating guest session:', error);
      // Fallback navigation
      navigation.navigate('CustomerDashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <Image 
        source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtEZTrUDcljv0zCFvMkdksLchO5RUYzfKGpNG2GsmLWdBE_h4hc5Fl5Uj8vuYmd6NiKeL3lmwtJqjJfW5ksylJTfpS_Xpz6fdYpbJ-zyMPqCPS7ERcBkqvN9imGPezfbOGdQq9rGYDEuu-DqQAGXRpfwT0XleqfzZotpCaJJcQ_2L4o-6y71r5GrgIIwZeD8y8j5ojHxixZ9ywII3EHxRZ9fJv0-kY5VQ_OEadmGLfwFSzj_PB0nNWmeobr0Bc__1cb2TFcIVgBHqJ' }} 
        style={styles.backgroundImage} 
        resizeMode="cover" 
      />
      
      <View style={styles.overlay} />

      <View style={styles.logoContainer}>
        <Text style={styles.logoText}>VoltRescue</Text>
      </View>

      <View style={styles.contentContainer}>
        <View style={styles.textContainer}>
          <Text style={styles.headline}>Charging, Wherever {'\n'} You Are.</Text>
          <Text style={styles.subhead}>The world's first mobile EV charging network at your fingertips.</Text>
        </View>

        <View style={styles.actionContainer}>
          <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
            <TouchableOpacity 
              style={styles.primaryButton}
              onPress={handleGetStarted}
              disabled={isLoading}
            >
              {isLoading ? (
                <ActivityIndicator color={colors.onSecondaryFixed} />
              ) : (
                <Text style={styles.primaryButtonText}>Get Started</Text>
              )}
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity 
            style={styles.secondaryButton}
            onPress={() => {
              navigation.navigate('DriverAuth');
            }}
          >
            <Text style={styles.secondaryButtonText}>ALREADY A MEMBER? SIGN IN</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.progressIndicators}>
          <View style={[styles.dot, styles.activeDot]} />
          <View style={styles.dot} />
          <View style={styles.dot} />
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  backgroundImage: {
    ...StyleSheet.absoluteFillObject,
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(19, 19, 19, 0.6)',
  },
  logoContainer: {
    position: 'absolute',
    top: 60,
    width: '100%',
    alignItems: 'center',
  },
  logoText: {
    color: colors.primary,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 60,
  },
  textContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  headline: {
    color: '#ffffff',
    fontSize: 36,
    fontWeight: 'bold',
    textAlign: 'center',
    lineHeight: 44,
    marginBottom: 16,
  },
  subhead: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    maxWidth: 300,
  },
  actionContainer: {
    width: '100%',
    alignItems: 'center',
    gap: 24,
  },
  primaryButton: {
    backgroundColor: colors.secondaryFixed,
    paddingVertical: 20,
    paddingHorizontal: 40,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryButtonText: {
    color: colors.onSecondaryFixed,
    fontSize: 20,
    fontWeight: '600',
  },
  secondaryButton: {
    paddingVertical: 10,
    marginTop: 20,
  },
  secondaryButtonText: {
    color: colors.tertiary,
    fontSize: 12,
    fontWeight: '500',
    letterSpacing: 1.5,
  },
  progressIndicators: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 40,
  },
  dot: {
    width: 8,
    height: 4,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 2,
  },
  activeDot: {
    width: 32,
    backgroundColor: colors.secondaryFixed,
  },
});

export default WelcomeScreen;
