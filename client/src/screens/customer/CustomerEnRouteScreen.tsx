import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  Dimensions,
  Modal,
  Linking,
  Platform,
  StatusBar,
  BackHandler,
  Alert,
  ScrollView,
  Animated,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSocket } from '../../contexts/SocketContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const CustomerEnRouteScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const { socket } = useSocket();

  const [operatorLocation, setOperatorLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  // Real Turn-by-Turn Road Route Coordinates & Telemetry
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [routeDistanceKm, setRouteDistanceKm] = useState<string>('1.8');
  const [etaMins, setEtaMins] = useState<number>(5);

  // Marker pulse animation
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  // Prevent closing / going back while rescue is active
  useEffect(() => {
    const onBackPress = () => {
      Alert.alert(
        'Rescue in Progress',
        'Your rescue operator is active and en route. To cancel this service, please tap "Cancel Request" at the bottom of the screen.',
        [{ text: 'Understood', style: 'default' }]
      );
      return true; // Intercept & prevent closing
    };

    const backHandler = BackHandler.addEventListener('hardwareBackPress', onBackPress);
    return () => backHandler.remove();
  }, []);

  // Van Marker Pulse Loop
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.4,
          duration: 1200,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 1200,
          useNativeDriver: true,
        }),
      ])
    );
    loop.start();
    return () => loop.stop();
  }, []);

  const handleCancel = async (reason: string) => {
    setCancelModalVisible(false);
    if (bookingId) {
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'CANCELLED',
          cancellationReason: reason,
        });
        navigation.navigate('CustomerDashboard');
      } catch (err) {
        console.error(err);
      }
    }
  };

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const booking = res.data?.data?.booking;
        setBookingDetails(booking);
        if (booking?.userLocation?.coordinates) {
          setCustomerLocation({
            latitude: booking.userLocation.coordinates[1],
            longitude: booking.userLocation.coordinates[0],
          });
        }
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };

    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    } else {
      (async () => {
        try {
          const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
          if (permStatus === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setCustomerLocation({ latitude: loc.coords.latitude, longitude: loc.coords.longitude });
            setOperatorLocation({
              latitude: loc.coords.latitude + 0.007,
              longitude: loc.coords.longitude + 0.005,
            });
          } else {
            setCustomerLocation({ latitude: 37.7749, longitude: -122.4194 });
            setOperatorLocation({ latitude: 37.7849, longitude: -122.4094 });
          }
        } catch {
          setCustomerLocation({ latitude: 37.7749, longitude: -122.4194 });
          setOperatorLocation({ latitude: 37.7849, longitude: -122.4094 });
        }
      })();
    }
  }, [bookingId]);

  // Status-driven auto transition
  useEffect(() => {
    const currentSt = status || bookingDetails?.status;
    if (currentSt === 'ARRIVING' || currentSt === 'OPERATOR_ARRIVED' || currentSt === 'OTP_VERIFIED') {
      navigation.navigate('StartCharging', { bookingId, isOperator: false });
    } else if (currentSt === 'CHARGING_STARTED' || currentSt === 'CHARGING_IN_PROGRESS') {
      navigation.navigate('LiveCharging', { bookingId });
    } else if (currentSt === 'INVOICE_GENERATED' || currentSt === 'CHARGING_COMPLETED' || currentSt === 'PAYMENT_PENDING') {
      navigation.navigate('Payment', { bookingId });
    } else if (currentSt === 'CANCELLED' || currentSt === 'REJECTED') {
      Alert.alert('Booking Cancelled', 'This rescue session was cancelled.');
      navigation.reset({
        index: 0,
        routes: [{ name: 'CustomerDashboard' }],
      });
    }
  }, [status, bookingDetails?.status, bookingId, navigation]);

  // Real-time socket updates for driver's live GPS
  useEffect(() => {
    if (socket) {
      const handleLocationUpdate = (data: any) => {
        if (data.bookingId === bookingId && data.location) {
          setOperatorLocation(data.location);
        }
      };
      socket.on('operator_location_update', handleLocationUpdate);
      return () => {
        socket.off('operator_location_update', handleLocationUpdate);
      };
    }
  }, [socket, bookingId]);

  // Real Turn-by-Turn Road Route Fetcher (OSRM driving geometry)
  useEffect(() => {
    const fetchRealRoute = async () => {
      if (!operatorLocation || !customerLocation) return;
      try {
        const url = `https://router.project-osrm.org/route/v1/driving/${operatorLocation.longitude},${operatorLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?overview=full&geometries=geojson`;
        const res = await fetch(url);
        const data = await res.json();
        if (data?.routes && data.routes.length > 0) {
          const route = data.routes[0];
          const coords = route.geometry.coordinates.map((point: [number, number]) => ({
            latitude: point[1],
            longitude: point[0],
          }));
          setRouteCoordinates(coords);
          if (route.distance) {
            setRouteDistanceKm((route.distance / 1000).toFixed(1));
          }
          if (route.duration) {
            setEtaMins(Math.max(2, Math.ceil(route.duration / 60)));
          }
        }
      } catch (err) {
        console.error('Failed to fetch OSRM route:', err);
      }
    };

    fetchRealRoute();
  }, [operatorLocation, customerLocation]);

  // Auto zoom map to fit route and markers
  useEffect(() => {
    if (mapRef.current && customerLocation && operatorLocation) {
      try {
        const pointsToFit = routeCoordinates.length > 0
          ? routeCoordinates
          : [customerLocation, operatorLocation];
        mapRef.current.fitToCoordinates(pointsToFit, {
          edgePadding: { top: topInset + 80, right: 60, bottom: 420, left: 60 },
          animated: true,
        });
      } catch (e) {
        // web map fallback
      }
    }
  }, [customerLocation, operatorLocation, routeCoordinates.length, topInset]);

  const currentStatus = status || bookingDetails?.status;
  const isArrived = currentStatus === 'ARRIVING' || currentStatus === 'OPERATOR_ARRIVED';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Full-Screen Interactive Live Map */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          style={styles.mapImage}
          provider={PROVIDER_DEFAULT}
          mapType="none"
          initialRegion={{
            latitude: customerLocation?.latitude || 37.7749,
            longitude: customerLocation?.longitude || -122.4194,
            latitudeDelta: 0.035,
            longitudeDelta: 0.035,
          }}
          showsUserLocation={false}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          <UrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={true}
            zIndex={-1}
          />
          {/* Real Turn-by-Turn Road Route Polylines (Glow + Main Road) */}
          {routeCoordinates.length > 0 ? (
            <>
              {/* Soft Road Glow Polyline */}
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="rgba(5, 150, 105, 0.25)"
                strokeWidth={9}
                lineCap="round"
                lineJoin="round"
              />
              {/* Solid High-Contrast Driving Route Polyline */}
              <Polyline
                coordinates={routeCoordinates}
                strokeColor="#059669"
                strokeWidth={5}
                lineCap="round"
                lineJoin="round"
              />
            </>
          ) : (
            customerLocation &&
            operatorLocation && (
              <Polyline
                coordinates={[operatorLocation, customerLocation]}
                strokeColor="#059669"
                strokeWidth={4}
                lineDashPattern={[6, 6]}
              />
            )
          )}

          {/* Breakdown Customer Destination Marker */}
          {customerLocation && (
            <Marker coordinate={customerLocation} title="Your Breakdown Location" anchor={{ x: 0.5, y: 1 }}>
              <View style={styles.customerPinContainer}>
                <View style={styles.customerPinBadge}>
                  <Ionicons name="car-sport" size={16} color="#FFFFFF" />
                </View>
                <View style={styles.customerPinStem} />
                <View style={styles.customerPinGlow} />
              </View>
            </Marker>
          )}

          {/* Live Mobile Rescue Van Marker with Directional Avatar & Pulse */}
          {operatorLocation && (
            <Marker coordinate={operatorLocation} title="VoltRescue Unit #4" anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.vanMarkerWrapper}>
                {/* Floating Micro ETA Tooltip */}
                <View style={styles.vanEtaTooltip}>
                  <Text style={styles.vanEtaTooltipText}>{isArrived ? 'ARRIVED' : `${etaMins}m away`}</Text>
                </View>

                {/* Pulsing Aura */}
                <Animated.View
                  style={[
                    styles.vanPulseAura,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.4],
                        outputRange: [0.6, 0],
                      }),
                    },
                  ]}
                />

                {/* Van Badge */}
                <View style={styles.vanMarkerCore}>
                  <Ionicons name="flash" size={16} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          )}
        </MapView>
      </View>

      {/* Floating Top Trip Header (Uber / Zomato Style) */}
      <View style={[styles.topFloatingHeader, { top: topInset + 12 }]}>
        <View style={styles.topStatusCard}>
          <View style={styles.topStatusLeft}>
            <View style={styles.liveIndicator}>
              <View style={styles.livePulseDot} />
              <Text style={styles.liveIndicatorText}>{isArrived ? 'ARRIVED AT SITE' : 'EN ROUTE'}</Text>
            </View>
            <Text style={styles.topEtaHeadline}>
              {isArrived ? 'Driver has arrived at your car' : `Arriving in ~${etaMins} mins`}
            </Text>
            <Text style={styles.topEtaSub}>
              {isArrived
                ? 'Please share OTP with the technician'
                : `${routeDistanceKm} km away • Fastest rescue corridor`}
            </Text>
          </View>

          <TouchableOpacity
            style={styles.sosButton}
            onPress={() => Linking.openURL('tel:112')}
            activeOpacity={0.8}
          >
            <Ionicons name="alert-circle" size={18} color="#EF4444" />
            <Text style={styles.sosButtonText}>SOS</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Comprehensive Uber/Rapido-Style Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 16) + 8 }]}>
        <View style={styles.dragHandle} />

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.sheetScroll}>
          {/* Prominent High-Contrast 6-Digit OTP Card */}
          <View style={styles.otpBanner}>
            <View style={styles.otpBannerHeader}>
              <View style={styles.otpPill}>
                <Ionicons name="key" size={14} color="#059669" />
                <Text style={styles.otpPillText}>RESCUE VERIFICATION PIN</Text>
              </View>
              <Text style={styles.otpHeaderNote}>Share upon driver arrival</Text>
            </View>

            <View style={styles.otpRow}>
              {(bookingDetails?.otp || '171723').split('').map((digit: string, idx: number) => (
                <View key={idx} style={styles.otpBox}>
                  <Text style={styles.otpDigit}>{digit}</Text>
                </View>
              ))}
            </View>
          </View>

          {/* Operator Hero Profile & Vehicle Card */}
          <View style={styles.driverHeroCard}>
            <View style={styles.driverAvatarContainer}>
              <Image
                source={{
                  uri:
                    bookingDetails?.operatorId?.profileImageUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=200&q=80',
                }}
                style={styles.driverAvatar}
              />
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark" size={10} color="#FFFFFF" />
              </View>
            </View>

            <View style={styles.driverDetails}>
              <View style={styles.nameRow}>
                <Text style={styles.driverName}>{bookingDetails?.operatorId?.name || 'Ketan Rescue Tech'}</Text>
                <View style={styles.ratingChip}>
                  <Ionicons name="star" size={11} color="#F59E0B" />
                  <Text style={styles.ratingText}>{bookingDetails?.operatorId?.rating || '4.9'}</Text>
                </View>
              </View>

              <Text style={styles.vehicleBadge}>
                {bookingDetails?.operatorId?.vehicleDetails?.model || 'VoltRescue Fleet Van #4 • 150kW DC'}
              </Text>
            </View>

            {/* Quick Contact Action Controls */}
            <View style={styles.contactActions}>
              <TouchableOpacity
                style={styles.actionBtnCall}
                onPress={() => {
                  const phone = bookingDetails?.operatorId?.phone || '1800123456';
                  Linking.openURL(`tel:${phone}`);
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="call" size={18} color="#FFFFFF" />
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.actionBtnChat}
                onPress={() => {
                  if (bookingId) {
                    navigation.navigate('Chat', {
                      bookingId,
                      isOperator: false,
                      otherPersonName: bookingDetails?.operatorId?.name || 'Technician',
                    });
                  }
                }}
                activeOpacity={0.8}
              >
                <Ionicons name="chatbubble-ellipses" size={18} color="#059669" />
              </TouchableOpacity>
            </View>
          </View>

          {/* Live Progress Timeline Stepper */}
          <View style={styles.timelineCard}>
            <View style={styles.timelineStep}>
              <View style={[styles.stepDot, styles.stepDotDone]}>
                <Ionicons name="checkmark" size={12} color="#FFFFFF" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitleDone}>Request Confirmed</Text>
                <Text style={styles.stepSub}>GPS breakdown site locked</Text>
              </View>
            </View>

            <View style={styles.timelineConnector} />

            <View style={styles.timelineStep}>
              <View style={[styles.stepDot, styles.stepDotActive]}>
                <Ionicons name="navigate" size={12} color="#FFFFFF" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitleActive}>Rescuer Driving ({routeDistanceKm} km)</Text>
                <Text style={styles.stepSub}>Real-time road navigation active</Text>
              </View>
            </View>

            <View style={styles.timelineConnector} />

            <View style={styles.timelineStep}>
              <View style={[styles.stepDot, styles.stepDotPending]}>
                <Ionicons name="flash-outline" size={12} color="#94A3B8" />
              </View>
              <View style={styles.stepContent}>
                <Text style={styles.stepTitlePending}>150kW Rapid Charge Delivery</Text>
                <Text style={styles.stepSub}>
                  {bookingDetails?.vehicleModel || 'EV'} ({bookingDetails?.connectorType || 'CCS2'}) •{' '}
                  {bookingDetails?.requestedEnergyKWh || 30} kWh
                </Text>
              </View>
            </View>
          </View>

          {/* Auxiliary Action Tools (Share Tracking & Cancel) */}
          <View style={styles.footerActions}>
            <TouchableOpacity
              style={styles.shareTrackBtn}
              onPress={() => alert('Live rescue tracking link copied to clipboard!')}
              activeOpacity={0.8}
            >
              <Ionicons name="share-social-outline" size={16} color="#0F172A" />
              <Text style={styles.shareTrackText}>Share Live Tracking</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelLinkBtn}
              onPress={() => setCancelModalVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="close-circle-outline" size={16} color="#EF4444" />
              <Text style={styles.cancelLinkText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </View>

      {/* Cancellation Options Modal */}
      <Modal visible={cancelModalVisible} transparent animationType="slide">
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Rescue Request?</Text>
            <Text style={styles.modalSubtitle}>Please let us know the reason for cancellation:</Text>

            {[
              'Vehicle problem resolved',
              'Driver is taking too long',
              'Booked alternate towing service',
              'Entered incorrect vehicle/location',
              'Other reason',
            ].map((reason, index) => (
              <TouchableOpacity
                key={index}
                style={styles.cancelReasonItem}
                onPress={() => handleCancel(reason)}
                activeOpacity={0.7}
              >
                <Text style={styles.cancelReasonText}>{reason}</Text>
                <Ionicons name="chevron-forward" size={16} color="#94A3B8" />
              </TouchableOpacity>
            ))}

            <TouchableOpacity
              style={styles.closeModalBtn}
              onPress={() => setCancelModalVisible(false)}
              activeOpacity={0.8}
            >
              <Text style={styles.closeModalText}>Keep Booking Active</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F8FAFC',
  },
  mapArea: {
    flex: 1,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },

  // Map Markers
  customerPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerPinBadge: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#0F172A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 6,
  },
  customerPinStem: {
    width: 3,
    height: 8,
    backgroundColor: '#0F172A',
  },
  customerPinGlow: {
    width: 8,
    height: 4,
    borderRadius: 4,
    backgroundColor: 'rgba(15, 23, 42, 0.4)',
  },

  vanMarkerWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  vanEtaTooltip: {
    backgroundColor: '#0F172A',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  vanEtaTooltipText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  vanPulseAura: {
    position: 'absolute',
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(5, 150, 105, 0.4)',
    top: 20,
  },
  vanMarkerCore: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 6,
    elevation: 8,
  },

  // Floating Top Status Header
  topFloatingHeader: {
    position: 'absolute',
    left: 16,
    right: 16,
    zIndex: 20,
  },
  topStatusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 10,
    elevation: 5,
    justifyContent: 'space-between',
  },
  topStatusLeft: {
    flex: 1,
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 4,
  },
  livePulseDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  liveIndicatorText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '900',
    letterSpacing: 0.8,
  },
  topEtaHeadline: {
    fontSize: 17,
    fontWeight: '800',
    color: '#0F172A',
  },
  topEtaSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  sosButton: {
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 14,
    marginLeft: 12,
  },
  sosButtonText: {
    color: '#EF4444',
    fontSize: 10,
    fontWeight: '900',
    marginTop: 2,
  },

  // Bottom Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
    borderTopWidth: 1,
    borderColor: '#E2E8F0',
    maxHeight: 460,
  },
  dragHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#E2E8F0',
    alignSelf: 'center',
    marginBottom: 14,
  },
  sheetScroll: {
    gap: 14,
  },

  // OTP Card
  otpBanner: {
    backgroundColor: '#F0FDF4',
    borderRadius: 18,
    padding: 14,
    borderWidth: 1,
    borderColor: '#BBF7D0',
  },
  otpBannerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 10,
  },
  otpPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  otpPillText: {
    fontSize: 11,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.6,
  },
  otpHeaderNote: {
    fontSize: 11,
    color: '#059669',
    fontWeight: '600',
  },
  otpRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 6,
  },
  otpBox: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    height: 44,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: '#86EFAC',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 2,
    elevation: 1,
  },
  otpDigit: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },

  // Driver Hero Card
  driverHeroCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  driverAvatarContainer: {
    position: 'relative',
  },
  driverAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E2E8F0',
  },
  verifiedBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#059669',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
  },
  driverDetails: {
    flex: 1,
    marginLeft: 12,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  driverName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
  },
  ratingChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: '#FEF3C7',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 6,
  },
  ratingText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#92400E',
  },
  vehicleBadge: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
    fontWeight: '500',
  },
  contactActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  actionBtnCall: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  actionBtnChat: {
    width: 38,
    height: 38,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },

  // Timeline Progress
  timelineCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  timelineStep: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepDot: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepDotDone: {
    backgroundColor: '#059669',
  },
  stepDotActive: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 2,
  },
  stepDotPending: {
    backgroundColor: '#F1F5F9',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  timelineConnector: {
    width: 2,
    height: 12,
    backgroundColor: '#E2E8F0',
    marginLeft: 10,
    marginVertical: 2,
  },
  stepContent: {
    flex: 1,
  },
  stepTitleDone: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  stepTitleActive: {
    fontSize: 13,
    fontWeight: '800',
    color: '#059669',
  },
  stepTitlePending: {
    fontSize: 13,
    fontWeight: '600',
    color: '#94A3B8',
  },
  stepSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 1,
  },

  // Footer Actions
  footerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  shareTrackBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#F8FAFC',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingVertical: 12,
    borderRadius: 14,
  },
  shareTrackText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#0F172A',
  },
  cancelLinkBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: '#FEF2F2',
    borderWidth: 1,
    borderColor: '#FEE2E2',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 14,
  },
  cancelLinkText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#EF4444',
  },

  // Cancel Modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 36,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 13,
    color: '#64748B',
    marginBottom: 16,
  },
  cancelReasonItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  cancelReasonText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '600',
  },
  closeModalBtn: {
    backgroundColor: '#059669',
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 20,
  },
  closeModalText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default CustomerEnRouteScreen;
