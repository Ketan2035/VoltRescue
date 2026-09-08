import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, SafeAreaView, Platform, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/colors';

const PaymentMethodsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color="#fff" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Payment Methods</Text>
        <View style={{ width: 40 }} />
      </View>

      <View style={styles.content}>
        <Text style={styles.sectionTitle}>Saved Methods</Text>
        
        <View style={styles.card}>
          <Ionicons name="card-outline" size={24} color={colors.onSurfaceVariant} style={styles.icon} />
          <View style={styles.cardInfo}>
            <Text style={styles.cardText}>•••• •••• •••• 4242</Text>
            <Text style={styles.cardSub}>Expires 12/28</Text>
          </View>
        </View>

        <TouchableOpacity style={styles.addBtn}>
          <Ionicons name="add-circle-outline" size={20} color={colors.secondaryContainer} />
          <Text style={styles.addBtnText}>Add New Payment Method</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background, paddingTop: Platform.OS === 'android' ? StatusBar.currentHeight : 0 },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', padding: 16, backgroundColor: '#1A1A1A', borderBottomWidth: 1, borderBottomColor: '#333' },
  backBtn: { width: 40, alignItems: 'flex-start' },
  headerTitle: { color: colors.primary, fontSize: 18, fontWeight: 'bold' },
  content: { padding: 20 },
  sectionTitle: { color: colors.onSurfaceVariant, fontSize: 14, fontWeight: 'bold', marginBottom: 16, textTransform: 'uppercase' },
  card: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#1E1E1E', padding: 16, borderRadius: 12, borderWidth: 1, borderColor: '#333', marginBottom: 16 },
  icon: { marginRight: 16 },
  cardInfo: { flex: 1 },
  cardText: { color: '#fff', fontSize: 16, fontWeight: '500' },
  cardSub: { color: colors.onSurfaceVariant, fontSize: 12, marginTop: 4 },
  addBtn: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12 },
  addBtnText: { color: colors.secondaryContainer, fontSize: 16, fontWeight: 'bold', marginLeft: 8 }
});

export default PaymentMethodsScreen;
