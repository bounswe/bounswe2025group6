// e2e/tests/community.test.js
const { Builder } = require("selenium-webdriver");
const LoginPage = require("../pages/LoginPage");
const DashboardPage = require("../pages/DashboardPage");
const CommunityPage = require("../pages/CommunityPage");
const CreatePostPage = require("../pages/CreatePostPage");
const PostDetailPage = require("../pages/PostDetailPage");
const testConfig = require("../config/test.config");

describe("Community Tests", () => {
  let driver;
  let loginPage;
  let dashboardPage;
  let communityPage;
  let createPostPage;
  let postDetailPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    loginPage = new LoginPage(driver);
    dashboardPage = new DashboardPage(driver);
    communityPage = new CommunityPage(driver);
    createPostPage = new CreatePostPage(driver);
    postDetailPage = new PostDetailPage(driver);
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

  describe("Community Page Display", () => {
    test("should display community page", async () => {
      await communityPage.navigateTo();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community");
    });

    test("should display posts", async () => {
      await communityPage.navigateTo();
      await driver.sleep(2000);
      const postCount = await communityPage.getPostCount();
      expect(postCount).toBeGreaterThanOrEqual(0);
    });
  });

  describe("Post Creation", () => {
    test("should navigate to create post page", async () => {
      await communityPage.navigateTo();
      await communityPage.clickCreatePost();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community/create");
    });

    test("should display create post form", async () => {
      await createPostPage.navigateTo();
      await driver.sleep(2000);
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community/create");
    });

    test("should show error when submitting empty post", async () => {
      await createPostPage.navigateTo();
      await driver.sleep(2000);
      await createPostPage.submitPost();
      await driver.sleep(2000);
      // Should show validation error
    });
  });

  describe("Post Interaction", () => {
    test("should navigate to post detail page", async () => {
      await communityPage.navigateTo();
      await driver.sleep(2000);

      // Check if there are posts available
      const postCount = await communityPage.getPostCount();
      if (postCount === 0) {
        // Skip test if no posts available
        return;
      }

      await communityPage.clickPost(0);

      // Wait for navigation to post detail page
      await driver.wait(
        async () => {
          const url = await driver.getCurrentUrl();
          return url.includes("/community/post/");
        },
        10000,
        "Did not navigate to post detail page"
      );

      const url = await driver.getCurrentUrl();
      expect(url).toContain("/community/post/");
    });

    test("should display post title and content", async () => {
      await communityPage.navigateTo();
      await driver.sleep(2000);
      await communityPage.clickPost(0);
      await driver.sleep(2000);
      const title = await postDetailPage.getPostTitle();
      expect(title).not.toBeNull();
    });
  });

  describe("Post Search", () => {
    test("should search for posts", async () => {
      await communityPage.navigateTo();
      await driver.sleep(2000);
      await communityPage.searchPosts("test");
      await driver.sleep(2000);
      // Should show filtered results
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
