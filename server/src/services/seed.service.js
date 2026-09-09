import Operator from '../models/Operator.js';
import Customer from '../models/Customer.js';
import Availability from '../models/Availability.js';
import bcrypt from 'bcryptjs';

export const seedDemoAccounts = async () => {
  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash('pass1234', salt);

    // 1. Seed Demo Operator
    const demoOperatorEmail = 'driver@voltrescue.com';
    let demoOperator = await Operator.findOne({ email: demoOperatorEmail });

    if (!demoOperator) {
      demoOperator = await Operator.create({
        name: 'Demo Driver (Alex)',
        email: demoOperatorEmail,
        phone: '+919876543210',
        passwordHash,
        status: 'ONLINE',
        location: {
          type: 'Point',
          coordinates: [77.5946, 12.9716], // Bangalore center
        },
        vehicleDetails: {
          make: 'VoltRescue Van',
          model: 'Rapid Rescue 80kW',
          capacityKWh: 80,
          supportedConnectors: ['CCS2', 'CHAdeMO', 'Type2'],
        },
      });

      await Availability.create({
        operatorId: demoOperator._id,
        workingDays: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
        workingHours: { start: '00:00', end: '23:59' },
        breakHours: { start: '12:00', end: '13:00' },
        holidays: [],
        unavailableDates: [],
        maximumBookingsPerDay: 50,
      });

      console.log('✅ Demo Operator account seeded: driver@voltrescue.com / pass1234');
    } else {
      await Operator.updateOne(
        { email: demoOperatorEmail },
        { $set: { passwordHash, status: 'ONLINE' } }
      );
      console.log('✅ Demo Operator account password refreshed');
    }

    // 2. Seed Demo Customer
    const demoCustomerEmail = 'customer@voltrescue.com';
    let demoCustomer = await Customer.findOne({ email: demoCustomerEmail });

    if (!demoCustomer) {
      demoCustomer = await Customer.create({
        name: 'Demo EV Owner (Priya)',
        email: demoCustomerEmail,
        phone: '+919123456780',
        passwordHash,
        vehicleDetails: {
          make: 'Tata',
          model: 'Nexon EV Max',
          batteryCapacityKWh: 40.5,
          connectorType: 'CCS2',
        },
      });
      console.log('✅ Demo Customer account seeded: customer@voltrescue.com / pass1234');
    } else {
      await Customer.updateOne(
        { email: demoCustomerEmail },
        { $set: { passwordHash } }
      );
      console.log('✅ Demo Customer account password refreshed');
    }
  } catch (error) {
    console.warn('⚠️ Demo account seeding notice:', error.message);
  }
};
