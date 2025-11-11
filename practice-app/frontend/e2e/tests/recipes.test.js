// e2e/tests/recipes.test.js
const { Builder } = require('selenium-webdriver');
const LoginPage = require('../pages/LoginPage');
const DashboardPage = require('../pages/DashboardPage');
const RecipePage = require('../pages/RecipePage');
const testConfig = require('../config/test.config');

describe('Recipe Interaction Tests', () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let recipePage;

  beforeAll(async () => {
    driver = await new Builder()
      .forBrowser('chrome')
      .build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    recipePage = new RecipePage(driver);
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    // Login before each test
    await loginPage.navigateTo();
    await loginPage.login(
      testConfig.testData.validUser.email,
      testConfig.testData.validUser.password
    );
  });

  describe('Recipe Browsing', () => {
    test('should display recipes on dashboard', async () => {
      await dashboardPage.navigateTo();
      const recipeCount = await dashboardPage.getRecipeCount();
      expect(recipeCount).toBeGreaterThan(0);
    });

    test('should navigate to recipe detail page', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      const isLoaded = await recipePage.isPageLoaded();
      expect(isLoaded).toBe(true);
    });

    test('should display recipe title', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      const title = await recipePage.getRecipeTitle();
      expect(title).not.toBeNull();
      expect(title.length).toBeGreaterThan(0);
    });

    test('should display recipe description', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      const description = await recipePage.getRecipeDescription();
      expect(description).not.toBeNull();
    });

    test('should display ingredients', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      const ingredientCount = await recipePage.getIngredientsCount();
      expect(ingredientCount).toBeGreaterThan(0);
    });
  });

  describe('Recipe Interactions', () => {
    test('should bookmark a recipe', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      await recipePage.clickBookmark();
      const isBookmarked = await recipePage.isBookmarked();
      expect(isBookmarked).toBe(true);
    });

    test('should unbookmark a recipe', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      // Bookmark first
      await recipePage.clickBookmark();
      
      // Then unbookmark
      await recipePage.clickBookmark();
      const isBookmarked = await recipePage.isBookmarked();
      expect(isBookmarked).toBe(false);
    });

    test('should rate a recipe', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      await recipePage.rateRecipe(5);
      // Verify rating was applied (would need API call or UI verification)
    });

    test('should navigate back to dashboard', async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.clickRecipe(0);
      
      await recipePage.clickBack();
      const isDashboardLoaded = await dashboardPage.isDashboardDisplayed();
      expect(isDashboardLoaded).toBe(true);
    });
  });

  describe('Recipe Filtering', () => {
    test('should search for recipes', async () => {
      await dashboardPage.navigateTo();
      // Add search functionality test when implemented
    });

    test('should filter recipes by category', async () => {
      await dashboardPage.navigateTo();
      // Add filter functionality test when implemented
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
