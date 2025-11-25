// e2e/pages/CommunityPage.js
const { By } = require("selenium-webdriver");
const { waitForElement } = require("../helpers/waits");

class CommunityPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual CommunityPage component
  postCard = By.css(".forum-post-card, .forum-post-card .card-body");
  createPostButton = By.css(".forum-create-button, button.forum-create-button");
  searchInput = By.css('.forum-input, input[placeholder*="Search"]');
  upvoteButton = By.css('button[aria-label="Upvote"], .vote-button');
  downvoteButton = By.css('button[aria-label="Downvote"], .vote-button');
  postTitle = By.css(".forum-post h2, h2");
  postContent = By.css(".forum-post p, .forum-post-content p");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/community`);
  }

  async getPostCount() {
    try {
      await this.driver.sleep(2000);
      // Wait for posts to load
      await waitForElement(
        this.driver,
        By.css(".forum-posts, .forum-post-card"),
        10000
      );
      const posts = await this.driver.findElements(By.css(".forum-post-card"));
      return posts.length;
    } catch {
      return 0;
    }
  }

  async clickPost(index = 0) {
    try {
      await this.driver.sleep(2000);
      // Wait for posts to load
      await waitForElement(
        this.driver,
        By.css(".forum-posts, .forum-post-card"),
        10000
      );
      const posts = await this.driver.findElements(By.css(".forum-post-card"));
      if (posts.length > index) {
        // Scroll into view to ensure the post is clickable
        await this.driver.executeScript(
          "arguments[0].scrollIntoView(true);",
          posts[index]
        );
        await this.driver.sleep(500);
        await posts[index].click();
        await this.driver.sleep(2000); // Wait for navigation
      } else {
        throw new Error(
          `Post at index ${index} not found. Only ${posts.length} posts available.`
        );
      }
    } catch (error) {
      throw error;
    }
  }

  async clickCreatePost() {
    try {
      const button = await waitForElement(
        this.driver,
        this.createPostButton,
        10000
      );
      await button.click();
      await this.driver.sleep(2000); // Wait for navigation
    } catch (error) {
      throw new Error(`Create post button not found: ${error.message}`);
    }
  }

  async searchPosts(query) {
    const input = await waitForElement(this.driver, this.searchInput);
    await input.clear();
    await input.sendKeys(query);
    await this.driver.sleep(1000);
  }
}

module.exports = CommunityPage;
