module.exports = {
  css: {
    loaderOptions: {
      sass: {
        additionalData: `@import "@/assets/styles/_variables.scss";`,
      },
    },
  },
  configureWebpack: {
    devtool: 'source-map', // Tắt eval để tránh CSP error
  },
  runtimeCompiler: true,
  lintOnSave: false, // Tắt ESLint warnings trong development để tập trung vào functionality
};
