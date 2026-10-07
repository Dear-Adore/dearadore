/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
      },
    ],
  },
  async redirects() {
    return [
      {
        source: '/profile',
        destination: '/',
        permanent: true,
      },
      {
        source: '/beranda',
        destination: '/',
        permanent: true,
      },
      {
        source: '/account',
        destination: '/akun',
        permanent: true,
      },
      {
        source: '/login',
        destination: '/akun',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
