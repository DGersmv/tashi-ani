/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: false,
  
  // Добавляем поддержку статических ресурсов OpenGlobus
  async headers() {
    return [
      {
        source: '/external/og/(.*)',
        headers: [
          { 
            key: 'Access-Control-Allow-Origin', 
            value: '*' 
          },
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable'
          }
        ]
      }
    ]
  },
  
  // Оптимизация изображений
  images: {
    domains: ['tile.openstreetmap.org'],
  },
  
  // Настройка вебпака для статических ресурсов
  webpack: (config) => {
    config.module.rules.push({
      test: /\.(png|jpg|gif|svg|json)$/,
      type: 'asset/resource',
      generator: {
        filename: 'static/[hash][ext][query]'
      }
    });
    
    return config;
  }
};

module.exports = nextConfig;