// e2e/pages/RegisterPage.js
const { By } = require("selenium-webdriver");
const { waitForElement, waitForElementVisible } = require("../helpers/waits");

class RegisterPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  usernameInput = By.css('input[name="username"]');
  emailInput = By.css('input[name="email"]');
  passwordInput = By.css('input[name="password"]');
  confirmPasswordInput = By.css('input[name="confirmPassword"]');
  userTypeButton = By.css(".account-type-button");
  userTypeUser = By.xpath(
    '//button[contains(@class, "account-type-button") and contains(text(), "User")]'
  );
  userTypeDietitian = By.xpath(
    '//button[contains(@class, "account-type-button") and contains(text(), "Dietitian")]'
  );
  certificationUrlInput = By.css('input[name="certificationUrl"]');
  acceptTermsCheckbox = By.css('input[name="acceptTerms"]');
  termsLink = By.css(".terms-link");
  submitButton = By.css('button[type="submit"]');
  errorMessage = By.css(".text-error");
  inputError = By.css(".input-error");
  toastError = By.css(".toast-container.toast-error.show .toast-message");
  toastSuccess = By.css(".toast-container.toast-success.show .toast-message");
  successContainer = By.css(".success-container");
  loginLink = By.linkText("Login");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/register`);
  }

  async enterUsername(username) {
    const element = await waitForElement(this.driver, this.usernameInput);
    await element.clear();
    await element.sendKeys(username);
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

  async enterConfirmPassword(password) {
    const element = await waitForElement(
      this.driver,
      this.confirmPasswordInput
    );
    await element.clear();
    await element.sendKeys(password);
  }

  async selectUserType(type) {
    if (type === "dietitian") {
      const button = await waitForElement(this.driver, this.userTypeDietitian);
      await button.click();
    } else {
      const button = await waitForElement(this.driver, this.userTypeUser);
      await button.click();
    }
    await this.driver.sleep(300);
  }

  async enterCertificationUrl(url) {
    const element = await waitForElement(
      this.driver,
      this.certificationUrlInput
    );
    await element.clear();
    await element.sendKeys(url);
  }

  async acceptTerms() {
    const checkbox = await waitForElement(
      this.driver,
      this.acceptTermsCheckbox
    );
    const isChecked = await checkbox.isSelected();
    if (!isChecked) {
      await checkbox.click();
    }
  }

  async clickSubmit() {
    const button = await waitForElement(this.driver, this.submitButton);
    // Scroll into view to ensure button is clickable
    await this.driver.executeScript(
      "arguments[0].scrollIntoView(true);",
      button
    );
    await this.driver.sleep(300);
    await button.click();
    // Wait for validation to run and React to re-render with errors (if any)
    // Validation is synchronous but React needs time to update the DOM
    await this.driver.sleep(2500);
  }

  async register(userData) {
    if (userData.userType) {
      await this.selectUserType(userData.userType);
    }
    if (userData.username) {
      await this.enterUsername(userData.username);
    }
    if (userData.email) {
      await this.enterEmail(userData.email);
    }
    if (userData.password) {
      await this.enterPassword(userData.password);
    }
    if (userData.confirmPassword) {
      await this.enterConfirmPassword(userData.confirmPassword);
    }
    if (userData.certificationUrl) {
      await this.enterCertificationUrl(userData.certificationUrl);
    }
    if (userData.acceptTerms !== false) {
      await this.acceptTerms();
    }
    await this.clickSubmit();
  }

  async getErrorMessage() {
    // First check for field-specific validation errors (client-side validation)
    // These appear after form submission when validation fails
    // Verify we're still on the register page (validation prevented submission)
    const currentUrl = await this.driver.getCurrentUrl();
    if (!currentUrl.includes("/register")) {
      // Form might have submitted successfully, no errors
      return null;
    }

    // Wait for React to re-render with validation errors
    // Check for both input-error class (on inputs) and text-error (error messages)
    await this.driver.sleep(1000);

    try {
      // Try multiple times to find error messages (React might need multiple render cycles)
      for (let attempt = 0; attempt < 5; attempt++) {
        const errorElements = await this.driver.findElements(this.errorMessage);

        if (errorElements.length > 0) {
          // Check each error element for visibility and text
          for (const error of errorElements) {
            try {
              const isVisible = await error.isDisplayed();
              if (isVisible) {
                const text = await error.getText();
                if (text && text.trim() && text.trim().length > 0) {
                  return text.trim();
                }
              }
            } catch {
              continue;
            }
          }
        }

        // Also check for input-error class as a fallback
        const errorInputs = await this.driver.findElements(this.inputError);
        if (errorInputs.length > 0 && attempt === 4) {
          // On last attempt, if we have input errors, return a message
          return "Validation error detected (input has error class)";
        }

        // Wait a bit before next attempt
        if (attempt < 4) {
          await this.driver.sleep(500);
        }
      }
    } catch {
      // Field errors not found, continue to check toast
    }

    // Check for toast error messages (server-side errors)
    try {
      await this.driver.wait(
        async () => {
          try {
            const containers = await this.driver.findElements(
              By.css(".toast-container.toast-error")
            );
            for (const container of containers) {
              try {
                const classes = await container.getAttribute("class");
                if (classes && classes.includes("show")) {
                  const isVisible = await container.isDisplayed();
                  if (isVisible) {
                    return true;
                  }
                }
              } catch {
                continue;
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
      // Toast not found
    }

    return null;
  }

  async getSuccessMessage() {
    try {
      await waitForElement(this.driver, this.successContainer, 10000);
      const successTitle = await this.driver.findElement(
        By.css(".success-title")
      );
      return await successTitle.getText();
    } catch {
      return null;
    }
  }

  async isDisplayed() {
    try {
      const element = await waitForElement(
        this.driver,
        this.submitButton,
        5000
      );
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async clickLoginLink() {
    const link = await waitForElement(this.driver, this.loginLink);
    await link.click();
  }
}

module.exports = RegisterPage;
