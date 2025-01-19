# FoodScores

A web application that analyzes nutritional information of food items using the Edamam API.

## Setup

### Backend
1. Navigate to the backend directory:

cd backend

2. Create a virtual environment and activate it:
python -m venv venv
source venv/bin/activate
# On Windows: venv\Scripts\activate


3. Install dependencies:
pip install -r requirements.txt


4. Create a `.env` file with your Edamam API credentials:
EDAMAM_APP_ID=your_app_id
EDAMAM_APP_KEY=your_app_key


5. Start the backend server:
uvicorn app:app --reload


### Frontend
1. Navigate to the frontend directory:
cd frontend


2. Install dependencies:
npm install


3. Start the development server:
npm start


## Usage
- Backend runs on http://localhost:8000
- Frontend runs on http://localhost:3000
- Enter a food item (e.g., "1 large apple") and click Analyze to see nutritional information

## Technologies Used
- Frontend: React
- Backend: FastAPI
- API: Edamam Nutrition Analysis API

  
