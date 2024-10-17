"use client";

import { useEffect, useState } from "react";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { PERMISSIONS } from "@/utils/constant";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";
import LoadingSpinner from "@/components/LoadingSpinner";
import { useUser } from "@/context/UserContext";
import { useTranslation } from "../../../../i18n/client";
import { OrderDetailProps } from "@/app/types/OrderDetail";
import { fetchOrderById } from "@/services/apiService";
import OrderDetail from "@/components/Admin/order/OrderDetail";
import DeleteOrderButton from "@/components/Admin/order/DeleteOrderButton";

const OrderDetailPage = () => {
  const { user } = useUser();
  const param = useParams<{ id: UUID }>();
  const [orderDetail, setOrderDetail] = useState<OrderDetailProps>();
  const router = useRouter();
  const { t } = useTranslation("orderManagement");

  useEffect(() => {
    if (param.id && user) {
      fetchOrderDetail();
    }
  }, [param.id, user]);

  const fetchOrderDetail = async () => {
    try {
      const response = await fetchOrderById(param.id);
      setOrderDetail(response.data?.data);
    } catch (error: any) {
      if (error.response && error.response.status === 404) {
        router.push("/404");
      }
    }
  };
  const HandleUpdateUse = (order: any) => {
    setOrderDetail(order);
  };

  if (!orderDetail) {
    return <LoadingSpinner />;
  }

  const hasEditPermission =
    user?.permissions?.includes(PERMISSIONS.EDIT_ORDER) || user?.is_superuser;
  const hasDeletePermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_ORDER) || user?.is_superuser;
  return (
    <AppLayout name={t("Order Detail")}>
      <div className="relative flex flex-col items-center min-h-screen p-4">
        <div className="w-full max-w-2xl text-center">
          <div className="absolute left-4 top-4">
            <button
              className="bg-gray-400 rounded px-4 py-2 text-white"
              onClick={() => router.push("/admin/orders")}
            >
              {t("Back to order list")}
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
              {/* {hasEditPermission && (
                <EditDoctorButton
                  doctorDetail={doctorDetail}
                  onDoctorUpdated={HandleUpdateUse}
                />
              )} */}
              {/* {hasDeletePermission && (
                <DeleteOrderButton
                  isMany={false}
                  orderId={param.id}
                  onOrderDeleted={() => router.push("/admin/orders")}
                />
              )} */}
            </div>
          )}
          <div>
            <OrderDetail order={orderDetail} />
          </div>
        </div>
      </div>
    </AppLayout>
  );
};
export default OrderDetailPage;
