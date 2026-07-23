import { execSync } from "node:child_process";

/** 测试启动前把迁移应用到测试库 */
export default function globalSetup(): void {
  const url = process.env.TEST_DATABASE_URL || "mysql://root:root@localhost:3306/fanqie_test";
  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, DATABASE_URL: url },
  });
}
