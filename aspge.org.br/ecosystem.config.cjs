module.exports = {
  apps: [{
    name: 'aspge-api',
    script: './server.js',
    cwd: '/var/www/aspge/app',
    instances: 'max',      // cluster mode: 1 processo por núcleo de CPU
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/var/www/aspge/logs/error.log',
    out_file: '/var/www/aspge/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    autorestart: true,
    watch: false,
    max_memory_restart: '500M'
  }]
};
