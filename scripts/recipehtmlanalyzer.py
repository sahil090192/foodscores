import requests
from bs4 import BeautifulSoup

def scrape_recipe_links(main_url):
    recipe_links = []
    response = requests.get(main_url)
    if response.status_code == 200:
        soup = BeautifulSoup(response.content, "html.parser")
        # Debug: Print the soup to analyze structure
        print(soup.prettify())  # Print the HTML for debugging
    else:
        print(f"Failed to fetch the main page. Status code: {response.status_code}")
    return recipe_links

if __name__ == "__main__":
    main_url = "https://hebbarskitchen.com/sponge-dosa-recipe-curd-dosa-set-dosa/"
    scrape_recipe_links(main_url)
