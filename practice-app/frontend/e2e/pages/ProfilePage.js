// e2e/pages/ProfilePage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class ProfilePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  profileContainer = By.css('.profile, [data-testid="profile"]');
  userName = By.css('.user-name, [data-testid="user-name"]');
  userEmail = By.css('.user-email, [data-testid="user-email"]');
  editButton = By.css(
    'button[aria-label="Edit Profile"], [data-testid="edit-btn"]'
  );
  saveButton = By.css('button[aria-label="Save"], [data-testid="save-btn"]');
  cancelButton = By.css(
    'button[aria-label="Cancel"], [data-testid="cancel-btn"]'
  );
  nameInput = By.css('input[name="name"], [data-testid="name-input"]');
  bioInput = By.css('textarea[name="bio"], [data-testid="bio-input"]');
  avatarUpload = By.css('input[type="file"], [data-testid="avatar-upload"]');
  bookmarkedRecipes = By.css(
    '.bookmarked-recipes, [data-testid="bookmarked-recipes"]'
  );
  myRecipes = By.css('.my-recipes, [data-testid="my-recipes"]');

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/profile`);
  }

  async isProfileDisplayed() {
    try {
      const profile = await waitForElement(
        this.driver,
        this.profileContainer,
        5000
      );
      return await profile.isDisplayed();
    } catch (e) {
      return false;
    }
  }

  async getUserName() {
    const name = await waitForElement(this.driver, this.userName);
    return await name.getText();
  }

  async getUserEmail() {
    const email = await waitForElement(this.driver, this.userEmail);
    return await email.getText();
  }

  async clickEditProfile() {
    const button = await waitForElement(this.driver, this.editButton);
    await button.click();
  }

  async updateName(newName) {
    const input = await waitForElement(this.driver, this.nameInput);
    await input.clear();
    await input.sendKeys(newName);
  }

  async updateBio(newBio) {
    const input = await waitForElement(this.driver, this.bioInput);
    await input.clear();
    await input.sendKeys(newBio);
  }

  async clickSave() {
    const button = await waitForElement(this.driver, this.saveButton);
    await button.click();
  }

  async clickCancel() {
    const button = await waitForElement(this.driver, this.cancelButton);
    await button.click();
  }

  async getBookmarkedRecipesCount() {
    try {
      const recipes = await this.driver.findElements(
        By.css('[data-testid="bookmarked-recipe"]')
      );
      return recipes.length;
    } catch (e) {
      return 0;
    }
  }

  async getMyRecipesCount() {
    try {
      const recipes = await this.driver.findElements(
        By.css('[data-testid="my-recipe"]')
      );
      return recipes.length;
    } catch (e) {
      return 0;
    }
  }
}

module.exports = ProfilePage;
