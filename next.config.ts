import type { NextConfig } from "next";
import { withWorkflow } from "workflow/next";

const nextConfig: NextConfig = {
  images: {
    qualities: [75, 90],
  },
};

export default withWorkflow(nextConfig);
