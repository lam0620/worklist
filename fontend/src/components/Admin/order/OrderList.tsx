"use client";
import { PERMISSIONS } from "@/utils/constant";
import { Checkbox } from "@radix-ui/themes";
import { OrderDetailProps } from "@/app/types/OrderDetail";
import { useTranslation } from "../../../i18n/client";

interface OrdersListProps {
  orders: OrderDetailProps[];
  onSelectOrder: (orderId: string) => void;
  onSelectOrderForDelete: (orderId: string, selected: boolean) => void;
  orderPermissions: string[];
  isAdminUser: boolean;
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
  selectedOrders: { [key: string]: boolean };
}

const OrdersList = ({
  orders,
  onSelectOrder,
  onSelectOrderForDelete,
  orderPermissions,
  currentPage,
  totalPages,
  onPageChange,
  selectedOrders,
  isAdminUser,
}: OrdersListProps) => {
  const { t } = useTranslation("orderManagement");

  const handlePageChange = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      onPageChange(page);
    }
  };

  const hasDeletePermission =
    (orderPermissions ?? []).includes(PERMISSIONS.DELETE_ORDER) || isAdminUser;

  const hasViewPermission =
    (orderPermissions ?? []).includes(PERMISSIONS.VIEW_ORDER) || isAdminUser;

  return (
    <div className="flex flex-col min-h-screen w-full">
      <div className="flex items-center justify-between p-2 border-b bg-gray-100">
        <div className="w-1/12 font-semibold text-center"></div>
        <div className="w-1/12 font-semibold text-center">
          {t("Accession Number")}
        </div>
        <div className="w-2/12 font-semibold text-center">
          {t("Request Phys")}
        </div>
        <div className="w-1/12 font-semibold text-center">{t("PID")}</div>
        <div className="w-2/12 font-semibold text-center">
          {t("Patient Name")}
        </div>
        <div className="w-1/12 font-semibold text-center">{t("Modality")}</div>
        <div className="w-2/12 font-semibold text-center">
          {t("Created Time")}
        </div>
        <div className="w-1/12 font-semibold text-center">{t("Procedure")}</div>
        <div className="w-1/12 font-semibold text-center">
          {t("Report Status")}
        </div>
      </div>
      {hasViewPermission && (
        <ul className="flex-grow">
          {orders.map((order) => (
            <li
              key={order.id}
              className="flex items-center justify-between p-2 border-b"
            >
              <div className="w-1/12 text-center">
                <div className="flex items-center justify-center">
                  {hasDeletePermission && (
                    <Checkbox
                      checked={!!selectedOrders[order.accession_no]}
                      onCheckedChange={(checked) =>
                        onSelectOrderForDelete(
                          order.accession_no,
                          checked as boolean
                        )
                      }
                      className="border-2 border-gray-400 rounded-sm h-4 w-4"
                    />
                  )}
                </div>
              </div>
              <div
                className="w-1/12 cursor-pointer text-center"
                onClick={() => onSelectOrder(order.id)}
              >
                {order.accession_no}
              </div>
              <div className="w-2/12 flex flex-wrap gap-1 justify-center">
                {order.referring_phys_name}
              </div>
              <div className="w-1/12 flex flex-wrap gap-1 justify-center">
                {order.patient.pid}
              </div>
              <div className="w-2/12 flex flex-wrap gap-1 justify-center">
                {order.patient.fullname}
              </div>
              <div className="w-1/12 flex flex-wrap gap-1 justify-center">
                {order.modality_type}
              </div>
              <div className="w-2/12 flex flex-wrap gap-1 justify-center">
                {order.created_time}
              </div>
              <div className="w-2/12 text-center">
                {order.procedures?.map((procedure, index) => (
                  <div
                    key={procedure.proc_id}
                    className={`grid grid-cols-2 gap-4 border-b border-gray-300 ${
                      index === (order.procedures?.length ?? 0) - 1
                        ? "border-b-0"
                        : ""
                    }`}
                  >
                    <span className="my-2">
                      {"["}
                      {procedure.code}
                      {"]"} {procedure.name}
                    </span>
                    <div className="my-2">
                      {procedure.report &&
                      procedure.report.id &&
                      (procedure.report.status === "F" ||
                        procedure.report.status === "C") ? (
                        <a
                          href={`/admin/reports/${procedure.report.id}`}
                          className="text-blue-500 underline"
                        >
                          {t("Reported")}
                        </a>
                      ) : (
                        <span>{t("Not Yet")}</span>
                      )}
                    </div>
                  </div>
                ))}
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
            {[...Array(totalPages)].map((_, index) => (
              <button
                key={index}
                onClick={() => handlePageChange(index + 1)}
                className={`px-4 py-2 mx-1 rounded-md ${
                  index + 1 === currentPage
                    ? "bg-blue-500 text-white"
                    : "bg-gray-200"
                }`}
              >
                {index + 1}
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

export default OrdersList;
