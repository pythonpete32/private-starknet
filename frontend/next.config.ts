import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Based on noir-web-starter-next official repo
  transpilePackages: [
    '@noir-lang/noir_js',
    '@aztec/bb.js'
  ],
  
  reactStrictMode: false, // NoirJS compatibility
  
  webpack: (config, { isServer }) => {
    // Disable fs fallback for client-side (Noir requirement)
    config.resolve.fallback = { 
      fs: false,
      path: false,
      crypto: false 
    };
    
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
    
    // Exclude circuit files from server-side processing to prevent SSR issues
    if (isServer) {
      config.externals = config.externals || [];
      config.externals.push({
        '../circuits/account_system.json': 'commonjs ../circuits/account_system.json',
        '../circuits/commitment_system.json': 'commonjs ../circuits/commitment_system.json'
      });
    }
    
    return config;
  },
};

export default nextConfig;
