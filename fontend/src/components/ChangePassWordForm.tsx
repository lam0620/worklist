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
        <input
          id="newPassword"
          name="newPassword"
          type="password"
          value={newPassword}
          onChange={(e) => setNewPassword(e.target.value)}
          className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 ${
            errors.newPassword ? "border-red-500" : "border-gray-300"
          } rounded `}
        />
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
        <input
          id="confirmNewPassword"
          name="confirmNewPassword"
          type="password"
          value={confirmNewPassword}
          onChange={(e) => setConfirmNewPassword(e.target.value)}
          className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.confirmNewPassword ? "border-red-500" : "border-gray-300"
          } rounded `}
        />
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
