import { useState, useEffect } from "react";
import { CreateDoctor } from "@/services/apiService";
import { toast } from "react-toastify";
import { showErrorMessage } from "@/utils/showMessageError";
import * as Dialog from "@radix-ui/react-dialog";
import { UUID } from "crypto";
import { useParams } from "next/navigation";
import { UserDetailProps } from "@/app/types/UserDetail";
import { DoctorDetailProps } from "@/app/types/DoctorDetail";

interface CreateDoctorFormProps {
  doctors: DoctorDetailProps[];
  users: UserDetailProps[];
  onClose: () => void;
  onDoctorCreated: () => void;
}

const CreateDoctorModal = ({
  doctors,
  users,
  onClose,
  onDoctorCreated,
}: CreateDoctorFormProps) => {
  const [doctorNo, setDoctorNo] = useState("");
  const [fullName, setFullName] = useState("");
  const [title, setTitle] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [showUnsavedChangesPopup, setShowUnsavedChangesPopup] = useState(false);
  const [type, setType] = useState("");
  const [userId, setUserId] = useState("");
  const [gender, setGender] = useState("");
  const param = useParams<{ id: UUID }>();
  const [id, setId] = useState("");
  const [image, setImage] = useState<File | undefined>(undefined);

  useEffect(() => {
    //get user_id
    if (param.id) {
      setId(param.id);
    }
  }, [param.id]);

  const handleCreateDoctor = async (e: React.FormEvent) => {
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

    try {
      const newDoctor = {
        fullname: fullName,
        type: type,
        user_id: userId,
        doctor_no: doctorNo,
        title: title,
        is_active: true,
        gender: gender,
        sign: image,
      };
      const response = await CreateDoctor(newDoctor, config);

      if (response?.data.result.status === "NG") {
        const code = response?.data?.result?.code;
        const item = response?.data?.result?.item;
        const msg = response?.data?.result?.msg;
        const message = showErrorMessage(code, item, msg);
        toast.error(message);
      } else {
        toast.success("Doctor created successfully");
        onDoctorCreated();
        onClose();
      }
    } catch (error: any) {
      const msg = error.response?.data?.result?.msg;
      const item = error.response?.data?.result?.item || null;
      const message = showErrorMessage(msg, item);
      toast.error(message);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!doctorNo) newErrors.doctorNo = "Doctor's code is required";
    if (!fullName) newErrors.fullName = "Full name is required";
    if (!type) newErrors.type = "Type is required";
    if (!gender) newErrors.gender = "Gender is required";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
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

  const handleUserChange = (e: any) => {
    const selectedUserId = e.target.value;
    setUserId(selectedUserId);

    const selectedUser = users.find((user) => user.id === selectedUserId);
    if (selectedUser) {
      setFullName(`${selectedUser.last_name} ${selectedUser.first_name}`);
    } else {
      setFullName("");
    }
  };
  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };

  const doctorNumbers: string[] = doctors.map((doctor) => doctor.doctor_no);

  const handleDoctorNoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setDoctorNo(value);
    if (doctorNumbers.includes(value)) {
      setErrors((prevErrors) => ({
        ...prevErrors,
        doctorNo: "Doctor No exists",
      }));
    } else {
      setErrors((prevErrors) => ({ ...prevErrors, doctorNo: "" }));
    }
  };
  return (
    <div
      className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center"
      style={{ zIndex: 1000 }}
    >
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Create Doctor</h2>
        <form onSubmit={handleCreateDoctor} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <select
              value={userId}
              className="w-full px-3 py-2 border border-gray-300 rounded-md"
              onChange={handleUserChange}
            >
              <option value="">...</option>
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
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium">FullName</label>
              <input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className={`mt-1 block w-full p-2 border ${
                  errors.fullName ? "border-red-500" : "border-gray-300"
                } rounded`}
              />
              {errors.fullName && (
                <p className="text-red-500 text-sm">{errors.fullName}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Doctor's code</label>
              <input
                type="text"
                value={doctorNo}
                onChange={handleDoctorNoChange}
                className={`mt-1 block w-full p-2 border ${
                  errors.doctorNo ? "border-red-500" : "border-gray-300"
                } rounded`}
              />
              {errors.doctorNo && (
                <p className="text-red-500 text-sm">{errors.doctorNo}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Title</label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className={`mt-1 block w-full p-2 border ${
                  errors.title ? "border-red-500" : "border-gray-300"
                } rounded`}
              />
              {errors.title && (
                <p className="text-red-500 text-sm">{errors.title}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className={`mt-1 block w-full p-2 border ${
                  errors.type ? "border-red-500" : "border-gray-300"
                } rounded`}
              >
                <option value="">...</option>
                <option value="P">Radiologist</option>
                <option value="R">Referring Physician</option>
              </select>
              {errors.type && (
                <p className="text-red-500 text-sm">{errors.type}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium">Gender</label>
              <select
                value={gender}
                onChange={(e) => setGender(e.target.value)}
                className={`mt-1 block w-full p-2 border ${
                  errors.gender ? "border-red-500" : "border-gray-300"
                } rounded`}
              >
                <option value="">...</option>
                <option value="M">Male</option>
                <option value="F">Female</option>
                <option value="O">Other</option>
                <option value="U">Unknow</option>
              </select>
              {errors.gender && (
                <p className="text-red-500 text-sm">{errors.gender}</p>
              )}
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Sign</label>
              <div className="border rounded p-1 overflow-hidden">
                <input
                  className="form-control w-full"
                  type="file"
                  name="image"
                  onChange={onFileChange}
                  // required
                />
              </div>
            </div>
          </div>
          <div className="flex justify-end space-x-2">
            <button
              type="button"
              onClick={handleCancel}
              className="bg-gray-500 text-white px-4 py-2 rounded hover:bg-gray-700"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Create
            </button>
          </div>
          <Dialog.Root open={showUnsavedChangesPopup}>
            <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
            <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-md">
              <Dialog.Title className="text-xl font-bold mb-4">
                Unsaved Changes
              </Dialog.Title>
              <p>Are you sure you want to discard your changes?</p>
              <div className="flex justify-end space-x-2 mt-4">
                <button
                  type="button"
                  className="px-4 py-2 bg-gray-200 rounded-md"
                  onClick={closeDiscardPopup}
                >
                  No
                </button>
                <button
                  type="button"
                  className="px-4 py-2 bg-red-600 text-white rounded-md"
                  onClick={confirmDiscardChanges}
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

export default CreateDoctorModal;
