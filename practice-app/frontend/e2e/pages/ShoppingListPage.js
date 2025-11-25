// e2e/pages/ShoppingListPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class ShoppingListPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual ShoppingListPage component
  addItemInput = By.css(
    'input[placeholder*="item"], input[placeholder*="Add"], input[type="text"]'
  );
  addItemButton = By.css(
    '.green-button, button[class*="green"], button[class*="add"]'
  );
  shoppingItem = By.css(
    '.shopping-item, [class*="shopping-item"], [class*="item"]'
  );
  checkbox = By.css('input[type="checkbox"]');

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/shopping-list`);
  }

  async isDisplayed() {
    try {
      await waitForElement(this.driver, this.addItemInput, 10000);
      return true;
    } catch {
      return false;
    }
  }

  async getItemCount() {
    try {
      const items = await this.driver.findElements(this.shoppingItem);
      return items.length;
    } catch {
      return 0;
    }
  }

  async addItem(itemName) {
    const input = await waitForElement(this.driver, this.addItemInput);
    await input.clear();
    await input.sendKeys(itemName);
    const button = await waitForElement(this.driver, this.addItemButton);
    await button.click();
    await this.driver.sleep(500);
  }
}

module.exports = ShoppingListPage;
