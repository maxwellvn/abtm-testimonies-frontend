/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'rhapsodyofrealities.abilliontestimoniesandmore.org',
        pathname: '/**',
      },
    ],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'https://api.abilliontestimoniesandmore.org/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
