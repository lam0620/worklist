import { useState, useEffect } from "react";
import { redirect } from "next/navigation";
import * as Dialog from "@radix-ui/react-dialog";
import { UpdateDoctor } from "@/services/apiService";
import { toast } from "react-toastify";
import { showErrorMessage } from "@/utils/showMessageError";
import { UserDetailProps } from "@/app/types/UserDetail";
import { DoctorDetailProps } from "@/app/types/DoctorDetail";
import Link from "next/link";
import { useTranslation } from "../../../i18n";

interface EditDoctorFormProps {
  doctors: DoctorDetailProps[];
  users: UserDetailProps[];
  doctor: any;
  onEdit: (doctor: any) => any;
  onClose: () => any;
  t: (key: string) => string;
}

const EditDoctorForm = ({
  doctors,
  users,
  doctor,
  onEdit,
  onClose,
  t,
}: EditDoctorFormProps) => {
  const [fullName, setFullName] = useState(doctor.fullname);
  const [title, setTitle] = useState(doctor.title);
  const [doctorNo, setDoctorNo] = useState(doctor.doctor_no);
  const [type, setType] = useState(doctor.type);
  const [showUnsavedChangesPopup, setShowUnsavedChangesPopup] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [gender, setGender] = useState(doctor.gender);
  const [userId, setUserId] = useState(doctor.user_id);
  const [image, setImage] = useState<File | undefined>(undefined);
  const [disabledSign, setDisabledSign] = useState(true);

  const urlImage = process.env.NEXT_PUBLIC_DICOM_VIEWER_URL + doctor?.sign;

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    const config = {
      headers: {
        Accept: "application/json",
        "Content-Type": "multipart/form-data",
      },
    };
    let data = {
      fullname: fullName,
      title: title,
      gender: gender,
      doctor_no: doctorNo,
      type: type,
      is_active: true,
      user_id: userId,
      sign: image,
    };

    // Remove sign if disabled
    if (disabledSign) {
      delete data["sign"];
    }

    try {
      const response = await UpdateDoctor(doctor.id, data, config);

      if (response?.data.result.status === "NG") {
        const code = response?.data?.result?.code;
        const item = response?.data?.result?.item;
        const msg = response?.data?.result?.msg;
        const message = showErrorMessage(code, item, msg);
        toast.error(message);
      } else {
        // if sign has image
        // if (image) {
        //   // Refresh screen to display sign
        //   window.location.reload();
        // }
        onEdit({
          ...doctor,
          fullname: fullName,
          title: title,
          gender: gender,
          doctor_no: doctorNo,
          type: type,
          is_active: true,
          user_id: userId,
          sign: image,
        });
        toast.success(t("Doctor updated successfully"));
        // onClose();
        window.location.href = "/admin/doctors";
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
    if (!fullName) {
      errors.fullName = t("Full name is required");
    }

    if (!doctorNo) {
      errors.doctorNo = t("Doctor's code is required");
    }

    setErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleCancel = () => {
    setShowUnsavedChangesPopup(true);
  };
  const confirmDiscardChanges = () => {
    setShowUnsavedChangesPopup(false);
    onClose();
  };

  const closeDiscardPopup = () => {
    setShowUnsavedChangesPopup(false);
  };

  const list = users.map((user) => ({
    label: `${user.last_name} ${user.first_name} <${user.username}>`,
    value: user.id,
  }));

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImage(file);
    }
  };

  const onEditSign = () => {
    setDisabledSign(!disabledSign);
  };

  const doctorNumbers: string[] = doctors.map((doctor) => doctor.doctor_no);

  const handleDoctorNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDoctorNo(value);
    if (doctorNumbers.includes(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        doctorNo: t("Doctor No exists"),
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, doctorNo: "" }));
    }
  };

  return (
    <>
      <Dialog.Root open onOpenChange={onClose}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
          <Dialog.Title className="text-xl font-bold mb-4">
            {t("Edit Doctor")}
          </Dialog.Title>
          <form>
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Username")}
              </label>
              <select
                value={userId}
                className="w-3/4 px-3 py-2 border border-gray-300 rounded-md"
                onChange={(e) => setUserId(e.target.value)}
              >
                <option value={doctor.user_id}>{doctor.username}</option>
                {list.map((user) => (
                  <option key={user.value} value={user.value}>
                    {user.label}
                  </option>
                ))}
              </select>
            </div>
            {errors.userId && (
              <p className="text-red-500 text-sm">{errors.userId}</p>
            )}
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Doctor's code")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.doctorNo ? "border-red-500" : ""
                }`}
                value={doctorNo}
                onChange={handleDoctorNoChange}
              />
            </div>
            {errors.doctorNo && (
              <p className="text-red-500 text-sm">{errors.doctorNo}</p>
            )}

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Full name")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.fullName ? "border-red-500" : ""
                }`}
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
              />
            </div>
            {errors.fullName && (
              <p className="text-red-500 text-sm">{errors.fullName}</p>
            )}

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Title")}
              </label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.title ? "border-red-500" : ""
                }`}
                value={title}
                onChange={(e) => setTitle(e.target.value)}
              />
            </div>
            {errors.title && (
              <p className="text-red-500 text-sm">{errors.title}</p>
            )}

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Sign")}
              </label>
              <div className="flex flex-row text-blue-600">
                <label className="ml-2">
                  {doctor?.sign ? (
                    <img src={urlImage} style={{ height: "40px" }} />
                  ) : (
                    ""
                  )}
                </label>
                <Link onClick={onEditSign} href={""} className="ml-4">
                  {disabledSign ? t("Edit") : t("Cancel Edit")}
                </Link>
              </div>
            </div>
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5"></label>
              {!disabledSign && (
                <input
                  className="w-3/4 px-3 py-2 border border-gray-300 rounded-md"
                  type="file"
                  name="image"
                  onChange={onFileChange}
                  // required
                />
              )}
            </div>
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
                <option value="M">{t("Male")}</option>
                <option value="F">{t("Female")}</option>
                <option value="O">{t("Other")}</option>
                <option value="U">{t("Unknow")}</option>
              </select>
            </div>

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4 text-right mr-5">
                {t("Type")}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.type ? "border-red-500" : "border-gray-300"
                } rounded`}
              >
                <option value="P">{t("Referring Physician")}</option>
                <option value="R">{t("Radiologist")}</option>
              </select>
            </div>

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
      <Dialog.Root open={showUnsavedChangesPopup}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
          <Dialog.Title className="text-xl font-bold mb-4">
            {t("Unsaved Changes")}
          </Dialog.Title>
          <p>{t("Are you sure you want to discard your changes?")}</p>
          <div className="flex justify-end space-x-2 mt-4">
            <button
              type="button"
              className="px-4 py-2 bg-gray-200 rounded-md"
              onClick={closeDiscardPopup}
            >
              {t("Cancel")}
            </button>
            <button
              type="button"
              className="px-4 py-2 bg-red-600 text-white rounded-md"
              onClick={confirmDiscardChanges}
            >
              {t("Yes")}
            </button>
          </div>
        </Dialog.Content>
      </Dialog.Root>
    </>
  );
};

export default EditDoctorForm;
