import React, { useEffect, useRef, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Animated, Dimensions, Image } from 'react-native';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import { useProfile } from '../../contexts/ProfileContext';

import api from '../../services/api';

const { height, width } = Dimensions.get('window');

const IncomingRequestsScreen = ({ route, navigation }: any) => {
  const request = route.params?.request;
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [timeLeft, setTimeLeft] = useState(30);
  
  // Animations
  const slideAnim = useRef(new Animated.Value(height)).current; // Start below screen
  const progressAnim = useRef(new Animated.Value(1)).current; // 1 to 0 for progress bar
  
  const { profilePicture } = useProfile();

  useEffect(() => {
    // 1. Fetch Location
    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') return;
      let location = await Location.getCurrentPositionAsync({});
      setCurrentLocation(location);
    };
    fetchLocation();

    // 2. Slide up the bottom sheet
    Animated.spring(slideAnim, {
      toValue: 0,
      friction: 8,
      tension: 40,
      useNativeDriver: true,
    }).start();

    // 3. Start Timer Progress Bar Animation
    Animated.timing(progressAnim, {
      toValue: 0,
      duration: 30000,
      useNativeDriver: false,
    }).start();

    // 4. Start Countdown Text
    const interval = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          navigation.goBack(); // auto decline
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    // 5. Play Sound
    let soundObject: Audio.Sound;
    const playSound = async () => {
      try {
        await Audio.setAudioModeAsync({
          playsInSilentModeIOS: true,
          staysActiveInBackground: true,
          shouldDuckAndroid: true,
          playThroughEarpieceAndroid: false, // Ensure it plays through main speaker
        });
        const { sound } = await Audio.Sound.createAsync(
          { uri: 'https://actions.google.com/sounds/v1/alarms/phone_ringing.ogg' },
          { shouldPlay: true, isLooping: true, volume: 1.0 } // Max volume
        );
        soundObject = sound;
        await sound.playAsync();
      } catch (error) {
        console.log('Error playing sound:', error);
      }
    };
    playSound();

    return () => {
      clearInterval(interval);
      if (soundObject) {
        soundObject.stopAsync();
        soundObject.unloadAsync();
      }
    };
  }, []);

  const handleAccept = async () => {
    if (!request) return;
    try {
      await api.patch(`/bookings/${request.bookingId}/status`, {
        status: 'VEHICLE_ASSIGNED'
      });
      navigation.replace('EnRoute', { bookingId: request.bookingId });
    } catch (error) {
      console.error('Failed to accept request:', error);
      // Optionally show alert
    }
  };

  const handleDecline = () => {
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      {/* 1. Live Map Background */}
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        customMapStyle={mapStyle}
        initialRegion={{
          latitude: currentLocation?.coords.latitude || 37.7749,
          longitude: currentLocation?.coords.longitude || -122.4194,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        }}
        region={currentLocation ? {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.05,
          longitudeDelta: 0.05,
        } : undefined}
      >
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.coords.latitude,
              longitude: currentLocation.coords.longitude,
            }}
          >
            <View style={styles.markerContainer}>
              <Text style={styles.markerIcon}>🚚</Text>
            </View>
          </Marker>
        )}
        {request?.pickupLocation && (
          <Marker
            coordinate={{
              latitude: request.pickupLocation.coordinates[1],
              longitude: request.pickupLocation.coordinates[0],
            }}
          >
            <View style={styles.customerMarker}>
              <Ionicons name="person" size={16} color="#fff" />
            </View>
          </Marker>
        )}
      </MapView>

      <SafeAreaView style={styles.safeArea}>
        {/* Header / Decline Button */}
        <View style={styles.header}>
           <TouchableOpacity style={styles.closeButton} onPress={handleDecline}>
             <Ionicons name="close" size={28} color="#fff" />
           </TouchableOpacity>
        </View>

        <View style={{ flex: 1 }} />

        {/* 2. Animated Bottom Sheet */}
        <Animated.View style={[styles.bottomSheet, { transform: [{ translateY: slideAnim }] }]}>
          {/* Top Progress Bar Timer */}
          <View style={styles.progressBarBackground}>
            <Animated.View 
              style={[
                styles.progressBarFill, 
                { 
                  width: progressAnim.interpolate({ inputRange: [0, 1], outputRange: ['0%', '100%'] })
                }
              ]} 
            />
          </View>

          <View style={styles.sheetContent}>
            {/* Customer Info Header */}
            <View style={styles.sheetHeader}>
              <View style={styles.customerInfo}>
                <View style={styles.avatarPlaceholder}>
                  <Ionicons name="person" size={24} color="#aaa" />
                </View>
                <View>
                  <Text style={styles.customerName}>{request?.customerName || 'Customer'}</Text>
                  <Text style={styles.vehicleType}>{request?.vehicleDetails?.make || 'Vehicle'} {request?.vehicleDetails?.model || ''}</Text>
                </View>
              </View>
              <View style={styles.payoutContainer}>
                <Text style={styles.payoutLabel}>Est. Payout</Text>
                <Text style={styles.payoutAmount}>₹{request?.estimatedPrice || '0.00'}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.extraDetailsGrid}>
              <View style={styles.extraDetailRow}>
                <Ionicons name="call-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.extraDetailText}>{request?.customerPhone || 'N/A'}</Text>
              </View>
              <View style={styles.extraDetailRow}>
                <Ionicons name="location-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.extraDetailText} numberOfLines={1}>{request?.address || 'Current Location'}</Text>
              </View>
              <View style={styles.extraDetailRow}>
                <Ionicons name="battery-charging-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.extraDetailText}>{request?.batteryPercentage || '20'}% Current Battery</Text>
              </View>
              <View style={styles.extraDetailRow}>
                <Ionicons name="card-outline" size={16} color={colors.onSurfaceVariant} />
                <Text style={styles.extraDetailText}>{request?.paymentMethod || 'Online'} Payment</Text>
              </View>
            </View>

            <View style={styles.divider} />

            {/* Metrics Row */}
            <View style={styles.metricsRow}>
              <View style={styles.metricItem}>
                <Ionicons name="navigate-outline" size={20} color={colors.onSurfaceVariant} />
                <Text style={styles.metricText}>{request?.distance || '1.2'} mi</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="time-outline" size={20} color={colors.onSurfaceVariant} />
                <Text style={styles.metricText}>5 min</Text>
              </View>
              <View style={styles.metricItem}>
                <Ionicons name="flash-outline" size={20} color={colors.secondaryFixed} />
                <Text style={[styles.metricText, { color: colors.secondaryFixed }]}>{request?.requestedEnergyKWh || '30'} kWh</Text>
              </View>
            </View>

            {/* Actions */}
            <View style={styles.actionButtonsRow}>
              <TouchableOpacity style={styles.declineBtn} onPress={handleDecline}>
                <Text style={styles.declineBtnText}>Decline</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.acceptBtn} 
                onPress={handleAccept}
              >
                <Text style={styles.acceptBtnText}>ACCEPT</Text>
                <Text style={styles.timerSub}>{timeLeft}s</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Animated.View>
      </SafeAreaView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0a0a0a',
  },
  map: {
    ...StyleSheet.absoluteFillObject,
  },
  safeArea: {
    flex: 1,
    justifyContent: 'space-between',
  },
  header: {
    padding: 16,
    alignItems: 'flex-start',
  },
  closeButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  markerContainer: {
    backgroundColor: 'rgba(0,0,0,0.8)',
    padding: 8,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: colors.secondaryFixed,
  },
  markerIcon: {
    fontSize: 24,
  },
  customerMarker: {
    backgroundColor: '#3b82f6',
    width: 30,
    height: 30,
    borderRadius: 15,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#fff',
  },
  bottomSheet: {
    backgroundColor: '#1E1E1E',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -5 },
    shadowOpacity: 0.5,
    shadowRadius: 15,
    elevation: 20,
    overflow: 'hidden',
  },
  progressBarBackground: {
    width: '100%',
    height: 6,
    backgroundColor: '#333',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: colors.secondaryFixed,
  },
  sheetContent: {
    padding: 24,
    paddingBottom: 40,
  },
  sheetHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  customerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  avatarPlaceholder: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#333',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  vehicleType: {
    color: '#aaa',
    fontSize: 14,
    marginTop: 2,
  },
  payoutContainer: {
    alignItems: 'flex-end',
  },
  payoutLabel: {
    color: '#888',
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
  },
  payoutAmount: {
    color: colors.secondaryFixed,
    fontSize: 28,
    fontWeight: '900',
  },
  divider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 16,
  },
  extraDetailsGrid: {
    gap: 8,
  },
  extraDetailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  extraDetailText: {
    color: '#ddd',
    fontSize: 14,
  },
  metricsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  metricItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,255,255,0.05)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
  },
  metricText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  actionButtonsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  declineBtn: {
    flex: 1,
    height: 56,
    borderRadius: 12,
    backgroundColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  declineBtnText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptBtn: {
    flex: 2,
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.secondaryFixed,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  acceptBtnText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '800',
  },
  timerSub: {
    color: '#000',
    fontSize: 14,
    fontWeight: '600',
    opacity: 0.7,
  }
});

// Custom dark map style (same as dashboard)
const mapStyle = [
  { elementType: "geometry", stylers: [{ color: "#212121" }] },
  { elementType: "labels.icon", stylers: [{ visibility: "off" }] },
  { elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { elementType: "labels.text.stroke", stylers: [{ color: "#212121" }] },
  { featureType: "administrative", elementType: "geometry", stylers: [{ color: "#757575" }] },
  { featureType: "administrative.country", elementType: "labels.text.fill", stylers: [{ color: "#9e9e9e" }] },
  { featureType: "administrative.land_parcel", stylers: [{ visibility: "off" }] },
  { featureType: "administrative.locality", elementType: "labels.text.fill", stylers: [{ color: "#bdbdbd" }] },
  { featureType: "poi", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "poi.park", elementType: "geometry", stylers: [{ color: "#181818" }] },
  { featureType: "poi.park", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "poi.park", elementType: "labels.text.stroke", stylers: [{ color: "#1b1b1b" }] },
  { featureType: "road", elementType: "geometry.fill", stylers: [{ color: "#2c2c2c" }] },
  { featureType: "road", elementType: "labels.text.fill", stylers: [{ color: "#8a8a8a" }] },
  { featureType: "road.arterial", elementType: "geometry", stylers: [{ color: "#373737" }] },
  { featureType: "road.highway", elementType: "geometry", stylers: [{ color: "#3c3c3c" }] },
  { featureType: "road.highway.controlled_access", elementType: "geometry", stylers: [{ color: "#4e4e4e" }] },
  { featureType: "road.local", elementType: "labels.text.fill", stylers: [{ color: "#616161" }] },
  { featureType: "transit", elementType: "labels.text.fill", stylers: [{ color: "#757575" }] },
  { featureType: "water", elementType: "geometry", stylers: [{ color: "#000000" }] },
  { featureType: "water", elementType: "labels.text.fill", stylers: [{ color: "#3d3d3d" }] }
];

export default IncomingRequestsScreen;

