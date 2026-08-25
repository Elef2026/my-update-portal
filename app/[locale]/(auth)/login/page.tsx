"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { loginSchema } from "@/lib/validations";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import * as z from "zod";

type LoginForm = z.infer<typeof loginSchema>;

export default function LoginPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations("Auth");
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginForm) => {
    setError(null);
    const result = await signIn("credentials", {
      redirect: false,
      email: data.email,
      password: data.password,
    });

    if (result?.error) {
      setError("የተሳሳተ ኢሜል ወይም የይለፍ ቃል (Invalid credentials)");
    } else {
      // Successfully logged in, navigate to the shop dashboard
      router.push(`/${locale}/shop`);
      router.refresh();
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-md bg-card p-8 rounded-lg shadow-lg border">
        <h1 className="text-2xl font-bold text-center mb-6">ግባ (Login)</h1>
        
        {error && (
          <div className="bg-destructive/15 text-destructive p-3 rounded-md mb-4 text-sm text-center">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">{t("email")}</label>
            <Input 
              {...register("email")} 
              type="email" 
              placeholder="shop@example.com" 
              className={errors.email ? "border-destructive" : ""}
            />
            {errors.email && (
              <p className="text-sm text-destructive mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">{t("password")}</label>
            <Input 
              {...register("password")} 
              type="password" 
              placeholder="••••••••" 
              className={errors.password ? "border-destructive" : ""}
            />
            {errors.password && (
              <p className="text-sm text-destructive mt-1">{errors.password.message}</p>
            )}
          </div>

          <Button type="submit" disabled={isSubmitting} className="w-full mt-6">
            {isSubmitting ? "በመግባት ላይ..." : t("loginButton")}
          </Button>
        </form>
      </div>
    </div>
  );
}
