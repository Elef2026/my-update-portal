import { redirect } from "next/navigation";

export default function AdminInfoRedirect({ params: { locale } }: { params: { locale: string } }) {
  redirect(`/${locale}/admin/guidelines`);
}
