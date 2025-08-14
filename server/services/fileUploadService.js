const AWS = require('aws-sdk');
const multer = require('multer');
const path = require('path');
const crypto = require('crypto');
const logger = require('../utils/logger');

class FileUploadService {
  constructor() {
    this.s3 = new AWS.S3({
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      region: process.env.AWS_REGION,
    });
    
    this.bucketName = process.env.AWS_S3_BUCKET;
    this.initializeMulter();
  }

  initializeMulter() {
    // Configure multer for memory storage
    this.upload = multer({
      storage: multer.memoryStorage(),
      limits: {
        fileSize: 10 * 1024 * 1024, // 10MB limit
      },
      fileFilter: (req, file, cb) => {
        this.validateFile(file, cb);
      },
    });
  }

  validateFile(file, cb) {
    // Allowed file types
    const allowedTypes = [
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'application/vnd.ms-excel',
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'text/csv',
      'text/plain',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only images, PDFs, and Office documents are allowed.'), false);
    }
  }

  async uploadToS3(file, folder = 'uploads') {
    try {
      const fileExtension = path.extname(file.originalname);
      const fileName = this.generateFileName(fileExtension);
      const key = `${folder}/${fileName}`;

      const params = {
        Bucket: this.bucketName,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
        ACL: 'public-read',
        Metadata: {
          originalName: file.originalname,
          uploadedBy: file.userId || 'system',
          uploadedAt: new Date().toISOString(),
        },
      };

      const result = await this.s3.upload(params).promise();
      
      logger.info(`File uploaded successfully: ${result.Location}`);
      
      return {
        url: result.Location,
        key: result.Key,
        fileName: fileName,
        originalName: file.originalname,
        size: file.size,
        mimeType: file.mimetype,
      };
    } catch (error) {
      logger.error('Failed to upload file to S3:', error);
      throw error;
    }
  }

  async uploadAvatar(file, userId) {
    try {
      const avatarFolder = 'avatars';
      const result = await this.uploadToS3(file, avatarFolder);
      
      // Update user's avatar URL in database
      // This would typically be done in the user service
      
      return result;
    } catch (error) {
      logger.error('Failed to upload avatar:', error);
      throw error;
    }
  }

  async uploadDocument(file, documentType, userId) {
    try {
      const documentFolder = `documents/${documentType}`;
      const result = await this.uploadToS3(file, documentFolder);
      
      return {
        ...result,
        documentType,
        userId,
      };
    } catch (error) {
      logger.error('Failed to upload document:', error);
      throw error;
    }
  }

  async uploadCompanyLogo(file, companyId) {
    try {
      const logoFolder = `companies/${companyId}/logos`;
      const result = await this.uploadToS3(file, logoFolder);
      
      return result;
    } catch (error) {
      logger.error('Failed to upload company logo:', error);
      throw error;
    }
  }

  async deleteFromS3(key) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
      };

      await this.s3.deleteObject(params).promise();
      logger.info(`File deleted successfully: ${key}`);
      
      return true;
    } catch (error) {
      logger.error('Failed to delete file from S3:', error);
      throw error;
    }
  }

  async getSignedUrl(key, expiresIn = 3600) {
    try {
      const params = {
        Bucket: this.bucketName,
        Key: key,
        Expires: expiresIn,
      };

      const signedUrl = await this.s3.getSignedUrlPromise('getObject', params);
      return signedUrl;
    } catch (error) {
      logger.error('Failed to generate signed URL:', error);
      throw error;
    }
  }

  async listFiles(prefix = '', maxKeys = 100) {
    try {
      const params = {
        Bucket: this.bucketName,
        Prefix: prefix,
        MaxKeys: maxKeys,
      };

      const result = await this.s3.listObjectsV2(params).promise();
      
      return result.Contents.map(item => ({
        key: item.Key,
        size: item.Size,
        lastModified: item.LastModified,
        url: `https://${this.bucketName}.s3.${process.env.AWS_REGION}.amazonaws.com/${item.Key}`,
      }));
    } catch (error) {
      logger.error('Failed to list files:', error);
      throw error;
    }
  }

  generateFileName(extension) {
    const timestamp = Date.now();
    const randomString = crypto.randomBytes(16).toString('hex');
    return `${timestamp}-${randomString}${extension}`;
  }

  getFileSizeInMB(bytes) {
    return (bytes / (1024 * 1024)).toFixed(2);
  }

  isImageFile(mimeType) {
    return mimeType.startsWith('image/');
  }

  isDocumentFile(mimeType) {
    return mimeType.startsWith('application/') || mimeType === 'text/plain' || mimeType === 'text/csv';
  }

  // Middleware for handling file uploads
  getUploadMiddleware(fieldName, maxCount = 1) {
    return this.upload.array(fieldName, maxCount);
  }

  getSingleUploadMiddleware(fieldName) {
    return this.upload.single(fieldName);
  }

  // Error handling middleware
  handleUploadError(error, req, res, next) {
    if (error instanceof multer.MulterError) {
      if (error.code === 'LIMIT_FILE_SIZE') {
        return res.status(400).json({
          success: false,
          message: 'File too large. Maximum size is 10MB.',
        });
      }
      if (error.code === 'LIMIT_FILE_COUNT') {
        return res.status(400).json({
          success: false,
          message: 'Too many files. Please upload fewer files.',
        });
      }
      if (error.code === 'LIMIT_UNEXPECTED_FILE') {
        return res.status(400).json({
          success: false,
          message: 'Unexpected file field.',
        });
      }
    }

    if (error.message.includes('Invalid file type')) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    logger.error('File upload error:', error);
    return res.status(500).json({
      success: false,
      message: 'File upload failed. Please try again.',
    });
  }

  // Utility methods for file processing
  async resizeImage(buffer, width, height) {
    // This would typically use a library like sharp
    // For now, we'll return the original buffer
    return buffer;
  }

  async compressImage(buffer, quality = 80) {
    // This would typically use a library like sharp
    // For now, we'll return the original buffer
    return buffer;
  }

  async extractTextFromPDF(buffer) {
    // This would typically use a library like pdf-parse
    // For now, we'll return an empty string
    return '';
  }

  async extractTextFromDocument(buffer, mimeType) {
    // This would typically use libraries like mammoth for Word docs
    // For now, we'll return an empty string
    return '';
  }
}

module.exports = new FileUploadService();
