import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const RequestDetailsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />

      {/* Top Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Job Request Details</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Customer Profile Card */}
        <View style={styles.card}>
          <View style={styles.customerLeft}>
            <View style={styles.customerAvatarBox}>
              <Ionicons name="person" size={24} color="#64748B" />
              <View style={styles.goldBadge}>
                <Ionicons name="star" size={8} color="#FFFFFF" />
              </View>
            </View>
            <View>
              <Text style={styles.customerName}>Sarah K.</Text>
              <View style={styles.ratingRow}>
                <Ionicons name="star" size={12} color="#F59E0B" />
                <Text style={styles.ratingText}>4.9 • Gold Member</Text>
              </View>
            </View>
          </View>
          <View style={styles.customerActions}>
            <TouchableOpacity style={styles.actionCircleButton} activeOpacity={0.7}>
              <Ionicons name="chatbubble" size={18} color="#059669" />
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircleButton} activeOpacity={0.7}>
              <Ionicons name="call" size={18} color="#059669" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Identification Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleHeader}>
            <View style={styles.vehiclePill}>
              <Ionicons name="shield-checkmark" size={14} color="#059669" />
              <Text style={styles.verifiedBadgeText}>VERIFIED EV</Text>
            </View>
          </View>
          <View style={styles.vehicleInfoRow}>
            <View>
              <Text style={styles.vehicleName}>Tesla Model Y</Text>
              <Text style={styles.vehicleColor}>Pearl White • AWD Long Range</Text>
            </View>
            <View style={styles.plateBox}>
              <Text style={styles.plateText}>EV-982-SK</Text>
            </View>
          </View>
        </View>

        {/* Logistics & Location */}
        <View style={styles.logisticsCard}>
          <View style={styles.addressRow}>
            <View style={styles.addressIconBox}>
              <Ionicons name="location" size={20} color="#059669" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.addressText}>1230 Ocean Ave, Unit 4B</Text>
              <Text style={styles.distanceText}>1.2 km • ~6 mins away</Text>
            </View>
          </View>
          <View style={styles.instructionsBox}>
            <Text style={styles.instructionsLabel}>DRIVER INSTRUCTIONS</Text>
            <Text style={styles.instructionsText}>Parked in rear alley, gate code 1234. Please call upon arrival for gate access.</Text>
          </View>
        </View>

        {/* Technical Charging Specs Grid */}
        <View style={styles.specsGrid}>
          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Current Battery</Text>
            <Text style={[styles.specValue, { color: '#DC2626' }]}>12%</Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Target Battery</Text>
            <Text style={[styles.specValue, { color: '#059669' }]}>80%</Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Energy Needed</Text>
            <Text style={styles.specValue}>35 <Text style={styles.specUnit}>kWh</Text></Text>
          </View>

          <View style={styles.specCard}>
            <Text style={styles.specLabel}>Connector</Text>
            <Text style={styles.specValue}>CCS2</Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <View style={styles.financialLeft}>
            <View style={styles.moneyIconBox}>
              <Ionicons name="cash" size={20} color="#059669" />
            </View>
            <Text style={styles.financialLabel}>Estimated Rescuer Payout</Text>
          </View>
          <Text style={styles.financialValue}>₹950.00</Text>
        </View>
      </ScrollView>

      {/* Bottom Action Area */}
      <View style={[styles.bottomActions, { paddingBottom: Math.max(insets.bottom, 20) }]}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => navigation.navigate('StartCharging')}
          activeOpacity={0.85}
        >
          <Ionicons name="flash" size={20} color="#FFFFFF" />
          <Text style={styles.acceptButtonText}>ACCEPT RESCUE REQUEST</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={() => navigation.goBack()} activeOpacity={0.7}>
          <Text style={styles.declineButtonText}>Decline Request</Text>
        </TouchableOpacity>
      </View>
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
    paddingBottom: 160,
    gap: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 2,
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  customerAvatarBox: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F1F5F9',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  goldBadge: {
    position: 'absolute',
    bottom: -2,
    right: -2,
    backgroundColor: '#F59E0B',
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  customerName: {
    color: '#0F172A',
    fontSize: 17,
    fontWeight: '800',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 2,
  },
  ratingText: {
    color: '#64748B',
    fontSize: 13,
    fontWeight: '600',
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleButton: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#ECFDF5',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  vehicleCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  vehicleHeader: {
    flexDirection: 'row',
    marginBottom: 12,
  },
  vehiclePill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  verifiedBadgeText: {
    color: '#059669',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  vehicleInfoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleName: {
    fontSize: 18,
    fontWeight: '800',
    color: '#0F172A',
  },
  vehicleColor: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  plateBox: {
    backgroundColor: '#F8FAFC',
    borderWidth: 1.5,
    borderColor: '#0F172A',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  plateText: {
    fontFamily: 'monospace',
    fontWeight: '900',
    fontSize: 13,
    color: '#0F172A',
    letterSpacing: 1,
  },
  logisticsCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    gap: 14,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  addressIconBox: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addressText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0F172A',
  },
  distanceText: {
    fontSize: 13,
    color: '#64748B',
    marginTop: 2,
  },
  instructionsBox: {
    backgroundColor: '#F8FAFC',
    padding: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  instructionsLabel: {
    fontSize: 11,
    fontWeight: '800',
    color: '#64748B',
    letterSpacing: 0.6,
    marginBottom: 4,
  },
  instructionsText: {
    fontSize: 13,
    color: '#334155',
    lineHeight: 18,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
  },
  specCard: {
    width: '48%',
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E2E8F0',
  },
  specLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#64748B',
    marginBottom: 4,
  },
  specValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#0F172A',
  },
  specUnit: {
    fontSize: 13,
    fontWeight: '600',
    color: '#64748B',
  },
  financialCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 18,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#A7F3D0',
  },
  financialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moneyIconBox: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#ECFDF5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  financialLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0F172A',
  },
  financialValue: {
    fontSize: 20,
    fontWeight: '900',
    color: '#059669',
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 20,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#E2E8F0',
    gap: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.06,
    shadowRadius: 10,
    elevation: 8,
  },
  acceptButton: {
    height: 52,
    backgroundColor: '#059669',
    borderRadius: 14,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    shadowColor: '#059669',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 4,
  },
  acceptButtonText: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  declineButton: {
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
  },
  declineButtonText: {
    color: '#64748B',
    fontSize: 14,
    fontWeight: '700',
  },
});

export default RequestDetailsScreen;
