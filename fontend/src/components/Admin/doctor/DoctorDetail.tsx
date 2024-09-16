"use client";

import { DoctorDetailProps } from "@/app/types/DoctorDetail";
import { Checkbox } from "@radix-ui/themes";
import { getGenderLabel } from "@/utils/utils";
import Link from "next/link";
import { DeleteImageDoctor } from "@/services/apiService";
import { toast } from "react-toastify";
import { useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";

const apiUrl = process.env.NEXT_PUBLIC_API_BASE_URL || "";

interface Props {
  doctor: DoctorDetailProps | null;
}

const DoctorDetail = ({ doctor }: Props) => {
  // let urlImage = process.env.NEXT_PUBLIC_DICOM_VIEWER_URL
  //   ? process.env.NEXT_PUBLIC_DICOM_VIEWER_URL
  //   : "http://localhost";
  // urlImage = urlImage + doctor?.sign;
  //doan tren dung, chi can cau hinh lai thoi.

  const baseUrl = new URL(apiUrl).origin;
  const a = doctor?.sign;
  const urlImage = `${baseUrl}${a}`;

  const [sign, setSign] = useState(doctor?.sign);
  const [showDeleteSignPopup, setShowDeleteSignPopup] = useState(false);

  const onDeleteSign = async () => {
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };

    const response = await DeleteImageDoctor(doctor?.id, config);
    if (response.status == 200 && response.data?.result?.status === "OK") {
      toast.success("Sign deleted successfully");
      setSign("");
    } else {
      toast.error("Failed to delete sign");
    }
  };

  const handleDelete = () => {
    setShowDeleteSignPopup(true);
  };
  const confirmPopup = () => {
    setShowDeleteSignPopup(false);
    onDeleteSign();
  };

  const closePopup = () => {
    setShowDeleteSignPopup(false);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-8 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <form className="space-y-6">
          {[
            { label: "Username", value: doctor?.username },
            { label: "Doctor's code", value: doctor?.doctor_no },
            { label: "Full name", value: doctor?.fullname },
            { label: "Title", value: doctor?.title },
            { label: "Gender", value: getGenderLabel(doctor?.gender) },
            {
              label: "Type",
              value:
                doctor?.type === "R" ? "Radiologist" : "Referring Physician",
            },
            {
              label: "Sign",
              value: sign ? (
                <div className="flex items-center justify-between">
                  <div></div>
                  <img
                    src={urlImage}
                    style={{ height: "40px" }}
                    className="mr-4"
                  />
                  <Link href={""} onClick={handleDelete} title="Delete sign">
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      style={{ fill: "none", cursor: "pointer" }}
                      width="24"
                      height="24"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      className="lucide lucide-trash-2"
                    >
                      <path d="M3 6h18" />
                      <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
                      <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
                      <line x1="10" x2="10" y1="11" y2="17" />
                      <line x1="14" x2="14" y1="11" y2="17" />
                    </svg>
                  </Link>
                </div>
              ) : null,
            },
            {
              label: "Active",
              value: (
                <Checkbox
                  checked={doctor?.is_active}
                  className="border-2 border-gray-400 rounded-sm h-4 w-4"
                />
              ),
            },
          ].map((field, index) => (
            <div key={index} className="flex items-center">
              <label className="w-1/3 font-medium text-right">
                {field.label}
              </label>
              <div className="flex-1 border rounded p-3 bg-gray-50 ml-4">
                {field.value}
              </div>
            </div>
          ))}
          <Dialog.Root open={showDeleteSignPopup}>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold mb-4">
                Delete Sign
              </Dialog.Title>
              <p>Are you sure you want to delete sign ?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={closePopup}
                >
                  No
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                  onClick={confirmPopup}
                >
                  Yes
                </button>
              </div>
            </Dialog.Content>
          </Dialog.Root>
        </form>
      </div>
    </div>
  );
};

export default DoctorDetail;
