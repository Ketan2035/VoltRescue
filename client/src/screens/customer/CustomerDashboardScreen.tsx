import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Dimensions,
  Modal,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MapView, { Marker, UrlTile, PROVIDER_DEFAULT } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const CustomerDashboardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0);
  const [profileVisible, setProfileVisible] = useState(false);
  const [nearbyVans, setNearbyVans] = useState<any[]>([]);
  const [loadingVans, setLoadingVans] = useState(true);
  const [userLocation, setUserLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [currentAddress, setCurrentAddress] = useState('Locating your position...');
  const [selectedService, setSelectedService] = useState('emergency');

  const mapRef = useRef<MapView>(null);

  useEffect(() => {
    fetchLocationAndVans();
  }, []);

  useEffect(() => {
    if (userLocation && mapRef.current) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          800
        );
      } catch (e) {}
    }
  }, [userLocation]);

  const fetchLocationAndVans = async () => {
    try {
      setLoadingVans(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      let lng = -122.406417;
      let lat = 37.785834;

      if (status === 'granted') {
        try {
          const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
          if (location && location.coords) {
            lng = location.coords.longitude;
            lat = location.coords.latitude;
          }
        } catch (locErr) {
          console.log('Location acquisition fallback:', locErr);
        }

        const newCoords = { latitude: lat, longitude: lng };
        setUserLocation(newCoords);

        if (mapRef.current) {
          try {
            mapRef.current.animateToRegion(
              {
                latitude: lat,
                longitude: lng,
                latitudeDelta: 0.03,
                longitudeDelta: 0.03,
              },
              800
            );
          } catch (e) {}
        }

        try {
          const geocode = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
          if (geocode && geocode.length > 0) {
            const first = geocode[0];
            const addr = [first.name || first.street, first.city].filter(Boolean).join(', ');
            setCurrentAddress(addr || 'Current Location');
          }
        } catch {
          setCurrentAddress('Current Location');
        }
      } else {
        setUserLocation({ latitude: lat, longitude: lng });
        setCurrentAddress('Current Location');
      }

      const response = await api.get(`/operators/nearby?lng=${lng}&lat=${lat}`);
      if (response.data?.data?.operators) {
        setNearbyVans(response.data.data.operators);
      }
    } catch (error) {
      console.error('Error fetching data:', error);
      setUserLocation({ latitude: 37.785834, longitude: -122.406417 });
      setCurrentAddress('Current Location');
    } finally {
      setLoadingVans(false);
    }
  };

  const recenterMap = () => {
    if (mapRef.current && userLocation) {
      try {
        mapRef.current.animateToRegion(
          {
            latitude: userLocation.latitude,
            longitude: userLocation.longitude,
            latitudeDelta: 0.03,
            longitudeDelta: 0.03,
          },
          600
        );
      } catch (e) {}
    }
  };

  const handleBookNow = () => {
    navigation.navigate('BookingWizard', { serviceType: selectedService });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Main Map Background */}
      <View style={styles.mapContainer}>
        <MapView
          ref={mapRef}
          provider={PROVIDER_DEFAULT}
          mapType="none"
          style={styles.map}
          initialRegion={{
            latitude: 37.785834,
            longitude: -122.406417,
            latitudeDelta: 0.04,
            longitudeDelta: 0.04,
          }}
          showsUserLocation={true}
          showsMyLocationButton={false}
          showsCompass={false}
        >
          <UrlTile
            urlTemplate="https://a.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}.png"
            maximumZ={19}
            flipY={false}
            zIndex={-1}
          />
          {userLocation && (
            <Marker coordinate={userLocation} title="Your Location">
              <View style={styles.userMarkerPin}>
                <View style={styles.userMarkerRing} />
                <View style={styles.userMarkerCore} />
              </View>
            </Marker>
          )}

          {nearbyVans.map((van, index) => {
            const lat =
              van.location?.coordinates?.[1] ||
              (userLocation?.latitude || 37.785834) + (index * 0.005 - 0.003);
            const lng =
              van.location?.coordinates?.[0] ||
              (userLocation?.longitude || -122.406417) + (index * 0.005 - 0.003);

            return (
              <Marker key={van._id || index} coordinate={{ latitude: lat, longitude: lng }}>
                <View style={styles.vanMarker}>
                  <Ionicons name="flash" size={14} color="#FFFFFF" />
                </View>
              </Marker>
            );
          })}
        </MapView>

        {/* Floating Top App Bar with Accurate Inset */}
        <View style={[styles.floatingHeaderArea, { paddingTop: topInset + 10 }]}>
          <View style={styles.topBar}>
            <View style={styles.brandPill}>
              <View style={styles.brandIcon}>
                <Ionicons name="flash" size={14} color="#FFFFFF" />
              </View>
              <Text style={styles.brandName}>VoltRescue</Text>
            </View>

            <TouchableOpacity
              style={styles.locationPill}
              onPress={fetchLocationAndVans}
              activeOpacity={0.8}
            >
              <Ionicons name="location-sharp" size={16} color={colors.primary} />
              <Text style={styles.locationText} numberOfLines={1}>
                {currentAddress}
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.avatarButton}
              onPress={() => setProfileVisible(true)}
              activeOpacity={0.8}
            >
              <Ionicons name="menu" size={20} color="#0F172A" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Floating Map Recenter Control */}
        <View style={[styles.mapControls, { top: topInset + 72 }]}>
          <TouchableOpacity style={styles.mapControlBtn} onPress={recenterMap} activeOpacity={0.8}>
            <Ionicons name="locate" size={20} color={colors.primary} />
          </TouchableOpacity>
        </View>
      </View>

      {/* Menu / Profile Drawer Modal */}
      <Modal visible={profileVisible} transparent animationType="fade">
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setProfileVisible(false)}
        >
          <View style={[styles.drawerContent, { paddingTop: topInset + 16 }]}>
            <View style={styles.drawerHeader}>
              <View style={styles.userProfileRow}>
                <View style={styles.userAvatar}>
                  <Ionicons name="person" size={24} color="#059669" />
                </View>
                <View>
                  <Text style={styles.userName}>EV Guest Driver</Text>
                  <Text style={styles.userSub}>Instant Roadside Rescue</Text>
                </View>
              </View>
              <TouchableOpacity onPress={() => setProfileVisible(false)} style={styles.closeDrawerBtn}>
                <Ionicons name="close" size={20} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setProfileVisible(false);
                navigation.navigate('MyBookings');
              }}
            >
              <Ionicons name="time-outline" size={20} color="#64748B" />
              <Text style={styles.drawerItemText}>My Rescue Trips</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setProfileVisible(false);
                navigation.navigate('PaymentMethods');
              }}
            >
              <Ionicons name="card-outline" size={20} color="#64748B" />
              <Text style={styles.drawerItemText}>Payment Methods</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setProfileVisible(false);
                navigation.navigate('Settings');
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#64748B" />
              <Text style={styles.drawerItemText}>App Settings</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setProfileVisible(false);
                navigation.navigate('Support');
              }}
            >
              <Ionicons name="help-buoy-outline" size={20} color="#64748B" />
              <Text style={styles.drawerItemText}>Help & Support</Text>
            </TouchableOpacity>

            <View style={styles.drawerDivider} />

            <TouchableOpacity
              style={[styles.drawerItem, styles.driverPortalItem]}
              onPress={() => {
                setProfileVisible(false);
                navigation.navigate('DriverAuth');
              }}
            >
              <Ionicons name="car-sport" size={20} color="#059669" />
              <Text style={styles.driverPortalText}>Rescue Driver Portal</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.drawerItem}
              onPress={() => {
                setProfileVisible(false);
                navigation.replace('Welcome');
              }}
            >
              <Ionicons name="log-out-outline" size={20} color="#DC2626" />
              <Text style={[styles.drawerItemText, { color: '#DC2626' }]}>Exit to Welcome</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Bottom Sheet Card */}
      <View style={[styles.bottomSheet, { paddingBottom: Math.max(insets.bottom, 16) + 12 }]}>
        <View style={styles.dragHandle} />

        {/* Dispatch Availability Banner */}
        <View style={styles.dispatchBanner}>
          <View style={styles.dispatchInfo}>
            <View style={styles.pulseDot} />
            <Text style={styles.dispatchTitle}>
              {nearbyVans.length > 0 ? `${nearbyVans.length} Mobile Vans Online` : 'Rapid Response Active'}
            </Text>
          </View>
          <View style={styles.etaBadge}>
            <Ionicons name="time-outline" size={13} color="#059669" />
            <Text style={styles.etaBadgeText}>~8 min arrival</Text>
          </View>
        </View>

        {/* Service Options */}
        <View style={styles.servicesGrid}>
          <TouchableOpacity
            style={[styles.serviceCard, selectedService === 'emergency' && styles.serviceCardSelected]}
            onPress={() => setSelectedService('emergency')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.serviceIconCircle,
                selectedService === 'emergency' && styles.serviceIconCircleSelected,
              ]}
            >
              <Ionicons
                name="flash"
                size={18}
                color={selectedService === 'emergency' ? '#FFFFFF' : '#059669'}
              />
            </View>
            <Text style={styles.serviceName}>Emergency Boost</Text>
            <Text style={styles.serviceDesc}>Quick 15–20 kWh charge</Text>
            <Text style={styles.servicePrice}>Fast Dispatch</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.serviceCard, selectedService === 'full' && styles.serviceCardSelected]}
            onPress={() => setSelectedService('full')}
            activeOpacity={0.8}
          >
            <View
              style={[
                styles.serviceIconCircle,
                selectedService === 'full' && styles.serviceIconCircleSelected,
              ]}
            >
              <Ionicons
                name="battery-charging"
                size={18}
                color={selectedService === 'full' ? '#FFFFFF' : '#059669'}
              />
            </View>
            <Text style={styles.serviceName}>Full Recovery</Text>
            <Text style={styles.serviceDesc}>30–50 kWh top-up</Text>
            <Text style={styles.servicePrice}>Standard Dispatch</Text>
          </TouchableOpacity>
        </View>

        {/* Primary Action Button */}
        <TouchableOpacity
          style={styles.primaryActionButton}
          onPress={() => navigation.navigate('BookingWizard')}
          activeOpacity={0.88}
        >
          <View style={styles.btnRow}>
            <Ionicons name="flash" size={18} color="#FFFFFF" />
            <Text style={styles.primaryActionText}>REQUEST RESCUE CHARGE</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  mapContainer: {
    flex: 1,
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  vanMarker: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2.5,
    borderColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 4,
    elevation: 4,
  },
  userMarkerPin: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 28,
    height: 28,
  },
  userMarkerRing: {
    position: 'absolute',
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(5, 150, 105, 0.25)',
  },
  userMarkerCore: {
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#059669',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  floatingHeaderArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    gap: 8,
  },
  brandPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  brandIcon: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: '#059669',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 6,
  },
  brandName: {
    fontSize: 13,
    fontWeight: '800',
    color: '#0F172A',
  },
  locationPill: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 6,
  },
  locationText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0F172A',
    flex: 1,
  },
  avatarButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  mapControls: {
    position: 'absolute',
    right: 16,
    zIndex: 10,
  },
  mapControlBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    justifyContent: 'flex-start',
  },
  drawerContent: {
    backgroundColor: '#FFFFFF',
    borderBottomLeftRadius: 24,
    borderBottomRightRadius: 24,
    paddingHorizontal: 20,
    paddingBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  drawerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  userProfileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  userAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  userName: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  userSub: {
    fontSize: 12,
    color: '#64748B',
    marginTop: 2,
  },
  closeDrawerBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  drawerDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 10,
  },
  drawerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 14,
  },
  drawerItemText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#0F172A',
  },
  driverPortalItem: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    borderRadius: 12,
    marginVertical: 4,
  },
  driverPortalText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#059669',
  },
  bottomSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.1,
    shadowRadius: 16,
    elevation: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  dragHandle: {
    width: 36,
    height: 4,
    backgroundColor: '#CBD5E1',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 12,
  },
  dispatchBanner: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  dispatchInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pulseDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#059669',
  },
  dispatchTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#065F46',
  },
  etaBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  etaBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  servicesGrid: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 14,
  },
  serviceCard: {
    flex: 1,
    backgroundColor: '#F8FAFC',
    borderRadius: 16,
    padding: 12,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
  },
  serviceCardSelected: {
    borderColor: '#059669',
    backgroundColor: '#ECFDF5',
  },
  serviceIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  serviceIconCircleSelected: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  serviceName: {
    fontSize: 14,
    fontWeight: '800',
    color: '#0F172A',
    marginBottom: 2,
  },
  serviceDesc: {
    fontSize: 11,
    color: '#64748B',
    marginBottom: 6,
  },
  servicePrice: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  primaryActionButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  btnRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  primaryActionText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
});

export default CustomerDashboardScreen;
