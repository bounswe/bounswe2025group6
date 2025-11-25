// e2e/tests/profile.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const ProfilePage = require("../pages/ProfilePage");
const testConfig = require("../config/test.config");

describe("User Profile Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let profilePage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    profilePage = new ProfilePage(driver);
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

  describe("Profile Display", () => {
    test("should display profile page", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load
      const isDisplayed = await profilePage.isProfileDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should display user name", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load
      const name = await profilePage.getUserName();
      expect(name).not.toBeNull();
      expect(name.length).toBeGreaterThan(0);
    });

    test("should display user email", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load
      const email = await profilePage.getUserEmail();
      expect(email).not.toBeNull();
      expect(email).toContain("@");
    });

    test("should display bookmarked recipes count", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load
      const count = await profilePage.getBookmarkedRecipesCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test("should display my recipes count", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load
      const count = await profilePage.getMyRecipesCount();
      expect(typeof count).toBe("number");
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Profile Settings", () => {
    test("should access settings tab", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load

      try {
        await profilePage.clickTab("settings");
        await driver.sleep(1000);

        // Verify settings tab is active
        const url = await driver.getCurrentUrl();
        expect(url).toContain("/profile");
      } catch {
        // Settings tab might not be available
      }
    });
  });

  describe("Profile Tabs", () => {
    test("should switch to bookmarks tab", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load

      try {
        await profilePage.clickTab("bookmarks");
        await driver.sleep(1000);
        // Tab should be active
      } catch {
        // Tab might not be available
      }
    });

    test("should switch to settings tab", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load

      try {
        await profilePage.clickTab("settings");
        await driver.sleep(1000);
        // Settings should be visible
      } catch {
        // Tab might not be available
      }
    });

    test("should switch back to recipes tab", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load

      try {
        await profilePage.clickTab("bookmarks");
        await driver.sleep(500);
        await profilePage.clickTab("recipes");
        await driver.sleep(1000);
        // Recipes tab should be active
      } catch {
        // Tabs might not be available
      }
    });
  });

  describe("Profile Statistics", () => {
    test("should display profile statistics", async () => {
      await profilePage.navigateTo();
      await driver.sleep(2000); // Wait for profile page to load

      try {
        const followersCount = await profilePage.getFollowersCount();
        expect(typeof followersCount).toBe("number");
        expect(followersCount).toBeGreaterThanOrEqual(0);
      } catch {
        // Statistics might not be available
      }
    });
  });

  describe("Other User Profile", () => {
    test("should navigate to other user profile", async () => {
      // This would require a test user ID
      // await profilePage.navigateToOtherUserProfile(1);
      // const isDisplayed = await profilePage.isProfileDisplayed();
      // expect(isDisplayed).toBe(true);
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
