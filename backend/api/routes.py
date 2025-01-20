from fastapi import APIRouter, HTTPException
from services.edamam import EdamamService
from services.openai_service import OpenAIService
from typing import List, Optional
from pydantic import BaseModel

router = APIRouter()
edamam_service = EdamamService()
openai_service = OpenAIService()

class MealPlanRequest(BaseModel):
    numberOfDays: int
    dailyCalories: int
    healthConditions: List[str]
    cuisinePreferences: List[str]
    includeCheatMeal: bool

@router.post("/meal-plan")
async def generate_meal_plan(request: MealPlanRequest):
    try:
        meal_plan = await openai_service.generate_meal_plan(request.dict())
        return meal_plan
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/{food_item}")
async def analyze_food(food_item: str):
    try:
        result = await edamam_service.get_nutrition_data(food_item)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
