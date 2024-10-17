"use client";
import { useTranslation } from "../../../i18n/client";
import { PatientDetailProps } from "@/app/types/PatientDetail";
import { getGenderLabel } from "@/utils/utils";

interface Props {
  patient: PatientDetailProps | null;
}
const PatientDetail = ({ patient }: Props) => {
  const { t } = useTranslation("patientManagement");
  const formatDate = (dateString: any) => {
    if (!dateString) return "";
    const year = dateString.slice(0, 4);
    const month = dateString.slice(4, 6);
    const day = dateString.slice(6, 8);
    return `${day}-${month}-${year}`;
  };
  return (
    <div className="flex flex-col items-start justify-center min-h-8 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <form className="space-y-6">
          {[
            { label: t("Patient ID"), value: patient?.pid },
            { label: t("Patient Name"), value: patient?.fullname },

            { label: t("Gender"), value: getGenderLabel(patient?.gender) },
            { label: t("DOB"), value: formatDate(patient?.dob) },
            { label: t("Address"), value: patient?.address },
            { label: t("Tel"), value: patient?.tel },
            { label: t("Insurance Number"), value: patient?.insurance_no },
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

export default PatientDetail;
