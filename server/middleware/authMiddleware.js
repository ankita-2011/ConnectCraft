import jwt from 'jsonwebtoken';
import User from '../models/User.js';

export const protect = async (req, res, next) => {
  let token;

  // Retrieve token from cookies or authorization header
  if (req.cookies && req.cookies.token) {
    token = req.cookies.token;
  } else if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  // Ensure token exists
  if (!token) {
    return res.status(401).json({
      status: 'fail',
      message: 'Not authorized to access this route. Please log in.',
    });
  }

  try {
    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Get user and check active status, omit password
    const user = await User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        status: 'fail',
        message: 'The user account associated with this token no longer exists.',
      });
    }

    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        status: 'fail',
        message: 'This account has been suspended. Access denied.',
      });
    }

    // Bind current user to request
    req.user = user;
    next();
  } catch (error) {
    return res.status(401).json({
      status: 'fail',
      message: 'Authentication session expired or invalid. Please login again.',
    });
  }
};

/**
 * Authorize middleware for Role-Based Access Control (RBAC)
 */
export const authorizeRoles = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'fail',
        message: 'Authentication required.',
      });
    }

    const userRole = (req.user.role || 'USER').toUpperCase();
    const normalizedAllowed = allowedRoles.map((r) => r.toUpperCase());

    if (!normalizedAllowed.includes(userRole)) {
      return res.status(403).json({
        status: 'fail',
        message: `Forbidden: Access restricted to ${allowedRoles.join(', ')} roles.`,
      });
    }

    next();
  };
};

