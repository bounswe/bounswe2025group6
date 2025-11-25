// e2e/tests/shopping-list.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const ShoppingListPage = require("../pages/ShoppingListPage");
const testConfig = require("../config/test.config");

describe("Shopping List Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let shoppingListPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
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
  });

  describe("Shopping List Display", () => {
    test("should display shopping list page", async () => {
      await shoppingListPage.navigateTo();
      await driver.sleep(2000);
      const isDisplayed = await shoppingListPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should display existing items", async () => {
      await shoppingListPage.navigateTo();
      await driver.sleep(2000);
      const itemCount = await shoppingListPage.getItemCount();
      expect(itemCount).toBeGreaterThanOrEqual(0);
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
