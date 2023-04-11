import { expect, test } from "@playwright/test";

test("full registration & login flow", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  await page.getByPlaceholder("Username").click();
  await page.getByPlaceholder("Username").fill("jane_doe");
  await page.getByPlaceholder("Username").press("Tab");
  await page.getByPlaceholder("Password").fill("hunter42");

  page.once("dialog", async (dialog) => {
    expect(dialog.message()).toBe('User "jane_doe" registered successfully');
    await dialog.dismiss().catch(() => {
      throw new Error("Dialog not dismissed");
    });
  });
  await page.getByRole("button", { name: "Register" }).click();
  await new Promise((r) => setTimeout(r, 2000));

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
