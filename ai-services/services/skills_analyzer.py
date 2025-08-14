"""
Skills Analyzer Service
AI-powered skills assessment and analysis for SkillSync
"""

import logging
import numpy as np
import pandas as pd
from typing import Dict, List, Optional, Any, Tuple
from datetime import datetime
import asyncio
from dataclasses import dataclass
from enum import Enum

# ML Libraries
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
from sentence_transformers import SentenceTransformer
import spacy
from transformers import pipeline

logger = logging.getLogger(__name__)

class SkillLevel(Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"
    EXPERT = "expert"

@dataclass
class SkillAssessment:
    skill_name: str
    confidence_score: float
    level: SkillLevel
    experience_years: float
    endorsements: int
    last_used: Optional[datetime]
    market_demand: float
    growth_potential: float
    related_skills: List[str]

class SkillsAnalyzer:
    def __init__(self):
        """Initialize the Skills Analyzer with AI models"""
        self.logger = logger
        self.nlp = None
        self.sentence_transformer = None
        self.sentiment_analyzer = None
        
        # Initialize models asynchronously
        asyncio.create_task(self._initialize_models())
    
    async def _initialize_models(self):
        """Initialize AI models for skills analysis"""
        try:
            # Load spaCy model for NLP
            self.nlp = spacy.load("en_core_web_sm")
            
            # Load sentence transformer for semantic similarity
            self.sentence_transformer = SentenceTransformer('all-MiniLM-L6-v2')
            
            # Load sentiment analyzer for experience assessment
            self.sentiment_analyzer = pipeline("sentiment-analysis", model="distilbert-base-uncased")
            
            self.logger.info("✅ AI models initialized successfully")
            
        except Exception as e:
            self.logger.error(f"❌ Failed to initialize AI models: {e}")
            raise
    
    async def assess_skill_level(self, skill_name: str, user_description: str, 
                               experience_years: float, endorsements: int = 0) -> SkillAssessment:
        """Assess a user's skill level using AI analysis"""
        try:
            # Analyze user description sentiment and complexity
            sentiment_score = await self._analyze_description_sentiment(user_description)
            complexity_score = await self._analyze_description_complexity(user_description)
            
            # Calculate confidence score
            confidence_score = self._calculate_confidence_score(
                experience_years, endorsements, sentiment_score, complexity_score
            )
            
            # Determine skill level
            skill_level = self._determine_skill_level(
                experience_years, confidence_score, complexity_score
            )
            
            # Get market demand and growth potential
            market_demand = await self._get_market_demand(skill_name)
            growth_potential = await self._get_growth_potential(skill_name)
            
            # Find related skills
            related_skills = await self._find_related_skills(skill_name)
            
            return SkillAssessment(
                skill_name=skill_name,
                confidence_score=confidence_score,
                level=skill_level,
                experience_years=experience_years,
                endorsements=endorsements,
                last_used=datetime.now(),
                market_demand=market_demand,
                growth_potential=growth_potential,
                related_skills=related_skills
            )
            
        except Exception as e:
            self.logger.error(f"Error assessing skill level: {e}")
            raise
    
    async def _analyze_description_sentiment(self, description: str) -> float:
        """Analyze the sentiment of user's skill description"""
        try:
            if not self.sentiment_analyzer:
                return 0.5
            
            result = self.sentiment_analyzer(description)
            if result[0]['label'] == 'POSITIVE':
                return result[0]['score']
            else:
                return 1 - result[0]['score']
                
        except Exception as e:
            self.logger.warning(f"Sentiment analysis failed: {e}")
            return 0.5
    
    async def _analyze_description_complexity(self, description: str) -> float:
        """Analyze the complexity of user's skill description"""
        try:
            if not self.nlp:
                return 0.5
            
            doc = self.nlp(description)
            avg_word_length = np.mean([len(token.text) for token in doc if not token.is_punct])
            technical_terms = len([token for token in doc if 
                                 len(token.text) > 8 or 
                                 token.pos_ in ['NOUN', 'PROPN']])
            
            complexity_score = min(1.0, (avg_word_length / 10) + (technical_terms / len(doc) * 2))
            return complexity_score
            
        except Exception as e:
            self.logger.warning(f"Complexity analysis failed: {e}")
            return 0.5
    
    def _calculate_confidence_score(self, experience_years: float, endorsements: int,
                                  sentiment_score: float, complexity_score: float) -> float:
        """Calculate confidence score for skill assessment"""
        experience_weight = 0.4
        endorsement_weight = 0.2
        sentiment_weight = 0.2
        complexity_weight = 0.2
        
        normalized_experience = min(1.0, experience_years / 10)
        normalized_endorsements = min(1.0, endorsements / 50)
        
        confidence_score = (
            normalized_experience * experience_weight +
            normalized_endorsements * endorsement_weight +
            sentiment_score * sentiment_weight +
            complexity_score * complexity_weight
        )
        
        return min(1.0, confidence_score)
    
    def _determine_skill_level(self, experience_years: float, confidence_score: float,
                             complexity_score: float) -> SkillLevel:
        """Determine skill level based on assessment factors"""
        overall_score = (experience_years / 10 * 0.4 + 
                        confidence_score * 0.4 + 
                        complexity_score * 0.2)
        
        if overall_score >= 0.8:
            return SkillLevel.EXPERT
        elif overall_score >= 0.6:
            return SkillLevel.ADVANCED
        elif overall_score >= 0.4:
            return SkillLevel.INTERMEDIATE
        else:
            return SkillLevel.BEGINNER
    
    async def _get_market_demand(self, skill_name: str) -> float:
        """Get market demand score for a skill (0-1)"""
        high_demand_skills = [
            'python', 'javascript', 'react', 'node.js', 'aws', 'docker',
            'kubernetes', 'machine learning', 'data science', 'cybersecurity'
        ]
        
        medium_demand_skills = [
            'java', 'c#', 'php', 'sql', 'mongodb', 'redis', 'git',
            'agile', 'scrum', 'project management'
        ]
        
        skill_lower = skill_name.lower()
        
        if any(skill in skill_lower for skill in high_demand_skills):
            return 0.8 + np.random.uniform(0, 0.2)
        elif any(skill in skill_lower for skill in medium_demand_skills):
            return 0.5 + np.random.uniform(0, 0.3)
        else:
            return 0.3 + np.random.uniform(0, 0.4)
    
    async def _get_growth_potential(self, skill_name: str) -> float:
        """Get growth potential score for a skill (0-1)"""
        emerging_skills = [
            'ai', 'machine learning', 'blockchain', 'iot', 'edge computing',
            'quantum computing', 'augmented reality', 'virtual reality'
        ]
        
        growing_skills = [
            'python', 'data science', 'cybersecurity', 'cloud computing',
            'devops', 'microservices', 'serverless'
        ]
        
        skill_lower = skill_name.lower()
        
        if any(skill in skill_lower for skill in emerging_skills):
            return 0.9 + np.random.uniform(0, 0.1)
        elif any(skill in skill_lower for skill in growing_skills):
            return 0.7 + np.random.uniform(0, 0.2)
        else:
            return 0.4 + np.random.uniform(0, 0.3)
    
    async def _find_related_skills(self, skill_name: str) -> List[str]:
        """Find related skills based on semantic similarity"""
        skill_relationships = {
            'python': ['data science', 'machine learning', 'django', 'flask', 'pandas'],
            'javascript': ['react', 'node.js', 'typescript', 'vue.js', 'angular'],
            'react': ['javascript', 'typescript', 'redux', 'next.js', 'graphql'],
            'aws': ['cloud computing', 'docker', 'kubernetes', 'serverless', 'devops'],
            'machine learning': ['python', 'data science', 'tensorflow', 'pytorch', 'scikit-learn'],
            'data science': ['python', 'pandas', 'numpy', 'matplotlib', 'sql'],
            'cybersecurity': ['network security', 'penetration testing', 'incident response', 'compliance'],
            'devops': ['docker', 'kubernetes', 'aws', 'ci/cd', 'monitoring']
        }
        
        skill_lower = skill_name.lower()
        
        for skill, related in skill_relationships.items():
            if skill in skill_lower:
                return related
        
        return ['problem solving', 'communication', 'teamwork', 'project management']
    
    async def analyze_skills_gap(self, current_skills: List[SkillAssessment], 
                               target_role: str, industry: str) -> Dict[str, Any]:
        """Analyze skills gap between current skills and target role requirements"""
        try:
            role_requirements = await self._get_role_requirements(target_role, industry)
            
            skill_gaps = []
            missing_skills = []
            underdeveloped_skills = []
            
            current_skill_names = {skill.skill_name.lower() for skill in current_skills}
            current_skill_map = {skill.skill_name.lower(): skill for skill in current_skills}
            
            for required_skill in role_requirements:
                skill_name = required_skill['name'].lower()
                required_level = required_skill['level']
                importance = required_skill['importance']
                
                if skill_name not in current_skill_names:
                    missing_skills.append({
                        'skill_name': required_skill['name'],
                        'required_level': required_level,
                        'importance': importance,
                        'gap_score': importance
                    })
                else:
                    current_skill = current_skill_map[skill_name]
                    current_level_score = self._skill_level_to_score(current_skill.level)
                    required_level_score = self._skill_level_to_score(required_level)
                    
                    if current_level_score < required_level_score:
                        underdeveloped_skills.append({
                            'skill_name': required_skill['name'],
                            'current_level': current_skill.level.value,
                            'required_level': required_level.value,
                            'importance': importance,
                            'gap_score': (required_level_score - current_level_score) * importance
                        })
            
            total_gap_score = sum(skill['gap_score'] for skill in missing_skills + underdeveloped_skills)
            
            return {
                'total_gap_score': total_gap_score,
                'missing_skills': missing_skills,
                'underdeveloped_skills': underdeveloped_skills,
                'gap_priority': sorted(missing_skills + underdeveloped_skills, 
                                     key=lambda x: x['gap_score'], reverse=True),
                'recommendations': await self._generate_gap_recommendations(
                    missing_skills, underdeveloped_skills, target_role
                )
            }
            
        except Exception as e:
            self.logger.error(f"Error analyzing skills gap: {e}")
            raise
    
    def _skill_level_to_score(self, level: SkillLevel) -> float:
        """Convert skill level to numerical score"""
        level_scores = {
            SkillLevel.BEGINNER: 0.25,
            SkillLevel.INTERMEDIATE: 0.5,
            SkillLevel.ADVANCED: 0.75,
            SkillLevel.EXPERT: 1.0
        }
        return level_scores.get(level, 0.25)
    
    async def _get_role_requirements(self, role: str, industry: str) -> List[Dict[str, Any]]:
        """Get skill requirements for a specific role"""
        role_requirements = {
            'software engineer': [
                {'name': 'Programming', 'level': SkillLevel.ADVANCED, 'importance': 0.9},
                {'name': 'Problem Solving', 'level': SkillLevel.ADVANCED, 'importance': 0.8},
                {'name': 'System Design', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.7},
                {'name': 'Database Design', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.6},
                {'name': 'Version Control', 'level': SkillLevel.ADVANCED, 'importance': 0.8}
            ],
            'data scientist': [
                {'name': 'Python', 'level': SkillLevel.ADVANCED, 'importance': 0.9},
                {'name': 'Machine Learning', 'level': SkillLevel.ADVANCED, 'importance': 0.9},
                {'name': 'Statistics', 'level': SkillLevel.ADVANCED, 'importance': 0.8},
                {'name': 'Data Visualization', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.7},
                {'name': 'SQL', 'level': SkillLevel.ADVANCED, 'importance': 0.8}
            ],
            'product manager': [
                {'name': 'Product Strategy', 'level': SkillLevel.ADVANCED, 'importance': 0.9},
                {'name': 'User Research', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.7},
                {'name': 'Data Analysis', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.7},
                {'name': 'Stakeholder Management', 'level': SkillLevel.ADVANCED, 'importance': 0.8},
                {'name': 'Agile Methodologies', 'level': SkillLevel.ADVANCED, 'importance': 0.8}
            ]
        }
        
        role_lower = role.lower()
        for key, requirements in role_requirements.items():
            if key in role_lower:
                return requirements
        
        return [
            {'name': 'Communication', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.7},
            {'name': 'Problem Solving', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.7},
            {'name': 'Teamwork', 'level': SkillLevel.INTERMEDIATE, 'importance': 0.6}
        ]
    
    async def _generate_gap_recommendations(self, missing_skills: List[Dict], 
                                          underdeveloped_skills: List[Dict], 
                                          target_role: str) -> List[Dict[str, Any]]:
        """Generate recommendations for closing skills gaps"""
        recommendations = []
        
        all_gaps = missing_skills + underdeveloped_skills
        sorted_gaps = sorted(all_gaps, key=lambda x: x['gap_score'], reverse=True)
        
        for gap in sorted_gaps[:5]:
            skill_name = gap['skill_name']
            
            recommendation = {
                'skill_name': skill_name,
                'priority': 'high' if gap['gap_score'] > 0.7 else 'medium',
                'estimated_time': self._estimate_learning_time(skill_name, gap),
                'learning_resources': await self._get_learning_resources(skill_name),
                'action_items': self._generate_action_items(skill_name, gap)
            }
            
            recommendations.append(recommendation)
        
        return recommendations
    
    def _estimate_learning_time(self, skill_name: str, gap: Dict) -> str:
        """Estimate time needed to develop the skill"""
        if 'required_level' in gap:
            level = gap['required_level']
        else:
            level = gap['required_level']
        
        time_estimates = {
            'beginner': '2-4 weeks',
            'intermediate': '1-3 months',
            'advanced': '3-6 months',
            'expert': '6-12 months'
        }
        
        return time_estimates.get(level, '1-3 months')
    
    async def _get_learning_resources(self, skill_name: str) -> List[Dict[str, str]]:
        """Get learning resources for a skill"""
        resources = {
            'python': [
                {'type': 'course', 'name': 'Python for Data Science', 'url': 'https://example.com/python-course'},
                {'type': 'book', 'name': 'Python Crash Course', 'url': 'https://example.com/python-book'},
                {'type': 'practice', 'name': 'LeetCode Python Problems', 'url': 'https://example.com/leetcode'}
            ],
            'machine learning': [
                {'type': 'course', 'name': 'Machine Learning Specialization', 'url': 'https://example.com/ml-course'},
                {'type': 'book', 'name': 'Hands-On Machine Learning', 'url': 'https://example.com/ml-book'},
                {'type': 'project', 'name': 'Kaggle Competitions', 'url': 'https://example.com/kaggle'}
            ]
        }
        
        skill_lower = skill_name.lower()
        for key, resource_list in resources.items():
            if key in skill_lower:
                return resource_list
        
        return [
            {'type': 'course', 'name': f'{skill_name} Fundamentals', 'url': 'https://example.com/course'},
            {'type': 'documentation', 'name': f'{skill_name} Documentation', 'url': 'https://example.com/docs'},
            {'type': 'community', 'name': f'{skill_name} Community Forum', 'url': 'https://example.com/community'}
        ]
    
    def _generate_action_items(self, skill_name: str, gap: Dict) -> List[str]:
        """Generate specific action items for skill development"""
        action_items = []
        
        if 'required_level' in gap:
            action_items.extend([
                f"Enroll in a {skill_name} fundamentals course",
                f"Complete hands-on projects in {skill_name}",
                f"Join {skill_name} community forums and discussions",
                f"Practice {skill_name} daily for at least 1 hour"
            ])
        else:
            action_items.extend([
                f"Take advanced {skill_name} courses",
                f"Work on complex {skill_name} projects",
                f"Mentor others in {skill_name}",
                f"Contribute to open-source {skill_name} projects"
            ])
        
        return action_items
