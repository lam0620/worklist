"use client";
import { useTranslation } from "@/i18n";
import { useState, useEffect } from "react";
interface DetailInforProps {
  pid: string;
}

const DetailInfor = ({ pid }: DetailInforProps) => {
  const [t, setT] = useState(() => (key: string) => key);
  useEffect(() => {
    const loadTranslation = async () => {
      const { t } = await useTranslation("worklist");
      setT(() => t);
    };
    loadTranslation();
  }, []);

  return (
    <div className="w-1/6 mx-auto border-l-4 border-color-col text-base">
      <div className="inboxlist  rounded-t">
        <div className="flex justify-between items-center backgroundcolor-box">
          <span className="flex p-2 text-left justify-start">
            {t("Detail Information")}
          </span>
        </div>
      </div>
      <div className="p-4 space-y-4 inboxlist">
        <div className="">
          <h3 className="font-semibold border-b pb-2 ">Patient Information</h3>
          <p>Patient: NGÔ THỊ PHỤC (PID: 230080212)</p>
          <p>DOB: 01/01/1970, Sex: Female</p>
        </div>
        <div className="">
          <h3 className="font-semibold border-b pb-2">Order Information</h3>
          <p>Accession#: 2402120250731, Order Date: 29/10/2024 07:46</p>
          <p>Ordering Phys: Nguyễn Hoàng Quý</p>
          <p>Indication: U ác của vú</p>
        </div>
        <div className="flex justify-between">
          <div>
            <h4 className="font-semibold ">Procedure</h4>
            <p>Siêu âm Doppler tim</p>
          </div>
          <div>
            <h4 className="font-semibold ">Status</h4>
            <p>Scheduled</p>
          </div>
        </div>
        <div>
          <h4 className="font-semibold">Report</h4>
        </div>
      </div>
    </div>
  );
};
export default DetailInfor;
