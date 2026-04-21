module.exports = {
  apps: [
    {
      name: 'chapturs',
      // standalone output: Next.js copies everything needed into .next/standalone/.
      // Run server.js directly instead of 'next start' — lower memory, faster startup.
      script: '.next/standalone/server.js',
      // Explicit CWD so standalone server.js finds .env.production at /opt/chapturs/.env.production.
      // Without this, PM2 may use the script directory (.next/standalone/) as CWD and miss the env file,
      // causing DATABASE_URL and all other secrets to be undefined — empty DB results, broken auth.
      cwd: '/opt/chapturs',
      instances: 1, // single core — cluster mode does nothing useful here
      exec_mode: 'fork',
      node_args: '--max-old-space-size=1400', // hard cap Node.js heap at 1.4GB
      max_memory_restart: '1500M',            // PM2 auto-restarts if RSS hits 1.5GB
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        HOSTNAME: '0.0.0.0',
      },
      // Restart policy: don't spin-loop on a broken deploy
      restart_delay: 3000,
      max_restarts: 5,
      min_uptime: '10s',
      // Log rotation
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      merge_logs: true,
    },
  ],
}
