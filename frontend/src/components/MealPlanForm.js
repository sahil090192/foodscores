import React, { useState } from 'react';

const steps = [
  'Plan Duration',
  'Calorie Goal',
  'Health Conditions',
  'Cuisine Preferences',
  'Additional Options'
];

const healthConditions = [
  'Diabetes',
  'Heart Disease',
  'High Blood Pressure',
  'Gluten Free',
  'Lactose Intolerant'
];

const cuisineTypes = [
  'Italian',
  'Indian',
  'Chinese',
  'Mexican',
  'Mediterranean',
  'Japanese',
  'American'
];

function MealPlanForm() {
  const [activeStep, setActiveStep] = useState(0);
  const [formData, setFormData] = useState({
    numberOfDays: '1',
    dailyCalories: '',
    healthConditions: [],
    cuisinePreferences: [],
    includeCheatMeal: false
  });
  const [errors, setErrors] = useState({});

  const validateStep = (step) => {
    const newErrors = {};

    switch (step) {
      case 0: // Plan Duration
        if (!formData.numberOfDays) {
          newErrors.numberOfDays = 'Please select number of days';
        }
        break;

      case 1: // Calorie Goal
        if (!formData.dailyCalories) {
          newErrors.dailyCalories = 'Please enter daily calorie goal';
        } else if (formData.dailyCalories < 1000 || formData.dailyCalories > 5000) {
          newErrors.dailyCalories = 'Calories must be between 1000 and 5000';
        }
        break;

      case 2: // Health Conditions
        // Optional, no validation needed
        break;

      case 3: // Cuisine Preferences
        if (formData.cuisinePreferences.length === 0) {
          newErrors.cuisinePreferences = 'Please select at least one cuisine';
        }
        break;

      case 4: // Additional Options
        // Optional, no validation needed
        break;

      default:
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validateStep(activeStep)) {
      setActiveStep(prevStep => prevStep + 1);
    }
  };

  const handleBack = () => {
    setErrors({});
    if (activeStep > 0) {
      setActiveStep(prevStep => prevStep - 1);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateStep(activeStep)) {
      console.log('Form submitted:', formData);
      // We'll add API call here later
    }
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name === 'includeCheatMeal') {
        setFormData({ ...formData, [name]: checked });
      } else if (name === 'healthConditions') {
        const updatedConditions = checked
          ? [...formData.healthConditions, value]
          : formData.healthConditions.filter(condition => condition !== value);
        setFormData({ ...formData, healthConditions: updatedConditions });
      } else if (name === 'cuisinePreferences') {
        const updatedCuisines = checked
          ? [...formData.cuisinePreferences, value]
          : formData.cuisinePreferences.filter(cuisine => cuisine !== value);
        setFormData({ ...formData, cuisinePreferences: updatedCuisines });
        setErrors({ ...errors, cuisinePreferences: '' }); // Clear error when selection made
      }
    } else {
      setFormData({ ...formData, [name]: value });
      if (errors[name]) {
        setErrors({ ...errors, [name]: '' }); // Clear error when value changes
      }
    }
  };

  const renderStepContent = () => {
    switch (activeStep) {
      case 0:
        return (
          <div className="form-step">
            <h3>How many days of meal plan do you want?</h3>
            <select 
              name="numberOfDays" 
              value={formData.numberOfDays}
              onChange={handleInputChange}
              className={`form-select ${errors.numberOfDays ? 'error' : ''}`}
            >
              <option value="1">1 Day</option>
              <option value="5">5 Days</option>
              <option value="7">7 Days</option>
            </select>
            {errors.numberOfDays && <div className="error-message">{errors.numberOfDays}</div>}
          </div>
        );
      
      case 1:
        return (
          <div className="form-step">
            <h3>What's your daily calorie target?</h3>
            <input
              type="number"
              name="dailyCalories"
              value={formData.dailyCalories}
              onChange={handleInputChange}
              placeholder="Enter calories (e.g., 2000)"
              className={`form-input ${errors.dailyCalories ? 'error' : ''}`}
              min="1000"
              max="5000"
            />
            {errors.dailyCalories && <div className="error-message">{errors.dailyCalories}</div>}
          </div>
        );
      
      case 2:
        return (
          <div className="form-step">
            <h3>Select any health conditions to consider:</h3>
            <div className="checkbox-group">
              {healthConditions.map(condition => (
                <label key={condition} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="healthConditions"
                    value={condition}
                    checked={formData.healthConditions.includes(condition)}
                    onChange={handleInputChange}
                  />
                  {condition}
                </label>
              ))}
            </div>
          </div>
        );
      
      case 3:
        return (
          <div className="form-step">
            <h3>Select your preferred cuisines:</h3>
            <div className="checkbox-group">
              {cuisineTypes.map(cuisine => (
                <label key={cuisine} className="checkbox-label">
                  <input
                    type="checkbox"
                    name="cuisinePreferences"
                    value={cuisine}
                    checked={formData.cuisinePreferences.includes(cuisine)}
                    onChange={handleInputChange}
                  />
                  {cuisine}
                </label>
              ))}
            </div>
            {errors.cuisinePreferences && <div className="error-message">{errors.cuisinePreferences}</div>}
          </div>
        );
      
      case 4:
        return (
          <div className="form-step">
            <h3>Additional Options:</h3>
            <label className="checkbox-label">
              <input
                type="checkbox"
                name="includeCheatMeal"
                checked={formData.includeCheatMeal}
                onChange={handleInputChange}
              />
              Include a cheat meal in the plan
            </label>
          </div>
        );
      
      default:
        return null;
    }
  };

  return (
    <div className="meal-plan-form">
      <div className="stepper">
        {steps.map((label, index) => (
          <div 
            key={label} 
            className={`step ${index === activeStep ? 'active' : ''} ${index < activeStep ? 'completed' : ''}`}
          >
            {label}
          </div>
        ))}
      </div>

      <form onSubmit={(e) => e.preventDefault()}>
        <div className="form-content">
          {renderStepContent()}
        </div>

        <div className="form-navigation">
          <button 
            type="button"
            onClick={handleBack}
            disabled={activeStep === 0}
            className="nav-button"
          >
            Back
          </button>
          <button 
            type="button"
            onClick={activeStep === steps.length - 1 ? handleSubmit : handleNext}
            className="nav-button primary"
          >
            {activeStep === steps.length - 1 ? 'Generate Plan' : 'Next'}
          </button>
        </div>
      </form>
    </div>
  );
}

export default MealPlanForm; 