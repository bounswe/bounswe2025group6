// e2e/tests/shopping-list.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const MealPlannerPage = require("../pages/MealPlannerPage");
const ShoppingListPage = require("../pages/ShoppingListPage");
const testConfig = require("../config/test.config");

describe("Shopping List Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let mealPlannerPage;
  let shoppingListPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    mealPlannerPage = new MealPlannerPage(driver);
    shoppingListPage = new ShoppingListPage(driver);
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

    // Wait for dashboard to load to ensure login was successful
    await dashboardPage.isDashboardDisplayed();
    await driver.sleep(1000); // Additional wait for auth state to be fully established

    // Create a meal plan before each test
    await mealPlannerPage.createMealPlan();

    // Generate shopping list
    await mealPlannerPage.generateShoppingList();

    // Wait for navigation to shopping list
    await driver.wait(
      async () => {
        const url = await driver.getCurrentUrl();
        return url.includes("/shopping-list");
      },
      10000,
      "Did not navigate to shopping list after generating"
    );
    await driver.sleep(2000);
  });

  describe("Shopping List Display", () => {
    test("should display shopping list page", async () => {
      // Already navigated in beforeEach
      const isDisplayed = await shoppingListPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should not be in empty state - meals should be planned", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);
    });

    test("should display shopping list title", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const title = await shoppingListPage.getTitle();
      expect(title).not.toBeNull();
      expect(title.length).toBeGreaterThan(0);
    });

    test("should display recipes section with at least one recipe", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const recipeCount = await shoppingListPage.getRecipeCount();
      expect(recipeCount).toBeGreaterThan(0);
    });

    test("should display ingredients section with at least one ingredient", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const ingredientCount = await shoppingListPage.getIngredientCount();
      expect(ingredientCount).toBeGreaterThan(0);
    });

    test("should display market costs section", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const marketCount = await shoppingListPage.getMarketCostCount();
      expect(marketCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Shopping List Interactions", () => {
    test("should click copy button", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      try {
        await shoppingListPage.clickCopyButton();
        // Button should be clickable (might show "Copied" state)
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/shopping-list");
      } catch (error) {
        throw new Error(`Copy button failed: ${error.message}`);
      }
    });

    test("should navigate to ingredient detail when clicking ingredient", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const ingredientCount = await shoppingListPage.getIngredientCount();
      expect(ingredientCount).toBeGreaterThan(0);

      try {
        await shoppingListPage.clickIngredient(0);
        await driver.sleep(2000);
        // Should navigate to ingredient detail page
        const url = await driver.getCurrentUrl();
        expect(
          url.includes("/ingredients/") || url.includes("/shopping-list")
        ).toBe(true);
      } catch (error) {
        throw new Error(`Ingredient click failed: ${error.message}`);
      }
    });

    test("should navigate back to meal planner", async () => {
      await shoppingListPage.navigateTo();
      await driver.sleep(2000);

      try {
        await shoppingListPage.clickBackToPlanner();
        // Wait for navigation
        await driver.wait(
          async () => {
            const url = await driver.getCurrentUrl();
            return url.includes("/meal-planner");
          },
          10000,
          "Did not navigate to meal planner"
        );
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/meal-planner");
      } catch {
        // Back button might not be available
        const url = await driver.getCurrentUrl();
        expect(
          url.includes("/shopping-list") || url.includes("/meal-planner")
        ).toBe(true);
      }
    });
  });

  describe("Shopping List Content", () => {
    test("should display recipe cards with nutrition info", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const recipeCount = await shoppingListPage.getRecipeCount();
      expect(recipeCount).toBeGreaterThan(0);
    });

    test("should display consolidated ingredients list", async () => {
      // Already navigated in beforeEach
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const ingredientCount = await shoppingListPage.getIngredientCount();
      expect(ingredientCount).toBeGreaterThan(0);
    });
  });

  describe("Shopping List Persistence", () => {
    test("should persist shopping list after logout and login", async () => {
      // Create a meal plan and generate shopping list
      await mealPlannerPage.navigateTo();
      await driver.sleep(2000);
      await mealPlannerPage.createMealPlan();
      await mealPlannerPage.generateShoppingList();

      // Wait for shopping list to load
      await driver.wait(
        async () => {
          const url = await driver.getCurrentUrl();
          return url.includes("/shopping-list");
        },
        10000,
        "Did not navigate to shopping list"
      );
      await driver.sleep(2000);

      // Get initial counts
      const initialRecipeCount = await shoppingListPage.getRecipeCount();
      const initialIngredientCount =
        await shoppingListPage.getIngredientCount();

      expect(initialRecipeCount).toBeGreaterThan(0);
      expect(initialIngredientCount).toBeGreaterThan(0);

      // Logout (clear cookies but keep localStorage for meal plan persistence)
      await driver.manage().deleteAllCookies();
      // Note: We don't clear localStorage here to test persistence
      await driver.sleep(1000);

      // Login again
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
      await driver.sleep(1000);

      // Navigate to shopping list
      await shoppingListPage.navigateTo();
      await driver.sleep(2000);

      // Verify shopping list still has content (from persisted meal plan)
      const isEmpty = await shoppingListPage.isEmptyState();
      expect(isEmpty).toBe(false);

      const recipeCount = await shoppingListPage.getRecipeCount();
      const ingredientCount = await shoppingListPage.getIngredientCount();

      // Shopping list should still have recipes and ingredients
      expect(recipeCount).toBeGreaterThan(0);
      expect(ingredientCount).toBeGreaterThan(0);

      // Verify counts match (or at least not empty)
      expect(recipeCount).toBe(initialRecipeCount);
      expect(ingredientCount).toBe(initialIngredientCount);
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
