const axios = require('axios');
const logger = require('../utils/logger');

class AIIntegrationService {
  constructor() {
    this.aiServiceUrl = process.env.AI_SERVICE_URL || 'http://localhost:8000';
    this.timeout = 30000; // 30 seconds
  }

  // Initialize axios instance for AI service
  getAIClient() {
    return axios.create({
      baseURL: this.aiServiceUrl,
      timeout: this.timeout,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  // Skills Assessment
  async assessSkills(userData, skillsData) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/assess-skills', {
        user: userData,
        skills: skillsData,
      });

      logger.info(`Skills assessment completed for user: ${userData.email}`);
      return response.data;
    } catch (error) {
      logger.error('Failed to assess skills:', error);
      throw new Error('Skills assessment failed. Please try again.');
    }
  }

  // Skills Gap Analysis
  async analyzeSkillGaps(userSkills, jobRequirements, marketData) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/analyze-gaps', {
        userSkills,
        jobRequirements,
        marketData,
      });

      logger.info('Skill gap analysis completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze skill gaps:', error);
      throw new Error('Skill gap analysis failed. Please try again.');
    }
  }

  // Learning Recommendations
  async getLearningRecommendations(userProfile, skillGaps, preferences) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/learning-recommendations', {
        userProfile,
        skillGaps,
        preferences,
      });

      logger.info('Learning recommendations generated');
      return response.data;
    } catch (error) {
      logger.error('Failed to get learning recommendations:', error);
      throw new Error('Learning recommendations failed. Please try again.');
    }
  }

  // Market Demand Analysis
  async analyzeMarketDemand(skills, location, industry) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/market-demand', {
        skills,
        location,
        industry,
      });

      logger.info('Market demand analysis completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze market demand:', error);
      throw new Error('Market demand analysis failed. Please try again.');
    }
  }

  // Career Path Prediction
  async predictCareerPath(userProfile, currentRole, targetRole) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/career-prediction', {
        userProfile,
        currentRole,
        targetRole,
      });

      logger.info('Career path prediction completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to predict career path:', error);
      throw new Error('Career path prediction failed. Please try again.');
    }
  }

  // Skills Similarity Analysis
  async analyzeSkillsSimilarity(skill1, skill2) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/skills-similarity', {
        skill1,
        skill2,
      });

      return response.data;
    } catch (error) {
      logger.error('Failed to analyze skills similarity:', error);
      throw new Error('Skills similarity analysis failed.');
    }
  }

  // Resume Parser
  async parseResume(resumeText, resumeFormat = 'text') {
    try {
      const client = this.getAIClient();
      const response = await client.post('/parse-resume', {
        resumeText,
        format: resumeFormat,
      });

      logger.info('Resume parsing completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to parse resume:', error);
      throw new Error('Resume parsing failed. Please try again.');
    }
  }

  // Job Description Analyzer
  async analyzeJobDescription(jobDescription) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/analyze-job', {
        jobDescription,
      });

      logger.info('Job description analysis completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze job description:', error);
      throw new Error('Job description analysis failed. Please try again.');
    }
  }

  // Skills Matching
  async matchSkillsToJob(userSkills, jobRequirements) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/match-skills', {
        userSkills,
        jobRequirements,
      });

      logger.info('Skills matching completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to match skills to job:', error);
      throw new Error('Skills matching failed. Please try again.');
    }
  }

  // Competency Assessment
  async assessCompetency(assessmentData) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/assess-competency', assessmentData);

      logger.info('Competency assessment completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to assess competency:', error);
      throw new Error('Competency assessment failed. Please try again.');
    }
  }

  // Learning Path Optimization
  async optimizeLearningPath(userProfile, currentSkills, targetSkills, constraints) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/optimize-learning-path', {
        userProfile,
        currentSkills,
        targetSkills,
        constraints,
      });

      logger.info('Learning path optimization completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to optimize learning path:', error);
      throw new Error('Learning path optimization failed. Please try again.');
    }
  }

  // Skills Trend Analysis
  async analyzeSkillsTrends(skills, timeRange = '1y', location = 'global') {
    try {
      const client = this.getAIClient();
      const response = await client.post('/skills-trends', {
        skills,
        timeRange,
        location,
      });

      logger.info('Skills trends analysis completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze skills trends:', error);
      throw new Error('Skills trends analysis failed. Please try again.');
    }
  }

  // Salary Prediction
  async predictSalary(skills, experience, location, industry) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/predict-salary', {
        skills,
        experience,
        location,
        industry,
      });

      logger.info('Salary prediction completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to predict salary:', error);
      throw new Error('Salary prediction failed. Please try again.');
    }
  }

  // Team Skills Analysis
  async analyzeTeamSkills(teamMembers, projectRequirements) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/team-skills-analysis', {
        teamMembers,
        projectRequirements,
      });

      logger.info('Team skills analysis completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to analyze team skills:', error);
      throw new Error('Team skills analysis failed. Please try again.');
    }
  }

  // Skills Validation
  async validateSkills(skillsData, validationMethod = 'auto') {
    try {
      const client = this.getAIClient();
      const response = await client.post('/validate-skills', {
        skills: skillsData,
        method: validationMethod,
      });

      logger.info('Skills validation completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to validate skills:', error);
      throw new Error('Skills validation failed. Please try again.');
    }
  }

  // Batch Processing
  async processBatch(operations) {
    try {
      const client = this.getAIClient();
      const response = await client.post('/batch-process', {
        operations,
      });

      logger.info('Batch processing completed');
      return response.data;
    } catch (error) {
      logger.error('Failed to process batch:', error);
      throw new Error('Batch processing failed. Please try again.');
    }
  }

  // Health Check
  async checkHealth() {
    try {
      const client = this.getAIClient();
      const response = await client.get('/health');
      return response.data;
    } catch (error) {
      logger.error('AI service health check failed:', error);
      return { status: 'unhealthy', error: error.message };
    }
  }

  // Get AI Service Status
  async getServiceStatus() {
    try {
      const client = this.getAIClient();
      const response = await client.get('/status');
      return response.data;
    } catch (error) {
      logger.error('Failed to get AI service status:', error);
      return { status: 'error', message: 'Service unavailable' };
    }
  }

  // Error handling utility
  handleAIError(error) {
    if (error.response) {
      // Server responded with error status
      const status = error.response.status;
      const message = error.response.data?.message || 'AI service error';
      
      switch (status) {
        case 400:
          throw new Error(`Invalid request: ${message}`);
        case 401:
          throw new Error('AI service authentication failed');
        case 403:
          throw new Error('AI service access denied');
        case 404:
          throw new Error('AI service endpoint not found');
        case 429:
          throw new Error('AI service rate limit exceeded');
        case 500:
          throw new Error('AI service internal error');
        default:
          throw new Error(`AI service error: ${message}`);
      }
    } else if (error.request) {
      // Request was made but no response received
      throw new Error('AI service is not responding');
    } else {
      // Something else happened
      throw new Error(`AI service error: ${error.message}`);
    }
  }

  // Retry mechanism for failed requests
  async retryRequest(requestFn, maxRetries = 3, delay = 1000) {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        return await requestFn();
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        
        logger.warn(`AI service request failed (attempt ${attempt}/${maxRetries}), retrying...`);
        await new Promise(resolve => setTimeout(resolve, delay * attempt));
      }
    }
  }
}

module.exports = new AIIntegrationService();
