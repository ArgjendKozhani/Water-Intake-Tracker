const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const ReactRefreshWebpackPlugin = require('@pmmmwh/react-refresh-webpack-plugin');

module.exports = async function(env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure react-refresh runtime is available in development mode for web
  if (config.mode === 'development') {
    config.plugins.push(new ReactRefreshWebpackPlugin());
  }

  return config;
};
