// e2e/pages/DashboardPage.js
const { By } = require("selenium-webdriver");
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
      const dashboard = await waitForElement(
        this.driver,
        this.dashboardContainer,
        5000
      );
      return await dashboard.isDisplayed();
    } catch {
      return false;
    }
  }

  async getWelcomeMessage() {
    try {
      const title = await waitForElement(
        this.driver,
        this.dashboardTitle,
        5000
      );
      return await title.getText();
    } catch {
      return null;
    }
  }

  async getDashboardSubtitle() {
    try {
      const subtitle = await waitForElement(
        this.driver,
        this.dashboardSubtitle,
        5000
      );
      return await subtitle.getText();
    } catch {
      return null;
    }
  }

  async getCardCount() {
    try {
      const cards = await this.driver.findElements(this.dashboardCard);
      return cards.length;
    } catch {
      return 0;
    }
  }

  async getCardTitles() {
    try {
      const cards = await this.driver.findElements(this.dashboardCardTitle);
      const titles = [];
      for (const card of cards) {
        titles.push(await card.getText());
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
