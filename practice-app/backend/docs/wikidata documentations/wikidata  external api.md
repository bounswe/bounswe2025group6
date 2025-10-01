
## FitHub - Wikidata API Integration Documentation

This document provides a guide for backend developers on how to utilize the newly established connection to the Wikidata API within the FitHub project.

### Overview

The FitHub project now integrates with the Wikidata API to enrich data (e.g., for ingredients) with information like labels, descriptions, and images. This integration is primarily handled within the `wikidata` app.

### Project Structure

The relevant files are organized as follows:

```
fithub/
    ingredients/       # (Example app where Wikidata is used)
        models.py
        serializers.py
        views.py
    wikidata/
        utils.py      # Contains functions to interact with Wikidata API

```

### Key Components

-   **`wikidata/utils.py`**:
    
    -   **`get_wikidata_id(ingredient_name: str) -> Optional[str]`**:
        
        -   Retrieves the Wikidata ID (Q-number) for a given ingredient name.
            
        -   Implements caching to reduce redundant API calls. Caches results for 24 hours.
            
        -   Handles potential API errors and returns `None` if no ID is found or an error occurs.
            
    -   **`get_wikidata_details(wikidata_id: str, properties: tuple = ('labels', 'descriptions', 'claims', 'sitelinks')) -> Optional[Dict[str, Any]]`**:
        
        -   Retrieves detailed information about a Wikidata entity (given its Q-number).
            
        -   Caches results for 24 hours.
            
        -   Fetches specified properties (defaults to labels, descriptions, claims, and sitelinks).
            
        -   Handles API errors and returns `None` if the entity is not found or an error occurs.
            
        -   Extracts image URLs from claims, specifically property 'P18'.
            

### How to Use the Wikidata Integration

Here's a step-by-step guide for using the Wikidata integration in your views:

1.  **Import the Utility Functions:**
    
    ```
    from wikidata.utils import get_wikidata_id, get_wikidata_details
    
    ```
    
2.  **Get the Wikidata ID:**
    
    ```
    ingredient_name = "Apple"  # Or from your model
    wikidata_id = get_wikidata_id(ingredient_name)
    
    ```
    
3.  **Get Wikidata Details (If ID is Found):**
    
    ```
    if wikidata_id:
        wikidata_details = get_wikidata_details(
            wikidata_id, properties=('labels', 'descriptions', 'claims', 'P18')
        )
        if wikidata_details:
            label = wikidata_details.get('labels', {}).get('en', {}).get('value')
            description = wikidata_details.get('descriptions', {}).get('en', {}).get('value')
            # Example of getting image URL.
            image_url = None
            if wikidata_details.get('claims', {}).get('P18'):
                image_filename = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename}"
        else:
            # Handle the case where details are not found
            pass
    else:
        # Handle the case where no Wikidata ID was found
        pass
    
    ```
    
4.  **Use the Retrieved Data:**
    
    -   You can now use the `label`, `description`, and `image_url` (or any other properties you fetched) to enrich your application's data. For example, add them to your serializer's output.
        

### Example Usage in a View (Conceptual):

```
from rest_framework.views import APIView
from rest_framework.response import Response
from wikidata.utils import get_wikidata_id, get_wikidata_details

class MyAPIView(APIView):
    def get(self, request, *args, **kwargs):
        ingredient_name = "Example Ingredient" #  Get this from your data source
        wikidata_id = get_wikidata_id(ingredient_name)

        if wikidata_id:
            details = get_wikidata_details(wikidata_id)
            if details:
                label = details.get('labels', {}).get('en', {}).get('value')
                description = details.get('descriptions', {}).get('en', {}).get('value')
                image_url = None
                if details.get('claims', {}).get('P18'):
                    image_filename = details['claims']['P18'][0]['mainsnak']['datavalue']['value']
                    image_url = f"https://commons.wikimedia.org/wiki/Special:FilePath/{image_filename}"
                response_data = {
                    "ingredient_name": ingredient_name,
                    "wikidata_label": label,
                    "wikidata_description": description,
                    "wikidata_image_url": image_url,
                }
            else:
                response_data = {"ingredient_name": ingredient_name, "error": "Wikidata details not found"}

        else:
             response_data = {"ingredient_name": ingredient_name, "error": "Wikidata ID not found"}
        return Response(response_data)

```

### Best Practices

-   **Caching:** The `get_wikidata_id` and `get_wikidata_details` functions already implement caching. Avoid implementing additional caching for the same data within your views unless you have very specific requirements.
    
-   **Error Handling:** The utility functions handle basic API errors. However, you should still handle the `None` return values in your views to gracefully handle cases where Wikidata information is unavailable.
    
-   **Selective Data Retrieval:** Use the `properties` parameter in `get_wikidata_details` to specify which data you need. This minimizes the amount of data transferred from the Wikidata API.
    
-   **Asynchronous Tasks (for Performance):** For performance-critical applications, consider using Celery or other task queues to fetch Wikidata information asynchronously, especially if you are processing large amounts of data.
    
-   **Be Mindful of Wikidata's API Usage:** While Wikidata's API is generally open, be mindful of their usage policies. Excessive or abusive usage can lead to blocking. The caching in the utility functions helps to mitigate this.
    

### Creating New Utility Functions in `wikidata/utils.py`

Here's a template and some examples to help you create new utility functions in `wikidata/utils.py`:

```
from django.core.cache import cache
from wikidata.utils import get_wikidata_details # Import existing utils
import requests

def get_wikidata_info(wikidata_id, properties=('labels', 'descriptions')):
    """
    Retrieves specific information from Wikidata for a given ID, with caching.

    Args:
        wikidata_id (str): The Wikidata Q-number (e.g., "Q123").
        properties (tuple, optional): The Wikidata properties to retrieve.
            Defaults to ('labels', 'descriptions').

    Returns:
        Optional[dict]: A dictionary containing the requested information,
                        or None if the entity is not found or an error occurs.
    """
    cache_key = f"wikidata_info_{wikidata_id}_{'_'.join(properties)}"
    cached_data = cache.get(cache_key)
    if cached_data:
        return cached_data

    try:
        wikidata_details = get_wikidata_details(wikidata_id, properties) #re-use
        if wikidata_details:
            #  Process the details into the desired format
            processed_data = {
                prop: wikidata_details.get(prop, {})
                for prop in properties
            }
            cache.set(cache_key, processed_data, 24 * 60 * 60)  # Cache for 24 hours
            return processed_data
        else:
            return None # Explicitly handle
    except Exception as e:
        print(f"Error fetching Wikidata information: {e}")
        return None

```

**Explanation:**

-   **Import Statements:** Import necessary modules, including `cache` for caching and any existing utility functions from `wikidata/utils.py`.
    
-   **Function Definition:**
    
    -   Define a clear function name (e.g., `get_wikidata_info`).
        
    -   Add a comprehensive docstring explaining the function's purpose, arguments, and return value.
        
    -   Include type hints for better code readability.
        
-   **Caching:**
    
    -   Create a unique cache key based on the `wikidata_id` and the requested `properties`.
        
    -   Check if the data is already in the cache. If so, return it directly.
        
-   **Data Retrieval:**
    
    -   Call the existing `get_wikidata_details` function to fetch data from Wikidata.
        
-   **Data Processing:**
    
    -   Process the raw data from `get_wikidata_details` into a more suitable format for your application. This might involve extracting specific values, renaming keys, or restructuring the data.
        
-   **Error Handling:**
    
    -   Include a `try...except` block to handle potential errors during the API request.
        
    -   Log the error for debugging purposes.
        
    -   Return `None` to indicate that the data retrieval failed.
        
-   **Caching (Setting the Cache):**
    
    -   If the data is successfully retrieved and processed, store it in the cache with the generated key.
        
    -   Set an appropriate cache expiration time (e.g., 24 hours).
        
-   **Return Value:**
    
    -   Return the processed data or `None` if there was an error.
        

### New Use Cases and Utility Functions

Here are a couple of new use cases and corresponding utility function examples:

#### 1. Retrieving Wikidata IDs for Multiple Names

-   **Use Case:** You have a list of ingredient names (or other entities) and need to retrieve their Wikidata IDs in bulk. This is more efficient than calling `get_wikidata_id` repeatedly.
    
-   **Utility Function:**
    
    ```
    def get_wikidata_ids_bulk(names: list) -> dict:
        """
        Retrieves Wikidata IDs for a list of names.
    
        Args:
            names (list): A list of strings representing entity names.
    
        Returns:
            dict: A dictionary where keys are the input names (lowercased) and values are the corresponding
                  Wikidata IDs (or None if not found).  Caches individual lookups.
        """
        name_id_map = {}
        for name in names:
            wikidata_id = get_wikidata_id(name) # Reuse existing
            name_id_map[name.lower()] = wikidata_id  # Use lowercased names for consistency
        return name_id_map
    
    ```
    
-   **Integration Example (in a view):**
    
    ```
    from wikidata.utils import get_wikidata_ids_bulk
    from rest_framework.views import APIView
    from rest_framework.response import Response
    
    class RecipeListView(APIView):
        def get(self, request):
            ingredients = ["Apple", "Banana", "Orange"]  # Example from recipe
            ingredient_ids = get_wikidata_ids_bulk(ingredients)
            #  Example of use in response
            response_data = {
                "ingredients": [
                    {
                        "name": ingredient,
                        "wikidata_id": ingredient_ids.get(ingredient.lower()),
                    }
                    for ingredient in ingredients
                ]
            }
            return Response(response_data)
    
    ```
    

#### 2. Retrieving Nutritional Information for an Ingredient

-   **Use Case**: You want to display detailed nutritional information (calories, protein, fats, etc.) for ingredients in your recipes. Wikidata stores this information using specific properties.
    
-   **Utility Function:**
    
    ```
    def get_ingredient_nutrition(wikidata_id: str) -> Optional[dict]:
        """
        Retrieves nutritional information for an ingredient from Wikidata.
    
        Args:
            wikidata_id (str): The Wikidata Q-number of the ingredient.
    
        Returns:
            Optional[dict]: A dictionary containing nutritional information,
                            or None if not found or an error occurs.
                            Example: {"calories": 52, "protein": 0.3, "fat": 0.2}
        """
        cache_key = f"wikidata_nutrition_{wikidata_id}"
        cached_data = cache.get(cache_key)
        if cached_data:
            return cached_data
    
        try:
            details = get_wikidata_details(wikidata_id, properties=('P274', 'P271', 'P272')) # Calories, Protein, Fat
            if details:
                nutrition_data = {
                    "calories": details.get('claims', {}).get('P274', [{}])[0].get('mainsnak', {}).get('datavalue', {}).get('value'),
                    "protein": details.get('claims', {}).get('P271', [{}])[0].get('mainsnak', {}).get('datavalue', {}).get('value'),
                    "fat": details.get('claims', {}).get('P272', [{}])[0].get('mainsnak', {}).get('datavalue', {}).get('value'),
                }
                cache.set(cache_key, nutrition_data, 24 * 60 * 60)
                return nutrition_data
            else:
                return None
        except Exception as e:
            print(f"Error fetching nutritional information: {e}")
            return None
    
    ```
    
-   **Integration Example (in a serializer):**
    
    ```
    from rest_framework import serializers
    from wikidata.utils import get_wikidata_id, get_ingredient_nutrition
    
    class IngredientSerializer(serializers.ModelSerializer):
        class Meta:
            model = Ingredient
            fields = ['id', 'name']  #  Basic ingredient fields
    
        nutrition = serializers.SerializerMethodField()
    
        def get_nutrition(self, obj):
            wikidata_id = get_wikidata_id(obj.name)
            if wikidata_id:
                nutrition_data = get_ingredient_nutrition(wikidata_id)
                return nutrition_data
            return None
    
    ```
