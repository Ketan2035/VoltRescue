import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const DriverVehicleScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Diagnostics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]} showsVerticalScrollIndicator={false}>
        {/* Vehicle Hero Card */}
        <View style={styles.heroCard}>
          <View style={styles.heroIconBox}>
            <Ionicons name="car-sport" size={36} color="#059669" />
          </View>
          <Text style={styles.vehicleName}>Ford E-Transit (VR-04)</Text>
          <View style={styles.statusPill}>
            <View style={styles.statusDot} />
            <Text style={styles.vehicleStatus}>All Systems Nominal</Text>
          </View>
        </View>

        {/* Main Battery Stack */}
        <Text style={styles.sectionTitle}>Main Battery Storage Stack</Text>
        <View style={styles.batteryCard}>
          <View style={styles.batteryRow}>
            <View>
              <Text style={styles.batteryLabel}>DISPATCH CHARGE LEVEL</Text>
              <Text style={styles.batteryValue}>84%</Text>
            </View>
            <View style={styles.batteryIconBox}>
              <Ionicons name="battery-charging" size={32} color="#059669" />
            </View>
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '84%' }]} />
          </View>
          <Text style={styles.batteryEstimate}>
            ~320 kWh usable reserve capacity available for dispatch
          </Text>
        </View>

        {/* Systems Diagnostics */}
        <Text style={styles.sectionTitle}>Diagnostic Telemetry</Text>
        <View style={styles.systemList}>
          <View style={styles.systemItem}>
            <View style={styles.systemLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="thermometer-outline" size={18} color="#2563EB" />
              </View>
              <Text style={styles.systemText}>Battery Core Temp</Text>
            </View>
            <Text style={styles.systemStatusGood}>22°C (Optimal)</Text>
          </View>

          <View style={styles.systemItem}>
            <View style={styles.systemLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="flash-outline" size={18} color="#059669" />
              </View>
              <Text style={styles.systemText}>Rapid Output Inverter</Text>
            </View>
            <Text style={styles.systemStatusGood}>150kW Ready</Text>
          </View>

          <View style={styles.systemItem}>
            <View style={styles.systemLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="water-outline" size={18} color="#059669" />
              </View>
              <Text style={styles.systemText}>Cooling Loop Flow</Text>
            </View>
            <Text style={styles.systemStatusGood}>Active (100%)</Text>
          </View>

          <View style={[styles.systemItem, { borderBottomWidth: 0 }]}>
            <View style={styles.systemLeft}>
              <View style={[styles.diagIconBox, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="construct-outline" size={18} color="#D97706" />
              </View>
              <Text style={styles.systemText}>Scheduled Service</Text>
            </View>
            <Text style={styles.systemStatusMuted}>In 4,200 km</Text>
          </View>
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
  headerTitle: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  heroCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  heroIconBox: {
    width: 68,
    height: 68,
    borderRadius: 34,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vehicleName: {
    color: '#0F172A',
    fontSize: 18,
    fontWeight: '800',
    marginBottom: 6,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#059669',
  },
  vehicleStatus: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.3,
  },
  batteryCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  batteryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 14,
  },
  batteryLabel: {
    color: '#64748B',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.8,
  },
  batteryValue: {
    color: '#0F172A',
    fontSize: 34,
    fontWeight: '900',
    letterSpacing: -0.5,
    marginTop: 2,
  },
  batteryIconBox: {
    width: 52,
    height: 52,
    borderRadius: 16,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  progressBar: {
    height: 8,
    backgroundColor: '#F1F5F9',
    borderRadius: 4,
    marginBottom: 10,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 4,
  },
  batteryEstimate: {
    color: '#64748B',
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  systemList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    paddingHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 6,
    elevation: 2,
  },
  systemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F5F9',
  },
  systemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  diagIconBox: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  systemText: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '600',
  },
  systemStatusGood: {
    color: '#059669',
    fontWeight: '700',
    fontSize: 13,
  },
  systemStatusMuted: {
    color: '#64748B',
    fontWeight: '600',
    fontSize: 13,
  },
});

export default DriverVehicleScreen;
