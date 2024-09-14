"use client";

import { DoctorDetailProps } from "@/app/types/DoctorDetail";
import { Checkbox } from "@radix-ui/themes";
import { getGenderLabel } from "@/utils/utils";
import Link from "next/link";

interface Props {
  doctor: DoctorDetailProps | null;
}

const DoctorDetail = ({ doctor }: Props) => {
  const urlImage = process.env.NEXT_PUBLIC_DICOM_VIEWER_URL+doctor?.sign
  

  const onDeleteSign = () => {
    console.log('Delete sign')
  }

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
              value: doctor?.sign ? 
              <div className="flex items-center justify-between">
                <div></div>
                <img src={urlImage} style={{height:'40px'}} className="mr-4"/> 
                <Link href={''} onClick={onDeleteSign} title="Delete sign">
                  <svg xmlns="http://www.w3.org/2000/svg" style={{ fill: 'none',cursor:'pointer' }} width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="lucide lucide-trash-2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/><line x1="10" x2="10" y1="11" y2="17"/><line x1="14" x2="14" y1="11" y2="17"/></svg>
                </Link></div>
              : null,
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
        </form>
      </div>
    </div>
  );
};

export default DoctorDetail;
