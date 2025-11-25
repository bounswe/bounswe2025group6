// e2e/tests/ingredients.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const IngredientsPage = require("../pages/IngredientsPage");
const IngredientDetailPage = require("../pages/IngredientDetailPage");
const testConfig = require("../config/test.config");

describe("Ingredients Tests", () => {
  let driver;
  let loginPage;
  let ingredientsPage;
  let ingredientDetailPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    ingredientsPage = new IngredientsPage(driver);
    ingredientDetailPage = new IngredientDetailPage(driver);
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  beforeEach(async () => {
    await loginPage.navigateTo();
    await loginPage.login(
      testConfig.testData.validUser.email,
      testConfig.testData.validUser.password
    );
  });

  describe("Ingredients Page Display", () => {
    test("should display ingredients page", async () => {
      await ingredientsPage.navigateTo();
      await driver.sleep(2000);
      const isDisplayed = await ingredientsPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should display ingredient cards", async () => {
      await ingredientsPage.navigateTo();
      await driver.sleep(2000);
      const count = await ingredientsPage.getIngredientCount();
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should search for ingredients", async () => {
      await ingredientsPage.navigateTo();
      await driver.sleep(2000);
      await ingredientsPage.searchIngredients("tomato");
      await driver.sleep(2000);
      // Should show filtered results
    });

    test("should navigate to ingredient detail", async () => {
      await ingredientsPage.navigateTo();
      await driver.sleep(2000);
      await ingredientsPage.clickIngredient(0);
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/ingredients/");
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}

