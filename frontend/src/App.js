import React, { useState } from 'react';
import './App.css';

function App() {
  const [foodItem, setFoodItem] = useState('');
  const [nutritionData, setNutritionData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`http://localhost:8000/analyze/${encodeURIComponent(foodItem)}`);
      if (!response.ok) {
        throw new Error('Failed to fetch nutrition data');
      }
      const data = await response.json();
      setNutritionData(data);
    } catch (err) {
      setError(err.message);
      console.error('Error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="App">
      <h1>FoodScores</h1>
      <div className="container">
        <form onSubmit={handleSubmit}>
          <input
            type="text"
            value={foodItem}
            onChange={(e) => setFoodItem(e.target.value)}
            placeholder="Enter a food item (e.g., 1 large apple)"
            disabled={loading}
          />
          <button type="submit" disabled={loading || !foodItem}>
            {loading ? 'Analyzing...' : 'Analyze'}
          </button>
        </form>

        {error && (
          <div className="error-message">
            Error: {error}
          </div>
        )}

        {nutritionData && (
          <div className="results">
            <h2>Nutrition Information</h2>
            <div className="nutrition-data">
              <div className="nutrition-item">
                <span>Calories:</span>
                <span>{nutritionData.calories}</span>
              </div>
              {nutritionData.totalNutrients && (
                <>
                  <div className="nutrition-item">
                    <span>Protein:</span>
                    <span>
                      {nutritionData.totalNutrients.PROCNT?.quantity.toFixed(1)}
                      {nutritionData.totalNutrients.PROCNT?.unit}
                    </span>
                  </div>
                  <div className="nutrition-item">
                    <span>Carbohydrates:</span>
                    <span>
                      {nutritionData.totalNutrients.CHOCDF?.quantity.toFixed(1)}
                      {nutritionData.totalNutrients.CHOCDF?.unit}
                    </span>
                  </div>
                  <div className="nutrition-item">
                    <span>Fat:</span>
                    <span>
                      {nutritionData.totalNutrients.FAT?.quantity.toFixed(1)}
                      {nutritionData.totalNutrients.FAT?.unit}
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;
