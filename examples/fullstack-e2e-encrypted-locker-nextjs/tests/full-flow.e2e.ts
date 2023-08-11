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

test("login with wrong password fails", async ({ page }) => {
  const userName = randomUUID();
  await registerUser(page, userName, "test");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await fillForm(page, userName, "wrong");
  await page.getByRole("button", { name: "Login" }).click();
  await expect(page.getByText("Login failed")).toBeVisible();
});

test("cannot register same user ID more than once", async ({ page }) => {
  const userName = randomUUID();
  await registerUser(page, userName, "test");
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();
  await page.getByRole("link", { name: "Register" }).click();
  await expect(page.getByRole("heading", { name: "Register" })).toBeVisible();
  await fillForm(page, userName, "test");
  const dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Register" }).click()
  );
  expect(dialog.message()).toContain("user already registered");
});

test("locker recovery", async ({ page }) => {
  // register new user
  const userName = randomUUID();
  await registerUser(page, userName, "test");
  await expect(page.getByRole("heading", { name: "Locker" })).toBeVisible();
  await expect(
    page.getByText("Save a locker secret to create a recovery key.")
  ).toBeVisible();

  // save locker secret
  await page.locator("textarea").fill("secret test code=1337");
  let dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Save" }).click()
  );
  expect(dialog.message()).toContain("Locker updated");
  await dialog.dismiss();

  // verify recovery key status
  await expect(page.getByText("No Recovery Key set")).toBeVisible();

  // create recovery key
  dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Create Recovery Key" }).click()
  );
  const msg = dialog.message();
  const prefix = "Your recovery key: ";
  expect(msg.startsWith(prefix)).toBe(true);
  const recoveryKey = msg.substring(prefix.length);
  await dialog.dismiss();

  // verify recover key status
  await expect(page.getByText("Recovery Key is set")).toBeVisible();

  // update locker secret
  await page.locator("textarea").fill("secret test code=1337 answer=42");
  dialog = await waitForDialog(page, () =>
    page.getByRole("button", { name: "Save" }).click()
  );
  expect(dialog.message()).toContain("Locker updated");
  await dialog.dismiss();

  // logout
  await page.getByRole("button", { name: "Logout" }).click();
  await expect(page.getByRole("heading", { name: "Login" })).toBeVisible();

  // navigate to recovery
  await page.getByRole("link", { name: "Recover Locker" }).click();
  await expect(
    page.getByRole("heading", { name: "Recover Locker" })
  ).toBeVisible();

  // fill recovery form
  await page.getByPlaceholder("Username").fill(userName);
  await page.getByPlaceholder("Recovery Key").fill(recoveryKey);
  await page.getByRole("button", { name: "Recover" }).click();

  // verify we recovered the locker secret
  await expect(page.getByText("Locker successfully recovered")).toBeVisible();
  await expect(page.getByText("secret test code=1337 answer=42")).toBeVisible();
});
