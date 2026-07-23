import bcrypt from "bcryptjs";
import { z } from "zod";
import { prisma } from "../lib/prisma";
import { config } from "../config";
import { ApiError } from "../middleware/error";
import { signToken } from "../middleware/auth";

export const zRegister = z.object({
  email: z.string().email("邮箱格式不正确").max(191),
  password: z.string().min(6, "密码至少 6 位").max(72),
  displayName: z.string().max(50).optional(),
});

export const zLogin = z.object({
  email: z.string().email("邮箱格式不正确").max(191),
  password: z.string().min(1, "请输入密码").max(72),
});

export interface PublicUser {
  id: string;
  email: string;
  displayName: string;
  createdAt: string;
}

function toPublicUser(user: { id: string; email: string; displayName: string; createdAt: Date }): PublicUser {
  return {
    id: user.id,
    email: user.email,
    displayName: user.displayName,
    createdAt: user.createdAt.toISOString(),
  };
}

export async function register(input: z.infer<typeof zRegister>): Promise<{ token: string; user: PublicUser }> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new ApiError(409, "该邮箱已注册");

  const passwordHash = await bcrypt.hash(input.password, config.bcryptRounds);
  const user = await prisma.user.create({
    data: {
      email: input.email,
      passwordHash,
      displayName: input.displayName || input.email.split("@")[0],
    },
  });
  return { token: signToken(user.id), user: toPublicUser(user) };
}

export async function login(input: z.infer<typeof zLogin>): Promise<{ token: string; user: PublicUser }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });
  // 用户不存在时也走一次哈希比较，避免响应时间差泄露账号是否存在
  const hash = user?.passwordHash || "$2a$10$invalidinvalidinvalidinvalidinvalidinvalidinvalidinva";
  const match = await bcrypt.compare(input.password, hash);
  if (!user || !match) throw new ApiError(401, "邮箱或密码错误");
  return { token: signToken(user.id), user: toPublicUser(user) };
}

export async function me(userId: string): Promise<PublicUser> {
  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) throw new ApiError(401, "用户不存在");
  return toPublicUser(user);
}
