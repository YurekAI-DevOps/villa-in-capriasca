
/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turn off React StrictMode for now, as react-aria (used by Builder YurekAI)
  // has some troubles with it. See
  // https://github.com/adobe/react-spectrum/labels/strict%20mode
  output: 'export',
  basePath: 'YOUR_REPO_NAME',
  reactStrictMode: false,
};

module.exports = nextConfig;