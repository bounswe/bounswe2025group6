// e2e/pages/RecipePage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class RecipePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  recipeTitle = By.css('h1, [data-testid="recipe-title"]');
  recipeDescription = By.css(
    '.description, [data-testid="recipe-description"]'
  );
  bookmarkButton = By.css(
    'button[aria-label*="Bookmark"], [data-testid="bookmark-btn"]'
  );
  ratingStars = By.css('.stars, [data-testid="rating-stars"]');
  ingredientsList = By.css('.ingredients, [data-testid="ingredients"]');
  instructionsList = By.css('.instructions, [data-testid="instructions"]');
  commentSection = By.css('.comments, [data-testid="comments"]');
  backButton = By.css('button[aria-label="Back"], [data-testid="back-btn"]');

  // Actions
  async navigateTo(recipeId) {
    await this.driver.get(`${this.baseUrl}/recipe/${recipeId}`);
  }

  async getRecipeTitle() {
    const title = await waitForElement(this.driver, this.recipeTitle);
    return await title.getText();
  }

  async getRecipeDescription() {
    const desc = await waitForElement(this.driver, this.recipeDescription);
    return await desc.getText();
  }

  async clickBookmark() {
    const button = await waitForElement(this.driver, this.bookmarkButton);
    await button.click();
  }

  async isBookmarked() {
    try {
      const button = await waitForElement(this.driver, this.bookmarkButton);
      const ariaPressed = await button.getAttribute("aria-pressed");
      return ariaPressed === "true";
    } catch (e) {
      return false;
    }
  }

  async rateRecipe(stars) {
    // stars: 1-5
    const starsElements = await this.driver.findElements(this.ratingStars);
    if (starsElements.length >= stars) {
      await starsElements[stars - 1].click();
    }
  }

  async getIngredientsCount() {
    try {
      const ingredients = await this.driver.findElements(
        By.css('.ingredient, [data-testid="ingredient"]')
      );
      return ingredients.length;
    } catch (e) {
      return 0;
    }
  }

  async clickBack() {
    const button = await waitForElement(this.driver, this.backButton);
    await button.click();
  }

  async isPageLoaded() {
    try {
      await waitForElement(this.driver, this.recipeTitle, 5000);
      return true;
    } catch (e) {
      return false;
    }
  }
}

module.exports = RecipePage;
