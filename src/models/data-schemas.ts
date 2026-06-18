import { z } from 'zod';

// Định nghĩa cấu trúc dữ liệu mong đợi
export const UserSchema = z.object({
  username: z.string(),
  password: z.string(),
  // email: z.string().optional(), // Trường này có thể bỏ trống (nullable/undefined)
  // role: z.string().default('guest'), // Mặc định nếu trống


email: z.string().email().optional().or(z.literal("")),});

export type UserData = z.infer<typeof UserSchema>;  