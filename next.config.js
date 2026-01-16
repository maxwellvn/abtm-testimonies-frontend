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
        destination: 'http://t8ko4kk444go4sgsw4ccc0ss.102.219.189.97.sslip.io/api/:path*',
      },
    ]
  },
}

module.exports = nextConfig
