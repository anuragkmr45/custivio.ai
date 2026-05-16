/** @type {import('next').NextConfig} */
const nextConfig = {
  serverExternalPackages: ["@valkey/valkey-glide"],
  transpilePackages: [
    "@enterprise-inventory/cache",
    "@enterprise-inventory/config",
    "@enterprise-inventory/core",
    "@enterprise-inventory/db",
    "@enterprise-inventory/storage",
    "@enterprise-inventory/telemetry",
  ],
};

export default nextConfig;
