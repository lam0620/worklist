"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import UserDetail from "@/components/Admin/user/UserDetail";
import { fetchAccountById } from "@/services/apiService";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { PERMISSIONS } from "@/utils/constant";
import EditUserButton from "@/components/Admin/user/EditUserButton";
import DeleteUserButton from "@/components/Admin/user/DeleteUserButton";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { UserDetailProps } from "@/app/types/UserDetail";
import { useTranslation } from "../../../../i18n/client";

const UserDetailPage = () => {
  const { user } = useUser();
  const param = useParams<{ id: UUID }>();
  const [userDetail, setUserDetail] = useState<UserDetailProps>();
  const router = useRouter();

  const { t } = useTranslation("userManagement");

  useEffect(() => {
    if (param.id) {
      fetchUserDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param.id]);

  const fetchUserDetail = async () => {
    try {
      const response = await fetchAccountById(param.id);
      setUserDetail(response.data?.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        router.push("/404");
      }
    }
  };

  const HandleUpdateUse = (user: any) => {
    setUserDetail(user);
  };

  if (!userDetail) {
    return <LoadingSpinner />;
  }
  const hasEditPermission =
    user?.permissions?.includes(PERMISSIONS.EDIT_ACCOUNT) || user?.is_superuser;
  const hasDeletePermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_ACCOUNT) ||
    user?.is_superuser;
  return (
    <AppLayout name={t("User Detail")}>
      <div className="relative flex flex-col items-center min-h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="absolute left-4 top-4">
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white"
              onClick={() => router.push("/admin/users")}
            >
              {t("Back to user list")}
            </button>
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white ml-4"
              onClick={() => router.push("/home")}
            >
              {t("Home")}
            </button>
          </div>

          {user && (
            <div
              className="top-4 right-4 absolute flex items-center space-x-4"
              style={{ right: "100px" }}
            >
              {hasDeletePermission && (
                <DeleteUserButton
                  isMany={false}
                  userId={param.id}
                  onUserDeleted={() => router.push("/admin/users")}
                />
              )}
              {hasEditPermission && (
                <>
                  <EditUserButton
                    userDetail={userDetail}
                    onUserUpdated={HandleUpdateUse}
                  />
                </>
              )}
            </div>
          )}
          <div>
            <UserDetail user={userDetail} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default UserDetailPage;
