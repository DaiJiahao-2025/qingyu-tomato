// 在任何应用模块加载前设置测试环境变量。
// dotenv 不会覆盖已存在的变量，因此这里的赋值优先于 server/.env。

process.env.DATABASE_URL =
  process.env.TEST_DATABASE_URL || "mysql://root:root@localhost:3306/fanqie_test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-only-secret";
