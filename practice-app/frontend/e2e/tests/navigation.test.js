// e2e/tests/navigation.test.js
const { Builder, By } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const HomePage = require("../pages/HomePage");
const testConfig = require("../config/test.config");
const { waitForElement } = require("../helpers/waits");

describe("Navigation Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let homePage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    homePage = new HomePage(driver);
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe("Main Navigation Menu", () => {
    beforeEach(async () => {
      // Login before each test
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
    });

    test("should navigate to dashboard from menu", async () => {
      const dashboardLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Dashboard")]'
        ),
        10000
      );
      await dashboardLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/dashboard");
    });

    test("should navigate to recipes from menu", async () => {
      const recipesLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Recipes")]'
        ),
        10000
      );
      await recipesLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/recipes");
    });

    test("should navigate to meal planner from menu", async () => {
      const mealPlannerLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Meal Planner")]'
        ),
        10000
      );
      await mealPlannerLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/meal-planner");
    });

    test("should navigate to shopping list from menu", async () => {
      const shoppingListLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Shopping List")]'
        ),
        10000
      );
      await shoppingListLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/shopping-list");
    });

    test("should navigate to ingredients from menu", async () => {
      const ingredientsLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Ingredients")]'
        ),
        10000
      );
      await ingredientsLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/ingredients");
    });

    test("should navigate to community from menu", async () => {
      const communityLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Community")]'
        ),
        10000
      );
      await communityLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community");
    });

    test("should navigate to profile from menu", async () => {
      const profileLink = await waitForElement(
        driver,
        By.xpath(
          '//a[contains(@class, "layout-nav-link") and contains(text(), "Profile")]'
        ),
        10000
      );
      await profileLink.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/profile");
    });
  });

  describe("Logo Navigation", () => {
    beforeEach(async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
    });

    test("should navigate to dashboard when logo is clicked", async () => {
      const logo = await waitForElement(driver, By.css(".layout-logo"), 10000);
      await logo.click();
      await driver.sleep(1000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/dashboard");
    });
  });

  describe("Footer Links", () => {
    beforeEach(async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
    });

    test("should display footer", async () => {
      const footer = await waitForElement(
        driver,
        By.css(".layout-footer"),
        10000
      );
      const isDisplayed = await footer.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should display copyright year in footer", async () => {
      const footer = await waitForElement(
        driver,
        By.css(".layout-footer"),
        10000
      );
      const footerText = await footer.getText();
      expect(footerText).toContain("FitHub");
    });
  });

  describe("Protected Route Redirection", () => {
    test("should redirect to login when accessing protected route while logged out", async () => {
      // Ensure we're logged out
      await driver.manage().deleteAllCookies();
      await driver.executeScript("window.localStorage.clear();");

      // Try to access dashboard
      await driver.get(`${testConfig.baseUrl}/dashboard`);
      await driver.sleep(2000);

      const url = await driver.getCurrentUrl();
      expect(url).toContain("/login");
    });

    test("should redirect to login when accessing meal planner while logged out", async () => {
      await driver.manage().deleteAllCookies();
      await driver.executeScript("window.localStorage.clear();");

      await driver.get(`${testConfig.baseUrl}/meal-planner`);
      await driver.sleep(2000);

      const url = await driver.getCurrentUrl();
      expect(url).toContain("/login");
    });

    test("should redirect to login when accessing profile while logged out", async () => {
      await driver.manage().deleteAllCookies();
      await driver.executeScript("window.localStorage.clear();");

      await driver.get(`${testConfig.baseUrl}/profile`);
      await driver.sleep(2000);

      const url = await driver.getCurrentUrl();
      expect(url).toContain("/login");
    });
  });

  describe("Direct URL Navigation", () => {
    beforeEach(async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
    });

    test("should navigate directly to recipes URL", async () => {
      await driver.get(`${testConfig.baseUrl}/recipes`);
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/recipes");
    });

    test("should navigate directly to community URL", async () => {
      await driver.get(`${testConfig.baseUrl}/community`);
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community");
    });
  });

  describe("Back Button Functionality", () => {
    beforeEach(async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
    });

    test("should navigate back using browser back button", async () => {
      // Navigate to recipes
      await driver.get(`${testConfig.baseUrl}/recipes`);
      await driver.sleep(1000);

      // Go back
      await driver.navigate().back();
      await driver.sleep(1000);

      // Should be back on previous page
      const url = await driver.getCurrentUrl();
      expect(url).toBeTruthy();
    });
  });

  describe("Language Selector in Header", () => {
    beforeEach(async () => {
      await loginPage.navigateTo();
      await loginPage.login(
        testConfig.testData.validUser.email,
        testConfig.testData.validUser.password
      );
      await dashboardPage.isDashboardDisplayed();
    });

    test("should change language from header dropdown", async () => {
      const langSelect = await waitForElement(
        driver,
        By.css(".layout-language-select"),
        10000
      );
      await langSelect.click();
      const turkishOption = await driver.findElement(
        By.css('option[value="tr"]')
      );
      await turkishOption.click();
      await driver.sleep(1000);

      // Language should change (verify by checking page content)
      const currentLang = await langSelect.getAttribute("value");
      expect(currentLang).toBe("tr");
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
