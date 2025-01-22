import requests
from bs4 import BeautifulSoup
import pandas as pd

# Function to scrape recipe links from a single page
def scrape_recipe_links(page_url):
    recipe_links = []
    response = requests.get(page_url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        # Find all <a> tags with rel="bookmark"
        link_elements = soup.find_all("a", attrs={"rel": "bookmark"})
        for link in link_elements:
            href = link.get("href")
            if href:
                recipe_links.append(href)
    else:
        print(f"Failed to fetch page: {page_url}. Status code: {response.status_code}")
    return recipe_links

# Function to scrape details of each recipe
def scrape_recipe_details(recipe_url):
    recipe_data = {}
    response = requests.get(recipe_url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        # Extract recipe title
        title = soup.find("h1", class_="entry-title")
        recipe_data["Title"] = title.text.strip() if title else "No title found"

        # Extract ingredients
        ingredients_section = soup.find("div", class_="wprm-recipe-ingredients-container")
        ingredients = [item.text.strip() for item in ingredients_section.find_all("li")] if ingredients_section else []
        recipe_data["Ingredients"] = ", ".join(ingredients)

        # Extract instructions
        instructions_section = soup.find("div", class_="wprm-recipe-instructions-container")
        instructions = [step.text.strip() for step in instructions_section.find_all("div", class_="wprm-recipe-instruction-text")] if instructions_section else []
        recipe_data["Instructions"] = " ".join(instructions)
    else:
        print(f"Failed to fetch recipe page: {recipe_url}. Status code: {response.status_code}")
    return recipe_data

# Main function to scrape all recipes across pagination
def main():
    base_url = "https://hebbarskitchen.com/recipes/south-indian-dosa-recipes/"
    current_page = 1
    max_pages = 9  # Adjust based on the pagination range
    all_recipes = []

    print("Scraping recipe links across pages...")
    while current_page <= max_pages:
        page_url = f"{base_url}page/{current_page}/" if current_page > 1 else base_url
        print(f"Scraping page {current_page}: {page_url}")
        recipe_links = scrape_recipe_links(page_url)
        for link in recipe_links:
            print(f"Scraping recipe: {link}")
            recipe = scrape_recipe_details(link)
            all_recipes.append(recipe)
        current_page += 1

    # Save to a CSV file
    df = pd.DataFrame(all_recipes)
    df.to_csv("hebbars_kitchen_recipes_paginated.csv", index=False)
    print("Scraping completed. Recipes saved to 'hebbars_kitchen_recipes_paginated.csv'.")

if __name__ == "__main__":
    main()
