import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Based on noir-web-starter-next official repo
  transpilePackages: [
    '@noir-lang/noir_js',
    '@aztec/bb.js'
  ],
  
  reactStrictMode: false, // NoirJS compatibility
  
  webpack: (config) => {
    // Disable fs fallback (NoirJS requirement)
    config.resolve.fallback = { fs: false };
    
    // Prioritize browser field for module resolution
    config.resolve.mainFields = ['browser', 'module', 'main'];
    
    // Handle WASM files
    config.module.rules.push({
      test: /\.wasm$/,
      type: 'asset/resource',
    });
    
    // Enable WebAssembly experiments
    config.experiments = {
      ...config.experiments,
      asyncWebAssembly: true,
      syncWebAssembly: true,
      layers: true,
    };
    
    return config;
  },
};

export default nextConfig;
