// e2e/pages/RecipePage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class RecipePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Recipe Discovery
  searchInput = By.css(
    'input[placeholder*="Search recipes"], input[type="text"]'
  );
  recipeCard = By.css('.recipe-card, [class*="recipe-card"]');
  uploadRecipeButton = By.css("button.green-button, .green-button");
  paginationNext = By.css('button:contains("Next"), .pagination-green-button');
  paginationPrevious = By.css(
    'button:contains("Previous"), .pagination-green-button'
  );

  // Locators - Recipe Detail
  recipeTitle = By.css('h1, [data-testid="recipe-title"]');
  recipeDescription = By.css(
    '.description, [data-testid="recipe-description"]'
  );
  bookmarkButton = By.css(
    'button[aria-label*="Bookmark"], [data-testid="bookmark-btn"], button:contains("Bookmark")'
  );
  ratingStars = By.css('.stars, [data-testid="rating-stars"], .rating-stars');
  ingredientsList = By.css('.ingredients, [data-testid="ingredients"]');
  instructionsList = By.css(
    '.recipe-detail-page-content-steps, .recipe-detail-page-content-steps ol, .instructions, [data-testid="instructions"], .steps'
  );
  commentSection = By.css('.comments, [data-testid="comments"]');
  backButton = By.css('button[aria-label="Back"], [data-testid="back-btn"]');
  editButton = By.css('button:contains("Edit"), a[href*="edit"]');
  deleteButton = By.css('button:contains("Delete")');

  // Locators - Upload/Edit Recipe
  recipeNameInput = By.css(
    'input[name="name"], input[placeholder*="Recipe name"]'
  );
  prepTimeInput = By.css(
    'input[name="prep_time"], input[placeholder*="Prep time"]'
  );
  cookingTimeInput = By.css(
    'input[name="cooking_time"], input[placeholder*="Cooking time"]'
  );
  mealTypeSelect = By.css('select[name="meal_type"]');
  stepsTextarea = By.css(
    'textarea[name="stepsText"], textarea[placeholder*="steps"]'
  );
  submitButton = By.css('button[type="submit"], button:contains("Submit")');
  ingredientSearchInput = By.css('input[placeholder*="Search ingredients"]');

  // Actions - Navigation
  async navigateToDiscovery() {
    await this.driver.get(`${this.baseUrl}/recipes`);
  }

  async navigateTo(recipeId) {
    await this.driver.get(`${this.baseUrl}/recipes/${recipeId}`);
  }

  async navigateToUpload() {
    await this.driver.get(`${this.baseUrl}/uploadRecipe`);
  }

  async navigateToEdit(recipeId) {
    await this.driver.get(`${this.baseUrl}/recipes/${recipeId}/edit`);
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

  // Recipe Discovery Actions
  async searchRecipes(query) {
    const searchInput = await waitForElement(this.driver, this.searchInput);
    await searchInput.clear();
    await searchInput.sendKeys(query);
    await this.driver.sleep(1000);
  }

  async getRecipeCardCount() {
    try {
      await this.driver.sleep(2000);
      const cards = await this.driver.findElements(this.recipeCard);
      return cards.length;
    } catch {
      return 0;
    }
  }

  async clickRecipeCard(index = 0) {
    const cards = await this.driver.findElements(this.recipeCard);
    if (cards.length > index) {
      await cards[index].click();
      await this.driver.sleep(1000);
    }
  }

  async clickUploadRecipe() {
    const button = await waitForElement(this.driver, this.uploadRecipeButton);
    await button.click();
    await this.driver.sleep(1000);
  }

  async clickNextPage() {
    try {
      const button = await this.driver.findElement(
        By.xpath(
          '//button[contains(text(), "Next") or contains(text(), "next")]'
        )
      );
      await button.click();
      await this.driver.sleep(1000);
    } catch {
      // Next button not found or disabled
    }
  }

  async clickPreviousPage() {
    try {
      const button = await this.driver.findElement(
        By.xpath(
          '//button[contains(text(), "Previous") or contains(text(), "previous")]'
        )
      );
      await button.click();
      await this.driver.sleep(1000);
    } catch {
      // Previous button not found or disabled
    }
  }

  // Upload Recipe Actions
  async enterRecipeName(name) {
    const input = await waitForElement(this.driver, this.recipeNameInput);
    await input.clear();
    await input.sendKeys(name);
  }

  async enterPrepTime(time) {
    const input = await waitForElement(this.driver, this.prepTimeInput);
    await input.clear();
    await input.sendKeys(time);
  }

  async enterCookingTime(time) {
    const input = await waitForElement(this.driver, this.cookingTimeInput);
    await input.clear();
    await input.sendKeys(time);
  }

  async selectMealType(type) {
    const select = await waitForElement(this.driver, this.mealTypeSelect);
    await select.click();
    const option = await this.driver.findElement(
      By.xpath(`//option[contains(text(), "${type}")]`)
    );
    await option.click();
  }

  async enterSteps(steps) {
    const textarea = await waitForElement(this.driver, this.stepsTextarea);
    await textarea.clear();
    await textarea.sendKeys(steps);
  }

  async submitRecipe() {
    const button = await waitForElement(this.driver, this.submitButton);
    await button.click();
    await this.driver.sleep(2000);
  }

  // Edit Recipe Actions
  async clickEditButton() {
    try {
      const button = await waitForElement(this.driver, this.editButton, 5000);
      await button.click();
      await this.driver.sleep(1000);
    } catch {
      // Edit button not found (user might not be owner)
    }
  }

  async clickDeleteButton() {
    try {
      const button = await waitForElement(this.driver, this.deleteButton, 5000);
      await button.click();
      await this.driver.sleep(1000);
    } catch {
      // Delete button not found
    }
  }

  async getInstructions() {
    try {
      // Try to find the steps container first
      const stepsContainer = await waitForElement(
        this.driver,
        By.css(".recipe-detail-page-content-steps"),
        10000
      );
      // Get text from the container (includes the ordered list)
      const text = await stepsContainer.getText();
      if (text && text.trim()) {
        return text.trim();
      }
      // Fallback to ol element
      const ol = await stepsContainer.findElement(By.css("ol"));
      return await ol.getText();
    } catch {
      // Fallback to original selector
      try {
        const instructions = await waitForElement(
          this.driver,
          this.instructionsList,
          5000
        );
        return await instructions.getText();
      } catch {
        return null;
      }
    }
  }
}

module.exports = RecipePage;
