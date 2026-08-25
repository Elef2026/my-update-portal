import { useTranslations } from "next-intl";
import Link from "next/link";

export default function LandingPage({ params: { locale } }: { params: { locale: string } }) {
  const t = useTranslations("Index");

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-24 text-center">
      <div className="z-10 max-w-5xl w-full items-center justify-between font-mono text-sm">
        <h1 className="text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-emerald-400">
          {t("title")}
        </h1>
        <p className="text-xl text-muted-foreground mb-12">
          {t("description")}
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href={`/${locale}/login`}
            className="px-8 py-3 rounded-md bg-primary text-primary-foreground font-semibold hover:bg-primary/90 transition-colors"
          >
            {t("login")}
          </Link>
        </div>
      </div>
    </main>
  );
}
