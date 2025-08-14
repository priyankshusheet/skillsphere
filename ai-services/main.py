"""
SkillSphere AI Services
FastAPI application providing AI-powered skills mapping and career growth insights
"""

import os
import logging
from contextlib import asynccontextmanager
from typing import List, Optional, Dict, Any

import uvicorn
from fastapi import FastAPI, HTTPException, Depends, status
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
import redis.asyncio as redis
from loguru import logger

# Import AI modules
from services.skills_analyzer import SkillsAnalyzer
from services.learning_recommender import LearningRecommender
from services.market_insights import MarketInsights
from services.career_predictor import CareerPredictor
from services.skills_gap_analyzer import SkillsGapAnalyzer

# Import utilities
from utils.config import settings
from utils.database import get_database, get_redis
from utils.auth import verify_api_key
from utils.logging import setup_logging

# Pydantic models
class SkillAssessment(BaseModel):
    skill_name: str = Field(..., description="Name of the skill to assess")
    user_experience: str = Field(..., description="User's self-reported experience level")
    job_title: str = Field(..., description="User's current job title")
    industry: str = Field(..., description="User's industry")
    company_size: str = Field(..., description="Size of the user's company")

class LearningRecommendation(BaseModel):
    user_id: str = Field(..., description="User ID")
    current_skills: List[Dict[str, Any]] = Field(..., description="User's current skills")
    career_goals: List[str] = Field(..., description="User's career goals")
    learning_preferences: Dict[str, Any] = Field(..., description="User's learning preferences")

class SkillsGapRequest(BaseModel):
    company_id: str = Field(..., description="Company ID")
    target_roles: List[str] = Field(..., description="Target roles for analysis")
    industry_trends: Optional[List[str]] = Field(None, description="Industry trends to consider")

class CareerPrediction(BaseModel):
    user_id: str = Field(..., description="User ID")
    current_role: str = Field(..., description="Current role")
    target_role: str = Field(..., description="Target role")
    timeline_months: int = Field(12, description="Timeline in months", ge=1, le=60)

# Global variables for AI services
skills_analyzer: Optional[SkillsAnalyzer] = None
learning_recommender: Optional[LearningRecommender] = None
market_insights: Optional[MarketInsights] = None
career_predictor: Optional[CareerPredictor] = None
skills_gap_analyzer: Optional[SkillsGapAnalyzer] = None

# Security
security = HTTPBearer()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan manager"""
    # Startup
    logger.info("🚀 Starting SkillSphere AI Services...")
    
    # Initialize AI services
    global skills_analyzer, learning_recommender, market_insights, career_predictor, skills_gap_analyzer
    
    try:
        # Initialize database connection
        app.state.database = AsyncIOMotorClient(settings.MONGODB_URI)
        app.state.redis = redis.from_url(settings.REDIS_URL)
        
        # Test connections
        await app.state.database.admin.command('ping')
        await app.state.redis.ping()
        logger.info("✅ Database connections established")
        
        # Initialize AI services
        skills_analyzer = SkillsAnalyzer()
        learning_recommender = LearningRecommender()
        market_insights = MarketInsights()
        career_predictor = CareerPredictor()
        skills_gap_analyzer = SkillsGapAnalyzer()
        
        logger.info("✅ AI services initialized")
        
    except Exception as e:
        logger.error(f"❌ Failed to initialize services: {e}")
        raise
    
    yield
    
    # Shutdown
    logger.info("🛑 Shutting down SkillSphere AI Services...")
    
    if hasattr(app.state, 'database'):
        app.state.database.close()
    if hasattr(app.state, 'redis'):
        await app.state.redis.close()
    
    logger.info("✅ Services shut down successfully")

# Create FastAPI app
app = FastAPI(
    title="SkillSphere AI Services",
    description="AI-powered skills mapping and personalized career growth platform",
    version="1.0.0",
    docs_url="/docs" if settings.ENVIRONMENT == "development" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT == "development" else None,
    lifespan=lifespan
)

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(
    TrustedHostMiddleware,
    allowed_hosts=settings.ALLOWED_HOSTS
)

# Setup logging
setup_logging()

# Health check endpoint
@app.get("/health", tags=["Health"])
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "service": "SkillSphere AI Services",
        "version": "1.0.0",
        "environment": settings.ENVIRONMENT
    }

# Skills Analysis Endpoints
@app.post("/api/v1/skills/assess", tags=["Skills Analysis"])
async def assess_skill(
    assessment: SkillAssessment,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Assess a user's skill level using AI"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not skills_analyzer:
            raise HTTPException(status_code=503, detail="Skills analyzer not available")
        
        # Perform skill assessment
        result = await skills_analyzer.assess_skill(
            skill_name=assessment.skill_name,
            user_experience=assessment.user_experience,
            job_title=assessment.job_title,
            industry=assessment.industry,
            company_size=assessment.company_size
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Skill assessment failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/v1/skills/gap-analysis", tags=["Skills Analysis"])
async def analyze_skills_gap(
    request: SkillsGapRequest,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Analyze skills gaps for a company or team"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not skills_gap_analyzer:
            raise HTTPException(status_code=503, detail="Skills gap analyzer not available")
        
        # Perform skills gap analysis
        result = await skills_gap_analyzer.analyze_company_gaps(
            company_id=request.company_id,
            target_roles=request.target_roles,
            industry_trends=request.industry_trends
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Skills gap analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Learning Recommendations Endpoints
@app.post("/api/v1/learning/recommendations", tags=["Learning"])
async def get_learning_recommendations(
    request: LearningRecommendation,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get personalized learning recommendations for a user"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not learning_recommender:
            raise HTTPException(status_code=503, detail="Learning recommender not available")
        
        # Get learning recommendations
        result = await learning_recommender.get_recommendations(
            user_id=request.user_id,
            current_skills=request.current_skills,
            career_goals=request.career_goals,
            learning_preferences=request.learning_preferences
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Learning recommendations failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/learning/path/{user_id}", tags=["Learning"])
async def get_learning_path(
    user_id: str,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get personalized learning path for a user"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not learning_recommender:
            raise HTTPException(status_code=503, detail="Learning recommender not available")
        
        # Get learning path
        result = await learning_recommender.get_learning_path(user_id)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Learning path generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Market Insights Endpoints
@app.get("/api/v1/market/trends", tags=["Market Insights"])
async def get_market_trends(
    industry: Optional[str] = None,
    location: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get market trends and insights"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not market_insights:
            raise HTTPException(status_code=503, detail="Market insights service not available")
        
        # Get market trends
        result = await market_insights.get_trends(industry=industry, location=location)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Market trends analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/market/skills-demand", tags=["Market Insights"])
async def get_skills_demand(
    skills: List[str],
    location: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get demand analysis for specific skills"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not market_insights:
            raise HTTPException(status_code=503, detail="Market insights service not available")
        
        # Get skills demand
        result = await market_insights.get_skills_demand(skills=skills, location=location)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Skills demand analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Career Prediction Endpoints
@app.post("/api/v1/career/predict", tags=["Career Prediction"])
async def predict_career_path(
    request: CareerPrediction,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Predict career path and required skills"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not career_predictor:
            raise HTTPException(status_code=503, detail="Career predictor not available")
        
        # Predict career path
        result = await career_predictor.predict_path(
            user_id=request.user_id,
            current_role=request.current_role,
            target_role=request.target_role,
            timeline_months=request.timeline_months
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Career prediction failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/v1/career/roles/{current_role}", tags=["Career Prediction"])
async def get_career_roles(
    current_role: str,
    industry: Optional[str] = None,
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get potential career roles based on current role"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        if not career_predictor:
            raise HTTPException(status_code=503, detail="Career predictor not available")
        
        # Get career roles
        result = await career_predictor.get_career_roles(
            current_role=current_role,
            industry=industry
        )
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Career roles analysis failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Analytics Endpoints
@app.get("/api/v1/analytics/company/{company_id}", tags=["Analytics"])
async def get_company_analytics(
    company_id: str,
    timeframe: str = "30d",
    credentials: HTTPAuthorizationCredentials = Depends(security)
):
    """Get comprehensive analytics for a company"""
    try:
        # Verify API key
        await verify_api_key(credentials.credentials)
        
        # Get company analytics
        result = await get_company_analytics_data(company_id, timeframe)
        
        return {
            "success": True,
            "data": result
        }
        
    except Exception as e:
        logger.error(f"Company analytics failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))

# Utility function for company analytics
async def get_company_analytics_data(company_id: str, timeframe: str):
    """Get company analytics data"""
    # This would integrate with the analytics service
    # For now, return mock data
    return {
        "company_id": company_id,
        "timeframe": timeframe,
        "total_users": 150,
        "active_users": 120,
        "skills_coverage": 0.75,
        "learning_completion_rate": 0.68,
        "top_skills": ["Python", "JavaScript", "Project Management"],
        "skills_gaps": ["Data Science", "Cloud Architecture", "DevOps"],
        "learning_recommendations": 45,
        "career_advancements": 12
    }

# Error handlers
@app.exception_handler(HTTPException)
async def http_exception_handler(request, exc):
    """Handle HTTP exceptions"""
    return {
        "success": False,
        "error": {
            "message": exc.detail,
            "status_code": exc.status_code
        }
    }

@app.exception_handler(Exception)
async def general_exception_handler(request, exc):
    """Handle general exceptions"""
    logger.error(f"Unhandled exception: {exc}")
    return {
        "success": False,
        "error": {
            "message": "Internal server error",
            "status_code": 500
        }
    }

if __name__ == "__main__":
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=settings.ENVIRONMENT == "development",
        log_level="info"
    ) 