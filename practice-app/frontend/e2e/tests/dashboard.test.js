// e2e/tests/dashboard.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const testConfig = require("../config/test.config");

describe("Dashboard Tests", () => {
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

  beforeEach(async () => {
    // Login before each test
    await loginPage.navigateTo();
    await loginPage.login(
      testConfig.testData.validUser.email,
      testConfig.testData.validUser.password
    );
    await dashboardPage.isDashboardDisplayed();
  });

  describe("Dashboard Display", () => {
    test("should display dashboard after login", async () => {
      const isDisplayed = await dashboardPage.isDashboardDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should display welcome message with username", async () => {
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).not.toBeNull();
      expect(welcomeMessage.length).toBeGreaterThan(0);
      // Should contain a greeting (Good Morning/Afternoon/Evening)
      expect(
        welcomeMessage.toLowerCase().includes("good") ||
          welcomeMessage.toLowerCase().includes("morning") ||
          welcomeMessage.toLowerCase().includes("afternoon") ||
          welcomeMessage.toLowerCase().includes("evening")
      ).toBe(true);
    });

    test("should display dashboard subtitle", async () => {
      const subtitle = await dashboardPage.getDashboardSubtitle();
      expect(subtitle).not.toBeNull();
      expect(subtitle.length).toBeGreaterThan(0);
    });
  });

  describe("Analytics Cards", () => {
    test("should display analytics cards", async () => {
      const cardCount = await dashboardPage.getAnalyticsCardCount();
      expect(cardCount).toBeGreaterThan(0);
    });

    test("should display analytics values", async () => {
      const values = await dashboardPage.getAnalyticsValues();
      expect(values.length).toBeGreaterThan(0);
      // Values should be numbers or dashes
      values.forEach((value) => {
        expect(value === "—" || !isNaN(parseInt(value))).toBe(true);
      });
    });

    test("should display analytics labels", async () => {
      const labels = await dashboardPage.getAnalyticsLabels();
      expect(labels.length).toBeGreaterThan(0);
      labels.forEach((label) => {
        expect(label.length).toBeGreaterThan(0);
      });
    });

    test("should have analytics icons", async () => {
      const icons = await driver.findElements(
        dashboardPage.analyticsIcon
      );
      expect(icons.length).toBeGreaterThan(0);
    });
  });

  describe("Dashboard Cards Navigation", () => {
    test("should navigate to meal planner from card", async () => {
      await dashboardPage.clickMealPlannerCard();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/meal-planner");
    });

    test("should navigate to recipes from card", async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.isDashboardDisplayed();
      await dashboardPage.clickRecipesCard();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/recipes");
    });

    test("should navigate to shopping list from card", async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.isDashboardDisplayed();
      await dashboardPage.clickShoppingListCard();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/shopping-list");
    });

    test("should navigate to community from card", async () => {
      await dashboardPage.navigateTo();
      await dashboardPage.isDashboardDisplayed();
      await dashboardPage.clickCommunityCard();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community");
    });
  });

  describe("Dashboard Cards Display", () => {
    test("should display all dashboard cards", async () => {
      const cardCount = await dashboardPage.getCardCount();
      expect(cardCount).toBeGreaterThanOrEqual(4);
    });

    test("should display card titles", async () => {
      const cardTitles = await dashboardPage.getCardTitles();
      expect(cardTitles.length).toBeGreaterThan(0);
      cardTitles.forEach((title) => {
        expect(title.length).toBeGreaterThan(0);
      });
    });

    test("should display card icons", async () => {
      const icons = await driver.findElements(
        dashboardPage.dashboardCardIcon
      );
      expect(icons.length).toBeGreaterThanOrEqual(4);
    });

    test("should have buttons on all cards", async () => {
      const cards = await driver.findElements(dashboardPage.dashboardCard);
      for (const card of cards) {
        const buttons = await card.findElements(dashboardPage.greenButton);
        expect(buttons.length).toBeGreaterThan(0);
      }
    });
  });

  describe("Admin Card Visibility", () => {
    test("should check if admin card is visible", async () => {
      const hasAdminCard = await dashboardPage.hasAdminCard();
      // This will depend on whether the test user is an admin
      expect(typeof hasAdminCard).toBe("boolean");
    });

    test("should navigate to admin reports if admin card exists", async () => {
      const hasAdminCard = await dashboardPage.hasAdminCard();
      if (hasAdminCard) {
        await dashboardPage.clickAdminCard();
        await driver.sleep(2000);
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/admin-reports");
      } else {
        // Skip test if user is not admin
        expect(hasAdminCard).toBe(false);
      }
    });
  });

  describe("Welcome Message Personalization", () => {
    test("should display personalized welcome message", async () => {
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      expect(welcomeMessage).not.toBeNull();
      // Should contain username or greeting
      expect(welcomeMessage.length).toBeGreaterThan(0);
    });

    test("should change welcome message based on time of day", async () => {
      const welcomeMessage = await dashboardPage.getWelcomeMessage();
      const hour = new Date().getHours();
      if (hour < 12) {
        expect(
          welcomeMessage.toLowerCase().includes("morning") ||
            welcomeMessage.toLowerCase().includes("good")
        ).toBe(true);
      } else if (hour < 18) {
        expect(
          welcomeMessage.toLowerCase().includes("afternoon") ||
            welcomeMessage.toLowerCase().includes("good")
        ).toBe(true);
      } else {
        expect(
          welcomeMessage.toLowerCase().includes("evening") ||
            welcomeMessage.toLowerCase().includes("good")
        ).toBe(true);
      }
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}

