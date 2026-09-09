import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';

interface Booking {
  _id: string;
  status: string;
  date: string;
  timeSlot?: { start: string; end: string };
  userLocation: { address: string };
  chargingType: string;
  requestedEnergyKWh: number;
  pricing?: { totalAmount?: number; energyCost?: number };
}

const MyBookingsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/customer');
      const sortedBookings = (response.data?.data?.bookings || []).sort(
        (a: any, b: any) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setBookings(sortedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadgeStyle = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'SEARCHING_OPERATOR':
        return { bg: '#FEF3C7', text: '#D97706', label: 'SEARCHING' };
      case 'VEHICLE_ASSIGNED':
      case 'DRIVER_STARTED':
      case 'ARRIVING':
        return { bg: '#EFF6FF', text: '#2563EB', label: 'EN ROUTE' };
      case 'CHARGING_STARTED':
      case 'CHARGING_IN_PROGRESS':
        return { bg: '#ECFDF5', text: '#059669', label: 'CHARGING' };
      case 'COMPLETED':
      case 'PAYMENT_SUCCESS':
      case 'BOOKING_COMPLETED':
        return { bg: '#ECFDF5', text: '#059669', label: 'COMPLETED' };
      case 'CANCELLED':
        return { bg: '#FEF2F2', text: '#DC2626', label: 'CANCELLED' };
      default:
        return { bg: '#F1F5F9', text: '#64748B', label: status.replace('_', ' ') };
    }
  };

  const renderItem = ({ item }: { item: Booking }) => {
    const badge = getStatusBadgeStyle(item.status);
    const dateObj = new Date(item.date || Date.now());
    const dateStr = dateObj.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View>
            <Text style={styles.dateText}>{dateStr}</Text>
            <Text style={styles.energySub}>
              {item.requestedEnergyKWh} kWh • {item.chargingType || 'DC Fast'}
            </Text>
          </View>
          <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
            <Text style={[styles.statusText, { color: badge.text }]}>{badge.label}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.detailRow}>
          <Ionicons name="location" size={16} color="#059669" style={styles.icon} />
          <Text style={styles.addressText} numberOfLines={2}>
            {item.userLocation?.address || 'Current Breakdown Location'}
          </Text>
        </View>

        {item.pricing?.totalAmount ? (
          <View style={styles.priceRow}>
            <Text style={styles.priceLabel}>Paid Total:</Text>
            <Text style={styles.priceValue}>₹{item.pricing.totalAmount.toFixed(2)}</Text>
          </View>
        ) : null}
      </View>
    );
  };

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Rescue Trips</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="calendar-outline" size={44} color="#059669" />
          </View>
          <Text style={styles.emptyTitle}>No rescue bookings yet</Text>
          <Text style={styles.emptySub}>When you request roadside charging, trips will show up here.</Text>
          <TouchableOpacity
            style={styles.bookBtn}
            onPress={() => navigation.navigate('BookingWizard')}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color="#FFFFFF" />
            <Text style={styles.bookBtnText}>Request Rescue Charge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={(item) => item._id}
          renderItem={renderItem}
          contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
          refreshing={loading}
          onRefresh={fetchBookings}
          showsVerticalScrollIndicator={false}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  safeArea: {
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
  headerTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  emptyIconBox: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    textAlign: 'center',
    lineHeight: 18,
    marginBottom: 24,
    paddingHorizontal: 20,
  },
  bookBtn: {
    backgroundColor: '#059669',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  bookBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  dateText: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
    marginBottom: 2,
  },
  energySub: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  statusBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  statusText: {
    fontSize: 10,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginBottom: 12,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  icon: {
    marginRight: 2,
  },
  addressText: {
    color: '#334155',
    fontSize: 13,
    flex: 1,
    lineHeight: 18,
  },
  priceRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  priceLabel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '600',
  },
  priceValue: {
    color: '#059669',
    fontSize: 15,
    fontWeight: '800',
  },
});

export default MyBookingsScreen;
