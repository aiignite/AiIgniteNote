module.exports = {
  apps: [
    {
      name: 'ainote-backend',
      script: './packages/backend/dist/index.js',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'production',
        PORT: 3001,
      },
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      // 如果使用集群模式（多核 CPU），取消下面的注释
      // exec_mode: 'cluster',
      // instances: 'max',
    },
  ],
};
