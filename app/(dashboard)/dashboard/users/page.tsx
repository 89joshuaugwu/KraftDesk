"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUserRole, isAdmin } from "@/lib/roles";
import { UserManagementTable } from "@/components/organisms/UserManagementTable";
import { Spinner } from "@/components/ui/Spinner";

export default function UsersPage() {
  const { role, loading } = useUserRole();
  const router = useRouter();

  useEffect(() => {
    if (!loading && role && !isAdmin(role)) {
      toast.error("You don't have access to that page");
      router.replace("/dashboard");
    }
  }, [loading, role, router]);

  if (loading || !role || !isAdmin(role)) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <Spinner className="h-8 w-8" />
      </div>
    );
  }

  return <UserManagementTable viewerRole={role} />;
}
