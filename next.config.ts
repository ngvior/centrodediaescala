import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	experimental: {
		serverActions: {
			// The default 1MB body limit is shared by the image and the form's text
			// fields, so a 1MB image (see MAX_IMAGE_SIZE_BYTES in src/lib/images.ts)
			// would still overflow it. 2MB leaves headroom for the rest of the body.
			bodySizeLimit: "2mb",
		},
	},
	images: {
		remotePatterns: [
			{
				protocol: "https",
				hostname: "*.supabase.co",
				pathname: "/storage/v1/object/public/cms-images/**",
			},
		],
	},
};

export default nextConfig;
