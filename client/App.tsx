import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import WelcomeScreen from './src/screens/common/WelcomeScreen';
import CustomerDashboardScreen from './src/screens/customer/CustomerDashboardScreen';
import NearbyVansScreen from './src/screens/customer/NearbyVansScreen';
import BookingWizardScreen from './src/screens/customer/BookingWizardScreen';
import DriverAuthScreen from './src/screens/operator/DriverAuthScreen';
import WaitingScreen from './src/screens/customer/WaitingScreen';
import DriverDashboardScreen from './src/screens/operator/DriverDashboardScreen';
import DriverEnRouteScreen from './src/screens/operator/DriverEnRouteScreen';
import CustomerEnRouteScreen from './src/screens/customer/CustomerEnRouteScreen';
import LiveChargingScreen from './src/screens/operator/LiveChargingScreen';
import PaymentScreen from './src/screens/customer/PaymentScreen';
import IncomingRequestsScreen from './src/screens/operator/IncomingRequestsScreen';
import RequestDetailsScreen from './src/screens/operator/RequestDetailsScreen';
import StartChargingScreen from './src/screens/operator/StartChargingScreen';
import ChargingControlsScreen from './src/screens/operator/ChargingControlsScreen';
import BillGenerationScreen from './src/screens/operator/BillGenerationScreen';
import DriverProfileScreen from './src/screens/operator/DriverProfileScreen';
import DriverPreferencesScreen from './src/screens/operator/DriverPreferencesScreen';
import DriverJobHistoryScreen from './src/screens/operator/DriverJobHistoryScreen';
import DriverVehicleScreen from './src/screens/operator/DriverVehicleScreen';
import MyBookingsScreen from './src/screens/customer/MyBookingsScreen';
import PaymentMethodsScreen from './src/screens/customer/PaymentMethodsScreen';
import SettingsScreen from './src/screens/customer/SettingsScreen';
import SupportScreen from './src/screens/common/SupportScreen';
import ChatScreen from './src/screens/common/ChatScreen';
import { SocketProvider } from './src/contexts/SocketContext';
import { ProfileProvider } from './src/contexts/ProfileContext';
import { ActiveBookingProvider } from './src/contexts/ActiveBookingContext';

const Stack = createNativeStackNavigator();

export default function App() {
  return (
    <SafeAreaProvider>
      <ProfileProvider>
        <SocketProvider>
          <ActiveBookingProvider>
            <NavigationContainer>
              <StatusBar style="dark" backgroundColor="#FFFFFF" />
            <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
              <Stack.Screen name="Welcome" component={WelcomeScreen} />
              <Stack.Screen name="CustomerDashboard" component={CustomerDashboardScreen} />
              <Stack.Screen name="BookingWizard" component={BookingWizardScreen} />
              <Stack.Screen name="NearbyVans" component={NearbyVansScreen} />
              <Stack.Screen name="DriverAuth" component={DriverAuthScreen} />
              <Stack.Screen name="Waiting" component={WaitingScreen} />
              <Stack.Screen name="DriverDashboard" component={DriverDashboardScreen} />
              <Stack.Screen name="EnRoute" component={DriverEnRouteScreen} />
              <Stack.Screen name="CustomerEnRoute" component={CustomerEnRouteScreen} options={{ gestureEnabled: false }} />
              <Stack.Screen name="LiveCharging" component={LiveChargingScreen} options={{ gestureEnabled: false }} />
              <Stack.Screen name="Payment" component={PaymentScreen} />
              <Stack.Screen name="IncomingRequests" component={IncomingRequestsScreen} />
              <Stack.Screen name="RequestDetails" component={RequestDetailsScreen} />
              <Stack.Screen name="StartCharging" component={StartChargingScreen} />
              <Stack.Screen name="ChargingControls" component={ChargingControlsScreen} />
              <Stack.Screen name="BillGeneration" component={BillGenerationScreen} />
              <Stack.Screen name="MyBookings" component={MyBookingsScreen} />
              <Stack.Screen name="PaymentMethods" component={PaymentMethodsScreen} />
              <Stack.Screen name="Settings" component={SettingsScreen} />
              <Stack.Screen name="Support" component={SupportScreen} />
              <Stack.Screen name="Chat" component={ChatScreen} />

              {/* Operator Sub Screens */}
              <Stack.Screen name="DriverProfile" component={DriverProfileScreen} />
              <Stack.Screen name="DriverPreferences" component={DriverPreferencesScreen} />
              <Stack.Screen name="DriverJobHistory" component={DriverJobHistoryScreen} />
              <Stack.Screen name="DriverVehicle" component={DriverVehicleScreen} />
            </Stack.Navigator>
            </NavigationContainer>
          </ActiveBookingProvider>
        </SocketProvider>
      </ProfileProvider>
    </SafeAreaProvider>
  );
}
