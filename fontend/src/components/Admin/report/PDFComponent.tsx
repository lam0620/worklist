// components/PDFComponent.tsx
import React, { forwardRef } from "react";
import { ReportDetailProps } from "@/app/types/ReportDetail";

interface PDFComponentProps {
  report: ReportDetailProps | null;
}

const PDFComponent = forwardRef<HTMLDivElement, PDFComponentProps>(
  ({ report }, ref) => {
    return (
      <div ref={ref}>
        {/* Nội dung in */}
        <h1>{report?.patient.fullname}</h1>
        <p>{report?.accession_no}</p>
        {/* Thêm nội dung khác nếu cần */}
      </div>
    );
  }
);

PDFComponent.displayName = "PDFComponent";

export default PDFComponent;
