import { useState, useEffect } from "react";
import MultiSelect from "../../MultiSelect";
import { UUID } from "crypto";
import { CreateAccount, fetchRolesList } from "@/services/apiService";
import { toast } from "react-toastify";
import { showErrorMessage } from "@/utils/showMessageError";

interface Role {
  id: UUID;
  name: string;
  code: string;
}

const CreateUserModal = ({
  onClose,
  onUserCreated,
}: {
  onClose: () => void;
  onUserCreated: () => void;
}) => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState("");
  const [roles, setRoles] = useState<Role[]>([]);
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    const fetchRoles = async () => {
      try {
        const response = await fetchRolesList();
        setRoles(response?.data?.data);
      } catch (error) {
        console.error("Failed to fetch roles:", error);
      }
    };

    fetchRoles();
  }, []);

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const newUser = {
        username,
        password,
        first_name: firstName,
        last_name: lastName,
        email,
        roles: selectedRoles,
      };
      const response = await CreateAccount(newUser);
      if (response.status === 201) {
        toast.success("User created successfully");
        onUserCreated();
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
    if (!username) newErrors.username = "This field is required";
    if (!password) newErrors.password = "This field is required";
    if (!confirmPassword) newErrors.confirmPassword = "This field is required";
    if (password !== confirmPassword)
      newErrors.confirmPassword = "Passwords do not match";
    if (!firstName) newErrors.firstName = "This field is required";
    if (!lastName) newErrors.lastName = "This field is required";
    if (!email) {
      newErrors.email = "This field is required";
    } else if (!/\S+@\S+\.\S+/.test(email)) {
      newErrors.email = "Email is invalid";
    }
    if (selectedRoles.length === 0) {
      newErrors.roles = "Please select at least one role";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleCancel = () => {
    if (confirm("Are you sure you want to cancel?")) {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-96">
        <h2 className="text-2xl font-bold mb-4">Create User</h2>
        <form onSubmit={handleCreateUser} className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`mt-1 block w-full p-2 border ${
                errors.username ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {errors.username && (
              <p className="text-red-500 text-sm">{errors.username}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`mt-1 block w-full p-2 border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {errors.password && (
              <p className="text-red-500 text-sm">{errors.password}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`mt-1 block w-full p-2 border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm">{errors.confirmPassword}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">First Name</label>
            <input
              type="text"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className={`mt-1 block w-full p-2 border ${
                errors.firstName ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {errors.firstName && (
              <p className="text-red-500 text-sm">{errors.firstName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Last Name</label>
            <input
              type="text"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className={`mt-1 block w-full p-2 border ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {errors.lastName && (
              <p className="text-red-500 text-sm">{errors.lastName}</p>
            )}
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              type="text"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className={`mt-1 block w-full p-2 border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } rounded`}
            />
            {errors.email && (
              <p className="text-red-500 text-sm">{errors.email}</p>
            )}
          </div>
          <div>
            <label
              className={`block text-sm font-medium ${
                errors.lastName ? "border-red-500" : "border-gray-300"
              } `}
            >
              Roles
            </label>
            <MultiSelect
              options={roles}
              selectedOptions={selectedRoles}
              onChange={setSelectedRoles}
              placeholder="Select roles"
            />
            {errors.roles && (
              <p className="text-red-500 text-sm">{errors.roles}</p>
            )}
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
        </form>
      </div>
    </div>
  );
};

export default CreateUserModal;
