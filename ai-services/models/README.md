# AI Models Directory

This directory contains trained machine learning models and data used by the SkillSphere AI services.

## Structure

```
models/
├── trained_models/     # Saved model files (.pkl, .joblib, .h5)
├── data/              # Training and test datasets
└── README.md          # This file
```

## Model Files

### Skills Analyzer Model
- **File**: `trained_models/skills_analyzer.pkl`
- **Purpose**: Analyzes user skills and provides recommendations
- **Input**: User skills data, job descriptions, market trends
- **Output**: Skill gaps, recommendations, career paths

### Skills Classification Model
- **File**: `trained_models/skills_classifier.pkl`
- **Purpose**: Classifies and categorizes skills
- **Input**: Skill descriptions, job titles, industry data
- **Output**: Skill categories, levels, relevance scores

## Data Files

### Training Data
- **File**: `data/skills_dataset.csv`
- **Description**: Historical skills data for training models
- **Columns**: skill_name, category, level, experience, industry, demand_score

### Market Data
- **File**: `data/market_trends.json`
- **Description**: Current market trends and skill demands
- **Content**: Skill demand trends, salary data, growth projections

### Job Descriptions
- **File**: `data/job_descriptions.json`
- **Description**: Sample job descriptions for skill matching
- **Content**: Job titles, descriptions, required skills, experience levels

## Usage

Models are automatically loaded by the AI services when the application starts. The models are used for:

1. **Skills Analysis**: Analyzing user skills and identifying gaps
2. **Recommendations**: Suggesting learning paths and career development
3. **Market Insights**: Providing industry trends and demand data
4. **Skill Matching**: Matching skills to job requirements

## Model Updates

To update models:

1. Retrain models with new data
2. Save updated models to `trained_models/`
3. Update model version in configuration
4. Restart AI services

## Security

- Model files should not be committed to version control
- Use environment variables for model paths
- Implement model versioning and rollback capabilities
- Monitor model performance and accuracy

## Performance

- Models are loaded once at startup for optimal performance
- Implement caching for frequently accessed predictions
- Monitor memory usage and model inference times
- Consider model optimization for production deployment
