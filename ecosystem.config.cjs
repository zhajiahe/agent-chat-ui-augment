module.exports = {
  apps: [
    {
      name: "agent-chat-ui",
      script: "node_modules/.bin/next",
      args: "start",
      env: {
        NODE_ENV: "production",
        PORT: process.env.PORT || 3000,
      },
      env_production: {
        NODE_ENV: "production",
      },
      watch: false,
      max_memory_restart: "512M",
      instances: 1,
      exec_mode: "fork",
      kill_timeout: 5000,
      listen_timeout: 5000
    },
  ],
};


