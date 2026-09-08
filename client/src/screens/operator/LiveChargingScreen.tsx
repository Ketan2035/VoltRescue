import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Animated } from 'react-native';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const LiveChargingScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const [chargeProgress, setChargeProgress] = useState(12); // Starts at 12%
  const [isCharging, setIsCharging] = useState(true);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 2000,
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

  const handleStopCharging = async () => {
    setIsCharging(false);
    if (bookingId && bookingId !== 'mock-id') {
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'CHARGING_COMPLETED'
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigation.navigate('BillGeneration', { bookingId });
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoIcon}>🔋</Text>
          <Text style={styles.logoText}>VoltRescue</Text>
        </View>
        <TouchableOpacity style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA82163FgUl_3-7nqROL9gb4O1RqQSGweX0ViiRC2Hw5bVEq3pcAavwe_Hx31qFZRb9XVxJjjxiZPDGO34c-wXgNni5rO6AVhh4ERbpbmyKIqefXAQ6bnC3zGeMoA1_LjLamDaWqb5xZqhvouYVOu35Zr8dzgu4mL5yTfe9vbR7-WvFaHqxl2L8nJxbEFUgJBJnNngsdtATxgAmIuEEP0mjb9nkHZ2ySKy040ckCisCm4rHnTS-O0xbQkPsPXGcVzbQLha8CzxjkG-2' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero: Vehicle Charging Visual */}
        <View style={styles.heroCard}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCVe6yVDY9H9ZHOUdsitcPTq-YHl_kbkWWKco17rKNF7Zrt2bpRTJkuJpPSHd7LsaMxmkgIj8BBJm-bdZNY8rY2EgFkyjgKEpo5SClNfS7lMHv6eCwUMQgD47V2WyP2C1dht49CsnS1G7HpEpVUbzvPRiu1dX0hA5Wm2y--UYKPL_g842_vcdHihA6D7b7uBi77Fi8F6eVi5lzj0AvTdjR33Zi0b4bv-6BCBAyA6QPSYin07JkvbzcSmiDDFZs7CHqHjTePXdQlGi9L' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.activeConnectionBox}>
              <View style={styles.activeDot} />
              <Text style={styles.activeText}>ACTIVE CONNECTION</Text>
            </View>
            <Text style={styles.carName}>{bookingDetails?.customerId?.name || 'Customer'}'s EV</Text>
          </View>
        </View>

        {/* Progress & Real-time Stats Container */}
        <View style={styles.statsContainer}>
          {/* Circular Progress (Simplified) */}
          <View style={styles.progressCard}>
            <View style={styles.progressCircleContainer}>
              <Animated.View style={[styles.glowRing, {
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.3, 0.8] }),
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.95, 1.05] }) }]
              }]} />
              <View style={styles.innerCircle}>
                <Text style={styles.percentageText}>70%</Text>
                <Text style={styles.chargingLabel}>CHARGING...</Text>
              </View>
            </View>

            <View style={styles.rangeVoltageRow}>
              <View style={styles.rvBox}>
                <Text style={styles.rvLabel}>RANGE ADDED</Text>
                <Text style={styles.rvValue}>+142 mi</Text>
              </View>
              <View style={styles.rvBox}>
                <Text style={styles.rvLabel}>VOLTAGE</Text>
                <Text style={styles.rvValue}>800V</Text>
              </View>
            </View>
          </View>

          {/* Quick Stats Grid */}
          <View style={styles.powerCard}>
            <View style={styles.powerTopRow}>
              <Text style={styles.powerIcon}>⚡</Text>
              <View style={styles.highSpeedBadge}>
                <Text style={styles.highSpeedText}>High Speed</Text>
              </View>
            </View>
            <Text style={styles.powerLabel}>POWER DELIVERED</Text>
            <Text style={styles.powerValue}>124 <Text style={styles.powerUnit}>kW</Text></Text>
          </View>

          <View style={styles.timeCostRow}>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardLabel}>TIME LEFT</Text>
              <Text style={styles.smallCardValue}>14 <Text style={styles.smallCardUnit}>min</Text></Text>
            </View>
            <View style={styles.smallCard}>
              <Text style={styles.smallCardLabel}>CURRENT COST</Text>
              <Text style={styles.smallCardValue}>₹12.45</Text>
            </View>
          </View>

          {/* Complete Charging */}
          <TouchableOpacity style={styles.stopButton} onPress={handleStopCharging}>
            <Text style={styles.stopButtonIcon}>🛑</Text>
            <Text style={styles.stopButtonText}>COMPLETE CHARGING</Text>
          </TouchableOpacity>
        </View>

        {/* Operator Details */}
        <View style={styles.operatorCard}>
          <View style={styles.operatorLeft}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBh0AxaraHMtDSrDFlj7vC9h0IGYWTfTcJZQUltOtqE9M-YBye8xbDegmd4v7kTq3utlp9O-GWR6vV791EzwIx2G1VTTSZI6ldzlkzVIr83-5ttRi0ZeOpgrzfNgirob0NCv0GMEW1HFBgf9Mf6UrlgbzzBy4gKJzS-a0PoEbSOHpDQBLYaWXPu2XIF3HRUp3X12vPnHcAf5o_DzEJZc6K4Yj9tvYLGxUVtUk5DH18p0bJ6aVwLa_tJ4WpTR2xxFvszxt--DUtjG3mG' }}
              style={styles.operatorAvatar}
            />
            <View>
              <Text style={styles.operatorName}>{bookingDetails?.operatorId?.name || 'Operator'}</Text>
              <Text style={styles.operatorRole}>Charging Tech • {bookingDetails?.operatorId?.vehicleDetails?.model || 'Van'}</Text>
            </View>
          </View>
          <View style={styles.operatorActions}>
            <TouchableOpacity style={styles.opChatButton}>
              <Text style={styles.opChatText}>💬 Chat</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.opCallButton}>
              <Text style={styles.opCallText}>📞 Call</Text>
            </TouchableOpacity>
          </View>
        </View>

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
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  logoIcon: {
    fontSize: 24,
  },
  logoText: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
    gap: 20,
  },
  heroCard: {
    height: 250,
    borderRadius: 24,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.7,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'flex-end',
    padding: 20,
  },
  activeConnectionBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  activeDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.secondaryFixedDim,
    borderRadius: 4,
  },
  activeText: {
    color: colors.secondaryFixed,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  carName: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  statsContainer: {
    gap: 16,
  },
  progressCard: {
    backgroundColor: 'rgba(32, 31, 31, 0.8)',
    borderRadius: 24,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  progressCircleContainer: {
    width: 200,
    height: 200,
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
    borderWidth: 10,
    borderColor: colors.secondaryFixedDim,
    shadowColor: colors.secondaryFixedDim,
    shadowOpacity: 0.8,
    shadowRadius: 20,
  },
  innerCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surfaceContainerHighest,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  percentageText: {
    color: colors.onSurface,
    fontSize: 48,
    fontWeight: 'bold',
  },
  chargingLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 4,
  },
  rangeVoltageRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  rvBox: {
    alignItems: 'center',
  },
  rvLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  rvValue: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  powerCard: {
    backgroundColor: 'rgba(32, 31, 31, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  powerTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  powerIcon: {
    fontSize: 24,
  },
  highSpeedBadge: {
    backgroundColor: 'rgba(42, 229, 0, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
  },
  highSpeedText: {
    color: colors.secondaryFixedDim,
    fontSize: 12,
    fontWeight: 'bold',
  },
  powerLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  powerValue: {
    color: colors.onSurface,
    fontSize: 36,
    fontWeight: 'bold',
  },
  powerUnit: {
    fontSize: 20,
    color: colors.onSurfaceVariant,
    fontWeight: 'normal',
  },
  timeCostRow: {
    flexDirection: 'row',
    gap: 16,
  },
  smallCard: {
    flex: 1,
    backgroundColor: 'rgba(32, 31, 31, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  smallCardLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  smallCardValue: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  smallCardUnit: {
    fontSize: 16,
    color: colors.onSurfaceVariant,
    fontWeight: 'normal',
  },
  stopButton: {
    backgroundColor: colors.onErrorContainer,
    borderRadius: 24,
    paddingVertical: 20,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  stopButtonIcon: {
    fontSize: 20,
  },
  stopButtonText: {
    color: colors.onError,
    fontSize: 16,
    fontWeight: 'bold',
  },
  operatorCard: {
    backgroundColor: 'rgba(32, 31, 31, 0.8)',
    borderRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    flexDirection: 'column',
    gap: 20,
  },
  operatorLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  operatorAvatar: {
    width: 64,
    height: 64,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  operatorName: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  operatorRole: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
  },
  operatorActions: {
    flexDirection: 'row',
    gap: 12,
  },
  opChatButton: {
    flex: 1,
    backgroundColor: colors.surfaceContainerHighest,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  opChatText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  opCallButton: {
    flex: 1,
    backgroundColor: colors.primaryContainer,
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  opCallText: {
    color: colors.onPrimaryContainer,
    fontSize: 16,
    fontWeight: 'bold',
  }
});

export default LiveChargingScreen;
