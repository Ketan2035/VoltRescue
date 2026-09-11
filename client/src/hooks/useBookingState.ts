import { useEffect } from 'react';
import { useNavigation } from '@react-navigation/native';
import { useActiveBooking } from '../contexts/ActiveBookingContext';

export const useBookingState = (initialBookingId?: string) => {
  const { activeBooking, activeBookingId, syncActiveBooking } = useActiveBooking();
  const navigation = useNavigation<any>();

  const currentBookingId = initialBookingId || activeBookingId;
  const status = activeBooking?._id === currentBookingId ? activeBooking.status : null;

  useEffect(() => {
    if (initialBookingId && (!activeBooking || activeBooking._id !== initialBookingId)) {
      syncActiveBooking();
    }
  }, [initialBookingId, activeBooking, syncActiveBooking]);

  return {
    bookingId: currentBookingId,
    activeBooking,
    status,
    syncActiveBooking,
  };
};

export default useBookingState;
