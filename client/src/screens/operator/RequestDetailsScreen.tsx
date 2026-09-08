import React from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView } from 'react-native';
import { colors } from '../../theme/colors';

const RequestDetailsScreen = ({ navigation }: any) => {
  return (
    <SafeAreaView style={styles.container}>
      {/* Top Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <Text style={styles.backIcon}>←</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>JOB REQUEST</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity style={styles.notificationButton}>
            <Text style={styles.notificationIcon}>🔔</Text>
            <View style={styles.notificationDot} />
          </TouchableOpacity>
          <View style={styles.avatarBox}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCyqYySHFE9p0mdaE4q9btd-8FSOjBadMEYxGNF1yvovcA3-ZCm7ge_RxFKBjwDdzJkiODcD7a3eeRRZCpJCig7mrkKLATscg2rNmZRO7-lwhcH_98l23UbMqonuUJ0NdAjx0bZBoVTdYbkRe0FN9kPA71G3BptTzmn7rRv_Wfm2YVUOmcTplrVV08tgb9cRD3kbd597r_quhimT4Q5hY0A8cz8oAOrWfBlSuh98k67vFj5XMcxEyuwTxXFpDsqjYAaCnwG8_7jrHJH' }}
              style={styles.avatar}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Customer Profile Card */}
        <View style={styles.card}>
          <View style={styles.customerLeft}>
            <View style={styles.customerAvatarBox}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC6x5udI1eOO1NCy97JKxJ6XD15dHrNjYrS3Y8COC1ZVQDZefZxqTogj07ZlIV1KkL0XS_SCTlOKPrS_f4YO36k6-C2Cb2yFh6crDkIXexxaLCaYeK9CP-z2x19fQMNoHzBPghcmG0a7uJbfuB2Fo75Ag_UDYiwKJDFqQGWIhAT1bQ2LFFp3tI6zQpanIlXGnZGfM0OkCagVfdwEpIvBgVWkkXwQL7b-7hVdWL-sr9uQYjoOQzw9387JjJtHkf1WCoC0FVth64TDNzO' }}
                style={styles.customerAvatar}
              />
              <View style={styles.goldBadge}>
                <Text style={styles.goldBadgeText}>GOLD</Text>
              </View>
            </View>
            <View>
              <Text style={styles.customerName}>Sarah K.</Text>
              <View style={styles.ratingRow}>
                <Text style={styles.starIcon}>★</Text>
                <Text style={styles.ratingText}>4.9 • Gold Tier</Text>
              </View>
            </View>
          </View>
          <View style={styles.customerActions}>
            <TouchableOpacity style={styles.actionCircleButton}>
              <Text style={styles.actionCircleIcon}>💬</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.actionCircleButton}>
              <Text style={styles.actionCircleIcon}>📞</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Vehicle Identification Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleImageContainer}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuD9PKuS7HtdTb5nXdO00ZJTzP3MwGIj1S9pyCKHoBqzGEQm0_q3_-s9z3S0ly5uI_CfoYzdS5BbUEzZ3x1swsDZRePt-EGjbQH-sVcbDeek5eFIzzODYbsDpVquM_GJT1aP0vD-rpB27T1tQE2Z-MEYGb5M9LJi-01ctVXLlOLvC2OjOlznY4H9Lny4E6Ekgyi6Vk8ptGBCOWaAmMNLH4XxIVvr-Q56HWpYzmSc02I6ePym7La8hn2ZZSU06Pg8nLo1AvnkApuyJ274' }}
              style={styles.vehicleImage}
            />
            <View style={styles.verifiedBadge}>
              <Text style={styles.verifiedBadgeText}>✓ VERIFIED</Text>
            </View>
          </View>
          <View style={styles.vehicleInfoRow}>
            <View>
              <Text style={styles.vehicleLabel}>TESLA MODEL Y</Text>
              <Text style={styles.vehicleColor}>Pearl White</Text>
            </View>
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={styles.vehicleLabel}>PLATE</Text>
              <View style={styles.plateBox}>
                <Text style={styles.plateText}>EV-982-SK</Text>
              </View>
            </View>
          </View>
        </View>

        {/* Logistics & Map Snippet */}
        <View style={styles.logisticsCard}>
          <View style={styles.mapSnippetBox}>
             <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCG_oKlBx14hSHaRN2eugXmGnzY8ByISfruKeNkWVBZv5E7RxJLao3jUQkdXZ3nyEjK-XutIVth_Jw3xbrRKHrWgX5BKOsbwtH60gHBz-BFFICqSmeviQ6WuLVyJ1u3n2BGnrWJPqIeuUhXiOy2tT12NfmkA0WfZH_d5tktpTUVfRgg8PVLpIokttPSJEgFx--gOvPGiyUTkpvsrmlTBql5TfrBVvWEl-9Oi6AofdzasSJEKJcTQlnkQadQBOPLOz8SqXo1skgFriX-' }}
                style={styles.mapSnippetImage}
             />
             <View style={styles.mapSnippetOverlay}>
                <View style={styles.routeContainer}>
                  <View style={styles.dotStart} />
                  <View style={styles.routeLine} />
                  <Text style={styles.pinEnd}>📍</Text>
                </View>
             </View>
          </View>
          <View style={styles.logisticsInfo}>
            <View style={styles.addressRow}>
              <View style={styles.addressIconBox}>
                <Text style={styles.addressIcon}>📍</Text>
              </View>
              <View>
                <Text style={styles.addressText}>1230 Ocean Ave, Unit 4B</Text>
                <Text style={styles.distanceText}>1.2 mi • 6 mins away</Text>
              </View>
            </View>
            <View style={styles.instructionsBox}>
              <Text style={styles.instructionsLabel}>INSTRUCTIONS</Text>
              <Text style={styles.instructionsText}>Parked in rear alley, gate code 1234. Please call upon arrival for gate access.</Text>
            </View>
          </View>
        </View>

        {/* Technical Charging Specs Grid */}
        <View style={styles.specsGrid}>
          <View style={styles.specCard}>
            <View>
              <Text style={styles.specIcon}>🔋</Text>
              <Text style={styles.specLabel}>Current Level</Text>
            </View>
            <Text style={styles.specValue}>12%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '12%', backgroundColor: colors.error }]} />
            </View>
          </View>

          <View style={styles.specCard}>
            <View>
              <Text style={styles.specIcon}>⚡</Text>
              <Text style={styles.specLabel}>Target Level</Text>
            </View>
            <Text style={styles.specValue}>80%</Text>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: '80%', backgroundColor: colors.secondaryFixed }]} />
            </View>
          </View>

          <View style={styles.specCard}>
            <View>
              <Text style={styles.specIcon}>🔌</Text>
              <Text style={styles.specLabel}>Energy Needed</Text>
            </View>
            <Text style={styles.specValue}>58 <Text style={styles.specUnit}>kWh</Text></Text>
          </View>

          <View style={styles.specCard}>
            <View>
              <Text style={styles.specIcon}>🔌</Text>
              <Text style={styles.specLabel}>Connector</Text>
            </View>
            <Text style={styles.specValueSmall}>CCS2 <Text style={styles.specUnitUppercase}>UNIVERSAL</Text></Text>
          </View>
        </View>

        {/* Financial Summary */}
        <View style={styles.financialCard}>
          <View style={styles.financialLeft}>
            <View style={styles.moneyIconBox}>
              <Text style={styles.moneyIcon}>💵</Text>
            </View>
            <Text style={styles.financialLabel}>Estimated Payout</Text>
          </View>
          <Text style={styles.financialValue}>₹42.50</Text>
        </View>

      </ScrollView>

      {/* Bottom Action Area */}
      <View style={styles.bottomActions}>
        <TouchableOpacity 
          style={styles.acceptButton}
          onPress={() => navigation.navigate('StartCharging')}
        >
          <Text style={styles.acceptButtonText}>ACCEPT REQUEST</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.declineButton} onPress={() => navigation.goBack()}>
          <Text style={styles.declineButtonText}>Decline Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    paddingTop: 50,
    backgroundColor: 'rgba(19, 19, 19, 0.8)',
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.1)',
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  backButton: {
    padding: 4,
  },
  backIcon: {
    color: colors.primary,
    fontSize: 24,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 18,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationButton: {
    position: 'relative',
  },
  notificationIcon: {
    fontSize: 20,
    color: colors.onSurfaceVariant,
  },
  notificationDot: {
    position: 'absolute',
    top: -2,
    right: -2,
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryFixed,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(173,198,255,0.2)',
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 160,
    gap: 16,
  },
  card: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  customerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  customerAvatarBox: {
    position: 'relative',
  },
  customerAvatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    borderWidth: 2,
    borderColor: colors.secondaryFixed,
  },
  goldBadge: {
    position: 'absolute',
    bottom: -4,
    right: -4,
    backgroundColor: colors.secondaryFixed,
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 8,
  },
  goldBadgeText: {
    color: colors.onSecondary,
    fontSize: 8,
    fontWeight: 'bold',
  },
  customerName: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  ratingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    marginTop: 4,
  },
  starIcon: {
    color: colors.secondaryFixed,
    fontSize: 14,
  },
  ratingText: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  customerActions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionCircleButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.surfaceContainerHigh,
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionCircleIcon: {
    fontSize: 16,
  },
  vehicleCard: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  vehicleImageContainer: {
    height: 180,
    position: 'relative',
  },
  vehicleImage: {
    ...StyleSheet.absoluteFillObject,
  },
  verifiedBadge: {
    position: 'absolute',
    top: 16,
    left: 16,
    backgroundColor: 'rgba(19,19,19,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(121,255,91,0.3)',
  },
  verifiedBadgeText: {
    color: colors.secondaryFixed,
    fontSize: 10,
    fontWeight: 'bold',
  },
  vehicleInfoRow: {
    padding: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  vehicleLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
    marginBottom: 4,
  },
  vehicleColor: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: '600',
  },
  plateBox: {
    backgroundColor: 'rgba(229,226,225,0.05)',
    borderWidth: 1,
    borderColor: 'rgba(229,226,225,0.1)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 4,
    marginTop: 4,
  },
  plateText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: 'bold',
    fontFamily: 'monospace',
  },
  logisticsCard: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  mapSnippetBox: {
    height: 160,
    position: 'relative',
  },
  mapSnippetImage: {
    ...StyleSheet.absoluteFillObject,
    opacity: 0.8,
  },
  mapSnippetOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
  },
  routeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  dotStart: {
    width: 16,
    height: 16,
    borderRadius: 8,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.8,
    shadowRadius: 10,
  },
  routeLine: {
    width: 80,
    height: 2,
    backgroundColor: 'rgba(121,255,91,0.5)',
    borderStyle: 'dashed',
  },
  pinEnd: {
    fontSize: 32,
    color: colors.secondaryFixed,
  },
  logisticsInfo: {
    padding: 20,
    gap: 16,
  },
  addressRow: {
    flexDirection: 'row',
    gap: 12,
  },
  addressIconBox: {
    backgroundColor: 'rgba(121,255,91,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  addressIcon: {
    fontSize: 16,
  },
  addressText: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '600',
  },
  distanceText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    marginTop: 4,
  },
  instructionsBox: {
    backgroundColor: colors.surfaceContainerLowest,
    padding: 16,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  instructionsLabel: {
    color: colors.secondaryFixed,
    fontSize: 10,
    fontWeight: 'bold',
    marginBottom: 8,
    letterSpacing: 1,
  },
  instructionsText: {
    color: 'rgba(229,226,225,0.8)',
    fontSize: 14,
    lineHeight: 20,
  },
  specsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
  },
  specCard: {
    width: '47%',
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    justifyContent: 'space-between',
    minHeight: 110,
  },
  specIcon: {
    fontSize: 16,
    marginBottom: 8,
  },
  specLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
  },
  specValue: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 8,
  },
  specValueSmall: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 8,
  },
  progressTrack: {
    width: '100%',
    height: 6,
    backgroundColor: colors.surfaceVariant,
    borderRadius: 3,
    marginTop: 12,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
  },
  specUnit: {
    fontSize: 14,
    fontWeight: 'normal',
    color: colors.onSurfaceVariant,
  },
  specUnitUppercase: {
    fontSize: 10,
    fontWeight: 'normal',
    color: colors.onSurfaceVariant,
    textTransform: 'uppercase',
  },
  financialCard: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 20,
    borderLeftWidth: 4,
    borderLeftColor: colors.secondaryFixed,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  financialLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  moneyIconBox: {
    backgroundColor: 'rgba(121,255,91,0.1)',
    padding: 8,
    borderRadius: 8,
  },
  moneyIcon: {
    fontSize: 16,
  },
  financialLabel: {
    color: colors.onSurface,
    fontSize: 16,
    fontWeight: '500',
  },
  financialValue: {
    color: colors.secondaryFixed,
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: -0.5,
  },
  bottomActions: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(19,19,19,0.9)',
    padding: 20,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.05)',
  },
  acceptButton: {
    backgroundColor: colors.secondaryFixed,
    paddingVertical: 16,
    borderRadius: 16,
    alignItems: 'center',
    marginBottom: 12,
  },
  acceptButtonText: {
    color: colors.onSecondary,
    fontSize: 16,
    fontWeight: 'bold',
  },
  declineButton: {
    paddingVertical: 12,
    alignItems: 'center',
  },
  declineButtonText: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    fontWeight: '500',
  }
});

export default RequestDetailsScreen;
