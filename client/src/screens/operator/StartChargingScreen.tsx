import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
  Easing,
  TextInput,
  ActivityIndicator,
  Platform,
  StatusBar,
  BackHandler,
  Alert,
  Linking,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import storage from '../../services/storage';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const StartChargingScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const { bookingId, isOperator: paramIsOperator } = route.params || {};
  const { status: socketStatus } = useBookingState(bookingId);

  const [isOperator, setIsOperator] = useState(paramIsOperator !== undefined ? paramIsOperator : true);
  const [localStatus, setLocalStatus] = useState<string | null>(null);
  const [checklist, setChecklist] = useState({
    cable: false, // Operator must manually confirm physical cable is plugged in!
    perimeter: true,
  });

  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otp, setOtp] = useState('');
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const otpVerifiedRef = useRef(false);

  const currentStatus = socketStatus || localStatus || bookingDetails?.status;
  const isOtpVerified = [
    'OTP_VERIFIED',
    'CHARGING_STARTED',
    'CHARGING_IN_PROGRESS',
    'CHARGING_COMPLETED',
    'INVOICE_GENERATED',
    'PAYMENT_PENDING',
    'PAYMENT_SUCCESS',
    'COMPLETED',
    'BOOKING_COMPLETED',
  ].includes(currentStatus || '');

  useEffect(() => {
    const checkRole = async () => {
      if (paramIsOperator !== undefined) {
        setIsOperator(paramIsOperator);
        return;
      }
      const token = await storage.getItem('operatorToken');
      setIsOperator(!!token);
    };
    checkRole();
  }, [paramIsOperator]);

  // Prevent closing during site arrival & OTP handshake
  useEffect(() => {
    const onBackPress = () => {
      return true; // prevent accidental exit
    };
    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  // Auto-navigate customer to LiveCharging once technician initiates charging
  useEffect(() => {
    if (!isOperator) {
      if (
        currentStatus === 'CHARGING_STARTED' ||
        currentStatus === 'CHARGING_IN_PROGRESS'
      ) {
        navigation.navigate('LiveCharging', { bookingId });
      }
    }
  }, [isOperator, currentStatus, bookingId, navigation]);

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 1500,
          easing: Easing.in(Easing.ease),
          useNativeDriver: true,
        }),
      ])
    ).start();

    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const booking = res.data.data.booking;
        setBookingDetails(booking);
        if (booking?.status) {
          setLocalStatus(booking.status);
        }
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };
    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    }
  }, [bookingId]);

  // Auto-verify OTP when 6 digits are entered (Does NOT auto start charging)
  useEffect(() => {
    const verifyOtp = async () => {
      if (otp.length === 6 && !isOtpVerified && !otpVerifiedRef.current && !isVerifyingOtp) {
        setIsVerifyingOtp(true);
        try {
          if (bookingId && bookingId !== 'mock-id') {
            await api.patch(`/bookings/${bookingId}/status`, {
              status: 'OTP_VERIFIED',
              otp,
            });
          }
          otpVerifiedRef.current = true;
          setLocalStatus('OTP_VERIFIED');
        } catch (err: any) {
          console.error(err);
          Alert.alert('Invalid OTP', err.response?.data?.message || 'The OTP entered does not match the customer OTP.');
          setOtp('');
        } finally {
          setIsVerifyingOtp(false);
        }
      }
    };
    verifyOtp();
  }, [otp, isOtpVerified]);

  // Manual Start DC Charging Action (Triggered only by operator button tap after cable confirmation)
  const handleStart = async () => {
    if (!checklist.cable) {
      Alert.alert('Cable Connection Required', 'Please plug in and lock the charging cable into the vehicle before starting charging.');
      return;
    }
    setIsStarting(true);
    try {
      if (bookingId && bookingId !== 'mock-id') {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'CHARGING_STARTED',
        });
      }
      navigation.navigate(isOperator ? 'ChargingControls' : 'LiveCharging', { bookingId });
    } catch (err: any) {
      console.error(err);
      Alert.alert('Charging Error', err.response?.data?.message || 'Error initializing charging session.');
    } finally {
      setIsStarting(false);
    }
  };

  const toggleCable = () => {
    setChecklist((prev) => ({ ...prev, cable: !prev.cable }));
  };

  const togglePerimeter = () => {
    setChecklist((prev) => ({ ...prev, perimeter: !prev.perimeter }));
  };

  const customerName =
    bookingDetails?.personalInfo?.name ||
    bookingDetails?.customerId?.name ||
    bookingDetails?.customerName ||
    'Customer';
  const customerPhone =
    bookingDetails?.personalInfo?.phone ||
    bookingDetails?.customerId?.phone ||
    bookingDetails?.customerPhone ||
    bookingDetails?.userPhone ||
    '';
  const vehicleModel =
    bookingDetails?.vehicleModel ||
    bookingDetails?.vehicleDetails?.model ||
    'Tata Nexon EV';
  const connectorType = bookingDetails?.connectorType || 'CCS2';
  const requestedKWh = bookingDetails?.requestedEnergyKWh || 30;

  const canStartCharging = isOtpVerified && checklist.cable && checklist.perimeter && !isStarting;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerSub}>
            {isOperator ? 'SITE ARRIVAL & CHARGING SETUP' : 'OPERATOR ARRIVED'}
          </Text>
          <Text style={styles.headerTitle}>{isOperator ? customerName : 'VoltRescue Operator'}</Text>
        </View>
        <View style={styles.headerStatusDot} />
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 28) }]}
        showsVerticalScrollIndicator={false}
      >
        {!isOperator ? (
          /* Customer View */
          <View style={styles.customerContainer}>
            <View style={styles.customerHero}>
              <View style={styles.iconCircleEmerald}>
                <Ionicons name="flash" size={32} color="#059669" />
              </View>
              <Text style={styles.customerHeroTitle}>Rescue Van Has Arrived! 🎉</Text>
              <Text style={styles.customerHeroSub}>
                Please meet your rescue technician at your vehicle and share your 6-digit PIN to begin charging.
              </Text>
            </View>

            {/* Operator Card with Direct Contact */}
            <View style={styles.operatorContactCard}>
              <View style={styles.operatorInfoLeft}>
                <View style={styles.operatorAvatarBox}>
                  <Ionicons name="person" size={24} color="#059669" />
                </View>
                <View style={{ marginLeft: 12 }}>
                  <Text style={styles.operatorName}>
                    {bookingDetails?.operatorId?.name || 'VoltRescue Technician'}
                  </Text>
                  <Text style={styles.operatorVehicle}>
                    {bookingDetails?.operatorId?.vehicleDetails?.model || 'Mobile Fast Charger Van #4'}
                  </Text>
                </View>
              </View>

              <View style={styles.operatorActions}>
                <TouchableOpacity
                  style={styles.actionBtnCircle}
                  onPress={() => {
                    const phone = bookingDetails?.operatorId?.phone || '1800123456';
                    Linking.openURL(`tel:${phone}`);
                  }}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={18} color="#FFFFFF" />
                </TouchableOpacity>
              </View>
            </View>

            {/* 6-Digit OTP Box */}
            {isOtpVerified ? (
              <View style={styles.otpSuccessCard}>
                <View style={styles.successIconBox}>
                  <Ionicons name="checkmark-circle" size={36} color="#059669" />
                </View>
                <Text style={styles.otpSuccessTitle}>Identity & Safety Verified</Text>
                <Text style={styles.otpSuccessDesc}>
                  Technician is connecting the high-voltage cable and initializing rapid DC charging...
                </Text>
              </View>
            ) : (
              <View style={styles.otpCard}>
                <Text style={styles.otpCardLabel}>YOUR 6-DIGIT RESCUE PIN</Text>
                <View style={styles.otpDigitRow}>
                  {(bookingDetails?.otp || '171723').split('').map((digit: string, idx: number) => (
                    <View key={idx} style={styles.otpDigitBox}>
                      <Text style={styles.otpDigitLarge}>{digit}</Text>
                    </View>
                  ))}
                </View>
                <Text style={styles.otpDisplayDesc}>
                  Provide this 6-digit PIN to the operator before connecting the charging cable.
                </Text>
              </View>
            )}

            <View style={styles.waitingBox}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.waitingBoxText}>
                {isOtpVerified
                  ? 'Technician connecting high-voltage cable...'
                  : 'Waiting for operator to enter your OTP...'}
              </Text>
            </View>
          </View>
        ) : (
          /* Operator View */
          <View style={styles.operatorContainer}>
            {/* Customer & EV Info Card */}
            <View style={styles.customerCard}>
              <View style={styles.customerInfoLeft}>
                <View style={styles.customerAvatarBox}>
                  <Ionicons name="person" size={20} color="#059669" />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.customerNameText}>{customerName}</Text>
                  <Text style={styles.customerVehicleText}>
                    {vehicleModel} • {connectorType} ({requestedKWh} kWh DC)
                  </Text>
                </View>
              </View>

              {customerPhone ? (
                <TouchableOpacity
                  style={styles.callButtonSmall}
                  onPress={() => Linking.openURL(`tel:${customerPhone}`)}
                  activeOpacity={0.8}
                >
                  <Ionicons name="call" size={16} color="#FFFFFF" />
                  <Text style={styles.callButtonText}>Call</Text>
                </TouchableOpacity>
              ) : null}
            </View>

            {/* Step 1: Customer OTP Verification */}
            <View style={styles.stepCard}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumberBadge, isOtpVerified && { backgroundColor: '#059669' }]}>
                  <Text style={styles.stepNumberText}>{isOtpVerified ? '✓' : '1'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>CUSTOMER OTP PIN VERIFICATION</Text>
                  <Text style={styles.stepSub}>
                    {isOtpVerified ? 'Identity verified successfully' : 'Ask customer for their 6-digit PIN'}
                  </Text>
                </View>
              </View>

              {isOtpVerified ? (
                <View style={styles.otpVerifiedBanner}>
                  <Ionicons name="shield-checkmark" size={20} color="#059669" />
                  <Text style={styles.otpVerifiedBannerText}>
                    PIN Verified: {bookingDetails?.otp || otp || 'Verified'}
                  </Text>
                </View>
              ) : (
                <View style={styles.otpInputContainer}>
                  <View style={styles.otpBoxesWrapper}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <View
                        key={index}
                        style={[
                          styles.otpBox,
                          otp.length === index && styles.otpBoxActive,
                          otp.length > index && styles.otpBoxFilled,
                        ]}
                      >
                        <Text style={styles.otpBoxText}>{otp[index] ? otp[index] : '•'}</Text>
                      </View>
                    ))}
                    <TextInput
                      style={styles.hiddenOtpInput}
                      keyboardType="numeric"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      caretHidden={true}
                      editable={!isVerifyingOtp}
                    />
                  </View>
                  {isVerifyingOtp && (
                    <View style={styles.verifyingRow}>
                      <ActivityIndicator size="small" color="#059669" />
                      <Text style={styles.verifyingText}>Verifying PIN...</Text>
                    </View>
                  )}
                </View>
              )}
            </View>

            {/* Step 2: Physical Cable & Safety Check (Human in the loop) */}
            <View style={[styles.stepCard, !isOtpVerified && { opacity: 0.45 }]}>
              <View style={styles.stepHeader}>
                <View style={[styles.stepNumberBadge, checklist.cable && { backgroundColor: '#059669' }]}>
                  <Text style={styles.stepNumberText}>{checklist.cable ? '✓' : '2'}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.stepTitle}>PHYSICAL CABLE & SAFETY LOCK</Text>
                  <Text style={styles.stepSub}>Connect charging gun and confirm security</Text>
                </View>
              </View>

              {/* Cable Checkbox */}
              <TouchableOpacity
                style={[
                  styles.checklistItem,
                  checklist.cable ? styles.checklistItemActive : styles.checklistItemInactive,
                ]}
                onPress={toggleCable}
                disabled={!isOtpVerified}
                activeOpacity={0.7}
              >
                <View style={checklist.cable ? styles.checkIconBoxActive : styles.checkIconBoxInactive}>
                  <Ionicons name="link" size={18} color={checklist.cable ? '#059669' : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>Charging cable connected & locked</Text>
                  <Text style={styles.checkDesc}>High-voltage gun firmly engaged in vehicle port</Text>
                </View>
                <Ionicons
                  name={checklist.cable ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={checklist.cable ? '#059669' : '#CBD5E1'}
                />
              </TouchableOpacity>

              {/* Safety Perimeter Checkbox */}
              <TouchableOpacity
                style={[
                  styles.checklistItem,
                  checklist.perimeter ? styles.checklistItemActive : styles.checklistItemInactive,
                ]}
                onPress={togglePerimeter}
                disabled={!isOtpVerified}
                activeOpacity={0.7}
              >
                <View style={checklist.perimeter ? styles.checkIconBoxActive : styles.checkIconBoxInactive}>
                  <Ionicons name="shield-checkmark" size={18} color={checklist.perimeter ? '#059669' : '#94A3B8'} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.checkTitle}>Safety perimeter clear</Text>
                  <Text style={styles.checkDesc}>Vehicle in Park/Neutral, no nearby hazard</Text>
                </View>
                <Ionicons
                  name={checklist.perimeter ? 'checkmark-circle' : 'ellipse-outline'}
                  size={24}
                  color={checklist.perimeter ? '#059669' : '#CBD5E1'}
                />
              </TouchableOpacity>
            </View>

            {/* Step 3: Explicit Manual Action Button */}
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={[
                  styles.startChargingButton,
                  !canStartCharging && styles.startChargingButtonDisabled,
                ]}
                onPress={handleStart}
                disabled={!canStartCharging}
                activeOpacity={0.88}
              >
                {isStarting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <Ionicons name="flash" size={22} color="#FFFFFF" />
                    <Text style={styles.startChargingButtonText}>START RAPID DC CHARGING</Text>
                  </>
                )}
              </TouchableOpacity>

              {!isOtpVerified ? (
                <Text style={styles.safetyHint}>🔒 Enter customer 6-digit OTP to unlock charging</Text>
              ) : !checklist.cable ? (
                <Text style={styles.safetyHint}>⚠️ Please confirm the charging cable is connected</Text>
              ) : (
                <Text style={styles.safetyHintReady}>⚡ All safety checks cleared. Ready to charge.</Text>
              )}
            </View>
          </View>
        )}
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
    alignItems: 'center',
  },
  headerSub: {
    fontSize: 10,
    fontWeight: '800',
    color: '#059669',
    letterSpacing: 0.8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#0F172A',
    marginTop: 2,
  },
  headerStatusDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#059669',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },

  // Customer View Styles
  customerContainer: {
    gap: 14,
  },
  customerHero: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 22,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  iconCircleEmerald: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
    borderWidth: 2,
    borderColor: '#A7F3D0',
  },
  customerHeroTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#0F172A',
    marginBottom: 6,
  },
  customerHeroSub: {
    fontSize: 13,
    color: '#64748B',
    textAlign: 'center',
    lineHeight: 18,
  },
  operatorContactCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  operatorInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  operatorAvatarBox: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  operatorName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  operatorVehicle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  operatorActions: {
    marginLeft: 10,
  },
  actionBtnCircle: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpCard: {
    backgroundColor: '#0F172A',
    borderRadius: 22,
    padding: 20,
    alignItems: 'center',
  },
  otpCardLabel: {
    fontSize: 11,
    fontWeight: '900',
    color: '#10B981',
    letterSpacing: 0.8,
    marginBottom: 14,
  },
  otpDigitRow: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  otpDigitBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.12)',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: 'rgba(16, 185, 129, 0.4)',
  },
  otpDigitLarge: {
    fontSize: 24,
    fontWeight: '900',
    color: '#FFFFFF',
  },
  otpDisplayDesc: {
    fontSize: 12,
    color: '#94A3B8',
    textAlign: 'center',
  },
  otpSuccessCard: {
    backgroundColor: '#ECFDF5',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  successIconBox: {
    marginBottom: 8,
  },
  otpSuccessTitle: {
    fontSize: 16,
    fontWeight: '900',
    color: '#065F46',
    marginBottom: 4,
  },
  otpSuccessDesc: {
    fontSize: 13,
    color: '#047857',
    textAlign: 'center',
    lineHeight: 18,
  },
  waitingBox: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  waitingBoxText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },

  // Operator View Styles
  operatorContainer: {
    gap: 14,
  },
  customerCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  customerInfoLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  customerAvatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  customerNameText: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  customerVehicleText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginTop: 2,
  },
  callButtonSmall: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  callButtonText: {
    fontSize: 12,
    fontWeight: '800',
    color: '#FFFFFF',
  },

  // Step Cards
  stepCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
    gap: 12,
  },
  stepHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumberBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepNumberText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '900',
  },
  stepTitle: {
    fontSize: 11,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
  },
  stepSub: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    marginTop: 1,
  },

  // OTP Input Boxes
  otpInputContainer: {
    alignItems: 'center',
    marginTop: 4,
  },
  otpBoxesWrapper: {
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
  },
  otpBox: {
    width: 44,
    height: 52,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  otpBoxActive: {
    borderColor: '#059669',
    backgroundColor: '#FFFFFF',
  },
  otpBoxFilled: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  otpBoxText: {
    fontSize: 22,
    fontWeight: '900',
    color: '#0F172A',
  },
  hiddenOtpInput: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    opacity: 0,
  },
  verifyingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  verifyingText: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '700',
  },
  otpVerifiedBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#ECFDF5',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  otpVerifiedBannerText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#065F46',
  },

  // Checklist
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    borderRadius: 14,
    borderWidth: 1.5,
  },
  checklistItemActive: {
    backgroundColor: '#ECFDF5',
    borderColor: '#A7F3D0',
  },
  checklistItemInactive: {
    backgroundColor: '#F8FAFC',
    borderColor: '#E2E8F0',
  },
  checkIconBoxActive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#D1FAE5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkIconBoxInactive: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E2E8F0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkTitle: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  checkDesc: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },

  // Action Button
  actionContainer: {
    gap: 8,
    marginTop: 4,
  },
  startChargingButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#059669',
    borderRadius: 18,
    paddingVertical: 18,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
  },
  startChargingButtonDisabled: {
    backgroundColor: '#94A3B8',
    shadowOpacity: 0,
    elevation: 0,
  },
  startChargingButtonText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
  safetyHint: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
    textAlign: 'center',
  },
  safetyHintReady: {
    fontSize: 12,
    fontWeight: '800',
    color: '#059669',
    textAlign: 'center',
  },
});

export default StartChargingScreen;
