import React, { useState, useEffect, useRef } from 'react';
import { View, Text, StyleSheet, Image, TouchableOpacity, ScrollView, SafeAreaView, Animated, Dimensions } from 'react-native';
import { colors } from '../../theme/colors';

const ChargingControlsScreen = ({ navigation }: any) => {
  const [isCharging, setIsCharging] = useState(true);
  const [power, setPower] = useState(124.5);
  
  const pulseAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isCharging) {
      interval = setInterval(() => {
        const variation = (Math.random() - 0.5) * 2;
        setPower(prev => {
          const newPower = 124.5 + variation;
          return Number(newPower.toFixed(1));
        });
      }, 1500);

      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 0,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();
    } else {
      setPower(0.0);
      pulseAnim.stopAnimation();
      pulseAnim.setValue(0);
    }

    return () => clearInterval(interval);
  }, [isCharging]);

  const toggleCharging = () => {
    setIsCharging(!isCharging);
    if (isCharging) {
       // Stop charging -> simulate moving to bill generation after stopping
       setTimeout(() => {
          navigation.navigate('BillGeneration');
       }, 2000);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Top AppBar */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <TouchableOpacity style={styles.menuButton}>
            <Text style={styles.menuIcon}>☰</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>VOLT DRIVE</Text>
        </View>
        <View style={styles.headerRight}>
          <TouchableOpacity>
            <Text style={styles.notificationIcon}>🔔</Text>
          </TouchableOpacity>
          <View style={styles.avatarBox}>
            <Image 
              source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBaQfSYXZLfb1WRlMyV9f_wMuj7xfnK2MtW_KgsreJDohv30bb9uyreUmWYmnEn27w2Gc63PZhT_waKBwxPG8kUo3MnGyyHYPDEGaFzN-Hw-PKLr8YRCvsQyJRslw-BsgM7iR6AYlJh8IIhQATJOA0lQS1gdt_Vq7MbfWY4_6GN8nwalBH9859O_Iv-x7P66WHAxgY5NyuKWerLFSe2VZkq8HruupaKScJWawhtro9tZcKa3EWjwXF1-85vvcdgk9S80_1HrTN440GP' }}
              style={styles.avatar}
            />
          </View>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Live Energy Visualization */}
        <View style={styles.energyCard}>
          <View style={styles.energyContent}>
            <Animated.View style={[styles.energyIconBox, {
              opacity: isCharging ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [0.6, 1] }) : 1,
              transform: [{ scale: isCharging ? pulseAnim.interpolate({ inputRange: [0, 1], outputRange: [1, 1.05] }) : 1 }]
            }]}>
              <Text style={styles.energyIcon}>⚡</Text>
              <Text style={styles.powerValue}>{power.toFixed(1)} kW</Text>
            </Animated.View>
            
            <View style={styles.activeBadge}>
              <Text style={styles.activeBadgeText}>ACTIVE DISCHARGE FLOW</Text>
            </View>
          </View>

          <View style={styles.syncedPill}>
            <View style={styles.syncedDot} />
            <Text style={styles.syncedText}>SYNCED</Text>
          </View>
        </View>

        {/* Bento Grid Stats */}
        <View style={styles.bentoGrid}>
          <View style={styles.bentoCell}>
            <Text style={styles.bentoIcon}>🔋</Text>
            <Text style={styles.bentoLabel}>BATTERY</Text>
            <Text style={styles.bentoValue}>64%</Text>
          </View>
          <View style={styles.bentoCell}>
            <Text style={styles.bentoIcon}>⚡</Text>
            <Text style={styles.bentoLabel}>VOLTAGE</Text>
            <Text style={styles.bentoValue}>420V</Text>
          </View>
          <View style={styles.bentoCell}>
            <Text style={styles.bentoIcon}>⏱️</Text>
            <Text style={styles.bentoLabel}>REMAINING</Text>
            <Text style={styles.bentoValue}>18m</Text>
          </View>
          <View style={styles.bentoCell}>
            <Text style={styles.bentoIcon}>🌡️</Text>
            <Text style={styles.bentoLabel}>TEMP</Text>
            <Text style={styles.bentoValue}>28°C</Text>
          </View>
        </View>

        {/* Vehicle Context Card */}
        <View style={styles.vehicleCard}>
          <View style={styles.vehicleLeft}>
            <View style={styles.vehicleImageBox}>
              <Image 
                source={{ uri: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDAFCqWZ-5qJCB3ALyOWwXJ1iZwBBFoH_uxoDGLEbplUZIM_t6ULI3KHZ1dEe4WYzghg3E3oKeHfoYR2JWRSMmuAxTU42Nkv3J3-v-4yQWrWXwWbs0mXZbdYNgjtdFGSYVsSPu8Tw7gc_7_M4ysqMlunwM1rhVTn4I140H3IYa4iz0Th9WNWwmz8xFk1TWq4A3S3FkUfre2_TeTDVrukn9PvKVD6cw-fS0iaTsh4MzT94XcyidHPNq5xIueQqvWYMSsAsmsBFyspO4H' }}
                style={styles.vehicleImage}
              />
            </View>
            <View>
              <Text style={styles.vehicleName}>Model S Plaid</Text>
              <Text style={styles.vehicleTarget}>Target Vehicle #8842</Text>
            </View>
          </View>
          <View style={styles.vehicleRight}>
            <Text style={styles.locationLabel}>LOCATION</Text>
            <Text style={styles.locationValue}>Bay 04 • Level G</Text>
          </View>
        </View>

        {/* Control Action */}
        <View style={styles.controlArea}>
          <TouchableOpacity 
            style={styles.mainChargeBtnWrapper} 
            onPress={toggleCharging}
          >
            <View style={[styles.mainChargeBtnOuter, isCharging ? styles.mainChargeBtnOuterActive : styles.mainChargeBtnOuterInactive]}>
              <View style={[styles.mainChargeBtn, isCharging ? styles.mainChargeBtnActive : styles.mainChargeBtnInactive]}>
                <Text style={styles.btnIcon}>{isCharging ? '⏹️' : '▶️'}</Text>
                <Text style={[styles.btnText, isCharging ? styles.btnTextActive : styles.btnTextInactive]}>
                  {isCharging ? 'STOP CHARGING' : 'START CHARGING'}
                </Text>
              </View>
            </View>
          </TouchableOpacity>
          <Text style={styles.controlHint}>
            Press and hold to emergency terminate power flow to the vehicle.
          </Text>
        </View>

      </ScrollView>
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
  menuButton: {
    padding: 4,
  },
  menuIcon: {
    color: colors.primary,
    fontSize: 24,
  },
  headerTitle: {
    color: colors.primary,
    fontSize: 20,
    fontWeight: 'bold',
  },
  headerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  notificationIcon: {
    fontSize: 24,
    color: colors.onSurfaceVariant,
  },
  avatarBox: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.outlineVariant,
    overflow: 'hidden',
  },
  avatar: {
    width: '100%',
    height: '100%',
  },
  scrollContent: {
    padding: 20,
    paddingBottom: 100,
  },
  energyCard: {
    height: 250,
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 24,
    position: 'relative',
  },
  energyContent: {
    alignItems: 'center',
  },
  energyIconBox: {
    alignItems: 'center',
  },
  energyIcon: {
    fontSize: 70,
    color: colors.secondaryFixed,
    marginBottom: 8,
  },
  powerValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.secondaryFixed,
  },
  activeBadge: {
    backgroundColor: 'rgba(121,255,91,0.1)',
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(121,255,91,0.2)',
    marginTop: 16,
  },
  activeBadgeText: {
    color: colors.secondaryFixed,
    fontSize: 12,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  syncedPill: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(19,19,19,0.6)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  syncedDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.secondaryFixed,
    marginRight: 8,
  },
  syncedText: {
    color: colors.onSurface,
    fontSize: 10,
    fontWeight: 'bold',
  },
  bentoGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  bentoCell: {
    width: '47%',
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
  },
  bentoIcon: {
    fontSize: 24,
    color: colors.primary,
    marginBottom: 8,
  },
  bentoLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  bentoValue: {
    color: colors.onSurface,
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: 4,
  },
  vehicleCard: {
    backgroundColor: 'rgba(32,31,31,0.8)',
    borderRadius: 16,
    padding: 24,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.1)',
    marginBottom: 24,
  },
  vehicleLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  vehicleImageBox: {
    width: 64,
    height: 48,
    backgroundColor: colors.surfaceContainer,
    borderRadius: 8,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: colors.outlineVariant,
  },
  vehicleImage: {
    width: '100%',
    height: '100%',
  },
  vehicleName: {
    color: colors.onSurface,
    fontSize: 18,
    fontWeight: 'bold',
  },
  vehicleTarget: {
    color: colors.onSurfaceVariant,
    fontSize: 12,
  },
  vehicleRight: {
    alignItems: 'flex-end',
  },
  locationLabel: {
    color: colors.onSurfaceVariant,
    fontSize: 10,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  locationValue: {
    color: colors.primary,
    fontSize: 16,
    marginTop: 4,
  },
  controlArea: {
    alignItems: 'center',
    gap: 24,
    marginVertical: 24,
  },
  mainChargeBtnWrapper: {
    width: 200,
    height: 200,
    alignItems: 'center',
    justifyContent: 'center',
  },
  mainChargeBtnOuter: {
    width: 200,
    height: 200,
    borderRadius: 100,
    borderWidth: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  mainChargeBtnOuterActive: {
    borderColor: 'rgba(121,255,91,0.2)',
  },
  mainChargeBtnOuterInactive: {
    borderColor: 'rgba(173,198,255,0.2)',
  },
  mainChargeBtn: {
    width: 160,
    height: 160,
    borderRadius: 80,
    justifyContent: 'center',
    alignItems: 'center',
    elevation: 10,
  },
  mainChargeBtnActive: {
    backgroundColor: colors.secondaryFixed,
    shadowColor: colors.secondaryFixed,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  mainChargeBtnInactive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOpacity: 0.6,
    shadowRadius: 20,
  },
  btnIcon: {
    fontSize: 40,
    marginBottom: 8,
  },
  btnText: {
    fontSize: 14,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  btnTextActive: {
    color: colors.onSecondaryFixed,
  },
  btnTextInactive: {
    color: colors.onPrimary,
  },
  controlHint: {
    color: colors.onSurfaceVariant,
    fontSize: 14,
    textAlign: 'center',
    maxWidth: 250,
  }
});

export default ChargingControlsScreen;
