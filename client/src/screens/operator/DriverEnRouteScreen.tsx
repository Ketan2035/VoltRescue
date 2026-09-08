import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions, Linking } from 'react-native';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import storage from '../../services/storage';
import { useSocket } from '../../contexts/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';
import SwipeButton from '../../components/SwipeButton';

const { width, height } = Dimensions.get('window');

const EnRouteScreen = ({ route, navigation }: any) => {
  const { bookingId, isOperator: paramIsOperator } = route.params || {};
  const { status } = useBookingState(bookingId);
  const { socket } = useSocket();

  const [isOperator, setIsOperator] = useState(paramIsOperator || false);
  const [operatorLocation, setOperatorLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null); // from booking
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [routeCoordinates, setRouteCoordinates] = useState<any[]>([]);
  const [etaMins, setEtaMins] = useState<number | null>(null);

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    const checkRole = async () => {
      const token = await storage.getItem('operatorToken');
      if (token) {
        setIsOperator(true);
      }
    };
    if (!paramIsOperator) {
      checkRole();
    }
  }, [paramIsOperator]);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        const booking = res.data.data.booking;
        setBookingDetails(booking);
        if (booking.userLocation && booking.userLocation.coordinates) {
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
      // Mock locations for UI preview without backend
      setCustomerLocation({ latitude: 37.7749, longitude: -122.4194 });
      setOperatorLocation({ latitude: 37.7849, longitude: -122.4094 });
      setBookingDetails({
        customerId: { name: 'Rahul (Mock Customer)', phone: '+91 9876543210' },
        requestedEnergyKWh: 25,
        chargingType: 'DC Fast',
        connectorType: 'CCS2',
        status: 'VEHICLE_ASSIGNED'
      });
    }
  }, [bookingId]);

  useEffect(() => {
    let locationSubscription: any = null;

    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }

      if (isOperator) {
        // Stream location
        locationSubscription = await Location.watchPositionAsync(
          {
            accuracy: Location.Accuracy.High,
            timeInterval: 2000,
            distanceInterval: 10,
          },
          (location) => {
            const coords = {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            };
            setOperatorLocation(coords);
            if (socket) {
              socket.emit('operator_location_update', {
                bookingId,
                location: coords,
              });
            }
          }
        );
      }
    };

    startTracking();

    return () => {
      if (locationSubscription) {
        locationSubscription.remove();
      }
    };
  }, [isOperator, bookingId, socket]);

  useEffect(() => {
    if (!isOperator && socket) {
      // Listen to operator location
      const handleLocationUpdate = (data: any) => {
        if (data.bookingId === bookingId) {
          setOperatorLocation(data.location);
        }
      };
      socket.on('operator_location_update', handleLocationUpdate);
      return () => {
        socket.off('operator_location_update', handleLocationUpdate);
      };
    }
  }, [isOperator, socket, bookingId]);

  useEffect(() => {
    // Fit map to markers
    if (mapRef.current && customerLocation && operatorLocation) {
      mapRef.current.fitToCoordinates([customerLocation, operatorLocation], {
        edgePadding: { top: 50, right: 50, bottom: 350, left: 50 },
        animated: true,
      });
    }
  }, [customerLocation, operatorLocation]);

  useEffect(() => {
    const fetchRoute = async () => {
      const currentStatus = status || bookingDetails?.status;
      if (isOperator && currentStatus === 'DRIVER_STARTED' && operatorLocation && customerLocation && routeCoordinates.length === 0) {
        try {
          const res = await fetch(`http://router.project-osrm.org/route/v1/driving/${operatorLocation.longitude},${operatorLocation.latitude};${customerLocation.longitude},${customerLocation.latitude}?overview=full&geometries=geojson`);
          const data = await res.json();
          if (data.routes && data.routes.length > 0) {
            const coords = data.routes[0].geometry.coordinates.map((point: [number, number]) => ({
              latitude: point[1],
              longitude: point[0],
            }));
            setRouteCoordinates(coords);
            setEtaMins(Math.ceil(data.routes[0].duration / 60));
          }
        } catch (error) {
          console.error("Failed to fetch route", error);
        }
      }
    };
    fetchRoute();
  }, [isOperator, status, bookingDetails?.status, operatorLocation, customerLocation, routeCoordinates.length]);

  const handleArrived = async () => {
    if (bookingId && bookingId !== 'mock-id') {
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'ARRIVING'
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      navigation.navigate('StartCharging', { bookingId });
    }
  };

  const getMapRegion = () => {
    if (operatorLocation) {
      return {
        latitude: operatorLocation.latitude,
        longitude: operatorLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    if (customerLocation) {
      return {
        latitude: customerLocation.latitude,
        longitude: customerLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };
    }
    return {
      latitude: 37.7749,
      longitude: -122.4194,
      latitudeDelta: 0.1,
      longitudeDelta: 0.1,
    };
  };

  const customerName = bookingDetails?.customerId?.name || bookingDetails?.customerName || bookingDetails?.personalInfo?.name || 'Customer';

  return (
    <SafeAreaView style={styles.container}>
      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapView 
          ref={mapRef}
          style={styles.mapImage}
          initialRegion={getMapRegion()}
          showsUserLocation={!isOperator} // Customer sees their own dot natively
          customMapStyle={mapStyle}
        >
          {customerLocation && (
            <Marker coordinate={customerLocation} title="Customer Location">
              <View style={styles.userDot} />
            </Marker>
          )}

          {operatorLocation && (
            <Marker coordinate={operatorLocation} title="Rescue Van">
               <View style={styles.vanLabelContainer}>
                <Text style={styles.vanLabel}>VAN</Text>
              </View>
              <View style={styles.vanIconBg}>
                <Text style={styles.vanIcon}>⚡</Text>
              </View>
              <View style={styles.vanPointer} />
            </Marker>
          )}
          
          {routeCoordinates.length > 0 ? (
             <Polyline 
               coordinates={routeCoordinates}
               strokeColor={colors.primary}
               strokeWidth={6}
             />
          ) : (
             customerLocation && operatorLocation && (
               <Polyline 
                 coordinates={[operatorLocation, customerLocation]}
                 strokeColor={colors.secondaryFixed}
                 strokeWidth={4}
                 lineDashPattern={[10, 10]}
               />
             )
          )}
        </MapView>
        <View style={styles.mapGradient} />
      </View>

      {/* Floating Status Pill */}
      <View style={styles.floatingStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>{isOperator ? `En Route to ${customerName}` : 'Van En Route'}</Text>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {/* Progress Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.etaText}>
              {errorMsg ? 'GPS Error' : (etaMins !== null ? `${etaMins} min away` : `Navigating to ${customerName}`)}
            </Text>
            <Text style={styles.sheetLabel}>Drive safely</Text>
          </View>
          <View style={styles.pinContainer}>
            <Text style={styles.pinLabel}>ENERGY</Text>
            <Text style={styles.pinText}>{bookingDetails?.requestedEnergyKWh || 0}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        {/* Info */}
        <View style={styles.driverInfoRow}>
          <View style={styles.driverLeft}>

            <View>
              <Text style={styles.driverName}>
                {customerName}
              </Text>
              <View style={styles.vehiclePill}>
                <Text style={styles.vehicleText}>{bookingDetails?.chargingType || 'DC Fast'} • {bookingDetails?.connectorType || 'CCS2'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            {isOperator && (status || bookingDetails?.status) === 'DRIVER_STARTED' && (
              <TouchableOpacity style={[styles.iconCircleBtn, { backgroundColor: colors.primary }]} onPress={() => {
                if (customerLocation) {
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}`);
                }
              }}>
                <Ionicons name="navigate" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => {
              if (bookingId) {
                navigation.navigate('Chat', { 
                  bookingId, 
                  isOperator: true, 
                  otherPersonName: customerName 
                });
              }
            }}>
              <Ionicons name="chatbubble" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => {
              if (bookingDetails?.customerId?.phone) {
                Linking.openURL(`tel:${bookingDetails.customerId.phone}`);
              }
            }}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>

        {isOperator && (status || bookingDetails?.status) === 'VEHICLE_ASSIGNED' && (
          <SwipeButton 
            text="SWIPE TO START"
            successText="STARTED"
            onSwipeSuccess={async () => {
              try {
                await api.patch(`/bookings/${bookingId}/status`, { status: 'DRIVER_STARTED' });
                // Route will automatically be fetched and drawn via OSRM inside this very screen!
                
                // Auto redirect to native Google Maps app for turn-by-turn directions
                if (customerLocation) {
                  Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${customerLocation.latitude},${customerLocation.longitude}`);
                }
              } catch (e) { console.error(e); }
            }}
          />
        )}

        {isOperator && (status || bookingDetails?.status) === 'DRIVER_STARTED' && (
          <SwipeButton 
            text="SWIPE TO ARRIVE"
            successText="ARRIVED"
            onSwipeSuccess={handleArrived}
          />
        )}
      </View>
    </SafeAreaView>
  );
};

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#242f3e" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#746855" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#242f3e" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#263c3f" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#6b9a76" }] },
  { "featureType": "road", "elementType": "geometry", "stylers": [{ "color": "#38414e" }] },
  { "featureType": "road", "elementType": "geometry.stroke", "stylers": [{ "color": "#212a37" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#9ca5b3" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#746855" }] },
  { "featureType": "road.highway", "elementType": "geometry.stroke", "stylers": [{ "color": "#1f2835" }] },
  { "featureType": "road.highway", "elementType": "labels.text.fill", "stylers": [{ "color": "#f3d19c" }] },
  { "featureType": "transit", "elementType": "geometry", "stylers": [{ "color": "#2f3948" }] },
  { "featureType": "transit.station", "elementType": "labels.text.fill", "stylers": [{ "color": "#d59563" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#17263c" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#515c6d" }] },
  { "featureType": "water", "elementType": "labels.text.stroke", "stylers": [{ "color": "#17263c" }] }
];

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    paddingTop: Constants.statusBarHeight + 16,
    zIndex: 10,
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
    justifyContent: 'space-between',
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  logoText: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 255, 0.2)',
    backgroundColor: colors.surfaceContainer,
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  mapArea: {
    flex: 1,
    position: 'relative',
    marginTop: Constants.statusBarHeight,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  mapGradient: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: '50%',
    backgroundColor: 'rgba(19, 19, 19, 0.6)',
  },
  userDot: {
    width: 16,
    height: 16,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 4,
    borderColor: colors.primary,
    shadowColor: '#fff',
    shadowOpacity: 0.6,
    shadowRadius: 10,
    elevation: 5,
  },
  vanLabelContainer: {
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
    marginBottom: 4,
    alignSelf: 'center',
  },
  vanLabel: {
    color: colors.onSecondary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  vanIconBg: {
    width: 32,
    height: 32,
    backgroundColor: colors.secondaryFixed,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondaryFixed,
    shadowOpacity: 0.4,
    shadowRadius: 10,
    alignSelf: 'center',
  },
  vanIcon: {
    fontSize: 16,
  },
  vanPointer: {
    width: 0,
    height: 0,
    backgroundColor: 'transparent',
    borderStyle: 'solid',
    borderLeftWidth: 6,
    borderRightWidth: 6,
    borderTopWidth: 8,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderTopColor: colors.secondaryFixed,
    marginTop: -2,
    alignSelf: 'center',
  },
  floatingStatus: {
    position: 'absolute',
    top: 90,
    alignSelf: 'center',
    backgroundColor: 'rgba(28, 27, 27, 0.8)',
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 255, 0.2)',
  },
  statusDot: {
    width: 8,
    height: 8,
    backgroundColor: colors.secondaryFixed,
    borderRadius: 4,
    marginRight: 8,
  },
  statusText: {
    color: colors.onSurface,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bottomSheet: { position: 'absolute', bottom: 0, left: 0, right: 0, backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingTop: 12, shadowColor: '#000', shadowOpacity: 0.8, shadowRadius: 20, elevation: 24 },
  dragHandle: { width: 40, height: 4, backgroundColor: '#444', borderRadius: 2, alignSelf: 'center', marginBottom: 20 },
  sheetHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  etaText: { color: '#fff', fontSize: 24, fontWeight: '800', marginBottom: 4 },
  sheetLabel: { color: '#888', fontSize: 14, fontWeight: '500' },
  pinContainer: { backgroundColor: 'rgba(173, 198, 255, 0.15)', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: 'rgba(173, 198, 255, 0.3)' },
  pinLabel: { color: colors.secondaryFixed, fontSize: 10, fontWeight: 'bold', letterSpacing: 1 },
  pinText: { color: '#fff', fontSize: 22, fontWeight: '900' },
  divider: { width: '100%', height: 1, backgroundColor: '#333', marginBottom: 20 },
  driverInfoRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 },
  driverLeft: { flexDirection: 'row', alignItems: 'center', gap: 16 },
  driverAvatarContainer: { position: 'relative' },
  driverAvatar: { width: 56, height: 56, borderRadius: 28, borderWidth: 2, borderColor: colors.secondaryFixed },
  driverName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  vehiclePill: { backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  vehicleText: { color: '#aaa', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  iconCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  arrivedButton: { marginTop: 8, backgroundColor: colors.secondaryContainer, borderRadius: 16, paddingVertical: 16, alignItems: 'center', shadowColor: colors.secondaryContainer, shadowOpacity: 0.3, shadowRadius: 10, elevation: 5 },
  arrivedButtonText: { color: colors.onSecondaryContainer, fontSize: 16, fontWeight: 'bold', letterSpacing: 1 }
});

export default EnRouteScreen;
