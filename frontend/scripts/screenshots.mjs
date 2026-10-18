// Plays one demo match in Chromium and saves README screenshots as WebP.
//
//   pnpm build
//   pnpm preview            (serves http://127.0.0.1:4173/code-arena/)
//   pnpm screenshots [base-url]
//
// Each stage is captured at a desktop and a phone width, then encoded to WebP
// by the browser's own canvas encoder, so no image library is needed.
import { mkdir, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { chromium } from "playwright";

const BASE = process.argv[2] ?? "http://127.0.0.1:4173/code-arena/";
const OUT = fileURLToPath(new URL("../../docs/screenshots/", import.meta.url));
const DESKTOP = { width: 1440, height: 900 };
const PHONE = { width: 390, height: 844 };
const SOLUTION = [
  "class Solution:",
  "    def twoSum(self, nums: List[int], target: int) -> List[int]:",
  "        seen = {}",
  "        for i, n in enumerate(nums):",
  "            if target - n in seen:",
  "                return [seen[target - n], i]",
  "            seen[n] = i",
  "",
].join("\n");

const browser = await chromium.launch();
const context = await browser.newContext({ viewport: DESKTOP, deviceScaleFactor: 2 });
const page = await context.newPage();
const encoder = await context.newPage();
await mkdir(OUT, { recursive: true });

/** Re-encode a PNG screenshot as WebP at `width` CSS pixels, using canvas in Chromium. */
async function toWebp(png, width) {
  const dataUrl = `data:image/png;base64,${png.toString("base64")}`;
  const webp = await encoder.evaluate(
    async ({ src, width }) => {
      const img = new Image();
      img.src = src;
      await img.decode();
      const canvas = document.createElement("canvas");
      canvas.width = width;
      canvas.height = Math.round((img.height * width) / img.width);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      return canvas.toDataURL("image/webp", 0.86).split(",")[1];
    },
    { src: dataUrl, width }
  );
  return Buffer.from(webp, "base64");
}

/** Capture the current screen at both widths, then restore the desktop size. */
async function shoot(name) {
  for (const [label, size, width] of [["desktop", DESKTOP, 1600], ["phone", PHONE, 780]]) {
    await page.setViewportSize(size);
    await page.waitForTimeout(600);
    const file = `${name}-${label}.webp`;
    await writeFile(OUT + file, await toWebp(await page.screenshot(), width));
    console.log("saved", file);
  }
  await page.setViewportSize(DESKTOP);
}

await page.goto(BASE);
await page.evaluate(() => localStorage.clear());
await page.goto(BASE);
await page.getByRole("link", { name: "Try the demo" }).waitFor();
await shoot("landing");

await page.getByRole("link", { name: "Try the demo" }).click();
await page.getByRole("heading", { name: "Create Room" }).waitFor();
await page.locator("select").nth(1).selectOption("Easy");
await page.getByRole("button", { name: "Create Room" }).click();
await page.getByText("linus", { exact: true }).waitFor();
await shoot("lobby");

await page.getByRole("button", { name: "Start Match" }).click();
await page.locator(".monaco-editor").waitFor({ timeout: 30_000 });
// The React wrapper wires its change listener just after mount; edits made
// before that never reach the app state.
await page.waitForTimeout(1000);
// Paste the solution through Monaco's model, as typing would fight auto-indent.
await page.waitForFunction(() => window.monaco?.editor.getModels().length > 0, null, { timeout: 30_000 });
await page.evaluate((code) => window.monaco.editor.getModels()[0].setValue(code), SOLUTION);

await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Wrong Answer").waitFor();
// Let the bots post a few verdicts so the live status bar has content.
await page.waitForTimeout(32_000);
await shoot("arena");

await page.getByRole("button", { name: "Submit" }).click();
await page.getByText("Accepted").first().waitFor();
await page.getByRole("heading", { name: "Match Results" }).waitFor({ timeout: 90_000 });
await page.waitForTimeout(400);
await shoot("results");

await browser.close();
