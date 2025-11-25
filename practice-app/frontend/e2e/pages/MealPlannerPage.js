// e2e/pages/MealPlannerPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class MealPlannerPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual MealPlannerPage component
  calendar = By.css('.calendar, [class*="calendar"], [class*="meal-planner"]');
  addMealButton = By.css(
    '.green-button, button[class*="green"], button[class*="add"]'
  );
  mealCard = By.css('.meal-card, [class*="meal-card"], [class*="meal-item"]');

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/meal-planner`);
  }

  async isDisplayed() {
    try {
      await waitForElement(this.driver, this.calendar, 10000);
      return true;
    } catch {
      return false;
    }
  }

  async getMealCount() {
    try {
      const meals = await this.driver.findElements(this.mealCard);
      return meals.length;
    } catch {
      return 0;
    }
  }
}

module.exports = MealPlannerPage;
