"use client";
import React, { useState, useEffect } from "react";
import { UpdateProfile } from "../services/apiService";
import { toast } from "react-toastify";
import { useRouter } from "next/navigation";

const EditProfileForm = ({ user }: any) => {
  const router = useRouter();
  const [firstName, setFirstName] = useState(user?.first_name);
  const [lastName, setLastName] = useState(user?.last_name);
  const [email, setEmail] = useState(user?.email || "");
  const [role, setRole] = useState(user?.roles || []);

  const [errors, setErrors] = useState<{ [key: string]: string }>({});

  useEffect(() => {
    if (user) {
      setFirstName(user.first_name);
      setLastName(user.last_name);
      setEmail(user.email);
      setRole(user.roles);
      const isSuperUser = user?.is_superuser;
      if (isSuperUser) {
        setRole((role: any) => [...role, "super user"]);
      }
    }
  }, [user]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }
    try {
      const response = await UpdateProfile({
        first_name: firstName,
        last_name: lastName,
      });
      if (response.status === 200) {
        toast.success("Profile updated successfully");
      }
      router.push("/home");
    } catch (error) {
      console.error("Failed to update profile:", error);
    }
  };

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {};
    if (!firstName) {
      newErrors.firstName = "First name is required";
    }
    if (!lastName) {
      newErrors.lastName = "Last name is required";
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h2 className="text-xl font-bold">Edit profile</h2>

      <div>
        <label
          htmlFor="firstName"
          className="block text-sm font-medium text-gray-700"
        >
          First Name
        </label>
        <input
          id="firstName"
          name="firstName"
          type="text"
          value={firstName}
          onChange={(e) => setFirstName(e.target.value)}
          className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.firstName ? "border-red-500" : "border-gray-300"
          } rounded `}
        />
        {errors.firstName && (
          <p className="text-red-500 text-sm">{errors.firstName}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="lastName"
          className="block text-sm font-medium text-gray-700"
        >
          Last Name
        </label>
        <input
          id="lastName"
          name="lastName"
          type="text"
          value={lastName}
          onChange={(e) => setLastName(e.target.value)}
          className={`w-full px-3 py-2 mt-1 border rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 ${
            errors.lastName ? "border-red-500" : "border-gray-300"
          } rounded `}
        />
        {errors.lastName && (
          <p className="text-red-500 text-sm">{errors.lastName}</p>
        )}
      </div>

      <div>
        <label
          htmlFor="email"
          className="block text-sm font-medium text-gray-700"
        >
          Email
        </label>
        <input
          id="email"
          name="email"
          type="email"
          value={email}
          readOnly
          className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>

      <div>
        <label
          htmlFor="role"
          className="block text-sm font-medium text-gray-700"
        >
          Role
        </label>
        <input
          id="role"
          name="role"
          type="text"
          value={role}
          readOnly
          className="w-full px-3 py-2 mt-1 border rounded-md shadow-sm bg-gray-100 focus:ring-indigo-500 focus:border-indigo-500"
        />
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

export default EditProfileForm;
