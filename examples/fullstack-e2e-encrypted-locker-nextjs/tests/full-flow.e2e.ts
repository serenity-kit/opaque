import { Dialog, Page, expect, test } from "@playwright/test";
import { randomUUID } from "crypto";

function waitForDialog(page: Page, f: () => Promise<void>): Promise<Dialog> {
  return new Promise(async (resolve) => {
    page.once("dialog", async (dialog) => {
      resolve(dialog);
    });
    await f();
  });
}

async function fillForm(page: Page, name: string, password: string) {
  await page.getByPlaceholder("Username").locator("visible=true").fill(name);
  await page
    .getByPlaceholder("Password")
    .locator("visible=true")
    .fill(password);
}

async function registerUser(page: Page, name: string, password: string) {
  await page.goto("/");
  await page.getByRole("link", { name: "Register" }).click();
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  await fillForm(page, name, password);
  await page.getByRole("button", { name: "Register" }).click();
  await expect(page.getByText("logged in as user " + name)).toBeVisible();
}

test("full registration & login flow", async ({ page }) => {
  const userName = randomUUID();
  await registerUser(page, userName, "hunter42");

  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await fillForm(page, userName, "hunter42");

  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("logged in as user " + userName)).toBeVisible();
});
