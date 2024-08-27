"use client";

import withLoading from "@/components/withLoading";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

const HomePage = () => {
  const router = useRouter();

  return (
    <AppLayout name="Home">
      <div>
        {
          <div className="py-4 text-2xl">
            <h2
              className="hover: cursor-pointer"
              onClick={() => router.push("/chart")}
            >
              Chart
            </h2>
          </div>
        }
      </div>
    </AppLayout>
  );
};

export default withLoading(HomePage);
