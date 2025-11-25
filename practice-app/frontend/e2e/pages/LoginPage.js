// e2e/pages/LoginPage.js
const { By } = require("selenium-webdriver");
const { waitForElement, waitForElementVisible } = require("../helpers/waits");

class LoginPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  emailInput = By.css('input[type="email"]');
  passwordInput = By.css('input[type="password"]');
  loginButton = By.css('button[type="submit"]');
  errorMessage = By.css(".text-error");
  toastError = By.css(".toast-container.toast-error.show .toast-message");
  toastErrorContainer = By.css(".toast-container.toast-error.show");
  forgotPasswordLink = By.linkText("Forgot Password");
  registerLink = By.linkText("Register");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/login`);
  }

  async enterEmail(email) {
    const element = await waitForElement(this.driver, this.emailInput);
    await element.clear();
    await element.sendKeys(email);
  }

  async enterPassword(password) {
    const element = await waitForElement(this.driver, this.passwordInput);
    await element.clear();
    await element.sendKeys(password);
  }

  async clickLogin() {
    const button = await waitForElement(this.driver, this.loginButton);
    await button.click();
  }

  async login(email, password) {
    await this.enterEmail(email);
    await this.enterPassword(password);
    await this.clickLogin();
    // Wait a bit for the form submission to process
    await this.driver.sleep(500);
  }

  async getErrorMessage() {
    // First, check for toast error messages (primary method for login errors)
    // Toast appears asynchronously, so we wait for it to be visible
    try {
      // Wait for toast error container with 'show' class to appear
      // The toast might take a moment to render and get the 'show' class
      await this.driver.wait(
        async () => {
          try {
            const containers = await this.driver.findElements(
              By.css(".toast-container.toast-error")
            );
            for (const container of containers) {
              const classes = await container.getAttribute("class");
              if (classes && classes.includes("show")) {
                return true;
              }
            }
            return false;
          } catch {
            return false;
          }
        },
        10000,
        "Toast error message not found"
      );

      // Now get the actual message text from the toast
      const toastMessage = await waitForElement(
        this.driver,
        this.toastError,
        5000
      );
      await waitForElementVisible(this.driver, toastMessage, 2000);
      const text = await toastMessage.getText();
      if (text && text.trim()) {
        return text.trim();
      }
    } catch {
      // Toast not found, continue to check field errors
    }

    // Fallback: Check for field-specific error messages (.text-error)
    try {
      const error = await waitForElement(this.driver, this.errorMessage, 5000);
      const text = await error.getText();
      if (text && text.trim()) {
        return text.trim();
      }
    } catch {
      // No error message found
    }

    return null;
  }

  async clickForgotPassword() {
    const link = await waitForElement(this.driver, this.forgotPasswordLink);
    await link.click();
  }

  async clickRegister() {
    const link = await waitForElement(this.driver, this.registerLink);
    await link.click();
  }

  async isDisplayed() {
    try {
      const element = await waitForElement(this.driver, this.loginButton, 5000);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async logout() {
    try {
      // Logout button is in the MainLayout header
      const logoutButton = await waitForElement(
        this.driver,
        By.css(".layout-logout, button.green-button"),
        10000
      );
      await logoutButton.click();
      // Wait for navigation to login page
      await this.driver.wait(
        async () => {
          const url = await this.driver.getCurrentUrl();
          return url.includes("/login");
        },
        10000,
        "Did not navigate to login page after logout"
      );
    } catch (error) {
      console.error("Logout failed:", error);
      throw error;
    }
  }
}

module.exports = LoginPage;
