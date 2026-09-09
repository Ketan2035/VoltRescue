import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  ActivityIndicator,
  Platform,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import api from '../../services/api';

const DriverJobHistoryScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [bookings, setBookings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<'ALL' | 'ACTIVE' | 'COMPLETED'>('ALL');

  const fetchHistory = async () => {
    try {
      const res = await api.get('/bookings/operator');
      const sorted = (res.data?.data?.bookings || []).sort(
        (a: any, b: any) => new Date(b.date || Date.now()).getTime() - new Date(a.date || Date.now()).getTime()
      );
      setBookings(sorted);
    } catch (error) {
      console.error('Failed to fetch job history', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, []);

  const onRefresh = () => {
    setRefreshing(true);
    fetchHistory();
  };

  const isActiveJob = (status: string) => {
    return [
      'ACCEPTED',
      'VEHICLE_ASSIGNED',
      'ARRIVING',
      'ARRIVED',
      'OTP_VERIFIED',
      'CHARGING_STARTED',
      'CHARGING_IN_PROGRESS',
      'CHARGING_COMPLETED',
      'INVOICE_GENERATED',
      'PAYMENT_PENDING',
    ].includes(status);
  };

  const handleResumeJob = (job: any) => {
    const status = job.status;
    const bookingId = job._id;

    switch (status) {
      case 'ACCEPTED':
      case 'VEHICLE_ASSIGNED':
      case 'ARRIVING':
        navigation.navigate('DriverEnRoute', { bookingId });
        break;
      case 'ARRIVED':
      case 'OTP_VERIFIED':
        navigation.navigate('StartCharging', { bookingId });
        break;
      case 'CHARGING_STARTED':
      case 'CHARGING_IN_PROGRESS':
        navigation.navigate('ChargingControls', { bookingId });
        break;
      case 'CHARGING_COMPLETED':
      case 'INVOICE_GENERATED':
      case 'PAYMENT_PENDING':
        navigation.navigate('BillGeneration', { bookingId });
        break;
      case 'COMPLETED':
      case 'PAYMENT_SUCCESS':
        navigation.navigate('BillGeneration', { bookingId });
        break;
      default:
        navigation.navigate('DriverEnRoute', { bookingId });
        break;
    }
  };

  const getStatusBadgeConfig = (status: string) => {
    switch (status) {
      case 'ACCEPTED':
      case 'VEHICLE_ASSIGNED':
      case 'ARRIVING':
        return {
          label: 'EN ROUTE',
          bg: '#EFF6FF',
          text: '#2563EB',
          actionText: 'Resume GPS Route →',
          icon: 'navigate',
        };
      case 'ARRIVED':
      case 'OTP_VERIFIED':
        return {
          label: 'ARRIVED • CABLE CHECK',
          bg: '#FEF3C7',
          text: '#D97706',
          actionText: 'Connect & Verify →',
          icon: 'flash',
        };
      case 'CHARGING_STARTED':
      case 'CHARGING_IN_PROGRESS':
        return {
          label: 'CHARGING ACTIVE',
          bg: '#ECFDF5',
          text: '#059669',
          actionText: 'Open Power Flow HUD →',
          icon: 'battery-charging',
        };
      case 'CHARGING_COMPLETED':
      case 'INVOICE_GENERATED':
      case 'PAYMENT_PENDING':
        return {
          label: 'BILLING PENDING',
          bg: '#FAF5FF',
          text: '#9333EA',
          actionText: 'Collect Payment →',
          icon: 'wallet',
        };
      case 'COMPLETED':
      case 'PAYMENT_SUCCESS':
        return {
          label: 'COMPLETED',
          bg: '#ECFDF5',
          text: '#059669',
          actionText: 'View Bill Receipt →',
          icon: 'checkmark-circle',
        };
      case 'CANCELLED':
        return {
          label: 'CANCELLED',
          bg: '#FEF2F2',
          text: '#DC2626',
          actionText: null,
          icon: 'close-circle',
        };
      default:
        return {
          label: status,
          bg: '#F1F5F9',
          text: '#64748B',
          actionText: 'Open Job →',
          icon: 'time',
        };
    }
  };

  const totalEarned = bookings
    .filter((b) => b.status === 'COMPLETED' || b.status === 'PAYMENT_SUCCESS')
    .reduce((sum, b) => sum + (b.pricing?.totalAmount || b.pricing?.energyCost || 0), 0);

  const completedCount = bookings.filter(
    (b) => b.status === 'COMPLETED' || b.status === 'PAYMENT_SUCCESS'
  ).length;

  const activeCount = bookings.filter((b) => isActiveJob(b.status)).length;

  const filteredBookings = bookings.filter((b) => {
    if (filter === 'ACTIVE') return isActiveJob(b.status);
    if (filter === 'COMPLETED') return b.status === 'COMPLETED' || b.status === 'PAYMENT_SUCCESS';
    return true;
  });

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={20} color="#0F172A" />
        </TouchableOpacity>
        <View style={styles.headerTitleBox}>
          <Text style={styles.headerSub}>VOLTRESCUE LOGS</Text>
          <Text style={styles.headerTitle}>Job & Dispatch History</Text>
        </View>
        <TouchableOpacity onPress={onRefresh} style={styles.refreshBtn} activeOpacity={0.7}>
          <Ionicons name="refresh" size={18} color="#059669" />
        </TouchableOpacity>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) + 20 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} colors={['#059669']} />}
      >
        {/* Summary Card */}
        <View style={styles.summaryCard}>
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>TOTAL SETTLED</Text>
            <Text style={styles.summaryValue}>₹{totalEarned.toFixed(0)}</Text>
            <Text style={styles.summarySub}>Completed revenue</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>COMPLETED</Text>
            <Text style={[styles.summaryValue, { color: '#0F172A' }]}>{completedCount}</Text>
            <Text style={styles.summarySub}>Finished jobs</Text>
          </View>
          <View style={styles.divider} />
          <View style={styles.summaryStat}>
            <Text style={styles.summaryLabel}>IN PROGRESS</Text>
            <Text style={[styles.summaryValue, { color: '#2563EB' }]}>{activeCount}</Text>
            <Text style={styles.summarySub}>Active dispatches</Text>
          </View>
        </View>

        {/* Filter Pills */}
        <View style={styles.filterRow}>
          <TouchableOpacity
            style={[styles.filterPill, filter === 'ALL' && styles.filterPillActive]}
            onPress={() => setFilter('ALL')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'ALL' && styles.filterTextActive]}>
              All Jobs ({bookings.length})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'ACTIVE' && styles.filterPillActive]}
            onPress={() => setFilter('ACTIVE')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'ACTIVE' && styles.filterTextActive]}>
              Active In-Progress ({activeCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.filterPill, filter === 'COMPLETED' && styles.filterPillActive]}
            onPress={() => setFilter('COMPLETED')}
            activeOpacity={0.7}
          >
            <Text style={[styles.filterText, filter === 'COMPLETED' && styles.filterTextActive]}>
              Completed ({completedCount})
            </Text>
          </TouchableOpacity>
        </View>

        {/* List of Jobs */}
        {loading ? (
          <ActivityIndicator size="large" color="#059669" style={{ marginTop: 40 }} />
        ) : filteredBookings.length === 0 ? (
          <View style={styles.emptyBox}>
            <Ionicons name="folder-open-outline" size={48} color="#94A3B8" />
            <Text style={styles.emptyTitle}>No jobs in this category</Text>
            <Text style={styles.emptySub}>Dispatched rescue trips will appear here.</Text>
          </View>
        ) : (
          filteredBookings.map((job) => {
            const dateObj = new Date(job.date || Date.now());
            const dateStr = dateObj.toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            });
            const timeStr = dateObj.toLocaleTimeString('en-US', {
              hour: '2-digit',
              minute: '2-digit',
            });

            const active = isActiveJob(job.status);
            const badge = getStatusBadgeConfig(job.status);
            const customerName = job.personalInfo?.name || job.customerId?.name || 'EV Customer';
            const vehicleModel = job.vehicleModel || job.vehicleDetails?.model || 'Electric Vehicle';
            const address = job.address || job.userLocation?.address || 'On-Demand Roadside Location';
            const amount = job.pricing?.totalAmount || job.pricing?.energyCost || 0;

            return (
              <TouchableOpacity
                key={job._id}
                style={[styles.jobCard, active && styles.jobCardActive]}
                activeOpacity={0.85}
                onPress={() => handleResumeJob(job)}
              >
                {/* Active Indicator Top Strip */}
                {active && (
                  <View style={styles.activeStrip}>
                    <View style={styles.pulseDot} />
                    <Text style={styles.activeStripText}>ACTIVE DISPATCH IN PROGRESS • TAP TO RESUME</Text>
                  </View>
                )}

                <View style={styles.jobHeader}>
                  <View style={styles.jobDateRow}>
                    <Ionicons name="time-outline" size={14} color="#64748B" />
                    <Text style={styles.jobDate}>
                      {dateStr} • {timeStr}
                    </Text>
                  </View>

                  <View style={[styles.statusBadge, { backgroundColor: badge.bg }]}>
                    <Ionicons name={badge.icon as any} size={12} color={badge.text} />
                    <Text style={[styles.jobStatus, { color: badge.text }]}>{badge.label}</Text>
                  </View>
                </View>

                {/* Customer & Vehicle */}
                <View style={styles.customerRow}>
                  <View style={styles.carIconBox}>
                    <Ionicons name="car-sport" size={18} color="#059669" />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.customerName}>{customerName}</Text>
                    <Text style={styles.vehicleText}>{vehicleModel}</Text>
                  </View>
                  <Text style={styles.payoutText}>₹{Number(amount).toFixed(0)}</Text>
                </View>

                {/* Address */}
                <View style={styles.locationRow}>
                  <Ionicons name="location" size={14} color="#64748B" />
                  <Text style={styles.jobLocation} numberOfLines={1}>
                    {address}
                  </Text>
                </View>

                {/* Bottom Action Footer */}
                {badge.actionText && (
                  <View style={[styles.actionFooter, active && styles.actionFooterActive]}>
                    <Text style={[styles.actionFooterText, active && styles.actionFooterTextActive]}>
                      {badge.actionText}
                    </Text>
                    <Ionicons
                      name="arrow-forward"
                      size={14}
                      color={active ? '#059669' : '#64748B'}
                    />
                  </View>
                )}
              </TouchableOpacity>
            );
          })
        )}
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
  headerTitleBox: {
    flex: 1,
    marginLeft: 12,
  },
  headerSub: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  headerTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '800',
  },
  refreshBtn: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  scrollContent: {
    padding: 16,
    gap: 14,
  },
  summaryCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  summaryStat: {
    flex: 1,
    alignItems: 'center',
  },
  divider: {
    width: 1,
    height: '100%',
    backgroundColor: '#F1F5F9',
  },
  summaryLabel: {
    color: '#64748B',
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.6,
    marginBottom: 2,
  },
  summaryValue: {
    color: '#059669',
    fontSize: 22,
    fontWeight: '900',
    letterSpacing: -0.5,
  },
  summarySub: {
    color: '#94A3B8',
    fontSize: 9,
    fontWeight: '600',
    marginTop: 2,
  },
  filterRow: {
    flexDirection: 'row',
    gap: 8,
  },
  filterPill: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  filterPillActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  filterText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '700',
  },
  filterTextActive: {
    color: '#FFFFFF',
  },
  emptyBox: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyTitle: {
    color: '#0F172A',
    fontSize: 16,
    fontWeight: '700',
    marginTop: 12,
  },
  emptySub: {
    color: '#64748B',
    fontSize: 13,
    marginTop: 4,
  },
  jobCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 16,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  jobCardActive: {
    borderColor: '#10B981',
    borderWidth: 1.5,
    backgroundColor: '#FFFFFF',
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 4,
  },
  activeStrip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 10,
    marginBottom: 12,
    alignSelf: 'flex-start',
  },
  pulseDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  activeStripText: {
    color: '#059669',
    fontSize: 9,
    fontWeight: '900',
    letterSpacing: 0.5,
  },
  jobHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  jobDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
  },
  jobDate: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  jobStatus: {
    fontSize: 9,
    fontWeight: '800',
    letterSpacing: 0.4,
  },
  customerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 10,
  },
  carIconBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  customerName: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  vehicleText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '500',
  },
  payoutText: {
    color: '#059669',
    fontSize: 18,
    fontWeight: '900',
  },
  locationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 10,
  },
  jobLocation: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    flex: 1,
  },
  actionFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#F1F5F9',
  },
  actionFooterActive: {
    borderTopColor: '#ECFDF5',
  },
  actionFooterText: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '700',
  },
  actionFooterTextActive: {
    color: '#059669',
    fontWeight: '800',
  },
});

export default DriverJobHistoryScreen;
