"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import RolesList from "@/components/Admin/role/RolesList";
import CreateRoleButton from "@/components/Admin/role/CreateRoleButton";
import { fetchRolesList } from "@/services/apiService";
import DeleteRoleButtons from "@/components/Admin/role/DeleteRoleButtons";
import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { RoleDetailProps } from "@/app/types/RoleDetail";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n/client";
const RolesPage = () => {
  const { user } = useUser();
  const [roles, setRoles] = useState<RoleDetailProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedRoles, setSelectedRoles] = useState<{
    [key: string]: boolean;
  }>({});

  const router = useRouter();
  const { t } = useTranslation("roleManagement");

  useEffect(() => {
    if (user) {
      fetchRoles(currentPage, searchQuery).then((r) => r);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, searchQuery]);

  const fetchRoles = async (page: number, query: string) => {
    try {
      const response = await fetchRolesList({ page: page, search: query });
      setRoles(response.data?.data);
      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view roles"));
        router.back();
      } else {
        toast.error(t("Failed to fetch roles"));
        router.back();
      }
    }
  };

  const handleRoleSelect = (roleId: string) => {
    router.push(`/admin/roles/${roleId}`);
  };

  const handleRoleCreate = (newRole: RoleDetailProps) => {
    setRoles((prevRoles) => {
      const updatedRoles = [newRole, ...prevRoles];
      if (updatedRoles.length > 10) {
        updatedRoles.pop();
      }
      return updatedRoles;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleRoleDelete = async () => {
    try {
      const roleIds = Object.keys(selectedRoles).filter(
        (roleId) => selectedRoles[roleId]
      );
      if (roleIds.length === 0) {
        return;
      }
      await fetchRoles(1, searchQuery);
      setSelectedRoles({});
    } catch (error) {
      console.error(t("Failed to delete roles:"), error);
    }
  };

  const handleRoleCheck = (roleId: string, checked: boolean) => {
    setSelectedRoles((prev) => ({ ...prev, [roleId]: checked }));
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 1000),
    []
  );

  const hasDeleteRolePermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_GROUP) || user?.is_superuser;

  const hasAddRolePermission =
    user?.permissions?.includes(PERMISSIONS.ADD_GROUP) || user?.is_superuser;

  return (
    <AppLayout name={t("Roles")}>
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full text-xs md:text-base">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-400 rounded px-4 py-2 text-white"
                onClick={() => router.push("/home")}
              >
                {t("Home")}
              </button>
              {hasDeleteRolePermission && (
                <div className="md:block hidden">
                  <DeleteRoleButtons
                    isMany={true}
                    roleIds={Object.keys(selectedRoles).filter(
                      (roleId) => selectedRoles[roleId]
                    )}
                    onRoleDeleted={handleRoleDelete}
                    isDisabled={
                      Object.keys(selectedRoles).filter(
                        (roleId) => selectedRoles[roleId]
                      ).length === 0
                    }
                  />
                </div>
              )}
              {hasAddRolePermission && (
                <CreateRoleButton onCreate={handleRoleCreate} user={user} />
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder={t("Search roles...")}
            onChange={handleSearchChange}
            className="mb-4 p-2 border-2 rounded "
          />
          <RolesList
            roles={roles}
            onSelectRole={handleRoleSelect}
            onSelectRoleForDelete={handleRoleCheck}
            userPermissions={user?.permissions}
            isAdminUser={hasAddRolePermission}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            selectedRoles={selectedRoles}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default withLoading(RolesPage);
