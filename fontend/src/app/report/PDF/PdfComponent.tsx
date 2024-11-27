import React, { useState, useEffect, useRef, forwardRef } from "react";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode.react";
import logo from "../../../../public/images/org_logo.png";
import customeLogo from "../../../../public/images/custom_logo.png";
import "./PdfComponent.css";
import Utils from "../../../utils/utils";
import * as Util from "../../../utils/utils";

interface PDFReportComponentProps {
  reportData: any;
  templateData: any;
}
interface BarcodeProps {
  value: string;
  format?: string;
}
const Barcode: React.FC<BarcodeProps> = ({ value, format = "CODE128" }) => {
  const barcodeRef = useRef<SVGSVGElement | null>(null);
  const setBarcodeRef = (ref: SVGSVGElement | null) => {
    if (ref && typeof window !== "undefined") {
      JsBarcode(ref, value, { format });
      barcodeRef.current = ref;
    }
  };
  return <svg ref={setBarcodeRef} />;
};

const today = new Date();
const day = today.getDate().toString().padStart(2, "0");
const month = (today.getMonth() + 1).toString().padStart(2, "0");
const year = today.getFullYear();

const PDFReportComponent = forwardRef<HTMLDivElement, PDFReportComponentProps>(
  (props, ref) => {
    const { reportData, templateData } = props;

    const [sign, setSign] = useState("");
    const [imageUrl, setImageUrl] = useState<string>(""); // State for `imageUrl`

    const margin = "40px";
    const marginTop = "20px";
    const marginBottom = "10px";
    const getPageMargins = () => {
      return `@page { margin: ${marginTop} ${margin} ${marginBottom} ${margin} !important; }`;
    };

    // Set the `sign` URL and handle `window.location` safely
    useEffect(() => {
      // Set the sign URL
      setSign(Utils.USER_MNG_URL + reportData.radiologist.sign);

      // Handle `window.location` safely for SSR
      if (typeof window !== "undefined") {
        const url = window.location.href;
        const replacedUrl = url.replace("report", "viewer");
        setImageUrl(replacedUrl); // Set the transformed URL
      }
    }, [reportData]);

    return (
      <>
        <div className="print-section border" id="pdf-report" ref={ref}>
          <style>{getPageMargins()}</style>

          {/* Header */}
          <div className="header">
            <img
              src={customeLogo.src}
              alt="Logo"
              style={{ height: "50px", width: "100px" }}
            />
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
              PHIẾU KẾT QUẢ {Util.getFullModalityType(reportData.modality_type)}
            </h1>
            <div className="mr-2 border text-center">
              <div className="barcode">
                <Barcode value={reportData.patient.pid} />
              </div>
              <div className="translateX">{reportData.patient.pid}</div>
            </div>
          </div>

          {/* Body */}
          <div className="patient-info">
            <div>
              <p>
                Họ tên:
                <span className="font-semibold">
                  {reportData.patient.fullname}
                </span>
              </p>
              <p>
                Năm sinh:
                <span className="font-semibold">
                  {Util.formatYear(reportData.patient.dob)}
                </span>
              </p>
              <p>
                Giới tính:
                <span className="font-semibold">
                  {Util.getFullGender_vn(reportData.patient.gender)}
                </span>
              </p>
            </div>
            <div>
              <p>Địa chỉ: {reportData.patient.address}</p>
              <p className="whitespace-nowrap">
                Điện thoại: {reportData.patient.tel}
              </p>
            </div>
            <p>Chẩn đoán: {reportData.clinical_diagnosis}</p>
            {templateData.value !== "0" && (
              <p>Bác sĩ chỉ định: {reportData.referring_phys.fullname}</p>
            )}
            <p className="text-red-600">
              Vùng yêu cầu chụp: {reportData.procedure.name}
            </p>
            <p className="mt-4 text-red-600">KỸ THUẬT:</p>
            <p
              className="text-justify"
              dangerouslySetInnerHTML={{
                __html: reportData.report.scan_protocol,
              }}
            ></p>
            <p className="mt-4 text-red-600">MÔ TẢ HÌNH ẢNH:</p>
            <p
              className="text-justify"
              dangerouslySetInnerHTML={{ __html: reportData.report.findings }}
            ></p>
            <p className="mt-4 text-red-600">KẾT LUẬN:</p>
            <p
              className="text-justify font-semibold"
              dangerouslySetInnerHTML={{ __html: reportData.report.conclusion }}
            ></p>
          </div>

          {/* Footer */}
          <div className="footer flex items-end justify-between">
            <div className="mb-0 border">
              {imageUrl && (
                <QRCode
                  value={imageUrl}
                  className="mb-0"
                  imageSettings={{
                    src: logo.src,
                    excavate: true,
                    height: 25,
                    width: 25,
                  }}
                />
              )}
            </div>
            <div>
              <div className="mr-4 mb-0 border text-center">
                <p>
                  Ngày {day} tháng {month} năm {year}
                </p>
                <p className="font-semibold">Bác sĩ</p>
                <div className="flex justify-center">
                  {/* <img src={sign} alt="Sign" width="150" /> */}
                </div>
                <p className="font-semibold">
                  {reportData.radiologist.title}.
                  {reportData.radiologist.fullname}
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
