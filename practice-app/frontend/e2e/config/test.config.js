// e2e/config/test.config.js
module.exports = {
  // Base URL for the application
  baseUrl: process.env.BASE_URL || "http://localhost:5173",

  // Browser settings
  browser: {
    chrome: {
      name: "chrome",
      args: ["--no-sandbox", "--disable-dev-shm-usage", "--disable-gpu"],
    },
    firefox: {
      name: "firefox",
    },
  },

  // Timeouts (in milliseconds)
  timeouts: {
    elementWait: 10000, // Wait for element to be present
    pageLoad: 15000, // Wait for page to load
    implicit: 5000, // Implicit wait
    action: 3000, // Wait between actions
  },

  // Test data
  testData: {
    validUser: {
      email: "taha.kukul@std.bogazici.edu.tr",
      password: "Deneme12345",
    },
    invalidUser: {
      email: "invalid@example.com",
      password: "wrongpassword",
    },
  },

  // Test reporter settings
  reporter: {
    enabled: true,
    path: "./test-results/",
    formats: ["json", "html"],
  },
};
