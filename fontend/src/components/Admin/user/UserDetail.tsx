"use client";
import { UserDetailProps } from "@/app/types/UserDetail";

interface Props {
  user: UserDetailProps;
}

const UserDetail = ({ user }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-8  px-4">
      <div className="bg-white p-10 rounded shadow-md w-full max-w-md">
        <form className="space-y-6">
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Full Name</label>
            <div className="border rounded p-3 bg-gray-50">
              {user?.first_name} {user?.last_name}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Username</label>
            <div className="border rounded p-3 bg-gray-50">
              {user?.username}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Email</label>
            <div className="border rounded p-3 bg-gray-50">{user?.email}</div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Roles</label>
            <div className="flex flex-wrap gap-2">
              {user?.roles.map((role) => (
                <span
                  key={role.id}
                  className="bg-green-500 text-white rounded-full px-3 py-1 text-sm"
                >
                  {role.name}
                </span>
              ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default UserDetail;
