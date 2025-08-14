"""
FastAPI application for SkillSphere AI services.
Provides REST API endpoints for skills assessment and analysis.
"""

from fastapi import FastAPI, HTTPException, Depends, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from pydantic import BaseModel, Field
from typing import List, Dict, Any, Optional
import uvicorn
import logging
import os
from datetime import datetime
import asyncio

# Import AI services
import sys
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from services.skills_analyzer import SkillsAnalyzer
from utils.preprocessing import create_preprocessing_pipeline
from utils.evaluation import create_evaluation_pipeline

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Initialize FastAPI app
app = FastAPI(
    title="SkillSphere AI Services",
    description="AI-powered skills assessment and analysis API",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc"
)

# Add CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure appropriately for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Security
security = HTTPBearer()

# Initialize AI services
skills_analyzer = SkillsAnalyzer()
preprocessing_pipeline = create_preprocessing_pipeline()
evaluation_pipeline = create_evaluation_pipeline()

# Pydantic models
class UserData(BaseModel):
    firstName: str = Field(..., description="User's first name")
    lastName: str = Field(..., description="User's last name")
    email: str = Field(..., description="User's email address")
    title: Optional[str] = Field(None, description="User's job title")
    department: Optional[str] = Field(None, description="User's department")
    experience: Optional[int] = Field(None, description="Years of experience")
    industry: Optional[str] = Field(None, description="Industry")

class SkillData(BaseModel):
    name: str = Field(..., description="Skill name")
    level: Optional[int] = Field(None, ge=1, le=5, description="Skill level (1-5)")
    experience: Optional[int] = Field(None, ge=0, description="Years of experience")
    description: Optional[str] = Field(None, description="Skill description")

class SkillsAssessmentRequest(BaseModel):
    user: UserData
    skills: List[SkillData]

class SkillsAssessmentResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class GapAnalysisRequest(BaseModel):
    userSkills: List[SkillData]
    jobRequirements: List[str]
    marketData: Optional[Dict[str, Any]] = None

class GapAnalysisResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class LearningRecommendationsRequest(BaseModel):
    userProfile: UserData
    skillGaps: List[str]
    preferences: Optional[Dict[str, Any]] = None

class LearningRecommendationsResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class MarketDemandRequest(BaseModel):
    skills: List[str]
    location: Optional[str] = None
    industry: Optional[str] = None

class MarketDemandResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class CareerPredictionRequest(BaseModel):
    userProfile: UserData
    currentRole: str
    targetRole: str

class CareerPredictionResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class SkillsSimilarityRequest(BaseModel):
    skill1: str
    skill2: str

class SkillsSimilarityResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class ResumeParseRequest(BaseModel):
    resumeText: str
    format: str = "text"

class ResumeParseResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class JobAnalysisRequest(BaseModel):
    jobDescription: str

class JobAnalysisResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class SkillsMatchRequest(BaseModel):
    userSkills: List[SkillData]
    jobRequirements: List[str]

class SkillsMatchResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class CompetencyAssessmentRequest(BaseModel):
    assessmentData: Dict[str, Any]

class CompetencyAssessmentResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class LearningPathOptimizationRequest(BaseModel):
    userProfile: UserData
    currentSkills: List[SkillData]
    targetSkills: List[str]
    constraints: Optional[Dict[str, Any]] = None

class LearningPathOptimizationResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class SkillsTrendsRequest(BaseModel):
    skills: List[str]
    timeRange: str = "1y"
    location: str = "global"

class SkillsTrendsResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class SalaryPredictionRequest(BaseModel):
    skills: List[str]
    experience: int
    location: str
    industry: str

class SalaryPredictionResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class TeamSkillsAnalysisRequest(BaseModel):
    teamMembers: List[UserData]
    projectRequirements: List[str]

class TeamSkillsAnalysisResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class SkillsValidationRequest(BaseModel):
    skills: List[SkillData]
    validationMethod: str = "auto"

class SkillsValidationResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

class BatchProcessRequest(BaseModel):
    operations: List[Dict[str, Any]]

class BatchProcessResponse(BaseModel):
    success: bool
    message: str
    data: Dict[str, Any]
    timestamp: datetime

# Dependency for authentication
async def verify_token(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verify API token."""
    token = credentials.credentials
    # In production, implement proper token verification
    if token != os.getenv("AI_SERVICE_TOKEN", "default_token"):
        raise HTTPException(status_code=401, detail="Invalid token")
    return token

# Health check endpoint
@app.get("/health")
async def health_check():
    """Health check endpoint."""
    return {
        "status": "healthy",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "services": {
            "skills_analyzer": "available",
            "preprocessing": "available",
            "evaluation": "available"
        }
    }

# Status endpoint
@app.get("/status")
async def get_status():
    """Get detailed service status."""
    return {
        "status": "operational",
        "timestamp": datetime.now(),
        "version": "1.0.0",
        "uptime": "running",
        "memory_usage": "normal",
        "cpu_usage": "normal"
    }

# Skills Assessment endpoint
@app.post("/assess-skills", response_model=SkillsAssessmentResponse)
async def assess_skills(
    request: SkillsAssessmentRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    """Assess user skills using AI."""
    try:
        # Preprocess user data
        user_dict = request.user.dict()
        skills_list = [skill.dict() for skill in request.skills]
        
        # Validate data
        is_valid, errors = preprocessing_pipeline['validator'].validate_skills_data(skills_list)
        if not is_valid:
            raise HTTPException(status_code=400, detail=f"Invalid skills data: {errors}")
        
        # Perform skills assessment
        assessment_results = skills_analyzer.assess_skills(user_dict, skills_list)
        
        # Add background task for logging
        background_tasks.add_task(log_assessment, user_dict['email'], assessment_results)
        
        return SkillsAssessmentResponse(
            success=True,
            message="Skills assessment completed successfully",
            data=assessment_results,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Skills assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Assessment failed: {str(e)}")

# Gap Analysis endpoint
@app.post("/analyze-gaps", response_model=GapAnalysisResponse)
async def analyze_gaps(
    request: GapAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze skill gaps between user skills and job requirements."""
    try:
        user_skills = [skill.dict() for skill in request.userSkills]
        
        gap_analysis = skills_analyzer.analyze_skill_gaps(
            user_skills,
            request.jobRequirements,
            request.marketData or {}
        )
        
        return GapAnalysisResponse(
            success=True,
            message="Skill gap analysis completed successfully",
            data=gap_analysis,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Gap analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Gap analysis failed: {str(e)}")

# Learning Recommendations endpoint
@app.post("/learning-recommendations", response_model=LearningRecommendationsResponse)
async def get_learning_recommendations(
    request: LearningRecommendationsRequest,
    token: str = Depends(verify_token)
):
    """Get personalized learning recommendations."""
    try:
        user_profile = request.userProfile.dict()
        
        recommendations = skills_analyzer.get_learning_recommendations(
            user_profile,
            request.skillGaps,
            request.preferences or {}
        )
        
        return LearningRecommendationsResponse(
            success=True,
            message="Learning recommendations generated successfully",
            data=recommendations,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Learning recommendations error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Recommendations failed: {str(e)}")

# Market Demand Analysis endpoint
@app.post("/market-demand", response_model=MarketDemandResponse)
async def analyze_market_demand(
    request: MarketDemandRequest,
    token: str = Depends(verify_token)
):
    """Analyze market demand for skills."""
    try:
        market_analysis = skills_analyzer.analyze_market_demand(
            request.skills,
            request.location,
            request.industry
        )
        
        return MarketDemandResponse(
            success=True,
            message="Market demand analysis completed successfully",
            data=market_analysis,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Market demand analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Market analysis failed: {str(e)}")

# Career Path Prediction endpoint
@app.post("/career-prediction", response_model=CareerPredictionResponse)
async def predict_career_path(
    request: CareerPredictionRequest,
    token: str = Depends(verify_token)
):
    """Predict career path and requirements."""
    try:
        user_profile = request.userProfile.dict()
        
        career_prediction = skills_analyzer.predict_career_path(
            user_profile,
            request.currentRole,
            request.targetRole
        )
        
        return CareerPredictionResponse(
            success=True,
            message="Career path prediction completed successfully",
            data=career_prediction,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Career prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Career prediction failed: {str(e)}")

# Skills Similarity Analysis endpoint
@app.post("/skills-similarity", response_model=SkillsSimilarityResponse)
async def analyze_skills_similarity(
    request: SkillsSimilarityRequest,
    token: str = Depends(verify_token)
):
    """Analyze similarity between two skills."""
    try:
        similarity = skills_analyzer.analyze_skills_similarity(
            request.skill1,
            request.skill2
        )
        
        return SkillsSimilarityResponse(
            success=True,
            message="Skills similarity analysis completed successfully",
            data=similarity,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Skills similarity error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Similarity analysis failed: {str(e)}")

# Resume Parser endpoint
@app.post("/parse-resume", response_model=ResumeParseResponse)
async def parse_resume(
    request: ResumeParseRequest,
    token: str = Depends(verify_token)
):
    """Parse resume and extract skills."""
    try:
        parsed_resume = skills_analyzer.parse_resume(
            request.resumeText,
            request.format
        )
        
        return ResumeParseResponse(
            success=True,
            message="Resume parsing completed successfully",
            data=parsed_resume,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Resume parsing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Resume parsing failed: {str(e)}")

# Job Description Analyzer endpoint
@app.post("/analyze-job", response_model=JobAnalysisResponse)
async def analyze_job_description(
    request: JobAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze job description and extract requirements."""
    try:
        job_analysis = skills_analyzer.analyze_job_description(
            request.jobDescription
        )
        
        return JobAnalysisResponse(
            success=True,
            message="Job description analysis completed successfully",
            data=job_analysis,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Job analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Job analysis failed: {str(e)}")

# Skills Matching endpoint
@app.post("/match-skills", response_model=SkillsMatchResponse)
async def match_skills_to_job(
    request: SkillsMatchRequest,
    token: str = Depends(verify_token)
):
    """Match user skills to job requirements."""
    try:
        user_skills = [skill.dict() for skill in request.userSkills]
        
        skills_match = skills_analyzer.match_skills_to_job(
            user_skills,
            request.jobRequirements
        )
        
        return SkillsMatchResponse(
            success=True,
            message="Skills matching completed successfully",
            data=skills_match,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Skills matching error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Skills matching failed: {str(e)}")

# Competency Assessment endpoint
@app.post("/assess-competency", response_model=CompetencyAssessmentResponse)
async def assess_competency(
    request: CompetencyAssessmentRequest,
    token: str = Depends(verify_token)
):
    """Assess competency based on assessment data."""
    try:
        competency_assessment = skills_analyzer.assess_competency(
            request.assessmentData
        )
        
        return CompetencyAssessmentResponse(
            success=True,
            message="Competency assessment completed successfully",
            data=competency_assessment,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Competency assessment error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Competency assessment failed: {str(e)}")

# Learning Path Optimization endpoint
@app.post("/optimize-learning-path", response_model=LearningPathOptimizationResponse)
async def optimize_learning_path(
    request: LearningPathOptimizationRequest,
    token: str = Depends(verify_token)
):
    """Optimize learning path based on constraints."""
    try:
        user_profile = request.userProfile.dict()
        current_skills = [skill.dict() for skill in request.currentSkills]
        
        optimized_path = skills_analyzer.optimize_learning_path(
            user_profile,
            current_skills,
            request.targetSkills,
            request.constraints or {}
        )
        
        return LearningPathOptimizationResponse(
            success=True,
            message="Learning path optimization completed successfully",
            data=optimized_path,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Learning path optimization error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Path optimization failed: {str(e)}")

# Skills Trends Analysis endpoint
@app.post("/skills-trends", response_model=SkillsTrendsResponse)
async def analyze_skills_trends(
    request: SkillsTrendsRequest,
    token: str = Depends(verify_token)
):
    """Analyze skills trends over time."""
    try:
        trends_analysis = skills_analyzer.analyze_skills_trends(
            request.skills,
            request.timeRange,
            request.location
        )
        
        return SkillsTrendsResponse(
            success=True,
            message="Skills trends analysis completed successfully",
            data=trends_analysis,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Skills trends error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Trends analysis failed: {str(e)}")

# Salary Prediction endpoint
@app.post("/predict-salary", response_model=SalaryPredictionResponse)
async def predict_salary(
    request: SalaryPredictionRequest,
    token: str = Depends(verify_token)
):
    """Predict salary based on skills and experience."""
    try:
        salary_prediction = skills_analyzer.predict_salary(
            request.skills,
            request.experience,
            request.location,
            request.industry
        )
        
        return SalaryPredictionResponse(
            success=True,
            message="Salary prediction completed successfully",
            data=salary_prediction,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Salary prediction error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Salary prediction failed: {str(e)}")

# Team Skills Analysis endpoint
@app.post("/team-skills-analysis", response_model=TeamSkillsAnalysisResponse)
async def analyze_team_skills(
    request: TeamSkillsAnalysisRequest,
    token: str = Depends(verify_token)
):
    """Analyze team skills for project requirements."""
    try:
        team_members = [member.dict() for member in request.teamMembers]
        
        team_analysis = skills_analyzer.analyze_team_skills(
            team_members,
            request.projectRequirements
        )
        
        return TeamSkillsAnalysisResponse(
            success=True,
            message="Team skills analysis completed successfully",
            data=team_analysis,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Team skills analysis error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Team analysis failed: {str(e)}")

# Skills Validation endpoint
@app.post("/validate-skills", response_model=SkillsValidationResponse)
async def validate_skills(
    request: SkillsValidationRequest,
    token: str = Depends(verify_token)
):
    """Validate skills data."""
    try:
        skills_data = [skill.dict() for skill in request.skills]
        
        validation_results = skills_analyzer.validate_skills(
            skills_data,
            request.validationMethod
        )
        
        return SkillsValidationResponse(
            success=True,
            message="Skills validation completed successfully",
            data=validation_results,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Skills validation error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Skills validation failed: {str(e)}")

# Batch Processing endpoint
@app.post("/batch-process", response_model=BatchProcessResponse)
async def process_batch(
    request: BatchProcessRequest,
    background_tasks: BackgroundTasks,
    token: str = Depends(verify_token)
):
    """Process multiple operations in batch."""
    try:
        batch_results = skills_analyzer.process_batch(request.operations)
        
        # Add background task for processing
        background_tasks.add_task(process_batch_background, request.operations)
        
        return BatchProcessResponse(
            success=True,
            message="Batch processing completed successfully",
            data=batch_results,
            timestamp=datetime.now()
        )
    except Exception as e:
        logger.error(f"Batch processing error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Batch processing failed: {str(e)}")

# Background tasks
async def log_assessment(user_email: str, assessment_results: Dict[str, Any]):
    """Log assessment results for analytics."""
    logger.info(f"Assessment logged for user: {user_email}")
    # In production, save to database or analytics service

async def process_batch_background(operations: List[Dict[str, Any]]):
    """Process batch operations in background."""
    logger.info(f"Processing {len(operations)} operations in background")
    # In production, implement actual batch processing

# Error handlers
@app.exception_handler(Exception)
async def global_exception_handler(request, exc):
    """Global exception handler."""
    logger.error(f"Unhandled exception: {str(exc)}")
    return {
        "success": False,
        "message": "Internal server error",
        "error": str(exc),
        "timestamp": datetime.now()
    }

if __name__ == "__main__":
    # Run the FastAPI application
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=8000,
        reload=True,
        log_level="info"
    )
