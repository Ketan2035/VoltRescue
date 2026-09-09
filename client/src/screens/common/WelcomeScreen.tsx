import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import storage from '../../services/storage';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';

const WelcomeScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 16;
  const bottomInset = Math.max(insets.bottom, 24);
  const [isLoading, setIsLoading] = useState(false);
  const { connect } = useSocket();

  // Subtle breathing animation on the status indicator
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.3,
          duration: 1100,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1100,
          useNativeDriver: true,
        }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [pulseAnim]);

  useEffect(() => {
    const checkAuth = async () => {
      const opToken = await storage.getItem('operatorToken');
      if (opToken) {
        connect(opToken);
        navigation.navigate('DriverDashboard');
        return;
      }
    };
    checkAuth();
  }, [navigation]);

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

      connect();
      navigation.navigate('CustomerDashboard');
    } catch (error) {
      console.error('Error generating guest session:', error);
      navigation.navigate('CustomerDashboard');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" translucent backgroundColor="transparent" />

      {/* Cinematic High-Res EV Background */}
      <Image
        source={{
          uri: 'https://images.unsplash.com/photo-1593941707882-a5bba14938c7?auto=format&fit=crop&w=1200&q=85',
        }}
        style={StyleSheet.absoluteFillObject}
        resizeMode="cover"
      />

      {/* Dual Vignette Gradient Overlays for High Contrast */}
      <View style={styles.topVignette} />
      <View style={styles.bottomVignette} />

      {/* Foreground Content */}
      <View style={[styles.contentContainer, { paddingTop: topInset, paddingBottom: bottomInset }]}>
        {/* Top Header */}
        <View style={styles.topBar}>
          <View style={styles.brandRow}>
            <View style={styles.logoBadge}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
            </View>
            <Text style={styles.brandTitle}>VoltRescue</Text>
          </View>

          <View style={styles.statusPill}>
            <Animated.View
              style={[
                styles.statusDot,
                {
                  transform: [{ scale: pulseAnim }],
                },
              ]}
            />
            <Text style={styles.statusText}>24/7 ACTIVE</Text>
          </View>
        </View>

        {/* Center/Bottom Content Block */}
        <View style={styles.centerSection}>
          <View style={styles.speedBadge}>
            <View style={styles.speedIconBox}>
              <Ionicons name="flash" size={12} color="#10B981" />
            </View>
            <Text style={styles.speedBadgeText}>150kW DC Rapid Mobile Rescue</Text>
          </View>

          <Text style={styles.mainHeadline}>
            Stranded with low battery?{'\n'}
            <Text style={styles.headlineHighlight}>We bring the charge to you.</Text>
          </Text>

          <Text style={styles.tagline}>
            On-demand emergency roadside EV charging. Real-time GPS dispatch with certified technicians arriving directly to your vehicle.
          </Text>
        </View>

        {/* Bottom Action Area */}
        <View style={styles.bottomArea}>
          {/* Primary Action Button */}
          <TouchableOpacity
            style={styles.primaryButton}
            onPress={handleGetStarted}
            disabled={isLoading}
            activeOpacity={0.88}
          >
            {isLoading ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : (
              <View style={styles.btnRow}>
                <Text style={styles.primaryButtonText}>Request Immediate Rescue</Text>
                <View style={styles.arrowCircle}>
                  <Ionicons name="arrow-forward" size={16} color="#059669" />
                </View>
              </View>
            )}
          </TouchableOpacity>

          {/* Rescue Operator Portal Button */}
          <TouchableOpacity
            style={styles.operatorButton}
            onPress={() => navigation.navigate('DriverAuth')}
            activeOpacity={0.8}
          >
            <Ionicons name="car-sport" size={16} color="#E2E8F0" />
            <Text style={styles.operatorButtonText}>Rescue Operator Portal</Text>
            <Ionicons name="chevron-forward" size={14} color="rgba(226, 232, 240, 0.7)" />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0F172A',
  },
  topVignette: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 180,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
  },
  bottomVignette: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '75%',
    backgroundColor: 'rgba(15, 23, 42, 0.88)',
  },
  contentContainer: {
    flex: 1,
    justifyContent: 'space-between',
    paddingHorizontal: 24,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  logoBadge: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 8,
    elevation: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.2)',
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: -0.5,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(52, 211, 153, 0.45)',
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#34D399',
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#34D399',
    letterSpacing: 0.8,
  },
  centerSection: {
    gap: 14,
    paddingBottom: 8,
  },
  speedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    alignSelf: 'flex-start',
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.18)',
  },
  speedIconBox: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: 'rgba(16, 185, 129, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  speedBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#F1F5F9',
  },
  mainHeadline: {
    fontSize: 32,
    fontWeight: '900',
    color: '#FFFFFF',
    lineHeight: 40,
    letterSpacing: -0.8,
  },
  headlineHighlight: {
    color: '#10B981',
  },
  tagline: {
    fontSize: 14,
    color: '#94A3B8',
    lineHeight: 22,
    fontWeight: '400',
  },
  bottomArea: {
    gap: 12,
    width: '100%',
  },
  primaryButton: {
    backgroundColor: '#059669',
    borderRadius: 18,
    paddingVertical: 16,
    paddingHorizontal: 20,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.45,
    shadowRadius: 14,
    elevation: 6,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    width: '100%',
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '900',
    letterSpacing: 0.3,
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  operatorButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.08)',
    borderRadius: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.16)',
  },
  operatorButtonText: {
    color: '#F1F5F9',
    fontSize: 13,
    fontWeight: '700',
  },
});

export default WelcomeScreen;

