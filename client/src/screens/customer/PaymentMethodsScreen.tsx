import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Platform, StatusBar } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const PaymentMethodsScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;

  return (
    <View style={[styles.safeArea, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={[styles.content, { paddingBottom: Math.max(insets.bottom, 24) }]}>
        <Text style={styles.sectionTitle}>Saved Payment Options</Text>

        {/* UPI AutoPay Card */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#ECFDF5' }]}>
            <Ionicons name="qr-code-outline" size={22} color="#059669" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardText}>Unified Payments Interface (UPI)</Text>
            <Text style={styles.cardSub}>Direct GPay, PhonePe, Paytm QR</Text>
          </View>
          <View style={styles.defaultBadge}>
            <Text style={styles.defaultBadgeText}>DEFAULT</Text>
          </View>
        </View>

        {/* Card Option */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#EFF6FF' }]}>
            <Ionicons name="card-outline" size={22} color="#2563EB" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardText}>•••• •••• •••• 4242</Text>
            <Text style={styles.cardSub}>Visa / Mastercard • Expires 12/28</Text>
          </View>
        </View>

        {/* Cash Option */}
        <View style={styles.card}>
          <View style={[styles.iconBox, { backgroundColor: '#FEF3C7' }]}>
            <Ionicons name="cash-outline" size={22} color="#D97706" />
          </View>
          <View style={styles.cardInfo}>
            <Text style={styles.cardText}>Cash on Service</Text>
            <Text style={styles.cardSub}>Pay operator directly upon charging completion</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn} activeOpacity={0.8}>
          <Ionicons name="add-circle" size={22} color="#059669" />
          <Text style={styles.addBtnText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </View>
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
  content: {
    padding: 20,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 14,
    letterSpacing: -0.2,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 14,
  },
  cardInfo: {
    flex: 1,
  },
  cardText: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
  },
  cardSub: {
    color: '#64748B',
    fontSize: 12,
    marginTop: 2,
  },
  defaultBadge: {
    backgroundColor: '#ECFDF5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#A7F3D0',
  },
  defaultBadgeText: {
    color: '#059669',
    fontSize: 10,
    fontWeight: '800',
  },
  addBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    backgroundColor: '#FFFFFF',
    paddingVertical: 16,
    borderRadius: 16,
    borderWidth: 1.5,
    borderColor: '#E2E8F0',
    borderStyle: 'dashed',
    marginTop: 12,
  },
  addBtnText: {
    color: '#059669',
    fontSize: 14,
    fontWeight: '800',
  },
});

export default PaymentMethodsScreen;
