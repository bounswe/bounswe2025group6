// e2e/pages/CreatePostPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class CreatePostPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual CreatePostPage component
  titleInput = By.css('input[name="title"], input[placeholder*="title"]');
  contentTextarea = By.css(
    'textarea[name="content"], textarea[placeholder*="content"]'
  );
  submitButton = By.css('button[type="submit"]');
  tagButton = By.css(".tag-button, button.tag-button");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/community/create`);
  }

  async enterTitle(title) {
    const input = await waitForElement(this.driver, this.titleInput);
    await input.clear();
    await input.sendKeys(title);
  }

  async enterContent(content) {
    const textarea = await waitForElement(this.driver, this.contentTextarea);
    await textarea.clear();
    await textarea.sendKeys(content);
  }

  async clickTag(tagName) {
    try {
      const tag = await this.driver.findElement(
        By.xpath(`//button[contains(text(), "${tagName}")]`)
      );
      await tag.click();
      await this.driver.sleep(300);
    } catch {
      // Tag not found
    }
  }

  async submitPost() {
    const button = await waitForElement(this.driver, this.submitButton);
    await button.click();
    await this.driver.sleep(2000);
  }
}

module.exports = CreatePostPage;
