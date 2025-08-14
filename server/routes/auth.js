const express = require('express');
const Joi = require('joi');
const jwt = require('jsonwebtoken');
const { getRedisClient } = require('../config/redis');
const { asyncHandler, ValidationError, AuthenticationError, NotFoundError } = require('../middleware/errorHandler');
const { authMiddleware, authorize } = require('../middleware/auth');
const User = require('../models/User');
const Company = require('../models/Company');
const sendEmail = require('../utils/email');
const logger = require('../utils/logger');

const router = express.Router();

// Validation schemas
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  password: Joi.string().min(8).required(),
  companyName: Joi.string().min(2).max(200).required(),
  industry: Joi.string().valid(
    'technology', 'healthcare', 'finance', 'education', 'manufacturing',
    'retail', 'consulting', 'media', 'real_estate', 'transportation',
    'energy', 'government', 'non_profit', 'other'
  ).required(),
  companySize: Joi.string().valid(
    '1-10', '11-50', '51-200', '201-500', '501-1000', '1001-5000', '5001-10000', '10000+'
  ).required(),
  phone: Joi.string().pattern(/^[\+]?[1-9][\d]{0,15}$/).optional(),
  website: Joi.string().uri().optional(),
});

const loginSchema = Joi.object({
  email: Joi.string().email().required(),
  password: Joi.string().required(),
});

const forgotPasswordSchema = Joi.object({
  email: Joi.string().email().required(),
});

const resetPasswordSchema = Joi.object({
  token: Joi.string().required(),
  password: Joi.string().min(8).required(),
});

const changePasswordSchema = Joi.object({
  currentPassword: Joi.string().required(),
  newPassword: Joi.string().min(8).required(),
});

const refreshTokenSchema = Joi.object({
  refreshToken: Joi.string().required(),
});

/**
 * @swagger
 * /api/auth/register:
 *   post:
 *     summary: Register a new user and company
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - firstName
 *               - lastName
 *               - email
 *               - password
 *               - companyName
 *               - industry
 *               - companySize
 *             properties:
 *               firstName:
 *                 type: string
 *               lastName:
 *                 type: string
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *               companyName:
 *                 type: string
 *               industry:
 *                 type: string
 *               companySize:
 *                 type: string
 *     responses:
 *       201:
 *         description: User and company created successfully
 *       400:
 *         description: Validation error
 *       409:
 *         description: User already exists
 */
router.post('/register', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = registerSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { firstName, lastName, email, password, companyName, industry, companySize, phone, website } = value;

  // Check if user already exists
  const existingUser = await User.findByEmail(email);
  if (existingUser) {
    throw new ValidationError('User with this email already exists');
  }

  // Create company
  const company = new Company({
    name: companyName,
    industry,
    companySize,
    contact: {
      email,
      phone,
    },
    website,
    subscription: {
      plan: 'starter',
      status: 'trial',
      amount: 0, // Free trial
      currency: 'USD',
    },
    enabledFeatures: ['basic_skills_mapping'],
  });

  await company.save();

  // Create user
  const user = new User({
    firstName,
    lastName,
    email,
    password,
    phone,
    company: company._id,
    role: 'admin', // First user is admin
    permissions: [
      'read_users', 'write_users', 'read_skills', 'write_skills',
      'read_analytics', 'manage_company_settings'
    ],
  });

  await user.save();

  // Update company with creator
  company.createdBy = user._id;
  company.updatedBy = user._id;
  await company.save();

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in Redis
  try {
    const redisClient = getRedisClient();
    await redisClient.setEx(`refresh:${user._id}`, 30 * 24 * 60 * 60, refreshToken); // 30 days
  } catch (redisError) {
    logger.warn('Failed to store refresh token in Redis:', redisError.message);
  }

  // Send welcome email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Welcome to SkillSphere!',
      template: 'welcome',
      context: {
        firstName: user.firstName,
        companyName: company.name,
        loginUrl: `${process.env.CLIENT_URL}/login`,
      },
    });
  } catch (emailError) {
    logger.warn('Failed to send welcome email:', emailError.message);
  }

  // Log successful registration
  logger.info(`New user registered: ${user.email} for company: ${company.name}`);

  res.status(201).json({
    success: true,
    message: 'User and company created successfully',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: {
          id: company._id,
          name: company.name,
          industry: company.industry,
          companySize: company.companySize,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: User login
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *               - password
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid credentials
 */
router.post('/login', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = loginSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { email, password } = value;

  // Find user and include password for comparison
  const user = await User.findOne({ email }).select('+password');
  if (!user) {
    throw new AuthenticationError('Invalid credentials');
  }

  // Check if account is locked
  if (user.isLocked()) {
    throw new AuthenticationError('Account is temporarily locked due to multiple failed login attempts');
  }

  // Check if user is active
  if (!user.isActive) {
    throw new AuthenticationError('Account is deactivated');
  }

  // Verify password
  const isPasswordValid = await user.comparePassword(password);
  if (!isPasswordValid) {
    // Increment login attempts
    await user.incLoginAttempts();
    throw new AuthenticationError('Invalid credentials');
  }

  // Reset login attempts on successful login
  if (user.loginAttempts > 0) {
    user.loginAttempts = 0;
    user.lockUntil = undefined;
    await user.save();
  }

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  // Get company information
  const company = await Company.findById(user.company);
  if (!company || !company.isActive) {
    throw new AuthenticationError('Company account is not active');
  }

  // Generate tokens
  const accessToken = user.generateAuthToken();
  const refreshToken = user.generateRefreshToken();

  // Store refresh token in Redis
  try {
    const redisClient = getRedisClient();
    await redisClient.setEx(`refresh:${user._id}`, 30 * 24 * 60 * 60, refreshToken); // 30 days
  } catch (redisError) {
    logger.warn('Failed to store refresh token in Redis:', redisError.message);
  }

  // Log successful login
  logger.info(`User logged in: ${user.email}`);

  res.json({
    success: true,
    message: 'Login successful',
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
        company: {
          id: company._id,
          name: company.name,
          industry: company.industry,
          companySize: company.companySize,
          subscription: company.subscription,
        },
      },
      tokens: {
        accessToken,
        refreshToken,
      },
    },
  });
}));

/**
 * @swagger
 * /api/auth/refresh:
 *   post:
 *     summary: Refresh access token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - refreshToken
 *             properties:
 *               refreshToken:
 *                 type: string
 *     responses:
 *       200:
 *         description: Token refreshed successfully
 *       401:
 *         description: Invalid refresh token
 */
router.post('/refresh', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = refreshTokenSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { refreshToken } = value;

  try {
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    if (decoded.type !== 'refresh') {
      throw new AuthenticationError('Invalid token type');
    }

    // Check if refresh token exists in Redis
    try {
      const redisClient = getRedisClient();
      const storedToken = await redisClient.get(`refresh:${decoded.id}`);
      
      if (!storedToken || storedToken !== refreshToken) {
        throw new AuthenticationError('Refresh token not found or expired');
      }
    } catch (redisError) {
      logger.warn('Redis check failed, proceeding with token verification:', redisError.message);
    }

    // Get user
    const user = await User.findById(decoded.id);
    if (!user || !user.isActive) {
      throw new AuthenticationError('User not found or inactive');
    }

    // Generate new tokens
    const newAccessToken = user.generateAuthToken();
    const newRefreshToken = user.generateRefreshToken();

    // Update refresh token in Redis
    try {
      const redisClient = getRedisClient();
      await redisClient.setEx(`refresh:${user._id}`, 30 * 24 * 60 * 60, newRefreshToken);
    } catch (redisError) {
      logger.warn('Failed to update refresh token in Redis:', redisError.message);
    }

    res.json({
      success: true,
      message: 'Token refreshed successfully',
      data: {
        accessToken: newAccessToken,
        refreshToken: newRefreshToken,
      },
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid refresh token');
    } else if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Refresh token expired');
    }
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/logout:
 *   post:
 *     summary: User logout
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
router.post('/logout', authMiddleware, asyncHandler(async (req, res) => {
  const { user } = req;

  // Remove refresh token from Redis
  try {
    const redisClient = getRedisClient();
    await redisClient.del(`refresh:${user._id}`);
  } catch (redisError) {
    logger.warn('Failed to remove refresh token from Redis:', redisError.message);
  }

  // Blacklist current access token
  try {
    const redisClient = getRedisClient();
    const tokenExp = jwt.decode(req.token).exp;
    const ttl = tokenExp - Math.floor(Date.now() / 1000);
    if (ttl > 0) {
      await redisClient.setEx(`blacklist:${req.token}`, ttl, 'true');
    }
  } catch (redisError) {
    logger.warn('Failed to blacklist token in Redis:', redisError.message);
  }

  logger.info(`User logged out: ${user.email}`);

  res.json({
    success: true,
    message: 'Logout successful',
  });
}));

/**
 * @swagger
 * /api/auth/forgot-password:
 *   post:
 *     summary: Request password reset
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - email
 *             properties:
 *               email:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset email sent
 *       400:
 *         description: Validation error
 */
router.post('/forgot-password', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = forgotPasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { email } = value;

  // Find user
  const user = await User.findByEmail(email);
  if (!user) {
    // Don't reveal if user exists or not
    return res.json({
      success: true,
      message: 'If an account with that email exists, a password reset link has been sent',
    });
  }

  // Generate reset token
  const resetToken = jwt.sign(
    { id: user._id, type: 'password_reset' },
    process.env.JWT_SECRET,
    { expiresIn: '1h' }
  );

  // Save reset token to user
  user.passwordResetToken = resetToken;
  user.passwordResetExpires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour
  await user.save();

  // Send reset email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Reset Request - SkillSphere',
      template: 'password-reset',
      context: {
        firstName: user.firstName,
        resetUrl: `${process.env.CLIENT_URL}/reset-password?token=${resetToken}`,
        expiryHours: 1,
      },
    });

    logger.info(`Password reset email sent to: ${user.email}`);
  } catch (emailError) {
    logger.error('Failed to send password reset email:', emailError);
    throw new Error('Failed to send password reset email');
  }

  res.json({
    success: true,
    message: 'If an account with that email exists, a password reset link has been sent',
  });
}));

/**
 * @swagger
 * /api/auth/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *               - password
 *             properties:
 *               token:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password reset successful
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or expired token
 */
router.post('/reset-password', asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = resetPasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { token, password } = value;

  try {
    // Verify reset token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'password_reset') {
      throw new AuthenticationError('Invalid token type');
    }

    // Find user with valid reset token
    const user = await User.findOne({
      _id: decoded.id,
      passwordResetToken: token,
      passwordResetExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired reset token');
    }

    // Update password
    user.password = password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();

    // Send confirmation email
    try {
      await sendEmail({
        to: user.email,
        subject: 'Password Reset Successful - SkillSphere',
        template: 'password-reset-success',
        context: {
          firstName: user.firstName,
          loginUrl: `${process.env.CLIENT_URL}/login`,
        },
      });
    } catch (emailError) {
      logger.warn('Failed to send password reset confirmation email:', emailError.message);
    }

    logger.info(`Password reset successful for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Password reset successful',
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid reset token');
    } else if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Reset token expired');
    }
    throw error;
  }
}));

/**
 * @swagger
 * /api/auth/change-password:
 *   post:
 *     summary: Change password (authenticated user)
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - currentPassword
 *               - newPassword
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid current password
 */
router.post('/change-password', authMiddleware, asyncHandler(async (req, res) => {
  // Validate request body
  const { error, value } = changePasswordSchema.validate(req.body);
  if (error) {
    throw new ValidationError(error.details[0].message);
  }

  const { currentPassword, newPassword } = value;
  const { user } = req;

  // Verify current password
  const isCurrentPasswordValid = await user.comparePassword(currentPassword);
  if (!isCurrentPasswordValid) {
    throw new AuthenticationError('Current password is incorrect');
  }

  // Update password
  user.password = newPassword;
  await user.save();

  // Send confirmation email
  try {
    await sendEmail({
      to: user.email,
      subject: 'Password Changed - SkillSphere',
      template: 'password-changed',
      context: {
        firstName: user.firstName,
        changeTime: new Date().toLocaleString(),
      },
    });
  } catch (emailError) {
    logger.warn('Failed to send password change confirmation email:', emailError.message);
  }

  logger.info(`Password changed for user: ${user.email}`);

  res.json({
    success: true,
    message: 'Password changed successfully',
  });
}));

/**
 * @swagger
 * /api/auth/me:
 *   get:
 *     summary: Get current user profile
 *     tags: [Authentication]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User profile retrieved successfully
 *       401:
 *         description: Not authenticated
 */
router.get('/me', authMiddleware, asyncHandler(async (req, res) => {
  const { user } = req;

  // Populate company information
  await user.populate('company');

  res.json({
    success: true,
    data: {
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone,
        title: user.title,
        department: user.department,
        role: user.role,
        permissions: user.permissions,
        avatar: user.avatar,
        bio: user.bio,
        location: user.location,
        preferences: user.preferences,
        company: user.company,
        skillsCount: user.skillsCount,
        completedCoursesCount: user.completedCoursesCount,
        lastLogin: user.lastLogin,
        createdAt: user.createdAt,
      },
    },
  });
}));

/**
 * @swagger
 * /api/auth/verify-email:
 *   post:
 *     summary: Verify email with token
 *     tags: [Authentication]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - token
 *             properties:
 *               token:
 *                 type: string
 *     responses:
 *       200:
 *         description: Email verified successfully
 *       400:
 *         description: Validation error
 *       401:
 *         description: Invalid or expired token
 */
router.post('/verify-email', asyncHandler(async (req, res) => {
  const { token } = req.body;

  if (!token) {
    throw new ValidationError('Verification token is required');
  }

  try {
    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    if (decoded.type !== 'email_verification') {
      throw new AuthenticationError('Invalid token type');
    }

    // Find user with valid verification token
    const user = await User.findOne({
      _id: decoded.id,
      emailVerificationToken: token,
      emailVerificationExpires: { $gt: Date.now() },
    });

    if (!user) {
      throw new AuthenticationError('Invalid or expired verification token');
    }

    // Mark email as verified
    user.isEmailVerified = true;
    user.emailVerificationToken = undefined;
    user.emailVerificationExpires = undefined;
    await user.save();

    logger.info(`Email verified for user: ${user.email}`);

    res.json({
      success: true,
      message: 'Email verified successfully',
    });
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      throw new AuthenticationError('Invalid verification token');
    } else if (error.name === 'TokenExpiredError') {
      throw new AuthenticationError('Verification token expired');
    }
    throw error;
  }
}));

module.exports = router; 