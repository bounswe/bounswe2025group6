// e2e/pages/ShoppingListPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class ShoppingListPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual ShoppingListPage component
  container = By.css(".shopping-list-container");
  header = By.css(".shopping-list-header");
  title = By.css(".shopping-list-title");
  copyButton = By.css(".copy-button");
  recipesSection = By.css(".recipes-summary-section");
  recipeCard = By.css(".recipe-summary-card");
  ingredientsSection = By.css(".ingredients-section");
  ingredientItem = By.css(".ingredient-item");
  marketCostsSection = By.css(".market-costs-section");
  marketCostCard = By.css(".market-cost-card");
  backToPlannerButton = By.css(".back-to-planner-button");
  emptyState = By.css(".empty-state");
  goToPlannerButton = By.css(".empty-state button, .empty-state a button");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/shopping-list`);
  }

  async isDisplayed() {
    try {
      // Wait for URL to change to shopping list page
      await this.driver.wait(
        async () => {
          const url = await this.driver.getCurrentUrl();
          return url.includes("/shopping-list");
        },
        10000,
        "Shopping list page URL not reached"
      );

      const container = await waitForElement(
        this.driver,
        this.container,
        10000
      );
      return await container.isDisplayed();
    } catch {
      return false;
    }
  }

  async isEmptyState() {
    try {
      await waitForElement(this.driver, this.emptyState, 5000);
      return true;
    } catch {
      return false;
    }
  }

  async getRecipeCount() {
    try {
      // Check if empty state first
      const isEmpty = await this.isEmptyState();
      if (isEmpty) {
        return 0;
      }

      await waitForElement(this.driver, this.recipesSection, 10000);
      const recipes = await this.driver.findElements(this.recipeCard);
      return recipes.length;
    } catch {
      return 0;
    }
  }

  async getIngredientCount() {
    try {
      // Check if empty state first
      const isEmpty = await this.isEmptyState();
      if (isEmpty) {
        return 0;
      }

      await waitForElement(this.driver, this.ingredientsSection, 10000);
      const ingredients = await this.driver.findElements(this.ingredientItem);
      return ingredients.length;
    } catch {
      return 0;
    }
  }

  async getMarketCostCount() {
    try {
      // Check if empty state first
      const isEmpty = await this.isEmptyState();
      if (isEmpty) {
        return 0;
      }

      await waitForElement(this.driver, this.marketCostsSection, 10000);
      const markets = await this.driver.findElements(this.marketCostCard);
      return markets.length;
    } catch {
      return 0;
    }
  }

  async clickCopyButton() {
    // Check if empty state first
    const isEmpty = await this.isEmptyState();
    if (isEmpty) {
      throw new Error("Copy button not available in empty state");
    }

    const button = await waitForElement(this.driver, this.copyButton, 10000);
    await button.click();
    await this.driver.sleep(1000);
  }

  async clickIngredient(index = 0) {
    try {
      await waitForElement(this.driver, this.ingredientsSection, 10000);
      const ingredients = await this.driver.findElements(this.ingredientItem);
      if (ingredients.length > index) {
        await this.driver.executeScript(
          "arguments[0].scrollIntoView(true);",
          ingredients[index]
        );
        await this.driver.sleep(500);
        await ingredients[index].click();
        await this.driver.sleep(1000);
      }
    } catch {
      throw new Error(`Ingredient at index ${index} not found`);
    }
  }

  async clickBackToPlanner() {
    try {
      const button = await waitForElement(
        this.driver,
        this.backToPlannerButton,
        10000
      );
      await button.click();
      await this.driver.sleep(2000);
    } catch {
      throw new Error("Back to planner button not found");
    }
  }

  async getTitle() {
    try {
      // Check if empty state first
      const isEmpty = await this.isEmptyState();
      if (isEmpty) {
        return null; // No title in empty state
      }

      const title = await waitForElement(this.driver, this.title, 10000);
      return await title.getText();
    } catch {
      return null;
    }
  }

  async clickGoToPlannerFromEmptyState() {
    const isEmpty = await this.isEmptyState();
    if (!isEmpty) {
      throw new Error("Not in empty state");
    }

    const button = await waitForElement(
      this.driver,
      this.goToPlannerButton,
      10000
    );
    await button.click();
    await this.driver.sleep(2000);
  }
}

module.exports = ShoppingListPage;
