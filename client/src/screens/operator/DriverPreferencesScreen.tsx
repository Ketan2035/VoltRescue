import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Switch,
  StatusBar,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const DriverPreferencesScreen = ({ navigation }: any) => {
  const insets = useSafeAreaInsets();
  const topInset = Math.max(insets.top, Platform.OS === 'android' ? (StatusBar.currentHeight || 28) : 0) + 6;
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoNavigate, setAutoNavigate] = useState(false);

  return (
    <View style={[styles.container, { paddingTop: topInset }]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color="#0F172A" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Operator Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={[styles.scrollContent, { paddingBottom: Math.max(insets.bottom, 24) }]} showsVerticalScrollIndicator={false}>
        {/* Section: Notifications */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Dispatch Notifications</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#EFF6FF' }]}>
                <Ionicons name="notifications-outline" size={20} color="#2563EB" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitle}>Push Notifications</Text>
                <Text style={styles.preferenceSub}>Receive real-time alerts for new rescue requests</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#E2E8F0', true: '#059669' }}
              thumbColor="#FFFFFF"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#ECFDF5' }]}>
                <Ionicons name="volume-high-outline" size={20} color="#059669" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitle}>Emergency Siren Alert</Text>
                <Text style={styles.preferenceSub}>Play urgent audible chime on incoming dispatch</Text>
              </View>
            </View>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ false: '#E2E8F0', true: '#059669' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* Section: App Behavior */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Navigation & Operations</Text>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={[styles.iconBg, { backgroundColor: '#FEF3C7' }]}>
                <Ionicons name="navigate-outline" size={20} color="#D97706" />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.preferenceTitle}>Auto-Launch Google Maps</Text>
                <Text style={styles.preferenceSub}>Open turn-by-turn directions immediately upon accept</Text>
              </View>
            </View>
            <Switch
              value={autoNavigate}
              onValueChange={setAutoNavigate}
              trackColor={{ false: '#E2E8F0', true: '#059669' }}
              thumbColor="#FFFFFF"
            />
          </View>
        </View>

        {/* App Info Card */}
        <View style={styles.aboutCard}>
          <Text style={styles.aboutTitle}>VoltRescue Fleet OS</Text>
          <Text style={styles.aboutVersion}>Version 2.4.0 (Build 2026.09)</Text>
          <Text style={styles.aboutSub}>High-Availability Mobile DC Fast Charging Network</Text>
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
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
    marginBottom: 12,
    letterSpacing: -0.2,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#FFFFFF',
    padding: 16,
    borderRadius: 18,
    marginBottom: 10,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 1,
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    flex: 1,
    marginRight: 10,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceTitle: {
    color: '#0F172A',
    fontSize: 15,
    fontWeight: '700',
    marginBottom: 2,
  },
  preferenceSub: {
    color: '#64748B',
    fontSize: 12,
    lineHeight: 16,
  },
  aboutCard: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 18,
    padding: 20,
    borderWidth: 1,
    borderColor: '#E2E8F0',
    marginTop: 12,
  },
  aboutTitle: {
    color: '#0F172A',
    fontSize: 14,
    fontWeight: '800',
  },
  aboutVersion: {
    color: '#059669',
    fontSize: 12,
    fontWeight: '700',
    marginTop: 2,
  },
  aboutSub: {
    color: '#64748B',
    fontSize: 11,
    marginTop: 4,
  },
});

export default DriverPreferencesScreen;
