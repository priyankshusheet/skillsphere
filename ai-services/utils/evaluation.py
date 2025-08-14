"""
Evaluation utilities for SkillSphere AI services.
Handles model performance assessment and metrics calculation.
"""

import numpy as np
import pandas as pd
from typing import Dict, List, Any, Tuple, Optional
from sklearn.metrics import (
    accuracy_score, precision_score, recall_score, f1_score,
    confusion_matrix, classification_report, mean_squared_error,
    mean_absolute_error, r2_score, roc_auc_score, roc_curve
)
from sklearn.model_selection import cross_val_score, KFold
import matplotlib.pyplot as plt
import seaborn as sns
import logging
from datetime import datetime
import json
import os

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class ModelEvaluator:
    """Comprehensive model evaluation utilities."""
    
    def __init__(self):
        """Initialize model evaluator."""
        self.metrics_history = []
        self.evaluation_results = {}
    
    def evaluate_classification(self, y_true: np.ndarray, y_pred: np.ndarray, 
                              y_prob: Optional[np.ndarray] = None,
                              labels: Optional[List[str]] = None) -> Dict[str, float]:
        """
        Evaluate classification model performance.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            y_prob: Predicted probabilities (optional)
            labels: Label names (optional)
            
        Returns:
            Dictionary of evaluation metrics
        """
        metrics = {}
        
        # Basic classification metrics
        metrics['accuracy'] = accuracy_score(y_true, y_pred)
        metrics['precision_macro'] = precision_score(y_true, y_pred, average='macro', zero_division=0)
        metrics['precision_weighted'] = precision_score(y_true, y_pred, average='weighted', zero_division=0)
        metrics['recall_macro'] = recall_score(y_true, y_pred, average='macro', zero_division=0)
        metrics['recall_weighted'] = recall_score(y_true, y_pred, average='weighted', zero_division=0)
        metrics['f1_macro'] = f1_score(y_true, y_pred, average='macro', zero_division=0)
        metrics['f1_weighted'] = f1_score(y_true, y_pred, average='weighted', zero_division=0)
        
        # Per-class metrics
        if labels:
            for i, label in enumerate(labels):
                metrics[f'precision_{label}'] = precision_score(y_true, y_pred, labels=[i], average=None, zero_division=0)[0]
                metrics[f'recall_{label}'] = recall_score(y_true, y_pred, labels=[i], average=None, zero_division=0)[0]
                metrics[f'f1_{label}'] = f1_score(y_true, y_pred, labels=[i], average=None, zero_division=0)[0]
        
        # ROC AUC if probabilities provided
        if y_prob is not None:
            if len(np.unique(y_true)) == 2:
                metrics['roc_auc'] = roc_auc_score(y_true, y_prob[:, 1])
            else:
                metrics['roc_auc'] = roc_auc_score(y_true, y_prob, multi_class='ovr')
        
        return metrics
    
    def evaluate_regression(self, y_true: np.ndarray, y_pred: np.ndarray) -> Dict[str, float]:
        """
        Evaluate regression model performance.
        
        Args:
            y_true: True values
            y_pred: Predicted values
            
        Returns:
            Dictionary of evaluation metrics
        """
        metrics = {}
        
        metrics['mse'] = mean_squared_error(y_true, y_pred)
        metrics['rmse'] = np.sqrt(metrics['mse'])
        metrics['mae'] = mean_absolute_error(y_true, y_pred)
        metrics['r2'] = r2_score(y_true, y_pred)
        
        # Additional metrics
        metrics['mape'] = np.mean(np.abs((y_true - y_pred) / np.where(y_true != 0, y_true, 1))) * 100
        metrics['smape'] = 2.0 * np.mean(np.abs(y_pred - y_true) / (np.abs(y_true) + np.abs(y_pred))) * 100
        
        return metrics
    
    def evaluate_clustering(self, X: np.ndarray, labels: np.ndarray) -> Dict[str, float]:
        """
        Evaluate clustering model performance.
        
        Args:
            X: Input features
            labels: Cluster labels
            
        Returns:
            Dictionary of evaluation metrics
        """
        from sklearn.metrics import silhouette_score, calinski_harabasz_score, davies_bouldin_score
        
        metrics = {}
        
        if len(np.unique(labels)) > 1:
            metrics['silhouette_score'] = silhouette_score(X, labels)
            metrics['calinski_harabasz_score'] = calinski_harabasz_score(X, labels)
            metrics['davies_bouldin_score'] = davies_bouldin_score(X, labels)
        
        return metrics
    
    def cross_validate_model(self, model, X: np.ndarray, y: np.ndarray, 
                           cv_folds: int = 5, scoring: str = 'accuracy') -> Dict[str, float]:
        """
        Perform cross-validation on a model.
        
        Args:
            model: Sklearn-compatible model
            X: Input features
            y: Target values
            cv_folds: Number of cross-validation folds
            scoring: Scoring metric
            
        Returns:
            Dictionary of cross-validation results
        """
        cv = KFold(n_splits=cv_folds, shuffle=True, random_state=42)
        scores = cross_val_score(model, X, y, cv=cv, scoring=scoring)
        
        results = {
            f'{scoring}_mean': scores.mean(),
            f'{scoring}_std': scores.std(),
            f'{scoring}_min': scores.min(),
            f'{scoring}_max': scores.max(),
            'cv_scores': scores.tolist()
        }
        
        return results
    
    def generate_confusion_matrix(self, y_true: np.ndarray, y_pred: np.ndarray,
                                labels: Optional[List[str]] = None,
                                save_path: Optional[str] = None) -> np.ndarray:
        """
        Generate and optionally save confusion matrix.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            labels: Label names
            save_path: Path to save confusion matrix plot
            
        Returns:
            Confusion matrix array
        """
        cm = confusion_matrix(y_true, y_pred)
        
        if save_path:
            plt.figure(figsize=(10, 8))
            sns.heatmap(cm, annot=True, fmt='d', cmap='Blues', 
                       xticklabels=labels, yticklabels=labels)
            plt.title('Confusion Matrix')
            plt.ylabel('True Label')
            plt.xlabel('Predicted Label')
            plt.tight_layout()
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.close()
        
        return cm
    
    def generate_classification_report(self, y_true: np.ndarray, y_pred: np.ndarray,
                                     labels: Optional[List[str]] = None) -> str:
        """
        Generate detailed classification report.
        
        Args:
            y_true: True labels
            y_pred: Predicted labels
            labels: Label names
            
        Returns:
            Classification report string
        """
        return classification_report(y_true, y_pred, target_names=labels, zero_division=0)
    
    def plot_roc_curve(self, y_true: np.ndarray, y_prob: np.ndarray,
                      labels: Optional[List[str]] = None,
                      save_path: Optional[str] = None):
        """
        Plot ROC curve.
        
        Args:
            y_true: True labels
            y_prob: Predicted probabilities
            labels: Label names
            save_path: Path to save ROC curve plot
        """
        if len(np.unique(y_true)) == 2:
            # Binary classification
            fpr, tpr, _ = roc_curve(y_true, y_prob[:, 1])
            auc = roc_auc_score(y_true, y_prob[:, 1])
            
            plt.figure(figsize=(8, 6))
            plt.plot(fpr, tpr, label=f'ROC Curve (AUC = {auc:.3f})')
            plt.plot([0, 1], [0, 1], 'k--', label='Random')
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title('ROC Curve')
            plt.legend()
            plt.grid(True)
            
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.show()
        else:
            # Multi-class classification
            from sklearn.preprocessing import label_binarize
            from itertools import cycle
            
            y_bin = label_binarize(y_true, classes=np.unique(y_true))
            n_classes = y_bin.shape[1]
            
            fpr = dict()
            tpr = dict()
            roc_auc = dict()
            
            for i in range(n_classes):
                fpr[i], tpr[i], _ = roc_curve(y_bin[:, i], y_prob[:, i])
                roc_auc[i] = roc_auc_score(y_bin[:, i], y_prob[:, i])
            
            plt.figure(figsize=(10, 8))
            colors = cycle(['aqua', 'darkorange', 'cornflowerblue', 'red', 'green'])
            
            for i, color in zip(range(n_classes), colors):
                label = labels[i] if labels else f'Class {i}'
                plt.plot(fpr[i], tpr[i], color=color, lw=2,
                        label=f'{label} (AUC = {roc_auc[i]:.3f})')
            
            plt.plot([0, 1], [0, 1], 'k--', lw=2)
            plt.xlim([0.0, 1.0])
            plt.ylim([0.0, 1.05])
            plt.xlabel('False Positive Rate')
            plt.ylabel('True Positive Rate')
            plt.title('Multi-class ROC Curve')
            plt.legend(loc="lower right")
            plt.grid(True)
            
            if save_path:
                plt.savefig(save_path, dpi=300, bbox_inches='tight')
            plt.show()

class SkillsAssessmentEvaluator:
    """Specialized evaluator for skills assessment models."""
    
    def __init__(self):
        """Initialize skills assessment evaluator."""
        self.evaluator = ModelEvaluator()
    
    def evaluate_skill_level_prediction(self, true_levels: np.ndarray, 
                                      predicted_levels: np.ndarray,
                                      confidence_scores: Optional[np.ndarray] = None) -> Dict[str, float]:
        """
        Evaluate skill level prediction accuracy.
        
        Args:
            true_levels: True skill levels (1-5)
            predicted_levels: Predicted skill levels (1-5)
            confidence_scores: Confidence scores for predictions
            
        Returns:
            Dictionary of evaluation metrics
        """
        metrics = self.evaluator.evaluate_regression(true_levels, predicted_levels)
        
        # Additional skills-specific metrics
        metrics['level_accuracy'] = np.mean(true_levels == predicted_levels)
        metrics['within_one_level'] = np.mean(np.abs(true_levels - predicted_levels) <= 1)
        metrics['within_two_levels'] = np.mean(np.abs(true_levels - predicted_levels) <= 2)
        
        # Confidence-weighted accuracy
        if confidence_scores is not None:
            weighted_accuracy = np.average(true_levels == predicted_levels, weights=confidence_scores)
            metrics['confidence_weighted_accuracy'] = weighted_accuracy
        
        return metrics
    
    def evaluate_skill_gap_analysis(self, true_gaps: List[str], 
                                  predicted_gaps: List[str]) -> Dict[str, float]:
        """
        Evaluate skill gap analysis accuracy.
        
        Args:
            true_gaps: True skill gaps
            predicted_gaps: Predicted skill gaps
            
        Returns:
            Dictionary of evaluation metrics
        """
        # Convert to sets for comparison
        true_gap_set = set(true_gaps)
        pred_gap_set = set(predicted_gaps)
        
        # Calculate set-based metrics
        intersection = true_gap_set.intersection(pred_gap_set)
        union = true_gap_set.union(pred_gap_set)
        
        metrics = {
            'precision': len(intersection) / len(pred_gap_set) if pred_gap_set else 0,
            'recall': len(intersection) / len(true_gap_set) if true_gap_set else 0,
            'f1_score': 2 * len(intersection) / len(union) if union else 0,
            'jaccard_similarity': len(intersection) / len(union) if union else 0
        }
        
        return metrics
    
    def evaluate_learning_recommendations(self, user_preferences: List[str],
                                        recommended_courses: List[str],
                                        course_relevance_scores: Optional[List[float]] = None) -> Dict[str, float]:
        """
        Evaluate learning recommendation quality.
        
        Args:
            user_preferences: User's learning preferences
            recommended_courses: Recommended courses
            course_relevance_scores: Relevance scores for courses
            
        Returns:
            Dictionary of evaluation metrics
        """
        # This is a simplified evaluation - in practice, you'd have user feedback
        metrics = {}
        
        # Calculate preference alignment
        preference_keywords = set()
        for pref in user_preferences:
            preference_keywords.update(pref.lower().split())
        
        course_keywords = set()
        for course in recommended_courses:
            course_keywords.update(course.lower().split())
        
        keyword_overlap = len(preference_keywords.intersection(course_keywords))
        keyword_coverage = keyword_overlap / len(preference_keywords) if preference_keywords else 0
        
        metrics['keyword_coverage'] = keyword_coverage
        metrics['recommendation_diversity'] = len(set(recommended_courses)) / len(recommended_courses)
        
        if course_relevance_scores:
            metrics['average_relevance'] = np.mean(course_relevance_scores)
            metrics['relevance_std'] = np.std(course_relevance_scores)
        
        return metrics

class ModelPerformanceTracker:
    """Track and compare model performance over time."""
    
    def __init__(self, save_dir: str = "evaluation_results"):
        """
        Initialize performance tracker.
        
        Args:
            save_dir: Directory to save evaluation results
        """
        self.save_dir = save_dir
        self.performance_history = []
        
        # Create save directory if it doesn't exist
        os.makedirs(save_dir, exist_ok=True)
    
    def add_evaluation(self, model_name: str, metrics: Dict[str, float],
                      timestamp: Optional[datetime] = None,
                      model_version: Optional[str] = None,
                      dataset_info: Optional[Dict[str, Any]] = None):
        """
        Add evaluation results to history.
        
        Args:
            model_name: Name of the model
            metrics: Evaluation metrics
            timestamp: Evaluation timestamp
            model_version: Model version
            dataset_info: Information about the dataset used
        """
        if timestamp is None:
            timestamp = datetime.now()
        
        evaluation_record = {
            'model_name': model_name,
            'model_version': model_version,
            'timestamp': timestamp.isoformat(),
            'metrics': metrics,
            'dataset_info': dataset_info or {}
        }
        
        self.performance_history.append(evaluation_record)
        
        # Save to file
        self._save_evaluation_record(evaluation_record)
    
    def get_model_performance(self, model_name: str) -> List[Dict[str, Any]]:
        """
        Get performance history for a specific model.
        
        Args:
            model_name: Name of the model
            
        Returns:
            List of performance records
        """
        return [record for record in self.performance_history 
                if record['model_name'] == model_name]
    
    def compare_models(self, model_names: List[str], 
                      metric: str = 'accuracy') -> pd.DataFrame:
        """
        Compare performance of multiple models.
        
        Args:
            model_names: List of model names to compare
            metric: Metric to compare
            
        Returns:
            DataFrame with comparison results
        """
        comparison_data = []
        
        for model_name in model_names:
            model_performance = self.get_model_performance(model_name)
            
            for record in model_performance:
                if metric in record['metrics']:
                    comparison_data.append({
                        'model_name': model_name,
                        'model_version': record.get('model_version', 'unknown'),
                        'timestamp': record['timestamp'],
                        metric: record['metrics'][metric]
                    })
        
        return pd.DataFrame(comparison_data)
    
    def plot_performance_trend(self, model_name: str, metric: str = 'accuracy',
                              save_path: Optional[str] = None):
        """
        Plot performance trend over time for a model.
        
        Args:
            model_name: Name of the model
            metric: Metric to plot
            save_path: Path to save the plot
        """
        model_performance = self.get_model_performance(model_name)
        
        if not model_performance:
            logger.warning(f"No performance data found for model: {model_name}")
            return
        
        timestamps = [record['timestamp'] for record in model_performance]
        values = [record['metrics'].get(metric, 0) for record in model_performance]
        
        plt.figure(figsize=(12, 6))
        plt.plot(timestamps, values, marker='o', linewidth=2, markersize=6)
        plt.title(f'{metric.title()} Trend for {model_name}')
        plt.xlabel('Time')
        plt.ylabel(metric.title())
        plt.xticks(rotation=45)
        plt.grid(True, alpha=0.3)
        plt.tight_layout()
        
        if save_path:
            plt.savefig(save_path, dpi=300, bbox_inches='tight')
        plt.show()
    
    def generate_performance_report(self, model_name: str) -> str:
        """
        Generate a comprehensive performance report.
        
        Args:
            model_name: Name of the model
            
        Returns:
            Performance report string
        """
        model_performance = self.get_model_performance(model_name)
        
        if not model_performance:
            return f"No performance data found for model: {model_name}"
        
        report = f"Performance Report for {model_name}\n"
        report += "=" * 50 + "\n\n"
        
        # Latest performance
        latest = max(model_performance, key=lambda x: x['timestamp'])
        report += f"Latest Evaluation: {latest['timestamp']}\n"
        report += f"Model Version: {latest.get('model_version', 'unknown')}\n\n"
        
        report += "Latest Metrics:\n"
        for metric, value in latest['metrics'].items():
            report += f"  {metric}: {value:.4f}\n"
        
        report += "\nPerformance History:\n"
        for record in sorted(model_performance, key=lambda x: x['timestamp']):
            report += f"  {record['timestamp']}: {record['metrics']}\n"
        
        return report
    
    def _save_evaluation_record(self, record: Dict[str, Any]):
        """Save evaluation record to file."""
        filename = f"{record['model_name']}_{record['timestamp']}.json"
        filepath = os.path.join(self.save_dir, filename)
        
        with open(filepath, 'w') as f:
            json.dump(record, f, indent=2, default=str)

def create_evaluation_pipeline() -> Dict[str, Any]:
    """
    Create a complete evaluation pipeline.
    
    Returns:
        Dictionary containing all evaluators
    """
    return {
        'model_evaluator': ModelEvaluator(),
        'skills_evaluator': SkillsAssessmentEvaluator(),
        'performance_tracker': ModelPerformanceTracker()
    }

if __name__ == "__main__":
    # Example usage
    pipeline = create_evaluation_pipeline()
    
    # Mock data for testing
    y_true = np.array([1, 2, 3, 4, 5, 1, 2, 3, 4, 5])
    y_pred = np.array([1, 2, 3, 4, 4, 1, 2, 3, 5, 5])
    
    # Test regression evaluation
    metrics = pipeline['model_evaluator'].evaluate_regression(y_true, y_pred)
    print(f"Regression metrics: {metrics}")
    
    # Test skills evaluation
    skills_metrics = pipeline['skills_evaluator'].evaluate_skill_level_prediction(y_true, y_pred)
    print(f"Skills assessment metrics: {skills_metrics}")
    
    # Test performance tracking
    pipeline['performance_tracker'].add_evaluation(
        'test_model', 
        metrics, 
        model_version='1.0.0'
    )
    
    report = pipeline['performance_tracker'].generate_performance_report('test_model')
    print(report)
