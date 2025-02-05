import { redirect } from "next/navigation";

import { AdminAccessRequest } from "~/components/admin/AdminAccessRequest";
import { AdminDashboard } from "~/components/admin/AdminDashboard";
import { getServerAuthSession } from "~/server/auth";

export default async function AdminPage() {
  const session = await getServerAuthSession();

  if (!session?.user) {
    redirect("/");
  }

  const isAdmin = session.user.roles?.includes("SITE_ADMIN");

  return (
    <div className="container mx-auto p-6">
      <h1 className="mb-8 text-3xl font-bold">Admin Dashboard</h1>
      {isAdmin ? <AdminDashboard /> : <AdminAccessRequest />}
    </div>
  );
}
