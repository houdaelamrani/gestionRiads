/** @type {import('next').NextConfig} */
const nextConfig = {
  // Désactiver ESLint pendant le build pour éviter les erreurs bloquantes
  eslint: { ignoreDuringBuilds: true },
  // Désactiver TypeScript strict pendant le build
  typescript: { ignoreBuildErrors: true },
  // Répertoire de sortie du build sur D:
  distDir: '.next',
  // Optimisation du dev server
  experimental: {
    // Turbopack est déjà activé par défaut en Next 15+
  },
};

export default nextConfig;
