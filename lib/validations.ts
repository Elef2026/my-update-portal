import * as z from "zod";

// Strict Amharic characters only (including spaces)
const amharicRegex = /^[ሀ-፼\s]+$/;

export const documentUpdateSchema = z.object({
  selectedServices: z.array(z.string()).min(1, { message: "ቢያንስ አንድ አገልግሎት መምረጥ አለቦት" }),
  oldData: z.record(z.any()).optional(),
  newData: z.record(z.any()).optional(),
  customerName: z.string().min(2, { message: "የደንበኛ ስም ያስገቡ" }),
  customerPhone: z
    .string()
    .min(10, { message: "ስልክ ቁጥር ቢያንስ 10 አሃዝ መሆን አለበት" })
    .max(13),
});

export const loginSchema = z.object({
  email: z.string().email({ message: "ትክክለኛ ኢሜል አድራሻ ያስገቡ" }),
  password: z.string().min(6, { message: "የይለፍ ቃል ቢያንስ 6 ፊደል/ቁጥር መሆን አለበት" }),
});
