export default class ApiEndpoints {
  static _endpoints = null;

  static _generateEndpoints() {
    const { VITE_API_HOST, VITE_API_PORT, VITE_API_BASE } = import.meta.env;

    const adjustedHost = `${VITE_API_HOST}${
      VITE_API_PORT ? `:${VITE_API_PORT}` : ""
    }`;
    const baseUrl = new URL(VITE_API_BASE, adjustedHost);

    if (!baseUrl) {
      throw new Error("Unable to generate API endpoints.");
    }

    return {
      subscriptions: `${baseUrl.href}/subscriptions`,
      categories: `${baseUrl.href}/categories`,
      usages: `${baseUrl.href}/usages`,
      subscriptionUsage: `${baseUrl.href}/subscriptionUsage`,
      dashboard: `${baseUrl.href}/dashboard`,
      search: `${baseUrl.href}/search`,
      ocr: `${baseUrl.href}/ocr`,
      notifications: `${baseUrl}/notifications`,
    };
  }

  static get endpoints() {
    if (!this._endpoints) {
      this._endpoints = this._generateEndpoints();
    }

    return this._endpoints;
  }

  // ---- API endpoints ----
  static get subscriptions() {
    return this.endpoints.subscriptions;
  }

  static get categories() {
    return this.endpoints.categories;
  }

  static get usedCategories() {
    return `${this.endpoints.categories}/used`;
  }

  static get usages() {
    return this.endpoints.usages;
  }

  static get subscriptionUsage() {
    return this.endpoints.subscriptionUsage;
  }

  static get dashboard() {
    return this.endpoints.dashboard;
  }

  static get mostUsedSubscription() {
    return `${this.dashboard}/mostUsed`;
  }

  static get potentialMonthlySavings() {
    return `${this.dashboard}/savings`;
  }

  static get totalMonthlyCost() {
    return `${this.dashboard}/totalCost`;
  }

  static get search() {
    return this.endpoints.search;
  }

  static get notifications() {
    return this.endpoints.notifications;
  }

  static get ocr() {
    return this.endpoints.ocr;
  }

  // ---- API endpoints with params ----
  static subscription(id) {
    return `${this.subscriptions}/${id}`;
  }

  static category(id) {
    return `${this.categories}/${id}`;
  }

  static usageById(id) {
    return `${this.usages}/${id}`;
  }

  static subscriptionUsageById(id) {
    return `${this.subscriptionUsage}/${id}`;
  }

  static searchQuery(query) {
    return `${this.search}?query=${query}`;
  }

  static notificationById(id) {
    return `${this.notifications}/${id}`;
  }
}
