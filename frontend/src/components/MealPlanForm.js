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
          {mealPlan.meal_plan.map((day, index) => (
            <div key={index} className="day-plan">
              <h4>Day {day.day}</h4>
              <div className="meal-plan-container">
                <table className="meal-table">
                  <thead>
                    <tr>
                      <th>Meal Type</th>
                      <th>Dish Name</th>
                      <th>Cuisine</th>
                      <th>Calories</th>
                      <th>Protein</th>
                      <th>Carbs</th>
                      <th>Fat</th>
                      <th>Details</th>
                    </tr>
                  </thead>
                  <tbody>
                    {day.meals.map((meal, mealIndex) => (
                      <React.Fragment key={mealIndex}>
                        <tr>
                          <td className="meal-type">{meal.type}</td>
                          <td className="meal-name">{meal.name}</td>
                          <td className="cuisine">{meal.cuisine}</td>
                          <td>{meal.calories}</td>
                          <td>{meal.nutrition.protein}</td>
                          <td>{meal.nutrition.carbs}</td>
                          <td>{meal.nutrition.fat}</td>
                          <td>
                            <button 
                              className="details-button"
                              onClick={() => {
                                const element = document.getElementById(`recipe-${day.day}-${mealIndex}`);
                                element.style.display = element.style.display === 'none' ? 'block' : 'none';
                              }}
                            >
                              Show Recipe
                            </button>
                          </td>
                        </tr>
                        <tr id={`recipe-${day.day}-${mealIndex}`} className="recipe-details" style={{display: 'none'}}>
                          <td colSpan="8">
                            <div className="recipe-content">
                              <div className="ingredients">
                                <h5>Ingredients:</h5>
                                <ul>
                                  {meal.ingredients.map((ing, i) => (
                                    <li key={i}>{ing.amount} {ing.item}</li>
                                  ))}
                                </ul>
                              </div>
                              <div className="recipe-steps">
                                <h5>Recipe Steps:</h5>
                                <ol>
                                  {meal.recipe_steps.map((step, i) => (
                                    <li key={i}>{step}</li>
                                  ))}
                                </ol>
                              </div>
                            </div>
                          </td>
                        </tr>
                      </React.Fragment>
                    ))}
                    <tr className="total-row">
                      <td colSpan="3">Daily Total</td>
                      <td>{day.total_calories}</td>
                      <td colSpan="4"></td>
                    </tr>
                  </tbody>
                </table>
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