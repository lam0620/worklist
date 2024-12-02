"use client";
import { PERMISSIONS } from "@/utils/constant";
import { Checkbox } from "@radix-ui/themes";
import { RoleDetailProps } from "@/app/types/RoleDetail";
import { useTranslation } from "../../../i18n/client";
import { useState, useEffect } from "react";
import "../../../app/worklist-tmp/worklist.css";

interface RolesListProps {
  roles: RoleDetailProps[];
  onSelectRole: (roleId: string) => void;
  onSelectRoleForDelete: (roleId: string, selected: boolean) => void;
  userPermissions: string[];
  isAdminUser: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedRoles: { [key: string]: boolean };
}

const RolesList = ({
  roles,
  onSelectRole,
  onSelectRoleForDelete,
  userPermissions,
  isAdminUser,
  currentPage,
  totalPages,
  onPageChange,
  selectedRoles,
}: RolesListProps) => {
  const { t } = useTranslation("roleManagement");

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const hasDeletePermission =
    (userPermissions ?? []).includes(PERMISSIONS.DELETE_GROUP) || isAdminUser;

  const isIntegRole = (detailRole: any) => {
    // Root, Integ or login user
    if (["Integration", "Administrator"].includes(detailRole.name)) {
      return true;
    }
    return false;
  };

  const hasViewPermission =
    (userPermissions ?? []).includes(PERMISSIONS.VIEW_REPORT) || isAdminUser;

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-100 text-xs md:text-base">
        <div className="w-1/12 font-semibold md:block hidden"></div>
        <div className="w-2/12 font-semibold flex justify-center md:justify-start">
          {t("Name")}
        </div>
        <div className="w-6/12 font-semibold flex ">{t("Permissions")}</div>
        <div className="w-3/12 font-semibold md:block hidden">
          {t("Date Created")}
        </div>
      </div>
      {hasViewPermission && (
        <ul className="flex-grow text-xs md:text-base">
          {roles.map((role) => (
            <li
              key={role.id}
              className="flex items-center md:justify-between py-2 pl-2 border-b mb-2"
            >
              <div className="w-1/12 md:block hidden">
                <div className="flex items-center justify-center">
                  {hasDeletePermission && !isIntegRole(role) && (
                    <Checkbox
                      checked={selectedRoles[role.id]}
                      onCheckedChange={(checked) =>
                        onSelectRoleForDelete(role.id, checked as boolean)
                      }
                      className="border-2 border-gray-400 rounded-sm h-4 w-4"
                    />
                  )}
                </div>
              </div>

              <div
                className="w-2/12 cursor-pointer"
                onClick={() => onSelectRole(role.id)}
              >
                {role.name}
              </div>
              <div className="ml-10 md:ml-0 md:w-6/12 flex flex-wrap gap-1 justify-center md:justify-start">
                {role.permissions?.map((permission) => (
                  <span
                    key={permission.id}
                    className="px-2 py-1 text-small md:text-base font-semibold text-white bg-green-500 rounded-full"
                  >
                    {permission.name}
                  </span>
                ))}
              </div>
              <div className="w-3/12 text-sm text-gray-500 md:block hidden">
                {new Date(role.created_at).toLocaleDateString()}
              </div>
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <div className="sticky bottom-0 bg-white py-4">
          <div className="flex justify-center">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              {t("Previous")}
            </button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => handlePageChange(page)}
                className={`px-4 py-2 mx-1 rounded-md ${
                  currentPage === page
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {page}
              </button>
            ))}
            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className="px-4 py-2 mx-1 bg-gray-200 rounded-md disabled:opacity-50"
            >
              {t("Next")}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default RolesList;
