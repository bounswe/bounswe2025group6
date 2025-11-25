// e2e/pages/IngredientDetailPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class IngredientDetailPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  ingredientName = By.css('h1, .ingredient-name');
  ingredientInfo = By.css('.ingredient-info, .ingredient-details');

  // Actions
  async navigateTo(ingredientId) {
    await this.driver.get(`${this.baseUrl}/ingredients/${ingredientId}`);
  }

  async isDisplayed() {
    try {
      await waitForElement(this.driver, this.ingredientName, 10000);
      return true;
    } catch {
      return false;
    }
  }

  async getIngredientName() {
    try {
      const name = await waitForElement(this.driver, this.ingredientName, 10000);
      return await name.getText();
    } catch {
      return null;
    }
  }
}

module.exports = IngredientDetailPage;

