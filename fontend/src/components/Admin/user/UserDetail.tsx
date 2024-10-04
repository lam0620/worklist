"use client";
import { UserDetailProps } from "@/app/types/UserDetail";
import { useTranslation } from "../../../i18n/client";
import { useState, useEffect } from "react";

interface Props {
  user: UserDetailProps;
}

const UserDetail = ({ user }: Props) => {
  const { t } = useTranslation("userManagement");

  return (
    <div className="flex flex-col items-center justify-center min-h-8 px-4">
      <div className="bg-white p-10 rounded shadow-md w-full max-w-md">
        <form className="space-y-6">
          <div className="flex items-center">
            <label className="w-1/3 font-medium">{t("Full Name")}</label>
            <div className="border rounded p-3 bg-gray-50 w-2/3">
              {user?.first_name} {user?.last_name}
            </div>
          </div>
          <div className="flex items-center">
            <label className="w-1/3 font-medium">{t("Username")}</label>
            <div className="border rounded p-3 bg-gray-50 w-2/3">
              {user?.username}
            </div>
          </div>
          <div className="flex items-center">
            <label className="w-1/3 font-medium">Email</label>
            <div className="border rounded p-3 bg-gray-50 w-2/3">
              {user?.email}
            </div>
          </div>
          <div className="flex items-center">
            <label className="w-1/3 font-medium">{t("Roles")}</label>
            <div className="flex flex-wrap gap-2 w-2/3">
              {user?.roles.map((role) => (
                <span
                  key={role.id}
                  className="bg-green-500 text-white rounded-full px-3 py-1 text-sm flex items-center"
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDetail;
