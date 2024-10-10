"use client";
import React from "react";
import EditProfileForm from "@/components/EditProfileForm";
import { useUser } from "@/context/UserContext";
import AppLayout from "@/components/AppLayout";
import { useTranslation } from "../../../i18n";

const EditProfilePage = () => {
  const { user } = useUser();
  return (
    <AppLayout>
      <div className="min-h flex justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 p-10 bg-white rounded-xl shadow-md">
          <EditProfileForm user={user} />
        </div>
      </div>
    </AppLayout>
  );
};

export default EditProfilePage;
