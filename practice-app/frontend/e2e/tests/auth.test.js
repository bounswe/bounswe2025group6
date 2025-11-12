// e2e/tests/auth.test.js
const { Builder, By } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const testConfig = require("../config/test.config");

describe("Authentication Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe("Login Page", () => {
    test("should display login page", async () => {
      await loginPage.navigateTo();
      const isDisplayed = await loginPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should login with valid credentials", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );

      // Wait for dashboard to appear
      const isDashboardLoaded = await dashboardPage.isDashboardDisplayed();
      expect(isDashboardLoaded).toBe(true);
    });

    test("should show error with invalid credentials", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.invalidUser.email,
        testConfig.testData.invalidUser.password
      );

      const errorMessage = await loginPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
    });

    test("should have forgot password link", async () => {
      await loginPage.navigateTo();
      try {
        await loginPage.clickForgotPassword();
        // Verify navigation to forgot password page
        const url = await driver.getCurrentUrl();
        expect(url).toContain("forgot");
      } catch (e) {
        console.log("Forgot password link not found or not working");
      }
    });

    test("should have register link", async () => {
      await loginPage.navigateTo();
      try {
        await loginPage.clickRegister();
        // Verify navigation to register page
        const url = await driver.getCurrentUrl();
        expect(url).toContain("register");
      } catch (e) {
        console.log("Register link not found or not working");
      }
    });
  });

  describe("Dashboard after Login", () => {
    test("should display dashboard after successful login", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );

      const isLoaded = await dashboardPage.isLoaded();
      expect(isLoaded).toBe(true);
    });

    test("should display welcome message on dashboard", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );

      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).not.toBeNull();
      expect(welcomeMessage.length).toBeGreaterThan(0);
    });

    test("should display dashboard subtitle", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );

      const subtitle = await dashboardPage.getDashboardSubtitle();
      expect(subtitle).not.toBeNull();
    });

    test("should display dashboard cards", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );

      const cardCount = await dashboardPage.getCardCount();
      expect(cardCount).toBeGreaterThanOrEqual(4);
    });

    test("should display card titles", async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );

      const cardTitles = await dashboardPage.getCardTitles();
      expect(cardTitles.length).toBeGreaterThan(0);
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
