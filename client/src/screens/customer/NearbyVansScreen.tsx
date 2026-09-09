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
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const NearbyVansScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [nearbyVans, setNearbyVans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyVans();
  }, []);

  const fetchNearbyVans = async () => {
    try {
      setLoading(true);
      const { status } = await Location.requestForegroundPermissionsAsync();
      let lng = -122.4194;
      let lat = 37.7749;
      if (status === 'granted') {
        const loc = await Location.getCurrentPositionAsync({});
        lng = loc.coords.longitude;
        lat = loc.coords.latitude;
      }
      const response = await api.get(`/operators/nearby?lng=${lng}&lat=${lat}`);
      setNearbyVans(response.data?.data?.operators || []);
    } catch (error) {
      console.error('Error fetching nearby vans:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVan = ({ item }: { item: any }) => {
    const distKm = item.dist?.calculated ? (item.dist.calculated / 1000).toFixed(1) : '2.4';
    const etaMin = Math.max(2, Math.round(Number(distKm) * 2.5));

    return (
      <View style={styles.vanCard}>
        <View style={styles.cardHeader}>
          <View style={styles.driverRow}>
            <View style={styles.avatarBox}>
              <Ionicons name="car" size={22} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.driverName}>{item.name || 'VoltRescue Unit'}</Text>
              <Text style={styles.vehicleModel}>{item.vehicleDetails?.model || 'Mobile DC Fast Van'}</Text>
            </View>
          </View>
          <View style={styles.etaBadge}>
            <Text style={styles.etaText}>~{etaMin} mins</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.cardFooter}>
          <View style={styles.capability}>
            <Ionicons name="flash" size={14} color="#059669" />
            <Text style={styles.capabilityText}>150kW DC Fast Output • CCS2 Ready</Text>
          </View>
          <TouchableOpacity
            style={styles.requestBtn}
            onPress={() => navigation.navigate('BookingWizard')}
            activeOpacity={0.85}
          >
            <Text style={styles.requestBtnText}>Request</Text>
          </TouchableOpacity>
        </View>
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
        <Text style={styles.headerTitle}>Nearby Rescue Vans</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color="#059669" />
        </View>
      ) : nearbyVans.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIconBox}>
            <Ionicons name="car-sport-outline" size={44} color="#94A3B8" />
          </View>
          <Text style={styles.emptyTitle}>No rescue vans in immediate radius</Text>
          <Text style={styles.emptySub}>
            You can still submit a rescue request and dispatch will route the closest unit.
          </Text>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={() => navigation.navigate('BookingWizard')}
            activeOpacity={0.85}
          >
            <Ionicons name="flash" size={18} color="#FFFFFF" />
            <Text style={styles.actionBtnText}>Request Emergency Charge</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={nearbyVans}
          keyExtractor={(item) => item._id || Math.random().toString()}
          renderItem={renderVan}
          contentContainerStyle={[styles.listContainer, { paddingBottom: Math.max(insets.bottom, 24) }]}
          refreshing={loading}
          onRefresh={fetchNearbyVans}
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
    backgroundColor: '#F1F5F9',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
    marginBottom: 20,
  },
  actionBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#059669',
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 16,
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  actionBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 14,
  },
  listContainer: {
    padding: 20,
    paddingBottom: 40,
  },
  vanCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 18,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  driverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
  },
  avatarBox: {
    width: 44,
    height: 44,
    borderRadius: 14,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  driverName: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  vehicleModel: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
  },
  etaBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  etaText: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '800',
  },
  divider: {
    height: 1,
    backgroundColor: '#F1F5F9',
    marginVertical: 14,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  capability: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flex: 1,
  },
  capabilityText: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '600',
  },
  requestBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 12,
  },
  requestBtnText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 12,
  },
});

export default NearbyVansScreen;
