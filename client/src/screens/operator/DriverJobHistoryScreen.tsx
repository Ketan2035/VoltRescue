import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const DriverJobHistoryScreen = ({ navigation }: any) => {
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHistory = async () => {
      try {
        const res = await api.get('/bookings/operator');
        // Sort newest first
        const sorted = (res.data.data.bookings || []).sort((a: any, b: any) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setBookings(sorted);
      } catch (error) {
        console.error('Failed to fetch job history', error);
      } finally {
        setLoading(false);
      }
    };
    fetchHistory();
  }, []);

  const totalEarned = bookings
    .filter(b => b.status === 'COMPLETED')
    .reduce((sum, b) => sum + (b.pricing?.totalAmount || 0), 0);
    
  const completedCount = bookings.filter(b => b.status === 'COMPLETED').length;
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job History</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.summaryCard}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>Total Earned</Text>
            <Text style={styles.summaryValue}>₹{totalEarned.toFixed(2)}</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>Jobs</Text>
            <Text style={styles.summaryValue}>{completedCount}</Text>
          </View>
        </View>

        <Text style={styles.sectionTitle}>Recent Jobs</Text>

        {loading ? (
          <ActivityIndicator size="large" color={colors.secondaryContainer} style={{ marginTop: 40 }} />
        ) : bookings.length === 0 ? (
          <Text style={{ color: '#888', textAlign: 'center', marginTop: 20 }}>No jobs found.</Text>
        ) : (
          bookings.map((job) => {
            const dateObj = new Date(job.date);
            const dateStr = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            const timeStr = dateObj.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
            
            return (
              <View key={job._id} style={styles.jobCard}>
                <View style={styles.jobHeader}>
                  <View style={styles.jobDateRow}>
                    <Ionicons name="calendar-outline" size={14} color="#888" />
                    <Text style={styles.jobDate}>{dateStr} • {timeStr}</Text>
                  </View>
                  <Text style={[styles.jobStatus, job.status === 'CANCELLED' && styles.statusCancelled]}>
                    {job.status}
                  </Text>
                </View>

                <View style={styles.jobDetails}>
                  <View style={styles.locationRow}>
                    <Ionicons name="location" size={16} color={colors.secondaryContainer} />
                    <Text style={styles.jobLocation} numberOfLines={1}>{job.userLocation?.address || 'Unknown Location'}</Text>
                  </View>
                  <View style={styles.statsRow}>
                    <View style={styles.statBox}>
                      <Ionicons name="battery-charging-outline" size={16} color="#888" />
                      <Text style={styles.statText}>{job.requestedEnergyKWh} kWh</Text>
                    </View>
                    <View style={styles.statBox}>
                      <Ionicons name="cash-outline" size={16} color={colors.secondaryContainer} />
                      <Text style={[styles.statText, { color: '#fff', fontWeight: 'bold' }]}>₹{(job.pricing?.totalAmount || 0).toFixed(2)}</Text>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}

      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    backgroundColor: '#1A1A1A',
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  scrollContent: { padding: 20, paddingBottom: 40 },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: 'rgba(47,248,1,0.05)',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: 'rgba(47,248,1,0.2)',
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#333',
  },
  summaryLabel: { color: '#888', fontSize: 12, textTransform: 'uppercase', marginBottom: 4 },
  summaryValue: { color: '#fff', fontSize: 24, fontWeight: '900' },
  sectionTitle: { color: '#fff', fontSize: 18, fontWeight: '600', marginBottom: 16 },
  jobCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#333',
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobDateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  jobDate: { color: '#888', fontSize: 12 },
  jobStatus: { color: colors.secondaryContainer, fontSize: 10, fontWeight: 'bold', textTransform: 'uppercase' },
  statusCancelled: { color: '#FF3B30' },
  jobDetails: { gap: 12 },
  locationRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  jobLocation: { color: '#fff', fontSize: 16, fontWeight: '500' },
  statsRow: { flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: '#333', paddingTop: 12 },
  statBox: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  statText: { color: '#888', fontSize: 14 },
});

export default DriverJobHistoryScreen;
