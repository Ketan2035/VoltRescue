import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import * as Location from 'expo-location';

const MapScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);
  const [nearbyVans, setNearbyVans] = useState<any[]>([]);
  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    (async () => {
      let lng = -122.4194;
      let lat = 37.7749;

      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status === 'granted') {
        let location = await Location.getCurrentPositionAsync({});
        lng = location.coords.longitude;
        lat = location.coords.latitude;
        const coords = { latitude: lat, longitude: lng };
        setUserLocation(coords);

        if (mapRef.current) {
          try {
            mapRef.current.animateToRegion(
              {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.04,
                longitudeDelta: 0.04,
              },
              800
            );
          } catch (e) {}
        }
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

  useEffect(() => {
    if (userLocation && mapRef.current) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          },
          800
        );
      } catch (e) {}
    }
  }, [userLocation]);

  const handleRequestCharge = async () => {
    setIsLoading(true);
    try {
      const coords = userLocation
        ? [userLocation.longitude, userLocation.latitude]
        : [-122.4194, 37.7749];

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

  const mapRegion = userLocation
    ? {
        latitude: userLocation.latitude,
        longitude: userLocation.longitude,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      }
    : {
        latitude: 37.7749,
        longitude: -122.4194,
        latitudeDelta: 0.05,
        longitudeDelta: 0.05,
      };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Ionicons name="flash" size={16} color="#059669" />
          </View>
          <Text style={styles.brandTitle}>VOLTRESCUE MAP</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      {/* Map Area */}
      <View style={styles.mapArea}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          mapType="none"
          style={StyleSheet.absoluteFillObject}
          initialRegion={mapRegion}
          showsUserLocation={true}
        >
          <UrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            shouldReplaceMapContent={true}
            zIndex={-1}
          />
          {userLocation && (
            <Marker coordinate={userLocation} title="Your Breakdown Location">
              <View style={styles.userMarker}>
                <Ionicons name="location" size={18} color="#FFFFFF" />
              </View>
            </Marker>
          )}

          {nearbyVans.map((van, index) => {
            const lat =
              van.location?.coordinates?.[1] ||
              (userLocation?.latitude || 37.7749) + (index * 0.005 - 0.002);
            const lng =
              van.location?.coordinates?.[0] ||
              (userLocation?.longitude || -122.4194) + (index * 0.005 - 0.002);

            return (
              <Marker key={van._id || index} coordinate={{ latitude: lat, longitude: lng }}>
                <View style={styles.vanMarker}>
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                </View>
              </Marker>
            );
          })}
        </MapView>
      </View>

      {/* Bottom Sheet */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <View style={styles.sheetHeader}>
          <View>
            <Text style={styles.sheetTitle}>On-Demand EV Rescue</Text>
            <Text style={styles.sheetSubtitle}>High-speed mobile charging dispatched to you</Text>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>5-8 MIN ETA</Text>
          </View>
        </View>

        <View style={styles.optionsRow}>
          <View style={[styles.optionCard, styles.optionActive]}>
            <View style={styles.optionPriceRow}>
              <Text style={styles.optionPrice}>₹28.00<Text style={styles.unitText}>/kWh</Text></Text>
            </View>
            <Text style={styles.optionTitle}>Rapid DC Fast</Text>
            <Text style={styles.optionDesc}>Up to 150kW high-speed delivery</Text>
          </View>

          <View style={styles.optionCard}>
            <View style={styles.optionPriceRow}>
              <Text style={styles.optionPrice}>₹18.00<Text style={styles.unitText}>/kWh</Text></Text>
            </View>
            <Text style={styles.optionTitle}>Standard Rescue</Text>
            <Text style={styles.optionDesc}>50kW Balanced recovery flow</Text>
          </View>
        </View>

        <TouchableOpacity
          style={styles.requestButton}
          onPress={handleRequestCharge}
          disabled={isLoading}
          activeOpacity={0.85}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.requestButtonText}>REQUEST CHARGE NOW</Text>
          )}
        </TouchableOpacity>
      </View>
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
  brandRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  brandIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  brandTitle: {
    color: '#059669',
    fontSize: 13,
    fontWeight: '800',
    letterSpacing: 1,
  },
  mapArea: {
    flex: 1,
  },
  mapImage: {
    ...StyleSheet.absoluteFillObject,
  },
  userMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 3,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  vanMarker: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#059669',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 4,
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    paddingBottom: 36,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sheetTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
  },
  sheetSubtitle: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  etaBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  etaText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
  },
  optionsRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  optionCard: {
    flex: 1,
    padding: 14,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    backgroundColor: '#F8FAFC',
  },
  optionActive: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  optionPriceRow: {
    marginBottom: 6,
  },
  optionPrice: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  unitText: {
    fontSize: 11,
    color: '#64748B',
    fontWeight: '600',
  },
  optionTitle: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
    marginBottom: 2,
  },
  optionDesc: {
    color: '#64748B',
    fontSize: 11,
    lineHeight: 14,
  },
  requestButton: {
    backgroundColor: '#059669',
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  requestButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default MapScreen;
