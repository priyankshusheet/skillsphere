const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const { AuthenticationError, AuthorizationError } = require('./errorHandler');
const User = require('../models/User');
const logger = require('../utils/logger');

/**
 * Authentication middleware to verify JWT tokens
 */
const authMiddleware = async (req, res, next) => {
  try {
    let token;

    // Check for token in Authorization header
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    }
    // Check for token in cookies (for web clients)
    else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (!token) {
      throw new AuthenticationError('Access token required');
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Check if token is blacklisted in Redis
    try {
      const redisClient = getRedisClient();
      const isBlacklisted = await redisClient.get(`blacklist:${token}`);
      if (isBlacklisted) {
        throw new AuthenticationError('Token has been revoked');
      }
    } catch (redisError) {
      logger.warn('Redis check failed, proceeding with token verification:', redisError.message);
    }

    // Get user from database
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      throw new AuthenticationError('User not found');
    }

    // Check if user is active
    if (!user.isActive) {
      throw new AuthenticationError('User account is deactivated');
    }

    // Check if user's company is active
    if (user.company && !user.company.isActive) {
      throw new AuthenticationError('Company account is deactivated');
    }

    // Add user to request object
    req.user = user;
    req.token = token;

    // Log successful authentication
    logger.debug(`User authenticated: ${user.email} (${user.id})`);

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      next(new AuthenticationError('Invalid token'));
    } else if (error.name === 'TokenExpiredError') {
      next(new AuthenticationError('Token expired'));
    } else {
      next(error);
    }
  }
};

/**
 * Role-based authorization middleware
 */
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return next(new AuthenticationError('User not authenticated'));
    }

    if (!roles.includes(req.user.role)) {
      logger.security(`Unauthorized access attempt by user ${req.user.id} with role ${req.user.role}`);
      return next(new AuthorizationError('Insufficient permissions'));
    }

    next();
  };
};

/**
 * Company-specific authorization middleware
 */
const authorizeCompany = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('User not authenticated'));
  }

  // Super admins can access all companies
  if (req.user.role === 'super_admin') {
    return next();
  }

  // Check if user belongs to the requested company
  const companyId = req.params.companyId || req.body.companyId || req.query.companyId;
  
  if (companyId && req.user.company?.toString() !== companyId) {
    logger.security(`Company access violation by user ${req.user.id} attempting to access company ${companyId}`);
    return next(new AuthorizationError('Access denied to this company'));
  }

  next();
};

/**
 * Self-access or admin authorization middleware
 */
const authorizeSelfOrAdmin = (req, res, next) => {
  if (!req.user) {
    return next(new AuthenticationError('User not authenticated'));
  }

  const requestedUserId = req.params.userId || req.params.id;
  
  // Allow if user is accessing their own data
  if (requestedUserId === req.user.id.toString()) {
    return next();
  }

  // Allow if user is admin or super admin
  if (['admin', 'super_admin'].includes(req.user.role)) {
    return next();
  }

  logger.security(`Unauthorized user access attempt by user ${req.user.id} to user ${requestedUserId}`);
  return next(new AuthorizationError('Access denied'));
};

/**
 * Optional authentication middleware (doesn't fail if no token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    let token;

    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
      token = req.cookies.token;
    }

    if (token) {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      const user = await User.findById(decoded.id).select('-password');
      if (user && user.isActive) {
        req.user = user;
        req.token = token;
      }
    }
  } catch (error) {
    // Silently ignore token errors for optional auth
    logger.debug('Optional auth failed:', error.message);
  }

  next();
};

/**
 * API key authentication middleware
 */
const apiKeyAuth = async (req, res, next) => {
  try {
    const apiKey = req.headers['x-api-key'] || req.query.apiKey;
    
    if (!apiKey) {
      throw new AuthenticationError('API key required');
    }

    // Validate API key (implement your own validation logic)
    // This could check against a database of valid API keys
    const isValidKey = await validateApiKey(apiKey);
    
    if (!isValidKey) {
      throw new AuthenticationError('Invalid API key');
    }

    // Add API key info to request
    req.apiKey = apiKey;
    next();
  } catch (error) {
    next(error);
  }
};

/**
 * Validate API key (placeholder implementation)
 */
const validateApiKey = async (apiKey) => {
  // Implement your API key validation logic here
  // This could check against a database, external service, etc.
  return process.env.API_KEY === apiKey;
};

module.exports = {
  authMiddleware,
  authorize,
  authorizeCompany,
  authorizeSelfOrAdmin,
  optionalAuth,
  apiKeyAuth,
}; 