"use client";
import ChangePasswordForm from "@/components/ChangePassWordForm";
import AppLayout from "@/components/AppLayout";

export default function ChangePasswordPage() {
  return (
    <AppLayout>
      <div className="flex items-center justify-center">
        <div className="w-full max-w-md p-8 space-y-8 bg-white rounded-md shadow-md">
          <ChangePasswordForm />
        </div>
      </div>
    </AppLayout>
  );
}
