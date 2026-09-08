import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView, TextInput, KeyboardAvoidingView, Platform, StatusBar } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';
import * as Location from 'expo-location';

const BookingWizardScreen = ({ navigation }: any) => {
  const [step, setStep] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const [userLocation, setUserLocation] = useState<any>(null);

  // Form Data
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [isPhoneVerified, setIsPhoneVerified] = useState(false);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [timeSlot, setTimeSlot] = useState({ start: '10:00', end: '11:00' });
  const [address, setAddress] = useState('');
  const [addressDetails, setAddressDetails] = useState('');
  const [connectorType, setConnectorType] = useState('CCS2');
  const [chargingType, setChargingType] = useState('Fast');
  const [batteryPercentage, setBatteryPercentage] = useState('20');
  const [requestedEnergyKWh, setRequestedEnergyKWh] = useState('30');
  const [paymentMethod, setPaymentMethod] = useState('Online');

  useEffect(() => {
    (async () => {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        setUserLocation({ longitude: -122.4194, latitude: 37.7749 });
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ longitude: location.coords.longitude, latitude: location.coords.latitude });
    })();
  }, []);

  const [isFetchingLocation, setIsFetchingLocation] = useState(false);

  const fetchLiveLocation = async () => {
    setIsFetchingLocation(true);
    try {
      let { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== 'granted') {
        alert('Permission to access location was denied');
        return;
      }
      let location = await Location.getCurrentPositionAsync({});
      setUserLocation({ longitude: location.coords.longitude, latitude: location.coords.latitude });

      let geocode = await Location.reverseGeocodeAsync({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude
      });

      if (geocode && geocode.length > 0) {
        const addr = geocode[0];
        const formattedAddress = `${addr.name ? addr.name + ', ' : ''}${addr.street ? addr.street + ', ' : ''}${addr.city ? addr.city : ''}`;
        setAddress(formattedAddress);
      }
    } catch (error) {
      console.error(error);
      alert('Failed to fetch location');
    } finally {
      setIsFetchingLocation(false);
    }
  };

  const handleNext = () => setStep(prev => prev + 1);
  const handleBack = () => setStep(prev => prev - 1);

  const handleRequestCharge = async () => {
    setIsLoading(true);
    try {
      const coords = userLocation ? [userLocation.longitude, userLocation.latitude] : [-122.4194, 37.7749];

      const payload = {
        date,
        timeSlot,
        userLocation: {
          coordinates: coords,
          address: address ? `${address}${addressDetails ? ', ' + addressDetails : ''}` : "Current Location",
        },
        personalInfo: { name, phone },
        connectorType,
        chargingType,
        batteryPercentage: {
          current: parseInt(batteryPercentage) || 20,
          target: 100
        },
        requestedEnergyKWh: parseInt(requestedEnergyKWh) || 30,
        estimatedDuration: 45,
        travelDistance: 5, // mock distance
        paymentMethod
      };

      const response = await api.post('/bookings', payload);
      const booking = response.data.data.booking;

      navigation.navigate('Waiting', { bookingId: booking._id });
    } catch (error) {
      console.error('Error creating booking:', error);
      alert('Failed to create booking. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const StepIndicator = () => (
    <View style={styles.progressContainer}>
      {[1, 2, 3].map((item, index) => (
        <React.Fragment key={item}>
          <View style={[styles.stepCircle, step >= item && styles.stepCircleActive]}>
            {step > item ? (
              <Ionicons name="checkmark" size={16} color={colors.secondaryContainer} />
            ) : (
              <Text style={[styles.stepNumber, step >= item && styles.stepNumberActive]}>{item}</Text>
            )}
          </View>
          {index < 2 && (
            <View style={[styles.progressLine, step > item && styles.progressLineActive]} />
          )}
        </React.Fragment>
      ))}
    </View>
  );

  const renderStep1 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Personal Info & Vehicle</Text>
      <Text style={styles.stepSubtitle}>Provide your details and vehicle requirements</Text>

      <View style={styles.card}>
        <View style={styles.inputGroup}>
          <Text style={styles.label}>FULL NAME</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="person-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              value={name}
              onChangeText={setName}
              placeholder="e.g. Jane Doe"
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>
        </View>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>PHONE NUMBER</Text>
          <View style={styles.phoneRow}>
            <View style={[styles.inputWrapper, { flex: 1 }]}>
              <Ionicons name="call-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={phone}
                onChangeText={(text) => {
                  setPhone(text);
                  setIsPhoneVerified(false);
                  setShowOtpInput(false);
                }}
                keyboardType="phone-pad"
                placeholder="10-digit number"
                placeholderTextColor={colors.onSurfaceVariant}
                editable={!isPhoneVerified}
              />
            </View>
            {!isPhoneVerified && !showOtpInput && (
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => {
                  if (phone.length >= 10) setShowOtpInput(true);
                  else alert('Enter a valid phone number');
                }}
              >
                <Text style={styles.verifyBtnText}>VERIFY</Text>
              </TouchableOpacity>
            )}
            {isPhoneVerified && (
              <View style={styles.verifiedBadge}>
                <Ionicons name="checkmark-circle" size={16} color={colors.secondaryContainer} />
                <Text style={styles.verifiedText}>VERIFIED</Text>
              </View>
            )}
          </View>
        </View>

        {showOtpInput && !isPhoneVerified && (
          <View style={[styles.inputGroup, styles.otpContainer]}>
            <Text style={styles.label}>ENTER OTP (USE 1234)</Text>
            <View style={styles.phoneRow}>
              <View style={[styles.inputWrapper, { flex: 1 }]}>
                <Ionicons name="key-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
                <TextInput
                  style={styles.input}
                  value={otpCode}
                  onChangeText={setOtpCode}
                  keyboardType="number-pad"
                  placeholder="Enter OTP"
                  placeholderTextColor={colors.onSurfaceVariant}
                />
              </View>
              <TouchableOpacity
                style={styles.verifyBtn}
                onPress={() => {
                  if (otpCode === '1234') {
                    setIsPhoneVerified(true);
                    setShowOtpInput(false);
                  } else {
                    alert('Invalid OTP');
                  }
                }}
              >
                <Text style={styles.verifyBtnText}>SUBMIT</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <View style={styles.card}>
        <Text style={styles.label}>CONNECTOR TYPE</Text>
        <View style={styles.chipRow}>
          {['CCS2', 'CHAdeMO', 'Type2'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, connectorType === type && styles.chipActive]}
              onPress={() => setConnectorType(type)}
            >
              <Text style={[styles.chipText, connectorType === type && styles.chipTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={[styles.label, { marginTop: 24 }]}>CHARGING TYPE</Text>
        <View style={styles.chipRow}>
          {['Fast', 'Slow'].map(type => (
            <TouchableOpacity
              key={type}
              style={[styles.chip, chargingType === type && styles.chipActive]}
              onPress={() => setChargingType(type)}
            >
              <Text style={[styles.chipText, chargingType === type && styles.chipTextActive]}>{type}</Text>
            </TouchableOpacity>
          ))}
        </View>

        <View style={[styles.row, { marginTop: 24 }]}>
          <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
            <Text style={styles.label}>CURRENT BATTERY %</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="battery-half-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={batteryPercentage}
                onChangeText={setBatteryPercentage}
                keyboardType="numeric"
                placeholder="20"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>
          </View>

          <View style={{ width: 16 }} />

          <View style={[styles.inputGroup, { flex: 1, marginBottom: 0 }]}>
            <Text style={styles.label}>NEEDED (kWh)</Text>
            <View style={styles.inputWrapper}>
              <Ionicons name="flash-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
              <TextInput
                style={styles.input}
                value={requestedEnergyKWh}
                onChangeText={setRequestedEnergyKWh}
                keyboardType="numeric"
                placeholder="30"
                placeholderTextColor={colors.onSurfaceVariant}
              />
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep2 = () => (
    <View style={styles.stepContainer}>
      <Text style={styles.stepTitle}>Location</Text>
      <Text style={styles.stepSubtitle}>Where do you need the charge?</Text>
      
      <View style={styles.card}>
        <TouchableOpacity 
          style={[styles.verifyBtn, { marginBottom: 20, backgroundColor: '#242424', borderColor: '#333' }]}
          onPress={fetchLiveLocation}
          disabled={isFetchingLocation}
        >
          {isFetchingLocation ? (
            <ActivityIndicator color={colors.secondaryContainer} />
          ) : (
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center' }}>
              <Ionicons name="location-sharp" size={18} color="#fff" style={{ marginRight: 8 }} />
              <Text style={[styles.verifyBtnText, { color: '#fff', fontSize: 14 }]}>
                FETCH LIVE LOCATION
              </Text>
            </View>
          )}
        </TouchableOpacity>

        <View style={styles.inputGroup}>
          <Text style={styles.label}>LOCATION ADDRESS</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="map-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              value={address} 
              onChangeText={setAddress} 
              placeholder="Search or enter address"
              placeholderTextColor={colors.onSurfaceVariant}
              multiline={true}
            />
          </View>
        </View>

        <View style={[styles.inputGroup, { marginBottom: 0 }]}>
          <Text style={styles.label}>SPECIFIC DETAILS (OPTIONAL)</Text>
          <View style={styles.inputWrapper}>
            <Ionicons name="business-outline" size={20} color={colors.onSurfaceVariant} style={styles.inputIcon} />
            <TextInput 
              style={styles.input} 
              value={addressDetails} 
              onChangeText={setAddressDetails} 
              placeholder="Landmark, parking spot no."
              placeholderTextColor={colors.onSurfaceVariant}
            />
          </View>
        </View>
      </View>
    </View>
  );

  const renderStep3 = () => {
    // Mock calculate price for display
    const baseFare = 50;
    const energyCost = parseInt(requestedEnergyKWh || '0') * (chargingType === 'Fast' ? 25 : 15);
    const connectorFee = connectorType === 'CCS2' ? 20 : (connectorType === 'CHAdeMO' ? 15 : 0);
    const serviceCharge = 30 + connectorFee;
    const travelCharge = 5 * 10;
    const subTotal = baseFare + energyCost + serviceCharge + travelCharge;
    const tax = subTotal * 0.18;
    const total = subTotal + tax;

    return (
      <View style={styles.stepContainer}>
        <Text style={styles.stepTitle}>Price & Payment</Text>
        <Text style={styles.stepSubtitle}>Review your booking details</Text>

        <View style={styles.card}>
          <View style={styles.receiptHeader}>
            <Ionicons name="receipt-outline" size={24} color={colors.secondaryContainer} />
            <Text style={styles.receiptTitle}>Order Summary</Text>
          </View>

          <View style={styles.receipt}>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Base Fare</Text><Text style={styles.receiptValue}>₹{baseFare}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Energy Cost</Text><Text style={styles.receiptValue}>₹{energyCost}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Travel Charge</Text><Text style={styles.receiptValue}>₹{travelCharge}</Text></View>
            <View style={styles.receiptRow}><Text style={styles.receiptLabel}>Service & Connector</Text><Text style={styles.receiptValue}>₹{serviceCharge}</Text></View>
            <View style={[styles.receiptRow, styles.divider]}><Text style={styles.receiptLabel}>Tax (18%)</Text><Text style={styles.receiptValue}>₹{tax.toFixed(2)}</Text></View>
            <View style={[styles.receiptRow, { marginTop: 12 }]}><Text style={styles.receiptTotalLabel}>Total</Text><Text style={styles.receiptTotalValue}>₹{total.toFixed(2)}</Text></View>
          </View>
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>PAYMENT METHOD</Text>
          <View style={styles.chipRow}>
            {['Online', 'Cash', 'UPI'].map(type => (
              <TouchableOpacity
                key={type}
                style={[styles.chip, paymentMethod === type && styles.chipActive]}
                onPress={() => setPaymentMethod(type)}
              >
                <Ionicons 
                  name={type === 'Cash' ? 'cash-outline' : type === 'UPI' ? 'phone-portrait-outline' : 'card-outline'} 
                  size={18} 
                  color={paymentMethod === type ? colors.secondaryContainer : colors.onSurfaceVariant} 
                  style={{ marginRight: 6 }} 
                />
                <Text style={[styles.chipText, paymentMethod === type && styles.chipTextActive]}>{type}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.header}>
          <TouchableOpacity onPress={() => step > 1 ? handleBack() : navigation.goBack()} style={styles.headerIconBox}>
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={{ alignItems: 'center' }}>
            <Text style={styles.headerSub}>VOLTRESCUE</Text>
            <Text style={styles.headerTitle}>Book a Charge</Text>
          </View>
          <View style={styles.headerIconBox} />
        </View>

        <StepIndicator />

        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {step === 1 && renderStep1()}
          {step === 2 && renderStep2()}
          {step === 3 && renderStep3()}
        </ScrollView>

        <View style={styles.footer}>
          <TouchableOpacity
            style={[
              styles.actionBtn,
              (step === 1 && !isPhoneVerified) && { opacity: 0.5 }
            ]}
            onPress={() => {
              if (step < 3) {
                if (step === 1 && !isPhoneVerified) {
                  alert('Please verify your phone number first');
                  return;
                }
                handleNext();
              } else {
                handleRequestCharge();
              }
            }}
            disabled={(step === 1 && !isPhoneVerified) || isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color="#000" />
            ) : (
              <>
                <Text style={styles.actionBtnText}>
                  {step < 3 ? 'CONTINUE' : 'CONFIRM BOOKING'}
                </Text>
                <Ionicons 
                  name={step < 3 ? "arrow-forward" : "checkmark-done"} 
                  size={20} 
                  color="#000" 
                  style={{ marginLeft: 8 }} 
                />
              </>
            )}
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  headerIconBox: { width: 40, alignItems: 'flex-start', justifyContent: 'center' },
  headerIcon: { fontSize: 24 },
  headerSub: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 2,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },

  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 40,
  },
  stepCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#2A2A2A',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#444'
  },
  stepCircleActive: {
    backgroundColor: 'rgba(47,248,1,0.1)',
    borderColor: colors.secondaryContainer,
    borderWidth: 2,
  },
  stepNumber: { color: colors.onSurfaceVariant, fontSize: 12, fontWeight: 'bold' },
  stepNumberActive: { color: colors.secondaryContainer },
  stepCheck: { color: colors.secondaryContainer, fontSize: 16, fontWeight: 'bold' },
  progressLine: { flex: 1, height: 2, backgroundColor: '#333', marginHorizontal: 8 },
  progressLineActive: { backgroundColor: colors.secondaryContainer },

  scrollContent: { padding: 20, paddingBottom: 40 },
  stepContainer: { flex: 1 },
  stepTitle: { color: colors.secondaryContainer, fontSize: 24, fontWeight: 'bold', marginBottom: 4 },
  stepSubtitle: { color: colors.onSurfaceVariant, fontSize: 14, marginBottom: 24 },

  card: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#333',
  },

  inputGroup: { marginBottom: 20 },
  label: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 8
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: '#333',
  },
  inputIcon: { fontSize: 20, marginRight: 12 },
  input: { flex: 1, color: '#fff', fontSize: 16, height: '100%' },

  row: { flexDirection: 'row', alignItems: 'center' },
  phoneRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  verifyBtn: {
    backgroundColor: 'rgba(47,248,1,0.1)',
    paddingHorizontal: 20,
    height: 56,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondaryContainer
  },
  verifyBtnText: { color: colors.secondaryContainer, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  verifiedBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(47,248,1,0.05)',
    paddingHorizontal: 16,
    height: 56,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.secondaryContainer,
    gap: 8
  },
  verifiedIcon: { fontSize: 16 },
  verifiedText: { color: colors.secondaryContainer, fontWeight: 'bold', fontSize: 12, letterSpacing: 1 },
  otpContainer: { marginTop: 12, padding: 16, backgroundColor: 'rgba(47,248,1,0.05)', borderRadius: 16, borderWidth: 1, borderColor: colors.secondaryContainer },

  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#2A2A2A',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#333'
  },
  chipActive: {
    backgroundColor: 'rgba(47,248,1,0.05)',
    borderColor: colors.secondaryContainer,
    borderWidth: 1.5,
  },
  chipText: { color: colors.onSurfaceVariant, fontWeight: 'bold', fontSize: 14 },
  chipTextActive: { color: colors.secondaryContainer },

  receiptHeader: { flexDirection: 'row', alignItems: 'center', marginBottom: 20, gap: 12 },
  receiptHeaderIcon: { fontSize: 24 },
  receiptTitle: { color: colors.secondaryContainer, fontSize: 18, fontWeight: 'bold' },
  receipt: { backgroundColor: '#2A2A2A', borderRadius: 12, padding: 16, borderWidth: 1, borderColor: '#333' },
  receiptRow: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12 },
  receiptLabel: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: '500' },
  receiptValue: { color: '#fff', fontSize: 14, fontWeight: 'bold' },
  receiptTotalLabel: { color: colors.secondaryContainer, fontWeight: 'bold', fontSize: 18 },
  receiptTotalValue: { color: colors.secondaryContainer, fontWeight: 'bold', fontSize: 20, letterSpacing: 1 },
  divider: { borderBottomWidth: 1, borderBottomColor: '#444', paddingBottom: 16, marginBottom: 8 },

  footer: {
    padding: 20,
    paddingBottom: Platform.OS === 'ios' ? 34 : 20,
    backgroundColor: '#1A1A1A',
    borderTopWidth: 1,
    borderTopColor: '#333',
  },
  actionBtn: {
    backgroundColor: colors.secondaryContainer,
    height: 56,
    borderRadius: 28,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.secondaryContainer,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 8,
  },
  actionBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14, letterSpacing: 1 },
  actionBtnIcon: { fontSize: 16, marginLeft: 8 },
});

export default BookingWizardScreen;
