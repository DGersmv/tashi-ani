// next.config.js
module.exports = {
  webpack: (config) => {
    config.resolve = config.resolve || {};
    config.resolve.fallback = { ...(config.resolve.fallback || {}), fs: false };

    
    return config;
  },
};
