# WikidataViewSet API Documentation

The `WikidataViewSet` provides endpoints to retrieve and manage Wikidata-related information for ingredients. Below is the detailed documentation for each endpoint.

---

## 1. List Ingredients with Wikidata Information

### **Endpoint**
`GET /wikidata/list-with-wikidata/`

### **Description**
Retrieve a list of all ingredients along with their Wikidata information.

### **Parameters**
None.

### **Response**
- **200 OK**: A list of ingredients with their Wikidata information.
- **Example Response**:
```json
[
    {
        "id": 1,
        "name": "Tomato",
        "wikidata_info": {
            "wikidata_id": "Q23556",
            "wikidata_label": "Tomato",
            "wikidata_description": "A red fruit commonly used in cooking.",
            "wikidata_image_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Tomato.jpg"
        }
    },
    {
        "id": 2,
        "name": "Potato",
        "wikidata_info": {
            "wikidata_id": "Q23557",
            "wikidata_label": "Potato",
            "wikidata_description": "A starchy root vegetable.",
            "wikidata_image_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Potato.jpg"
        }
    }
]

## 2. Retrieve Ingredient with Wikidata Information

### **Endpoint**

`GET /wikidata/{id}/retrieve-with-wikidata/`

### **Description**

Retrieve a specific ingredient by its ID along with its Wikidata information.

### **Parameters**

-   **Path Parameter**:
    -   id  (integer): The ID of the ingredient.

### **Response**

-   **200 OK**: The ingredient with its Wikidata information.
-   **404 Not Found**: If the ingredient with the specified ID does not exist.
-   **Example Response**:

{
    "id": 1,
    "name": "Tomato",
    "wikidata_info": {
        "wikidata_id": "Q23556",
        "wikidata_label": "Tomato",
        "wikidata_description": "A red fruit commonly used in cooking.",
        "wikidata_image_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Tomato.jpg"
    }
}


## 3. Get Wikidata Entity by Name (Utility Function)

### **Description**

This is a utility function used internally to search for the Wikidata entity ID of an ingredient or meal by name.

### **Parameters**

-   name  (string): The name of the ingredient or meal.

### **Response**

## 4. Run SPARQL Query (Utility Function)

### **Description**

This is a utility function used internally to run SPARQL queries against the Wikidata SPARQL endpoint.

### **Parameters**

-   query  (string): The SPARQL query to execute.

### **Response**

-   Returns the JSON response from the Wikidata SPARQL endpoint.

----------

## Future Endpoints (Planned)

The following endpoints are planned for future implementation:

1.  **Allergens**:
    
    -   **Description**: Get information about allergen materials that the specified ingredient/meal may have.
    -   **Endpoint**:  `GET /wikidata/allergens/`
2.  **Description**:
    
    -   **Description**: Retrieve a detailed description of an ingredient or meal.
    -   **Endpoint**:  `GET /wikidata/description/`
3.  **Label**:
    
    -   **Description**: Retrieve the label of an ingredient or meal.
    -   **Endpoint**:  `GET /wikidata/label/`
4.  **Nutrition**:
    
    -   **Description**: Get nutrition info of an ingredient, e.g., the amount of protein, fiber, calories.
    -   **Endpoint**:  `GET /wikidata/nutrition/`
5.  **Is Vegan**:
    
    -   **Description**: Check if the specified ingredient/meal is vegan or not.
    -   **Endpoint**:  `GET /wikidata/is-vegan/`
6.  **Image**:
    
    -   **Description**: Get the image (P18) of an ingredient/meal.
    -   **Endpoint**:  `GET /wikidata/image/`
7.  **Origin**:
    
    -   **Description**: Get the origin of a meal, e.g., from which country/cuisine it comes from.
    -   **Endpoint**:  `GET /wikidata/origin/`
8.  **Category**:
    
    -   **Description**: Get the category of an ingredient, e.g., fruit, vegetable, spice.
    -   **Endpoint**:  `GET /wikidata/category/`

----------

## Notes

-   All endpoints are grouped under the  `IngredientWikidata`  tag in Swagger documentation.
-   Utility functions (get_wikidata_entity  and  run_sparql_query) are not exposed as public API endpoints but are used internally by the  WikidataViewSet.

----------

## Headers

All requests to Wikidata endpoints include the following headers:

{
    "User-Agent": "IngredientWikidataAPI/1.0"
}

## Error Handling

-   **404 Not Found**: Returned when the requested ingredient or meal does not exist.
-   **500 Internal Server Error**: Returned when there is an issue with the Wikidata API or SPARQL query.

----------

## Example Usage

### Retrieve Ingredient with Wikidata Information

**Request**:

{
    "id": 1,
    "name": "Tomato",
    "wikidata_info": {
        "wikidata_id": "Q23556",
        "wikidata_label": "Tomato",
        "wikidata_description": "A red fruit commonly used in cooking.",
        "wikidata_image_url": "https://commons.wikimedia.org/wiki/Special:FilePath/Tomato.jpg"
    }
}