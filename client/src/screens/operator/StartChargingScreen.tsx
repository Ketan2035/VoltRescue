import React, { useState, useRef, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Animated, Easing, TextInput, ActivityIndicator } from 'react-native';
import storage from '../../services/storage';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const StartChargingScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);

  const [isOperator, setIsOperator] = useState(false);
  const [checklist, setChecklist] = useState({
    cable: true,
    perimeter: false,
  });
  
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [isStarting, setIsStarting] = useState(false);
  const [otp, setOtp] = useState('');
  const pulseAnim = React.useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const checkRole = async () => {
      const token = await storage.getItem('operatorToken');
      if (token) setIsOperator(true);
    };
    checkRole();
  }, []);

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
        setBookingDetails(res.data.data.booking);
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };
    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    }
  }, [bookingId]);

  // Auto-verify OTP when 6 digits are entered
  useEffect(() => {
    const verifyOtp = async () => {
      if (otp.length === 6 && (status === 'ARRIVING' || status === 'DRIVER_STARTED') && !isStarting) {
        setIsStarting(true);
        try {
          await api.patch(`/bookings/${bookingId}/status`, {
            status: 'OTP_VERIFIED',
            otp
          });
        } catch (err: any) {
          console.error(err);
          alert(err.response?.data?.message || 'Invalid OTP');
          setOtp('');
        } finally {
          setIsStarting(false);
        }
      }
    };
    verifyOtp();
  }, [otp, status]);

  const handleStart = async () => {
    if (bookingId && bookingId !== 'mock-id') {
      setIsStarting(true);
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'CHARGING_STARTED'
        });
      } catch (err: any) {
        console.error(err);
        alert(err.response?.data?.message || 'Error starting session');
      } finally {
        setIsStarting(false);
      }
    } else {
      navigation.navigate('LiveCharging', { bookingId });
    }
  };

  const togglePerimeter = () => {
    setChecklist(prev => ({ ...prev, perimeter: !prev.perimeter }));
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top App Bar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={styles.avatarBox}>
            <Image 
              source={{ uri: isOperator 
                ? 'https://lh3.googleusercontent.com/aida-public/AB6AXuBUhUHdkVi4TXl0RqamXISKJHyUqX13-G_auFfIcFf-gOyzlDKv2lprGPkrKF75lyV2ORH9OlRd5cckkCyvukYcPo1ywAQXCQ_yYf3_XJ0frbhGhW_kYFK0G7m3s0BY9okUJ5ESl99SHsPo4p1XiT76eb4his6yix-1APFjjxyfQUhY6uoMe5BcO3LUXPpN4wS_o8y_tjXum-6ECsqhb6QjgVU9Y4LESyBs6T_U0DeCtdGgQWW6aBsM8xR2b2zCi8hkKi0gntPclGI5'
                : (bookingDetails?.operatorId?.profileImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDui1QNv4jKMbmBX59Ru5zSy9YFoxzvIKknM3LDFO9L0ctO2GFt0R7hl7q2m_0ZmxDgLGxhhTITkrefmWaTpIjWVtu0Lg-skqEk9qYxXztiQmRq--tCG59PkCVPq6-iiUK0OO30AkSusjiQiOlXBTFCyoLoGIrmhq37QqljDAHwLZEtXyx9wuVjAKufhKZ4JWiMTJD_d-JYQq9HPrdPBCOJxteaeYoph9kIEOs6EW0PvRAq1kk5U5R9O5v9L8K4Eb0RpzvjR0XDrcZK')
              }}
              style={styles.avatar}
            />
          </View>
          <View>
            <Text style={styles.headerSub}>{isOperator ? 'ACTIVE REQUEST' : 'OPERATOR ARRIVED'}</Text>
            <Text style={styles.headerTitle}>
              {isOperator 
                ? (bookingDetails?.customerId?.name || 'Customer')
                : (bookingDetails?.operatorId?.name || 'Operator')}
            </Text>
          </View>
        </View>
        <TouchableOpacity>
          <Text style={styles.notificationIcon}>🔔</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>

        {!isOperator ? (
          /* ==================================================
             CUSTOMER VIEW
          ================================================== */
          <View style={styles.customerContainer}>
            <View style={styles.customerHero}>
              <Text style={styles.customerHeroTitle}>Rescue Van is Here!</Text>
              <Text style={styles.customerHeroSub}>Please meet your operator at your vehicle to begin the charging session.</Text>
            </View>

            {status === 'OTP_VERIFIED' ? (
              <View style={styles.otpSuccessCard}>
                <Text style={styles.otpSuccessIcon}>✅</Text>
                <Text style={styles.otpSuccessTitle}>Identity Verified</Text>
                <Text style={styles.otpSuccessDesc}>Operator is completing safety checks and preparing to start the charge.</Text>
              </View>
            ) : (
              <View style={styles.otpDisplayCard}>
                <Text style={styles.otpDisplayLabel}>YOUR SECURE OTP</Text>
                <Text style={styles.otpDisplayValue}>{bookingDetails?.otp || '----'}</Text>
                <Text style={styles.otpDisplayDesc}>Share this 6-digit code with the operator to verify your identity and start charging.</Text>
              </View>
            )}

            <View style={styles.waitingBox}>
              <ActivityIndicator size="large" color={colors.secondaryFixed} />
              <Text style={styles.waitingBoxText}>
                {status === 'OTP_VERIFIED' ? 'Waiting for operator to begin charge...' : 'Waiting for operator to verify OTP...'}
              </Text>
            </View>
          </View>
        ) : (
          /* ==================================================
             OPERATOR VIEW
          ================================================== */
          <View style={styles.operatorContainer}>
            <View style={styles.statusCard}>
              <View style={styles.statusRow}>
                <View>
                  <Text style={styles.statusTitle}>Arrived at Location</Text>
                  <Text style={styles.statusDesc}>Ready to initiate high-speed charging.</Text>
                </View>
                <View style={styles.locationIconBox}>
                  <Text style={styles.locationIcon}>📍</Text>
                </View>
              </View>
              <View style={styles.calibrationRow}>
                <View style={styles.calibrationDot} />
                <Text style={styles.calibrationText}>SYSTEM CALIBRATED</Text>
              </View>
            </View>

            <View style={styles.vehicleCard}>
              <View style={styles.vehicleInfoRow}>
                <View>
                  <Text style={styles.infoLabel}>CONNECTOR</Text>
                  <Text style={styles.infoValue}>{bookingDetails?.connectorType || 'CCS2'}</Text>
                </View>
                <View style={{ alignItems: 'flex-end' }}>
                  <Text style={styles.infoLabel}>REQ ENERGY</Text>
                  <Text style={styles.infoValueError}>{bookingDetails?.requestedEnergyKWh || 0} kWh</Text>
                </View>
              </View>
            </View>

            <View style={styles.actionArea}>
              
              {status === 'OTP_VERIFIED' ? (
                <View style={styles.otpVerifiedContainer}>
                  <Text style={styles.otpSuccessIconLarge}>✅</Text>
                  <Text style={styles.otpVerifiedText}>OTP Verified Successfully</Text>
                </View>
              ) : (
                <View style={styles.otpInputContainer}>
                  <Text style={styles.otpInputLabel}>Customer OTP Required</Text>
                  
                  <View style={styles.otpBoxesWrapper}>
                    {[0, 1, 2, 3, 4, 5].map((index) => (
                      <View 
                        key={index} 
                        style={[
                          styles.otpBox, 
                          otp.length === index && styles.otpBoxActive,
                          otp.length > index && styles.otpBoxFilled
                        ]}
                      >
                        <Text style={styles.otpBoxText}>
                          {otp[index] ? otp[index] : '•'}
                        </Text>
                      </View>
                    ))}
                    
                    {/* Hidden input overlaying the boxes to capture native keyboard events naturally */}
                    <TextInput
                      style={styles.hiddenOtpInput}
                      keyboardType="numeric"
                      maxLength={6}
                      value={otp}
                      onChangeText={setOtp}
                      caretHidden={true}
                      autoFocus={false}
                      editable={!isStarting}
                    />
                  </View>
                </View>
              )}

              {/* Only show checklist and start button once OTP is verified */}
              <View style={[styles.checklist, status !== 'OTP_VERIFIED' && { opacity: 0.3 }]} pointerEvents={status === 'OTP_VERIFIED' ? 'auto' : 'none'}>
                <View style={[styles.checklistItem, styles.checklistActive]}>
                  <View style={styles.checkIconBoxActive}>
                    <Text style={styles.checkIconActive}>🔗</Text>
                  </View>
                  <View style={styles.checkTextContent}>
                    <Text style={styles.checkTitle}>Secure cable connection</Text>
                    <Text style={styles.checkDesc}>Ensure plug is fully engaged</Text>
                  </View>
                  <Text style={styles.checkStatusIconActive}>✓</Text>
                </View>

                <TouchableOpacity 
                  style={[styles.checklistItem, checklist.perimeter ? styles.checklistActive : styles.checklistInactive]}
                  onPress={togglePerimeter}
                >
                  <View style={checklist.perimeter ? styles.checkIconBoxActive : styles.checkIconBoxInactive}>
                    <Text style={checklist.perimeter ? styles.checkIconActive : styles.checkIconInactive}>🛡️</Text>
                  </View>
                  <View style={styles.checkTextContent}>
                    <Text style={styles.checkTitle}>Safety perimeter clear</Text>
                    <Text style={styles.checkDesc}>No obstructions within 2 meters</Text>
                  </View>
                  <Text style={checklist.perimeter ? styles.checkStatusIconActive : styles.checkStatusIconInactive}>
                    {checklist.perimeter ? '✓' : '○'}
                  </Text>
                </TouchableOpacity>
              </View>

              <View style={styles.startOuterBox}>
                <Animated.View style={[styles.startPulse, {
                  transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.2] }) }],
                  opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.5, 0] })
                }]} />
                <TouchableOpacity 
                  style={[styles.startButton, (!checklist.perimeter || status !== 'OTP_VERIFIED') && { opacity: 0.5 }]} 
                  onPress={handleStart}
                  disabled={isStarting || !checklist.perimeter || status !== 'OTP_VERIFIED'}
                >
                  <Text style={styles.startIcon}>{isStarting ? '🔄' : '⚡'}</Text>
                  <Text style={styles.startText}>{isStarting ? 'WAIT...' : 'START'}</Text>
                  {!isStarting && <Text style={styles.startSub}>SESSION</Text>}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        )}

      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'rgba(173,198,255,0.2)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  headerSub: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  notificationIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  /* Customer Styles */
  customerContainer: {
    gap: 24,
    paddingTop: 20,
  },
  customerHero: {
    alignItems: 'center',
    marginBottom: 16,
  },
  customerHeroTitle: {
    color: colors.onSurface,
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  customerHeroSub: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: '80%',
    lineHeight: 20,
  },
  otpDisplayCard: {
    backgroundColor: 'rgba(47, 248, 1, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(47, 248, 1, 0.3)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  otpDisplayLabel: {
    color: colors.secondaryFixed,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 2,
    marginBottom: 16,
  },
  otpDisplayValue: {
    color: '#fff',
    fontSize: 48,
    fontWeight: 'bold',
    letterSpacing: 10,
    marginBottom: 16,
  },
  otpDisplayDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 18,
  },
  otpSuccessCard: {
    backgroundColor: 'rgba(47, 248, 1, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(47, 248, 1, 0.3)',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
  },
  otpSuccessIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  otpSuccessTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  otpSuccessDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  waitingBox: {
    flexDirection: 'row',
    backgroundColor: 'rgba(32, 31, 31, 0.8)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    marginTop: 20,
  },
  waitingBoxText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '600',
  },
  /* Operator Styles */
  operatorContainer: {
    gap: 24,
  },
  statusCard: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  statusTitle: {
    color: colors.secondaryContainer,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statusDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 4,
  },
  locationIconBox: {
    backgroundColor: 'rgba(47,248,1,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  locationIcon: {
    fontSize: 20,
  },
  calibrationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginTop: 16,
  },
  calibrationDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryContainer,
  },
  calibrationText: {
    color: colors.secondaryContainer,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  vehicleCard: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  vehicleInfoRow: {
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  infoLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  infoValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  infoValueError: {
    color: colors.error,
    fontSize: 24,
    fontWeight: 'bold',
  },
  actionArea: {
    alignItems: 'center',
    gap: 32,
    paddingVertical: 16,
  },
  otpVerifiedContainer: {
    backgroundColor: 'rgba(47, 248, 1, 0.05)',
    borderWidth: 1,
    borderColor: 'rgba(47, 248, 1, 0.3)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    width: '100%',
  },
  otpSuccessIconLarge: {
    fontSize: 48,
    marginBottom: 8,
  },
  otpVerifiedText: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  otpInputContainer: {
    width: '100%',
    alignItems: 'center',
    backgroundColor: 'rgba(32,31,31,0.5)',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173,198,255,0.1)',
  },
  otpInputLabel: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    letterSpacing: 1,
  },
  otpBoxesWrapper: {
    flexDirection: 'row',
    gap: 8,
    position: 'relative',
    justifyContent: 'center',
    width: '100%',
  },
  otpBox: {
    width: 44,
    height: 56,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  otpBoxFilled: {
    borderColor: colors.primary,
    backgroundColor: 'rgba(173,198,255,0.05)',
  },
  otpBoxActive: {
    borderColor: colors.secondaryContainer,
    borderWidth: 2,
    backgroundColor: 'rgba(47,248,1,0.05)',
  },
  otpBoxText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  hiddenOtpInput: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0,
    color: 'transparent',
    fontSize: 1, // to keep it rendering on screen but invisible
  },
  startOuterBox: {
    width: 180,
    height: 180,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    marginTop: 16,
  },
  startPulse: {
    position: 'absolute',
    width: 180,
    height: 180,
    borderRadius: 90,
    borderWidth: 20,
    borderColor: colors.secondaryContainer,
  },
  startButton: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondaryContainer,
    shadowOpacity: 0.6,
    shadowRadius: 20,
    elevation: 10,
  },
  startIcon: {
    fontSize: 40,
    color: colors.onSecondaryContainer,
    marginBottom: 8,
  },
  startText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: colors.onSecondaryContainer,
  },
  startSub: {
    fontSize: 10,
    fontWeight: 'bold',
    color: 'rgba(15, 109, 0, 0.8)',
    letterSpacing: 2,
    marginTop: 4,
  },
  checklist: {
    width: '100%',
    gap: 12,
  },
  checklistItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(32,31,31,0.8)',
    padding: 16,
    borderRadius: 16,
    borderLeftWidth: 4,
  },
  checklistActive: {
    borderLeftColor: colors.secondaryContainer,
  },
  checklistInactive: {
    borderLeftColor: 'rgba(173,198,255,0.4)',
  },
  checkIconBoxActive: {
    backgroundColor: 'rgba(47,248,1,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  checkIconBoxInactive: {
    backgroundColor: 'rgba(173,198,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  checkIconActive: {
    fontSize: 20,
  },
  checkIconInactive: {
    fontSize: 20,
  },
  checkTextContent: {
    flex: 1,
    marginLeft: 16,
  },
  checkTitle: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '600',
  },
  checkDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 2,
  },
  checkStatusIconActive: {
    fontSize: 24,
    color: colors.secondaryContainer,
    fontWeight: 'bold',
  },
  checkStatusIconInactive: {
    fontSize: 24,
    color: colors.primary,
  }
});

export default StartChargingScreen;
