// e2e/pages/IngredientsPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class IngredientsPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  searchInput = By.css('input[placeholder*="Search"], input[type="text"]');
  ingredientCard = By.css('.ingredient-card, [class*="ingredient"]');

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/ingredients`);
  }

  async isDisplayed() {
    try {
      await waitForElement(this.driver, this.searchInput, 10000);
      return true;
    } catch {
      return false;
    }
  }

  async getIngredientCount() {
    try {
      await this.driver.sleep(2000);
      const ingredients = await this.driver.findElements(this.ingredientCard);
      return ingredients.length;
    } catch {
      return 0;
    }
  }

  async searchIngredients(query) {
    const input = await waitForElement(this.driver, this.searchInput);
    await input.clear();
    await input.sendKeys(query);
    await this.driver.sleep(1000);
  }

  async clickIngredient(index = 0) {
    const ingredients = await this.driver.findElements(this.ingredientCard);
    if (ingredients.length > index) {
      await ingredients[index].click();
      await this.driver.sleep(1000);
    }
  }
}

module.exports = IngredientsPage;

