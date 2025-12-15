import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default withWorkflow(nextConfig);
