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

export const getNearbyOperators = async (coordinates, maxDistanceInMeters = 20000000) => {
  // Find operators within 20,000km that are ONLINE (Globally available for testing)
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

  return operators;
};
