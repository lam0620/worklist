"use client";

import withLoading from "@/components/withLoading";
import { useRouter } from "next/navigation";
import AppLayout from "@/components/AppLayout";

const HomePage = () => {
  const router = useRouter();

  return (
    <AppLayout name="">
      <div>
        {
          <div className="py-4 text-2xl text-center">
            <h2>
              Welcome Home!
            </h2>
          </div>
        }
      </div>
    </AppLayout>
  );
};

export default withLoading(HomePage);
