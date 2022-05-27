module.exports = {
  apps: [
    {
      name: 'caro-back2',
      script: 'server.js',
      node_args: '--max_old_space_size=4096',
      watch: [
        'app', 'booter',
      ],
      ignore_watch: [],
      env: {
        'NODE_PATH': '.',
        'APP_PORT': 8088,
        'NODE_ENV': 'dev',
        'ROUTE_ROOT': '', // api url 根路徑; 對應 nginx 的 route 設定
        'USE_APP_SCHEDULER': false, // 是否啟用排程
        'IS_LOGIN_MODE': false, // 是否使用登入功能
      },
      env_prod: {
        'NODE_ENV': 'prod',
        'ROUTE_ROOT': '/', // 對應 nginx 的 route 設定
        'USE_APP_SCHEDULER': true,
        'IS_LOGIN_MODE': true,
      },
    },
    { // 負責前端檔案監聽
      name: 'caro-back2-gulpWatch',
      script: 'gulp',
    },
  ],
  deploy: {},
};
