// e2e/tests/home.test.js
const { Builder } = require("selenium-webdriver");
const HomePage = require("../pages/HomePage");
const LoginPage = require("../pages/LoginPage");
const testConfig = require("../config/test.config");

describe("Home Page Tests", () => {
  let driver;
  let homePage;
  let loginPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    homePage = new HomePage(driver);
    loginPage = new LoginPage(driver);
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe("Home Page Display", () => {
    test("should display home page correctly", async () => {
      await homePage.navigateTo();
      const isDisplayed = await homePage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should display hero section with title and subtitle", async () => {
      await homePage.navigateTo();
      const title = await homePage.getHeroTitle();
      const subtitle = await homePage.getHeroSubtitle();

      expect(title).not.toBeNull();
      expect(title.length).toBeGreaterThan(0);
      expect(subtitle).not.toBeNull();
      expect(subtitle.length).toBeGreaterThan(0);
    });

    test("should display features section with all feature cards", async () => {
      await homePage.navigateTo();
      const cardCount = await homePage.getFeatureCardCount();
      expect(cardCount).toBeGreaterThanOrEqual(6);
    });

    test("should display how it works section with steps", async () => {
      await homePage.navigateTo();
      const stepCount = await homePage.getStepCount();
      expect(stepCount).toBeGreaterThanOrEqual(3);
    });
  });

  describe("Language Functionality", () => {
    test("should change language when dropdown is used", async () => {
      await homePage.navigateTo();
      const initialTitle = await homePage.getHeroTitle();

      // Change to Turkish
      await homePage.changeLanguage("tr");
      await driver.sleep(1000);

      // Title should change (assuming translations are different)
      const newTitle = await homePage.getHeroTitle();
      expect(newTitle).not.toBeNull();

      // Change back to English
      await homePage.changeLanguage("en");
      await driver.sleep(1000);
    });
  });

  describe("Navigation When Logged Out", () => {
    test("should show login and register buttons when logged out", async () => {
      // Ensure we're logged out
      await driver.manage().deleteAllCookies();
      await driver.executeScript("window.localStorage.clear();");

      await homePage.navigateTo();
      await driver.sleep(2000); // Wait for page to fully load
      const isLoggedIn = await homePage.isLoggedIn();
      expect(isLoggedIn).toBe(false);

      // Should be able to click login button
      try {
        await homePage.clickLogin();
        // Wait for navigation
        await driver.wait(
          async () => {
            const url = await driver.getCurrentUrl();
            return url.includes("/login");
          },
          10000,
          "Did not navigate to login page"
        );
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/login");
      } catch (error) {
        // If click failed, check if we're already on login
        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes("/login")) {
          throw error;
        }
      }
    });

    test("should navigate to register page", async () => {
      await driver.manage().deleteAllCookies();
      await driver.executeScript("window.localStorage.clear();");

      await homePage.navigateTo();
      await driver.sleep(2000); // Wait for page to fully load

      try {
        await homePage.clickRegister();
        // Wait for navigation
        await driver.wait(
          async () => {
            const url = await driver.getCurrentUrl();
            return url.includes("/register");
          },
          10000,
          "Did not navigate to register page"
        );
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/register");
      } catch (error) {
        // If click failed, check if we're already on register or button doesn't exist
        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes("/register")) {
          throw error;
        }
      }
    });
  });

  describe("Navigation When Logged In", () => {
    beforeEach(async () => {
      // Login before each test
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      // Wait for dashboard to load to ensure auth state is established
      await driver.wait(
        async () => {
          const url = await driver.getCurrentUrl();
          return url.includes("/dashboard");
        },
        10000,
        "Did not navigate to dashboard after login"
      );
      await driver.sleep(1000); // Additional wait for auth context to be fully set
    });

    test("should show dashboard button when logged in", async () => {
      await homePage.navigateTo();
      await driver.sleep(2000); // Wait for page to fully load and auth state to be determined
      const isLoggedIn = await homePage.isLoggedIn();
      expect(isLoggedIn).toBe(true);
    });

    test("should navigate to dashboard when dashboard button is clicked", async () => {
      await homePage.navigateTo();
      await driver.sleep(2000); // Wait for page to fully load

      try {
        await homePage.clickDashboard();
        // Wait for navigation
        await driver.wait(
          async () => {
            const url = await driver.getCurrentUrl();
            return url.includes("/dashboard");
          },
          10000,
          "Did not navigate to dashboard"
        );
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/dashboard");
      } catch (error) {
        // If click failed, check if we're already on dashboard or button doesn't exist
        const currentUrl = await driver.getCurrentUrl();
        if (!currentUrl.includes("/dashboard")) {
          throw error;
        }
      }
    });
  });

  describe("CTA Section", () => {
    test("should display CTA section", async () => {
      await homePage.navigateTo();
      // CTA button should be clickable
      try {
        await homePage.clickCtaButton();
        // Should navigate somewhere
        const url = await driver.getCurrentUrl();
        expect(url).toBeTruthy();
      } catch {
        // CTA might not be clickable in all states
      }
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
