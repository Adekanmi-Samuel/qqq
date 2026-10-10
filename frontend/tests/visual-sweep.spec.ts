import { test } from "@playwright/test";

const BASE = "https://schoolpilot-work.vercel.app";
const OUT = "test-results/visual";

test("homepage light", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/home-light.png`, fullPage: true });
});

test("homepage dark", async ({ page }) => {
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/home-dark.png`, fullPage: true });
});

test("about light", async ({ page }) => {
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/about-light.png`, fullPage: true });
});

test("about dark", async ({ page }) => {
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/about-dark.png`, fullPage: true });
});

test("contact light", async ({ page }) => {
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/contact-light.png`, fullPage: true });
});

test("contact dark", async ({ page }) => {
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/contact-dark.png`, fullPage: true });
});

test("pricing light", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/pricing-light.png`, fullPage: true });
});

test("pricing dark", async ({ page }) => {
  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/pricing-dark.png`, fullPage: true });
});

test("mobile homepage light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/mobile-home-light.png`, fullPage: true });
});

test("mobile homepage dark", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(BASE, { waitUntil: "networkidle" });
  await page.waitForTimeout(500);
  await page.evaluate(() => document.documentElement.setAttribute("data-theme", "dark"));
  await page.waitForTimeout(1000);
  await page.screenshot({ path: `${OUT}/mobile-home-dark.png`, fullPage: true });
});

test("mobile about light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/about`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/mobile-about-light.png`, fullPage: true });
});

test("mobile contact light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/contact`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/mobile-contact-light.png`, fullPage: true });
});

test("mobile pricing light", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto(`${BASE}/pricing`, { waitUntil: "networkidle" });
  await page.waitForTimeout(1500);
  await page.screenshot({ path: `${OUT}/mobile-pricing-light.png`, fullPage: true });
});
