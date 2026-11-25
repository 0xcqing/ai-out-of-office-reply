import { chmod, mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";

const REPLY =
  "I am out of office until Monday. To save compute I have been quantized to one bit, so consider this your reply: no.";

const MAX_BYTES = 160;

function resolveOutputDir(): string {
  const fromEnv = process.env.MAKEFUN_OUTPUT_DIR;
  if (fromEnv !== undefined && fromEnv.trim() !== "") {
    return fromEnv;
  }
  return "/output";
}

async function main(): Promise<void> {
  if (REPLY.trim().length === 0) {
    throw new Error("entry text is only white space");
  }

  const characterCount = [...REPLY].length;
  if (characterCount > MAX_BYTES) {
    throw new Error(
      `entry is ${characterCount} characters, over the ${MAX_BYTES} limit`,
    );
  }

  const payload = `${REPLY}\n`;
  const byteLength = Buffer.byteLength(payload, "utf8");
  if (byteLength < 1 || byteLength > MAX_BYTES) {
    throw new Error(
      `entry.txt would be ${byteLength} bytes, outside 1..${MAX_BYTES}`,
    );
  }

  const outputDir = resolveOutputDir();
  await mkdir(outputDir, { recursive: true });
  await chmod(outputDir, 0o755).catch(() => undefined);

  const entryPath = join(outputDir, "entry.txt");
  await writeFile(entryPath, payload, { encoding: "utf8" });
  await chmod(entryPath, 0o644).catch(() => undefined);

  const written = await readFile(entryPath, "utf8");
  if (written !== payload) {
    throw new Error("entry.txt changed between writing and reading it back");
  }
  if (!written.endsWith("\n") || written.endsWith("\n\n")) {
    throw new Error("entry.txt must end with exactly one trailing newline");
  }

  console.log(`wrote ${entryPath}`);
  console.log(`characters: ${characterCount}`);
  console.log(`bytes: ${byteLength}`);
  console.log(`reply: ${REPLY}`);
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error(`failed: ${message}`);
  process.exitCode = 1;
});
