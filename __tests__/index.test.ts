// __tests__/index.test.ts
import { execSync } from "child_process";

describe("CommitGen CLI", () => {
  test("should be executable", () => {
    const result = execSync("node dist/index.js --help", { encoding: "utf8" });
    expect(result).toContain("commitgen");
  });

  test("should show version", () => {
    const result = execSync("node dist/index.js --version", {
      encoding: "utf8",
    });
    expect(result).toContain("0.0.3");
  });
});
