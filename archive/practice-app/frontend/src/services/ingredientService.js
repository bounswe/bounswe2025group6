// src/services/ingredientService.js
const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:8000'

/**
 * Fetches a paginated list of ingredients.
 * @returns {Promise<Array>} Array of ingredient objects
 */
export async function getAllIngredients() {
  const res = await fetch(`${API_BASE}/ingredients/`)
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  const json = await res.json()
  return json.results
}

/**
 * Fetch a single ingredient by its ID.
 * @param {string|number} id
 * @returns {Promise<Object>} Ingredient object
 */
export async function getIngredientById(id) {
  const res = await fetch(`${API_BASE}/ingredients/${id}/`)
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}

/**
 * Fetches only the ID of an ingredient by its name.
 * @param {string} name
 * @returns {Promise<number>} The ingredient's ID
 */
export async function getIngredientIdByName(name) {
  const url = new URL(`${API_BASE}/ingredients/get-id-by-name/`)
  url.searchParams.append('name', name)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  const json = await res.json()
  return json.id
}

/**
 * Fetches the full ingredient object by its name.
 * @param {string} name
 * @returns {Promise<Object>} Ingredient object
 */
export async function getIngredientByName(name) {
  const url = new URL(`${API_BASE}/ingredients/get-ingredient-by-name/`)
  url.searchParams.append('name', name)

  const res = await fetch(url.toString())
  if (!res.ok) throw new Error(`Server error: ${res.status}`)
  return res.json()
}
