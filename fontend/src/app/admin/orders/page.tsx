"use client";

import { useUser } from "@/context/UserContext";
import { useRouter } from "next/navigation";
import React, { useState, useEffect, useCallback } from "react";
import OrdersList from "@/components/Admin/order/OrderList";
import { fetchOrdersList } from "@/services/apiService";
import withLoading from "@/components/withLoading";
import AppLayout from "@/components/AppLayout";
import { PERMISSIONS } from "@/utils/constant";
import { OrderDetailProps } from "@/app/types/OrderDetail";
import { toast } from "react-toastify";
import { useTranslation } from "../../../i18n/client";
import CreateOrderButton from "@/components/Admin/order/CreateOrderButton";

const OrdersPage = () => {
  const { user } = useUser();
  const [orders, setOrders] = useState<OrderDetailProps[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedOrders, setSelectedOrders] = useState<{
    [key: string]: boolean;
  }>({});
  const router = useRouter();
  const { t } = useTranslation("orderManagement");

  useEffect(() => {
    if (user) {
      fetchOrders(currentPage, searchQuery);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, currentPage, searchQuery]);

  const fetchOrders = async (page: number, query: string) => {
    try {
      const response = await fetchOrdersList({ page, search: query });
      setOrders(response.data?.data);
      console.log("1", response.data?.data);
      setTotalPages(
        Math.ceil(response.data?.count / response?.data?.page_size)
      );
    } catch (error: any) {
      if (error.response?.status === 403) {
        toast.error(t("You don't have permission to view orders"));
        router.back();
      } else {
        toast.error(t("Failed to fetch orders"));
        router.back();
      }
    }
  };

  const handleOrderSelect = (orderId: string) => {
    router.push(`/admin/orders/${orderId}`);
  };

  const handleOrderCreate = (newOrder: OrderDetailProps) => {
    setOrders((prevOrders) => {
      const updatedOrders = [newOrder, ...prevOrders];
      if (updatedOrders.length > 10) {
        updatedOrders.pop();
      }
      return updatedOrders;
    });
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  const debounce = (func: Function, wait: number) => {
    let timeout: ReturnType<typeof setTimeout>;
    return (...args: any[]) => {
      clearTimeout(timeout);
      timeout = setTimeout(() => func(...args), wait);
    };
  };

  const debouncedSearch = useCallback(
    debounce((query: string) => {
      setSearchQuery(query);
    }, 1000),
    []
  );

  const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    debouncedSearch(event.target.value);
  };

  const handleOrderCheck = (orderId: string, checked: boolean) => {
    setSelectedOrders((prev) => ({ ...prev, [orderId]: checked }));
  };

  const hasDeleteOrderPermission =
    user?.permissions?.includes(PERMISSIONS.DELETE_ORDER) || user?.is_superuser;
  const hasAddOrderPermission =
    user?.permissions?.includes(PERMISSIONS.ADD_ORDER) || user?.is_superuser;

  return (
    <AppLayout name={t("Orders")}>
      <div className="flex flex-col items-center justify-center min-h-screen w-full">
        <div className="w-full">
          <div className="flex justify-between items-center mb-4">
            <div className="flex gap-2 relative">
              <button
                className="bg-gray-400 rounded px-4 py-2 text-white"
                onClick={() => router.push("/home")}
              >
                {t("Home")}
              </button>
              {hasAddOrderPermission && (
                <CreateOrderButton
                  onOrderCreated={() => fetchOrders(currentPage, searchQuery)}
                  onClose={() => {}}
                />
              )}
            </div>
          </div>
          <input
            type="text"
            placeholder={t("Search orders...")}
            onChange={handleSearchChange}
            className="mb-4 p-2 border-2 rounded "
          />
          <OrdersList
            orders={orders}
            onSelectOrder={handleOrderSelect}
            onSelectOrderForDelete={handleOrderCheck}
            orderPermissions={user?.permissions}
            isAdminUser={hasAddOrderPermission}
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            selectedOrders={selectedOrders}
          />
        </div>
      </div>
    </AppLayout>
  );
};

export default withLoading(OrdersPage);
