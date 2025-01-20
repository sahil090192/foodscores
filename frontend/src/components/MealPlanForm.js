import React, { useState, useEffect } from 'react';

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

const loadingMessages = [
  "Whisking together your preferences into a perfect meal plan...",
  "Sautéing your health goals with a dash of cultural flavors...",
  "Spinning grandma's wisdom with a splash of AI magic...",
  "Simmering the perfect blend of recipes tailored just for you...",
  "Chopping through recipe books to find your ideal bites...",
  "Mixing ancient recipes with cutting-edge tech...",
  "Consulting every chef, cookbook, and search engine to serve you the best...",
  "Loading up flavors, one byte at a time...",
  "Fetching the freshest recipes from our culinary database...",
  "Cooking up a storm of ideas for your plate..."
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
  const [isLoading, setIsLoading] = useState(false);
  const [mealPlan, setMealPlan] = useState(null);
  const [error, setError] = useState(null);
  const [loadingMessage, setLoadingMessage] = useState("");

  useEffect(() => {
    if (isLoading) {
      const cycleMessages = () => {
        const randomIndex = Math.floor(Math.random() * loadingMessages.length);
        setLoadingMessage(loadingMessages[randomIndex]);
      };

      cycleMessages();

      const interval = setInterval(cycleMessages, 3000);

      return () => clearInterval(interval);
    }
  }, [isLoading]);

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

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (validateStep(activeStep)) {
      setIsLoading(true);
      setError(null);
      
      try {
        const response = await fetch('http://localhost:8000/api/meal-plan', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(formData)
        });

        if (!response.ok) {
          throw new Error('Failed to generate meal plan');
        }

        const data = await response.json();
        setMealPlan(data);
        // Move to results display
        setActiveStep(steps.length);
      } catch (err) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
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

  const handleCuisinePercentageChange = (cuisine, percentage) => {
    const updatedPreferences = formData.cuisinePreferences.map(pref => {
      if (pref.startsWith(cuisine)) {
        return `${cuisine}:${percentage}%`;
      }
      return pref;
    });
    setFormData({ ...formData, cuisinePreferences: updatedPreferences });
  };

  const downloadCSV = () => {
    if (!mealPlan) return;

    // Create CSV content with ingredients and recipe steps
    let csvContent = "Day,Meal Type,Dish Name,Cuisine,Calories,Protein,Carbs,Fat,Ingredients,Recipe Steps\n";
    
    mealPlan.meal_plan.forEach(day => {
      day.meals.forEach(meal => {
        const ingredients = meal.ingredients.map(ing => `${ing.amount} ${ing.item}`).join('; ');
        const steps = meal.recipe_steps.join('; ');
        csvContent += `${day.day},${meal.type},"${meal.name}",${meal.cuisine},${meal.calories},${meal.nutrition.protein},${meal.nutrition.carbs},${meal.nutrition.fat},"${ingredients}","${steps}"\n`;
      });
      csvContent += `${day.day},Daily Total,,,,${day.total_calories},,,\n`;
    });

    // Create and trigger download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', 'meal_plan.csv');
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
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
            <h3>Select your preferred cuisines and their proportions:</h3>
            <div className="cuisine-selection">
              {cuisineTypes.map(cuisine => (
                <div key={cuisine} className="cuisine-option">
                  <label className="checkbox-label">
                    <input
                      type="checkbox"
                      name="cuisinePreferences"
                      value={cuisine}
                      checked={formData.cuisinePreferences.some(pref => pref.startsWith(cuisine))}
                      onChange={(e) => {
                        const updatedPreferences = e.target.checked
                          ? [...formData.cuisinePreferences, `${cuisine}:${100 / (formData.cuisinePreferences.length + 1)}%`]
                          : formData.cuisinePreferences.filter(pref => !pref.startsWith(cuisine));
                        
                        // Recalculate percentages to total 100%
                        if (updatedPreferences.length > 0) {
                          const equalPercentage = Math.floor(100 / updatedPreferences.length);
                          const adjustedPreferences = updatedPreferences.map((pref, index) => {
                            const cuisine = pref.split(':')[0];
                            const percentage = index === updatedPreferences.length - 1 
                              ? 100 - (equalPercentage * (updatedPreferences.length - 1))
                              : equalPercentage;
                            return `${cuisine}:${percentage}%`;
                          });
                          setFormData({ ...formData, cuisinePreferences: adjustedPreferences });
                        } else {
                          setFormData({ ...formData, cuisinePreferences: [] });
                        }
                      }}
                    />
                    {cuisine}
                  </label>
                  {formData.cuisinePreferences.some(pref => pref.startsWith(cuisine)) && (
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={parseInt(formData.cuisinePreferences.find(pref => pref.startsWith(cuisine)).split(':')[1])}
                      onChange={(e) => handleCuisinePercentageChange(cuisine, e.target.value)}
                      className="percentage-input"
                    />
                  )}
                </div>
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

  const renderMealTable = (meals, dayNumber) => {
    return (
      <table className="meal-table">
        <thead>
          <tr>
            <th>Meal</th>
            <th>Name</th>
            <th>Cuisine</th>
            <th>Calories</th>
            <th>Nutrition</th>
          </tr>
        </thead>
        <tbody>
          {meals.map((meal, index) => (
            <tr key={index}>
              <td>{meal.type}</td>
              <td>{meal.name}</td>
              <td>{meal.cuisine}</td>
              <td>{meal.calories}</td>
              <td>
                Protein: {meal.nutrition.protein}<br />
                Carbs: {meal.nutrition.carbs}<br />
                Fat: {meal.nutrition.fat}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderResults = () => {
    if (error) {
      return (
        <div className="error-message">
          <h3>Error generating meal plan</h3>
          <p>{error}</p>
          <button onClick={() => setActiveStep(0)} className="nav-button">
            Start Over
          </button>
        </div>
      );
    }

    if (mealPlan) {
      return (
        <div className="meal-plan-results">
          <h3>Your Custom Meal Plan</h3>
          <div className="disclaimer">
            ⚠️ Disclaimer: The nutritional information provided is an estimate. Please verify these values with other sources if they seem incorrect.
          </div>
          {mealPlan.meal_plan.map((day, index) => (
            <div key={index} className="day-plan">
              <h4>Day {day.day}</h4>
              <div className="meal-plan-container">
                {renderMealTable(day.meals, day.day)}
              </div>
            </div>
          ))}
          <div className="action-buttons">
            <button onClick={downloadCSV} className="nav-button secondary">
              Download as CSV
            </button>
            <button 
              onClick={() => {
                setMealPlan(null);
                setActiveStep(0);
              }} 
              className="nav-button primary"
            >
              Generate New Plan
            </button>
          </div>
          <div className="generation-time">
            Request completed in {mealPlan.generation_time.toFixed(2)} seconds
          </div>
        </div>
      );
    }
  };

  return (
    <div className="meal-plan-form">
      {isLoading ? (
        <div className="loading">
          <div className="loading-message">
            {loadingMessage}
          </div>
        </div>
      ) : activeStep === steps.length ? (
        renderResults()
      ) : (
        <>
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
        </>
      )}
    </div>
  );
}

export default MealPlanForm; 