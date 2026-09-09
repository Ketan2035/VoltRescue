const API_BASE = 'http://localhost:5000/api/v1';

async function runBookingLifecycleTest() {
  console.log('🚀 Starting Full End-to-End Booking Lifecycle Simulation...\n');
  let testsPassed = 0;
  let testsTotal = 0;

  async function assert(desc, fn) {
    testsTotal++;
    try {
      await fn();
      console.log(`✅ [PASS] ${desc}`);
      testsPassed++;
    } catch (err) {
      console.error(`❌ [FAIL] ${desc}:`, err.message);
    }
  }

  let guestDeviceId = `dev_${Date.now()}`;
  let opToken = '';
  let bookingId = '';
  let bookingOtp = '';

  // 1. Guest Session
  await assert('1. Create Customer Guest Session', async () => {
    const res = await fetch(`${API_BASE}/auth/guest`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ deviceId: guestDeviceId }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.session?.deviceId) {
      throw new Error(`Failed to create guest session: ${JSON.stringify(data)}`);
    }
    guestDeviceId = data.data.session.deviceId;
  });

  // 2. Operator Login
  await assert('2. Rescue Operator Login (driver@voltrescue.com)', async () => {
    const res = await fetch(`${API_BASE}/auth/operator/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'driver@voltrescue.com',
        password: 'pass1234',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.token) {
      throw new Error(`Operator login failed: ${JSON.stringify(data)}`);
    }
    opToken = data.data.token;
  });

  // 3. Customer Creates Emergency Booking
  await assert('3. Customer Creates Booking Request', async () => {
    const res = await fetch(`${API_BASE}/bookings`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-session-id': guestDeviceId,
      },
      body: JSON.stringify({
        date: new Date().toISOString().split('T')[0],
        timeSlot: { start: '10:00', end: '11:00' },
        userLocation: {
          coordinates: [77.5946, 12.9716],
          address: 'MG Road, Bangalore',
        },
        personalInfo: { name: 'Priya Sharma', phone: '+919876543210' },
        connectorType: 'CCS2',
        chargingType: 'Fast',
        batteryPercentage: { current: 15, target: 100 },
        requestedEnergyKWh: 30,
        estimatedDuration: 45,
        travelDistance: 4.2,
        paymentMethod: 'Online',
      }),
    });
    const data = await res.json();
    if (!res.ok || !data.data?.booking?._id) {
      throw new Error(`Booking creation failed: ${JSON.stringify(data)}`);
    }
    bookingId = data.data.booking._id;
    bookingOtp = data.data.booking.otp;
    console.log(`   ↳ Booking ID: ${bookingId} | Generated OTP: ${bookingOtp} | Status: ${data.data.booking.status}`);
  });

  // 4. Operator Fetches Booking Details
  await assert('4. Operator Fetches Booking Details', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?._id !== bookingId) {
      throw new Error(`Failed to fetch details: ${JSON.stringify(data)}`);
    }
  });

  // 5. Operator Accepts Request (Status -> VEHICLE_ASSIGNED)
  await assert('5. Operator Accepts Booking (VEHICLE_ASSIGNED)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ status: 'VEHICLE_ASSIGNED' }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'VEHICLE_ASSIGNED') {
      throw new Error(`Failed to assign operator: ${JSON.stringify(data)}`);
    }
  });

  // 6. Operator Arrives (Status -> ARRIVING)
  await assert('6. Operator Arrives at Breakdown Site (ARRIVING)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ status: 'ARRIVING' }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'ARRIVING') {
      throw new Error(`Failed to update to ARRIVING: ${JSON.stringify(data)}`);
    }
  });

  // 7. OTP Verification (Status -> OTP_VERIFIED)
  await assert('7. Operator Verifies Customer OTP (OTP_VERIFIED)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        status: 'OTP_VERIFIED',
        otp: bookingOtp,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'OTP_VERIFIED') {
      throw new Error(`Failed to verify OTP: ${JSON.stringify(data)}`);
    }
  });

  // 8. Start Charging Session (Status -> CHARGING_STARTED)
  await assert('8. Operator Starts Charging Flow (CHARGING_STARTED)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ status: 'CHARGING_STARTED' }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'CHARGING_STARTED') {
      throw new Error(`Failed to start charging: ${JSON.stringify(data)}`);
    }
  });

  // 9. Stop Charging Session (Status -> CHARGING_COMPLETED)
  await assert('9. Operator Stops Charging (CHARGING_COMPLETED with 30 kWh)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        status: 'CHARGING_COMPLETED',
        deliveredEnergyKWh: 30,
      }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'CHARGING_COMPLETED') {
      throw new Error(`Failed to complete charging: ${JSON.stringify(data)}`);
    }
    console.log(`   ↳ Total Bill Calculated: ₹${data.data.booking.pricing?.totalAmount}`);
  });

  // 10. Generate Invoice (Status -> INVOICE_GENERATED)
  await assert('10. Operator Dispatches Invoice (INVOICE_GENERATED)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ status: 'INVOICE_GENERATED' }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'INVOICE_GENERATED') {
      throw new Error(`Failed to generate invoice: ${JSON.stringify(data)}`);
    }
  });

  // 11. Customer Payment (Status -> PAYMENT_SUCCESS & COMPLETED)
  await assert('11. Customer Settles Payment (PAYMENT_SUCCESS -> COMPLETED)', async () => {
    const res1 = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-session-id': guestDeviceId,
      },
      body: JSON.stringify({ status: 'PAYMENT_SUCCESS' }),
    });
    const data1 = await res1.json();
    if (!res1.ok || data1.data?.booking?.status !== 'PAYMENT_SUCCESS') {
      throw new Error(`Failed to process payment: ${JSON.stringify(data1)}`);
    }

    const res2 = await fetch(`${API_BASE}/bookings/${bookingId}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-session-id': guestDeviceId,
      },
      body: JSON.stringify({ status: 'COMPLETED' }),
    });
    const data2 = await res2.json();
    if (!res2.ok || data2.data?.booking?.status !== 'COMPLETED') {
      throw new Error(`Failed to complete booking: ${JSON.stringify(data2)}`);
    }
  });

  // 12. Customer Submits Rating & Review (POST /bookings/:bookingId/rating)
  await assert('12. Customer Submits 5-Star Review (POST /rating -> REVIEW_SUBMITTED)', async () => {
    const res = await fetch(`${API_BASE}/bookings/${bookingId}/rating`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-guest-session-id': guestDeviceId,
      },
      body: JSON.stringify({
        score: 5,
        review: '⚡ Rapid Rescue - Excellent on-site charging support!',
      }),
    });
    const data = await res.json();
    if (!res.ok || data.data?.booking?.status !== 'REVIEW_SUBMITTED' || data.data?.booking?.rating?.score !== 5) {
      throw new Error(`Failed to submit rating: ${JSON.stringify(data)}`);
    }
  });

  console.log(`\n======================================================`);
  console.log(`🏁 Full Booking Lifecycle Results: ${testsPassed}/${testsTotal} passed`);
  console.log(`======================================================\n`);

  if (testsPassed !== testsTotal) {
    process.exit(1);
  }
}

runBookingLifecycleTest();
