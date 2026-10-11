describe("Ahrefs Web Analytics config", () => {
  const original = process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY;
  afterEach(() => {
    if (original === undefined) delete process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY;
    else process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY = original;
    jest.resetModules();
  });

  async function load() {
    return import("./analytics");
  }

  it("uses the site's own key by default", async () => {
    delete process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY;
    const analytics = await load();
    expect(analytics.AHREFS_ANALYTICS_SRC).toBe("https://analytics.ahrefs.com/analytics.js");
    expect(analytics.AHREFS_ANALYTICS_KEY).toBe("bbGTEVcNqkuomWTkVPr0ag");
    expect(analytics.isAhrefsAnalyticsConfigured()).toBe(true);
  });

  it("can be switched off with an empty key, for preview builds", async () => {
    process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY = "";
    const analytics = await load();
    expect(analytics.isAhrefsAnalyticsConfigured()).toBe(false);
  });

  it("takes another key from the environment", async () => {
    process.env.NEXT_PUBLIC_AHREFS_ANALYTICS_KEY = " otherKey ";
    const analytics = await load();
    expect(analytics.AHREFS_ANALYTICS_KEY).toBe("otherKey");
  });
});
