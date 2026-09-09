import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  Animated,
  Linking,
  Platform,
  StatusBar,
  BackHandler,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const LiveChargingScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  // Prevent hardware back press from closing active charging session
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Fast Charging in Progress',
        'DC Rapid Charging is currently active. Screen will automatically update to Invoice when completed.',
        [{ text: 'OK', style: 'default' }]
      );
      return true;
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1800,
          useNativeDriver: true,
        }),
      ])
    ).start();

    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBookingDetails(res.data.data.booking);
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };
    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    }
  }, [bookingId]);

  useEffect(() => {
    const currentSt = status || bookingDetails?.status;
    if (
      currentSt === 'CHARGING_COMPLETED' ||
      currentSt === 'INVOICE_GENERATED' ||
      currentSt === 'PAYMENT_PENDING'
    ) {
      navigation.navigate('Payment', { bookingId });
    }
  }, [status, bookingDetails?.status, bookingId, navigation]);

  const operatorName = bookingDetails?.operatorId?.name || 'Rescue Operator';
  const operatorPhone = bookingDetails?.operatorId?.phone;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Ionicons name="flash" size={16} color="#059669" />
          </View>
          <Text style={styles.brandTitle}>VOLTRESCUE LIVE</Text>
        </View>
        <TouchableOpacity
          style={styles.helpBtn}
          onPress={() => navigation.navigate('Support')}
          activeOpacity={0.7}
        >
          <Ionicons name="help-buoy-outline" size={20} color="#0F172A" />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 28) }]} showsVerticalScrollIndicator={false}>
        {/* Progress & Real-time Stats Container */}
        <View style={styles.progressCard}>
          <View style={styles.activePill}>
            <View style={styles.activeDot} />
            <Text style={styles.activePillText}>RAPID RESCUE CHARGE IN PROGRESS</Text>
          </View>

          {/* Progress Circle Visual */}
          <View style={styles.progressCircleContainer}>
            <Animated.View
              style={[
                styles.glowRing,
                {
                  transform: [
                    {
                      scale: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.98, 1.05],
                      }),
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.8],
                  }),
                },
              ]}
            />
            <View style={styles.innerCircle}>
              <Text style={styles.percentageText}>72%</Text>
              <Text style={styles.chargingLabel}>DELIVERING POWER</Text>
            </View>
          </View>

          <View style={styles.rangeVoltageRow}>
            <View style={styles.rvBox}>
              <Text style={styles.rvLabel}>EST. RANGE ADDED</Text>
              <Text style={styles.rvValue}>+142 km</Text>
            </View>
            <View style={styles.rvDivider} />
            <View style={styles.rvBox}>
              <Text style={styles.rvLabel}>DELIVERY RATE</Text>
              <Text style={styles.rvValue}>124 kW</Text>
            </View>
          </View>
        </View>

        {/* Quick Stats Grid */}
        <View style={styles.statsRow}>
          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="time" size={18} color="#D97706" />
            </View>
            <Text style={styles.statLabel}>TIME REMAINING</Text>
            <Text style={styles.statValue}>14 min</Text>
          </View>

          <View style={styles.statCard}>
            <View style={[styles.statIconBox, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="wallet" size={18} color="#059669" />
            </View>
            <Text style={styles.statLabel}>CURRENT TOTAL</Text>
            <Text style={styles.statValue}>
              ₹{bookingDetails?.pricing?.totalAmount || '1,450'}
            </Text>
          </View>
        </View>

        {/* Assigned Operator Details */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorLeft}>
            <View style={styles.operatorAvatarBox}>
              <Ionicons name="person" size={24} color="#64748B" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.operatorName}>{operatorName}</Text>
              <Text style={styles.operatorRole}>
                VoltRescue Certified Technician • Rapid Van
              </Text>
            </View>
          </View>

          <View style={styles.operatorActions}>
            <TouchableOpacity
              style={styles.opActionBtn}
              onPress={() => {
                if (bookingId) {
                  navigation.navigate('Chat', {
                    bookingId,
                    isOperator: false,
                    otherPersonName: operatorName,
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble" size={18} color="#0F172A" />
              <Text style={styles.opActionText}>Chat</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.opActionBtn, { backgroundColor: '#ECFDF5', borderColor: '#A7F3D0' }]}
              onPress={() => {
                if (operatorPhone) {
                  Linking.openURL(`tel:${operatorPhone}`);
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={18} color="#059669" />
              <Text style={[styles.opActionText, { color: '#059669' }]}>Call</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Safety & Technician Monitored Session Banner */}
        <View style={styles.technicianManagedCard}>
          <View style={styles.techIconBox}>
            <Ionicons name="shield-checkmark" size={22} color="#059669" />
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.technicianManagedTitle}>Technician Managed Fast-Charge</Text>
            <Text style={styles.technicianManagedDesc}>
              High-voltage DC power delivery and safety disengagement are controlled by your operator. This screen will automatically update when charging completes.
            </Text>
          </View>
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
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 14,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E2E8F0',
  },
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  helpBtn: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 16,
  },
  progressCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  activePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: 20,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activePillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  progressCircleContainer: {
    width: 190,
    height: 190,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  glowRing: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 12,
    borderColor: '#A7F3D0',
  },
  innerCircle: {
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  percentageText: {
    color: '#0F172A',
    fontSize: 44,
    fontWeight: '900',
    letterSpacing: -1,
  },
  chargingLabel: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  rangeVoltageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  rvBox: {
    alignItems: 'center',
  },
  rvDivider: {
    width: 1,
    height: 32,
    backgroundColor: '#E2E8F0',
  },
  rvLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  rvValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '800',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  statCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  statIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  statLabel: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  statValue: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginTop: 4,
  },
  operatorCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  operatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 14,
  },
  operatorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  operatorName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  operatorRole: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  operatorActions: {
    flexDirection: 'row',
    gap: 10,
  },
  opActionBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 10,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  opActionText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  technicianManagedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#ECFDF5',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  techIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  technicianManagedTitle: {
    fontSize: 14,
    fontWeight: '800',
    color: '#065F46',
    marginBottom: 2,
  },
  technicianManagedDesc: {
    fontSize: 11,
    color: '#047857',
    lineHeight: 16,
  },
});

export default LiveChargingScreen;
