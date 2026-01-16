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
        destination: 'http://api.abilliontestimoniesandmore.org/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
