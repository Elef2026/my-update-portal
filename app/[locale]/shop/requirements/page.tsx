import { redirect } from "next/navigation";

export default function RequirementsRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/shop/guidelines`);
}
