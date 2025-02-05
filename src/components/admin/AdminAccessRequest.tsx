"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useState } from "react";

import { Button } from "~/components/ui/button";
import { Card } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { api } from "~/trpc/react";

export const AdminAccessRequest = () => {
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const { update } = useSession();

  const verifyAccess = api.admin.verifyAdminAccess.useMutation({
    onSuccess: async () => {
      await update();
      router.refresh();
    },
    onError: (error) => {
      setError(error.message);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    verifyAccess.mutate({ password });
  };

  return (
    <Card className="mx-auto max-w-md p-6">
      <h2 className="mb-4 text-xl font-semibold">Request Admin Access</h2>
      <form onSubmit={handleSubmit} className="space-y-4" autoComplete="off">
        <div>
          <Input
            type="password"
            placeholder="Enter admin password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <Button type="submit" disabled={verifyAccess.isPending}>
          {verifyAccess.isPending ? "Verifying..." : "Verify Access"}
        </Button>
      </form>
    </Card>
  );
};
