import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Easing, Dimensions } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import api from '../../services/api';

import { useBookingState } from '../../hooks/useBookingState';

const { width, height } = Dimensions.get('window');

const WaitingScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [nearbyCount, setNearbyCount] = useState<number | string>('...');
  const [eta, setEta] = useState<string>('Calculating...');
  const [vans, setVans] = useState<any[]>([]);
  
  const pulseAnim = useRef(new Animated.Value(0)).current;
  const shimmerAnim = useRef(new Animated.Value(-width)).current;
  const slideAnim = useRef(new Animated.Value(300)).current;
  const dotAnim1 = useRef(new Animated.Value(0.3)).current;
  const dotAnim2 = useRef(new Animated.Value(0.3)).current;
  const dotAnim3 = useRef(new Animated.Value(0.3)).current;

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    // Fetch Location to center map
    const fetchLocation = async () => {
      let locCoords = { latitude: 37.7749, longitude: -122.4194 };
      try {
        let { status: locationStatus } = await Location.requestForegroundPermissionsAsync();
        if (locationStatus === 'granted') {
          const loc = await Location.getCurrentPositionAsync({});
          locCoords = { latitude: loc.coords.latitude, longitude: loc.coords.longitude };
        }
      } catch (err) {
        console.log('Location permission error', err);
      }
      
      setCurrentLocation({ coords: locCoords } as any);
      
      try {
        const res = await api.get(`/operators/nearby?lng=${locCoords.longitude}&lat=${locCoords.latitude}`);
        const operators = res.data?.data?.operators || [];
        setVans(operators);
        setNearbyCount(operators.length);
        if (operators.length > 0) {
          const closestDist = operators[0].dist?.calculated || 0;
          const etaMin = Math.max(1, Math.round(closestDist / 400));
          setEta(`${etaMin}-${etaMin + 4}m`);
        } else {
          setEta('N/A');
        }
      } catch(e) {
        console.error('API Error:', e);
        setNearbyCount(0);
        setEta('N/A');
      }
    };
    fetchLocation();

    // Map radar pulse animation
    Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 2500,
          easing: Easing.out(Easing.ease),
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0,
          duration: 0,
          useNativeDriver: true,
        }),
      ])
    ).start();

    // Bottom sheet shimmer animation
    Animated.loop(
      Animated.timing(shimmerAnim, {
        toValue: width,
        duration: 1500,
        easing: Easing.linear,
        useNativeDriver: true,
      })
    ).start();

    // Bottom sheet slide up entrance
    Animated.spring(slideAnim, {
      toValue: 0,
      tension: 50,
      friction: 8,
      useNativeDriver: true,
    }).start();

    // Dots loading animation
    Animated.loop(
      Animated.stagger(200, [
        Animated.sequence([
          Animated.timing(dotAnim1, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim1, { toValue: 0.3, duration: 400, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(dotAnim2, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim2, { toValue: 0.3, duration: 400, useNativeDriver: true })
        ]),
        Animated.sequence([
          Animated.timing(dotAnim3, { toValue: 1, duration: 400, useNativeDriver: true }),
          Animated.timing(dotAnim3, { toValue: 0.3, duration: 400, useNativeDriver: true })
        ])
      ])
    ).start();
  }, []);

  return (
    <View style={styles.container}>
      {/* Back Button & Compass Overlay */}
      <SafeAreaView style={styles.headerOverlay}>
        <TouchableOpacity style={styles.iconButton} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={styles.iconButton} 
          onPress={() => {
            if (currentLocation && mapRef.current) {
              mapRef.current.animateToRegion({
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              });
            }
          }}
        >
          <Ionicons name="navigate-outline" size={24} color="#fff" />
        </TouchableOpacity>
      </SafeAreaView>

      {/* Full Map Background */}
      <MapView 
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFillObject}
        initialRegion={{
          latitude: currentLocation?.coords.latitude || 37.7749,
          longitude: currentLocation?.coords.longitude || -122.4194,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        }}
        region={currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.02,
          longitudeDelta: 0.02,
        } : undefined}
        customMapStyle={mapStyle}
        showsUserLocation={false}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
            anchor={{ x: 0.5, y: 0.5 }}
          >
            <View style={styles.markerContainer}>
              <Animated.View style={[styles.pulseRing, {
                transform: [{ scale: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.8, 4] }) }],
                opacity: pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 0] })
              }]} />
              <View style={styles.userPin}>
                <View style={styles.userPinInner} />
              </View>
            </View>
          </Marker>
        )}
        
        {/* Render Nearby Vans with slight visual jitter for demo/testing */}
        {vans.map((van, index) => {
          let lat = van.location?.coordinates[1];
          let lng = van.location?.coordinates[0];
          
          if (!lat || !lng) return null;
          
          // Add a tiny pseudo-random offset (approx 200-800 meters) based on index 
          // so that all test vans at the exact same GPS coordinate spread out visually
          const jitterLat = (Math.sin(index * 999) * 0.005);
          const jitterLng = (Math.cos(index * 999) * 0.005);
          
          lat += jitterLat;
          lng += jitterLng;

          return (
            <Marker key={van._id || index} coordinate={{ latitude: lat, longitude: lng }}>
              <View style={styles.vanMarkerBox}>
                <Text style={{fontSize: 16}}>🚚</Text>
              </View>
            </Marker>
          );
        })}
      </MapView>

      {/* Bottom Sheet */}
      <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.shimmerContainer}>
          <Animated.View style={[styles.shimmerBar, {
            transform: [{ translateX: shimmerAnim }]
          }]} />
        </View>

        <View style={styles.sheetContent}>
          <Text style={styles.title}>Finding your rescuer...</Text>
          <Text style={styles.subtitle}>Scanning for mobile charging vans nearby</Text>
          
          <View style={styles.searchVisual}>
            <View style={styles.searchIconBox}>
              <Ionicons name="search" size={24} color={colors.secondaryContainer} />
            </View>
            <View style={styles.searchDots}>
              <Animated.View style={[styles.dot, { opacity: dotAnim1 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim2 }]} />
              <Animated.View style={[styles.dot, { opacity: dotAnim3 }]} />
            </View>
            <View style={styles.vanIconBox}>
              <Text style={{fontSize: 24}}>🚚</Text>
            </View>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>ESTIMATED WAIT</Text>
              <Text style={styles.statValue}>{eta}</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statLabel}>VANS NEARBY</Text>
              <Text style={[styles.statValue, { color: colors.secondaryContainer }]}>{nearbyCount}</Text>
            </View>
          </View>

          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={() => navigation.goBack()}
          >
            <Text style={styles.cancelButtonText}>Cancel Request</Text>
          </TouchableOpacity>
        </View>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
  },
  headerOverlay: {
    position: 'absolute',
    top: 40,
    left: 0,
    right: 0,
    zIndex: 10,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  iconButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  userPin: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(59, 130, 246, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
  userPinInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#3B82F6',
    borderWidth: 2,
    borderColor: '#fff',
  },
  pulseRing: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#3B82F6',
    zIndex: 1,
  },
  vanMarkerBox: {
    width: 32,
    height: 32,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: colors.secondaryContainer,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#1A1A1A',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -10 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 20,
    overflow: 'hidden',
  },
  shimmerContainer: {
    width: '100%',
    height: 4,
    backgroundColor: '#333',
    overflow: 'hidden',
  },
  shimmerBar: {
    width: width * 0.5,
    height: '100%',
    backgroundColor: colors.secondaryContainer,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  title: {
    color: '#fff',
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  subtitle: {
    color: '#888',
    fontSize: 14,
    marginBottom: 24,
  },
  searchVisual: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  searchIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(47, 248, 1, 0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(47, 248, 1, 0.3)',
  },
  searchDots: {
    flexDirection: 'row',
    gap: 6,
    marginHorizontal: 16,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#444',
  },
  vanIconBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 32,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#222',
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  statLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 4,
    letterSpacing: 1,
  },
  statValue: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
  },
  cancelButton: {
    width: '100%',
    paddingVertical: 16,
    borderRadius: 12,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
});

const mapStyle = [
  { "elementType": "geometry", "stylers": [{ "color": "#212121" }] },
  { "elementType": "labels.icon", "stylers": [{ "visibility": "off" }] },
  { "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "elementType": "labels.text.stroke", "stylers": [{ "color": "#212121" }] },
  { "featureType": "administrative", "elementType": "geometry", "stylers": [{ "color": "#757575" }] },
  { "featureType": "administrative.country", "elementType": "labels.text.fill", "stylers": [{ "color": "#9e9e9e" }] },
  { "featureType": "administrative.land_parcel", "stylers": [{ "visibility": "off" }] },
  { "featureType": "administrative.locality", "elementType": "labels.text.fill", "stylers": [{ "color": "#bdbdbd" }] },
  { "featureType": "poi", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "poi.park", "elementType": "geometry", "stylers": [{ "color": "#181818" }] },
  { "featureType": "poi.park", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "poi.park", "elementType": "labels.text.stroke", "stylers": [{ "color": "#1b1b1b" }] },
  { "featureType": "road", "elementType": "geometry.fill", "stylers": [{ "color": "#2c2c2c" }] },
  { "featureType": "road", "elementType": "labels.text.fill", "stylers": [{ "color": "#8a8a8a" }] },
  { "featureType": "road.arterial", "elementType": "geometry", "stylers": [{ "color": "#373737" }] },
  { "featureType": "road.highway", "elementType": "geometry", "stylers": [{ "color": "#3c3c3c" }] },
  { "featureType": "road.highway.controlled_access", "elementType": "geometry", "stylers": [{ "color": "#4e4e4e" }] },
  { "featureType": "road.local", "elementType": "labels.text.fill", "stylers": [{ "color": "#616161" }] },
  { "featureType": "transit", "elementType": "labels.text.fill", "stylers": [{ "color": "#757575" }] },
  { "featureType": "water", "elementType": "geometry", "stylers": [{ "color": "#000000" }] },
  { "featureType": "water", "elementType": "labels.text.fill", "stylers": [{ "color": "#3d3d3d" }] }
];

export default WaitingScreen;
