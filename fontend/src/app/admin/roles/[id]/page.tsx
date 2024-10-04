"use client";

import { useEffect, useState } from "react";
import { useUser } from "@/context/UserContext";
import RoleDetail from "@/components/Admin/role/RoleDetail";
import { fetchRoleById } from "@/services/apiService";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { PERMISSIONS } from "@/utils/constant";
import EditRoleButton from "@/components/Admin/role/EditRoleButton";
import DeleteRoleButtons from "@/components/Admin/role/DeleteRoleButtons";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { RoleDetailProps } from "@/app/types/RoleDetail";
import { useTranslation } from "../../../../i18n/client";

const RoleDetailPage = () => {
  const { user } = useUser();
  const param = useParams<{ id: UUID }>();
  const [roleDetail, setRoleDetail] = useState<RoleDetailProps>();
  const router = useRouter();

  const { t } = useTranslation("roleManagement");
  useEffect(() => {
    if (param.id) {
      fetchRoleDetail();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [param.id]);

  const fetchRoleDetail = async () => {
    try {
      const response = await fetchRoleById(param.id);
      setRoleDetail(response.data?.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        router.push("/404");
      }
    }
  };

  const handleRoleEdit = (roleEdit: RoleDetailProps) => {
    setRoleDetail(roleEdit);
  };

  if (!roleDetail) {
    return <LoadingSpinner />;
  }

  const hasEditPermission =
    user?.permissions?.includes(PERMISSIONS.EDIT_GROUP) || user?.is_superuser;
  const hasDeletePermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_GROUP) || user?.is_superuser;

  return (
    <AppLayout name={t("Role Detail")}>
      <div className="relative flex flex-col items-center min-h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="absolute left-4 top-4">
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white"
              onClick={() => router.push("/admin/roles")}
            >
              {t("Back to role list")}
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
                <DeleteRoleButtons
                  isMany={false}
                  roleId={param.id}
                  onRoleDeleted={() => router.push("/admin/roles")}
                />
              )}
              {hasEditPermission && (
                <>
                  <EditRoleButton
                    roleDetail={roleDetail}
                    onRoleUpdated={handleRoleEdit}
                    user={user}
                  />
                </>
              )}
            </div>
          )}
          <div>
            <RoleDetail role={roleDetail} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};

export default RoleDetailPage;
