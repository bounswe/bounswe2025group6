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
  errorMessage = By.css('.error-message, [role="alert"]');
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
  }

  async getErrorMessage() {
    try {
      const error = await waitForElement(this.driver, this.errorMessage, 5000);
      return await error.getText();
    } catch (e) {
      return null;
    }
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
    } catch (e) {
      return false;
    }
  }
}

module.exports = LoginPage;
