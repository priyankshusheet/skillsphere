const Joi = require('joi');

const updateProfileSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  bio: Joi.string().max(500).optional().messages({
    'string.max': 'Bio cannot exceed 500 characters',
  }),
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Title cannot exceed 100 characters',
  }),
  department: Joi.string().max(100).optional().messages({
    'string.max': 'Department cannot exceed 100 characters',
  }),
  dateOfBirth: Joi.date().max('now').optional().messages({
    'date.max': 'Date of birth cannot be in the future',
  }),
  gender: Joi.string().valid('male', 'female', 'other', 'prefer-not-to-say').optional().messages({
    'any.only': 'Please select a valid gender',
  }),
  location: Joi.object({
    city: Joi.string().max(100).required().messages({
      'string.max': 'City cannot exceed 100 characters',
      'any.required': 'City is required',
    }),
    state: Joi.string().max(100).required().messages({
      'string.max': 'State cannot exceed 100 characters',
      'any.required': 'State is required',
    }),
    country: Joi.string().max(100).required().messages({
      'string.max': 'Country cannot exceed 100 characters',
      'any.required': 'Country is required',
    }),
    timezone: Joi.string().optional(),
  }).optional(),
  preferences: Joi.object({
    theme: Joi.string().valid('light', 'dark', 'system').optional().messages({
      'any.only': 'Please select a valid theme',
    }),
    notifications: Joi.boolean().optional(),
    language: Joi.string().optional(),
  }).optional(),
});

const createUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
    'any.required': 'First name is required',
  }),
  lastName: Joi.string().min(2).max(50).required().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
    'any.required': 'Last name is required',
  }),
  email: Joi.string().email().required().messages({
    'string.email': 'Please provide a valid email address',
    'any.required': 'Email is required',
  }),
  password: Joi.string().min(8).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]/).required().messages({
    'string.min': 'Password must be at least 8 characters long',
    'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, one number, and one special character',
    'any.required': 'Password is required',
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Title cannot exceed 100 characters',
  }),
  department: Joi.string().max(100).optional().messages({
    'string.max': 'Department cannot exceed 100 characters',
  }),
  role: Joi.string().valid('admin', 'manager', 'employee').required().messages({
    'any.only': 'Please select a valid role',
    'any.required': 'Role is required',
  }),
  manager: Joi.string().optional(),
  hireDate: Joi.date().max('now').optional().messages({
    'date.max': 'Hire date cannot be in the future',
  }),
});

const updateUserSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'First name must be at least 2 characters long',
    'string.max': 'First name cannot exceed 50 characters',
  }),
  lastName: Joi.string().min(2).max(50).optional().messages({
    'string.min': 'Last name must be at least 2 characters long',
    'string.max': 'Last name cannot exceed 50 characters',
  }),
  phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).optional().messages({
    'string.pattern.base': 'Please provide a valid phone number',
  }),
  title: Joi.string().max(100).optional().messages({
    'string.max': 'Title cannot exceed 100 characters',
  }),
  department: Joi.string().max(100).optional().messages({
    'string.max': 'Department cannot exceed 100 characters',
  }),
  role: Joi.string().valid('admin', 'manager', 'employee').optional().messages({
    'any.only': 'Please select a valid role',
  }),
  manager: Joi.string().optional(),
  isActive: Joi.boolean().optional(),
});

const skillSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Skill name must be at least 2 characters long',
    'string.max': 'Skill name cannot exceed 100 characters',
    'any.required': 'Skill name is required',
  }),
  level: Joi.string().valid('beginner', 'intermediate', 'advanced', 'expert').required().messages({
    'any.only': 'Please select a valid skill level',
    'any.required': 'Skill level is required',
  }),
  experience: Joi.number().min(0).max(50).required().messages({
    'number.min': 'Experience must be at least 0 years',
    'number.max': 'Experience cannot exceed 50 years',
    'any.required': 'Experience is required',
  }),
  confidence: Joi.number().min(0).max(100).required().messages({
    'number.min': 'Confidence must be at least 0',
    'number.max': 'Confidence cannot exceed 100',
    'any.required': 'Confidence is required',
  }),
  category: Joi.string().max(100).optional().messages({
    'string.max': 'Category cannot exceed 100 characters',
  }),
  tags: Joi.array().items(Joi.string().max(50)).optional().messages({
    'array.max': 'Tags cannot exceed 50 characters each',
  }),
});

const updateSkillsSchema = Joi.object({
  skills: Joi.array().items(skillSchema).min(1).required().messages({
    'array.min': 'At least one skill is required',
    'any.required': 'Skills are required',
  }),
});

module.exports = {
  updateProfileSchema,
  createUserSchema,
  updateUserSchema,
  skillSchema,
  updateSkillsSchema,
};
