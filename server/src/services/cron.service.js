import Booking from '../models/Booking.js';
import { getIO } from '../sockets/socketManager.js';

const TIMEOUT_MS = 5 * 60 * 1000; // 5 minutes

export const startCronJobs = () => {
  console.log('⏰ Starting cron jobs...');
  
  // Sweep stale REQUEST_SENT bookings
  setInterval(async () => {
    try {
      const expirationTime = new Date(Date.now() - TIMEOUT_MS);
      const staleBookings = await Booking.find({
        status: 'REQUEST_SENT',
        'timeline.createdOn': { $lt: expirationTime }
      });

      if (staleBookings.length > 0) {
        console.log(`🧹 Sweeping ${staleBookings.length} stale bookings...`);
        for (const booking of staleBookings) {
          booking.status = 'CANCELLED';
          booking.cancellationReason = 'Timeout: No operator accepted the request in time.';
          booking.timeline.cancelledOn = new Date();
          await booking.save();
          
          const io = getIO();
          io.to(`booking_${booking._id.toString()}`).emit('booking_status_update', {
            bookingId: booking._id,
            status: 'CANCELLED',
            reason: booking.cancellationReason
          });
          io.emit('booking_assigned', { bookingId: booking._id }); // Clears from all operator dashboards
        }
      }
    } catch (err) {
      console.error('Error sweeping stale bookings:', err);
    }
  }, 10000); // Check every 10 seconds
};
