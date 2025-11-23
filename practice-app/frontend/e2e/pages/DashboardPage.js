// e2e/pages/DashboardPage.js
const { By, until } = require("selenium-webdriver");
const { waitForElement, waitForElementVisible } = require("../helpers/waits");

class DashboardPage {
  constructor(driver) {
    this.driver = driver;
    this.baseUrl = "http://localhost:5173";
  }

  // Locators - Updated to match actual DashboardPage component
  dashboardContainer = By.css(".dashboard-container");
  dashboardHeader = By.css(".dashboard-header");
  dashboardTitle = By.css(".dashboard-title");
  dashboardSubtitle = By.css(".dashboard-subtitle");
  dashboardCardsContainer = By.css(".dashboard-cards");
  dashboardCard = By.css(".dashboard-card");
  dashboardCardTitle = By.css(".dashboard-card-title");
  dashboardCardIcon = By.css(".dashboard-card-icon");
  greenButton = By.css(".green-button");

  // Actions
  async navigateTo() {
    await this.driver.get(`${this.baseUrl}/dashboard`);
  }

  async isDashboardDisplayed() {
    try {
      // Wait for URL to change to dashboard
      await this.driver.wait(
        until.urlContains('/dashboard'),
        15000,
        'Dashboard URL not reached'
      );
      
      // Wait for dashboard container to be visible
      const dashboard = await waitForElement(
        this.driver,
        this.dashboardContainer,
        15000
      );
      await waitForElementVisible(this.driver, dashboard, 10000);
      return await dashboard.isDisplayed();
    } catch {
      return false;
    }
  }

  async getWelcomeMessage() {
    try {
      // Wait for dashboard to be displayed first
      await this.isDashboardDisplayed();
      
      const title = await waitForElement(
        this.driver,
        this.dashboardTitle,
        10000
      );
      await waitForElementVisible(this.driver, title, 5000);
      return await title.getText();
    } catch {
      return null;
    }
  }

  async getDashboardSubtitle() {
    try {
      // Wait for dashboard to be displayed first
      await this.isDashboardDisplayed();
      
      const subtitle = await waitForElement(
        this.driver,
        this.dashboardSubtitle,
        10000
      );
      await waitForElementVisible(this.driver, subtitle, 5000);
      return await subtitle.getText();
    } catch {
      return null;
    }
  }

  async getCardCount() {
    try {
      // Wait for cards container to be visible first
      await waitForElement(this.driver, this.dashboardCardsContainer, 15000);
      
      // Wait for at least one card to be visible
      await this.driver.wait(
        async () => {
          const cards = await this.driver.findElements(this.dashboardCard);
          return cards.length > 0;
        },
        15000,
        'No dashboard cards found'
      );
      
      // Additional wait to ensure cards are fully rendered
      await this.driver.sleep(1000);
      
      const cards = await this.driver.findElements(this.dashboardCard);
      return cards.length;
    } catch {
      return 0;
    }
  }

  async getCardTitles() {
    try {
      // Wait for cards container to be visible first
      await waitForElement(this.driver, this.dashboardCardsContainer, 15000);
      
      // Wait for at least one card title to be visible
      await this.driver.wait(
        async () => {
          const titles = await this.driver.findElements(this.dashboardCardTitle);
          return titles.length > 0;
        },
        15000,
        'No dashboard card titles found'
      );
      
      // Additional wait to ensure titles are fully rendered
      await this.driver.sleep(1000);
      
      const cards = await this.driver.findElements(this.dashboardCardTitle);
      const titles = [];
      for (const card of cards) {
        const text = await card.getText();
        if (text && text.trim()) {
          titles.push(text.trim());
        }
      }
      return titles;
    } catch {
      return [];
    }
  }

  async clickCardButton(cardIndex = 0) {
    try {
      const cards = await this.driver.findElements(this.dashboardCard);
      if (cardIndex < cards.length) {
        const buttons = await cards[cardIndex].findElements(this.greenButton);
        if (buttons.length > 0) {
          await buttons[0].click();
        }
      }
    } catch {
      throw new Error(`Unable to click button on card ${cardIndex}`);
    }
  }

  async isLoaded() {
    return await this.isDashboardDisplayed();
  }
}

module.exports = DashboardPage;
