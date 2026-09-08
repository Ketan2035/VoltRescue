import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, ActivityIndicator, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Location from 'expo-location';
import { colors } from '../../theme/colors';
import api from '../../services/api';

const NearbyVansScreen = ({ navigation }: any) => {
  const [nearbyVans, setNearbyVans] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchNearbyVans();
  }, []);

  const fetchNearbyVans = async () => {
    try {
      setLoading(true);
      let { status } = await Location.requestForegroundPermissionsAsync();
      let lng = -122.406417; // Default fallback
      let lat = 37.785834;
      
      if (status === 'granted') {
        const location = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
        lng = location.coords.longitude;
        lat = location.coords.latitude;
      }

      const response = await api.get(`/operators/nearby?lng=${lng}&lat=${lat}`);
      if (response.data?.data?.operators) {
        setNearbyVans(response.data.data.operators);
      }
    } catch (error) {
      console.error('Error fetching nearby vans:', error);
    } finally {
      setLoading(false);
    }
  };

  const renderVan = ({ item: van }: { item: any }) => {
    const distance = van.dist?.calculated ? (van.dist.calculated / 1609.34).toFixed(1) : (Math.random() * 5 + 0.5).toFixed(1);
    const etaMinutes = Math.max(1, Math.round((van.dist?.calculated || 2000) / 400));
    
    return (
      <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('BookingWizard')}>
        <View style={styles.cardHeader}>
          <View style={styles.vanIconBg}>
            <Text style={styles.vanIcon}>🚚</Text>
          </View>
          <View style={styles.vanInfo}>
            <Text style={styles.vanName}>{van.name || `Van #${van._id.substring(0,4)}`}</Text>
            <Text style={styles.vanDistance}>{distance} miles away • ~{etaMinutes} mins ETA</Text>
          </View>
          <View style={[styles.liveBadge, van.status !== 'ONLINE' && { borderColor: '#888', backgroundColor: 'transparent' }]}>
            <View style={[styles.liveDot, van.status !== 'ONLINE' && { backgroundColor: '#888' }]} />
            <Text style={[styles.liveText, van.status !== 'ONLINE' && { color: '#ccc' }]}>{van.status === 'ONLINE' ? 'LIVE' : van.status}</Text>
          </View>
        </View>

        <View style={styles.divider} />

        <View style={styles.footerRow}>
          <View style={styles.capability}>
            <Ionicons name="flash-outline" size={14} color={colors.onSurfaceVariant} />
            <Text style={styles.capabilityText}>Fast Charge</Text>
          </View>
          <TouchableOpacity style={styles.requestBtn} onPress={() => navigation.navigate('BookingWizard')}>
            <Text style={styles.requestBtnText}>Request</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Nearby Rescue Vans</Text>
        <View style={{ width: 40 }} />
      </View>

      {loading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={colors.secondaryContainer} />
        </View>
      ) : nearbyVans.length === 0 ? (
        <View style={styles.centerContainer}>
          <Ionicons name="sad-outline" size={64} color="#333" style={{ marginBottom: 16 }} />
          <Text style={styles.emptyText}>No rescue vans available nearby</Text>
        </View>
      ) : (
        <FlatList
          data={nearbyVans}
          keyExtractor={item => item._id}
          renderItem={renderVan}
          contentContainerStyle={styles.listContainer}
          refreshing={loading}
          onRefresh={fetchNearbyVans}
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
  emptyText: { color: colors.onSurfaceVariant, fontSize: 16, marginBottom: 24 },
  listContainer: { padding: 16, paddingBottom: 40 },
  
  card: { backgroundColor: '#1E1E1E', borderRadius: 16, padding: 16, marginBottom: 16, borderWidth: 1, borderColor: '#333' },
  cardHeader: { flexDirection: 'row', alignItems: 'center' },
  vanIconBg: { width: 48, height: 48, borderRadius: 24, backgroundColor: 'rgba(47,248,1,0.1)', alignItems: 'center', justifyContent: 'center', marginRight: 16, borderWidth: 1, borderColor: colors.secondaryContainer },
  vanIcon: { fontSize: 20 },
  vanInfo: { flex: 1 },
  vanName: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 4 },
  vanDistance: { color: colors.onSurfaceVariant, fontSize: 12 },
  liveBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: 'rgba(47,248,1,0.05)', paddingHorizontal: 8, paddingVertical: 4, borderRadius: 12, borderWidth: 1, borderColor: colors.secondaryContainer },
  liveDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.secondaryContainer, marginRight: 4 },
  liveText: { color: colors.secondaryContainer, fontSize: 10, fontWeight: 'bold' },
  
  divider: { height: 1, backgroundColor: '#333', marginVertical: 16 },
  footerRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  capability: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  capabilityText: { color: colors.onSurfaceVariant, fontSize: 12 },
  requestBtn: { backgroundColor: colors.secondaryContainer, paddingHorizontal: 20, paddingVertical: 8, borderRadius: 20 },
  requestBtnText: { color: '#000', fontWeight: 'bold', fontSize: 12 }
});

export default NearbyVansScreen;
