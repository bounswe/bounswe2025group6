// e2e/pages/PostDetailPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class PostDetailPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual PostDetailPage component
  postTitle = By.css("h1, .post-title");
  postContent = By.css(".post-content");
  commentInput = By.css(
    'textarea[placeholder*="comment"], textarea[name="content"]'
  );
  submitCommentButton = By.css('button[type="submit"]');
  upvoteButton = By.css('button[aria-label="Upvote"], .vote-button');
  downvoteButton = By.css('button[aria-label="Downvote"], .vote-button');
  editButton = By.xpath('//button[contains(text(), "Edit")]');
  deleteButton = By.xpath('//button[contains(text(), "Delete")]');

  // Actions
  async navigateTo(postId) {
    await this.driver.get(`${this.baseUrl}/community/post/${postId}`);
  }

  async getPostTitle() {
    try {
      const title = await waitForElement(this.driver, this.postTitle, 10000);
      return await title.getText();
    } catch {
      return null;
    }
  }

  async getPostContent() {
    try {
      const content = await waitForElement(
        this.driver,
        this.postContent,
        10000
      );
      return await content.getText();
    } catch {
      return null;
    }
  }

  async enterComment(comment) {
    const textarea = await waitForElement(this.driver, this.commentInput);
    await textarea.clear();
    await textarea.sendKeys(comment);
  }

  async submitComment() {
    const button = await waitForElement(this.driver, this.submitCommentButton);
    await button.click();
    await this.driver.sleep(1000);
  }

  async clickUpvote() {
    try {
      const button = await waitForElement(this.driver, this.upvoteButton, 5000);
      await button.click();
      await this.driver.sleep(500);
    } catch {
      // Upvote button not found
    }
  }

  async clickDownvote() {
    try {
      const button = await waitForElement(
        this.driver,
        this.downvoteButton,
        5000
      );
      await button.click();
      await this.driver.sleep(500);
    } catch {
      // Downvote button not found
    }
  }
}

module.exports = PostDetailPage;
