const path = require('path');
const singleSpaAngularWebpack = require('single-spa-angular/lib/webpack').default;

module.exports = (config, options) => {
  const singleSpaWebpackConfig = singleSpaAngularWebpack(config, options);

  // Ensure webpack resolves modules from both local and root node_modules (pnpm monorepo)
  singleSpaWebpackConfig.resolve.modules = [
    path.resolve(__dirname, 'node_modules'),
    'node_modules',
  ];

  // Fix: single-spa-angular has no `main` field, only `exports`/`module` — add explicit alias
  singleSpaWebpackConfig.resolve.alias = {
    ...(singleSpaWebpackConfig.resolve.alias || {}),
    'single-spa-angular$': path.resolve(
      __dirname,
      'node_modules/single-spa-angular/fesm2022/single-spa-angular.mjs',
    ),
  };

  return singleSpaWebpackConfig;
};
