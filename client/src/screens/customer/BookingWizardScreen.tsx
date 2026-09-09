import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  ScrollView,
  TextInput,
  KeyboardAvoidingView,
  Platform,
  StatusBar,
  Modal,
  FlatList,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';
import * as Location from 'expo-location';

const VEHICLE_MODELS = [
  'Tata Nexon EV',
  'Tata Punch EV / Tiago EV',
  'MG ZS EV / Windsor EV',
  'Mahindra XUV400',
  'Hyundai Ioniq 5 / Creta EV',
  'BYD Atto 3 / Seal',
  'Kia EV6',
  'BMW / Mercedes-Benz EV',
  'Other 4-Wheeler EV',
];

const CONNECTOR_TYPES = [
  { id: 'CCS2', name: 'CCS2 (Combined Charging System - DC Fast)', icon: 'flash' },
  { id: 'Type 2', name: 'Type 2 (Mennekes Standard)', icon: 'hardware-chip' },
  { id: 'GB/T', name: 'GB/T (Indian Standard)', icon: 'git-network' },
  { id: 'CHAdeMO', name: 'CHAdeMO (Fast DC)', icon: 'battery-charging' },
];

const BookingWizardScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [isLoading, setIsLoading] = useState(false);
  const [userLocation, setUserLocation] = useState<any>(null);

  // Required Form Fields
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [vehicleModel, setVehicleModel] = useState('Tata Nexon EV');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [remarks, setRemarks] = useState('');

  // Dropdown Modal Visibility
  const [isVehicleModalVisible, setIsVehicleModalVisible] = useState(false);
  const [isConnectorModalVisible, setIsConnectorModalVisible] = useState(false);
  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  useEffect(() => {
    fetchLiveLocation();
  }, []);

  const fetchLiveLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({ longitude: -122.4194, latitude: 37.7749 });
        setAddress('Current GPS Location');
        return;
      }
      let location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const coords = { longitude: location.coords.longitude, latitude: location.coords.latitude };
      setUserLocation(coords);

      try {
        let geocode = await Location.reverseGeocodeAsync({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });

        if (geocode && geocode.length > 0) {
          const addr = geocode[0];
          const formattedAddress = [addr.name || addr.street, addr.city, addr.region]
            .filter(Boolean)
            .join(', ');
          setAddress(formattedAddress || 'Current GPS Location');
        } else {
          setAddress('Current GPS Location');
        }
      } catch {
        setAddress('Current GPS Location');
      }
    } catch (error) {
      console.error('Error fetching GPS:', error);
      setUserLocation({ longitude: -122.4194, latitude: 37.7749 });
      setAddress('Current GPS Location');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleRequestRescue = async () => {
    if (!name.trim()) {
      alert('Please enter your name.');
      return;
    }
    if (!phone.trim() || phone.trim().length < 8) {
      alert('Please enter a valid mobile phone number.');
      return;
    }

    setIsLoading(true);
    try {
      const coords = userLocation ? [userLocation.longitude, userLocation.latitude] : [-122.4194, 37.7749];

      const payload = {
        date: new Date().toISOString().split('T')[0],
        timeSlot: { start: 'NOW', end: 'IMMEDIATE' },
        userLocation: {
          coordinates: coords,
          address: address.trim() || 'Current Roadside Location',
        },
        personalInfo: {
          name: name.trim(),
          phone: phone.trim(),
        },
        vehicleModel: vehicleModel,
        connectorType: connectorType,
        chargingType: 'DC Fast',
        remarks: remarks.trim() || undefined,
        batteryPercentage: { current: 10, target: 100 },
        requestedEnergyKWh: 25,
        estimatedDuration: 30,
        travelDistance: 4.5,
        paymentMethod: 'Cash', // Default placeholder; settled post-charge
      };

      const response = await api.post('/bookings', payload);
      const booking = response.data.data.booking;

      navigation.navigate('Waiting', { bookingId: booking._id });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to submit rescue request. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Emergency Rescue Request</Text>
          <Text style={styles.headerSub}>Instant Mobile Charging Dispatch</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 80 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Card 1: Contact & Location */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="person" size={16} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>Customer & Breakdown Location</Text>
            </View>

            {/* Name */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>YOUR FULL NAME *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="person-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={name}
                  onChangeText={setName}
                  placeholder="e.g. Rahul Sharma"
                  placeholderTextColor="#94A3B8"
                />
              </View>
            </View>

            {/* Mobile Number */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>MOBILE PHONE NUMBER *</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="call-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={phone}
                  onChangeText={setPhone}
                  placeholder="+91 98765 43210"
                  placeholderTextColor="#94A3B8"
                  keyboardType="phone-pad"
                />
              </View>
            </View>

            {/* Current Location */}
            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>BREAKDOWN LOCATION *</Text>
                <TouchableOpacity
                  style={styles.refreshGpsBtn}
                  onPress={fetchLiveLocation}
                  disabled={isFetchingLocation}
                  activeOpacity={0.7}
                >
                  {isFetchingLocation ? (
                    <ActivityIndicator size="small" color="#059669" />
                  ) : (
                    <>
                      <Ionicons name="navigate-outline" size={13} color="#059669" />
                      <Text style={styles.refreshGpsText}>Refresh GPS</Text>
                    </>
                  )}
                </TouchableOpacity>
              </View>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', minHeight: 52 }]}>
                <Ionicons name="location-sharp" size={18} color="#059669" style={[styles.inputIcon, { marginTop: 14 }]} />
                <TextInput
                  style={[styles.input, { paddingTop: 12, paddingBottom: 12 }]}
                  value={address}
                  onChangeText={setAddress}
                  placeholder="Auto-detecting your breakdown coordinates..."
                  placeholderTextColor="#94A3B8"
                  multiline
                />
              </View>
            </View>
          </View>

          {/* Card 2: Vehicle & Connector Specifications */}
          <View style={styles.sectionCard}>
            <View style={styles.sectionHeaderRow}>
              <View style={styles.sectionIconBg}>
                <Ionicons name="car-sport" size={16} color="#059669" />
              </View>
              <Text style={styles.sectionTitle}>EV Specifications</Text>
            </View>

            {/* Vehicle Model Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>VEHICLE MODEL / TYPE *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsVehicleModalVisible(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="car-outline" size={18} color="#64748B" style={styles.inputIcon} />
                <Text style={styles.dropdownText}>{vehicleModel}</Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Connector Type Selector */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>CONNECTOR TYPE *</Text>
              <TouchableOpacity
                style={styles.dropdownSelector}
                onPress={() => setIsConnectorModalVisible(true)}
                activeOpacity={0.75}
              >
                <Ionicons name="flash-outline" size={18} color="#059669" style={styles.inputIcon} />
                <Text style={styles.dropdownText}>{connectorType}</Text>
                <Ionicons name="chevron-down" size={18} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            {/* Any Problem / Remarks */}
            <View style={styles.inputGroup}>
              <Text style={styles.label}>ANY PROBLEM / REMARK (OPTIONAL)</Text>
              <View style={[styles.inputWrapper, { alignItems: 'flex-start', minHeight: 70 }]}>
                <Ionicons name="chatbox-ellipses-outline" size={18} color="#64748B" style={[styles.inputIcon, { marginTop: 12 }]} />
                <TextInput
                  style={[styles.input, { paddingTop: 10, paddingBottom: 10 }]}
                  value={remarks}
                  onChangeText={setRemarks}
                  placeholder="e.g. Battery dead on highway shoulder, hazard lights on"
                  placeholderTextColor="#94A3B8"
                  multiline
                  numberOfLines={2}
                />
              </View>
            </View>
          </View>

          {/* Card 3: Transparent Pricing Overview (No Payment Method Selection) */}
          <View style={styles.pricingCard}>
            <View style={styles.pricingHeader}>
              <View style={styles.pricingIconBox}>
                <Ionicons name="receipt-outline" size={16} color="#059669" />
              </View>
              <Text style={styles.pricingTitle}>Transparent Pricing Structure</Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>Base Rescue & Dispatch Charge</Text>
              <Text style={styles.pricingValue}>₹299.00</Text>
            </View>

            <View style={styles.pricingRow}>
              <Text style={styles.pricingLabel}>High-Speed Energy Rate (DC Fast)</Text>
              <Text style={styles.pricingValue}>₹24.00 <Text style={styles.perUnit}>/ kWh</Text></Text>
            </View>

            <View style={styles.pricingDivider} />

            <View style={styles.pricingNotice}>
              <Ionicons name="information-circle-outline" size={16} color="#059669" style={{ marginTop: 1 }} />
              <Text style={styles.pricingNoticeText}>
                No advance payment needed. Exact energy delivered is metered live, and payment is settled directly with the rescue technician via UPI QR or Cash after charging.
              </Text>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Floating Bottom Confirmation Bar */}
      <View style={[styles.bottomBar, { paddingBottom: Math.max(insets.bottom, 16) }]}>
        <TouchableOpacity
          style={styles.confirmButton}
          onPress={handleRequestRescue}
          disabled={isLoading}
          activeOpacity={0.88}
        >
          {isLoading ? (
            <ActivityIndicator color="#FFFFFF" size="small" />
          ) : (
            <View style={styles.confirmBtnContent}>
              <Ionicons name="flash" size={18} color="#FFFFFF" />
              <Text style={styles.confirmBtnText}>CONFIRM RESCUE REQUEST</Text>
              <Ionicons name="arrow-forward" size={18} color="#FFFFFF" />
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Vehicle Model Selector Modal */}
      <Modal
        visible={isVehicleModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsVehicleModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsVehicleModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Vehicle Model / Type</Text>
              <TouchableOpacity onPress={() => setIsVehicleModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={VEHICLE_MODELS}
              keyExtractor={(item) => item}
              renderItem={({ item }) => {
                const isSelected = vehicleModel === item;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setVehicleModel(item);
                      setIsVehicleModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalItemLeft}>
                      <Ionicons
                        name="car-sport"
                        size={18}
                        color={isSelected ? '#059669' : '#64748B'}
                      />
                      <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                        {item}
                      </Text>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#059669" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Connector Type Selector Modal */}
      <Modal
        visible={isConnectorModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsConnectorModalVisible(false)}
      >
        <TouchableOpacity
          style={styles.modalBackdrop}
          activeOpacity={1}
          onPress={() => setIsConnectorModalVisible(false)}
        >
          <View style={styles.modalSheet} onStartShouldSetResponder={() => true}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Connector Type</Text>
              <TouchableOpacity onPress={() => setIsConnectorModalVisible(false)}>
                <Ionicons name="close-circle" size={24} color="#94A3B8" />
              </TouchableOpacity>
            </View>

            <FlatList
              data={CONNECTOR_TYPES}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => {
                const isSelected = connectorType === item.id;
                return (
                  <TouchableOpacity
                    style={[styles.modalItem, isSelected && styles.modalItemSelected]}
                    onPress={() => {
                      setConnectorType(item.id);
                      setIsConnectorModalVisible(false);
                    }}
                    activeOpacity={0.7}
                  >
                    <View style={styles.modalItemLeft}>
                      <Ionicons
                        name={item.icon as any}
                        size={18}
                        color={isSelected ? '#059669' : '#64748B'}
                      />
                      <View>
                        <Text style={[styles.modalItemText, isSelected && styles.modalItemTextSelected]}>
                          {item.id}
                        </Text>
                        <Text style={styles.modalItemSub}>{item.name}</Text>
                      </View>
                    </View>
                    {isSelected && <Ionicons name="checkmark-circle" size={20} color="#059669" />}
                  </TouchableOpacity>
                );
              }}
            />
          </View>
        </TouchableOpacity>
      </Modal>
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
  headerCenter: {
    alignItems: 'center',
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  headerSub: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
    marginTop: 1,
  },
  scrollContent: {
    padding: 16,
    gap: 16,
  },
  sectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  sectionIconBg: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: -0.2,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    color: '#475569',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  refreshGpsBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  refreshGpsText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '700',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    minHeight: 52,
  },
  inputIcon: {
    marginRight: 10,
  },
  input: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  dropdownSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderRadius: 14,
    paddingHorizontal: 14,
    height: 52,
  },
  dropdownText: {
    flex: 1,
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  pricingCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  pricingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 4,
  },
  pricingIconBox: {
    width: 28,
    height: 28,
    borderRadius: 8,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pricingTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  pricingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 4,
  },
  pricingLabel: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '500',
  },
  pricingValue: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  perUnit: {
    fontSize: 12,
    color: '#64748B',
    fontWeight: '600',
  },
  pricingDivider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 4,
  },
  pricingNotice: {
    flexDirection: 'row',
    gap: 8,
    backgroundColor: '#ECFDF5',
    borderRadius: 12,
    padding: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  pricingNoticeText: {
    color: '#065F46',
    fontSize: 11,
    lineHeight: 16,
    fontWeight: '600',
    flex: 1,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 8,
  },
  confirmButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  confirmBtnContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmBtnText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '900',
    letterSpacing: 0.6,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(15, 23, 42, 0.6)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '800',
    color: '#0F172A',
  },
  modalItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 14,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 4,
  },
  modalItemSelected: {
    backgroundColor: '#ECFDF5',
  },
  modalItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  modalItemText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#334155',
  },
  modalItemTextSelected: {
    color: '#059669',
    fontWeight: '800',
  },
  modalItemSub: {
    fontSize: 11,
    color: '#64748B',
    marginTop: 2,
  },
});

export default BookingWizardScreen;
