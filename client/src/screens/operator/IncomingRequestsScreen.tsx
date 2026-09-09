import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
  Platform,
  StatusBar,
  ScrollView,
  Easing,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const IncomingRequestsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 10;
  const request = route.params?.request;
  const [isMuted, setIsMuted] = useState(false);

  // Animations
  const pulseAlertAnim = useRef(new Animated.Value(1)).current;
  const buttonPulseAnim = useRef(new Animated.Value(1)).current;
  const radarWave1 = useRef(new Animated.Value(0)).current;
  const radarWave2 = useRef(new Animated.Value(0)).current;
  const eqBar1 = useRef(new Animated.Value(0.4)).current;
  const eqBar2 = useRef(new Animated.Value(0.8)).current;
  const eqBar3 = useRef(new Animated.Value(0.6)).current;
  const eqBar4 = useRef(new Animated.Value(0.9)).current;

  useEffect(() => {
    // 1. Alert Badge Breathing Animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAlertAnim, {
          toValue: 1.06,
          duration: 650,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAlertAnim, {
          toValue: 1,
          duration: 650,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 2. Accept Button Pulse
    Animated.loop(
      Animated.sequence([
        Animated.timing(buttonPulseAnim, {
          toValue: 1.03,
          duration: 750,
          useNativeDriver: true,
        }),
        Animated.timing(buttonPulseAnim, {
          toValue: 1,
          duration: 750,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // 3. Radar Wave Expansions
    const createWaveAnim = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 1800,
            easing: Easing.out(Easing.ease),
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      );
    };
    const wave1 = createWaveAnim(radarWave1, 0);
    const wave2 = createWaveAnim(radarWave2, 900);
    wave1.start();
    wave2.start();

    // 4. Equalizer Audio Waves
    const createEqAnim = (anim: Animated.Value, min: number, max: number, duration: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.timing(anim, {
            toValue: max,
            duration: duration,
            useNativeDriver: true,
          }),
          Animated.timing(anim, {
            toValue: min,
            duration: duration,
            useNativeDriver: true,
          }),
        ])
      );
    };
    const eq1 = createEqAnim(eqBar1, 0.3, 1.0, 320);
    const eq2 = createEqAnim(eqBar2, 0.2, 0.9, 450);
    const eq3 = createEqAnim(eqBar3, 0.4, 1.0, 280);
    const eq4 = createEqAnim(eqBar4, 0.2, 0.8, 390);
    eq1.start();
    eq2.start();
    eq3.start();
    eq4.start();

    // 5. Play Ringing Sound (Universal MP3, expo-av & Web Audio Synth fallback)
    let soundObject: Audio.Sound | null = null;
    let webAudio: any = null;
    let audioContext: any = null;
    let synthInterval: any = null;

    const playWebSynthAlert = () => {
      try {
        const AudioCtx = (window as any).AudioContext || (window as any).webkitAudioContext;
        if (!AudioCtx) return;
        audioContext = new AudioCtx();

        const playTone = (freq: number, duration: number, delay: number) => {
          setTimeout(() => {
            if (!audioContext || audioContext.state === 'closed') return;
            try {
              const osc = audioContext.createOscillator();
              const gain = audioContext.createGain();
              osc.type = 'sine';
              osc.frequency.setValueAtTime(freq, audioContext.currentTime);
              gain.gain.setValueAtTime(0.3, audioContext.currentTime);
              gain.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + duration);
              osc.connect(gain);
              gain.connect(audioContext.destination);
              osc.start();
              osc.stop(audioContext.currentTime + duration);
            } catch (e) {}
          }, delay);
        };

        const triggerChime = () => {
          playTone(880, 0.18, 0);
          playTone(1174, 0.25, 200);
        };

        triggerChime();
        synthInterval = setInterval(triggerChime, 1400);
      } catch (e) {}
    };

    const playSound = async () => {
      const ringtoneUrl = 'https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3';

      // 1. Native Audio Player via expo-av
      try {
        await Audio.setAudioModeAsync({
          allowsRecordingIOS: false,
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false,
        });

        const { sound } = await Audio.Sound.createAsync(
          { uri: ringtoneUrl },
          { shouldPlay: true, isLooping: true, volume: 1.0 }
        );
        soundObject = sound;
        await sound.playAsync();
      } catch (error) {
        console.log('expo-av audio attempt:', error);
      }

      // 2. Web browser HTML5 Audio fallback & Web Audio Synth
      if (Platform.OS === 'web' && typeof window !== 'undefined') {
        try {
          webAudio = new (window as any).Audio(ringtoneUrl);
          webAudio.loop = true;
          webAudio.volume = 1.0;
          const promise = webAudio.play();
          if (promise !== undefined) {
            promise.catch(() => {
              playWebSynthAlert();
            });
          }
        } catch (e) {
          playWebSynthAlert();
        }
      }
    };
    playSound();

    const stopAllAudio = () => {
      if (soundObject) {
        try {
          soundObject.stopAsync();
          soundObject.unloadAsync();
        } catch (e) {}
      }
      if (webAudio) {
        try {
          webAudio.pause();
          webAudio.currentTime = 0;
        } catch (e) {}
      }
      if (synthInterval) {
        clearInterval(synthInterval);
      }
      if (audioContext) {
        try {
          audioContext.close();
        } catch (e) {}
      }
    };

    const toggleMute = () => {
      setIsMuted((prev) => {
        const nextState = !prev;
        if (soundObject) {
          try {
            soundObject.setIsMutedAsync(nextState);
          } catch (e) {}
        }
        if (webAudio) {
          try {
            webAudio.muted = nextState;
          } catch (e) {}
        }
        return nextState;
      });
    };

    stopAudioRef.current = stopAllAudio;
    toggleMuteRef.current = toggleMute;

    return () => {
      wave1.stop();
      wave2.stop();
      eq1.stop();
      eq2.stop();
      eq3.stop();
      eq4.stop();
      stopAllAudio();
    };
  }, []);

  const stopAudioRef = useRef<() => void>(() => {});
  const toggleMuteRef = useRef<() => void>(() => {});

  const handleAccept = async () => {
    stopAudioRef.current();
    if (!request) return;
    try {
      await api.patch(`/bookings/${request.bookingId}/status`, {
        status: 'VEHICLE_ASSIGNED',
      });
      navigation.replace('EnRoute', { bookingId: request.bookingId });
    } catch (error) {
      console.error('Failed to accept request:', error);
      navigation.replace('EnRoute', { bookingId: request.bookingId });
    }
  };

  const handleDecline = () => {
    stopAudioRef.current();
    navigation.goBack();
  };

  const customerName = request?.customerName || request?.personalInfo?.name || 'Emergency EV Driver';
  const customerPhone = request?.userPhone || request?.phone || '';
  const vehicleModel = request?.vehicleModel || request?.vehicleDetails?.model || 'Tata Nexon EV';
  const connectorType = request?.connectorType || 'CCS2';
  const requestedKWh = request?.requestedEnergyKWh || 30;
  const estPayout = request?.estimatedPrice || '1,052.56';
  const address = request?.address || 'Koramangala 4th Block, Bangalore';
  const remarks = request?.remarks || request?.problem || '';
  const distanceKm = request?.distance || '2.4';
  const customerInitials = customerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EV';

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Clean Top Header */}
      <View style={styles.topHeader}>
        <Animated.View style={[styles.alertBadge, { transform: [{ scale: pulseAlertAnim }] }]}>
          <View style={styles.alertDot} />
          <Text style={styles.alertBadgeText}>NEW RESCUE REQUEST</Text>
        </Animated.View>

        <TouchableOpacity
          style={styles.soundButton}
          onPress={() => toggleMuteRef.current()}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isMuted ? 'volume-mute' : 'volume-high'}
            size={18}
            color={isMuted ? '#94A3B8' : '#059669'}
          />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 20) + 16 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* 1. Earnings Hero Card */}
        <View style={styles.heroEarningsCard}>
          <View style={styles.heroEarningsTop}>
            <View>
              <Text style={styles.heroEarningsLabel}>TOTAL ESTIMATED EARNING</Text>
              <Text style={styles.heroEarningsValue}>₹{estPayout}</Text>
            </View>
            <View style={styles.etaPill}>
              <Ionicons name="navigate" size={14} color="#059669" />
              <Text style={styles.etaPillText}>{distanceKm} km</Text>
            </View>
          </View>
        </View>

        {/* 2. Breakdown Location Card */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="location" size={18} color="#EF4444" />
            <Text style={styles.sectionHeaderTitle}>BREAKDOWN LOCATION</Text>
          </View>
          <Text style={styles.addressMainText}>{address}</Text>
        </View>

        {/* 3. EV Vehicle & Customer Details */}
        <View style={styles.sectionCard}>
          <View style={styles.cardHeaderRow}>
            <Ionicons name="car-sport" size={18} color="#2563EB" />
            <Text style={styles.sectionHeaderTitle}>VEHICLE & CUSTOMER</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Vehicle:</Text>
            <Text style={styles.detailValue}>{vehicleModel}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Connector:</Text>
            <Text style={styles.detailValue}>{connectorType} • {requestedKWh} kWh DC</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Customer:</Text>
            <Text style={styles.detailValue}>{customerName}</Text>
          </View>

          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Phone:</Text>
            <TouchableOpacity
              style={styles.phoneTouchRow}
              onPress={() => {
                const phone = customerPhone || '+91 9876543210';
                Linking.openURL(`tel:${phone}`);
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={14} color="#059669" />
              <Text style={styles.phoneTouchValue}>{customerPhone || '+91 9876543210'}</Text>
            </TouchableOpacity>
          </View>

          {remarks ? (
            <View style={styles.remarksBox}>
              <Text style={styles.remarksLabel}>Remark:</Text>
              <Text style={styles.remarksText}>"{remarks}"</Text>
            </View>
          ) : null}
        </View>

        {/* 4. Simple, Clear Action Buttons */}
        <View style={styles.actionContainer}>
          <Animated.View style={{ transform: [{ scale: buttonPulseAnim }] }}>
            <TouchableOpacity
              style={styles.acceptButton}
              onPress={handleAccept}
              activeOpacity={0.88}
            >
              <Ionicons name="flash" size={20} color="#FFFFFF" />
              <Text style={styles.acceptButtonText}>ACCEPT RESCUE</Text>
            </TouchableOpacity>
          </Animated.View>

          <TouchableOpacity
            style={styles.declineButton}
            onPress={handleDecline}
            activeOpacity={0.7}
          >
            <Text style={styles.declineButtonText}>Decline</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  topHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  alertBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#FEF2F2',
    borderWidth: 1.5,
    borderColor: '#FCA5A5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
  },
  alertDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
  },
  alertBadgeText: {
    color: '#DC2626',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  soundButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // 1. Hero Earnings Card
  heroEarningsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 20,
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.1,
    shadowRadius: 10,
    elevation: 3,
  },
  heroEarningsTop: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  heroEarningsLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.8,
    marginBottom: 4,
  },
  heroEarningsValue: {
    fontSize: 34,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  etaPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  etaPillText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },

  // 2. Section Card
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 10,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 2,
  },
  sectionHeaderTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  addressMainText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 22,
  },

  // Details
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 3,
  },
  detailLabel: {
    fontSize: 13,
    color: '#64748B',
    fontWeight: '600',
  },
  detailValue: {
    fontSize: 13,
    color: '#0F172A',
    fontWeight: '800',
  },
  phoneTouchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  phoneTouchValue: {
    fontSize: 12,
    color: '#065F46',
    fontWeight: '800',
  },

  // Remarks Box
  remarksBox: {
    backgroundColor: '#FEF3C7',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#FDE68A',
    marginTop: 4,
  },
  remarksLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#92400E',
    marginBottom: 2,
  },
  remarksText: {
    fontSize: 12,
    color: '#78350F',
    fontStyle: 'italic',
  },

  // Action Buttons
  actionContainer: {
    gap: 10,
    marginTop: 6,
  },
  acceptButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#059669',
    borderRadius: 18,
    paddingVertical: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 6,
  },
  acceptButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  declineButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
  },
  declineButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#64748B',
  },
});

export default IncomingRequestsScreen;


