// e2e/pages/HomePage.js
const { By } = require("selenium-webdriver");
const { waitForElement, waitForElementVisible } = require("../helpers/waits");

class HomePage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators
  heroTitle = By.css(".hero-title");
  heroSubtitle = By.css(".hero-subtitle");
  langDropdown = By.css(".lang-dropdown");
  loginButton = By.css(".hero-buttons .btn-secondary, a[href='/login']");
  registerButton = By.css(".hero-buttons .btn-primary, a[href='/register']");
  dashboardButton = By.css(".hero-buttons .btn-primary, a[href='/dashboard']");
  featuresSection = By.css(".features");
  featureCards = By.css(".feature-card");
  howItWorksSection = By.css(".how-it-works");
  steps = By.css(".step");
  ctaSection = By.css(".cta");
  ctaButton = By.css(".cta .btn-primary");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/`);
  }

  async getHeroTitle() {
    try {
      const element = await waitForElement(this.driver, this.heroTitle, 10000);
      return await element.getText();
    } catch {
      return null;
    }
  }

  async getHeroSubtitle() {
    try {
      const element = await waitForElement(
        this.driver,
        this.heroSubtitle,
        10000
      );
      return await element.getText();
    } catch {
      return null;
    }
  }

  async changeLanguage(lang) {
    const dropdown = await waitForElement(this.driver, this.langDropdown);
    await dropdown.click();
    const option = await this.driver.findElement(
      By.css(`option[value="${lang}"]`)
    );
    await option.click();
    await this.driver.sleep(500);
  }

  async clickLogin() {
    const button = await waitForElement(this.driver, this.loginButton, 10000);
    await waitForElementVisible(this.driver, button, 5000);
    await button.click();
    await this.driver.sleep(1000);
  }

  async clickRegister() {
    const button = await waitForElement(this.driver, this.registerButton, 10000);
    await waitForElementVisible(this.driver, button, 5000);
    await button.click();
    await this.driver.sleep(1000);
  }

  async clickDashboard() {
    const button = await waitForElement(this.driver, this.dashboardButton, 10000);
    await waitForElementVisible(this.driver, button, 5000);
    await button.click();
    await this.driver.sleep(1000);
  }

  async getFeatureCardCount() {
    try {
      await waitForElement(this.driver, this.featuresSection, 10000);
      const cards = await this.driver.findElements(this.featureCards);
      return cards.length;
    } catch {
      return 0;
    }
  }

  async getStepCount() {
    try {
      await waitForElement(this.driver, this.howItWorksSection, 10000);
      const steps = await this.driver.findElements(this.steps);
      return steps.length;
    } catch {
      return 0;
    }
  }

  async clickCtaButton() {
    const button = await waitForElement(this.driver, this.ctaButton);
    await button.click();
  }

  async isDisplayed() {
    try {
      const element = await waitForElement(this.driver, this.heroTitle, 5000);
      return await element.isDisplayed();
    } catch {
      return false;
    }
  }

  async isLoggedIn() {
    try {
      // Wait for hero buttons section to load
      await waitForElement(this.driver, By.css(".hero-buttons"), 10000);
      await this.driver.sleep(1000); // Wait for React to render based on auth state
      
      // Check if dashboard button exists and is visible (logged in)
      const dashboardButtons = await this.driver.findElements(
        By.css(".hero-buttons a[href='/dashboard']")
      );
      
      if (dashboardButtons.length > 0) {
        const isVisible = await dashboardButtons[0].isDisplayed();
        if (isVisible) {
          return true;
        }
      }
      
      // Check if login/register buttons exist (logged out)
      const loginButtons = await this.driver.findElements(
        By.css(".hero-buttons a[href='/login']")
      );
      const registerButtons = await this.driver.findElements(
        By.css(".hero-buttons a[href='/register']")
      );
      
      if (loginButtons.length > 0 || registerButtons.length > 0) {
        return false;
      }
      
      // If neither found, assume not logged in
      return false;
    } catch {
      return false;
    }
  }
}

module.exports = HomePage;

