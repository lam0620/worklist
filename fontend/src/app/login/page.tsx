"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ClipLoader } from "react-spinners";
import * as Toast from "@radix-ui/react-toast";
import Head from "next/head";
import { useUser } from "@/context/UserContext";
import { Login } from "@/services/apiService";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [toastMessage, setToastMessage] = useState("");
  const router = useRouter();
  const { login, logout } = useUser();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      const response = await Login({ username, password });
      if (response.status === 200) {
        const { access_token, refresh_token } = response.data?.data;
        logout();
        login(access_token, refresh_token);

        // router.push("/home");
        // Redirect to study list
        const currentUrl = new URL(`${process.env.DICOM_VIEWER_URL}/preworklist`);
        const urlParams = new URLSearchParams(currentUrl.search);

        const formattedDate = (new Date(Date.now() - (new Date()).getTimezoneOffset() * 60000))
                               .toISOString().slice(0, 10).replace(/-/g, "");
        urlParams.set('startDate', formattedDate);
        urlParams.set('key', access_token);
        currentUrl.search = urlParams.toString();
        
        router.push(currentUrl.toString());
      }
    } catch (error: any) {
      if (error.response && error.response.status === 400) {
        setToastMessage("Incorrect username or password");
      } else {
        setToastMessage("Login failed");
      }
      setOpen(true);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <Head>
        <title>Login</title>
      </Head>
      <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 px-4">
        <div className="bg-white p-8 rounded shadow-md w-full max-w-md">
          <h1 className="text-3xl font-bold mb-6 text-center">Login</h1>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="flex flex-col">
              <label className="mb-2 font-medium">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="border rounded p-3 w-full focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <div className="flex flex-col">
              <label className="mb-2 font-medium">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="border rounded p-3 w-full focus:outline-none focus:ring focus:border-blue-300"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-500 text-white rounded p-3 w-full flex items-center justify-center"
              disabled={isLoading}
            >
              {isLoading ? <ClipLoader color="white" size={24} /> : "Login"}
            </button>
          </form>
        </div>

        <Toast.Provider>
          <Toast.Root
            open={open}
            onOpenChange={setOpen}
            className="bg-red-500 text-white p-3 rounded shadow-lg"
          >
            <Toast.Title>{toastMessage}</Toast.Title>
          </Toast.Root>
          <Toast.Viewport className="fixed top-0 right-0 p-6 z-50" />
        </Toast.Provider>
      </div>
    </>
  );
};

export default LoginPage;
