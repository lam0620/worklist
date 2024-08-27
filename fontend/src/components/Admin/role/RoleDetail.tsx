"use client";
import * as Avatar from "@radix-ui/react-avatar";
import { RoleDetailProps } from "@/app/types/RoleDetail";

interface Props {
  role: RoleDetailProps | null;
}

const RoleDetail = ({ role }: Props) => {
  return (
    <div className="flex flex-col items-center justify-center min-h-8 px-4">
      <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
        <form className="space-y-6">
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Role Name</label>
            <div className="border rounded p-3 bg-gray-50">{role?.name}</div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Description</label>
            <div className="border rounded p-3 bg-gray-50">
              {role?.description}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Permissions</label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(role?.permissions) &&
                role.permissions.map((permission) => (
                  <span
                    key={permission.id}
                    className="bg-blue-500 text-white rounded-full px-3 py-1 text-sm"
                  >
                    {permission.name}
                  </span>
                ))}
            </div>
          </div>
          <div className="flex flex-col">
            <label className="mb-2 font-medium">Users</label>
            <div className="flex flex-wrap gap-2">
              {Array.isArray(role?.users) &&
                role.users.map((user) => (
                  <div
                    key={user.id}
                    className="flex items-center px-3 py-1 bg-gray-200 rounded-full"
                  >
                    <Avatar.Root className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-gray-400 text-white mr-2">
                      <Avatar.Fallback
                        style={{ backgroundColor: user.avatar_color }}
                        className="w-8 h-8 rounded-full flex items-center justify-center text-lg"
                      >
                        {`${user.first_name.charAt(0)}${user.last_name.charAt(
                          0
                        )}`}
                      </Avatar.Fallback>
                    </Avatar.Root>
                    <span>{`${user.first_name} ${user.last_name}`}</span>
                  </div>
                ))}
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default RoleDetail;
