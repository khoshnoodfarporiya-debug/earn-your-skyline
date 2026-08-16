import path from "node:path";
import { fileURLToPath } from "node:url";
import type { NextConfig } from "next";

/**
 * Turbopack walks upward looking for a lockfile to infer the workspace root.
 * There is one in the user's home directory, so it would otherwise treat the
 * whole home folder as the project — it declines, and warns.
 *
 * Pinning the root to this file's own directory fixes it without hardcoding
 * anyone's absolute path, so the repository stays portable.
 */
const projectRoot = path.dirname(fileURLToPath(import.meta.url));

const nextConfig: NextConfig = {
  reactStrictMode: true,
  turbopack: {
    root: projectRoot,
  },
};

export default nextConfig;
