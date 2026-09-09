import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Platform,
  StatusBar,
  Linking,
  Modal,
  Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const ChargingControlsScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const { bookingId } = route.params || {};

  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isCharging, setIsCharging] = useState(true);
  const [power, setPower] = useState(138.4);
  const [voltage, setVoltage] = useState(418);
  const [current, setCurrent] = useState(331);
  const [temp, setTemp] = useState(28.4);
  const [deliveredKWh, setDeliveredKWh] = useState(12.6);
  const [elapsedSeconds, setElapsedSeconds] = useState(480); // 8 mins
  const [showStopModal, setShowStopModal] = useState(false);

  const pulseAnim = useRef(new Animated.Value(0)).current;
  const spinAnim = useRef(new Animated.Value(0)).current;

  // Fetch real booking details
  useEffect(() => {
    const fetchBooking = async () => {
      try {
        if (bookingId && bookingId !== 'mock-id') {
          const res = await api.get(`/bookings/${bookingId}`);
          if (res.data?.data?.booking) {
            setBookingDetails(res.data.data.booking);
          }
        }
      } catch (err) {
        console.log('Error loading booking data:', err);
      }
    };
    fetchBooking();
  }, [bookingId]);

  const targetKWh = bookingDetails?.requestedEnergyKWh || 30;
  const progressPercent = Math.min(100, Math.round((deliveredKWh / targetKWh) * 100));

  // Pulse & Rotation animations for charging telemetry
  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timerInterval: NodeJS.Timeout;

    if (isCharging) {
      // Fluctuate electrical metrics realistically
      interval = setInterval(() => {
        const powerVar = (Math.random() - 0.5) * 3;
        const newPower = Number((138.5 + powerVar).toFixed(1));
        const newVolt = Math.round(416 + (Math.random() - 0.5) * 4);
        const newCurr = Math.round((newPower * 1000) / newVolt);
        const newTemp = Number((28.0 + Math.random() * 1.2).toFixed(1));

        setPower(newPower);
        setVoltage(newVolt);
        setCurrent(newCurr);
        setTemp(newTemp);
        setDeliveredKWh((prev) => {
          const next = Number((prev + 0.06).toFixed(2));
          return next > targetKWh ? targetKWh : next;
        });
      }, 1200);

      // Active session stopwatch
      timerInterval = setInterval(() => {
        setElapsedSeconds((prev) => prev + 1);
      }, 1000);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1200,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1200,
            useNativeDriver: true,
          }),
        ])
      ).start();

      Animated.loop(
        Animated.timing(spinAnim, {
          toValue: 1,
          duration: 7000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      setPower(0);
      setCurrent(0);
      pulseAnim.stopAnimation();
      spinAnim.stopAnimation();
    }

    return () => {
      clearInterval(interval);
      clearInterval(timerInterval);
    };
  }, [isCharging, targetKWh]);

  const formatTimer = (totalSec: number) => {
    const mins = Math.floor(totalSec / 60);
    const secs = totalSec % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const estRemainingMins = Math.max(1, Math.round(((targetKWh - deliveredKWh) / (power || 135)) * 60));

  const handleStopCharging = async () => {
    setIsCharging(false);
    setShowStopModal(false);

    const finalDelivered = Math.max(30, Math.round(deliveredKWh));
    if (bookingId && bookingId !== 'mock-id') {
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'CHARGING_COMPLETED',
          deliveredEnergyKWh: finalDelivered,
        });
      } catch (e) {
        console.error('Failed to complete charging status:', e);
      }
    }

    setTimeout(() => {
      navigation.navigate('BillGeneration', { bookingId });
    }, 600);
  };

  // Real customer and vehicle data
  const customerName =
    bookingDetails?.personalInfo?.name ||
    bookingDetails?.customerId?.name ||
    'EV Customer';

  const customerPhone =
    bookingDetails?.personalInfo?.phone ||
    bookingDetails?.customerId?.phone ||
    '';

  const vehicleModel =
    bookingDetails?.vehicleModel ||
    bookingDetails?.vehicleDetails?.model ||
    'Tata Nexon EV Max';

  const connectorType =
    bookingDetails?.connectorType ||
    'CCS2 DC Fast Charging';

  const spinInterpolation = spinAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Bright Clean Station Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backBtn}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>

        <View style={styles.headerTitleBox}>
          <View style={styles.stationBadge}>
            <Ionicons name="flash" size={12} color="#059669" />
            <Text style={styles.stationBadgeText}>VOLTRESCUE DISPATCH</Text>
          </View>
          <Text style={styles.headerTitle}>Live Charging Controls</Text>
        </View>

        <View style={styles.liveIndicator}>
          <Animated.View
            style={[
              styles.liveDot,
              {
                opacity: pulseAnim.interpolate({
                  inputRange: [0, 1],
                  outputRange: [0.4, 1],
                }),
              },
            ]}
          />
          <Text style={styles.liveText}>CHARGING</Text>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: Math.max(insets.bottom, 28) + 20 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* Main Telemetry & Dynamic Power Meter (Bright Aesthetic) */}
        <View style={styles.mainMeterCard}>
          {/* Top Session Stats Bar */}
          <View style={styles.meterTopRow}>
            <View style={styles.meterStatCol}>
              <Text style={styles.meterStatLabel}>SESSION TIME</Text>
              <Text style={styles.meterStatVal}>⏱️ {formatTimer(elapsedSeconds)}</Text>
            </View>

            <View style={styles.relayBadge}>
              <Ionicons name="shield-checkmark" size={13} color="#059669" />
              <Text style={styles.relayBadgeText}>HV RELAY LOCKED</Text>
            </View>

            <View style={[styles.meterStatCol, { alignItems: 'flex-end' }]}>
              <Text style={styles.meterStatLabel}>EST. REMAINING</Text>
              <Text style={styles.meterStatVal}>~{estRemainingMins} mins</Text>
            </View>
          </View>

          {/* Animated Power Gauge */}
          <View style={styles.powerDialContainer}>
            {/* Outer Glow Ring */}
            <Animated.View
              style={[
                styles.glowWaveRing,
                {
                  transform: [
                    {
                      scale: isCharging
                        ? pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.07],
                          })
                        : 1,
                    },
                  ],
                  opacity: pulseAnim.interpolate({
                    inputRange: [0, 1],
                    outputRange: [0.4, 0.85],
                  }),
                },
              ]}
            />

            {/* Rotating Tech Border */}
            <Animated.View
              style={[
                styles.rotatingTechRing,
                { transform: [{ rotate: spinInterpolation }] },
              ]}
            />

            {/* Core Power Box */}
            <View style={styles.powerCore}>
              <View style={styles.powerIconBadge}>
                <Ionicons name="flash" size={26} color="#059669" />
              </View>
              <Text style={styles.powerLargeValue}>{power.toFixed(1)}</Text>
              <Text style={styles.powerUnit}>KILOWATTS (kW)</Text>

              <View style={styles.energyTargetPill}>
                <Text style={styles.energyTargetPillText}>
                  {deliveredKWh.toFixed(1)} / {targetKWh} kWh ({progressPercent}%)
                </Text>
              </View>
            </View>
          </View>

          {/* Progress Bar */}
          <View style={styles.progressBarSection}>
            <View style={styles.progressLabelRow}>
              <Text style={styles.progressLabelText}>Target Energy Progress</Text>
              <Text style={styles.progressPercentText}>{progressPercent}%</Text>
            </View>
            <View style={styles.progressBarTrack}>
              <View
                style={[
                  styles.progressBarFill,
                  { width: `${progressPercent}%` },
                ]}
              />
            </View>
          </View>
        </View>

        {/* 4-Bento Electrical Telemetry Grid (Bright Clean Theme) */}
        <View style={styles.bentoMatrix}>
          {/* Voltage */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBadge, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="speedometer" size={18} color="#2563EB" />
            </View>
            <Text style={styles.bentoValue}>{voltage} V</Text>
            <Text style={styles.bentoLabel}>DC BUS VOLTAGE</Text>
            <View style={styles.bentoSubRow}>
              <View style={[styles.microDot, { backgroundColor: '#2563EB' }]} />
              <Text style={styles.bentoSubText}>800V Architecture</Text>
            </View>
          </View>

          {/* Current Amperage */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBadge, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="pulse" size={18} color="#D97706" />
            </View>
            <Text style={styles.bentoValue}>{current} A</Text>
            <Text style={styles.bentoLabel}>ACTIVE CURRENT</Text>
            <View style={styles.bentoSubRow}>
              <View style={[styles.microDot, { backgroundColor: '#D97706' }]} />
              <Text style={styles.bentoSubText}>High-Rate Flow</Text>
            </View>
          </View>

          {/* Battery Pack Temperature */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBadge, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="thermometer" size={18} color="#059669" />
            </View>
            <Text style={styles.bentoValue}>{temp} °C</Text>
            <Text style={styles.bentoLabel}>PACK TEMPERATURE</Text>
            <View style={styles.bentoSubRow}>
              <View style={[styles.microDot, { backgroundColor: '#059669' }]} />
              <Text style={styles.bentoSubText}>Optimal Band</Text>
            </View>
          </View>

          {/* Energy Delivered */}
          <View style={styles.bentoCard}>
            <View style={[styles.bentoIconBadge, { backgroundColor: '#FAF5FF' }]}>
              <Ionicons name="battery-charging" size={18} color="#9333EA" />
            </View>
            <Text style={styles.bentoValue}>{deliveredKWh} kWh</Text>
            <Text style={styles.bentoLabel}>DELIVERED SO FAR</Text>
            <View style={styles.bentoSubRow}>
              <View style={[styles.microDot, { backgroundColor: '#9333EA' }]} />
              <Text style={styles.bentoSubText}>~{(deliveredKWh * 5.2).toFixed(0)} km added</Text>
            </View>
          </View>
        </View>

        {/* Customer & Vehicle Info Panel with Direct Contact */}
        <View style={styles.infoCard}>
          <View style={styles.infoHeader}>
            <View style={styles.infoAvatar}>
              <Ionicons name="person" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.infoCustomerName}>{customerName}</Text>
              <Text style={styles.infoCustomerVehicle}>
                {vehicleModel} • {connectorType}
              </Text>
            </View>
          </View>

          {/* Quick Contact Buttons */}
          <View style={styles.actionRow}>
            <TouchableOpacity
              style={styles.actionBtnCall}
              onPress={() => {
                if (customerPhone) {
                  Linking.openURL(`tel:${customerPhone}`);
                } else {
                  Alert.alert('Phone Unavailable', 'No phone number provided for this customer.');
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="call" size={16} color="#059669" />
              <Text style={styles.actionBtnCallText}>Call Customer</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionBtnChat}
              onPress={() => {
                if (bookingId) {
                  navigation.navigate('Chat', {
                    bookingId,
                    isOperator: true,
                    otherPersonName: customerName,
                  });
                }
              }}
              activeOpacity={0.7}
            >
              <Ionicons name="chatbubble-ellipses" size={16} color="#0F172A" />
              <Text style={styles.actionBtnChatText}>Send Message</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Real-time Safety Protocol Checks */}
        <View style={styles.safetyCard}>
          <View style={styles.safetyTitleRow}>
            <Ionicons name="shield-checkmark" size={18} color="#059669" />
            <Text style={styles.safetyCardTitle}>ACTIVE BMS & SAFETY SUPERVISOR</Text>
          </View>
          <View style={styles.safetyGrid}>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.safetyItemText}>High-Voltage Cable Interlock Engaged</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.safetyItemText}>Ground Insulation: 500 MΩ (Safe)</Text>
            </View>
            <View style={styles.safetyItem}>
              <Ionicons name="checkmark-circle" size={16} color="#059669" />
              <Text style={styles.safetyItemText}>Live CAN Bus Telemetry Continuous</Text>
            </View>
          </View>
        </View>

        {/* Primary Action Button: Stop & Finalize */}
        <View style={styles.ctaArea}>
          <TouchableOpacity
            style={styles.stopChargingBtn}
            onPress={() => setShowStopModal(true)}
            activeOpacity={0.85}
          >
            <View style={styles.stopBtnIconBg}>
              <Ionicons name="stop" size={20} color="#FFFFFF" />
            </View>
            <View style={styles.stopBtnTextBox}>
              <Text style={styles.stopBtnMainText}>STOP CHARGING & DISPATCH INVOICE</Text>
              <Text style={styles.stopBtnSubText}>
                Safely de-energize DC relay and proceed to billing
              </Text>
            </View>
            <Ionicons name="chevron-forward" size={22} color="#FEE2E2" />
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Safety Confirmation Modal */}
      <Modal
        visible={showStopModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowStopModal(false)}
      >
        <View style={styles.modalBackdrop}>
          <View style={styles.modalContent}>
            <View style={styles.modalIconBox}>
              <Ionicons name="power" size={32} color="#DC2626" />
            </View>

            <Text style={styles.modalTitle}>Conclude DC Fast Charging?</Text>
            <Text style={styles.modalDesc}>
              This will ramp down high-voltage current, safely unlock the DC charging connector, and generate the final customer bill for{' '}
              <Text style={{ fontWeight: '800', color: '#0F172A' }}>
                {deliveredKWh.toFixed(1)} kWh
              </Text>.
            </Text>

            <View style={styles.modalSummaryBox}>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Delivered Energy:</Text>
                <Text style={styles.modalSummaryValue}>{deliveredKWh.toFixed(1)} kWh</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Session Time:</Text>
                <Text style={styles.modalSummaryValue}>{formatTimer(elapsedSeconds)}</Text>
              </View>
              <View style={styles.modalSummaryRow}>
                <Text style={styles.modalSummaryLabel}>Customer:</Text>
                <Text style={styles.modalSummaryValue}>{customerName}</Text>
              </View>
            </View>

            <View style={styles.modalActions}>
              <TouchableOpacity
                style={styles.modalCancelBtn}
                onPress={() => setShowStopModal(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.modalCancelText}>Continue Charging</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalConfirmBtn}
                onPress={handleStopCharging}
                activeOpacity={0.85}
              >
                <Text style={styles.modalConfirmText}>Yes, Finalize & Bill</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC', // Crisp bright clean background
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
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  stationBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stationBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginTop: 2,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  liveText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  /* Main Meter Card (Bright Aesthetic) */
  mainMeterCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 10,
    elevation: 3,
  },
  meterTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 16,
  },
  meterStatCol: {
    alignItems: 'flex-start',
  },
  meterStatLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  meterStatVal: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '800',
    marginTop: 2,
  },
  relayBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  relayBadgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.5,
  },

  /* Animated Power Dial */
  powerDialContainer: {
    width: 220,
    height: 220,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 10,
    position: 'relative',
  },
  glowWaveRing: {
    position: 'absolute',
    width: 210,
    height: 210,
    borderRadius: 105,
    backgroundColor: '#ECFDF5',
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  rotatingTechRing: {
    position: 'absolute',
    width: 190,
    height: 190,
    borderRadius: 95,
    borderWidth: 2,
    borderColor: '#CBD5E1',
    borderStyle: 'dashed',
  },
  powerCore: {
    width: 164,
    height: 164,
    borderRadius: 82,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  powerIconBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 4,
  },
  powerLargeValue: {
    color: '#0F172A',
    fontSize: 36,
    fontWeight: '900',
    letterSpacing: -1,
  },
  powerUnit: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 1.2,
    marginTop: 2,
  },
  energyTargetPill: {
    backgroundColor: '#F8FAFC',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 10,
    marginTop: 6,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  energyTargetPillText: {
    color: '#475569',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Progress Bar */
  progressBarSection: {
    width: '100%',
    marginTop: 14,
  },
  progressLabelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  progressLabelText: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
  },
  progressPercentText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  progressBarTrack: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },

  /* Bento Matrix */
  bentoMatrix: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bentoCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  bentoIconBadge: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  bentoValue: {
    color: '#0F172A',
    fontSize: 20,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  bentoLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
    marginTop: 2,
  },
  bentoSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 8,
  },
  microDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  bentoSubText: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '600',
  },

  /* Customer & Vehicle Info Panel */
  infoCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 14,
  },
  infoAvatar: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  infoCustomerName: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  infoCustomerVehicle: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    marginTop: 2,
  },
  actionRow: {
    flexDirection: 'row',
    gap: 10,
  },
  actionBtnCall: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  actionBtnCallText: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '700',
  },
  actionBtnChat: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    paddingVertical: 11,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  actionBtnChatText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },

  /* Safety Checks Card */
  safetyCard: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  safetyTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  safetyCardTitle: {
    color: '#15803D',
    fontSize: 11,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  safetyGrid: {
    gap: 6,
  },
  safetyItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  safetyItemText: {
    color: '#166534',
    fontSize: 12,
    fontWeight: '600',
  },

  /* CTA Stop Charging Button */
  ctaArea: {
    marginTop: 4,
  },
  stopChargingBtn: {
    backgroundColor: '#DC2626',
    borderRadius: 20,
    paddingVertical: 16,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    shadowColor: '#DC2626',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  stopBtnIconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  stopBtnTextBox: {
    flex: 1,
  },
  stopBtnMainText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '900',
    letterSpacing: 0.4,
  },
  stopBtnSubText: {
    color: '#FEE2E2',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },

  /* Confirmation Modal */
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.65)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 24,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 8,
  },
  modalIconBox: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#FEE2E2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 8,
  },
  modalDesc: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 16,
  },
  modalSummaryBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 14,
    gap: 8,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalSummaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  modalSummaryLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  modalSummaryValue: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  modalActions: {
    flexDirection: 'row',
    gap: 10,
    width: '100%',
  },
  modalCancelBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
  },
  modalCancelText: {
    color: '#475569',
    fontSize: 13,
    fontWeight: '700',
  },
  modalConfirmBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    backgroundColor: '#DC2626',
    alignItems: 'center',
  },
  modalConfirmText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '800',
  },
});

export default ChargingControlsScreen;
