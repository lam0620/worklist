"use client";

import React, { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import UserList from "@/components/Admin/user/UserList";
import CreateUserButton from "@/components/Admin/user/CreateUserButton";
import { useUser } from "@/context/UserContext";
import { fetchAccounts } from "@/services/apiService";
import DeleteUserButton from "@/components/Admin/user/DeleteUserButton";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { toast } from "react-toastify";
import CreateRoleButton from "@/components/Admin/role/CreateRoleButton";

const UserListPage = () => {
  const { user } = useUser();
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedUsers, setSelectedUsers] = useState<{
    [key: string]: boolean;
  }>({});
  const router = useRouter();

  useEffect(() => {
    if (user) {
      fetchUsers(currentPage, searchQuery).then((r) => r);
    }
  }, [user, currentPage, searchQuery]);

  const fetchUsers = async (page: number, query: string) => {
    try {
      const response = await fetchAccounts({ page: page, search: query });
      setUsers(response.data?.data);
      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error("You don't have permission to view users");
        router.back();
      } else {
        toast.error("Failed to fetch users");
        router.back();
      }
    }
  };

  const handleUserSelect = (userId: string) => {
    router.push(`/admin/users/${userId}`);
  };

  const hasAddUserPermission =
    user?.permissions?.includes(PERMISSIONS.ADD_ACCOUNT) || user?.is_superuser;

  const hasDeleteUserPermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_ACCOUNT) ||
    user?.is_superuser;

  const hasAddRolePermission =
    user?.permissions?.includes(PERMISSIONS.ADD_GROUP) || user?.is_superuser;

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const handleUserCheck = (userId: string, checked: boolean) => {
    setSelectedUsers((prev) => ({ ...prev, [userId]: checked }));
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

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  return (
    <AppLayout name="Users">
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full max-w-7xl p-4">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-400 rounded px-4 py-2 text-white"
                onClick={() => router.push("/home")}
              >
                Home
              </button>
              {hasDeleteUserPermission && (
                <DeleteUserButton
                  isMany={true}
                  userIds={Object.keys(selectedUsers).filter(
                    (userId) => selectedUsers[userId]
                  )}
                  onUserDeleted={() => fetchUsers(1, searchQuery)}
                  isDisabled={
                    Object.keys(selectedUsers).filter(
                      (userId) => selectedUsers[userId]
                    ).length === 0
                  }
                />
              )}
              {hasAddUserPermission && (
                <CreateUserButton
                  onUserCreated={() => fetchUsers(currentPage, searchQuery)}
                  onClose={() => {}}
                />
              )}
              {hasAddRolePermission && <CreateRoleButton onCreate={() => {}} />}
            </div>
          </div>
          <input
              type="text"
              placeholder="Search users..."
              onChange={handleSearchChange}
              className="mb-4 p-2 border rounded"
            />
          <UserList
            users={users}
            onSelectUser={handleUserSelect}
            onSelectUserForDelete={handleUserCheck}
            userPermissions={user?.permissions}
            isAdminUser={user?.is_superuser}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            selectedUsers={selectedUsers}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default UserListPage;
