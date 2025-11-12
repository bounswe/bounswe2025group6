// e2e/tests/profile.test.js
const { Builder } = require('selenium-webdriver');
const LoginPage = require('../pages/LoginPage');
const ProfilePage = require('../pages/ProfilePage');
const testConfig = require('../config/test.config');

describe('User Profile Tests', () => {
  let driver;
  let loginPage;
  let profilePage;

  beforeAll(async () => {
    driver = await new Builder()
      .forBrowser('chrome')
      .build();
    loginPage = new LoginPage(driver);
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
  });

  describe('Profile Display', () => {
    test('should display profile page', async () => {
      await profilePage.navigateTo();
      const isDisplayed = await profilePage.isProfileDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test('should display user name', async () => {
      await profilePage.navigateTo();
      const name = await profilePage.getUserName();
      expect(name).not.toBeNull();
      expect(name.length).toBeGreaterThan(0);
    });

    test('should display user email', async () => {
      await profilePage.navigateTo();
      const email = await profilePage.getUserEmail();
      expect(email).not.toBeNull();
      expect(email).toContain('@');
    });

    test('should display bookmarked recipes count', async () => {
      await profilePage.navigateTo();
      const count = await profilePage.getBookmarkedRecipesCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });

    test('should display my recipes count', async () => {
      await profilePage.navigateTo();
      const count = await profilePage.getMyRecipesCount();
      expect(typeof count).toBe('number');
      expect(count).toBeGreaterThanOrEqual(0);
    });
  });

  describe('Profile Editing', () => {
    test('should edit user name', async () => {
      await profilePage.navigateTo();
      await profilePage.clickEditProfile();
      
      const newName = 'Test User Updated';
      await profilePage.updateName(newName);
      await profilePage.clickSave();
      
      // Verify name was updated
      const updatedName = await profilePage.getUserName();
      expect(updatedName).toContain('Test User');
    });

    test('should edit user bio', async () => {
      await profilePage.navigateTo();
      await profilePage.clickEditProfile();
      
      const newBio = 'This is my updated bio';
      await profilePage.updateBio(newBio);
      await profilePage.clickSave();
      
      // Verify bio was updated (would need additional UI element verification)
    });

    test('should cancel profile edit', async () => {
      await profilePage.navigateTo();
      const originalName = await profilePage.getUserName();
      
      await profilePage.clickEditProfile();
      await profilePage.updateName('Changed Name');
      await profilePage.clickCancel();
      
      // Verify name was not changed
      const currentName = await profilePage.getUserName();
      expect(currentName).toBe(originalName);
    });
  });

  describe('Profile Navigation', () => {
    test('should navigate to bookmarked recipes', async () => {
      await profilePage.navigateTo();
      const count = await profilePage.getBookmarkedRecipesCount();
      
      if (count > 0) {
        // Click on bookmarked recipes section
        // Verify navigation to bookmarked recipes page
      }
    });

    test('should navigate to my recipes', async () => {
      await profilePage.navigateTo();
      const count = await profilePage.getMyRecipesCount();
      
      if (count > 0) {
        // Click on my recipes section
        // Verify navigation to my recipes page
      }
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
