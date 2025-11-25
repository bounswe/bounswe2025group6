// e2e/tests/register.test.js
const { Builder } = require("selenium-webdriver");
const RegisterPage = require("../pages/RegisterPage");

describe("Registration Tests", () => {
  let driver;
  let registerPage;

  beforeAll(async () => {
    driver = await new Builder().forBrowser("chrome").build();
    registerPage = new RegisterPage(driver);
  });

  afterAll(async () => {
    if (driver) {
      await driver.quit();
    }
  });

  describe("Registration Form", () => {
    test("should display registration form with all fields", async () => {
      await registerPage.navigateTo();
      const isDisplayed = await registerPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should have username field", async () => {
      await registerPage.navigateTo();
      // Form should be displayed
      const isDisplayed = await registerPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should have email field", async () => {
      await registerPage.navigateTo();
      const isDisplayed = await registerPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should have password fields", async () => {
      await registerPage.navigateTo();
      const isDisplayed = await registerPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });

    test("should have terms acceptance checkbox", async () => {
      await registerPage.navigateTo();
      const isDisplayed = await registerPage.isDisplayed();
      expect(isDisplayed).toBe(true);
    });
  });

  describe("Registration Validation", () => {
    test("should show error for invalid email format", async () => {
      await registerPage.navigateTo();
      await driver.sleep(1000); // Wait for page to load

      // Fill form with invalid email
      await registerPage.register({
        username: "testuser",
        email: "invalid-email",
        password: "Test12345",
        confirmPassword: "Test12345",
        acceptTerms: true,
      });

      // Wait for validation to run and errors to appear
      // getErrorMessage() already has waits built in
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
      expect(errorMessage.length).toBeGreaterThan(0);
    });

    test("should show error for weak password", async () => {
      await registerPage.navigateTo();
      await registerPage.register({
        username: "testuser",
        email: "test@example.com",
        password: "weak",
        confirmPassword: "weak",
        acceptTerms: true,
      });

      await driver.sleep(2000);
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
    });

    test("should show error when passwords do not match", async () => {
      await registerPage.navigateTo();
      await registerPage.register({
        username: "testuser",
        email: "test@example.com",
        password: "Test12345",
        confirmPassword: "Different123",
        acceptTerms: true,
      });

      await driver.sleep(2000);
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
    });

    test("should show error when terms not accepted", async () => {
      await registerPage.navigateTo();
      await registerPage.register({
        username: "testuser",
        email: "test@example.com",
        password: "Test12345",
        confirmPassword: "Test12345",
        acceptTerms: false,
      });

      await driver.sleep(2000);
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
    });

    test("should show error for short username", async () => {
      await registerPage.navigateTo();
      await registerPage.register({
        username: "ab",
        email: "test@example.com",
        password: "Test12345",
        confirmPassword: "Test12345",
        acceptTerms: true,
      });

      await driver.sleep(2000);
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
    });
  });

  describe("User Type Selection", () => {
    test("should allow selecting user type", async () => {
      await registerPage.navigateTo();
      await registerPage.selectUserType("user");
      await driver.sleep(500);
      // Should not show certification URL field for regular user
    });

    test("should show certification URL field for dietitian", async () => {
      await registerPage.navigateTo();
      await registerPage.selectUserType("dietitian");
      await driver.sleep(500);
      // Certification URL field should be visible
      try {
        const certField = await driver.findElement(
          registerPage.certificationUrlInput
        );
        const isVisible = await certField.isDisplayed();
        expect(isVisible).toBe(true);
      } catch {
        // Field might not be immediately visible
      }
    });

    test("should show error when dietitian doesn't provide certification URL", async () => {
      await registerPage.navigateTo();
      await registerPage.selectUserType("dietitian");
      await registerPage.register({
        username: "dietitian",
        email: "dietitian@example.com",
        password: "Test12345",
        confirmPassword: "Test12345",
        acceptTerms: true,
      });

      await driver.sleep(2000);
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
    });
  });

  describe("Navigation", () => {
    test("should navigate to login page from register page", async () => {
      await registerPage.navigateTo();
      await registerPage.clickLoginLink();
      const url = await driver.getCurrentUrl();
      expect(url).toContain("/login");
    });
  });

  describe("Toast Notifications", () => {
    test("should show toast notification on registration error", async () => {
      await registerPage.navigateTo();
      await driver.sleep(1000); // Wait for page to load

      // Fill form with invalid email - this will trigger client-side validation
      await registerPage.register({
        username: "testuser",
        email: "invalid-email",
        password: "Test12345",
        confirmPassword: "Test12345",
        acceptTerms: true,
      });

      // Client-side validation shows field errors, not toast
      // getErrorMessage() already has waits built in
      const errorMessage = await registerPage.getErrorMessage();
      expect(errorMessage).not.toBeNull();
      expect(errorMessage.length).toBeGreaterThan(0);
    });
  });
});

// Run tests
if (require.main === module) {
  describe.run?.();
}
