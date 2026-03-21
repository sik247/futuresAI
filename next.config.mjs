/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { hostname: "nkkuehjtdudabogzwibw.supabase.co" },
      { hostname: "resources.cryptocompare.com" },
      { hostname: "images.cryptocompare.com" },
      { hostname: "**.cryptocompare.com" },
    ],
  },
  async redirects() {
    return [
      {
        source: '/',
        destination: '/en',
        permanent: false,
      },
    ];
  },
};

export default nextConfig;
