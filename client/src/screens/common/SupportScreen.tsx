import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const SupportScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Support & Help</Text>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.contactCard}>
          <Text style={styles.contactTitle}>Need Immediate Help?</Text>
          <Text style={styles.contactDesc}>Our rescue team is available 24/7 for emergency EV assistance.</Text>
          <TouchableOpacity style={styles.callBtn}>
            <Ionicons name="call" size={20} color="#000" style={{ marginRight: 8 }} />
            <Text style={styles.callBtnText}>Call 1-800-VOLT-RESCUE</Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.sectionTitle}>Frequently Asked Questions</Text>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How long does it take for a van to arrive?</Text>
          <Text style={styles.faqAnswer}>Typically, our vans arrive within 15-30 minutes depending on traffic and your location in the service area.</Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>What if my connector type isn't listed?</Text>
          <Text style={styles.faqAnswer}>Our vans carry adapters for all major EVs. If you have a highly specialized connector, please call support.</Text>
        </View>

        <View style={styles.faqItem}>
          <Text style={styles.faqQuestion}>How is the price calculated?</Text>
          <Text style={styles.faqAnswer}>Price is a combination of a base dispatch fee, the cost per kWh of energy delivered, and a small service charge based on distance.</Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  contactCard: { backgroundColor: '#1E1E1E', padding: 20, borderRadius: 16, borderWidth: 1, borderColor: colors.secondaryContainer, marginBottom: 32 },
  contactTitle: { color: colors.secondaryContainer, fontSize: 18, fontWeight: 'bold', marginBottom: 8 },
  contactDesc: { color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20, marginBottom: 16 },
  callBtn: { flexDirection: 'row', backgroundColor: colors.secondaryContainer, paddingVertical: 12, borderRadius: 24, justifyContent: 'center', alignItems: 'center' },
  callBtnText: { color: '#000', fontWeight: 'bold', fontSize: 16 },
  sectionTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold', marginBottom: 16 },
  faqItem: { marginBottom: 20, backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333' },
  faqQuestion: { color: '#fff', fontSize: 16, fontWeight: 'bold', marginBottom: 8 },
  faqAnswer: { color: colors.onSurfaceVariant, fontSize: 14, lineHeight: 20 }
});

export default SupportScreen;
