"use client";
import React, { useState } from "react";
import { toast } from "react-toastify";
import { ChangePassword } from "../services/apiService";
import { useRouter } from "next/navigation";
import { useUser } from "@/context/UserContext";
import { showErrorMessage } from "@/utils/showMessageError";

const ChangePasswordForm = () => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const router = useRouter();
  const { logout } = useUser();
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const response = await ChangePassword({
        old_password: currentPassword,
        password: newPassword,
        confirm_password: confirmNewPassword,
      });
      if (response.status === 200) {
        toast.success("Password changed successfully");
        router.push("/login");
        logout();
      }
    } catch (error: any) {
      const msg = error.response.data?.result?.msg;
      const item = error.response.data?.result?.item || null;
      const message = showErrorMessage(msg, item);
      toast.error(message);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!currentPassword) {
      newErrors.currentPassword = "Current password is required";
    }
    if (!newPassword) {
      newErrors.newPassword = "New password is required";
    }
    if (!confirmNewPassword) {
      newErrors.confirmNewPassword = "Confirm new password is required";
    }
    if (newPassword !== confirmNewPassword) {
      newErrors.confirmNewPassword = "Passwords do not match";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Change password</h2>
      <div>
        <label
          htmlFor="currentPassword"
          className="block text-sm font-medium text-gray-700"
        >
          Current password
        </label>
        {/* <div className="relative">
          <input
            id="currentPassword"
            name="currentPassword"
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 ${
              errors.currentPassword ? "border-red-500" : "border-gray-300"
            } rounded `}
          />
        </div> */}
        <div className="relative">
          <input
            type={showCurrentPassword ? "text" : "password"}
            id="currentPassword"
            name="currentPassword"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 ${
              errors.currentPassword ? "border-red-500" : "border-gray-300"
            } rounded `}
          />
          <button
            type="button"
            onClick={() => setShowCurrentPassword(!showCurrentPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {" "}
            {showCurrentPassword ? (
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#ffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                  stroke="#1C274C"
                  strokeWidth="1.5"
                />
              </svg>
            ) : (
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#ffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                  stroke="#000000"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.currentPassword && (
          <p className="text-red-500 text-sm">{errors.currentPassword}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="newPassword"
          className="block text-sm font-medium text-gray-700"
        >
          New password
        </label>
        {/* <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 ${
            errors.newPassword ? "border-red-500" : "border-gray-300"
          } rounded `}
        /> */}
        <div className="relative">
          <input
            type={showNewPassword ? "text" : "password"}
            id="newPassword"
            name="newPassword"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 ${
              errors.currentPassword ? "border-red-500" : "border-gray-300"
            } rounded `}
          />
          <button
            type="button"
            onClick={() => setShowNewPassword(!showNewPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {" "}
            {showNewPassword ? (
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#ffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                  stroke="#1C274C"
                  strokeWidth="1.5"
                />
              </svg>
            ) : (
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#ffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                  stroke="#000000"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.newPassword && (
          <p className="text-red-500 text-sm">{errors.newPassword}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="confirmNewPassword"
          className="block text-sm font-medium text-gray-700"
        >
          New password (Confirm)
        </label>
        {/* <input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.confirmNewPassword ? "border-red-500" : "border-gray-300"
          } rounded `}
        /> */}
        <div className="relative">
          <input
            type={showConfirmPassword ? "text" : "password"}
            id="confirmNewPassword"
            name="confirmNewPassword"
            value={confirmNewPassword}
            onChange={(e) => setConfirmNewPassword(e.target.value)}
            className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 ${
              errors.currentPassword ? "border-red-500" : "border-gray-300"
            } rounded `}
          />
          <button
            type="button"
            onClick={() => setShowConfirmPassword(!showConfirmPassword)}
            className="absolute right-3 top-1/2 transform -translate-y-1/2"
          >
            {" "}
            {showConfirmPassword ? (
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#ffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M3.27489 15.2957C2.42496 14.1915 2 13.6394 2 12C2 10.3606 2.42496 9.80853 3.27489 8.70433C4.97196 6.49956 7.81811 4 12 4C16.1819 4 19.028 6.49956 20.7251 8.70433C21.575 9.80853 22 10.3606 22 12C22 13.6394 21.575 14.1915 20.7251 15.2957C19.028 17.5004 16.1819 20 12 20C7.81811 20 4.97196 17.5004 3.27489 15.2957Z"
                  stroke="#000"
                  strokeWidth="1.5"
                />
                <path
                  d="M15 12C15 13.6569 13.6569 15 12 15C10.3431 15 9 13.6569 9 12C9 10.3431 10.3431 9 12 9C13.6569 9 15 10.3431 15 12Z"
                  stroke="#1C274C"
                  strokeWidth="1.5"
                />
              </svg>
            ) : (
              <svg
                width="24px"
                height="24px"
                viewBox="0 0 24 24"
                fill="#ffff"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M2.99902 3L20.999 21M9.8433 9.91364C9.32066 10.4536 8.99902 11.1892 8.99902 12C8.99902 13.6569 10.3422 15 11.999 15C12.8215 15 13.5667 14.669 14.1086 14.133M6.49902 6.64715C4.59972 7.90034 3.15305 9.78394 2.45703 12C3.73128 16.0571 7.52159 19 11.9992 19C13.9881 19 15.8414 18.4194 17.3988 17.4184M10.999 5.04939C11.328 5.01673 11.6617 5 11.9992 5C16.4769 5 20.2672 7.94291 21.5414 12C21.2607 12.894 20.8577 13.7338 20.3522 14.5"
                  stroke="#000000"
                  stroke-width="2"
                  stroke-linecap="round"
                  stroke-linejoin="round"
                />
              </svg>
            )}
          </button>
        </div>
        {errors.confirmNewPassword && (
          <p className="text-red-500 text-sm">{errors.confirmNewPassword}</p>
        )}
      </div>

      <div className="flex justify-end space-x-4">
        <button
          type="button"
          className="px-4 py-2 text-sm font-medium text-white bg-gray-600 rounded-md hover:bg-gray-700"
          onClick={() => router.back()}
        >
          Cancel
        </button>
        <button
          type="submit"
          className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700"
        >
          Update
        </button>
      </div>
    </form>
  );
};

export default ChangePasswordForm;
