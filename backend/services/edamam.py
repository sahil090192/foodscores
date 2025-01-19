from typing import Dict, Any
import requests
from config import settings

class EdamamService:
    def __init__(self):
        self.app_id = settings.EDAMAM_APP_ID
        self.app_key = settings.EDAMAM_APP_KEY
        self.base_url = "https://api.edamam.com/api/nutrition-data"

    async def get_nutrition_data(self, food_item: str) -> Dict[Any, Any]:
        params = {
            "app_id": self.app_id,
            "app_key": self.app_key,
            "ingr": food_item
        }
        
        response = requests.get(self.base_url, params=params)
        
        if response.status_code == 200:
            return response.json()
        else:
            raise Exception(f"API request failed with status code: {response.status_code}")
