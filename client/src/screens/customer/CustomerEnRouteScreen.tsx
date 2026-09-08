import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, SafeAreaView, Dimensions, Modal, Linking } from 'react-native';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';
import MapView, { Marker, Polyline } from 'react-native-maps';
import * as Location from 'expo-location';
import { useSocket } from '../../contexts/SocketContext';
import { Ionicons } from '@expo/vector-icons';
import Constants from 'expo-constants';

const { width, height } = Dimensions.get('window');

const CustomerEnRouteScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const { socket } = useSocket();

  const [operatorLocation, setOperatorLocation] = useState<any>(null);
  const [customerLocation, setCustomerLocation] = useState<any>(null);
  const [bookingDetails, setBookingDetails] = useState<any>(null);
  const [errorMsg, setErrorMsg] = useState('');
  const [cancelModalVisible, setCancelModalVisible] = useState(false);

  const handleCancel = async (reason: string) => {
    setCancelModalVisible(false);
    if (bookingId) {
      try {
        await api.patch(`/bookings/${bookingId}/status`, { 
          status: 'CANCELLED',
          cancellationReason: reason
        });
        navigation.navigate('CustomerDashboard');
      } catch (err) {
        console.error(err);
      }
    }
  };

  const mapRef = useRef<MapView>(null);

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
      setCustomerLocation({ latitude: 37.7749, longitude: -122.4194 });
      setOperatorLocation({ latitude: 37.7849, longitude: -122.4094 });
    }
  }, [bookingId]);

  useEffect(() => {
    const startTracking = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setErrorMsg('Permission to access location was denied');
        return;
      }
    };
    startTracking();
  }, []);

  useEffect(() => {
    if (socket) {
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
  }, [socket, bookingId]);

  useEffect(() => {
    if (mapRef.current && customerLocation && operatorLocation) {
      mapRef.current.fitToCoordinates([customerLocation, operatorLocation], {
        edgePadding: { top: 50, right: 50, bottom: 350, left: 50 },
        animated: true,
      });
    }
  }, [customerLocation, operatorLocation]);

  const getMapRegion = () => {
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

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.mapArea}>
        <MapView 
          ref={mapRef}
          style={styles.mapImage}
          initialRegion={getMapRegion()}
          showsUserLocation={true} 
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
          
          {customerLocation && operatorLocation && (
             <Polyline 
               coordinates={[operatorLocation, customerLocation]}
               strokeColor={colors.secondaryFixed}
               strokeWidth={4}
               lineDashPattern={[10, 10]}
             />
          )}
        </MapView>
        <View style={styles.mapGradient} />
      </View>

      <View style={styles.floatingStatus}>
        <View style={styles.statusDot} />
        <Text style={styles.statusText}>Van En Route</Text>
      </View>

      <View style={styles.bottomSheet}>
        <View style={styles.dragHandle} />

        {/* Progress Header */}
        <View style={styles.sheetHeader}>
          <View style={{ flex: 1 }}>
            <Text style={styles.etaText}>
              {errorMsg ? 'GPS Error' : 'Arriving in 5 mins'}
            </Text>
            <Text style={styles.sheetLabel}>Meet driver at your location</Text>
          </View>
          {bookingDetails?.otp ? (
             <View style={styles.pinContainer}>
                <Text style={styles.pinLabel}>PIN</Text>
                <Text style={styles.pinText}>{bookingDetails.otp}</Text>
             </View>
          ) : (
            <View style={styles.pinContainer}>
                <Text style={styles.pinLabel}>ENERGY</Text>
                <Text style={styles.pinText}>{bookingDetails?.requestedEnergyKWh || 0}</Text>
             </View>
          )}
        </View>

        <View style={styles.divider} />

        {/* Driver Info */}
        <View style={styles.driverInfoRow}>
          <View style={styles.driverLeft}>
            <View style={styles.driverAvatarContainer}>
              <Image 
                source={{ uri: bookingDetails?.operatorId?.profileImageUrl || 'https://lh3.googleusercontent.com/aida-public/AB6AXuDui1QNv4jKMbmBX59Ru5zSy9YFoxzvIKknM3LDFO9L0ctO2GFt0R7hl7q2m_0ZmxDgLGxhhTITkrefmWaTpIjWVtu0Lg-skqEk9qYxXztiQmRq--tCG59PkCVPq6-iiUK0OO30AkSusjiQiOlXBTFCyoLoGIrmhq37QqljDAHwLZEtXyx9wuVjAKufhKZ4JWiMTJD_d-JYQq9HPrdPBCOJxteaeYoph9kIEOs6EW0PvRAq1kk5U5R9O5v9L8K4Eb0RpzvjR0XDrcZK' }}
                style={styles.driverAvatar}
              />
              <View style={styles.ratingBadge}>
                <Text style={styles.ratingText}>{bookingDetails?.operatorId?.rating || '5.0'} ★</Text>
              </View>
            </View>
            <View>
              <Text style={styles.driverName}>
                {bookingDetails?.operatorId?.name || 'Operator'}
              </Text>
              <View style={styles.vehiclePill}>
                <Text style={styles.vehicleText}>{bookingDetails?.operatorId?.vehicleDetails?.model || 'VoltRescue EV'}</Text>
              </View>
            </View>
          </View>

          <View style={styles.actionButtons}>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => {
              if (bookingId) {
                navigation.navigate('Chat', { 
                  bookingId, 
                  isOperator: false, 
                  otherPersonName: bookingDetails?.operatorId?.name || 'Operator' 
                });
              }
            }}>
              <Ionicons name="chatbubble" size={20} color="#fff" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.iconCircleBtn} onPress={() => {
              if (bookingDetails?.operatorId?.phone) {
                Linking.openURL(`tel:${bookingDetails.operatorId.phone}`);
              }
            }}>
              <Ionicons name="call" size={20} color="#fff" />
            </TouchableOpacity>
          </View>
        </View>
        
        {/* Actions */}
        <View style={styles.customerActions}>
          <TouchableOpacity style={styles.customerActionBtn}>
            <View style={styles.actionIconBg}>
              <Ionicons name="shield-checkmark" size={24} color={colors.secondaryFixed} />
            </View>
            <Text style={styles.customerActionText}>Safety</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.customerActionBtn}>
            <View style={styles.actionIconBg}>
              <Ionicons name="share-social" size={24} color="#fff" />
            </View>
            <Text style={styles.customerActionText}>Share Trip</Text>
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.customerActionBtn}
            onPress={() => setCancelModalVisible(true)}
          >
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 68, 68, 0.15)' }]}>
              <Ionicons name="close" size={24} color="#ff4444" />
            </View>
            <Text style={[styles.customerActionText, { color: '#ff4444' }]}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      <Modal
        visible={cancelModalVisible}
        transparent
        animationType="slide"
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Cancel Trip</Text>
            <Text style={styles.modalSubtitle}>Please select a reason for cancellation:</Text>
            
            {['Driver is too far', 'Wait time is too long', 'Driver asked me to cancel', 'Changed my mind', 'Other'].map((reason, index) => (
              <TouchableOpacity key={index} style={styles.reasonBtn} onPress={() => handleCancel(reason)}>
                <Text style={styles.reasonText}>{reason}</Text>
              </TouchableOpacity>
            ))}

            <TouchableOpacity style={styles.closeModalBtn} onPress={() => setCancelModalVisible(false)}>
              <Text style={styles.closeModalText}>Keep Booking</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
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
  container: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', padding: 16, paddingTop: Constants.statusBarHeight + 16, zIndex: 10, backgroundColor: 'rgba(19, 19, 19, 0.8)', justifyContent: 'space-between', position: 'absolute', top: 0, left: 0, right: 0 },
  logoRow: { flexDirection: 'row', alignItems: 'center' },
  logoText: { color: colors.primary, fontSize: 20, fontWeight: 'bold' },
  profileImageContainer: { width: 40, height: 40, borderRadius: 20, overflow: 'hidden', borderWidth: 1, borderColor: 'rgba(173, 198, 255, 0.2)', backgroundColor: colors.surfaceContainer },
  profileImage: { width: '100%', height: '100%' },
  mapArea: { flex: 1, position: 'relative', marginTop: Constants.statusBarHeight },
  mapImage: { ...StyleSheet.absoluteFillObject },
  mapGradient: { position: 'absolute', bottom: 0, left: 0, right: 0, height: '50%', backgroundColor: 'rgba(19, 19, 19, 0.6)' },
  userDot: { width: 16, height: 16, backgroundColor: '#fff', borderRadius: 8, borderWidth: 4, borderColor: colors.primary, shadowColor: '#fff', shadowOpacity: 0.6, shadowRadius: 10, elevation: 5 },
  vanLabelContainer: { backgroundColor: colors.secondaryFixed, paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, marginBottom: 4, alignSelf: 'center' },
  vanLabel: { color: colors.onSecondary, fontSize: 10, fontWeight: 'bold' },
  vanIconBg: { width: 32, height: 32, backgroundColor: colors.secondaryFixed, borderRadius: 16, justifyContent: 'center', alignItems: 'center', shadowColor: colors.secondaryFixed, shadowOpacity: 0.4, shadowRadius: 10, alignSelf: 'center' },
  vanIcon: { fontSize: 16 },
  vanPointer: { width: 0, height: 0, backgroundColor: 'transparent', borderStyle: 'solid', borderLeftWidth: 6, borderRightWidth: 6, borderTopWidth: 8, borderLeftColor: 'transparent', borderRightColor: 'transparent', borderTopColor: colors.secondaryFixed, marginTop: -2, alignSelf: 'center' },
  floatingStatus: { position: 'absolute', top: 90, alignSelf: 'center', backgroundColor: 'rgba(28, 27, 27, 0.8)', flexDirection: 'row', alignItems: 'center', paddingHorizontal: 16, paddingVertical: 8, borderRadius: 20, borderWidth: 1, borderColor: 'rgba(173, 198, 255, 0.2)' },
  statusDot: { width: 8, height: 8, backgroundColor: colors.secondaryFixed, borderRadius: 4, marginRight: 8 },
  statusText: { color: colors.onSurface, fontSize: 12, fontWeight: 'bold', letterSpacing: 1 },
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
  ratingBadge: { position: 'absolute', bottom: -8, left: '50%', transform: [{ translateX: -20 }], backgroundColor: '#fff', paddingHorizontal: 8, paddingVertical: 2, borderRadius: 12, shadowColor: '#000', shadowOpacity: 0.3, shadowRadius: 4, elevation: 3 },
  ratingText: { color: '#000', fontSize: 11, fontWeight: 'bold' },
  driverName: { color: '#fff', fontSize: 18, fontWeight: '700', marginBottom: 4 },
  vehiclePill: { backgroundColor: '#2C2C2E', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 6, alignSelf: 'flex-start' },
  vehicleText: { color: '#aaa', fontSize: 12, fontWeight: 'bold', textTransform: 'uppercase' },
  actionButtons: { flexDirection: 'row', gap: 12 },
  iconCircleBtn: { width: 44, height: 44, borderRadius: 22, backgroundColor: '#333', justifyContent: 'center', alignItems: 'center' },
  customerActions: { flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8 },
  customerActionBtn: { alignItems: 'center', gap: 8 },
  actionIconBg: { width: 50, height: 50, borderRadius: 25, backgroundColor: '#2C2C2E', justifyContent: 'center', alignItems: 'center' },
  customerActionText: { color: '#fff', fontSize: 13, fontWeight: '600' },
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.6)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#1C1C1E', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24 },
  modalTitle: { color: '#fff', fontSize: 22, fontWeight: '800', marginBottom: 8 },
  modalSubtitle: { color: '#888', fontSize: 14, marginBottom: 20 },
  reasonBtn: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#333' },
  reasonText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  closeModalBtn: { marginTop: 24, paddingVertical: 16, backgroundColor: '#333', borderRadius: 16, alignItems: 'center' },
  closeModalText: { color: '#fff', fontSize: 16, fontWeight: 'bold' }
});

export default CustomerEnRouteScreen;
