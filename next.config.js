//** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,

  // включаем статический экспорт
  output: 'export',

  // игнорим ESLint-ошибки на прод-сборке
  eslint: { ignoreDuringBuilds: true },

  // заголовки для статических ресурсов OpenGlobus из /public/external/og/...
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

  // домены для next/image (карты/тайлы и пр.)
  images: {
    domains: ['tile.openstreetmap.org'],
    // при экспорте нужно отключить оптимизацию
    unoptimized: true,
  },

  /*
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpe?g|gif|svg)$/i,
      type: 'asset/resource',
      generator: { filename: 'static/[hash][ext][query]' },
    });
    return config;
  },
  */
};

module.exports = nextConfig;

