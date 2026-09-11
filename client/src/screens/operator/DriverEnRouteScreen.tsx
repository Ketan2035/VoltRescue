import React, { useEffect, useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Linking,
  Platform,
  StatusBar,
  Animated,
  Alert,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';
import MapView, { Marker, Polyline, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSocket } from '../../contexts/SocketContext';
import { Ionicons } from '@expo/vector-icons';

const { width } = Dimensions.get('window');

const DriverEnRouteScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);
  const { bookingId, isOperator: paramIsOperator } = route.params || {};
  const { status } = useBookingState(bookingId);
  const { socket } = useSocket();

  const [operatorLocation, setOperatorLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [etaMins, setEtaMins] = useState<number>(5);
  const [distanceKm, setDistanceKm] = useState<string>('2.4');
  const [isStartingTrip, setIsStartingTrip] = useState(false);

  // Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const mapRef = useRef<MapView>(null);

  // Pulse animation for marker
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1.35,
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
    loop.start();
    return () => loop.stop();
  }, []);

  // Fetch Booking Details from API
  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const booking = res.data?.data?.booking;
        if (booking) {
          setBookingDetails(booking);
          if (booking.userLocation?.coordinates && booking.userLocation.coordinates.length >= 2) {
            setCustomerLocation({
              latitude: booking.userLocation.coordinates[1],
              longitude: booking.userLocation.coordinates[0],
            });
          }
        }
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };

    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    } else {
      // Fallback coordinates
      (async () => {
        try {
          const { status: permStatus } = await Location.requestForegroundPermissionsAsync();
          if (permStatus === 'granted') {
            const loc = await Location.getCurrentPositionAsync({});
            setCustomerLocation({ latitude: loc.coords.latitude + 0.007, longitude: loc.coords.longitude + 0.005 });
            setOperatorLocation({
              latitude: loc.coords.latitude,
              longitude: loc.coords.longitude,
            });
          } else {
            setCustomerLocation({ latitude: 12.9716, longitude: 77.5946 });
            setOperatorLocation({ latitude: 12.9816, longitude: 77.6046 });
          }
        } catch {
          setCustomerLocation({ latitude: 12.9716, longitude: 77.5946 });
          setOperatorLocation({ latitude: 12.9816, longitude: 77.6046 });
        }
      })();
    }
  }, [bookingId]);

  // Live Location Tracker for Operator
  useEffect(() => {
    let locationSubscription: any = null;

    const startTracking = async () => {
      let { status: permStatus } = await Location.requestForegroundPermissionsAsync();
      if (permStatus !== 'granted') return;

      locationSubscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.High,
          timeInterval: 2500,
          distanceInterval: 10,
        },
        (location) => {
          const coords = {
            latitude: location.coords.latitude,
            longitude: location.coords.longitude,
          };
          setOperatorLocation(coords);
          if (socket && bookingId) {
            socket.emit('operator_location_update', {
              bookingId,
              location: coords,
            });
          }
        }
      );
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [bookingId, socket]);

  // Fit Map View
  useEffect(() => {
    if (mapRef.current && customerLocation && operatorLocation) {
      try {
        mapRef.current.fitToCoordinates([customerLocation, operatorLocation], {
          edgePadding: { top: 120, right: 60, bottom: 320, left: 60 },
          animated: true,
        });
      } catch (e) {}
    }
  }, [customerLocation, operatorLocation]);

  // Fetch real road route from OSRM
  useEffect(() => {
    const fetchRoute = async () => {
      if (operatorLocation && customerLocation && routeCoordinates.length === 0) {
        try {
          const res = await fetch(
            `https://router.project-osrm.org/route/v1/driving/${operatorLocation.longitude},${operatorLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?overview=full&geometries=geojson`
          );
          const data = await res.json();
          if (data?.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((point: [number, number]) => ({
              latitude: point[1],
              longitude: point[0],
            }));
            setRouteCoordinates(coords);
            setEtaMins(Math.max(1, Math.ceil(data.routes[0].duration / 60)));
            setDistanceKm((data.routes[0].distance / 1000).toFixed(1));
          }
        } catch (error) {
          console.log('OSRM route fetch fallback:', error);
        }
      }
    };
    fetchRoute();
  }, [operatorLocation, customerLocation, routeCoordinates.length]);

  // Open Turn-by-Turn directly in Google Maps without triggering third-party app choosers
  const handleOpenNavigation = (customCoords?: { latitude: number; longitude: number }) => {
    const target =
      customCoords ||
      customerLocation ||
      (bookingDetails?.userLocation?.coordinates?.length >= 2
        ? {
            latitude: bookingDetails.userLocation.coordinates[1],
            longitude: bookingDetails.userLocation.coordinates[0],
          }
        : null);

    if (target && target.latitude && target.longitude) {
      const lat = target.latitude;
      const lng = target.longitude;

      // Direct universal Google Maps Driving Directions URL (Bypasses Uber/3rd party intent choosers)
      const directGoogleMapsUrl = `https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}&travelmode=driving`;

      Linking.openURL(directGoogleMapsUrl).catch(() => {
        // Fallback
        Linking.openURL(`https://maps.google.com/maps?daddr=${lat},${lng}&dirflg=d`).catch(() => {});
      });
    }
  };

  // Start Trip Action -> Auto Redirects to Google Maps Navigation Route
  const handleStartJourney = async () => {
    setIsStartingTrip(true);
    try {
      if (bookingId && bookingId !== 'mock-id') {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'DRIVER_STARTED',
        });
      }
    } catch (e) {
      console.error('Failed to start trip:', e);
    } finally {
      setIsStartingTrip(false);
      // Auto redirect to Google Maps with destination route
      handleOpenNavigation();
    }
  };

  // Arrived at Site Action
  const handleArrived = async () => {
    try {
      if (bookingId && bookingId !== 'mock-id') {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'ARRIVING',
        });
      }
    } catch (err) {
      console.error('Failed to update status to ARRIVING:', err);
    } finally {
      navigation.navigate('StartCharging', { bookingId, isOperator: true });
    }
  };

  // Recenter Map
  const handleRecenter = () => {
    if (mapRef.current && operatorLocation && customerLocation) {
      mapRef.current.fitToCoordinates([customerLocation, operatorLocation], {
        edgePadding: { top: 120, right: 60, bottom: 320, left: 60 },
        animated: true,
      });
    }
  };

  const currentStatus = status || bookingDetails?.status || 'VEHICLE_ASSIGNED';
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
  const address =
    bookingDetails?.userLocation?.address ||
    bookingDetails?.address ||
    bookingDetails?.location?.address ||
    'Breakdown Site, Bengaluru';
  const remarks = bookingDetails?.remarks || bookingDetails?.problem || '';
  const currentBattery = bookingDetails?.batteryPercentage?.current || 8;
  const payout = bookingDetails?.pricing?.totalAmount
    ? Number(bookingDetails.pricing.totalAmount).toFixed(2)
    : '1,052.56';

  const customerInitials = customerName
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || 'EV';

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* 1. Map Area */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          mapType="none"
          style={styles.mapImage}
          initialRegion={{
            latitude: operatorLocation?.latitude || customerLocation?.latitude || 12.9716,
            longitude: operatorLocation?.longitude || customerLocation?.longitude || 77.5946,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          showsCompass={false}
          showsTraffic={false}
        >
          <UrlTile
            urlTemplate="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={true}
            zIndex={-1}
          />
          {/* Customer Location Pin */}
          {customerLocation && (
            <Marker coordinate={customerLocation} title="Breakdown Site">
              <View style={styles.customerPinContainer}>
                <View style={styles.customerPinBadge}>
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                </View>
                <View style={styles.pinTip} />
              </View>
            </Marker>
          )}

          {/* Operator Rescue Van Marker with Pulse */}
          {operatorLocation && (
            <Marker coordinate={operatorLocation} title="Your Rescue Van" anchor={{ x: 0.5, y: 0.5 }}>
              <View style={styles.vanMarkerWrapper}>
                <Animated.View
                  style={[
                    styles.vanPulseRing,
                    {
                      transform: [{ scale: pulseAnim }],
                      opacity: pulseAnim.interpolate({
                        inputRange: [1, 1.35],
                        outputRange: [0.6, 0],
                      }),
                    },
                  ]}
                />
                <View style={styles.vanMarkerCore}>
                  <Ionicons name="car" size={16} color="#FFFFFF" />
                </View>
              </View>
            </Marker>
          )}

          {/* Road Polyline */}
          {routeCoordinates.length > 0 ? (
            <Polyline coordinates={routeCoordinates} strokeColor="#059669" strokeWidth={5} lineCap="round" />
          ) : (
            customerLocation &&
            operatorLocation && (
              <Polyline
                coordinates={[operatorLocation, customerLocation]}
                strokeColor="#059669"
                strokeWidth={3}
                lineDashPattern={[8, 8]}
              />
            )
          )}
        </MapView>
      </View>

      {/* 2. Top Navigation Bar */}
      <View style={[styles.topNavCard, { top: topInset + 10 }]}>
        <View style={styles.topNavLeft}>
          <View style={styles.navEtaBox}>
            <Text style={styles.navEtaNumber}>{etaMins}</Text>
            <Text style={styles.navEtaUnit}>MIN</Text>
          </View>
          <View style={{ flex: 1 }}>
            <View style={styles.navStatusRow}>
              <View style={styles.liveDot} />
              <Text style={styles.navStatusLabel}>
                {currentStatus === 'DRIVER_STARTED' ? 'LIVE EN ROUTE' : 'READY TO DISPATCH'}
              </Text>
            </View>
            <Text style={styles.navDistanceText}>{distanceKm} km to customer</Text>
          </View>
        </View>

        {/* 1-Tap Google Maps Button */}
        <TouchableOpacity
          style={styles.navMapButton}
          onPress={() => handleOpenNavigation()}
          activeOpacity={0.85}
        >
          <Ionicons name="navigate" size={16} color="#FFFFFF" />
          <Text style={styles.navMapButtonText}>Navigate</Text>
        </TouchableOpacity>
      </View>

      {/* Floating Recenter Button */}
      <TouchableOpacity
        style={styles.recenterButton}
        onPress={handleRecenter}
        activeOpacity={0.8}
      >
        <Ionicons name="locate" size={20} color="#0F172A" />
      </TouchableOpacity>

      {/* 3. Bottom Dispatch Command Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 20) + 8 }]}>
        <View style={styles.sheetHandle} />

        {/* Trip Payout & Target SOC Header */}
        <View style={styles.tripMetaRow}>
          <View>
            <Text style={styles.tripMetaLabel}>GUARANTEED TRIP PAYOUT</Text>
            <Text style={styles.tripMetaPayout}>₹{payout}</Text>
          </View>
          <View style={styles.batteryPill}>
            <Ionicons name="battery-dead" size={14} color="#DC2626" />
            <Text style={styles.batteryPillText}>{currentBattery}% SOC Critical</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Customer Profile & Quick Contact Cluster */}
        <View style={styles.customerRow}>
          <View style={styles.customerAvatar}>
            <Text style={styles.avatarInitials}>{customerInitials}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.customerName}>{customerName}</Text>
            <Text style={styles.vehicleInfoText}>
              {vehicleModel} • {connectorType} ({requestedKWh} kWh DC)
            </Text>
          </View>

          {/* Call & Chat Action Controls */}
          <View style={styles.quickActionCluster}>
            <TouchableOpacity
              style={styles.actionBtnCall}
              onPress={() => {
                const phone = customerPhone || '+91 9876543210';
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
                    isOperator: true,
                    otherPersonName: customerName,
                  });
                }
              }}
              activeOpacity={0.8}
            >
              <Ionicons name="chatbubble-ellipses" size={18} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Breakdown Site Address Box */}
        <View style={styles.addressCard}>
          <Ionicons name="location" size={18} color="#EF4444" style={{ marginTop: 2 }} />
          <View style={{ flex: 1 }}>
            <Text style={styles.addressLabel}>BREAKDOWN SITE</Text>
            <Text style={styles.addressText} numberOfLines={2}>{address}</Text>
            {remarks ? (
              <Text style={styles.remarksText}>Remark: "{remarks}"</Text>
            ) : null}
          </View>
        </View>

        {/* Primary Stage Action Button */}
        {currentStatus === 'VEHICLE_ASSIGNED' ? (
          <TouchableOpacity
            style={styles.primaryActionButton}
            onPress={handleStartJourney}
            disabled={isStartingTrip}
            activeOpacity={0.88}
          >
            <Ionicons name="navigate" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>
              {isStartingTrip ? 'STARTING TRIP...' : 'START RESCUE TRIP'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.primaryActionButton, { backgroundColor: '#059669' }]}
            onPress={handleArrived}
            activeOpacity={0.88}
          >
            <Ionicons name="checkmark-circle" size={20} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>I HAVE ARRIVED AT SITE</Text>
          </TouchableOpacity>
        )}
      </View>
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

  // Markers
  customerPinContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  customerPinBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#EF4444',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.4,
    shadowRadius: 5,
    elevation: 5,
  },
  pinTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 5,
    borderRightWidth: 5,
    borderTopWidth: 6,
    borderStyle: 'solid',
    backgroundColor: 'transparent',
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: '#EF4444',
    marginTop: -1,
  },
  vanMarkerWrapper: {
    width: 50,
    height: 50,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vanPulseRing: {
    position: 'absolute',
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: '#10B981',
  },
  vanMarkerCore: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.35,
    shadowRadius: 4,
    elevation: 4,
  },

  // Top Navigation Card
  topNavCard: {
    position: 'absolute',
    left: 16,
    right: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 6,
  },
  topNavLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 10,
  },
  navEtaBox: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navEtaNumber: {
    fontSize: 18,
    fontWeight: '900',
    color: '#065F46',
    lineHeight: 20,
  },
  navEtaUnit: {
    fontSize: 9,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.6,
  },
  navStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 2,
  },
  liveDot: {
    width: 7,
    height: 7,
    borderRadius: 3.5,
    backgroundColor: '#059669',
  },
  navStatusLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.6,
  },
  navDistanceText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  navMapButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#059669',
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 14,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 3,
  },
  navMapButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '900',
    letterSpacing: 0.4,
  },

  // Recenter Button
  recenterButton: {
    position: 'absolute',
    right: 18,
    bottom: 300,
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 4,
  },

  // Bottom Command Sheet
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 26,
    borderTopRightRadius: 26,
    paddingHorizontal: 20,
    paddingTop: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -6 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 12,
    gap: 10,
  },
  sheetHandle: {
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CBD5E1',
    alignSelf: 'center',
    marginBottom: 2,
  },
  tripMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  tripMetaLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#059669',
    letterSpacing: 0.6,
  },
  tripMetaPayout: {
    fontSize: 24,
    fontWeight: '900',
    color: '#0F172A',
    letterSpacing: -0.5,
  },
  batteryPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: '#FEF2F2',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#FECACA',
  },
  batteryPillText: {
    fontSize: 11,
    fontWeight: '800',
    color: '#DC2626',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  customerAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  avatarInitials: {
    fontSize: 14,
    fontWeight: '900',
    color: '#059669',
  },
  customerName: {
    fontSize: 15,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  vehicleInfoText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#64748B',
  },
  quickActionCluster: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtnCall: {
    width: 42,
    height: 42,
    borderRadius: 21,
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
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },

  // Breakdown Address Card
  addressCard: {
    flexDirection: 'row',
    gap: 10,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  addressLabel: {
    fontSize: 10,
    fontWeight: '900',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  addressText: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
    lineHeight: 18,
  },
  remarksText: {
    fontSize: 11,
    color: '#92400E',
    fontWeight: '600',
    marginTop: 3,
    fontStyle: 'italic',
  },

  // Primary Action Button
  primaryActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    backgroundColor: '#059669',
    borderRadius: 18,
    paddingVertical: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 8,
    elevation: 6,
    marginTop: 2,
  },
  primaryActionText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#FFFFFF',
    letterSpacing: 0.8,
  },
});

export default DriverEnRouteScreen;
