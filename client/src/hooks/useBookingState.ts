import { useEffect, useState } from 'react';
import { useNavigation, CommonActions } from '@react-navigation/native';
import storage from '../services/storage';
import { useSocket } from '../contexts/SocketContext';

export const useBookingState = (initialBookingId?: string) => {
  const [bookingId, setBookingId] = useState<string | null>(initialBookingId || null);
  const [status, setStatus] = useState<string | null>(null);
  const navigation = useNavigation<any>();
  const { socket } = useSocket();

  useEffect(() => {
    if (!bookingId || !socket) return;

    const roomName = `booking_${bookingId}`;
    socket.emit('join_room', roomName);

    const handleStatusUpdate = async (data: any) => {
      if (data.bookingId === bookingId) {
        setStatus(data.status);
        
        // Check role to determine routing
        let isOperator = false;
        try {
          const token = await storage.getItem('operatorToken');
          isOperator = !!token;
        } catch(e) {}

        // Centralized State Navigation Logic
        switch (data.status) {
          case 'VEHICLE_ASSIGNED':
          case 'DRIVER_STARTED':
            navigation.navigate(isOperator ? 'EnRoute' : 'CustomerEnRoute', { bookingId });
            break;
          case 'ARRIVING':
            navigation.navigate('StartCharging', { bookingId });
            break;
          case 'CHARGING_STARTED':
          case 'CHARGING_IN_PROGRESS':
            navigation.navigate('LiveCharging', { bookingId });
            break;
          case 'CHARGING_COMPLETED':
          case 'INVOICE_GENERATED':
            navigation.navigate('BillGeneration', { bookingId });
            break;
          case 'PAYMENT_PENDING':
          case 'PAYMENT_SUCCESS':
            navigation.navigate('Payment', { bookingId });
            break;
          case 'BOOKING_COMPLETED':
            navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'CustomerDashboard' }],
              })
            );
            break;
          case 'CANCELLED':
             navigation.dispatch(
              CommonActions.reset({
                index: 0,
                routes: [{ name: 'CustomerDashboard' }],
              })
            );
            alert(data.reason || 'Booking was cancelled.');
            break;
        }
      }
    };

    socket.on('booking_status_update', handleStatusUpdate);

    return () => {
      socket.off('booking_status_update', handleStatusUpdate);
      socket.emit('leave_room', roomName);
    };
  }, [bookingId, socket, navigation]);

  return { bookingId, setBookingId, status };
};
