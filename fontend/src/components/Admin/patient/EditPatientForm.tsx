import { useState, useEffect } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { UpdatePatient } from "@/services/apiService";

import { toast } from "react-toastify";
import { showErrorMessage } from "@/utils/showMessageError";
import { PatientDetailProps } from "@/app/types/PatientDetail";
import Link from "next/link";
import { useTranslation } from "../../../i18n";

interface EditPatientFormProps {
  patients: PatientDetailProps[];
  patient: any;
  onEdit: (patient: any) => any;
  onClose: () => any;
}

const EditPatientForm = ({
  patients,
  patient,
  onEdit,
  onClose,
}: EditPatientFormProps) => {
  const { t } = useTranslation("patientManagement");
  const [fullname, setFullName] = useState(patient.fullname);
  const [gender, setGender] = useState(patient.gender);
  const [dob, setDob] = useState(patient.dob);
  const [address, setAddress] = useState(patient.address);
  const [tel, setTel] = useState(patient.tel);
  const [insurance_no, setInsuranceNo] = useState(patient.insurance_no);
  const [pid, setPid] = useState(patient.pid);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "application/json",
      },
    };

    let data = {
      fullname: fullname,
      gender: gender,
      dob: dob,
      address: address,
      tel: tel,
      insurance_no: insurance_no,
      pid: pid,
    };
    try {
      const response = await UpdatePatient(patient.id, data, config);

      if (response?.data.result.status === "NG") {
        const code = response?.data?.result?.code;
        const item = response?.data?.result?.item;
        const msg = response?.data?.result?.msg;
        const message = showErrorMessage(code, item, msg);
        toast.error(message);
      } else {
        onEdit({
          ...patient,
          fullname: fullname,
          gender: gender,
          dob: dob,
          address: address,
          tel: tel,
          insurance_no: insurance_no,
          pid: pid,
        });
        toast.success(t("Patient updated successfully"));
        window.location.href = "/admin/patients";
      }
    } catch (error: any) {
      console.error(error);
      const code = error?.response?.data?.result?.code;
      const item = error?.response?.data?.result?.item;
      const message = showErrorMessage(code, item);
      toast.error(message);
    }
  };
  const validateForm = () => {
    let errors: { [key: string]: string } = {};
    if (!fullname) {
      errors.fullname = t("Full name is required");
    }
    if (!gender) {
      errors.gender = t("Gender is required");
    }
    if (!dob) {
      errors.dob = t("DOB is required");
    }
    if (!address) {
      errors.address = t("Address is required");
    }
    if (!tel) {
      errors.tel = t("Tel is required");
    }
    if (!insurance_no) {
      errors.insurance_no = t("Insurance No is required");
    }
    if (!pid) {
      errors.pid = t("PID is required");
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };
  const handleCancel = () => {
    onClose();
  };

  const pidPatients: string[] = patients.map((patient) => patient.pid);

  const handlePidChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setPid(value);
    if (pidPatients.includes(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        pid: t("PID exists"),
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, pid: "" }));
    }
  };
  return (
    <>
      <Dialog.Root open onOpenChange={onClose}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
          <Dialog.Title className="text-xl font-bold mb-4">
            {t("Edit Patient")}
          </Dialog.Title>
          <form>
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Patient ID")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.pid ? "border-red-500" : ""
                }`}
                value={pid}
                onChange={handlePidChange}
              />
            </div>
            {errors.pid && <p className="text-red-500 text-sm">{errors.pid}</p>}

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Full Name")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.fullname ? "border-red-500" : ""
                }`}
                value={fullname}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {errors.fullname && (
              <p className="text-red-500 text-sm">{errors.fullname}</p>
            )}
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Gender")}
              </label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                } rounded`}
              >
                <option value="">{t("")}</option>
                <option value="M">{t("Male")}</option>
                <option value="F">{t("Female")}</option>
                <option value="O">{t("Other")}</option>
                <option value="U">{t("Unknow")}</option>
              </select>
            </div>

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("DOB")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.dob ? "border-red-500" : ""
                }`}
                value={dob}
                onChange={(e) => setDob(e.target.value)}
              />
            </div>
            {errors.dob && <p className="text-red-500 text-sm">{errors.dob}</p>}
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Address")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.address ? "border-red-500" : ""
                }`}
                value={address}
                onChange={(e) => setAddress(e.target.value)}
              />
            </div>
            {errors.address && (
              <p className="text-red-500 text-sm">{errors.address}</p>
            )}
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Tel")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.tel ? "border-red-500" : ""
                }`}
                value={tel}
                onChange={(e) => setTel(e.target.value)}
              />
            </div>
            {errors.tel && <p className="text-red-500 text-sm">{errors.tel}</p>}
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Insurance Number")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.insurance_no ? "border-red-500" : ""
                }`}
                value={insurance_no}
                onChange={(e) => setInsuranceNo(e.target.value)}
              />
            </div>
            {errors.insurance_no && (
              <p className="text-red-500 text-sm">{errors.insurance_no}</p>
            )}

            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded-md"
                onClick={handleCancel}
              >
                {t("Cancel")}
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={handleSave}
              >
                {t("Save")}
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default EditPatientForm;
