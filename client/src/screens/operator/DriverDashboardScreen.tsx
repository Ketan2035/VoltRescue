import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Switch, Animated, Platform, StatusBar, Modal, Alert } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import * as Location from 'expo-location';
import { Audio } from 'expo-av';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import { useSocket } from '../../contexts/SocketContext';
import storage from '../../services/storage';
import { useProfile } from '../../contexts/ProfileContext';

const DriverDashboardScreen = ({ navigation }: any) => {
  const [isOnline, setIsOnline] = useState(true);
  const [isMenuVisible, setIsMenuVisible] = useState(false);
  
  // Real stats state
  const [todaysEarnings, setTodaysEarnings] = useState(0);
  const [completedJobs, setCompletedJobs] = useState(0);
  
  // Location state
  const [currentLocation, setCurrentLocation] = useState<Location.LocationObject | null>(null);
  const [sound, setSound] = useState<Audio.Sound | null>(null);

  const { socket } = useSocket();
  const { name, profilePicture } = useProfile();

  useEffect(() => {
    if (!socket) return;

    socket.on('new_booking_request', (data: any) => {
      navigation.navigate('IncomingRequests', { request: data });
    });

    socket.on('booking_assigned', (data: any) => {
      // the operator is already in IncomingRequests screen, it could listen there, or we can just ignore it here.
    });

    return () => {
      socket.off('new_booking_request');
      socket.off('booking_assigned');
    };
  }, [socket]);

  useEffect(() => {
    const syncStatus = async () => {
      try {
        await api.patch('/operators/status', {
          status: 'ONLINE',
          coordinates: [-122.4194, 37.7749]
        });
      } catch (error) {
        console.error('Error syncing initial status:', error);
      }
    };
    
    const fetchStats = async () => {
      try {
        const res = await api.get('/bookings/operator');
        const bookings = res.data.data.bookings || [];
        
        // Calculate completed jobs
        const completed = bookings.filter((b: any) => b.status === 'COMPLETED');
        setCompletedJobs(completed.length);
        
        // Calculate today's earnings
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        
        const earnings = completed
          .filter((b: any) => new Date(b.date) >= today)
          .reduce((sum: number, b: any) => sum + (b.pricing?.totalAmount || 0), 0);
          
        setTodaysEarnings(earnings);
      } catch (error) {
        console.log('Failed to fetch bookings stats:', error);
      }
    };

    const fetchLocation = async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert('Permission denied', 'Allow location access to receive dispatch requests.');
        return;
      }
      let loc = await Location.getCurrentPositionAsync({});
      setCurrentLocation(loc);
    };

    syncStatus();
    fetchStats();
    fetchLocation();
  }, []);

  // (Removed internal ring logic since it is now handled by IncomingRequestsScreen)

  const handleToggleOnline = async (value: boolean) => {
    setIsOnline(value);
    try {
      await api.patch('/operators/status', {
        status: value ? 'ONLINE' : 'OFFLINE',
        coordinates: [-122.4194, 37.7749]
      });
    } catch (error) {
      console.error('Error updating status:', error);
    }
  };
  // handleAcceptRequest logic moved to IncomingRequestsScreen

  const handleLogout = async () => {
    setIsMenuVisible(false);
    await storage.deleteItem('operatorToken');
    // Disconnect socket or update status if needed
    navigation.reset({
      index: 0,
      routes: [{ name: 'Welcome' }],
    });
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.headerLeft} onPress={() => setIsMenuVisible(true)}>
          <View style={styles.avatarContainer}>
            <Image
              source={{ uri: profilePicture }}
              style={styles.avatar}
            />
            <View style={[styles.onlineDot, !isOnline && styles.offlineDot]} />
          </View>
          <View>
            <Text style={styles.greeting}>Welcome back,</Text>
            <Text style={styles.logoText}>{name}</Text>
          </View>
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.iconButton}
          onPress={() => Alert.alert('Notifications', 'You have no new notifications.')}
        >
          <Ionicons name="notifications-outline" size={24} color="#fff" />
          <View style={styles.notificationBadge} />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Massive Status Card */}
        <TouchableOpacity 
          style={[styles.statusCard, isOnline && styles.statusCardOnline]} 
          activeOpacity={0.9}
          onPress={() => handleToggleOnline(!isOnline)}
        >
          <View style={styles.statusLeft}>
            <View style={[styles.statusIconContainer, !isOnline && styles.statusIconContainerOffline]}>
              <Ionicons name={isOnline ? "flash" : "flash-off"} size={32} color={isOnline ? colors.secondaryContainer : "#666"} />
            </View>
            <View>
              <Text style={styles.statusTitle}>
                {isOnline ? 'You are Online' : 'You are Offline'}
              </Text>
              <Text style={styles.statusSubtitle}>
                {isOnline ? 'Receiving dispatch requests...' : 'Tap to go online and receive jobs'}
              </Text>
            </View>
          </View>
          <View style={[styles.toggleTrack, isOnline && styles.toggleTrackActive]}>
            <View style={[styles.toggleThumb, isOnline && styles.toggleThumbActive]} />
          </View>
        </TouchableOpacity>

        {/* Metrics Grid */}
        <Text style={styles.sectionTitle}>Overview</Text>
        <View style={styles.grid}>
          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <View style={styles.gridIconBg}>
                <Ionicons name="wallet-outline" size={20} color={colors.secondaryContainer} />
              </View>
              <Text style={styles.gridLabel}>TODAY'S EARNINGS</Text>
            </View>
            <Text style={styles.gridValue}>₹{todaysEarnings.toFixed(2)}</Text>
            <Text style={styles.gridSubText}>
              <Ionicons name="trending-up" size={12} color={colors.secondaryContainer} /> Real-time
            </Text>
          </View>

          <View style={styles.gridCard}>
            <View style={styles.gridHeader}>
              <View style={[styles.gridIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
                <Ionicons name="checkmark-circle-outline" size={20} color="#3B82F6" />
              </View>
              <Text style={styles.gridLabel}>COMPLETED</Text>
            </View>
            <View style={styles.gridValueRow}>
              <Text style={styles.gridValue}>{completedJobs < 10 ? `0${completedJobs}` : completedJobs}</Text>
              <Text style={styles.gridUnit}>Jobs</Text>
            </View>
            <View style={styles.progressBar}>
              <View style={[styles.progressFill, { width: '40%', backgroundColor: '#3B82F6' }]} />
            </View>
          </View>
        </View>

        {/* Performance Metrics */}
        <Text style={styles.sectionTitle}>Performance</Text>
        <View style={styles.performanceRow}>
          <View style={styles.perfCard}>
            <Ionicons name="star" size={24} color="#FFD700" />
            <Text style={styles.perfValue}>4.9</Text>
            <Text style={styles.perfLabel}>Rating</Text>
          </View>
          <View style={styles.perfCard}>
            <Ionicons name="checkmark-done-circle" size={24} color={colors.secondaryContainer} />
            <Text style={styles.perfValue}>98%</Text>
            <Text style={styles.perfLabel}>Acceptance</Text>
          </View>
          <View style={styles.perfCard}>
            <Ionicons name="time" size={24} color="#3B82F6" />
            <Text style={styles.perfValue}>4h 12m</Text>
            <Text style={styles.perfLabel}>Online Time</Text>
          </View>
        </View>

        {/* Map Preview or Recent Activity */}
        <Text style={styles.sectionTitle}>Live Location</Text>
        <View style={styles.mapPreviewCard}>
          {currentLocation ? (
            <MapView
              provider={PROVIDER_GOOGLE}
              style={styles.mapPreviewImage}
              initialRegion={{
                latitude: currentLocation.coords.latitude,
                longitude: currentLocation.coords.longitude,
                latitudeDelta: 0.02,
                longitudeDelta: 0.02,
              }}
              customMapStyle={mapStyle}
              showsUserLocation={false}
            >
              <Marker
                coordinate={{
                  latitude: currentLocation.coords.latitude,
                  longitude: currentLocation.coords.longitude,
                }}
              >
                <View style={styles.driverMarker}>
                  <Text style={styles.driverMarkerText}>🚚</Text>
                </View>
              </Marker>
            </MapView>
          ) : (
            <View style={[styles.mapPreviewImage, { justifyContent: 'center', alignItems: 'center', backgroundColor: '#1A1A1A' }]}>
              <Ionicons name="map-outline" size={32} color="#666" />
              <Text style={{ color: '#666', marginTop: 8 }}>Locating...</Text>
            </View>
          )}
          <View style={styles.mapOverlay}>
            <View style={styles.hotspotBadge}>
              <Ionicons name="radio" size={16} color={colors.secondaryContainer} />
              <Text style={[styles.hotspotText, { color: colors.secondaryContainer }]}>GPS Active • Ready</Text>
            </View>
          </View>
        </View>

        {/* Quick Actions */}
        <Text style={styles.sectionTitle}>Quick Actions</Text>
        <View style={styles.quickActionsRow}>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(255, 149, 0, 0.1)' }]}>
              <Ionicons name="cafe-outline" size={24} color="#FF9500" />
            </View>
            <Text style={styles.actionBtnText}>Take Break</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(59, 130, 246, 0.1)' }]}>
              <Ionicons name="headset-outline" size={24} color="#3B82F6" />
            </View>
            <Text style={styles.actionBtnText}>Dispatch</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.actionBtn}>
            <View style={[styles.actionIconBg, { backgroundColor: 'rgba(47, 248, 1, 0.1)' }]}>
              <Ionicons name="battery-charging-outline" size={24} color={colors.secondaryContainer} />
            </View>
            <Text style={styles.actionBtnText}>Hub Route</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* Removed Active Request Overlay, now navigates to IncomingRequestsScreen */}

      {/* Profile Menu Modal */}
      <Modal
        visible={isMenuVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuVisible(false)}
      >
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setIsMenuVisible(false)}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Operator Menu</Text>
              <TouchableOpacity onPress={() => setIsMenuVisible(false)}>
                <Ionicons name="close" size={24} color="#888" />
              </TouchableOpacity>
            </View>

            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverProfile');
              }}
            >
              <Ionicons name="person-outline" size={20} color="#fff" />
              <Text style={styles.modalItemText}>Edit Profile</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverJobHistory');
              }}
            >
              <Ionicons name="time-outline" size={20} color="#fff" />
              <Text style={styles.modalItemText}>Job History</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverVehicle');
              }}
            >
              <Ionicons name="car-sport-outline" size={20} color="#fff" />
              <Text style={styles.modalItemText}>Vehicle Diagnostics</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('DriverPreferences');
              }}
            >
              <Ionicons name="settings-outline" size={20} color="#fff" />
              <Text style={styles.modalItemText}>Preferences</Text>
            </TouchableOpacity>

            <TouchableOpacity 
              style={styles.modalItem}
              onPress={() => {
                setIsMenuVisible(false);
                navigation.navigate('Support');
              }}
            >
              <Ionicons name="help-buoy-outline" size={20} color="#fff" />
              <Text style={styles.modalItemText}>Help & Support</Text>
            </TouchableOpacity>

            <View style={styles.modalDivider} />

            <TouchableOpacity style={styles.modalItem} onPress={handleLogout}>
              <Ionicons name="log-out-outline" size={20} color="#FF3B30" />
              <Text style={[styles.modalItemText, { color: '#FF3B30' }]}>Sign Out</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#121212',
    paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
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
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 2,
    borderColor: '#333',
  },
  onlineDot: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: colors.secondaryContainer,
    borderWidth: 2,
    borderColor: '#1A1A1A',
  },
  offlineDot: {
    backgroundColor: '#666',
  },
  greeting: {
    color: '#888',
    fontSize: 12,
  },
  logoText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 0.5,
  },
  iconButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  notificationBadge: {
    position: 'absolute',
    top: 10,
    right: 12,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FF3B30',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#333',
  },
  statusCardOnline: {
    borderColor: 'rgba(47,248,1,0.3)',
    backgroundColor: 'rgba(47,248,1,0.03)',
  },
  statusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  statusIconContainer: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(47,248,1,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  statusIconContainerOffline: {
    backgroundColor: '#2A2A2A',
  },
  statusTitle: {
    color: '#fff',
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statusSubtitle: {
    color: '#888',
    fontSize: 13,
  },
  toggleTrack: {
    width: 56,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#333',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  toggleTrackActive: {
    backgroundColor: 'rgba(47,248,1,0.3)',
  },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#888',
  },
  toggleThumbActive: {
    backgroundColor: colors.secondaryContainer,
    transform: [{ translateX: 24 }],
  },
  sectionTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 16,
  },
  grid: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 24,
  },
  gridCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  gridHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  gridIconBg: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: 'rgba(47,248,1,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gridLabel: {
    color: '#888',
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  gridValue: {
    color: '#fff',
    fontSize: 28,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  gridValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 4,
    marginBottom: 8,
  },
  gridUnit: {
    color: '#888',
    fontSize: 14,
  },
  gridSubText: {
    color: colors.secondaryContainer,
    fontSize: 12,
    fontWeight: '500',
  },
  progressBar: {
    height: 6,
    backgroundColor: '#333',
    borderRadius: 3,
    marginTop: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 3,
  },
  mapPreviewCard: {
    width: '100%',
    height: 180,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#333',
  },
  mapPreviewImage: {
    width: '100%',
    height: '100%',
  },
  mapOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.2)',
    justifyContent: 'flex-end',
    padding: 16,
  },
  hotspotBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(26,26,26,0.9)',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: 'rgba(255,69,0,0.5)',
  },
  hotspotText: {
    color: '#FF4500',
    fontSize: 12,
    fontWeight: '600',
  },
  driverMarker: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#1E1E1E',
    borderWidth: 2,
    borderColor: colors.secondaryContainer,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 10,
    elevation: 8,
  },
  driverMarkerText: {
    fontSize: 16,
  },
  performanceRow: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 32,
  },
  perfCard: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  perfValue: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
    marginBottom: 4,
  },
  perfLabel: {
    color: '#888',
    fontSize: 10,
    textTransform: 'uppercase',
  },
  quickActionsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
    marginBottom: 20,
  },
  actionBtn: {
    flex: 1,
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#333',
  },
  actionIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  requestOverlay: {
    position: 'absolute',
    top: 0, left: 0, right: 0, bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    zIndex: 1000,
  },
  requestCard: {
    width: '100%',
    backgroundColor: '#1A1A1A',
    borderRadius: 24,
    padding: 24,
    borderWidth: 2,
    borderColor: colors.secondaryContainer,
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.5,
    shadowRadius: 20,
    elevation: 10,
  },
  pulseRing: {
    position: 'absolute',
    top: -2, left: -2, right: -2, bottom: -2,
    borderRadius: 26,
    borderWidth: 1,
    borderColor: colors.secondaryContainer,
    opacity: 0.5,
  },
  requestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    marginBottom: 24,
  },
  requestIconBg: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255,59,48,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  requestTitleBox: {
    flex: 1,
  },
  requestTitle: {
    color: '#fff',
    fontSize: 24,
    fontWeight: '900',
    letterSpacing: 1,
    marginBottom: 4,
  },
  requestTime: {
    color: '#FF3B30',
    fontSize: 14,
    fontWeight: 'bold',
  },
  requestDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#121212',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  requestStat: {
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  requestStatDivider: {
    width: 1,
    height: '100%',
    backgroundColor: '#333',
  },
  requestStatValue: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  requestStatLabel: {
    color: '#888',
    fontSize: 12,
  },
  requestLocationBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: 'rgba(47,248,1,0.05)',
    padding: 16,
    borderRadius: 12,
    marginBottom: 24,
  },
  requestLocationText: {
    color: colors.secondaryContainer,
    fontSize: 14,
    fontWeight: '500',
    flex: 1,
  },
  requestActions: {
    flexDirection: 'row',
    gap: 12,
  },
  declineButton: {
    flex: 1,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  acceptButton: {
    flex: 2,
    flexDirection: 'row',
    gap: 8,
    paddingVertical: 16,
    borderRadius: 16,
    backgroundColor: colors.secondaryContainer,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButtonText: {
    color: '#000',
    fontSize: 18,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'flex-start',
    paddingTop: 80,
    paddingHorizontal: 20,
  },
  modalContent: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  modalTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
  },
  modalItemText: {
    color: '#fff',
    fontSize: 16,
  },
  modalDivider: {
    height: 1,
    backgroundColor: '#333',
    marginVertical: 8,
  },
});

const mapStyle = [
  {
    "elementType": "geometry",
    "stylers": [{"color": "#212121"}]
  },
  {
    "elementType": "labels.icon",
    "stylers": [{"visibility": "off"}]
  },
  {
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#212121"}]
  },
  {
    "featureType": "administrative",
    "elementType": "geometry",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "administrative.country",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#9e9e9e"}]
  },
  {
    "featureType": "administrative.land_parcel",
    "stylers": [{"visibility": "off"}]
  },
  {
    "featureType": "administrative.locality",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#bdbdbd"}]
  },
  {
    "featureType": "poi",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "geometry",
    "stylers": [{"color": "#181818"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "poi.park",
    "elementType": "labels.text.stroke",
    "stylers": [{"color": "#1b1b1b"}]
  },
  {
    "featureType": "road",
    "elementType": "geometry.fill",
    "stylers": [{"color": "#2c2c2c"}]
  },
  {
    "featureType": "road",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#8a8a8a"}]
  },
  {
    "featureType": "road.arterial",
    "elementType": "geometry",
    "stylers": [{"color": "#373737"}]
  },
  {
    "featureType": "road.highway",
    "elementType": "geometry",
    "stylers": [{"color": "#3c3c3c"}]
  },
  {
    "featureType": "road.highway.controlled_access",
    "elementType": "geometry",
    "stylers": [{"color": "#4e4e4e"}]
  },
  {
    "featureType": "road.local",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#616161"}]
  },
  {
    "featureType": "transit",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#757575"}]
  },
  {
    "featureType": "water",
    "elementType": "geometry",
    "stylers": [{"color": "#000000"}]
  },
  {
    "featureType": "water",
    "elementType": "labels.text.fill",
    "stylers": [{"color": "#3d3d3d"}]
  }
];

export default DriverDashboardScreen;
