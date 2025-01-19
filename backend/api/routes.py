from fastapi import APIRouter, HTTPException
from services.edamam import EdamamService

router = APIRouter()
edamam_service = EdamamService()

@router.get("/{food_item}")
async def analyze_food(food_item: str):
    try:
        result = await edamam_service.get_nutrition_data(food_item)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
