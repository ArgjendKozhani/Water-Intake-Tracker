module.exports = function(api) {
  api.cache(true);
  const presets = ['babel-preset-expo'];
  const plugins = [];

  if (process.env.NODE_ENV === 'development') {
    // Inject react-refresh helpers in development so $RefreshSig$ is defined
    plugins.push('react-refresh/babel');
  }

  return {
    presets,
    plugins,
  };
};
