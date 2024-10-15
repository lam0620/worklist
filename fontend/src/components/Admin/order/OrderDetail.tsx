"use client";

import { toast } from "react-toastify";

import ConfirmModal from "../../ConfirmModal";
import { useTranslation } from "../../../i18n/client";
import { OrderDetailProps } from "@/app/types/OrderDetail";

interface Props {
  order: OrderDetailProps | null;
}

const OrderDetail = ({ order }: Props) => {
  const { t } = useTranslation("orderManagement");

  return (
    <div className="flex flex-col items-center justify-center min-h-8 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <form className="space-y-6">
          {[
            { label: t("Accession Number"), value: order?.accession_no },
            {
              label: t("Procedure"),
              value: order?.procedures?.map((procedure) => (
                <span key={procedure.code}>{procedure.name}</span>
              )),
            },
            { label: t("Request Phys"), value: order?.referring_phys_name },
            {
              label: t("Clinical Diagnosis"),
              value: order?.clinical_diagnosis,
            },
            { label: t("Modality"), value: order?.modality_type },
            { label: t("PID"), value: order?.patient.pid },
            { label: t("Patient Name"), value: order?.patient.fullname },
            { label: t("Order Time"), value: order?.order_time },
          ].map((field, index) => (
            <div key={index} className="flex items-center">
              <label className="w-1/3 font-medium text-right">
                {field.label}
              </label>
              <div className="flex-1 border rounded p-3 bg-gray-50 ml-4">
                {Array.isArray(field.value) ? field.value : field.value}
              </div>
            </div>
          ))}
        </form>
      </div>
    </div>
  );
};

export default OrderDetail;
