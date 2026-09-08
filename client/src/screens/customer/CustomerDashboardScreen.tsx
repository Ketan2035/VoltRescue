import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Dimensions, Modal, ActivityIndicator, TouchableWithoutFeedback } from 'react-native';
import { Video, ResizeMode } from 'expo-av';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const { width } = Dimensions.get('window');

const CustomerDashboardScreen = ({ navigation }: any) => {
  const [profileVisible, setProfileVisible] = useState(false);
  const [nearbyVans, setNearbyVans] = useState<any[]>([]);
  const [loadingVans, setLoadingVans] = useState(true);
  const [isVideoMuted, setIsVideoMuted] = useState(true);

  useEffect(() => {
    fetchNearbyVans();
  }, []);

  const fetchNearbyVans = async () => {
    try {
      setLoadingVans(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      let lng = -122.406417; // Default fallback
      let lat = 37.785834;
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lng = location.coords.longitude;
        lat = location.coords.latitude;
      }

      const response = await api.get(`/operators/nearby?lng=${lng}&lat=${lat}`);
      if (response.data?.data?.operators) {
        setNearbyVans(response.data.data.operators);
      }
    } catch (error) {
      console.error('Error fetching nearby vans:', error);
    } finally {
      setLoadingVans(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <View style={{ backgroundColor: 'rgba(47,248,1,0.1)', padding: 6, borderRadius: 8, marginRight: 8, borderWidth: 1, borderColor: colors.secondaryContainer }}>
            <Text style={{ fontSize: 14 }}>⚡</Text>
          </View>
          <Text style={styles.headerTitle}>VOLT RESCUE</Text>
        </View>
        <TouchableOpacity style={styles.profileBox} onPress={() => setProfileVisible(true)}>
          <Text style={styles.profileIcon}>👤</Text>
        </TouchableOpacity>
      </View>

      <Modal visible={profileVisible} transparent animationType="fade">
        <TouchableOpacity style={styles.modalOverlay} activeOpacity={1} onPress={() => setProfileVisible(false)}>
          <View style={styles.profileModalContent}>
            <Text style={styles.modalTitle}>Menu</Text>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setProfileVisible(false); navigation.navigate('MyBookings'); }}><Text style={styles.modalItemText}>My Bookings</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setProfileVisible(false); navigation.navigate('PaymentMethods'); }}><Text style={styles.modalItemText}>Payment Methods</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setProfileVisible(false); navigation.navigate('Settings'); }}><Text style={styles.modalItemText}>Settings</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setProfileVisible(false); navigation.navigate('Support'); }}><Text style={styles.modalItemText}>Support & Help</Text></TouchableOpacity>
            <TouchableOpacity style={styles.modalItem} onPress={() => { setProfileVisible(false); navigation.replace('Welcome'); }}><Text style={styles.modalItemText}>Back to Welcome</Text></TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Hero / Emergency Banner */}
        <View style={styles.heroCard}>
          <Image
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCtEZTrUDcljv0zCFvMkdksLchO5RUYzfKGpNG2GsmLWdBE_h4hc5Fl5Uj8vuYmd6NiKeL3lmwtJqjJfW5ksylJTfpS_Xpz6fdYpbJ-zyMPqCPS7ERcBkqvN9imGPezfbOGdQq9rGYDEuu-DqQAGXRpfwT0XleqfzZotpCaJJcQ_2L4o-6y71r5GrgIIwZeD8y8j5ojHxixZ9ywII3EHxRZ9fJv0-kY5VQ_OEadmGLfwFSzj_PB0nNWmeobr0Bc__1cb2TFcIVgBHqJ' }}
            style={styles.heroImage}
          />
          <View style={styles.heroOverlay}>
            <View style={styles.emergencyBadge}>
              <Text style={styles.emergencyBadgeText}>EMERGENCY RESPONSE ACTIVE</Text>
            </View>
            <Text style={styles.heroTitle}>Stranded? We'll bring the charge to you.</Text>
            <Text style={styles.heroSubtitle}>24/7 Mobile rapid charging dispatched in minutes.</Text>

            <TouchableOpacity
              style={styles.primaryButton}
              onPress={() => navigation.navigate('BookingWizard')}
            >
              <Text style={styles.primaryButtonText}>Book Charging Now</Text>
              <Text style={styles.primaryButtonIcon}>⚡</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Nearby Stations / Vans */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Nearby Rescue Vans</Text>
            <TouchableOpacity onPress={() => navigation.navigate('NearbyVans')}>
              <Text style={styles.sectionLink}>See all</Text>
            </TouchableOpacity>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.horizontalScroll}>
            {loadingVans ? (
              <View style={{ width: width - 40, alignItems: 'center', padding: 20 }}>
                <ActivityIndicator color={colors.secondaryContainer} />
              </View>
            ) : nearbyVans.length === 0 ? (
              <View style={{ width: width - 40, alignItems: 'center', padding: 20 }}>
                <Text style={{ color: colors.onSurfaceVariant }}>No rescue vans nearby</Text>
              </View>
            ) : (
              nearbyVans.map((van, index) => {
                const distance = van.dist?.calculated ? (van.dist.calculated / 1609.34).toFixed(1) : (Math.random() * 5 + 0.5).toFixed(1);
                
                return (
                  <View key={van._id || index} style={styles.vanCard}>
                    <View style={styles.vanIconBg}>
                      <Text style={styles.vanIcon}>🚚</Text>
                    </View>
                    <View>
                      <Text style={styles.vanName}>{van.name || `Van #${van._id.substring(0,4)}`}</Text>
                      <Text style={styles.vanDistance}>{distance} miles away</Text>
                    </View>
                    <View style={styles.liveBadge}>
                      <View style={styles.liveDot} />
                      <Text style={styles.liveText}>{van.status === 'ONLINE' ? 'LIVE' : van.status}</Text>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>

        {/* How It Works */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>How It Works</Text>
          <View style={styles.stepsGrid}>
            <View style={styles.stepBox}>
              <Text style={styles.stepIcon}>📍</Text>
              <Text style={styles.stepTitle}>1. Request</Text>
              <Text style={styles.stepDesc}>Pin your location and request a charge.</Text>
            </View>
            <View style={styles.stepBox}>
              <Text style={styles.stepIcon}>🚚</Text>
              <Text style={styles.stepTitle}>2. We Arrive</Text>
              <Text style={styles.stepDesc}>A mobile unit arrives at your location.</Text>
            </View>
            <View style={styles.stepBox}>
              <Text style={styles.stepIcon}>🔋</Text>
              <Text style={styles.stepTitle}>3. Charge</Text>
              <Text style={styles.stepDesc}>We rapidly charge your EV.</Text>
            </View>
            <View style={styles.stepBox}>
              <Text style={styles.stepIcon}>🛣️</Text>
              <Text style={styles.stepTitle}>4. Drive</Text>
              <Text style={styles.stepDesc}>Pay seamlessly and get back on the road.</Text>
            </View>
          </View>
        </View>

        {/* Watch It In Action Video */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Watch It In Action</Text>
          <View style={styles.videoCard}>
            <TouchableWithoutFeedback onPress={() => setIsVideoMuted(!isVideoMuted)}>
              <View style={{ width: '100%', height: '100%' }}>
                <Video
                  source={require('../../../assets/video/VID-20260717-WA0002.mp4')}
                  style={styles.videoPlayer}
                  resizeMode={ResizeMode.COVER}
                  isMuted={isVideoMuted}
                  shouldPlay
                  isLooping
                />
                {!isVideoMuted && (
                  <View style={styles.muteButton}>
                    <Text style={styles.muteButtonText}>🔊</Text>
                  </View>
                )}
              </View>
            </TouchableWithoutFeedback>
          </View>
        </View>

        {/* Service Info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Service Information</Text>
          <View style={styles.infoCard}>
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>🔌</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Universal Compatibility</Text>
                <Text style={styles.infoDesc}>We support CCS1, CCS2, CHAdeMO, and Tesla (NACS) connectors.</Text>
              </View>
            </View>
            <View style={styles.divider} />
            <View style={styles.infoRow}>
              <Text style={styles.infoIcon}>⏱️</Text>
              <View style={styles.infoTextContainer}>
                <Text style={styles.infoTitle}>Ultra-Fast Speeds</Text>
                <Text style={styles.infoDesc}>Our mobile units deliver up to 150kW DC fast charging.</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Support & FAQs */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.supportButton} onPress={() => navigation.navigate('Support')}>
            <Text style={styles.supportIcon}>❓</Text>
            <Text style={styles.supportText}>FAQs & Support</Text>
            <Text style={styles.supportArrow}>→</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(19, 19, 19, 0.95)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    color: colors.primary,
    fontSize: 24,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  profileBox: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  profileIcon: {
    fontSize: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  heroCard: {
    width: '100%',
    height: 400,
    position: 'relative',
  },
  heroImage: {
    ...StyleSheet.absoluteFillObject,
  },
  heroOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.6)',
    padding: 24,
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
  },
  emergencyBadge: {
    backgroundColor: 'rgba(255,180,171,0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,180,171,0.5)',
    marginBottom: 16,
  },
  emergencyBadgeText: {
    color: colors.error,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  heroTitle: {
    color: colors.onSurface,
    fontSize: 32,
    fontWeight: 'bold',
    lineHeight: 40,
    marginBottom: 8,
  },
  heroSubtitle: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    marginBottom: 32,
  },
  primaryButton: {
    backgroundColor: colors.secondaryFixed,
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderRadius: 30,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    justifyContent: 'center',
    shadowColor: colors.secondaryFixed,
    shadowOpacity: 0.3,
    shadowRadius: 10,
  },
  primaryButtonText: {
    color: colors.onSecondaryFixed,
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryButtonIcon: {
    fontSize: 18,
  },
  section: {
    padding: 24,
    paddingBottom: 0,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: 16,
  },
  sectionTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  sectionLink: {
    color: colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 16,
  },
  horizontalScroll: {
    gap: 16,
  },
  vanCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    width: width * 0.75,
  },
  vanIconBg: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(121,255,91,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  vanIcon: {
    fontSize: 24,
  },
  vanName: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: 'bold',
  },
  vanDistance: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    marginTop: 4,
  },
  liveBadge: {
    position: 'absolute',
    top: 16,
    right: 16,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: 'rgba(255,255,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.error,
  },
  liveText: {
    color: colors.onSurface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  stepsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  stepBox: {
    width: (width - 64) / 2,
    backgroundColor: colors.surfaceContainerLow,
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  stepIcon: {
    fontSize: 24,
    marginBottom: 12,
  },
  stepTitle: {
    color: colors.onSurface,
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  stepDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
    lineHeight: 18,
  },
  infoCard: {
    backgroundColor: colors.surfaceContainerLow,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
    padding: 20,
  },
  infoRow: {
    flexDirection: 'row',
    gap: 16,
  },
  infoIcon: {
    fontSize: 24,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoTitle: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  infoDesc: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    lineHeight: 20,
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
    marginVertical: 16,
  },
  supportButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.surfaceContainerHigh,
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  supportIcon: {
    fontSize: 20,
    marginRight: 16,
  },
  supportText: {
    flex: 1,
  },
  supportArrow: {
    color: colors.secondaryContainer,
    fontSize: 20,
    fontWeight: 'bold',
  },
  statValue: { color: colors.secondaryContainer, fontSize: 16, fontWeight: 'bold' },
  statLabel: { color: colors.onSurfaceVariant, fontSize: 12 },
  videoCard: {
    width: '100%',
    height: 200,
    backgroundColor: '#000',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  videoPlayer: {
    width: '100%',
    height: '100%',
  },
  muteButton: {
    position: 'absolute',
    bottom: 12,
    right: 12,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  muteButtonText: {
    fontSize: 18,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.7)',
    justifyContent: 'flex-start',
  },
  menuModalContent: {
    backgroundColor: '#1E1E1E',
    width: 250,
    marginTop: 60,
    marginLeft: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  profileModalContent: {
    backgroundColor: '#1E1E1E',
    width: 200,
    marginTop: 60,
    alignSelf: 'flex-end',
    marginRight: 16,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#333'
  },
  modalTitle: { color: colors.secondaryContainer, fontSize: 16, fontWeight: 'bold', marginBottom: 12, borderBottomWidth: 1, borderBottomColor: '#333', paddingBottom: 8 },
  modalItem: { paddingVertical: 12 },
  modalItemText: { color: '#fff', fontSize: 14 }
});

export default CustomerDashboardScreen;
