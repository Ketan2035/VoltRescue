import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
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
}

const MyBookingsScreen = ({ navigation }: any) => {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchBookings();
  }, []);

  const fetchBookings = async () => {
    try {
      setLoading(true);
      const response = await api.get('/bookings/customer');
      // Sort by newest first
      const sortedBookings = (response.data?.data?.bookings || []).sort((a: any, b: any) => 
        new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setBookings(sortedBookings);
    } catch (error) {
      console.error('Error fetching bookings:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING': return '#F5A623';
      case 'VEHICLE_ASSIGNED': return '#4A90E2';
      case 'IN_PROGRESS': return colors.secondaryContainer;
      case 'COMPLETED': return '#7ED321';
      case 'CANCELLED': return '#D0021B';
      default: return '#888';
    }
  };

  const renderItem = ({ item }: { item: Booking }) => (
    <TouchableOpacity style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.dateText}>
            {new Date(item.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
          </Text>
          {item.timeSlot && <Text style={styles.timeText}>{item.timeSlot.start} - {item.timeSlot.end}</Text>}
        </View>
        <View style={[styles.statusBadge, { borderColor: getStatusColor(item.status) }]}>
          <Text style={[styles.statusText, { color: getStatusColor(item.status) }]}>{item.status.replace('_', ' ')}</Text>
        </View>
      </View>

      <View style={styles.divider} />

      <View style={styles.detailRow}>
        <Ionicons name="location-outline" size={16} color={colors.onSurfaceVariant} style={styles.icon} />
        <Text style={styles.addressText} numberOfLines={2}>{item.userLocation?.address || 'Location unavailable'}</Text>
      </View>

      <View style={styles.detailRow}>
        <Ionicons name="flash-outline" size={16} color={colors.onSurfaceVariant} style={styles.icon} />
        <Text style={styles.energyText}>{item.requestedEnergyKWh} kWh ({item.chargingType} Charge)</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Bookings</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.secondaryContainer} />
        </View>
      ) : bookings.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="calendar-outline" size={64} color="#333" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No bookings found</Text>
          <TouchableOpacity style={styles.bookBtn} onPress={() => navigation.navigate('BookingWizard')}>
            <Text style={styles.bookBtnText}>Book a Charge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={bookings}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchBookings}
        />
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  centerContainer: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  listContainer: { padding: 16, paddingBottom: 40 },
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 },
  dateText: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  timeText: { color: colors.onSurfaceVariant, fontSize: 12 },
  statusBadge: { paddingHorizontal: 12, paddingVertical: 4, borderRadius: 12, borderWidth: 1, backgroundColor: 'rgba(0,0,0,0.3)' },
  statusText: { fontSize: 10, fontWeight: 'bold' },
  divider: { height: 1, backgroundColor: '#333', marginBottom: 12 },
  detailRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 8 },
  icon: { marginRight: 8, width: 16, textAlign: 'center' },
  addressText: { color: '#ccc', fontSize: 13, flex: 1, lineHeight: 18 },
  energyText: { color: '#ccc', fontSize: 13, fontWeight: '500' },
  emptyText: { color: colors.onSurfaceVariant, fontSize: 16, marginBottom: 24 },
  bookBtn: { backgroundColor: colors.secondaryContainer, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 24 },
  bookBtnText: { color: '#000', fontWeight: 'bold', fontSize: 14 }
});

export default MyBookingsScreen;
