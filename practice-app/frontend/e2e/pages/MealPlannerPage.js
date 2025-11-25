// e2e/pages/MealPlannerPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class MealPlannerPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual MealPlannerPage component
  container = By.css(".meal-planner-page");
  generateRandomButton = By.css(".modern-green-button, button[class*='green']");
  selectRecipeButton = By.css(".select-recipe-btn");
  recipeCard = By.css(".recipe-card-wrapper, .recipe-card");
  generateShoppingButton = By.xpath('//button[contains(text(), "Shopping") or contains(text(), "shopping")]');
  mealSection = By.css(".meal-section");
  breakfastSection = By.xpath('//section[contains(@class, "meal-section")]//div[contains(text(), "Breakfast") or contains(text(), "breakfast")]');
  lunchSection = By.xpath('//section[contains(@class, "meal-section")]//div[contains(text(), "Lunch") or contains(text(), "lunch")]');
  dinnerSection = By.xpath('//section[contains(@class, "meal-section")]//div[contains(text(), "Dinner") or contains(text(), "dinner")]');

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/meal-planner`);
  }

  async isDisplayed() {
    try {
      await waitForElement(this.driver, this.container, 10000);
      return true;
    } catch {
      return false;
    }
  }

  async clickGenerateRandom() {
    try {
      const button = await waitForElement(this.driver, this.generateRandomButton, 10000);
      await button.click();
      await this.driver.sleep(3000); // Wait for random meal plan to generate
    } catch (error) {
      throw new Error(`Failed to click generate random: ${error.message}`);
    }
  }

  async selectRecipeForMeal(mealType, recipeIndex = 0) {
    try {
      // Wait for recipes to load
      await this.driver.sleep(2000);
      
      // Find all select buttons (each recipe card has one)
      const selectButtons = await this.driver.findElements(this.selectRecipeButton);
      
      if (selectButtons.length === 0) {
        throw new Error("No recipe select buttons found. Recipes may not be loaded yet.");
      }

      if (selectButtons.length <= recipeIndex) {
        throw new Error(`Select button at index ${recipeIndex} not found. Only ${selectButtons.length} buttons available.`);
      }

      // Scroll into view and click
      await this.driver.executeScript(
        "arguments[0].scrollIntoView(true);",
        selectButtons[recipeIndex]
      );
      await this.driver.sleep(500);
      await selectButtons[recipeIndex].click();
      await this.driver.sleep(1000);
    } catch (error) {
      throw new Error(`Failed to select recipe for ${mealType}: ${error.message}`);
    }
  }

  async generateShoppingList() {
    try {
      // Look for the generate shopping list button in MealPlanSummary
      // Button has class "modern-action-button primary" and is inside a Link
      const buttons = await this.driver.findElements(
        By.css('.modern-action-button.primary, button.modern-action-button.primary')
      );
      
      if (buttons.length === 0) {
        // Try XPath as fallback
        const xpathButtons = await this.driver.findElements(
          By.xpath('//button[contains(@class, "modern-action-button") and contains(@class, "primary")]')
        );
        if (xpathButtons.length > 0) {
          await this.driver.executeScript(
            "arguments[0].scrollIntoView(true);",
            xpathButtons[0]
          );
          await this.driver.sleep(500);
          await xpathButtons[0].click();
        } else {
          throw new Error("Generate shopping list button not found");
        }
      } else {
        // Use the last button (generate shopping list is usually the second button)
        const button = buttons[buttons.length - 1];
        await this.driver.executeScript(
          "arguments[0].scrollIntoView(true);",
          button
        );
        await this.driver.sleep(500);
        await button.click();
      }
      
      await this.driver.sleep(2000); // Wait for navigation
    } catch (error) {
      throw new Error(`Failed to generate shopping list: ${error.message}`);
    }
  }

  async createMealPlan() {
    // Create a meal plan by selecting at least one recipe
    try {
      await this.navigateTo();
      await this.driver.sleep(2000);
      
      // Try to select a recipe for breakfast
      try {
        await this.selectRecipeForMeal("breakfast", 0);
      } catch {
        // If breakfast fails, try lunch or dinner
        try {
          await this.selectRecipeForMeal("lunch", 0);
        } catch {
          await this.selectRecipeForMeal("dinner", 0);
        }
      }
      
      await this.driver.sleep(1000);
    } catch (error) {
      throw new Error(`Failed to create meal plan: ${error.message}`);
    }
  }
}

module.exports = MealPlannerPage;
