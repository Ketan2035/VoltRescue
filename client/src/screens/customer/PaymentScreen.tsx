import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const PaymentScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const [selectedPayment, setSelectedPayment] = useState<'apple' | 'visa'>('apple');
  const [isProcessing, setIsProcessing] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [bookingDetails, setBookingDetails] = useState<any>(null);

  React.useEffect(() => {
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

  const handlePayment = async () => {
    setIsProcessing(true);
    
    if (bookingId && bookingId !== 'mock-id') {
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'PAYMENT_PENDING'
        });
        
        // Simulate gateway processing
        setTimeout(async () => {
          await api.patch(`/bookings/${bookingId}/status`, {
            status: 'PAYMENT_SUCCESS'
          });
        }, 1500);

      } catch (err) {
        console.error(err);
        setIsProcessing(false);
      }
    } else {
      setIsProcessing(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigation.navigate('CustomerDashboard');
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.logoRow}>
          <Text style={styles.headerIcon}>🔋</Text>
          <Text style={styles.headerTitle}>Charging Summary</Text>
        </View>
        <TouchableOpacity style={styles.profileImageContainer}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuAJ2Ipr8k9nj1IAW31e-FLpTk3t_dYqN5Xymci7hjTPpZyst43cfxWEyc4mUAfXhlRmxXPU1k5AOTa-FvocvE7LvBRXIkbta4mHCkCXfp-k3gqaO0yUePvo9_wZiidaYog5SHL7Kron-XQfkrfjOAPnFyW5Keau4ojd8lyw_3vfr6YE0ZlwLyP8tzHpBD3kQTWFkgMLMxoBV5cfWUUlB4rPJg651PkRbB8A4j-SY8QwAsFTA2q9LSssCgPJ05soMjxQfUdXGUNIv_nD' }}
            style={styles.profileImage}
          />
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Success State Illustration */}
        <View style={styles.successSection}>
          <View style={styles.iconWrapper}>
            <View style={styles.iconPulse} />
            <View style={styles.iconCircle}>
              <Text style={styles.checkIcon}>✓</Text>
            </View>
          </View>
          <Text style={styles.successTitle}>Charging Complete</Text>
          <Text style={styles.successSub}>Your vehicle is ready for the road.</Text>
        </View>

        {/* Summary Statistics */}
        <View style={styles.statsSection}>
          <View style={styles.mainStatCard}>
            <View>
              <Text style={styles.statLabel}>ENERGY DELIVERED</Text>
              <Text style={styles.statMainValue}>{bookingDetails?.deliveredEnergyKWh || bookingDetails?.requestedEnergyKWh || 0} <Text style={styles.statUnit}>kWh</Text></Text>
            </View>
            <Text style={styles.statBigIcon}>⚡</Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.halfStatCard}>
              <Text style={styles.statLabel}>RANGE ADDED</Text>
              <Text style={styles.statValueGreen}>+185 <Text style={styles.statUnit}>mi</Text></Text>
            </View>
            <View style={styles.halfStatCard}>
              <Text style={styles.statLabel}>TIME ELAPSED</Text>
              <Text style={styles.statValueWhite}>32 <Text style={styles.statUnit}>mins</Text></Text>
            </View>
          </View>
        </View>

        {/* Cost Breakdown */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PRICE DETAILS</Text>
          <View style={styles.card}>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Charging Fee</Text>
              <Text style={styles.costValue}>₹{bookingDetails?.pricing?.energyCost?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.costRow}>
              <Text style={styles.costLabel}>Service Fee</Text>
              <Text style={styles.costValue}>₹{bookingDetails?.pricing?.travelCharge?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Amount</Text>
              <Text style={styles.totalValue}>₹{bookingDetails?.pricing?.totalAmount?.toFixed(2) || '0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Payment Method */}
        <View style={styles.section}>
          <Text style={styles.sectionHeader}>PAYMENT METHOD</Text>
          
          <TouchableOpacity 
            style={[styles.paymentCard, selectedPayment === 'apple' && styles.paymentCardSelected]}
            onPress={() => setSelectedPayment('apple')}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconBox}>
                <Text style={styles.paymentIcon}></Text>
              </View>
              <View>
                <Text style={styles.paymentName}>Apple Pay</Text>
                <Text style={styles.paymentSub}>Default method</Text>
              </View>
            </View>
            <View style={[styles.radioOuter, selectedPayment === 'apple' && styles.radioOuterSelected]}>
              {selectedPayment === 'apple' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>

          <TouchableOpacity 
            style={[styles.paymentCard, selectedPayment === 'visa' && styles.paymentCardSelected]}
            onPress={() => setSelectedPayment('visa')}
          >
            <View style={styles.paymentLeft}>
              <View style={styles.paymentIconBox}>
                <Text style={styles.paymentIcon}>💳</Text>
              </View>
              <View>
                <Text style={styles.paymentName}>Visa ending in 4242</Text>
                <Text style={styles.paymentSub}>Exp 12/26</Text>
              </View>
            </View>
            <View style={[styles.radioOuter, selectedPayment === 'visa' && styles.radioOuterSelected]}>
              {selectedPayment === 'visa' && <View style={styles.radioInner} />}
            </View>
          </TouchableOpacity>
        </View>

        {/* Actions */}
        <View style={styles.actionsSection}>
          <TouchableOpacity 
            style={[styles.payButton, isSuccess && styles.payButtonSuccess]}
            onPress={handlePayment}
            disabled={isProcessing || isSuccess}
          >
            {isProcessing ? (
              <ActivityIndicator color={colors.onSecondaryContainer} />
            ) : isSuccess ? (
              <Text style={styles.payButtonTextSuccess}>✓ Payment Successful</Text>
            ) : (
              <Text style={styles.payButtonText}>Pay ₹{bookingDetails?.pricing?.totalAmount?.toFixed(2) || '0.00'}</Text>
            )}
          </TouchableOpacity>

          <TouchableOpacity style={styles.downloadButton}>
            <Text style={styles.downloadIcon}>⬇️</Text>
            <Text style={styles.downloadText}>Download Receipt</Text>
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
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerIcon: {
    fontSize: 24,
    color: colors.primary,
  },
  headerTitle: {
    color: colors.onSurface,
    fontSize: 20,
    fontWeight: 'bold',
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
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
    gap: 24,
  },
  successSection: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  iconWrapper: {
    position: 'relative',
    width: 96,
    height: 96,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconPulse: {
    position: 'absolute',
    width: 96,
    height: 96,
    backgroundColor: 'rgba(47, 248, 1, 0.2)',
    borderRadius: 48,
  },
  iconCircle: {
    width: 80,
    height: 80,
    backgroundColor: colors.secondaryContainer,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: colors.secondaryFixedDim,
    shadowOpacity: 0.3,
    shadowRadius: 20,
  },
  checkIcon: {
    fontSize: 40,
    color: colors.onSecondaryContainer,
    fontWeight: 'bold',
  },
  successTitle: {
    color: colors.onSurface,
    fontSize: 32,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  successSub: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
  },
  statsSection: {
    gap: 16,
  },
  mainStatCard: {
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  statMainValue: {
    color: colors.primary,
    fontSize: 32,
    fontWeight: 'bold',
  },
  statUnit: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: 'normal',
  },
  statBigIcon: {
    fontSize: 36,
    opacity: 0.4,
  },
  statsRow: {
    flexDirection: 'row',
    gap: 16,
  },
  halfStatCard: {
    flex: 1,
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    borderRadius: 16,
    padding: 20,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
  },
  statValueGreen: {
    color: colors.secondaryFixedDim,
    fontSize: 28,
    fontWeight: 'bold',
  },
  statValueWhite: {
    color: colors.onSurface,
    fontSize: 28,
    fontWeight: 'bold',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    paddingHorizontal: 4,
  },
  card: {
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    borderRadius: 16,
    padding: 24,
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    gap: 16,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  costLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
  },
  costValue: {
    color: colors.onSurface,
    fontSize: 16,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.1)',
    paddingTop: 16,
    marginTop: 8,
  },
  totalLabel: {
    color: colors.onSurface,
    fontSize: 18,
  },
  totalValue: {
    color: colors.secondaryFixedDim,
    fontSize: 32,
    fontWeight: 'bold',
  },
  paymentCard: {
    backgroundColor: 'rgba(25, 25, 25, 0.8)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.1)',
    marginBottom: 12,
  },
  paymentCardSelected: {
    borderColor: colors.secondaryFixedDim,
    backgroundColor: 'rgba(47, 248, 1, 0.05)',
  },
  paymentLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  paymentIconBox: {
    width: 40,
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  paymentIcon: {
    fontSize: 20,
    color: '#fff',
  },
  paymentName: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  paymentSub: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.outline,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.secondaryFixedDim,
    backgroundColor: colors.secondaryFixedDim,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.onSecondary,
  },
  actionsSection: {
    gap: 16,
    marginTop: 16,
  },
  payButton: {
    backgroundColor: colors.secondaryContainer,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
  },
  payButtonSuccess: {
    backgroundColor: colors.secondaryFixedDim,
  },
  payButtonText: {
    color: colors.onSecondaryContainer,
    fontSize: 20,
    fontWeight: 'bold',
  },
  payButtonTextSuccess: {
    color: colors.onSecondary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  downloadButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 12,
  },
  downloadIcon: {
    fontSize: 16,
  },
  downloadText: {
    color: colors.primary,
    fontSize: 16,
  }
});

export default PaymentScreen;
