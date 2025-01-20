from openai import OpenAI
from config import settings
import json
import asyncio
import hashlib
import os
import time
import random
from pathlib import Path
from datetime import datetime

class OpenAIService:
    def __init__(self):
        self.client = OpenAI(api_key=settings.OPENAI_API_KEY)
        # Create cache and logs directories
        self.cache_dir = Path("cache")
        self.logs_dir = Path("logs")
        self.cache_dir.mkdir(exist_ok=True)
        self.logs_dir.mkdir(exist_ok=True)
        self.max_cache_per_params = 3  # Store up to 3 variations per parameter set
        self.cache_hit_randomization = 0.1  # Changed to 10%
        self.cache_version = 2  # Add version control
        self._clear_invalid_cache()  # Clear old cache on startup

    def _clear_invalid_cache(self):
        """Clear all cache files that don't meet current requirements"""
        try:
            if not self.cache_dir.exists():
                return
                
            for cache_file in self.cache_dir.glob("*.json"):
                try:
                    with open(cache_file, 'r') as f:
                        data = json.load(f)
                        
                    # Validate cached data structure
                    is_valid = (
                        isinstance(data, dict) and
                        'meal_plan' in data and
                        isinstance(data['meal_plan'], list) and
                        len(data['meal_plan']) > 0 and
                        all(
                            isinstance(day, dict) and
                            'meals' in day and
                            len(day['meals']) == 3 and
                            'total_calories' in day and
                            all(
                                isinstance(meal, dict) and
                                all(key in meal for key in ['type', 'name', 'cuisine', 'calories', 'nutrition', 'ingredients', 'recipe_steps'])
                                for meal in day['meals']
                            )
                            for day in data['meal_plan']
                        )
                    )
                    
                    if not is_valid:
                        print(f"Removing invalid cache file: {cache_file}")
                        cache_file.unlink()
                        
                except (json.JSONDecodeError, KeyError, TypeError):
                    print(f"Removing corrupted cache file: {cache_file}")
                    cache_file.unlink()
                    
        except Exception as e:
            print(f"Error clearing invalid cache: {str(e)}")

    def _generate_cache_key(self, plan_params):
        # Add version to cache key
        base_params = {
            'version': self.cache_version,  # Include version in cache key
            'numberOfDays': plan_params['numberOfDays'],
            'dailyCalories': plan_params['dailyCalories'],
            'healthConditions': plan_params['healthConditions'],
            'cuisinePreferences': plan_params['cuisinePreferences'],
            'includeCheatMeal': plan_params['includeCheatMeal']
        }
        param_str = json.dumps(base_params, sort_keys=True)
        return hashlib.md5(param_str.encode()).hexdigest()

    def _get_cached_response(self, cache_key):
        try:
            variation_files = list(self.cache_dir.glob(f"{cache_key}_v*.json"))
            
            if variation_files:
                if random.random() > self.cache_hit_randomization:
                    chosen_file = random.choice(variation_files)
                    with open(chosen_file, 'r') as f:
                        data = json.load(f)
                        self._log_request(cache_key, "cache_hit", 0)
                        return data
            return None
        except Exception as e:
            print(f"Cache read error: {str(e)}")
            return None

    def _save_to_cache(self, cache_key, response):
        try:
            variation_files = list(self.cache_dir.glob(f"{cache_key}_v*.json"))
            
            if len(variation_files) >= self.max_cache_per_params:
                file_to_replace = random.choice(variation_files)
                file_to_replace.unlink()
            
            variation_num = len(variation_files)
            cache_file = self.cache_dir / f"{cache_key}_v{variation_num}.json"
            
            with open(cache_file, 'w') as f:
                json.dump(response, f, indent=2)
        except Exception as e:
            print(f"Cache write error: {str(e)}")

    def _log_request(self, cache_key, request_type, duration):
        try:
            log_file = self.logs_dir / "request_logs.jsonl"
            log_entry = {
                "timestamp": datetime.now().isoformat(),
                "cache_key": cache_key,
                "type": request_type,
                "duration_seconds": duration
            }
            with open(log_file, 'a') as f:
                f.write(json.dumps(log_entry) + '\n')
        except Exception as e:
            print(f"Logging error: {str(e)}")

    async def generate_meal_plan(self, plan_params):
        try:
            start_time = time.time()
            cache_key = self._generate_cache_key(plan_params)
            
            try:
                cached_response = self._get_cached_response(cache_key)
                if cached_response:
                    return cached_response
            except Exception as e:
                print(f"Cache retrieval error: {str(e)}")

            # Calculate cuisine distribution
            cuisine_counts = {}
            estimated_meals = int(plan_params['numberOfDays']) * 3  # Base estimate
            
            for cuisine in plan_params['cuisinePreferences']:
                if ':' in cuisine:
                    name, percentage = cuisine.split(':')
                    percentage = int(percentage.strip('%'))
                    cuisine_counts[name] = round((percentage/100) * estimated_meals)
                else:
                    cuisine_counts[cuisine] = estimated_meals // len(plan_params['cuisinePreferences'])

            cuisine_distribution = [f"{cuisine}:{count} meals" for cuisine, count in cuisine_counts.items()]

            system_prompt = """You are a nutritionist and meal planner. You must respond with ONLY valid JSON, exactly matching this structure, no additional text:
            {
                "meal_plan": [
                    {
                        "day": 1,
                        "meals": [
                            {
                                "type": "string (meal type, e.g., breakfast, morning snack, lunch, etc.)",
                                "name": "Dish Name",
                                "cuisine": "Cuisine Type",
                                "calories": 500,
                                "nutrition": {
                                    "protein": "20g",
                                    "carbs": "60g",
                                    "fat": "15g"
                                }
                            }
                        ],
                        "total_calories": 2000
                    }
                ],
                "generation_time": 0
            }"""

            user_prompt = f"""Create a {plan_params['numberOfDays']}-day meal plan with these STRICT requirements:

            CORE REQUIREMENTS:
            - EXACTLY {plan_params['numberOfDays']} days
            - EXACTLY {plan_params['dailyCalories']} calories (±50) per day
            - Health Requirements: {', '.join(plan_params['healthConditions']) if plan_params['healthConditions'] else 'None'}

            MEAL STRUCTURE:
            - Distribute daily calories across appropriate number of meals
            - Can include main meals (breakfast, lunch, dinner) and snacks
            - Number of meals should be practical and appropriate for calorie target
            - For higher calorie targets, consider adding snacks between meals
            - For lower calorie targets, might need fewer but satisfying meals

            CUISINE DISTRIBUTION:
            {', '.join(cuisine_distribution)}

            FOCUS ON:
            1. Accurate calorie counts
            2. Balanced nutrition throughout the day
            3. Practical meal timing and portions
            4. Appropriate meal frequency for calorie target

            For health conditions:
            - Adapt dishes to meet restrictions
            - Balance nutrients appropriately
            - Ensure suitable portions"""

            loop = asyncio.get_event_loop()

            for attempt in range(3):
                try:
                    print(f"Attempt {attempt + 1} to generate meal plan")
                    
                    response = await loop.run_in_executor(
                        None,
                        lambda: self.client.chat.completions.create(
                            model="gpt-4",
                            messages=[
                                {"role": "system", "content": system_prompt},
                                {"role": "user", "content": user_prompt}
                            ],
                            temperature=0.7
                        )
                    )

                    response_content = response.choices[0].message.content.strip()
                    print(f"Raw response start: {response_content[:200]}...")
                    
                    if response_content.startswith("```json"):
                        response_content = response_content[7:]
                    if response_content.startswith("```"):
                        response_content = response_content[3:]
                    if response_content.endswith("```"):
                        response_content = response_content[:-3]
                    
                    response_content = response_content.strip()
                    
                    try:
                        parsed_response = json.loads(response_content)
                    except json.JSONDecodeError as e:
                        print(f"JSON parsing error: {str(e)}")
                        print(f"Cleaned response content: {response_content}")
                        continue

                    # Validate structure
                    if not isinstance(parsed_response, dict) or 'meal_plan' not in parsed_response:
                        print("Invalid response structure")
                        continue

                    if not isinstance(parsed_response['meal_plan'], list):
                        print("meal_plan is not a list")
                        continue

                    # Validate days
                    if len(parsed_response['meal_plan']) != int(plan_params['numberOfDays']):
                        print(f"Wrong number of days: got {len(parsed_response['meal_plan'])}, expected {plan_params['numberOfDays']}")
                        continue

                    # Validate each day
                    valid_plan = True
                    for day in parsed_response['meal_plan']:
                        if not all(key in day for key in ['day', 'meals', 'total_calories']):
                            print(f"Missing required keys in day: {day.keys()}")
                            valid_plan = False
                            break

                        if abs(day['total_calories'] - int(plan_params['dailyCalories'])) > 50:
                            print(f"Calories out of range in day {day['day']}: {day['total_calories']}")
                            valid_plan = False
                            break

                    if not valid_plan:
                        continue

                    # If we get here, the plan is valid
                    parsed_response['generation_time'] = time.time() - start_time
                    self._save_to_cache(cache_key, parsed_response)
                    return parsed_response

                except Exception as e:
                    print(f"Error in attempt {attempt + 1}: {str(e)}")
                    if attempt == 2:  # Last attempt
                        raise

            raise Exception("Failed to generate valid meal plan after 3 attempts")

        except Exception as e:
            print(f"Detailed error: {str(e)}")
            self._log_request(cache_key, "error", time.time() - start_time)
            raise Exception(f"Failed to generate meal plan: {str(e)}") 