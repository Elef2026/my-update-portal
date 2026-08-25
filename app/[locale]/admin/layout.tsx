import { redirect } from "next/navigation";
import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/auth";
import DashboardHeader from "@/components/shared/DashboardHeader";

export default async function AdminLayout({
  children,
  params: { locale },
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const session = await getServerSession(authOptions);

  if (!session) {
    redirect(`/${locale}/login`);
  }

  if (session.user.role !== "ADMIN") {
    // If a shop tries to access admin, send them to their dashboard
    redirect(`/${locale}/shop`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <DashboardHeader user={session.user} locale={locale} />
      <main className="flex-1 overflow-y-auto bg-muted/20">
        {children}
      </main>
    </div>
  );
}
