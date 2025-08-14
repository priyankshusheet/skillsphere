const Joi = require('joi');

const updateCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).optional().messages({
    'string.min': 'Company name must be at least 2 characters long',
    'string.max': 'Company name cannot exceed 100 characters',
  }),
  industry: Joi.string().optional(),
  website: Joi.string().uri().optional().messages({
    'string.uri': 'Please provide a valid website URL',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  location: Joi.object({
    address: Joi.string().max(200).required().messages({
      'string.max': 'Address cannot exceed 200 characters',
      'any.required': 'Address is required',
    }),
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
  }).optional(),
  contact: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Contact email is required',
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Contact phone is required',
    }),
  }).optional(),
  settings: Joi.object({
    features: Joi.object({
      aiServices: Joi.boolean().optional(),
      advancedAnalytics: Joi.boolean().optional(),
      customBranding: Joi.boolean().optional(),
    }).optional(),
  }).optional(),
});

const createCompanySchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Company name must be at least 2 characters long',
    'string.max': 'Company name cannot exceed 100 characters',
    'any.required': 'Company name is required',
  }),
  industry: Joi.string().required().messages({
    'any.required': 'Industry is required',
  }),
  size: Joi.string().valid('startup', 'small', 'medium', 'large', 'enterprise').required().messages({
    'any.only': 'Please select a valid company size',
    'any.required': 'Company size is required',
  }),
  website: Joi.string().uri().optional().messages({
    'string.uri': 'Please provide a valid website URL',
  }),
  description: Joi.string().max(1000).optional().messages({
    'string.max': 'Description cannot exceed 1000 characters',
  }),
  location: Joi.object({
    address: Joi.string().max(200).required().messages({
      'string.max': 'Address cannot exceed 200 characters',
      'any.required': 'Address is required',
    }),
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
  }).required().messages({
    'any.required': 'Location is required',
  }),
  contact: Joi.object({
    email: Joi.string().email().required().messages({
      'string.email': 'Please provide a valid email address',
      'any.required': 'Contact email is required',
    }),
    phone: Joi.string().pattern(/^\+?[\d\s\-\(\)]+$/).required().messages({
      'string.pattern.base': 'Please provide a valid phone number',
      'any.required': 'Contact phone is required',
    }),
  }).required().messages({
    'any.required': 'Contact information is required',
  }),
});

const integrationSchema = Joi.object({
  name: Joi.string().required().messages({
    'any.required': 'Integration name is required',
  }),
  enabled: Joi.boolean().required().messages({
    'any.required': 'Integration status is required',
  }),
  config: Joi.object().optional(),
});

const updateIntegrationsSchema = Joi.object({
  integrations: Joi.array().items(integrationSchema).optional(),
});

const webhookSchema = Joi.object({
  name: Joi.string().min(2).max(100).required().messages({
    'string.min': 'Webhook name must be at least 2 characters long',
    'string.max': 'Webhook name cannot exceed 100 characters',
    'any.required': 'Webhook name is required',
  }),
  url: Joi.string().uri().required().messages({
    'string.uri': 'Please provide a valid webhook URL',
    'any.required': 'Webhook URL is required',
  }),
  events: Joi.array().items(Joi.string()).min(1).required().messages({
    'array.min': 'At least one event must be selected',
    'any.required': 'Events are required',
  }),
  isActive: Joi.boolean().optional(),
});

const createWebhookSchema = webhookSchema;
const updateWebhookSchema = webhookSchema.keys({
  name: Joi.string().min(2).max(100).optional(),
  url: Joi.string().uri().optional(),
  events: Joi.array().items(Joi.string()).min(1).optional(),
});

module.exports = {
  updateCompanySchema,
  createCompanySchema,
  integrationSchema,
  updateIntegrationsSchema,
  webhookSchema,
  createWebhookSchema,
  updateWebhookSchema,
};
