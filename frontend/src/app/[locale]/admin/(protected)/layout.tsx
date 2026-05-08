import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { AdminSidebar } from "@/src/components/admin/AdminSidebar";
import { AdminTopBar } from "@/src/components/admin/AdminTopBar";

export default async function AdminProtectedLayout({ children, params }: { children: React.ReactNode, params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  const cookieStore = await cookies();
  const isAdmin = cookieStore.has("admin_token");

  if (!isAdmin) redirect(`/${locale}/client/auth/login`);

  return (
    <div className="flex min-h-screen bg-white dark:bg-gray-950 text-gray-900 dark:text-white">
      <AdminSidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <AdminTopBar />
        <main className="flex-1 p-6 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
