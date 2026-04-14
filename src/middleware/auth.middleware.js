import Session from '../models/Session.model.js';
import User from '../models/User.model.js';
import apiResponse from '../utils/apiResponse.js';

const authMiddleware = async (req, res, next) => {
  try {
    const token = req.cookies.emc_session;

    if (!token) {
      return apiResponse(res, 401, false, 'Not authorized, no token provided');
    }

    const session = await Session.findOne({ token }).populate('userId');

    if (!session || session.expiresAt < new Date()) {
      if (session) await Session.deleteOne({ _id: session._id });
      res.clearCookie('emc_session');
      return apiResponse(res, 401, false, 'Session expired or invalid');
    }

    req.user = session.userId;
    next();
  } catch (error) {
    return apiResponse(res, 500, false, 'Auth middleware error', error.message);
  }
};

export default authMiddleware;
