from openai import OpenAI
from config import settings
import json
import asyncio

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)

    async def generate_meal_plan(self, plan_params):
        try:
            system_prompt = """You are a professional nutritionist and meal planner. You must respond with ONLY valid JSON, no other text, following exactly this structure:
            {
                "meal_plan": [
                    {
                        "day": 1,
                        "meals": [
                            {
                                "type": "breakfast/lunch/dinner",
                                "name": "dish name",
                                "cuisine": "cuisine type",
                                "calories": number,
                                "nutrition": {
                                    "protein": "Xg",
                                    "carbs": "Xg",
                                    "fat": "Xg"
                                },
                                "ingredients": [
                                    {
                                        "item": "ingredient name",
                                        "amount": "quantity with unit"
                                    }
                                ],
                                "recipe_steps": [
                                    "Step 1 description",
                                    "Step 2 description"
                                ]
                            }
                        ],
                        "total_calories": number
                    }
                ]
            }"""

            user_prompt = f"""Create a {plan_params['numberOfDays']}-day meal plan with:
            - Daily calorie target: {plan_params['dailyCalories']} calories
            - Health conditions: {', '.join(plan_params['healthConditions']) if plan_params['healthConditions'] else 'None'}
            - Cuisines: {', '.join(plan_params['cuisinePreferences'])}
            - {('Include one cheat meal' if plan_params['includeCheatMeal'] else 'No cheat meals')}

            IMPORTANT: Respond with ONLY the JSON structure, no additional text or explanations."""

            # Run the OpenAI call in a thread pool
            loop = asyncio.get_event_loop()
            response = await loop.run_in_executor(
                None,
                lambda: self.client.chat.completions.create(
                    model="gpt-4",  # Changed from gpt-4o-mini to gpt-4
                    messages=[
                        {"role": "system", "content": system_prompt},
                        {"role": "user", "content": user_prompt}
                    ],
                    temperature=0.7
                )
            )

            # Get the response content
            response_content = response.choices[0].message.content
            
            # Print response for debugging
            print("Raw response:", response_content)
            
            try:
                # Parse the response to ensure it's valid JSON
                parsed_response = json.loads(response_content)
                return parsed_response
            except json.JSONDecodeError as json_error:
                raise Exception(f"Invalid JSON response: {str(json_error)}. Response was: {response_content}")

        except Exception as e:
            raise Exception(f"Failed to generate meal plan: {str(e)}") 