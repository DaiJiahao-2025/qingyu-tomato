import "dotenv/config";

function required(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`环境变量 ${name} 未设置——拒绝启动（不提供不安全的默认值）`);
  }
  return value;
}

export const config = {
  port: Number(process.env.PORT || 3000),
  jwtSecret: required("JWT_SECRET"),
  jwtExpiresIn: "7d" as const,
  bcryptRounds: 10,
};
