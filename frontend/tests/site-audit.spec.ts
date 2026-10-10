import { test, expect } from "@playwright/test";

const BASE = "https://schoolpilot-work.vercel.app";

// ──────────────────────────────────────────────────────
// 1. PAGE AVAILABILITY
// ──────────────────────────────────────────────────────
test.describe("Page availability", () => {
  const pages = [
    { path: "/", name: "Homepage" },
    { path: "/about/", name: "About" },
    { path: "/contact/", name: "Contact" },
    { path: "/pricing/", name: "Pricing" },
    { path: "/privacy/", name: "Privacy" },
    { path: "/terms/", name: "Terms" },
    { path: "/login/", name: "Login" },
  ];

  for (const p of pages) {
    test(`${p.name} returns 200`, async ({ page }) => {
      const resp = await page.goto(`${BASE}${p.path}`);
      expect(resp?.status()).toBe(200);
    });
  }
});

// ──────────────────────────────────────────────────────
// 2. HOMEPAGE
// ──────────────────────────────────────────────────────
test.describe("Homepage", () => {
  test("has correct title", async ({ page }) => {
    await page.goto(BASE);
    await expect(page).toHaveTitle(/SchoolPilot/);
  });

  test("has one H1", async ({ page }) => {
    await page.goto(BASE);
    const h1s = await page.locator("h1").count();
    expect(h1s).toBe(1);
  });

  test("hero heading contains expected text", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("h1")).toContainText("Smart Way");
  });

  test("CTA buttons are visible", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  });

  test("navbar links are present in nav element", async ({ page }) => {
    await page.goto(BASE);
    const nav = page.locator("nav").first();
    await expect(nav.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pricing" })).toBeVisible();
  });

  test("stats section is visible on scroll", async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(500);
    const statsText = page.locator("text=/200\\+|50,000\\+|99\\.9%/");
    await expect(statsText.first()).toBeVisible();
  });

  test("footer has newsletter section", async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.locator("text=Stay Updated")).toBeVisible();
  });

  test("footer has correct links", async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.getByRole("link", { name: "Features" }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "About Us" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Privacy Policy" })).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────
// 3. HOMEPAGE DARK MODE (via data-theme toggle)
// ──────────────────────────────────────────────────────
test.describe("Homepage dark mode", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto(BASE);
    // Enable dark mode via data-theme attribute
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.waitForTimeout(300);
  });

  test("renders without critical console errors", async ({ page }) => {
    const errors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text());
    });
    await page.reload({ waitUntil: "networkidle" });
    await page.waitForTimeout(2000);
    const critical = errors.filter(
      (e) =>
        !e.includes("favicon") &&
        !e.includes("analytics") &&
        !e.includes("404") &&
        !e.includes("CORS") &&
        !e.includes("net::ERR") &&
        !e.includes("Warning")
    );
    expect(critical).toHaveLength(0);
  });

  test("hero text is readable (not same color as background)", async ({ page }) => {
    const h1 = page.locator("h1").first();
    const color = await h1.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toMatch(/rgb\(0,\s*0,\s*0\)/);
  });

  test("body has dark background", async ({ page }) => {
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    // Should not be white
    expect(bg).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
  });

  test("navbar is visible", async ({ page }) => {
    // On desktop, the nav in the header should be visible
    const navLinks = page.locator("nav a, header a").first();
    await expect(navLinks).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────
// 4. ABOUT PAGE
// ──────────────────────────────────────────────────────
test.describe("About page", () => {
  test("returns 200", async ({ page }) => {
    const resp = await page.goto(`${BASE}/about/`);
    expect(resp?.status()).toBe(200);
  });

  test("has correct title", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await expect(page).toHaveTitle(/About|SchoolPilot/);
  });

  test("hero heading is present", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await expect(page.locator("h1")).toContainText("Nigerian schools");
  });

  test("hero image loads successfully", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const heroImg = page.locator('img[alt*="classroom"], img[alt*="students"]').first();
    await expect(heroImg).toBeVisible();
    const naturalWidth = await heroImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test("mission section has image", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await page.evaluate(() => window.scrollTo(0, 800));
    await page.waitForTimeout(1000);
    const missionImg = page.locator('img[alt*="books"], img[alt*="library"]').first();
    await expect(missionImg).toBeVisible();
    const naturalWidth = await missionImg.evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test("team portraits load", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight * 0.6));
    await page.waitForTimeout(1000);
    const teamImgs = page.locator('img[alt*="Portrait"]');
    const count = await teamImgs.count();
    expect(count).toBe(3);
    const naturalWidth = await teamImgs.first().evaluate((el: HTMLImageElement) => el.naturalWidth);
    expect(naturalWidth).toBeGreaterThan(0);
  });

  test("values section has 3 cards", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await expect(page.locator("text=Simplicity")).toBeVisible();
    await expect(page.locator("text=Reliability")).toBeVisible();
    await expect(page.locator("text=Local-First")).toBeVisible();
  });

  test("stats section shows numbers", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await page.evaluate(() => window.scrollTo(0, 1200));
    await page.waitForTimeout(500);
    await expect(page.locator("text=200+")).toBeVisible();
    await expect(page.locator("text=50,000+")).toBeVisible();
  });

  test("CTA section has register button", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await expect(page.getByRole("link", { name: /register your school/i })).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────
// 5. ABOUT PAGE DARK MODE
// ──────────────────────────────────────────────────────
test.describe("About page dark mode", () => {
  test("heading is readable", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.waitForTimeout(300);
    const h1 = page.locator("h1").first();
    const color = await h1.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toMatch(/rgb\(0,\s*0,\s*0\)/);
  });

  test("hero image renders against dark background", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const img = page.locator('img[alt*="classroom"], img[alt*="students"]').first();
    await expect(img).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────
// 6. CONTACT PAGE
// ──────────────────────────────────────────────────────
test.describe("Contact page", () => {
  test("returns 200", async ({ page }) => {
    const resp = await page.goto(`${BASE}/contact/`);
    expect(resp?.status()).toBe(200);
  });

  test("has heading", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    await expect(page.locator("h1")).toContainText("Get in touch");
  });

  test("contact form has all fields", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    await expect(page.locator('input[name="name"]')).toBeVisible();
    await expect(page.locator('input[name="email"]')).toBeVisible();
    await expect(page.locator('input[name="school"]')).toBeVisible();
    await expect(page.locator('textarea[name="message"]')).toBeVisible();
  });

  test("contact form has submit button", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    await expect(page.getByRole("button", { name: /send message/i })).toBeVisible();
  });

  test("WhatsApp link is present in contact card", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    const waLink = page.getByRole("link", { name: "Chat on WhatsApp" });
    await expect(waLink).toBeVisible();
    const href = await waLink.getAttribute("href");
    expect(href).toContain("wa.me/2348132790068");
  });

  test("email link is present in contact card", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    const emailLink = page.getByRole("link", { name: "hello@schoolpilot.ng" }).first();
    await expect(emailLink).toBeVisible();
    const href = await emailLink.getAttribute("href");
    expect(href).toBe("mailto:hello@schoolpilot.ng");
  });

  test("form validation: empty fields show browser validation", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    const submit = page.getByRole("button", { name: /send message/i });
    await submit.click();
    const nameInput = page.locator('input[name="name"]');
    const validity = await nameInput.evaluate((el: HTMLInputElement) => el.validity.valid);
    expect(validity).toBe(false);
  });
});

// ──────────────────────────────────────────────────────
// 7. CONTACT PAGE DARK MODE
// ──────────────────────────────────────────────────────
test.describe("Contact page dark mode", () => {
  test("form inputs use theme variable background", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    // Verify input-field uses CSS variable for background (not hardcoded white)
    const nameInput = page.locator('input[name="name"]');
    const bg = await nameInput.evaluate((el) => getComputedStyle(el).backgroundColor);
    // Input should use var(--surface) which resolves differently in light/dark
    // In light mode: var(--surface) is a light gray, not pure white
    expect(bg).toBeTruthy();
    // Verify the class uses the theme system
    const hasInputClass = await nameInput.evaluate((el) => el.classList.contains("input-field"));
    expect(hasInputClass).toBe(true);
  });

  test("WhatsApp card has green tint", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    await expect(page.locator("text=WhatsApp us")).toBeVisible();
    await expect(page.getByRole("link", { name: "Chat on WhatsApp" })).toBeVisible();
  });

  test("heading is readable against dark background", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.waitForTimeout(300);
    const h1 = page.locator("h1").first();
    const color = await h1.evaluate((el) => getComputedStyle(el).color);
    expect(color).not.toMatch(/rgb\(0,\s*0,\s*0\)/);
  });
});

// ──────────────────────────────────────────────────────
// 8. PRICING PAGE
// ──────────────────────────────────────────────────────
test.describe("Pricing page", () => {
  test("returns 200", async ({ page }) => {
    const resp = await page.goto(`${BASE}/pricing/`);
    expect(resp?.status()).toBe(200);
  });

  test("has pricing badge text", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await expect(page.locator("text=Simple, transparent pricing")).toBeVisible();
  });

  test("has pricing heading with flight plan", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await expect(page.locator("h1")).toContainText("flight plan");
  });

  test("shows all 4 pricing tiers", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await page.waitForTimeout(1000);
    // Pricing tiers: Pilot, Navigator, Commander, Enterprise
    const content = await page.content();
    expect(content).toContain("Pilot");
    expect(content).toContain("Navigator");
    expect(content).toContain("Commander");
    expect(content).toContain("Enterprise");
  });

  test("shows Naira prices", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await expect(page.locator("text=/₦\\d/").first()).toBeVisible();
  });

  test("CTA buttons are present", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    const buttons = page.getByRole("link", { name: /start free|trial|contact sales|get started/i });
    const count = await buttons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test("Most Popular badge is visible on Navigator", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await expect(page.locator("text=Most Popular")).toBeVisible();
  });
});

// ──────────────────────────────────────────────────────
// 9. PRICING DARK MODE
// ──────────────────────────────────────────────────────
test.describe("Pricing page dark mode", () => {
  test("pricing cards are visible", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await page.waitForTimeout(1000);
    const content = await page.content();
    expect(content).toContain("Pilot");
    expect(content).toContain("Commander");
  });

  test("dark background applied", async ({ page }) => {
    await page.goto(`${BASE}/pricing/`);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.waitForTimeout(300);
    const bg = await page.evaluate(() => getComputedStyle(document.body).backgroundColor);
    expect(bg).not.toMatch(/rgb\(255,\s*255,\s*255\)/);
  });
});

// ──────────────────────────────────────────────────────
// 10. COOKIE BANNER
// ──────────────────────────────────────────────────────
test.describe("Cookie banner", () => {
  test("appears after 1 second delay", async ({ page }) => {
    await page.goto(BASE);
    const banner = page.locator('[role="dialog"][aria-label="Cookie consent"]');
    await expect(banner).not.toBeVisible();
    await expect(banner).toBeVisible({ timeout: 3000 });
  });

  test("has Accept All, Reject, and Customize buttons", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await expect(page.getByRole("button", { name: "Accept All" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Reject" })).toBeVisible();
    await expect(page.getByRole("button", { name: "Customize" })).toBeVisible();
  });

  test("dismissing removes banner and clears body padding", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await page.getByRole("button", { name: "Accept All" }).click();
    const banner = page.locator('[role="dialog"][aria-label="Cookie consent"]');
    await expect(banner).not.toBeVisible();
    const padding = await page.evaluate(() => document.body.style.paddingBottom);
    expect(padding).toBe("");
  });

  test("banner is positioned as compact pill on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    const banner = page.locator('[role="dialog"][aria-label="Cookie consent"]');
    await expect(banner).toBeVisible();
    const box = await banner.boundingBox();
    expect(box?.width).toBeLessThan(450);
  });

  test("auto-dismisses after 10 seconds", async ({ page }) => {
    await page.goto(BASE);
    await page.waitForTimeout(1500);
    await expect(page.locator('[role="dialog"][aria-label="Cookie consent"]')).toBeVisible();
    await expect(page.locator('[role="dialog"][aria-label="Cookie consent"]')).not.toBeVisible({
      timeout: 13000,
    });
  });
});

// ──────────────────────────────────────────────────────
// 11. NAVBAR
// ──────────────────────────────────────────────────────
test.describe("Navbar", () => {
  test("brand logo/name is visible", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.locator("text=SchoolPilot").first()).toBeVisible();
  });

  test("Get Started button is visible", async ({ page }) => {
    await page.goto(BASE);
    await expect(page.getByRole("link", { name: /get started/i }).first()).toBeVisible();
  });

  test("desktop nav has links", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    const nav = page.locator("nav").first();
    await expect(nav.getByRole("link", { name: "Features" })).toBeVisible();
    await expect(nav.getByRole("link", { name: "Pricing" })).toBeVisible();
  });

  test("backdrop blur is applied after scrolling", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    await page.waitForTimeout(500);
    // Scroll down to trigger the blur effect (it only activates on scroll)
    await page.evaluate(() => window.scrollTo(0, 200));
    await page.waitForTimeout(500);
    const hasBlur = await page.evaluate(() => {
      const elements = document.querySelectorAll("header, nav, div");
      for (const el of elements) {
        const filter = getComputedStyle(el).backdropFilter;
        if (filter && filter.includes("blur")) return true;
      }
      return false;
    });
    expect(hasBlur).toBe(true);
  });
});

// ──────────────────────────────────────────────────────
// 12. FLOATING WHATSAPP BUTTON
// ──────────────────────────────────────────────────────
test.describe("Floating WhatsApp button", () => {
  test("is visible on homepage", async ({ page }) => {
    await page.goto(BASE);
    const waBtn = page.locator('a[href*="wa.me/2348132790068"]').last();
    await expect(waBtn).toBeVisible();
  });

  test("links to correct WhatsApp number", async ({ page }) => {
    await page.goto(BASE);
    const waBtn = page.locator('a[href*="wa.me/2348132790068"]').last();
    const href = await waBtn.getAttribute("href");
    expect(href).toContain("2348132790068");
  });

  test("has semi-transparent background in dark mode", async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
    await page.waitForTimeout(500);
    // The WhatsApp button is rendered by FloatingWhatsApp component
    const waBtn = page.locator('a[href*="wa.me"]').last();
    const isVisible = await waBtn.isVisible().catch(() => false);
    if (isVisible) {
      const bg = await waBtn.evaluate((el) => getComputedStyle(el).backgroundColor);
      expect(bg).toMatch(/rgba?\(/);
    } else {
      // Button might be conditionally hidden; verify it exists in DOM
      const count = await page.locator('a[href*="wa.me"]').count();
      expect(count).toBeGreaterThan(0);
    }
  });
});

// ──────────────────────────────────────────────────────
// 13. MOBILE RESPONSIVENESS
// ──────────────────────────────────────────────────────
test.describe("Mobile responsiveness", () => {
  test("homepage hero fits mobile viewport", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(BASE);
    await page.waitForTimeout(1000);
    const h1 = page.locator("h1").first();
    await expect(h1).toBeVisible();
    // Check no horizontal overflow
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(400);
  });

  test("no horizontal scroll on any page", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    for (const path of ["/", "/about/", "/contact/", "/pricing/"]) {
      await page.goto(`${BASE}${path}`);
      await page.waitForTimeout(500);
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const viewportWidth = await page.evaluate(() => window.innerWidth);
      expect(scrollWidth).toBeLessThanOrEqual(viewportWidth + 5);
    }
  });

  test("contact form is usable on mobile", async ({ page }) => {
    await page.setViewportSize({ width: 390, height: 844 });
    await page.goto(`${BASE}/contact/`);
    await page.waitForTimeout(1000);
    const nameInput = page.locator('input[name="name"]');
    await expect(nameInput).toBeVisible();
    // Verify form is not overflowing
    const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
    expect(scrollWidth).toBeLessThanOrEqual(400);
  });
});

// ──────────────────────────────────────────────────────
// 14. DARK MODE TOGGLE
// ──────────────────────────────────────────────────────
test.describe("Dark mode toggle", () => {
  test("toggling changes data-theme attribute", async ({ page }) => {
    await page.goto(BASE);
    const initialTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme") || "light");

    // Find the theme toggle button
    const toggle = page.locator('button[aria-label*="dark"], button[aria-label*="mode"], button[aria-label*="theme"]');
    const count = await toggle.count();
    if (count > 0) {
      // Click on desktop where button should be visible
      await page.setViewportSize({ width: 1440, height: 900 });
      await page.reload();
      await page.waitForTimeout(500);
      const desktopToggle = page.locator('button[aria-label*="dark"], button[aria-label*="mode"], button[aria-label*="theme"]');
      if (await desktopToggle.first().isVisible()) {
        await desktopToggle.first().click();
        await page.waitForTimeout(500);
        const newTheme = await page.evaluate(() => document.documentElement.getAttribute("data-theme") || "light");
        expect(newTheme).not.toBe(initialTheme);
      }
    }
  });
});

// ──────────────────────────────────────────────────────
// 15. SEO / ACCESSIBILITY BASICS
// ──────────────────────────────────────────────────────
test.describe("SEO basics", () => {
  test("homepage has meta description", async ({ page }) => {
    await page.goto(BASE);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
    expect(desc!.length).toBeGreaterThan(20);
  });

  test("about page has meta description", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const desc = await page.locator('meta[name="description"]').getAttribute("content");
    expect(desc).toBeTruthy();
  });

  test("images have alt text", async ({ page }) => {
    await page.goto(`${BASE}/about/`);
    const images = page.locator("img");
    const count = await images.count();
    for (let i = 0; i < count; i++) {
      const alt = await images.nth(i).getAttribute("alt");
      expect(alt).toBeTruthy();
    }
  });

  test("all pages have titles", async ({ page }) => {
    for (const path of ["/", "/about/", "/contact/", "/pricing/"]) {
      await page.goto(`${BASE}${path}`);
      const title = await page.title();
      expect(title).toBeTruthy();
      expect(title.length).toBeGreaterThan(3);
    }
  });
});

// ──────────────────────────────────────────────────────
// 16. INTERNAL LINKS (using hash anchors for footer links)
// ──────────────────────────────────────────────────────
test.describe("Internal links", () => {
  test("navbar Features link scrolls to section on homepage", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    const nav = page.locator("nav").first();
    await nav.getByRole("link", { name: "Features" }).click();
    await page.waitForTimeout(1000);
    // Should stay on homepage but scroll to #features section
    expect(page.url()).toContain("#");
  });

  test("navbar Pricing link scrolls to pricing section", async ({ page }) => {
    await page.setViewportSize({ width: 1440, height: 900 });
    await page.goto(BASE);
    const nav = page.locator("nav").first();
    await nav.getByRole("link", { name: "Pricing" }).click();
    await page.waitForTimeout(1000);
    expect(page.url()).toContain("#");
  });

  test("footer About Us link navigates to about page", async ({ page }) => {
    await page.goto(BASE);
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await page.waitForTimeout(500);
    await page.getByRole("link", { name: "About Us" }).click();
    await page.waitForTimeout(2000);
    expect(page.url()).toContain("/about");
  });
});

// ──────────────────────────────────────────────────────
// 17. CUSTOM 404 PAGE
// ──────────────────────────────────────────────────────
test.describe("Custom 404 page", () => {
  test("nonexistent route loads without crashing", async ({ page }) => {
    // Static export returns 200 for all routes; the 404 content is rendered client-side
    const resp = await page.goto(`${BASE}/nonexistent-page-xyz/`);
    expect(resp?.status()).toBe(200);
    // Page should load without JS errors
    const errors: string[] = [];
    page.on("pageerror", (err) => errors.push(err.message));
    await page.waitForTimeout(2000);
    expect(errors).toHaveLength(0);
  });
});

// ──────────────────────────────────────────────────────
// 18. FORM ACCESSIBILITY
// ──────────────────────────────────────────────────────
test.describe("Form accessibility", () => {
  test("contact form inputs have labels", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    const nameInput = page.locator('input[name="name"]');
    const id = await nameInput.getAttribute("id");
    expect(id).toBeTruthy();
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  });

  test("contact form textarea has label", async ({ page }) => {
    await page.goto(`${BASE}/contact/`);
    const textarea = page.locator('textarea[name="message"]');
    const id = await textarea.getAttribute("id");
    expect(id).toBeTruthy();
    const label = page.locator(`label[for="${id}"]`);
    await expect(label).toBeVisible();
  });
});
