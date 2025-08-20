"use client";

import { useParams } from "next/navigation";
import { useRouter } from "@/i18n/navigation";
import { useSession } from "next-auth/react";
import { useEffect } from "react";
import Loader from "@/app/components/Loader";

export default function JoinPage() {
    const params = useParams<{ token: string }>();
    const router = useRouter();
    const { status } = useSession();
    const token = (params?.token as string) || "";

    // Always redirect to associate flow (requires authentication)
    useEffect(() => {
        if (status === "loading") return;
        router.push(`/associate/${token}`);
    }, [status, router, token]);

    // Always show redirecting since we redirect everyone to associate flow
    return (
        <div className="max-w-md mx-auto p-6">
            <Loader size="lg" text="Redirecting..." className="py-20" />
        </div>
    );
}
