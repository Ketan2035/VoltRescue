import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import api from '../services/api';
import storage from '../services/storage';
import { useSocket } from './SocketContext';

export interface ActiveBookingData {
  _id: string;
  status: string;
  paymentStatus?: string;
  version?: number;
  customerId?: any;
  operatorId?: any;
  userLocation?: {
    coordinates: [number, number];
    address?: string;
  };
  pricing?: {
    totalAmount?: number;
    baseFare?: number;
    energyCost?: number;
    tax?: number;
  };
  requestedEnergyKWh?: number;
  deliveredEnergyKWh?: number;
  vehicleModel?: string;
  connectorType?: string;
  chargingType?: string;
  otp?: string;
  timeline?: any;
  [key: string]: any;
}

interface ActiveBookingContextType {
  activeBooking: ActiveBookingData | null;
  activeBookingId: string | null;
  isSyncing: boolean;
  syncActiveBooking: () => Promise<ActiveBookingData | null>;
  setActiveBookingData: (booking: ActiveBookingData | null) => void;
  clearActiveBooking: () => Promise<void>;
  getMatchingScreen: (isOperator?: boolean) => { screenName: string; params: any } | null;
}

const ActiveBookingContext = createContext<ActiveBookingContextType>({
  activeBooking: null,
  activeBookingId: null,
  isSyncing: false,
  syncActiveBooking: async () => null,
  setActiveBookingData: () => {},
  clearActiveBooking: async () => {},
  getMatchingScreen: () => null,
});

export const useActiveBooking = () => useContext(ActiveBookingContext);

const TERMINAL_STATUSES = [
  'COMPLETED',
  'BOOKING_COMPLETED',
  'REVIEW_SUBMITTED',
  'CANCELLED',
  'REJECTED',
  'EXPIRED',
  'REFUNDED',
];

export const ActiveBookingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeBooking, setActiveBooking] = useState<ActiveBookingData | null>(null);
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const { socket, joinRoom, leaveRoom } = useSocket();
  const currentRoomRef = useRef<string | null>(null);
  const appStateRef = useRef<AppStateStatus>(AppState.currentState);

  const activeBookingId = activeBooking?._id || null;

  // 1. Cache to Storage
  const persistBookingCache = async (booking: ActiveBookingData | null) => {
    try {
      if (booking && !TERMINAL_STATUSES.includes(booking.status)) {
        await storage.setItem('activeBookingId', booking._id);
        await storage.setItem('activeBookingCache', JSON.stringify(booking));
      } else {
        await storage.deleteItem('activeBookingId');
        await storage.deleteItem('activeBookingCache');
      }
    } catch (e) {
      console.warn('[ActiveBooking] Cache persist error:', e);
    }
  };

  const setActiveBookingData = useCallback((booking: ActiveBookingData | null) => {
    setActiveBooking(booking);
    persistBookingCache(booking);
  }, []);

  const clearActiveBooking = useCallback(async () => {
    if (currentRoomRef.current) {
      leaveRoom(currentRoomRef.current);
      currentRoomRef.current = null;
    }
    setActiveBooking(null);
    await storage.deleteItem('activeBookingId');
    await storage.deleteItem('activeBookingCache');
  }, [leaveRoom]);

  // 2. Authoritative Fetch from Server
  const syncActiveBooking = useCallback(async (): Promise<ActiveBookingData | null> => {
    try {
      setIsSyncing(true);
      console.log('🔄 [SYNC] Fetching authoritative active booking from backend...');
      const response = await api.get('/bookings/active');
      const serverBooking = response.data?.data?.booking;

      if (serverBooking && !TERMINAL_STATUSES.includes(serverBooking.status)) {
        console.log(`✅ [SYNC] Active booking found on server: ${serverBooking._id} (Status: ${serverBooking.status}, Version: ${serverBooking.version || 1})`);
        setActiveBooking(serverBooking);
        persistBookingCache(serverBooking);

        // Join room
        const roomName = `booking_${serverBooking._id}`;
        if (currentRoomRef.current !== roomName) {
          if (currentRoomRef.current) leaveRoom(currentRoomRef.current);
          currentRoomRef.current = roomName;
          joinRoom(roomName);
        }

        return serverBooking;
      } else {
        console.log('ℹ️ [SYNC] No active booking on server.');
        if (activeBooking && !TERMINAL_STATUSES.includes(activeBooking.status)) {
          clearActiveBooking();
        }
        return null;
      }
    } catch (error: any) {
      console.warn('⚠️ [SYNC] Failed to fetch active booking from server:', error?.message);
      // Fallback to local storage cache if network fails
      try {
        const cached = await storage.getItem('activeBookingCache');
        if (cached) {
          const parsed = JSON.parse(cached);
          if (!TERMINAL_STATUSES.includes(parsed.status)) {
            console.log('📦 [SYNC] Restored active booking from local cache fallback:', parsed._id);
            setActiveBooking(parsed);
            return parsed;
          }
        }
      } catch {}
      return null;
    } finally {
      setIsSyncing(false);
    }
  }, [activeBooking, clearActiveBooking, joinRoom, leaveRoom]);

  // 3. Initial Boot Sync
  useEffect(() => {
    const initBoot = async () => {
      // Fast load from local storage
      const cached = await storage.getItem('activeBookingCache');
      if (cached) {
        try {
          const parsed = JSON.parse(cached);
          if (!TERMINAL_STATUSES.includes(parsed.status)) {
            setActiveBooking(parsed);
          }
        } catch {}
      }
      // Reconcile with authoritative server
      await syncActiveBooking();
    };
    initBoot();
  }, []);

  // 4. AppState Background ➔ Foreground Lifecycle Listener
  useEffect(() => {
    const subscription = AppState.addEventListener('change', (nextAppState) => {
      if (
        appStateRef.current.match(/inactive|background/) &&
        nextAppState === 'active'
      ) {
        console.log('📱 [APPSTATE] App returned to foreground — syncing active booking...');
        syncActiveBooking();
      }
      appStateRef.current = nextAppState;
    });

    return () => {
      subscription.remove();
    };
  }, [syncActiveBooking]);

  // 5. Real-time Socket Event Subscription
  useEffect(() => {
    if (!socket) return;

    const handleStatusUpdate = (data: any) => {
      console.log('⚡ [SOCKET EVENT] booking_status_update received:', data);
      const incomingBookingId = data.bookingId || data.booking?._id;
      if (!incomingBookingId) return;

      setActiveBooking((prev) => {
        if (prev && prev._id === incomingBookingId) {
          // Version guard against stale out-of-order events
          const currentVersion = prev.version || 1;
          const incomingVersion = data.version || data.booking?.version || currentVersion;

          if (incomingVersion < currentVersion) {
            console.log(`[SOCKET EVENT] Ignored stale event (Incoming v${incomingVersion} < Current v${currentVersion})`);
            return prev;
          }

          const updated: ActiveBookingData = {
            ...prev,
            ...(data.booking || {}),
            status: data.status || data.booking?.status || prev.status,
            paymentStatus: data.paymentStatus || data.booking?.paymentStatus || prev.paymentStatus,
            version: incomingVersion,
          };

          persistBookingCache(updated);
          return updated;
        } else if (data.booking) {
          persistBookingCache(data.booking);
          return data.booking;
        }
        return prev;
      });
    };

    socket.on('booking_status_update', handleStatusUpdate);

    return () => {
      socket.off('booking_status_update', handleStatusUpdate);
    };
  }, [socket]);

  // 6. Matching Screen Calculator
  const getMatchingScreen = useCallback((isOperatorParam?: boolean): { screenName: string; params: any } | null => {
    if (!activeBooking || !activeBooking.status) return null;
    const status = activeBooking.status;
    const bookingId = activeBooking._id;
    const isOperator = isOperatorParam ?? !!activeBooking.operatorId;

    switch (status) {
      case 'PENDING':
      case 'CREATED':
      case 'SEARCHING_OPERATOR':
      case 'REQUEST_SENT':
        return isOperator ? null : { screenName: 'Waiting', params: { bookingId } };

      case 'OPERATOR_ASSIGNED':
      case 'OPERATOR_ACCEPTED':
      case 'VEHICLE_ASSIGNED':
      case 'DRIVER_STARTED':
      case 'OPERATOR_NAVIGATING':
        return { screenName: isOperator ? 'EnRoute' : 'CustomerEnRoute', params: { bookingId } };

      case 'ARRIVING':
      case 'OPERATOR_ARRIVED':
      case 'WAITING_TO_START_CHARGING':
      case 'OTP_VERIFIED':
        return { screenName: 'StartCharging', params: { bookingId, isOperator } };

      case 'CHARGING_STARTED':
      case 'CHARGING_IN_PROGRESS':
        return { screenName: isOperator ? 'ChargingControls' : 'LiveCharging', params: { bookingId } };

      case 'CHARGING_COMPLETED':
      case 'INVOICE_GENERATED':
      case 'PAYMENT_PENDING':
        return { screenName: isOperator ? 'BillGeneration' : 'Payment', params: { bookingId } };

      case 'PAYMENT_SUCCESS':
      case 'COMPLETED':
      case 'BOOKING_COMPLETED':
        return isOperator ? null : { screenName: 'Payment', params: { bookingId } };

      default:
        return null;
    }
  }, [activeBooking]);

  return (
    <ActiveBookingContext.Provider
      value={{
        activeBooking,
        activeBookingId,
        isSyncing,
        syncActiveBooking,
        setActiveBookingData,
        clearActiveBooking,
        getMatchingScreen,
      }}
    >
      {children}
    </ActiveBookingContext.Provider>
  );
};
