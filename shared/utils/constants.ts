// Shared constants used across frontend, backend, and AI services

// API Constants
export const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5001';
export const AI_SERVICE_URL = process.env.REACT_APP_AI_SERVICE_URL || 'http://localhost:8000';

// Authentication Constants
export const JWT_EXPIRY = '24h';
export const REFRESH_TOKEN_EXPIRY = '7d';
export const PASSWORD_MIN_LENGTH = 8;
export const PASSWORD_MAX_LENGTH = 128;

// User Roles
export const USER_ROLES = {
  ADMIN: 'admin',
  MANAGER: 'manager',
  EMPLOYEE: 'employee',
} as const;

export const USER_PERMISSIONS = {
  // User management
  READ_USERS: 'read:users',
  WRITE_USERS: 'write:users',
  DELETE_USERS: 'delete:users',
  
  // Company management
  READ_COMPANY: 'read:company',
  WRITE_COMPANY: 'write:company',
  
  // Skills management
  READ_SKILLS: 'read:skills',
  WRITE_SKILLS: 'write:skills',
  
  // Learning management
  READ_LEARNING: 'read:learning',
  WRITE_LEARNING: 'write:learning',
  
  // Analytics
  READ_ANALYTICS: 'read:analytics',
  
  // Integrations
  READ_INTEGRATIONS: 'read:integrations',
  WRITE_INTEGRATIONS: 'write:integrations',
  
  // Subscriptions
  READ_SUBSCRIPTIONS: 'read:subscriptions',
  WRITE_SUBSCRIPTIONS: 'write:subscriptions',
} as const;

// Company Sizes
export const COMPANY_SIZES = {
  STARTUP: 'startup',
  SMALL: 'small',
  MEDIUM: 'medium',
  LARGE: 'large',
  ENTERPRISE: 'enterprise',
} as const;

// Subscription Plans
export const SUBSCRIPTION_PLANS = {
  FREE: 'free',
  BASIC: 'basic',
  PROFESSIONAL: 'professional',
  ENTERPRISE: 'enterprise',
} as const;

// Skill Levels
export const SKILL_LEVELS = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
  EXPERT: 'expert',
} as const;

// Course Difficulties
export const COURSE_DIFFICULTIES = {
  BEGINNER: 'beginner',
  INTERMEDIATE: 'intermediate',
  ADVANCED: 'advanced',
} as const;

// File Upload Constants
export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
export const ALLOWED_FILE_TYPES = [
  'image/jpeg',
  'image/png',
  'image/gif',
  'application/pdf',
  'text/csv',
  'application/vnd.ms-excel',
  'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
];

// Pagination Constants
export const DEFAULT_PAGE_SIZE = 10;
export const MAX_PAGE_SIZE = 100;

// Cache Constants
export const CACHE_TTL = {
  SHORT: 5 * 60, // 5 minutes
  MEDIUM: 30 * 60, // 30 minutes
  LONG: 24 * 60 * 60, // 24 hours
} as const;

// Email Templates
export const EMAIL_TEMPLATES = {
  WELCOME: 'welcome',
  PASSWORD_RESET: 'password-reset',
  SKILLS_ANALYSIS: 'skills-analysis',
  LEARNING_REMINDER: 'learning-reminder',
  SUBSCRIPTION_EXPIRY: 'subscription-expiry',
} as const;

// Notification Types
export const NOTIFICATION_TYPES = {
  INFO: 'info',
  SUCCESS: 'success',
  WARNING: 'warning',
  ERROR: 'error',
} as const;

// Integration Types
export const INTEGRATION_TYPES = {
  SLACK: 'slack',
  MICROSOFT_TEAMS: 'microsoft-teams',
  GOOGLE_WORKSPACE: 'google-workspace',
  LINKEDIN: 'linkedin',
  SALESFORCE: 'salesforce',
  HUBSPOT: 'hubspot',
} as const;

// Webhook Events
export const WEBHOOK_EVENTS = {
  USER_CREATED: 'user.created',
  USER_UPDATED: 'user.updated',
  USER_DELETED: 'user.deleted',
  SKILLS_UPDATED: 'skills.updated',
  LEARNING_COMPLETED: 'learning.completed',
  SUBSCRIPTION_CHANGED: 'subscription.changed',
} as const;

// AI Service Constants
export const AI_MODEL_VERSIONS = {
  SKILLS_ANALYZER: '1.0.0',
  SKILLS_CLASSIFIER: '1.0.0',
} as const;

// Error Codes
export const ERROR_CODES = {
  // Authentication errors
  UNAUTHORIZED: 'UNAUTHORIZED',
  INVALID_CREDENTIALS: 'INVALID_CREDENTIALS',
  TOKEN_EXPIRED: 'TOKEN_EXPIRED',
  INSUFFICIENT_PERMISSIONS: 'INSUFFICIENT_PERMISSIONS',
  
  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  INVALID_INPUT: 'INVALID_INPUT',
  
  // Resource errors
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  RESOURCE_ALREADY_EXISTS: 'RESOURCE_ALREADY_EXISTS',
  
  // Business logic errors
  SUBSCRIPTION_REQUIRED: 'SUBSCRIPTION_REQUIRED',
  FEATURE_NOT_AVAILABLE: 'FEATURE_NOT_AVAILABLE',
  
  // System errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  DATABASE_ERROR: 'DATABASE_ERROR',
  
  // AI service errors
  AI_SERVICE_ERROR: 'AI_SERVICE_ERROR',
  MODEL_NOT_FOUND: 'MODEL_NOT_FOUND',
  INSUFFICIENT_DATA: 'INSUFFICIENT_DATA',
} as const;

// HTTP Status Codes
export const HTTP_STATUS = {
  OK: 200,
  CREATED: 201,
  NO_CONTENT: 204,
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  CONFLICT: 409,
  UNPROCESSABLE_ENTITY: 422,
  INTERNAL_SERVER_ERROR: 500,
  SERVICE_UNAVAILABLE: 503,
} as const;

// Theme Constants
export const THEMES = {
  LIGHT: 'light',
  DARK: 'dark',
  SYSTEM: 'system',
} as const;

// Local Storage Keys
export const STORAGE_KEYS = {
  AUTH_TOKEN: 'auth_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_PREFERENCES: 'user_preferences',
  THEME: 'theme',
  LANGUAGE: 'language',
} as const;

// Date Formats
export const DATE_FORMATS = {
  DISPLAY: 'MMM dd, yyyy',
  ISO: 'yyyy-MM-dd',
  DATETIME: 'MMM dd, yyyy HH:mm',
  TIME: 'HH:mm',
} as const;

// Currency
export const CURRENCY = {
  USD: 'USD',
  EUR: 'EUR',
  GBP: 'GBP',
} as const;

// Time Zones
export const TIMEZONES = [
  'UTC',
  'America/New_York',
  'America/Chicago',
  'America/Denver',
  'America/Los_Angeles',
  'Europe/London',
  'Europe/Paris',
  'Europe/Berlin',
  'Asia/Tokyo',
  'Asia/Shanghai',
  'Australia/Sydney',
] as const;
