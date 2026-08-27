import { redirect } from "next/navigation";

export default function InfoRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/shop/guidelines`);
}
