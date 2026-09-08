import React, { useState } from 'react';
import { View, Text, StyleSheet, SafeAreaView, TouchableOpacity, ScrollView, Switch, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const DriverPreferencesScreen = ({ navigation }: any) => {
  const [pushNotifications, setPushNotifications] = useState(true);
  const [soundAlerts, setSoundAlerts] = useState(true);
  const [autoNavigate, setAutoNavigate] = useState(false);
  const [darkMode, setDarkMode] = useState(true);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Preferences</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Notifications</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="notifications-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.preferenceTitle}>Push Notifications</Text>
                <Text style={styles.preferenceSub}>Receive alerts for new dispatches</Text>
              </View>
            </View>
            <Switch
              value={pushNotifications}
              onValueChange={setPushNotifications}
              trackColor={{ false: '#333', true: colors.secondaryContainer }}
              thumbColor="#fff"
            />
          </View>

          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="volume-high-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.preferenceTitle}>Sound Alerts</Text>
                <Text style={styles.preferenceSub}>Play loud siren on incoming job</Text>
              </View>
            </View>
            <Switch
              value={soundAlerts}
              onValueChange={setSoundAlerts}
              trackColor={{ false: '#333', true: colors.secondaryContainer }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>App Behavior</Text>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="navigate-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.preferenceTitle}>Auto-Navigation</Text>
                <Text style={styles.preferenceSub}>Open maps immediately on accept</Text>
              </View>
            </View>
            <Switch
              value={autoNavigate}
              onValueChange={setAutoNavigate}
              trackColor={{ false: '#333', true: colors.secondaryContainer }}
              thumbColor="#fff"
            />
          </View>
          
          <View style={styles.preferenceItem}>
            <View style={styles.preferenceLeft}>
              <View style={styles.iconBg}>
                <Ionicons name="moon-outline" size={20} color="#fff" />
              </View>
              <View>
                <Text style={styles.preferenceTitle}>Dark Mode</Text>
                <Text style={styles.preferenceSub}>Force dark UI theme</Text>
              </View>
            </View>
            <Switch
              value={darkMode}
              onValueChange={setDarkMode}
              trackColor={{ false: '#333', true: colors.secondaryContainer }}
              thumbColor="#fff"
            />
          </View>
        </View>

        <TouchableOpacity style={styles.aboutButton}>
          <Text style={styles.aboutButtonText}>About VoltRescue Operator App v1.0.0</Text>
        </TouchableOpacity>

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
  backBtn: {
    width: 40,
    alignItems: 'flex-start',
  },
  headerTitle: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 40,
  },
  section: {
    marginBottom: 32,
  },
  sectionTitle: {
    color: colors.secondaryContainer,
    fontSize: 14,
    fontWeight: 'bold',
    textTransform: 'uppercase',
    letterSpacing: 1,
    marginBottom: 16,
  },
  preferenceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#1E1E1E',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#333',
  },
  preferenceLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
    flex: 1,
  },
  iconBg: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#2A2A2A',
    justifyContent: 'center',
    alignItems: 'center',
  },
  preferenceTitle: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 4,
  },
  preferenceSub: {
    color: '#888',
    fontSize: 12,
  },
  aboutButton: {
    padding: 16,
    alignItems: 'center',
    marginTop: 20,
  },
  aboutButtonText: {
    color: '#666',
    fontSize: 12,
  },
});

export default DriverPreferencesScreen;
