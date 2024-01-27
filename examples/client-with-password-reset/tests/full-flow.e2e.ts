import { Dialog, Page, expect, test } from "@playwright/test";

function waitForDialog(page: Page, f: () => Promise<void>): Promise<Dialog> {
  return new Promise(async (resolve) => {
    page.once("dialog", async (dialog) => {
      resolve(dialog);
    });
    await f();
  });
}

async function fillForm(page: Page, name: string, password: string) {
  const username = page.getByPlaceholder("Username").locator("visible=true");
  await username.click();
  await username.fill(name);
  await username.press("Tab");
  await page
    .getByPlaceholder("Password")
    .locator("visible=true")
    .fill(password);
}

async function registerUser(page: Page, name: string, password: string) {
  await fillForm(page, name, password);

  const dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Register" }).click(),
  );
  expect(dialog.message()).toBe(`User "${name}" registered successfully`);
  await dialog.dismiss();
}

test("full registration & login flow", async ({ page }) => {
  await page.goto("http://localhost:8080/");

  await registerUser(page, "jane_doe", "hunter42");

  let dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Login" }).click(),
  );
  expect(dialog.message()).toContain('User "jane_doe" logged in successfully');
  await dialog.dismiss();

  dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Login" }).click(),
  );
  expect(dialog.message()).toContain('User "jane_doe" logged in successfully');
  await dialog.dismiss();
});

test("forgot password with unknown user", async ({ page }) => {
  await page.goto("http://localhost:8080/");
  await page.getByText("Forgot password?").click();
  const container = page.getByTestId("password_reset_request");
  await container.isVisible();
  const username = container.getByPlaceholder("Username");
  await username.fill("unknown");

  const dialog = await waitForDialog(page, () =>
    container.getByText("Request Password Reset").click(),
  );
  expect(dialog.message()).toContain("Error: user not found");
  await dialog.dismiss();
});

test("forgot password with invalid reset code", async ({ page }) => {
  await page.goto("http://localhost:8080/");

  await registerUser(page, "foo_bar", "hunter42");

  await page.getByText("Forgot password?").click();
  const container = page.getByTestId("password_reset_request");
  await container.isVisible();
  const username = container.getByPlaceholder("Username");
  await username.fill("foo_bar");
  await container.getByText("Request Password Reset").click();

  await page.getByPlaceholder("Reset Code").fill("abc123");
  await page.getByPlaceholder("New Password").fill("foobar");

  const dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Reset Password" }).click(),
  );
  expect(dialog.message()).toContain("Error: reset code is invalid or expired");
  await dialog.dismiss();
});

test("forgot password happy path", async ({ page }) => {
  await page.goto("http://localhost:8080/");

  await registerUser(page, "john_doe", "hunter42");

  await page.getByText("Forgot password?").click();
  const container = page.getByTestId("password_reset_request");
  await container.isVisible();
  const username = container.getByPlaceholder("Username");
  await username.fill("john_doe");
  await container.getByText("Request Password Reset").click();

  await page.getByPlaceholder("Reset Code").fill("1234567890");
  await page.getByPlaceholder("New Password").fill("foobar");

  let dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Reset Password" }).click(),
  );
  expect(dialog.message()).toContain(
    `Password reset for "john_doe" successful`,
  );
  await dialog.dismiss();

  await fillForm(page, "john_doe", "foobar");

  dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Login" }).click(),
  );
  expect(dialog.message()).toContain('User "john_doe" logged in successfully');
  await dialog.dismiss();
});
