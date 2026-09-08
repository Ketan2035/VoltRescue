import React, { useState } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, ActivityIndicator } from 'react-native';
import { colors } from '../../theme/colors';
import { useBookingState } from '../../hooks/useBookingState';
import api from '../../services/api';

const BillGenerationScreen = ({ route, navigation }: any) => {
  const { bookingId } = route.params || {};
  const { status } = useBookingState(bookingId);
  const [isSending, setIsSending] = useState(false);
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

  const handleSendBill = async () => {
    setIsSending(true);
    
    if (bookingId && bookingId !== 'mock-id') {
      try {
        await api.patch(`/bookings/${bookingId}/status`, {
          status: 'INVOICE_GENERATED'
        });
      } catch (err) {
        console.error(err);
      }
    } else {
      setIsSending(false);
      setIsSuccess(true);
      setTimeout(() => {
        navigation.navigate('DriverDashboard');
      }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top Navigation */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>VOLT DRIVE</Text>
        </View>
        <View style={styles.avatarBox}>
          <Image 
            source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD1VBnqOyO4bYsxkLDDJxxrtXc8O0Mm1xWhXG4x_z6jylbDtSDy8Y2M3ryryyLFqHyIVYqzpRGSzP1iCTf5Gny69rC0gxoM2VD8-ooBOYJNaI1g5G4Tx0GT1XCGbhnsJwjR4lW60WMUOinfvioyBmWcXOMn99Cu43NUrM02dRXgIGV5OxPMT7jN_RBqhxn9bXxb4z8WqdK6KgdJ6teAPopYy4OzX40TXeCbvMlpQbM3JPcKVpy9atCNFm_zO6gEBsgTEi0km0uIarTH' }}
            style={styles.avatar}
          />
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Animated Success Background Placeholder */}
        <View style={styles.successBanner}>
          <Text style={styles.successIcon}>✅</Text>
          <Text style={styles.successTitle}>Charging Session Complete</Text>
          <Text style={styles.successSub}>Session ID: #VD-88921-X</Text>
        </View>

        {/* Session Bento Grid */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>ENERGY DELIVERED</Text>
              <Text style={styles.bentoIconTop}>⚡</Text>
            </View>
            <View style={styles.bentoValueRow}>
              <Text style={styles.bentoValueMain}>{bookingDetails?.requestedEnergyKWh || 0}</Text>
              <Text style={styles.bentoValueSub}>kWh</Text>
            </View>
          </View>
          
          <View style={styles.bentoCard}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>SESSION DURATION</Text>
              <Text style={styles.bentoIconTopBlue}>⏱️</Text>
            </View>
            <View style={styles.bentoValueRow}>
              <Text style={styles.bentoValueWhite}>00:42</Text>
              <Text style={styles.bentoValueSubWhite}>m</Text>
            </View>
          </View>
          
          <View style={styles.bentoCardVertical}>
            <View style={styles.bentoHeader}>
              <Text style={styles.bentoLabel}>TARGET VEHICLE</Text>
              <Text style={styles.bentoIconTopGray}>🚗</Text>
            </View>
            <View style={styles.vehicleInfoRow}>
              <View style={styles.vehicleThumbBox}>
                <Image 
                  source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC-8-yEEU55l6Obz3ZcdwytH5aBLuvthxWTtpxD1vMh1gPs7YaY89z1r0VhixBaMicyM4iXfj3MpA1pzikKisfrjNXn1wfPtdsuq_wPDHQO-Ghp8o1W67A79kswdx25Lj1MsIR-UlRMWy14x9-sy3JS_-gsfJ8TPtNM51aRktki0Db-cAH-2n-RmxOe7bayjlwg8eXQgUt7GqW-0JDM-X_-2N6UU7dNZ7v2g4sfPSVsw1oAGelhwZhGvD0rjSXBWvSTbw-QHAbD96A6' }}
                  style={styles.vehicleThumb}
                />
              </View>
              <View style={styles.vehicleTextCol}>
                <Text style={styles.vehicleName}>{bookingDetails?.customerId?.name || 'Customer'}'s EV</Text>
                <Text style={styles.vehicleLicense}>ID: {bookingDetails?.customerId?._id?.substring(0, 6) || 'N/A'}</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Detailed Bill Breakdown */}
        <View style={styles.billSection}>
          <View style={styles.billHeader}>
            <Text style={styles.billTitle}>Bill Summary</Text>
          </View>
          <View style={styles.billContent}>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Charging Base Rate</Text>
              <Text style={styles.billValue}>₹{bookingDetails?.pricing?.energyCost?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>On-site Delivery Fee</Text>
              <Text style={styles.billValue}>₹{bookingDetails?.pricing?.travelCharge?.toFixed(2) || '0.00'}</Text>
            </View>
            <View style={styles.billRow}>
              <Text style={styles.billLabel}>Service Surcharge (Peak Hours)</Text>
              <Text style={styles.billValue}>₹3.50</Text>
            </View>

            <View style={styles.totalDivider} />
            <View style={styles.totalRow}>
              <Text style={styles.totalLabel}>Total Bill Amount</Text>
              <View style={styles.totalValueBox}>
                <Text style={styles.totalValueText}>₹{bookingDetails?.pricing?.totalAmount?.toFixed(2) || '0.00'}</Text>
              </View>
            </View>
          </View>

          {/* Driver Earnings Highlight */}
          <View style={styles.earningsBox}>
            <View style={styles.earningsLeft}>
              <View style={styles.earningsIconBox}>
                <Text style={styles.earningsIcon}>💰</Text>
              </View>
              <View>
                <Text style={styles.earningsLabel}>YOUR ESTIMATED EARNINGS</Text>
                <Text style={styles.earningsValue}>₹24.40</Text>
              </View>
            </View>
            <View style={styles.marginBadge}>
              <Text style={styles.marginBadgeText}>68% Margin</Text>
            </View>
          </View>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.primaryButton, isSuccess && styles.primaryButtonSuccess]}
            onPress={handleSendBill}
            disabled={isSending || isSuccess}
          >
            {isSending ? (
              <ActivityIndicator color={colors.onSecondaryFixed} />
            ) : isSuccess ? (
              <Text style={styles.primaryButtonTextSuccess}>✓ Bill Sent Successfully</Text>
            ) : (
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                <Text style={styles.primaryButtonText}>Finalize & Send Bill</Text>
                <Text style={{ fontSize: 18, color: colors.onSecondaryFixed }}>↗️</Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity style={styles.secondaryButton}>
            <Text style={styles.secondaryButtonText}>Review Session Log</Text>
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
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
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
  },
  avatarBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
    gap: 20,
  },
  successBanner: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  successIcon: {
    fontSize: 48,
    marginBottom: 8,
  },
  successTitle: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  successSub: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 4,
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  bentoCard: {
    flex: 1,
    minWidth: '45%',
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'space-between',
    height: 120,
  },
  bentoCardVertical: {
    width: '100%',
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bentoHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 16,
  },
  bentoLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bentoIconTop: {
    color: colors.secondaryFixed,
    fontSize: 16,
  },
  bentoIconTopBlue: {
    color: colors.primary,
    fontSize: 16,
  },
  bentoIconTopGray: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
  },
  bentoValueRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  bentoValueMain: {
    color: colors.secondaryFixed,
    fontSize: 36,
    fontWeight: 'bold',
  },
  bentoValueSub: {
    color: 'rgba(121,255,91,0.6)',
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  bentoValueWhite: {
    color: colors.onSurface,
    fontSize: 36,
    fontWeight: 'bold',
  },
  bentoValueSubWhite: {
    color: colors.onSurfaceVariant,
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 4,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  vehicleThumbBox: {
    width: 48,
    height: 48,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: colors.surfaceContainerHighest,
  },
  vehicleThumb: {
    width: '100%',
    height: '100%',
  },
  vehicleTextCol: {
    justifyContent: 'center',
  },
  vehicleName: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  vehicleLicense: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  billSection: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    overflow: 'hidden',
  },
  billHeader: {
    padding: 24,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.05)',
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  billTitle: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  billContent: {
    padding: 24,
    gap: 16,
  },
  billRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  billLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
  },
  billValue: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  totalDivider: {
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.1)',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  totalValueBox: {
    backgroundColor: 'rgba(121,255,91,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    shadowColor: colors.secondaryFixed,
    shadowOpacity: 0.2,
    shadowRadius: 15,
  },
  totalValueText: {
    color: colors.secondaryFixed,
    fontSize: 24,
    fontWeight: 'bold',
  },
  earningsBox: {
    margin: 24,
    marginTop: 0,
    backgroundColor: 'rgba(75,142,255,0.1)',
    borderWidth: 1,
    borderColor: 'rgba(75,142,255,0.2)',
    borderRadius: 16,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  earningsLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  earningsIconBox: {
    backgroundColor: 'rgba(173,198,255,0.2)',
    padding: 8,
    borderRadius: 20,
  },
  earningsIcon: {
    fontSize: 20,
  },
  earningsLabel: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  earningsValue: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
  },
  marginBadge: {
    backgroundColor: 'rgba(173,198,255,0.1)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 4,
  },
  marginBadgeText: {
    color: colors.primary,
    fontSize: 10,
    fontWeight: 'bold',
  },
  actionSection: {
    gap: 16,
  },
  primaryButton: {
    backgroundColor: colors.secondaryFixed,
    borderRadius: 16,
    paddingVertical: 20,
    alignItems: 'center',
    shadowColor: colors.secondaryFixed,
    shadowOpacity: 0.3,
    shadowRadius: 15,
  },
  primaryButtonSuccess: {
    backgroundColor: colors.primary,
  },
  primaryButtonText: {
    color: colors.onSecondaryFixed,
    fontSize: 18,
    fontWeight: 'bold',
  },
  primaryButtonTextSuccess: {
    color: colors.onPrimary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  secondaryButton: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    borderRadius: 16,
    paddingVertical: 16,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: colors.onSurfaceVariant,
    fontSize: 16,
    fontWeight: '500',
  }
});

export default BillGenerationScreen;
