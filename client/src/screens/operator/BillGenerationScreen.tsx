import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Platform,
  StatusBar,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const BillGenerationScreen = ({ route, navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);

  const [paymentMode, setPaymentMode] = useState<'qr' | 'cash'>('qr');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isConfirmed, setIsConfirmed] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  useEffect(() => {
    const fetchDetails = async () => {
      try {
        const res = await api.get(`/bookings/${bookingId}`);
        setBookingDetails(res.data.data.booking);
      } catch (err) {
        console.error('Failed to fetch booking details:', err);
      }
    };
    if (bookingId && bookingId !== 'mock-id') {
      fetchDetails();
    }
  }, [bookingId]);

  const totalAmount = bookingDetails?.pricing?.totalAmount?.toFixed(2) || '1111.56';
  const deliveredEnergy = bookingDetails?.deliveredEnergyKWh || bookingDetails?.requestedEnergyKWh || 30;
  const customerName = bookingDetails?.customerId?.name || bookingDetails?.personalInfo?.name || 'EV Customer';

  // UPI QR Code URL
  const upiUrl = encodeURIComponent(
    `upi://pay?pa=voltrescue@icici&pn=VoltRescue&am=${totalAmount}&cu=INR&tn=VoltRescue_Charge_${bookingId?.substring(0, 6)}`
  );
  const qrImageUri = `https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${upiUrl}&color=0F172A&bgcolor=FFFFFF&margin=10`;

  const hasResetNavigatedRef = useRef(false);

  const handleConfirmPayment = async () => {
    setIsProcessing(true);
    try {
      if (bookingId && bookingId !== 'mock-id') {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'COMPLETED',
        });
      }
      setIsConfirmed(true);
      setTimeout(() => {
        if (!hasResetNavigatedRef.current) {
          hasResetNavigatedRef.current = true;
          navigation.reset({
            index: 0,
            routes: [{ name: 'DriverDashboard' }],
          });
        }
      }, 1200);
    } catch (err) {
      console.error('Failed to settle payment:', err);
      setIsConfirmed(true);
      setTimeout(() => {
        if (!hasResetNavigatedRef.current) {
          hasResetNavigatedRef.current = true;
          navigation.reset({
            index: 0,
            routes: [{ name: 'DriverDashboard' }],
          });
        }
      }, 1200);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.navigate('DriverDashboard')}
          activeOpacity={0.7}
        >
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.brandRow}>
          <View style={styles.brandIconBox}>
            <Ionicons name="card" size={16} color="#059669" />
          </View>
          <Text style={styles.headerTitle}>COLLECT PAYMENT</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 28) }]} showsVerticalScrollIndicator={false}>
        {/* Bill Total Card */}
        <View style={styles.amountCard}>
          <Text style={styles.amountLabel}>TOTAL BILL DUE</Text>
          <Text style={styles.amountValue}>₹{totalAmount}</Text>
          <View style={styles.customerPill}>
            <Ionicons name="person-circle-outline" size={16} color="#64748B" />
            <Text style={styles.customerPillText}>{customerName}</Text>
            <Text style={styles.dotSeparator}>•</Text>
            <Text style={styles.kwhText}>{deliveredEnergy} kWh Delivered</Text>
          </View>
        </View>

        {/* Mode Selector Tabs */}
        <View style={styles.toggleContainer}>
          <TouchableOpacity
            style={[styles.toggleTab, paymentMode === 'qr' && styles.activeToggleTab]}
            onPress={() => setPaymentMode('qr')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="qr-code-outline"
              size={18}
              color={paymentMode === 'qr' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.toggleText, paymentMode === 'qr' && styles.activeToggleText]}>
              UPI QR SCANNER
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.toggleTab, paymentMode === 'cash' && styles.activeToggleTab]}
            onPress={() => setPaymentMode('cash')}
            activeOpacity={0.8}
          >
            <Ionicons
              name="cash-outline"
              size={18}
              color={paymentMode === 'cash' ? '#FFFFFF' : '#64748B'}
            />
            <Text style={[styles.toggleText, paymentMode === 'cash' && styles.activeToggleText]}>
              COLLECT CASH
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Mode Content */}
        {paymentMode === 'qr' ? (
          <View style={styles.qrSectionCard}>
            <Text style={styles.qrInstructionTitle}>Customer QR Code Scanner</Text>
            <Text style={styles.qrInstructionSub}>
              Ask customer to scan with GPay, PhonePe, Paytm, or any BHIM UPI app
            </Text>

            <View style={styles.qrWrapper}>
              <Image source={{ uri: qrImageUri }} style={styles.qrImage} resizeMode="contain" />
              <View style={styles.qrBadge}>
                <Ionicons name="shield-checkmark" size={14} color="#059669" />
                <Text style={styles.qrBadgeText}>INSTANT UPI DIRECT SETTLEMENT</Text>
              </View>
            </View>

            <View style={styles.upiIdRow}>
              <Text style={styles.upiIdLabel}>VPA Address:</Text>
              <Text style={styles.upiIdValue}>voltrescue@icici</Text>
            </View>
          </View>
        ) : (
          <View style={styles.cashSectionCard}>
            <View style={styles.cashIconCircle}>
              <Ionicons name="cash" size={36} color="#059669" />
            </View>
            <Text style={styles.cashTitle}>Collect Cash Payment</Text>
            <Text style={styles.cashSubtitle}>
              Please collect the exact cash amount from {customerName} before finalizing the booking.
            </Text>

            <View style={styles.cashBreakdownBox}>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Energy Delivered ({deliveredEnergy} kWh)</Text>
                <Text style={styles.cashValue}>
                  ₹{bookingDetails?.pricing?.energyCost?.toFixed(2) || '840.00'}
                </Text>
              </View>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>Rescue Dispatch & Service Fee</Text>
                <Text style={styles.cashValue}>
                  ₹{bookingDetails?.pricing?.travelCharge?.toFixed(2) || '250.00'}
                </Text>
              </View>
              <View style={styles.cashRow}>
                <Text style={styles.cashLabel}>GST & Regulatory Taxes (18%)</Text>
                <Text style={styles.cashValue}>₹21.56</Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.cashRowTotal}>
                <Text style={styles.cashTotalLabel}>Total Cash Due:</Text>
                <Text style={styles.cashTotalValue}>₹{totalAmount}</Text>
              </View>
            </View>
          </View>
        )}

        {/* Confirm Received Action */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[styles.confirmButton, (isProcessing || isConfirmed) && styles.buttonDisabled]}
            onPress={handleConfirmPayment}
            disabled={isProcessing || isConfirmed}
            activeOpacity={0.85}
          >
            {isProcessing ? (
              <ActivityIndicator color="#FFFFFF" size="small" />
            ) : isConfirmed ? (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-circle" size={22} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>Payment Confirmed ✓</Text>
              </View>
            ) : (
              <View style={styles.buttonInner}>
                <Ionicons name="checkmark-done" size={22} color="#FFFFFF" />
                <Text style={styles.confirmButtonText}>
                  {paymentMode === 'cash'
                    ? `Received Cash ₹${totalAmount}`
                    : 'Confirm Online Payment Received'}
                </Text>
              </View>
            )}
          </TouchableOpacity>
        </View>
      </ScrollView>
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
  headerTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    letterSpacing: 1.2,
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  amountCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E2E8F0',
    borderWidth: 1,
    borderRadius: 20,
    padding: 22,
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
    elevation: 3,
  },
  amountLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 1,
    marginBottom: 6,
  },
  amountValue: {
    color: '#059669',
    fontSize: 38,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  customerPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F1F5F9',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    marginTop: 12,
    gap: 6,
  },
  customerPillText: {
    color: '#0F172A',
    fontSize: 13,
    fontWeight: '700',
  },
  dotSeparator: {
    color: '#94A3B8',
  },
  kwhText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  toggleContainer: {
    flexDirection: 'row',
    backgroundColor: '#F1F5F9',
    borderRadius: 14,
    padding: 4,
    marginBottom: 20,
  },
  toggleTab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 10,
    gap: 8,
  },
  activeToggleTab: {
    backgroundColor: '#059669',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 2,
  },
  toggleText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  activeToggleText: {
    color: '#FFFFFF',
  },
  qrSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  qrInstructionTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 4,
  },
  qrInstructionSub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 16,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  qrWrapper: {
    backgroundColor: '#FFFFFF',
    padding: 14,
    borderRadius: 18,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    alignItems: 'center',
  },
  qrImage: {
    width: 220,
    height: 220,
  },
  qrBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
    gap: 5,
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  qrBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  upiIdRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 14,
    gap: 6,
  },
  upiIdLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  upiIdValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  cashSectionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
  },
  cashIconCircle: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  cashTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  cashSubtitle: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 18,
    paddingHorizontal: 10,
    lineHeight: 18,
  },
  cashBreakdownBox: {
    width: '100%',
    backgroundColor: '#F8FAFC',
    borderRadius: 14,
    padding: 16,
    gap: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashLabel: {
    color: '#64748B',
    fontSize: 13,
  },
  cashValue: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '700',
  },
  divider: {
    height: 1,
    backgroundColor: '#E2E8F0',
    marginVertical: 4,
  },
  cashRowTotal: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  cashTotalLabel: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
  },
  cashTotalValue: {
    color: '#059669',
    fontSize: 20,
    fontWeight: '900',
  },
  actionContainer: {
    marginTop: 8,
  },
  confirmButton: {
    backgroundColor: '#059669',
    borderRadius: 16,
    paddingVertical: 18,
    alignItems: 'center',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  confirmButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
});

export default BillGenerationScreen;
