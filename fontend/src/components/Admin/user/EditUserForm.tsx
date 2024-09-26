import { useEffect, useState } from "react";
import * as Dialog from "@radix-ui/react-dialog";
import { fetchRolesList, UpdateAccount } from "@/services/apiService";
import { toast } from "react-toastify";
import MultiSelect from "../../MultiSelect";
import { showErrorMessage } from "@/utils/showMessageError";

interface EditUserFormProps {
  user: any;
  onEdit: (user: any) => void;
  onClose: () => void;
}

const EditUserForm = ({ user, onEdit, onClose }: EditUserFormProps) => {
  const [firstName, setFirstName] = useState(user.first_name);
  const [lastName, setLastName] = useState(user.last_name);
  const [email, setEmail] = useState(user.email);
  const [userRoles, setUserRoles] = useState(
    user.roles.map((role: any) => role.id)
  );
  const [fullRoles, setFullRoles] = useState<any[]>([]);
  const [showUnsavedChangesPopup, setShowUnsavedChangesPopup] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetchRolesList({ isPage: false });
        setFullRoles(response?.data?.data);
      } catch (error: any) {
        const code = error?.response?.data?.result?.code;
        const item = error?.response?.data?.result?.item;
        const message = showErrorMessage(code, item);
        toast.error(message);
      }
    };

    fetchRoles();
  }, []);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const response = await UpdateAccount(user.id, {
        first_name: firstName,
        last_name: lastName,
        email,
        roles: userRoles,
      });

      if (response?.data.result.status === "NG") {
        const code = response?.data?.result?.code;
        const item = response?.data?.result?.item;
        const msg = response?.data?.result?.msg;
        const message = showErrorMessage(code, item, msg);
        toast.error(message);

      } else {
        const roles_obj = fullRoles.filter((role) => userRoles.includes(role.id));
        onEdit({
          ...user,
          first_name: firstName,
          last_name: lastName,
          email,
          roles: roles_obj,
        });

        toast.success("User updated successfully");
        onClose();
      }
    } catch (error: any) {
      const code = error?.response?.data?.result?.code;
      const item = error?.response?.data?.result?.item;
      const message = showErrorMessage(code, item);
      toast.error(message);
    }
  };

  const validateForm = () => {
    let errors: { [key: string]: string } = {};
    if (!firstName) {
      errors.firstName = "First name is required";
    }
    if (!lastName) {
      errors.lastName = "Last name is required";
    }
    // if (!email) {
    //   errors.email = "Email is required";
    // }
    if (userRoles.length === 0) {
      errors.roles = "Roles is required";
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

  return (
    <>
      <Dialog.Root open onOpenChange={onClose}>
        <Dialog.Overlay className="fixed inset-0 bg-black opacity-30" />
        <Dialog.Content className="fixed bg-white p-6 rounded-md shadow-md top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-full max-w-lg">
          <Dialog.Title className="text-xl font-bold mb-4">
            Edit User
          </Dialog.Title>
          <form>
            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4">First Name</label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.firstName ? "border-red-500" : ""
                }`}
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
              />
            </div>
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4">Last Name</label>
              <input
                type="text"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.lastName ? "border-red-500" : ""
                }`}
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
              />
            </div>
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}

            <div className="mb-4 flex items-center">
              <label className="block text-gray-700 w-1/4">Email</label>
              <input
                type="email"
                className={`w-3/4 px-3 py-2 border border-gray-300 rounded-md ${
                  errors.email ? "border-red-500" : ""
                }`}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}

            <div className={`mb-4 flex items-center ${errors.roles ? "border-red-500" : "border-gray-300"}`}>
              <label className="block text-gray-700 w-1/4">Roles</label>
              <div className="w-3/4">
                <MultiSelect
                  options={fullRoles}
                  selectedOptions={userRoles}
                  onChange={setUserRoles}
                  placeholder="Select roles"
                />
              </div>
            </div>
            {errors.roles && (
              <p className="text-red-500 text-sm">{errors.roles}</p>
            )}
            <div className="flex justify-end space-x-2">
              <button
                type="button"
                className="px-4 py-2 bg-gray-200 rounded-md"
                onClick={handleCancel}
              >
                Cancel
              </button>
              <button
                type="button"
                className="px-4 py-2 bg-blue-600 text-white rounded-md"
                onClick={handleSave}
              >
                Save
              </button>
            </div>
          </form>
        </Dialog.Content>
      </Dialog.Root>
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
              Cancel
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
    </>
  );
};

export default EditUserForm;
