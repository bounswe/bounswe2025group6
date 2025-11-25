// e2e/pages/ProfilePage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class ProfilePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual ProfilePage component
  profileContainer = By.css(".modern-profile-page");
  userName = By.css(".profile-username-text");
  userEmail = By.css(".profile-email");
  // Note: There is no edit profile button - editing is only available in settings tab for preferences
  profileTabs = By.css(".profile-tab");
  recipesTab = By.xpath(
    '//button[contains(@class, "profile-tab") and contains(text(), "Recipes")]'
  );
  bookmarksTab = By.xpath(
    '//button[contains(@class, "profile-tab") and contains(text(), "Bookmarks")]'
  );
  settingsTab = By.xpath(
    '//button[contains(@class, "profile-tab") and contains(text(), "Preferences")]'
  );
  profileStats = By.css(".profile-stats");
  followersCount = By.css(".stat-item .stat-count");
  navigateToOtherUser = (userId) => `${this.baseUrl}/profile/${userId}`;

  // Settings tab locators
  settingsContainer = By.css(".settings-container");
  currencySelect = By.css('select[class*="settings-input"]');
  dateFormatSelect = By.css('select[class*="settings-input"]');
  saveSettingsButton = By.css(".settings-save-btn");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/profile`);
  }

  async isProfileDisplayed() {
    try {
      // Wait for profile page to load
      await this.driver.wait(
        async () => {
          const url = await this.driver.getCurrentUrl();
          return url.includes("/profile");
        },
        10000,
        "Profile page URL not reached"
      );

      const profile = await waitForElement(
        this.driver,
        this.profileContainer,
        10000
      );
      return await profile.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async getUserName() {
    try {
      const name = await waitForElement(this.driver, this.userName, 10000);
      return await name.getText();
    } catch (e) {
      return null;
    }
  }

  async getUserEmail() {
    try {
      const email = await waitForElement(this.driver, this.userEmail, 10000);
      return await email.getText();
    } catch (e) {
      return null;
    }
  }

  async getBookmarkedRecipesCount() {
    try {
      // Switch to bookmarks tab first
      await this.clickTab("bookmarks");
      await this.driver.sleep(1000);

      // Count recipe cards in the recipes-grid
      const recipes = await this.driver.findElements(
        By.css('.recipes-grid .recipe-card, .recipes-grid [class*="recipe"]')
      );
      return recipes.length;
    } catch (e) {
      return 0;
    }
  }

  async getMyRecipesCount() {
    try {
      // Switch to recipes tab first
      await this.clickTab("recipes");
      await this.driver.sleep(1000);

      // Count recipe cards in the recipes-grid
      const recipes = await this.driver.findElements(
        By.css('.recipes-grid .recipe-card, .recipes-grid [class*="recipe"]')
      );
      return recipes.length;
    } catch (e) {
      return 0;
    }
  }

  async clickTab(tabName) {
    const tabMap = {
      recipes: this.recipesTab,
      bookmarks: this.bookmarksTab,
      settings: this.settingsTab,
    };

    try {
      const tab = await waitForElement(this.driver, tabMap[tabName], 10000);
      await tab.click();
      await this.driver.sleep(1000); // Wait for tab content to load
    } catch (e) {
      // Tab might not be available
      throw e;
    }
  }

  async navigateToOtherUserProfile(userId) {
    await this.driver.get(this.navigateToOtherUser(userId));
  }

  async getFollowersCount() {
    try {
      const stats = await waitForElement(this.driver, this.profileStats);
      const counts = await stats.findElements(this.followersCount);
      if (counts.length > 0) {
        return parseInt(await counts[0].getText());
      }
      return 0;
    } catch {
      return 0;
    }
  }
}

module.exports = ProfilePage;
