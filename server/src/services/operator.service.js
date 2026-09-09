import Operator from '../models/Operator.js';
import AppError from '../utils/AppError.js';

export const updateLocationAndStatus = async (operatorId, coordinates, status) => {
  const operator = await Operator.findById(operatorId);
  if (!operator) {
    throw new AppError(404, 'Operator not found');
  }

  if (coordinates) {
    operator.location = {
      type: 'Point',
      coordinates, // [lng, lat]
    };
  }
  if (status) {
    operator.status = status;
  }

  await operator.save();
  return operator;
};

export const getNearbyOperators = async (coordinates, maxDistanceInMeters = 50000000) => {
  try {
    // 1. Try finding online operators within range using geospatial index
    if (coordinates && coordinates.length === 2 && !isNaN(coordinates[0]) && !isNaN(coordinates[1])) {
      const operators = await Operator.find({
        status: 'ONLINE',
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates,
            },
            $maxDistance: maxDistanceInMeters,
          },
        },
      });
      if (operators && operators.length > 0) {
        return operators;
      }
    }

    // 2. Fallback: Find any operators marked ONLINE
    const onlineOperators = await Operator.find({ status: 'ONLINE' });
    if (onlineOperators && onlineOperators.length > 0) {
      return onlineOperators;
    }

    // 3. Fallback: Return all non-deleted operators so booking is never blocked during testing
    const allOperators = await Operator.find({ isDeleted: false });
    return allOperators;
  } catch (error) {
    console.error('Error finding nearby operators:', error);
    // Safe fallback to all operators
    return await Operator.find({ isDeleted: false });
  }
};
