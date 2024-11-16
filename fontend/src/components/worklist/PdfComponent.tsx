import { useTranslation } from "react-i18next";
import React, { useState, useEffect, useRef, forwardRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode.react";
import logo from "../../../public/images/org_logo.png";
import "./PdfComponent.css";
import * as Util from "@/utils/utils";
import Image from "next/image";
interface BarcodeProps {
  value: string;
  format?: string;
}
interface PDFReportComponentProps {
  reportInf: any;
}
const Barcode: React.FC<BarcodeProps> = ({ value, format = "CODE128" }) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const setBarcodeRef = (ref: SVGSVGElement | null) => {
    if (ref) {
      JsBarcode(ref, value, { format });
      barcodeRef.current = ref;
    }
  };
  return <svg ref={setBarcodeRef} />;
};

const today = new Date();
const day = today.getDate().toString().padStart(2, "0"); // Định dạng ngày có 2 chữ số
const month = (today.getMonth() + 1).toString().padStart(2, "0"); // Định dạng tháng có 2 chữ số (lưu ý tháng bắt đầu từ 0)
const year = today.getFullYear();

const PDFReportComponent = forwardRef<HTMLDivElement, PDFReportComponentProps>(
  (props, ref) => {
    const { reportInf } = props;
    const { t } = useTranslation("Report");

    const [sign, setSign] = useState("");

    // Error when select the Print template, fixed by using useEffect()
    // import(`../../assets/signs/` + reportData.radiologist.sign).then((image) =>
    //   setSign(image.default)
    // );
    const [url, setUrl] = useState("");
    useEffect(() => {
      if (typeof window !== "undefined") {
        setUrl(window.location.href);
      }
    }, []);

    const margin = "40px";
    const marginTop = "20px";
    const marginBottom = "10px";
    const getPageMargins = () => {
      return `@page { margin: ${marginTop} ${margin} ${marginBottom} ${margin} !important; }`;
      //return `@page {size: A4}`;
    };

    // useEffect(() => {
    //   const fetchSign = async () => {
    //     const response = await import(`../../assets/signs/${reportInf.radiologist.sign}`);
    //     setSign(response.default);
    //   };
    //   fetchSign();

    //   //signs are uploaded to /media/signs/... (define in nginx)
    //   //sign = signs/xxx.yyy
    //   setSign(Util.getImageUrl + reportInf?.radiologist.sign);
    // }, [sign]);

    return (
      <>
        <div className="print-section border" id="pdf-report" ref={ref}>
          <style>{getPageMargins()}</style>

          {/* Header */}
          <div className="header">
            <Image src={logo} alt="Logo" />
            <div className="clinic-info mt-0">
              <h3 className="font-bold text-red-500">
                {process.env.NEXT_PUBLIC_ORG_NAME}
              </h3>
              <p style={{ fontSize: "12px" }}>
                {process.env.NEXT_PUBLIC_ORG_ADDR}
              </p>
              <p style={{ fontSize: "12px" }}>
                Hotline: {process.env.NEXT_PUBLIC_ORG_TEL}
              </p>
            </div>
          </div>
          <div className="title-barcode border">
            <h1 className="title">
              PHIẾU KẾT QUẢ {Util.getFullModalityType(reportInf?.modality_type)}
            </h1>
            <div className="mr-2 border text-center">
              <div className="barcode">
                {reportInf?.patient.pid && (
                  <Barcode value={reportInf?.patient.pid} />
                )}
              </div>
              <div className="translateX">{reportInf?.patient.pid}</div>
            </div>
          </div>

          {/* Body */}
          <div className="patient-info">
            <div>
              <p>
                Họ tên:{' '}
                <span className="font-semibold">
                  {reportInf?.patient.fullname}
                </span>
              </p>
              <p>
                Năm sinh:{' '}
                <span className="font-semibold">
                  {Util.formatYear(reportInf?.patient.dob)}
                </span>
              </p>
              <p>
                Giới tính:{' '}
                <span className="font-semibold">
                  {Util.getFullGender_vn(reportInf?.patient.gender)}
                </span>
              </p>
            </div>
            <div>
              <p>Địa chỉ: {reportInf?.patient.address}</p>
              <p className="whitespace-nowrap">
                Điện thoại: {reportInf?.patient.tel}
              </p>
            </div>
            <p>Chẩn đoán: {reportInf?.clinical_diagnosis}</p>
            <p>Bác sĩ chỉ định: {reportInf?.referring_phys_name}</p>
            <p className="text-red-600">
              Vùng yêu cầu chụp: {reportInf?.procedure.name}
            </p>
            <p className="mt-4 text-red-600">KỸ THUẬT:</p>
            <p
              className="text-justify"
              dangerouslySetInnerHTML={{ __html: reportInf?.scan_protocol }}
            ></p>
            <p className="mt-4 text-red-600">MÔ TẢ HÌNH ẢNH:</p>
            <p
              className="text-justify"
              dangerouslySetInnerHTML={{ __html: reportInf?.findings }}
            ></p>
            <p className="mt-4 text-red-600">KẾT LUẬN:</p>
            <p
              className="text-justify font-semibold"
              dangerouslySetInnerHTML={{ __html: reportInf?.conclusion }}
            ></p>
          </div>

          {/* Footer */}
          <div className="footer flex items-end justify-between">
            <div className="mb-0 border">
              <QRCode
                value={url}
                className="mb-0"
                imageSettings={{
                  src: logo.src,
                  excavate: true,
                  height: 25,
                  width: 25,
                }}
              />
            </div>
            <div>
              <div className="mr-4 mb-0 border text-center">
                <p>
                  Ngày {day} tháng {month} năm {year}
                </p>
                <p className="font-semibold">Bác sĩ</p>
                <div className="flex justify-center">
                  {/* <Image src={sign} alt="Sign" height="150" width="150" /> */}
                </div>
                <p className="font-semibold">
                  {reportInf?.radiologist.title}.
                  {reportInf?.radiologist.fullname}
                </p>
              </div>
            </div>
          </div>
        </div>
      </>
    );
  }
);
export default PDFReportComponent;
