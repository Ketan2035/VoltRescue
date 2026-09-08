import * as operatorService from '../services/operator.service.js';
import { getIO } from '../sockets/socketManager.js';

export const updateStatus = async (req, res, next) => {
  try {
    const { coordinates, status } = req.body;
    const operatorId = req.operatorId;

    const operator = await operatorService.updateLocationAndStatus(operatorId, coordinates, status);
    
    // Broadcast location to nearby users if online
    if (status === 'ONLINE' && coordinates) {
      const io = getIO();
      // Emitting to a global namespace for simplicity; in prod, use geohashes
      io.emit('operator_location_updated', {
        operatorId: operator._id,
        coordinates,
      });
    }

    res.status(200).json({
      status: 'success',
      data: { operator },
    });
  } catch (error) {
    next(error);
  }
};

export const getNearby = async (req, res, next) => {
  try {
    const { lng, lat } = req.query;
    
    const coordinates = [parseFloat(lng), parseFloat(lat)];
    const operators = await operatorService.getNearbyOperators(coordinates);
    
    res.status(200).json({
      status: 'success',
      results: operators.length,
      data: { operators },
    });
  } catch (error) {
    next(error);
  }
};
