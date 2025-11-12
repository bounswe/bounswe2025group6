// e2e/helpers/waits.js
const { until } = require("selenium-webdriver");

/**
 * Wait for an element to be located on the page
 * @param {WebDriver} driver
 * @param {By} locator
 * @param {number} timeout - milliseconds
 */
async function waitForElement(driver, locator, timeout = 10000) {
  return driver.wait(until.elementLocated(locator), timeout);
}

/**
 * Wait for an element to be visible
 * @param {WebDriver} driver
 * @param {WebElement} element
 * @param {number} timeout - milliseconds
 */
async function waitForElementVisible(driver, element, timeout = 10000) {
  return driver.wait(until.elementIsVisible(element), timeout);
}

/**
 * Wait for an element to be clickable
 * @param {WebDriver} driver
 * @param {WebElement} element
 * @param {number} timeout - milliseconds
 */
async function waitForElementClickable(driver, element, timeout = 10000) {
  return driver.wait(until.elementIsEnabled(element), timeout);
}

/**
 * Wait for URL to change to a specific value
 * @param {WebDriver} driver
 * @param {string} expectedUrl
 * @param {number} timeout - milliseconds
 */
async function waitForUrlChange(driver, expectedUrl, timeout = 10000) {
  return driver.wait(until.urlContains(expectedUrl), timeout);
}

/**
 * Wait for page title to match
 * @param {WebDriver} driver
 * @param {string} title
 * @param {number} timeout - milliseconds
 */
async function waitForPageTitle(driver, title, timeout = 10000) {
  return driver.wait(until.titleIs(title), timeout);
}

/**
 * Sleep for specified milliseconds
 * Use sparingly - prefer explicit waits above
 * @param {number} ms - milliseconds
 */
async function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
  waitForElement,
  waitForElementVisible,
  waitForElementClickable,
  waitForUrlChange,
  waitForPageTitle,
  sleep,
};
