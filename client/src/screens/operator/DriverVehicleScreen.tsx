import React from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const DriverVehicleScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Vehicle Diagnostics</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.heroCard}>
          <Ionicons name="car-sport" size={64} color="#fff" style={styles.heroIcon} />
          <Text style={styles.vehicleName}>Ford E-Transit (VR-04)</Text>
          <Text style={styles.vehicleStatus}>System Nominal</Text>
        </View>

        <Text style={styles.sectionTitle}>Main Battery Stack</Text>
        <View style={styles.batteryCard}>
          <View style={styles.batteryRow}>
            <View>
              <Text style={styles.batteryLabel}>Charge Level</Text>
              <Text style={styles.batteryValue}>84%</Text>
            </View>
            <Ionicons name="battery-full" size={48} color={colors.secondaryContainer} />
          </View>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: '84%', backgroundColor: colors.secondaryContainer }]} />
          </View>
          <Text style={styles.batteryEstimate}>~320 kWh remaining for dispatch</Text>
        </View>

        <Text style={styles.sectionTitle}>Systems Check</Text>
        
        <View style={styles.systemList}>
          <View style={styles.systemItem}>
            <View style={styles.systemLeft}>
              <Ionicons name="thermometer-outline" size={20} color="#fff" />
              <Text style={styles.systemText}>Battery Temp</Text>
            </View>
            <Text style={styles.systemStatusGood}>22°C</Text>
          </View>

          <View style={styles.systemItem}>
            <View style={styles.systemLeft}>
              <Ionicons name="flash-outline" size={20} color="#fff" />
              <Text style={styles.systemText}>Output Inverter</Text>
            </View>
            <Text style={styles.systemStatusGood}>150kW Ready</Text>
          </View>

          <View style={styles.systemItem}>
            <View style={styles.systemLeft}>
              <Ionicons name="water-outline" size={20} color="#fff" />
              <Text style={styles.systemText}>Cooling System</Text>
            </View>
            <Text style={styles.systemStatusGood}>Active</Text>
          </View>

          <View style={[styles.systemItem, { borderBottomWidth: 0 }]}>
            <View style={styles.systemLeft}>
              <Ionicons name="construct-outline" size={20} color="#fff" />
              <Text style={styles.systemText}>Next Maintenance</Text>
            </View>
            <Text style={{ color: '#888' }}>In 4,200 miles</Text>
          </View>
        </View>

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
  heroCard: {
    alignItems: 'center',
    marginBottom: 32,
    paddingVertical: 20,
  },
  heroIcon: { marginBottom: 16 },
  vehicleName: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 4 },
  vehicleStatus: { color: colors.secondaryContainer, fontSize: 14, fontWeight: '600' },
  sectionTitle: { color: '#fff', fontSize: 16, fontWeight: '600', marginBottom: 16 },
  batteryCard: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    padding: 24,
    marginBottom: 32,
    borderWidth: 1,
    borderColor: '#333',
  },
  batteryRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 },
  batteryLabel: { color: '#888', fontSize: 14, textTransform: 'uppercase' },
  batteryValue: { color: '#fff', fontSize: 36, fontWeight: '900' },
  progressBar: { height: 8, backgroundColor: '#333', borderRadius: 4, marginBottom: 12 },
  progressFill: { height: '100%', borderRadius: 4 },
  batteryEstimate: { color: '#888', fontSize: 12, textAlign: 'center' },
  systemList: {
    backgroundColor: '#1E1E1E',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#333',
    paddingHorizontal: 16,
  },
  systemItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#333',
  },
  systemLeft: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  systemText: { color: '#fff', fontSize: 16 },
  systemStatusGood: { color: colors.secondaryContainer, fontWeight: 'bold' },
});

export default DriverVehicleScreen;
