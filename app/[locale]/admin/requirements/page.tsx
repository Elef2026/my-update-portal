import { redirect } from "next/navigation";

export default function AdminRequirementsRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/admin/guidelines`);
}
