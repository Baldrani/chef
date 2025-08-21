"use client";

import { useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { useLocale } from "next-intl";
import Loader from "@/app/components/Loader";

export default function TripPageRedirect() {
    const params = useParams<{ tripId: string }>();
    const router = useRouter();
    const locale = useLocale();
    const tripId = params?.tripId;

    useEffect(() => {
        if (tripId) {
            // Redirect to the localized version of the page
            router.replace(`/${locale}/trips/${tripId}`);
        }
    }, [tripId, locale, router]);

    return (
        <div className="max-w-6xl mx-auto p-6">
            <Loader size="lg" text="Redirecting to localized page..." className="py-20" />
        </div>
    );
}