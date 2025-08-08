import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";

// Point to the default request config file at ./i18n/request.ts
const withNextIntl = createNextIntlPlugin("./i18n/request.ts");

const nextConfig: NextConfig = {};

export default withNextIntl(nextConfig);
