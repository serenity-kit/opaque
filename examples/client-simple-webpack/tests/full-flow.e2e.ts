import { expect, test } from "@playwright/test";

test("full registration & login flow", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  const username = await page
    .getByPlaceholder("Username")
    .locator("visible=true");
  await username.click();
  await username.fill("jane_doe");
  await username.press("Tab");
  await page
    .getByPlaceholder("Password")
    .locator("visible=true")
    .fill("hunter42");

  // registration
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe('User "jane_doe" registered successfully');
    await dialog.dismiss().catch(() => {
      throw new Error("Dialog not dismissed");
    });
  });
  await page.getByRole("button", { name: "Register" }).click();
  await new Promise((r) => setTimeout(r, 2000));

  // first login attempt
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain(
      'User "jane_doe" logged in successfully'
    );
    await dialog.dismiss().catch(() => {
      throw new Error("Dialog not dismissed");
    });
  });
  await page.getByRole("button", { name: "Login" }).click();
  await new Promise((r) => setTimeout(r, 2000));

  // second login attempt
  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toContain(
      'User "jane_doe" logged in successfully'
    );
    await dialog.dismiss().catch(() => {
      throw new Error("Dialog not dismissed");
    });
  });
  await page.getByRole("button", { name: "Login" }).click();
  await new Promise((r) => setTimeout(r, 2000));
});
