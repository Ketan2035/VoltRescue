import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TextInput, TouchableOpacity, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import MapView, { Marker } from 'react-native-maps';
import * as Location from 'expo-location';

const MapScreen = ({ navigation }: any) => {
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [nearbyVans, setNearbyVans] = useState<any[]>([]);
  
  useEffect(() => {
    (async () => {
      let lng = -122.4194;
      let lat = 37.7749;

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        lng = location.coords.longitude;
        lat = location.coords.latitude;
        setUserLocation({ latitude: lat, longitude: lng });
      } else {
        setUserLocation({ latitude: lat, longitude: lng });
      }

      try {
        const response = await api.get(`/operators/nearby?lng=${lng}&lat=${lat}`);
        if (response.data?.data?.operators) {
          setNearbyVans(response.data.data.operators);
        }
      } catch (error) {
        console.error('Error fetching nearby vans for map:', error);
      }
    })();
  }, []);

  const handleRequestCharge = async () => {
    setIsLoading(true);
    try {
      const coords = userLocation ? [userLocation.longitude, userLocation.latitude] : [-122.4194, 37.7749];
      
      const response = await api.post('/bookings', {
        userLocation: coords,
        requestedEnergyKWh: 25, 
      });

      const booking = response.data.data.booking;
      
      navigation.navigate('Waiting', { bookingId: booking._id });
    } catch (error) {
      console.error('Error creating booking:', error);
      navigation.navigate('Waiting');
    } finally {
      setIsLoading(false);
    }
  };

  const mapRegion = userLocation ? {
    latitude: userLocation.latitude,
    longitude: userLocation.longitude,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  } : {
    latitude: 37.7749,
    longitude: -122.4194,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.logoText}>VoltRescue</Text>
        </View>
        <View style={styles.searchContainer}>
          <TextInput 
            style={styles.searchInput} 
            placeholder="Where is your EV parked?" 
            placeholderTextColor={colors.onSurfaceVariant}
          />
        </View>
        <TouchableOpacity style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuATSW_gLWTKu6Sv8oaJ2EF91m642Omp5wbWacnMFp-N1-t3xVsiW0aMwmtgyq82OgAEpscQ8dQgcS-ALSn3u0ISyy9NxiQXfr3QAD3_fiqUdg1mm_HwPj-Om0W66ihZwrquRfg-2xVj38l0KuijamO8VqeLiBhojRZQF9QM3qDskru5P0lJ-1uNMXzmtEzDKFgm9FSPBWRMUrVaMiU5-EYmT1j7u-PcGJu_ONz7M-Hs5Pyukg7kKp31mqA0MVhui__yjZiaBkQX0TLq' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapView 
          style={styles.mapImage} 
          region={mapRegion}
          showsUserLocation={true}
          customMapStyle={mapStyle}
        >
          {nearbyVans.map((van, index) => {
             const distMeters = van.dist?.calculated || 0;
             const etaMinutes = Math.max(1, Math.round(distMeters / 400));
             let lat = van.location?.coordinates[1];
             let lng = van.location?.coordinates[0];
             
             if (!lat || !lng) return null;
             
             const jitterLat = (Math.sin(index * 999) * 0.005);
             const jitterLng = (Math.cos(index * 999) * 0.005);
             
             lat += jitterLat;
             lng += jitterLng;

             return (
               <Marker key={van._id || index} coordinate={{ latitude: lat, longitude: lng }}>
                 <View style={styles.vanMarkerLabel}>
                   <Text style={styles.vanMarkerText}>{etaMinutes}m eta</Text>
                 </View>
                 <View style={[styles.vanMarkerDot, van.status !== 'ONLINE' && { backgroundColor: '#888', borderColor: 'transparent' }]} />
               </Marker>
             );
          })}
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <View style={styles.bottomSheet}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>Charge Request</Text>
            <Text style={styles.sheetSubtitle}>Tesla Model S • SF Downtown Hub</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>5-8 MIN</Text>
          </View>
        </View>

        <View style={styles.optionsRow}>
          <TouchableOpacity style={[styles.optionCard, styles.optionActive]}>
            <View style={styles.optionPriceRow}>
              <Text style={styles.optionPrice}>₹24.00</Text>
            </View>
            <Text style={styles.optionTitle}>Fast Charge</Text>
            <Text style={styles.optionDesc}>250kW Hyper-speed recovery</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.optionCard}>
            <View style={styles.optionPriceRow}>
              <Text style={styles.optionPrice}>₹14.00</Text>
            </View>
            <Text style={styles.optionTitle}>Standard</Text>
            <Text style={styles.optionDesc}>50kW Balanced charging</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.paymentRow}>
          <Text style={styles.paymentText}>•••• 4242</Text>
          <TouchableOpacity>
            <Text style={styles.changeText}>CHANGE</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity 
          style={styles.requestButton}
          onPress={handleRequestCharge}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={colors.onPrimaryContainer} />
          ) : (
            <Text style={styles.requestButtonText}>REQUEST CHARGE NOW</Text>
          )}
        </TouchableOpacity>
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
    zIndex: 10,
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
    justifyContent: 'space-between',
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
  searchContainer: {
    flex: 1,
    marginHorizontal: 16,
  },
  searchInput: {
    backgroundColor: colors.surfaceVariant,
    color: colors.onSurface,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
  },
  profileImageContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(173, 198, 255, 0.2)',
  },
  profileImage: {
    width: '100%',
    height: '100%',
  },
  mapArea: {
    flex: 1,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  vanMarkerLabel: {
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    marginBottom: 4,
    alignSelf: 'center',
  },
  vanMarkerText: {
    color: colors.secondaryFixed,
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  vanMarkerDot: {
    width: 12,
    height: 12,
    backgroundColor: colors.secondaryFixed,
    borderRadius: 6,
    alignSelf: 'center',
  },
  bottomSheet: {
    backgroundColor: 'rgba(25, 25, 25, 0.95)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
  },
  sheetTitle: {
    color: colors.primary,
    fontSize: 24,
    fontWeight: 'bold',
  },
  sheetSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 4,
  },
  etaBadge: {
    backgroundColor: 'rgba(121, 255, 91, 0.1)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  etaText: {
    color: colors.secondaryFixed,
    fontSize: 12,
    fontWeight: 'bold',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 20,
  },
  optionCard: {
    flex: 1,
    padding: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.05)',
    backgroundColor: 'rgba(255, 255, 255, 0.05)',
  },
  optionActive: {
    borderColor: 'rgba(121, 255, 91, 0.5)',
    backgroundColor: 'rgba(121, 255, 91, 0.05)',
  },
  optionPriceRow: {
    marginBottom: 12,
  },
  optionPrice: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  optionTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  optionDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 11,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 20,
    paddingHorizontal: 8,
  },
  paymentText: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: '500',
  },
  changeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  requestButton: {
    backgroundColor: colors.primaryContainer,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
  },
  requestButtonText: {
    color: colors.onPrimaryContainer,
    fontSize: 16,
    fontWeight: 'bold',
  },
});

export default MapScreen;
