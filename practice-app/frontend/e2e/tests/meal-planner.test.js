// e2e/tests/meal-planner.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const MealPlannerPage = require("../pages/MealPlannerPage");
const testConfig = require("../config/test.config");

describe("Meal Planner Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let mealPlannerPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    mealPlannerPage = new MealPlannerPage(driver);
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
  });

  describe("Meal Planner Display", () => {
    test("should display meal planner page", async () => {
      await mealPlannerPage.navigateTo();
      await driver.sleep(2000);
      const isDisplayed = await mealPlannerPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should have calendar view", async () => {
      await mealPlannerPage.navigateTo();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/meal-planner");
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
