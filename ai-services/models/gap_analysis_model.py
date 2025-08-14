"""
Gap Analysis Model for SkillSphere.
Handles skill gap identification and analysis.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Optional, Tuple
from sklearn.ensemble import RandomForestRegressor
from sklearn.preprocessing import StandardScaler
from sklearn.metrics.pairwise import cosine_similarity
import logging

logger = logging.getLogger(__name__)

class GapAnalysisModel:
    """AI model for skill gap analysis."""
    
    def __init__(self, model_name: str = "gap_analysis"):
        """
        Initialize gap analysis model.
        
        Args:
            model_name: Name of the model
        """
        self.model_name = model_name
        self.model = None
        self.scaler = StandardScaler()
        self.is_trained = False
        
        # Model parameters
        self.model_params = {
            'n_estimators': 100,
            'max_depth': 10,
            'random_state': 42
        }
    
    def analyze_gaps(self, user_skills: List[Dict[str, Any]], 
                    job_requirements: List[str],
                    market_data: Dict[str, Any]) -> Dict[str, Any]:
        """
        Analyze skill gaps between user skills and job requirements.
        
        Args:
            user_skills: User's current skills
            job_requirements: Required skills for the job
            market_data: Market demand data
            
        Returns:
            Gap analysis results
        """
        try:
            # Extract skill names from user skills
            user_skill_names = [skill.get('name', '').lower() for skill in user_skills]
            user_skill_levels = [skill.get('level', 1) for skill in user_skills]
            
            # Normalize job requirements
            job_skill_names = [req.lower() for req in job_requirements]
            
            # Find missing skills
            missing_skills = [skill for skill in job_skill_names if skill not in user_skill_names]
            
            # Analyze skill levels for existing skills
            skill_gaps = []
            for i, skill_name in enumerate(user_skill_names):
                if skill_name in job_skill_names:
                    current_level = user_skill_levels[i]
                    required_level = self._get_required_level(skill_name, job_requirements, market_data)
                    
                    if current_level < required_level:
                        skill_gaps.append({
                            'skill_name': skill_name,
                            'current_level': current_level,
                            'required_level': required_level,
                            'gap_size': required_level - current_level,
                            'priority': self._calculate_priority(skill_name, market_data),
                            'estimated_time': self._estimate_development_time(required_level - current_level)
                        })
            
            # Add missing skills as gaps
            for skill_name in missing_skills:
                required_level = self._get_required_level(skill_name, job_requirements, market_data)
                skill_gaps.append({
                    'skill_name': skill_name,
                    'current_level': 0,
                    'required_level': required_level,
                    'gap_size': required_level,
                    'priority': self._calculate_priority(skill_name, market_data),
                    'estimated_time': self._estimate_development_time(required_level),
                    'is_missing': True
                })
            
            # Sort gaps by priority
            skill_gaps.sort(key=lambda x: x['priority'], reverse=True)
            
            # Calculate overall gap metrics
            total_gaps = len(skill_gaps)
            high_priority_gaps = len([gap for gap in skill_gaps if gap['priority'] >= 0.8])
            total_development_time = sum(gap['estimated_time'] for gap in skill_gaps)
            
            return {
                'gaps': skill_gaps,
                'summary': {
                    'total_gaps': total_gaps,
                    'high_priority_gaps': high_priority_gaps,
                    'total_development_time': total_development_time,
                    'coverage_percentage': self._calculate_coverage_percentage(user_skill_names, job_skill_names),
                    'match_score': self._calculate_match_score(user_skills, job_requirements)
                },
                'recommendations': self._generate_gap_recommendations(skill_gaps, market_data),
                'timeline': self._create_development_timeline(skill_gaps)
            }
            
        except Exception as e:
            logger.error(f"Gap analysis failed: {e}")
            return {
                'error': str(e),
                'gaps': [],
                'summary': {
                    'total_gaps': 0,
                    'high_priority_gaps': 0,
                    'total_development_time': 0,
                    'coverage_percentage': 0,
                    'match_score': 0
                }
            }
    
    def _get_required_level(self, skill_name: str, job_requirements: List[str], 
                          market_data: Dict[str, Any]) -> int:
        """Get required skill level for a job."""
        # This would typically use more sophisticated analysis
        # For now, use a simple heuristic
        
        # Check if skill is explicitly mentioned in requirements
        if skill_name in [req.lower() for req in job_requirements]:
            # Look for level indicators in requirements
            for req in job_requirements:
                req_lower = req.lower()
                if skill_name in req_lower:
                    if 'senior' in req_lower or 'expert' in req_lower:
                        return 5
                    elif 'intermediate' in req_lower or 'mid' in req_lower:
                        return 3
                    elif 'junior' in req_lower or 'entry' in req_lower:
                        return 2
                    else:
                        return 4  # Default to advanced level
        
        # Check market demand
        market_level = market_data.get('skill_levels', {}).get(skill_name, 3)
        return market_level
    
    def _calculate_priority(self, skill_name: str, market_data: Dict[str, Any]) -> float:
        """Calculate priority for a skill gap."""
        # Base priority
        priority = 0.5
        
        # Market demand factor
        market_demand = market_data.get('demand', {}).get(skill_name, 0.5)
        priority += market_demand * 0.3
        
        # Salary impact factor
        salary_impact = market_data.get('salary_impact', {}).get(skill_name, 0.5)
        priority += salary_impact * 0.2
        
        # Normalize to 0-1 range
        return min(1.0, max(0.0, priority))
    
    def _estimate_development_time(self, gap_size: int) -> int:
        """Estimate development time in months."""
        # Simple estimation: 2-3 months per skill level
        base_time = gap_size * 2.5
        
        # Add some variance
        variance = np.random.normal(0, 0.5)
        estimated_time = max(1, int(base_time + variance))
        
        return estimated_time
    
    def _calculate_coverage_percentage(self, user_skills: List[str], 
                                     job_requirements: List[str]) -> float:
        """Calculate percentage of job requirements covered by user skills."""
        if not job_requirements:
            return 100.0
        
        covered_skills = sum(1 for skill in job_requirements if skill in user_skills)
        return (covered_skills / len(job_requirements)) * 100
    
    def _calculate_match_score(self, user_skills: List[Dict[str, Any]], 
                             job_requirements: List[str]) -> float:
        """Calculate overall match score between user skills and job requirements."""
        if not job_requirements:
            return 100.0
        
        # Create skill vectors
        user_skill_vector = self._create_skill_vector(user_skills)
        job_requirement_vector = self._create_requirement_vector(job_requirements)
        
        # Calculate cosine similarity
        similarity = cosine_similarity([user_skill_vector], [job_requirement_vector])[0][0]
        
        # Convert to percentage
        return similarity * 100
    
    def _create_skill_vector(self, user_skills: List[Dict[str, Any]]) -> List[float]:
        """Create a vector representation of user skills."""
        # This is a simplified version - in practice, you'd use embeddings
        skill_vector = [0.0] * 100  # Fixed size vector
        
        for skill in user_skills:
            skill_name = skill.get('name', '').lower()
            skill_level = skill.get('level', 1)
            
            # Simple hash-based mapping
            hash_value = hash(skill_name) % 100
            skill_vector[hash_value] = skill_level / 5.0  # Normalize to 0-1
        
        return skill_vector
    
    def _create_requirement_vector(self, job_requirements: List[str]) -> List[float]:
        """Create a vector representation of job requirements."""
        requirement_vector = [0.0] * 100  # Fixed size vector
        
        for req in job_requirements:
            req_lower = req.lower()
            
            # Simple hash-based mapping
            hash_value = hash(req_lower) % 100
            requirement_vector[hash_value] = 1.0  # Mark as required
        
        return requirement_vector
    
    def _generate_gap_recommendations(self, skill_gaps: List[Dict[str, Any]], 
                                   market_data: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Generate recommendations for addressing skill gaps."""
        recommendations = []
        
        # Sort gaps by priority
        sorted_gaps = sorted(skill_gaps, key=lambda x: x['priority'], reverse=True)
        
        for gap in sorted_gaps[:5]:  # Top 5 gaps
            skill_name = gap['skill_name']
            
            recommendation = {
                'skill_name': skill_name,
                'priority': gap['priority'],
                'current_level': gap['current_level'],
                'target_level': gap['required_level'],
                'estimated_time': gap['estimated_time'],
                'actions': self._get_skill_development_actions(skill_name, gap),
                'resources': self._get_learning_resources(skill_name, market_data),
                'milestones': self._create_development_milestones(gap)
            }
            
            recommendations.append(recommendation)
        
        return recommendations
    
    def _get_skill_development_actions(self, skill_name: str, 
                                     gap: Dict[str, Any]) -> List[str]:
        """Get specific actions for skill development."""
        actions = []
        
        if gap.get('is_missing', False):
            actions.append(f"Start learning {skill_name} from scratch")
            actions.append(f"Take an introductory course in {skill_name}")
        else:
            actions.append(f"Improve {skill_name} from level {gap['current_level']} to {gap['required_level']}")
            actions.append(f"Practice {skill_name} in real-world projects")
        
        actions.append(f"Seek mentorship in {skill_name}")
        actions.append(f"Join {skill_name} communities and forums")
        actions.append(f"Work on {skill_name} projects in your current role")
        
        return actions
    
    def _get_learning_resources(self, skill_name: str, 
                              market_data: Dict[str, Any]) -> List[Dict[str, str]]:
        """Get learning resources for a skill."""
        # This would typically come from a learning management system
        resources = [
            {
                'type': 'course',
                'name': f'Complete {skill_name} Course',
                'provider': 'SkillSphere Learning',
                'duration': '8-12 weeks',
                'level': 'Beginner to Advanced'
            },
            {
                'type': 'book',
                'name': f'The Complete Guide to {skill_name}',
                'provider': 'Technical Books',
                'duration': 'Self-paced',
                'level': 'Comprehensive'
            },
            {
                'type': 'certification',
                'name': f'{skill_name} Professional Certification',
                'provider': 'Industry Standard',
                'duration': '3-6 months',
                'level': 'Professional'
            },
            {
                'type': 'practice',
                'name': f'{skill_name} Practice Projects',
                'provider': 'SkillSphere Labs',
                'duration': 'Ongoing',
                'level': 'Hands-on'
            }
        ]
        
        return resources
    
    def _create_development_milestones(self, gap: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Create development milestones for a skill gap."""
        milestones = []
        current_level = gap['current_level']
        target_level = gap['required_level']
        total_time = gap['estimated_time']
        
        # Create intermediate milestones
        for level in range(current_level + 1, target_level + 1):
            milestone = {
                'level': level,
                'description': f"Reach {skill_name} level {level}",
                'estimated_time': total_time / (target_level - current_level),
                'criteria': self._get_level_criteria(gap['skill_name'], level)
            }
            milestones.append(milestone)
        
        return milestones
    
    def _get_level_criteria(self, skill_name: str, level: int) -> List[str]:
        """Get criteria for reaching a specific skill level."""
        criteria = []
        
        if level == 1:
            criteria = [
                f"Understand basic {skill_name} concepts",
                f"Complete introductory {skill_name} tutorials",
                f"Demonstrate basic {skill_name} knowledge"
            ]
        elif level == 2:
            criteria = [
                f"Apply {skill_name} in simple projects",
                f"Understand intermediate {skill_name} concepts",
                f"Complete {skill_name} exercises independently"
            ]
        elif level == 3:
            criteria = [
                f"Use {skill_name} in complex projects",
                f"Teach {skill_name} to others",
                f"Contribute to {skill_name} discussions and forums"
            ]
        elif level == 4:
            criteria = [
                f"Lead {skill_name} projects",
                f"Design {skill_name} solutions",
                f"Mentor others in {skill_name}"
            ]
        elif level == 5:
            criteria = [
                f"Expert-level {skill_name} knowledge",
                f"Contribute to {skill_name} standards and best practices",
                f"Recognized as {skill_name} expert in the industry"
            ]
        
        return criteria
    
    def _create_development_timeline(self, skill_gaps: List[Dict[str, Any]]) -> Dict[str, Any]:
        """Create a development timeline for addressing skill gaps."""
        timeline = {
            'phases': [],
            'total_duration': 0,
            'critical_path': []
        }
        
        # Group gaps by priority
        high_priority = [gap for gap in skill_gaps if gap['priority'] >= 0.8]
        medium_priority = [gap for gap in skill_gaps if 0.5 <= gap['priority'] < 0.8]
        low_priority = [gap for gap in skill_gaps if gap['priority'] < 0.5]
        
        current_month = 0
        
        # Phase 1: High priority gaps (0-6 months)
        if high_priority:
            phase1 = {
                'name': 'Critical Skills Development',
                'duration': 6,
                'skills': high_priority,
                'start_month': current_month,
                'end_month': current_month + 6
            }
            timeline['phases'].append(phase1)
            current_month += 6
        
        # Phase 2: Medium priority gaps (6-12 months)
        if medium_priority:
            phase2 = {
                'name': 'Advanced Skills Development',
                'duration': 6,
                'skills': medium_priority,
                'start_month': current_month,
                'end_month': current_month + 6
            }
            timeline['phases'].append(phase2)
            current_month += 6
        
        # Phase 3: Low priority gaps (12+ months)
        if low_priority:
            phase3 = {
                'name': 'Specialized Skills Development',
                'duration': 6,
                'skills': low_priority,
                'start_month': current_month,
                'end_month': current_month + 6
            }
            timeline['phases'].append(phase3)
            current_month += 6
        
        timeline['total_duration'] = current_month
        timeline['critical_path'] = [gap['skill_name'] for gap in high_priority]
        
        return timeline
    
    def train(self, training_data: List[Dict[str, Any]]) -> bool:
        """
        Train the gap analysis model.
        
        Args:
            training_data: Training data for the model
            
        Returns:
            True if training successful
        """
        try:
            # This is a placeholder for actual model training
            # In practice, you'd train a model to predict gap priorities
            logger.info("Gap analysis model training completed")
            self.is_trained = True
            return True
        except Exception as e:
            logger.error(f"Gap analysis model training failed: {e}")
            return False
    
    def save_model(self, filepath: str) -> bool:
        """Save the trained model."""
        try:
            # Save model state
            model_data = {
                'model': self.model,
                'scaler': self.scaler,
                'is_trained': self.is_trained,
                'model_name': self.model_name
            }
            
            import joblib
            joblib.dump(model_data, filepath)
            logger.info(f"Gap analysis model saved to {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to save gap analysis model: {e}")
            return False
    
    def load_model(self, filepath: str) -> bool:
        """Load a trained model."""
        try:
            import joblib
            model_data = joblib.load(filepath)
            
            self.model = model_data['model']
            self.scaler = model_data['scaler']
            self.is_trained = model_data['is_trained']
            self.model_name = model_data['model_name']
            
            logger.info(f"Gap analysis model loaded from {filepath}")
            return True
        except Exception as e:
            logger.error(f"Failed to load gap analysis model: {e}")
            return False
