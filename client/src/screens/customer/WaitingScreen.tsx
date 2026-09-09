import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  Platform,
  StatusBar,
  ScrollView,
  Alert,
  BackHandler,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useBookingState } from '../../hooks/useBookingState';

const WaitingScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 12;
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);

  const [nearbyCount, setNearbyCount] = useState<number | string>(3);
  const [eta, setEta] = useState<string>('6-10 mins');
  const [secondsElapsed, setSecondsElapsed] = useState(0);

  // Handle hardware back button to return to home page
  useEffect(() => {
    const onBackPress = () => {
      navigation.navigate('CustomerDashboard');
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, [navigation]);

  // Animation values for concentric radar rings
  const ringAnim1 = useRef(new Animated.Value(0)).current;
  const ringAnim2 = useRef(new Animated.Value(0)).current;
  const ringAnim3 = useRef(new Animated.Value(0)).current;
  const pulseCenter = useRef(new Animated.Value(1)).current;

  // Dots indicator animation
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  // Auto-navigate when an operator accepts
  useEffect(() => {
    const currentSt = status;
    if (
      currentSt === 'OPERATOR_ACCEPTED' ||
      currentSt === 'VEHICLE_ASSIGNED' ||
      currentSt === 'ARRIVING' ||
      currentSt === 'OPERATOR_ARRIVED' ||
      currentSt === 'OTP_VERIFIED'
    ) {
      navigation.navigate('CustomerEnRoute', { bookingId });
    } else if (
      currentSt === 'CHARGING_STARTED' ||
      currentSt === 'CHARGING_IN_PROGRESS'
    ) {
      navigation.navigate('LiveCharging', { bookingId });
    }
  }, [status, bookingId, navigation]);

  // Elapsed timer ticker
  useEffect(() => {
    const timer = setInterval(() => {
      setSecondsElapsed((prev) => prev + 1);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    // Fetch nearby stats
    const fetchStats = async () => {
      try {
        const res = await api.get('/operators/nearby?lng=-122.4194&lat=37.7749');
        const operators = res.data?.data?.operators || [];
        if (operators.length > 0) {
          setNearbyCount(operators.length);
          const closestDist = operators[0].dist?.calculated || 0;
          const etaMin = Math.max(4, Math.round(closestDist / 400));
          setEta(`${etaMin}-${etaMin + 4} mins`);
        }
      } catch (e) {
        console.error('API Error:', e);
      }
    };
    fetchStats();

    // Staggered Concentric Radar Rings Animation
    const createRingAnimation = (anim: Animated.Value, delay: number) => {
      return Animated.loop(
        Animated.sequence([
          Animated.delay(delay),
          Animated.timing(anim, {
            toValue: 1,
            duration: 2600,
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

    const anim1 = createRingAnimation(ringAnim1, 0);
    const anim2 = createRingAnimation(ringAnim2, 800);
    const anim3 = createRingAnimation(ringAnim3, 1600);

    anim1.start();
    anim2.start();
    anim3.start();

    // Center icon pulse
    const pulseLoop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseCenter, {
          toValue: 1.15,
          duration: 900,
          useNativeDriver: true,
        }),
        Animated.timing(pulseCenter, {
          toValue: 1,
          duration: 900,
          useNativeDriver: true,
        }),
      ])
    );
    pulseLoop.start();

    // Searching dots animation
    const dotsLoop = Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotAnim1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim1, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotAnim2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
        Animated.sequence([
          Animated.timing(dotAnim3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0.3, duration: 400, useNativeDriver: true }),
        ]),
      ])
    );
    dotsLoop.start();

    return () => {
      anim1.stop();
      anim2.stop();
      anim3.stop();
      pulseLoop.stop();
      dotsLoop.stop();
    };
  }, []);

  const formatTimer = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  const handleCancelBooking = () => {
    Alert.alert(
      'Cancel Rescue Request?',
      'Are you sure you want to cancel? If an operator has started driving, dispatch priority will reset.',
      [
        { text: 'Keep Searching', style: 'cancel' },
        {
          text: 'Cancel Request',
          style: 'destructive',
          onPress: async () => {
            try {
              if (bookingId) {
                await api.patch(`/bookings/${bookingId}/status`, {
                  status: 'CANCELLED',
                  cancellationReason: 'Cancelled by customer',
                });
              }
            } catch (err) {
              console.error('Cancellation error:', err);
            }
            navigation.navigate('CustomerDashboard');
          },
        },
      ]
    );
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.dispatchPill}>
          <View style={styles.liveDot} />
          <Text style={styles.dispatchPillText}>DISPATCH BROADCAST ACTIVE</Text>
        </View>

        <View style={styles.timerBadge}>
          <Ionicons name="time-outline" size={14} color="#059669" />
          <Text style={styles.timerText}>{formatTimer(secondsElapsed)}</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 20) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Animated Sonar Radar Scanner Showcase */}
        <View style={styles.radarSection}>
          <View style={styles.radarContainer}>
            {/* Concentric Expanding Wave 1 */}
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: ringAnim1.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 3.4],
                      }),
                    },
                  ],
                  opacity: ringAnim1.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.6, 0.3, 0],
                  }),
                },
              ]}
            />

            {/* Concentric Expanding Wave 2 */}
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: ringAnim2.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 3.4],
                      }),
                    },
                  ],
                  opacity: ringAnim2.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.6, 0.3, 0],
                  }),
                },
              ]}
            />

            {/* Concentric Expanding Wave 3 */}
            <Animated.View
              style={[
                styles.radarWave,
                {
                  transform: [
                    {
                      scale: ringAnim3.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.8, 3.4],
                      }),
                    },
                  ],
                  opacity: ringAnim3.interpolate({
                    inputRange: [0, 0.6, 1],
                    outputRange: [0.6, 0.3, 0],
                  }),
                },
              ]}
            />

            {/* Center Core Scanner Beacon */}
            <Animated.View
              style={[
                styles.radarCore,
                {
                  transform: [{ scale: pulseCenter }],
                },
              ]}
            >
              <View style={styles.coreInner}>
                <Ionicons name="flash" size={32} color="#FFFFFF" />
              </View>
            </Animated.View>
          </View>

          {/* Status Headline with Animated Pulse Dots */}
          <Text style={styles.searchHeadline}>Finding Closest Rescue Unit...</Text>
          <View style={styles.dotsRow}>
            <Text style={styles.searchSub}>Connecting to nearby 150kW DC mobile fleet</Text>
            <View style={styles.animatedDots}>
              <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
            </View>
          </View>
        </View>

        {/* Live Dispatch Metrics Bento Grid */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="navigate-outline" size={18} color="#059669" />
            </View>
            <Text style={styles.bentoLabel}>ESTIMATED ARRIVAL</Text>
            <Text style={styles.bentoValue}>{eta}</Text>
          </View>

          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBox, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="car-sport-outline" size={18} color="#2563EB" />
            </View>
            <Text style={styles.bentoLabel}>RESCUE VANS NEARBY</Text>
            <Text style={[styles.bentoValue, { color: '#059669' }]}>{nearbyCount} Active</Text>
          </View>
        </View>

        {/* Step Progression Timeline */}
        <View style={styles.stepsCard}>
          <Text style={styles.stepsCardTitle}>DISPATCH LIFECYCLE</Text>

          <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepIcon, styles.stepIconDone]}>
                <Ionicons name="checkmark" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.stepConnector} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitleDone}>Breakdown Request Received</Text>
              <Text style={styles.stepDesc}>GPS pinpointed & safety protocol initiated</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepIcon, styles.stepIconActive]}>
                <Ionicons name="radio" size={14} color="#FFFFFF" />
              </View>
              <View style={styles.stepConnector} />
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitleActive}>Matching Rescue Operator</Text>
              <Text style={styles.stepDesc}>Broadcasting priority alert to nearest certified van</Text>
            </View>
          </View>

          <View style={styles.stepRow}>
            <View style={styles.stepLeft}>
              <View style={[styles.stepIcon, styles.stepIconPending]}>
                <Ionicons name="speedometer-outline" size={14} color="#94A3B8" />
              </View>
            </View>
            <View style={styles.stepInfo}>
              <Text style={styles.stepTitlePending}>Driver En Route with Live Map</Text>
              <Text style={styles.stepDesc}>Real-time navigation & 6-digit OTP verification</Text>
            </View>
          </View>
        </View>

        {/* Security & Reassurance Banner */}
        <View style={styles.safetyCard}>
          <Ionicons name="shield-checkmark" size={20} color="#059669" />
          <View style={{ flex: 1 }}>
            <Text style={styles.safetyTitle}>Zero Advance Deduction</Text>
            <Text style={styles.safetyDesc}>
              No upfront charges. You only pay for the exact metered energy delivered upon rescue completion.
            </Text>
          </View>
        </View>

        {/* Cancel Action Button */}
        <TouchableOpacity
          style={styles.cancelBtn}
          onPress={handleCancelBooking}
          activeOpacity={0.8}
        >
          <Ionicons name="close-circle-outline" size={18} color="#EF4444" />
          <Text style={styles.cancelBtnText}>Cancel Rescue Request</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  dispatchPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  dispatchPillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  timerBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timerText: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
    fontVariant: ['tabular-nums'],
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  radarSection: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 24,
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  radarContainer: {
    width: 170,
    height: 170,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: 12,
  },
  radarWave: {
    position: 'absolute',
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: 'rgba(5, 150, 105, 0.15)',
    borderWidth: 2,
    borderColor: '#059669',
  },
  radarCore: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: 'rgba(5, 150, 105, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  coreInner: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  searchHeadline: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 8,
  },
  dotsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  searchSub: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '500',
  },
  animatedDots: {
    flexDirection: 'row',
    gap: 4,
    alignItems: 'center',
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: '#059669',
  },
  bentoGrid: {
    flexDirection: 'row',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
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
  },
  bentoIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  bentoLabel: {
    fontSize: 10,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  bentoValue: {
    fontSize: 17,
    fontWeight: '900',
    color: '#0F172A',
  },
  stepsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  stepsCardTitle: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.8,
    marginBottom: 16,
  },
  stepRow: {
    flexDirection: 'row',
    gap: 14,
  },
  stepLeft: {
    alignItems: 'center',
  },
  stepIcon: {
    width: 26,
    height: 26,
    borderRadius: 13,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepIconDone: {
    backgroundColor: '#059669',
  },
  stepIconActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  stepIconPending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  stepConnector: {
    width: 2,
    height: 32,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  stepInfo: {
    flex: 1,
    paddingBottom: 20,
  },
  stepTitleDone: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepTitleActive: {
    fontSize: 14,
    fontWeight: '800',
    color: '#059669',
  },
  stepTitlePending: {
    fontSize: 14,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepDesc: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    lineHeight: 16,
  },
  safetyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  safetyDesc: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
  cancelBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1.5,
    borderColor: '#FEE2E2',
    borderRadius: 16,
    paddingVertical: 14,
    marginTop: 4,
  },
  cancelBtnText: {
    color: '#EF4444',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default WaitingScreen;
