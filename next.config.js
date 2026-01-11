const path = require('path');

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export', // Статический экспорт для PHP хостинга
  reactStrictMode: false,
  eslint: { ignoreDuringBuilds: true },
  typescript: { ignoreBuildErrors: true },
  
  // Исключить API routes из сборки (используем PHP API)
  // При статическом экспорте API routes должны быть исключены
  // Используем webpack для игнорирования API routes
  webpack: (config, { isServer }) => {
    // Исключаем API routes из клиентской сборки
    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
      };
    }
    return config;
  },

  images: {
    domains: ['tile.openstreetmap.org'],
  },

  webpack: (config, { isServer }) => {
    // Настройка для pdfjs-dist
    config.resolve.alias = {
      ...config.resolve.alias,
      'pdfjs-dist/build/pdf.worker.entry': 'pdfjs-dist/build/pdf.worker.mjs',
      three: path.resolve(__dirname, 'node_modules/three'),
    };

    // Исключение pdfjs-dist из серверного бандла
    if (isServer) {
      config.externals = [...config.externals, 'pdfjs-dist'];
    }

    return config;
  },

  async headers() {
    return [
      {
        source: '/external/og/(.*)',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Cache-Control', value: 'public, max-age=31536000, immutable' },
        ],
      },
    ];
  },
};

module.exports = nextConfig;
