import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Modal,
  Alert,
  Platform,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import storage from '../../services/storage';
import { useProfile } from '../../contexts/ProfileContext';

const DriverDashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 8;
  const [isOnline, setIsOnline] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);

  // Real stats state
  const [todaysEarnings, setTodaysEarnings] = useState(1450);
  const [completedJobs, setCompletedJobs] = useState(3);
  const [totalKWhDispatched, setTotalKWhDispatched] = useState(84);
  const [activeJob, setActiveJob] = useState<any>(null);

  // Location state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const driverMapRef = useRef<MapView>(null);

  const pulseAnim = useRef(new Animated.Value(0)).current;

  const { socket } = useSocket();
  const { name, profilePicture } = useProfile();

  // Pulse animation for online radar
  useEffect(() => {
    if (isOnline) {
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1500,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1500,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      pulseAnim.setValue(0);
    }
  }, [isOnline]);

  useEffect(() => {
    if (!socket) return;

    const registerOnSocket = async () => {
      const token = await storage.getItem('operatorToken');
      if (token) {
        socket.emit('register_operator', token);
      }
    };
    registerOnSocket();

    const handleNewBooking = (data: any) => {
      console.log('⚡ [Operator Dashboard]: Received new_booking_request!', data);
      navigation.navigate('IncomingRequests', { request: data });
    };

    socket.on('new_booking_request', handleNewBooking);

    return () => {
      socket.off('new_booking_request', handleNewBooking);
    };
  }, [socket, navigation]);

  const fetchStatsAndActiveJob = async () => {
    try {
      const res = await api.get('/bookings/operator');
      const bookings = res.data?.data?.bookings || [];

      // Find any in-progress active job
      const active = bookings.find((b: any) =>
        [
          'ACCEPTED',
          'VEHICLE_ASSIGNED',
          'ARRIVING',
          'ARRIVED',
          'OTP_VERIFIED',
          'CHARGING_STARTED',
          'CHARGING_IN_PROGRESS',
          'CHARGING_COMPLETED',
          'INVOICE_GENERATED',
          'PAYMENT_PENDING',
        ].includes(b.status)
      );
      setActiveJob(active || null);

      const completed = bookings.filter(
        (b: any) => b.status === 'COMPLETED' || b.status === 'PAYMENT_SUCCESS'
      );
      if (completed.length > 0) {
        setCompletedJobs(completed.length);
      }

      const today = new Date();
      today.setHours(0, 0, 0, 0);

      const earnings = completed
        .filter((b: any) => new Date(b.date || b.timeline?.completedOn || Date.now()) >= today)
        .reduce((sum: number, b: any) => {
          const amount = Number(b.pricing?.totalAmount) || Number(b.pricing?.energyCost) || 0;
          return sum + amount;
        }, 0);

      if (earnings > 0) {
        setTodaysEarnings(Number(earnings));
      }

      const totalKWh = completed.reduce((sum: number, b: any) => {
        return sum + (b.deliveredEnergyKWh || b.requestedEnergyKWh || 25);
      }, 0);
      if (totalKWh > 0) {
        setTotalKWhDispatched(totalKWh);
      }
    } catch (error) {
      console.log('Failed to fetch bookings stats:', error);
    }
  };

  useEffect(() => {
    const syncStatus = async (coords?: [number, number]) => {
      try {
        await api.patch('/operators/status', {
          status: 'ONLINE',
          coordinates: coords || [77.5946, 12.9716],
        });
      } catch (error) {
        console.error('Error syncing initial status:', error);
      }
    };

    const fetchLocation = async () => {
      try {
        let { status } = await Location.requestForegroundPermissionsAsync();
        if (status !== 'granted') {
          syncStatus();
          return;
        }
        let loc = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        setCurrentLocation(loc);
        syncStatus([loc.coords.longitude, loc.coords.latitude]);

        if (driverMapRef.current) {
          driverMapRef.current.animateToRegion(
            {
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
              latitudeDelta: 0.025,
              longitudeDelta: 0.025,
            },
            800
          );
        }
      } catch (e) {
        console.log('Location fetch fallback:', e);
      }
    };

    fetchStatsAndActiveJob();
    fetchLocation();
  }, []);

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    try {
      await api.patch('/operators/status', {
        status: value ? 'ONLINE' : 'OFFLINE',
        coordinates: currentLocation
          ? [currentLocation.coords.longitude, currentLocation.coords.latitude]
          : [77.5946, 12.9716],
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };

  const handleResumeActiveJob = (job: any) => {
    if (!job) return;
    const status = job.status;
    const bookingId = job._id;

    switch (status) {
      case 'ACCEPTED':
      case 'VEHICLE_ASSIGNED':
      case 'ARRIVING':
        navigation.navigate('DriverEnRoute', { bookingId });
        break;
      case 'ARRIVED':
      case 'OTP_VERIFIED':
        navigation.navigate('StartCharging', { bookingId });
        break;
      case 'CHARGING_STARTED':
      case 'CHARGING_IN_PROGRESS':
        navigation.navigate('ChargingControls', { bookingId });
        break;
      case 'CHARGING_COMPLETED':
      case 'INVOICE_GENERATED':
      case 'PAYMENT_PENDING':
        navigation.navigate('BillGeneration', { bookingId });
        break;
      case 'COMPLETED':
      case 'PAYMENT_SUCCESS':
        navigation.navigate('BillGeneration', { bookingId });
        break;
      default:
        navigation.navigate('DriverEnRoute', { bookingId });
        break;
    }
  };

  const handleLogout = async () => {
    setIsMenuVisible(false);
    await storage.deleteItem('operatorToken');
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Bright Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.headerLeft}
          onPress={() => setIsMenuVisible(true)}
          activeOpacity={0.7}
        >
          <View style={styles.avatarContainer}>
            <Image
              source={{
                uri:
                  profilePicture ||
                  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80',
              }}
              style={styles.avatar}
            />
            <View style={[styles.onlineDot, !isOnline && styles.offlineDot]} />
          </View>
          <View>
            <View style={styles.badgeRow}>
              <Ionicons name="shield-checkmark" size={12} color="#059669" />
              <Text style={styles.badgeText}>CERTIFIED RESCUE PILOT</Text>
            </View>
            <Text style={styles.operatorNameText}>{name || 'Operator Alex'}</Text>
          </View>
        </TouchableOpacity>

        <View style={styles.headerRight}>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => Alert.alert('Active Notifications', 'System is connected to dispatch network.')}
            activeOpacity={0.7}
          >
            <Ionicons name="notifications-outline" size={20} color="#0F172A" />
            <View style={styles.notificationBadge} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => setIsMenuVisible(true)}
            activeOpacity={0.7}
          >
            <Ionicons name="menu-outline" size={22} color="#0F172A" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 28) + 20 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Interactive Online / Offline Radar Card */}
        <TouchableOpacity
          style={[styles.statusCard, isOnline ? styles.statusCardOnline : styles.statusCardOffline]}
          activeOpacity={0.9}
          onPress={() => handleToggleOnline(!isOnline)}
        >
          <View style={styles.statusLeft}>
            <View
              style={[
                styles.statusIconContainer,
                isOnline ? styles.statusIconContainerOnline : styles.statusIconContainerOffline,
              ]}
            >
              <Ionicons
                name={isOnline ? 'flash' : 'power'}
                size={24}
                color={isOnline ? '#059669' : '#64748B'}
              />
              {isOnline && (
                <Animated.View
                  style={[
                    styles.radarPulseRing,
                    {
                      transform: [
                        {
                          scale: pulseAnim.interpolate({
                            inputRange: [0, 1],
                            outputRange: [1, 1.4],
                          }),
                        },
                      ],
                      opacity: pulseAnim.interpolate({
                        inputRange: [0, 1],
                        outputRange: [0.6, 0],
                      }),
                    },
                  ]}
                />
              )}
            </View>

            <View style={{ flex: 1 }}>
              <View style={styles.statusPillRow}>
                <View style={[styles.statusMiniDot, !isOnline && { backgroundColor: '#94A3B8' }]} />
                <Text style={[styles.statusTitle, isOnline ? { color: '#065F46' } : { color: '#334155' }]}>
                  {isOnline ? 'Active On Duty • Ready' : 'Standby / Offline'}
                </Text>
              </View>
              <Text style={styles.statusSubtitle}>
                {isOnline
                  ? 'Listening for emergency breakdown requests nearby...'
                  : 'Tap to go online and receive roadside rescue calls'}
              </Text>
            </View>
          </View>

          {/* Toggle Switch */}
          <View style={[styles.toggleTrack, isOnline && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, isOnline && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        {/* Active Mission Banner (If any work is not complete) */}
        {activeJob && (
          <TouchableOpacity
            style={styles.activeRescueBanner}
            activeOpacity={0.88}
            onPress={() => handleResumeActiveJob(activeJob)}
          >
            <View style={styles.activeRescueHeader}>
              <View style={styles.activePulseBadge}>
                <View style={styles.activePulseDot} />
                <Text style={styles.activePulseText}>ACTIVE RESCUE IN PROGRESS</Text>
              </View>
              <Text style={styles.activeStageText}>
                {activeJob.status === 'ARRIVING' || activeJob.status === 'ACCEPTED'
                  ? 'En Route to Site'
                  : activeJob.status === 'ARRIVED' || activeJob.status === 'OTP_VERIFIED'
                  ? 'Cable Check & Connect'
                  : activeJob.status.includes('CHARGING')
                  ? 'DC Fast Charging Active'
                  : 'Invoice & Finalize'}
              </Text>
            </View>

            <View style={styles.activeRescueBody}>
              <View style={styles.activeCarIconBox}>
                <Ionicons name="car-sport" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.activeCustomerName}>
                  {activeJob.personalInfo?.name || activeJob.customerId?.name || 'EV Customer'}
                </Text>
                <Text style={styles.activeVehicleText} numberOfLines={1}>
                  {activeJob.vehicleModel || activeJob.vehicleDetails?.model || 'Electric Vehicle'} • {activeJob.address || 'Breakdown Location'}
                </Text>
              </View>
              <View style={styles.resumeBtnBadge}>
                <Text style={styles.resumeBtnBadgeText}>Resume</Text>
                <Ionicons name="arrow-forward" size={13} color="#FFFFFF" />
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Shift Financials & Metrics Matrix */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Shift Summary & Metrics</Text>
          <Text style={styles.sectionSubBadge}>TODAY</Text>
        </View>

        <View style={styles.metricsGrid}>
          {/* Revenue */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="wallet" size={18} color="#059669" />
              </View>
              <Text style={styles.metricLabel}>TOTAL EARNINGS</Text>
            </View>
            <Text style={styles.metricValue}>₹{todaysEarnings.toLocaleString()}</Text>
            <View style={styles.metricSubRow}>
              <Ionicons name="checkmark-done" size={13} color="#059669" />
              <Text style={styles.metricSubText}>Live Direct Settlement</Text>
            </View>
          </View>

          {/* Completed Jobs */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="checkmark-circle" size={18} color="#2563EB" />
              </View>
              <Text style={styles.metricLabel}>COMPLETED JOBS</Text>
            </View>
            <Text style={styles.metricValue}>
              {completedJobs < 10 ? `0${completedJobs}` : completedJobs}
              <Text style={styles.metricUnit}> rescues</Text>
            </Text>
            <View style={styles.metricSubRow}>
              <Ionicons name="trending-up" size={13} color="#2563EB" />
              <Text style={[styles.metricSubText, { color: '#2563EB' }]}>100% On-time Arrival</Text>
            </View>
          </View>

          {/* Energy Dispatched */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#FAF5FF' }]}>
                <Ionicons name="battery-charging" size={18} color="#9333EA" />
              </View>
              <Text style={styles.metricLabel}>DISPATCHED</Text>
            </View>
            <Text style={styles.metricValue}>
              {totalKWhDispatched}
              <Text style={styles.metricUnit}> kWh</Text>
            </Text>
            <View style={styles.metricSubRow}>
              <Ionicons name="flash" size={13} color="#9333EA" />
              <Text style={[styles.metricSubText, { color: '#9333EA' }]}>Rapid DC Output</Text>
            </View>
          </View>

          {/* Rating */}
          <View style={styles.metricCard}>
            <View style={styles.metricTop}>
              <View style={[styles.metricIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="star" size={18} color="#D97706" />
              </View>
              <Text style={styles.metricLabel}>SERVICE SCORE</Text>
            </View>
            <Text style={styles.metricValue}>
              4.95<Text style={styles.metricUnit}> / 5.0</Text>
            </Text>
            <View style={styles.metricSubRow}>
              <Ionicons name="shield" size={13} color="#D97706" />
              <Text style={[styles.metricSubText, { color: '#D97706' }]}>Top Tier Operator</Text>
            </View>
          </View>
        </View>

        {/* Mobile Van Power Buffer Status */}
        <View style={styles.vanCard}>
          <View style={styles.vanCardHeader}>
            <View style={styles.vanIconCircle}>
              <Ionicons name="bus" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1, marginLeft: 12 }}>
              <Text style={styles.vanTitle}>Rapid DC Mobile Station #04</Text>
              <Text style={styles.vanSubtitle}>Tata Winger High-Power Mobile Supercharger</Text>
            </View>
            <View style={styles.vanBatteryPill}>
              <Ionicons name="flash" size={12} color="#059669" />
              <Text style={styles.vanBatteryPillText}>86% READY</Text>
            </View>
          </View>

          <View style={styles.vanStatsRow}>
            <View style={styles.vanStatItem}>
              <Text style={styles.vanStatLabel}>BUFFER STORAGE</Text>
              <Text style={styles.vanStatVal}>68.8 kWh</Text>
            </View>
            <View style={styles.vanDivider} />
            <View style={styles.vanStatItem}>
              <Text style={styles.vanStatLabel}>PEAK POWER</Text>
              <Text style={styles.vanStatVal}>150 kW DC</Text>
            </View>
            <View style={styles.vanDivider} />
            <View style={styles.vanStatItem}>
              <Text style={styles.vanStatLabel}>PLUGS ARMED</Text>
              <Text style={styles.vanStatVal}>CCS2 • T2</Text>
            </View>
          </View>
        </View>

        {/* Live GPS Tactical Map Card */}
        <View style={styles.sectionHeaderRow}>
          <Text style={styles.sectionTitle}>Live Rescue Radar & Patrol</Text>
          <View style={styles.gpsActiveBadge}>
            <View style={styles.gpsDot} />
            <Text style={styles.gpsText}>GPS ACTIVE</Text>
          </View>
        </View>

        <View style={styles.mapCard}>
          {currentLocation ? (
            <MapView
              ref={driverMapRef}
              provider={PROVIDER_DEFAULT}
              style={styles.mapView}
              initialRegion={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.025,
                longitudeDelta: 0.025,
              }}
              showsUserLocation={false}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
              >
                <View style={styles.driverMarkerOuter}>
                  <View style={styles.driverMarkerInner}>
                    <Ionicons name="flash" size={14} color="#FFFFFF" />
                  </View>
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={styles.mapFallbackBox}>
              <Ionicons name="navigate-circle-outline" size={36} color="#94A3B8" />
              <Text style={styles.mapFallbackText}>Acquiring GPS position...</Text>
            </View>
          )}

          <View style={styles.mapOverlayFooter}>
            <View style={styles.patrolBadge}>
              <Ionicons name="location" size={14} color="#059669" />
              <Text style={styles.patrolText}>Central Metro Sector • Breakdown Hotspot</Text>
            </View>
          </View>
        </View>

        {/* Quick Operations Bar */}
        <Text style={styles.sectionTitle}>Quick Operations</Text>
        <View style={styles.quickActionsGrid}>
          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('DriverJobHistory')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#EFF6FF' }]}>
              <Ionicons name="time" size={20} color="#2563EB" />
            </View>
            <Text style={styles.actionTitle}>Trip Log</Text>
            <Text style={styles.actionDesc}>History & Receipts</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('DriverVehicle')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#ECFDF5' }]}>
              <Ionicons name="speedometer" size={20} color="#059669" />
            </View>
            <Text style={styles.actionTitle}>Van Health</Text>
            <Text style={styles.actionDesc}>Cable & Inverter</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.actionCard}
            onPress={() => navigation.navigate('Support')}
            activeOpacity={0.7}
          >
            <View style={[styles.actionIconBg, { backgroundColor: '#FEF3C7' }]}>
              <Ionicons name="headset" size={20} color="#D97706" />
            </View>
            <Text style={styles.actionTitle}>Dispatch Help</Text>
            <Text style={styles.actionDesc}>24/7 SOS Support</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Operator Settings & Menu Drawer Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setIsMenuVisible(false)}
        >
          <View style={[styles.modalContent, { marginTop: insets.top + 60 }]}>
            <View style={styles.modalHeader}>
              <View>
                <Text style={styles.modalTitle}>{name || 'Operator Profile'}</Text>
                <Text style={styles.modalSubtitle}>VoltRescue Certified Fleet Pilot</Text>
              </View>
              <TouchableOpacity onPress={() => setIsMenuVisible(false)} style={styles.modalCloseBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverProfile');
              }}
            >
              <View style={styles.modalIconBox}>
                <Ionicons name="person-outline" size={18} color="#0F172A" />
              </View>
              <Text style={styles.modalItemText}>Edit Profile & Documents</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverJobHistory');
              }}
            >
              <View style={styles.modalIconBox}>
                <Ionicons name="receipt-outline" size={18} color="#0F172A" />
              </View>
              <Text style={styles.modalItemText}>Earnings & Job History</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverVehicle');
              }}
            >
              <View style={styles.modalIconBox}>
                <Ionicons name="hardware-chip-outline" size={18} color="#0F172A" />
              </View>
              <Text style={styles.modalItemText}>Rescue Van Diagnostics</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('Support');
              }}
            >
              <View style={styles.modalIconBox}>
                <Ionicons name="help-buoy-outline" size={18} color="#0F172A" />
              </View>
              <Text style={styles.modalItemText}>Help Center & SOS Support</Text>
              <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalItem} onPress={handleLogout}>
              <View style={[styles.modalIconBox, { backgroundColor: '#FEF2F2' }]}>
                <Ionicons name="log-out-outline" size={18} color="#DC2626" />
              </View>
              <Text style={[styles.modalItemText, { color: '#DC2626', fontWeight: '700' }]}>
                Sign Out
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarContainer: {
    position: 'relative',
  },
  avatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 2,
    borderColor: '#E2E8F0',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 13,
    height: 13,
    borderRadius: 6.5,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  offlineDot: {
    backgroundColor: '#94A3B8',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  badgeText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  operatorNameText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.3,
    marginTop: 1,
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  notificationBadge: {
    position: 'absolute',
    top: 9,
    right: 10,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#DC2626',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },

  /* Online / Offline Radar Card */
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1.5,
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  statusCardOnline: {
    backgroundColor: '#FFFFFF',
    borderColor: '#A7F3D0',
  },
  statusCardOffline: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
  },
  statusIconContainer: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  statusIconContainerOnline: {
    backgroundColor: '#ECFDF5',
  },
  statusIconContainerOffline: {
    backgroundColor: '#F1F5F9',
  },
  radarPulseRing: {
    position: 'absolute',
    width: 54,
    height: 54,
    borderRadius: 27,
    borderWidth: 2,
    borderColor: '#059669',
  },
  statusPillRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 3,
  },
  statusMiniDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  statusTitle: {
    fontSize: 15,
    fontWeight: '800',
  },
  statusSubtitle: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 15,
  },
  toggleTrack: {
    width: 54,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#CBD5E1',
    justifyContent: 'center',
    paddingHorizontal: 3,
    marginLeft: 8,
  },
  toggleTrackActive: {
    backgroundColor: '#059669',
  },
  toggleThumb: {
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleThumbActive: {
    transform: [{ translateX: 22 }],
  },

  /* Active Rescue Banner */
  activeRescueBanner: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1.5,
    borderColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  activeRescueHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  activePulseBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activePulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activePulseText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  activeStageText: {
    color: '#2563EB',
    fontSize: 11,
    fontWeight: '800',
  },
  activeRescueBody: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  activeCarIconBox: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  activeCustomerName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  activeVehicleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  resumeBtnBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  resumeBtnBadgeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '800',
  },

  /* Section Header */
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: -0.3,
  },
  sectionSubBadge: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.8,
  },

  /* Bento Grid */
  metricsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  metricCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  metricTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  metricIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  metricLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
  },
  metricValue: {
    color: '#0F172A',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginBottom: 6,
  },
  metricUnit: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
  },
  metricSubRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  metricSubText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '700',
  },

  /* Mobile Van Buffer Status Card */
  vanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 22,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  vanCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  vanIconCircle: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vanTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  vanSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  vanBatteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vanBatteryPillText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  vanStatsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  vanStatItem: {
    flex: 1,
    alignItems: 'center',
  },
  vanDivider: {
    width: 1,
    height: 28,
    backgroundColor: '#E2E8F0',
  },
  vanStatLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  vanStatVal: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },

  /* GPS Tactical Map */
  gpsActiveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  gpsDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  gpsText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
  },
  mapCard: {
    width: '100%',
    height: 180,
    borderRadius: 22,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  mapView: {
    width: '100%',
    height: '100%',
  },
  mapFallbackBox: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
  },
  mapFallbackText: {
    color: '#64748B',
    marginTop: 6,
    fontSize: 12,
    fontWeight: '600',
  },
  driverMarkerOuter: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  driverMarkerInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  mapOverlayFooter: {
    position: 'absolute',
    bottom: 12,
    left: 12,
    right: 12,
  },
  patrolBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
    elevation: 3,
  },
  patrolText: {
    color: '#0F172A',
    fontSize: 11,
    fontWeight: '700',
  },

  /* Quick Operations Grid */
  quickActionsGrid: {
    flexDirection: 'row',
    gap: 10,
  },
  actionCard: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 14,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  actionIconBg: {
    width: 42,
    height: 42,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  actionTitle: {
    color: '#0F172A',
    fontSize: 12,
    fontWeight: '800',
  },
  actionDesc: {
    color: '#64748B',
    fontSize: 10,
    fontWeight: '500',
    marginTop: 2,
    textAlign: 'center',
  },

  /* Drawer / Profile Menu Modal */
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
    justifyContent: 'flex-start',
    paddingHorizontal: 16,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 24,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.15,
    shadowRadius: 25,
    elevation: 10,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  modalSubtitle: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
    marginTop: 2,
  },
  modalCloseBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
  },
  modalIconBox: {
    width: 34,
    height: 34,
    borderRadius: 10,
    backgroundColor: '#F8FAFC',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginRight: 12,
  },
  modalItemText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
    flex: 1,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
});

export default DriverDashboardScreen;
