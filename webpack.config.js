const path = require("path");

module.exports = {
  target: "web",
  entry: {
    extension: "./src/extension.ts",
    configWizard: "./src/vscode/webviews/scripts/configWizard.ts",
    progress: "./src/vscode/webviews/scripts/progress.ts",
    welcome: "./src/vscode/webviews/scripts/welcome.ts",
  },
  output: {
    path: path.resolve(__dirname, "out"),
    filename: "[name].js",
    libraryTarget: "umd",
    globalObject: "this",
  },
  devtool: "source-map",
  externals: {
    vscode: "commonjs vscode",
  },
  resolve: {
    extensions: [".ts", ".js"],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: [
          {
            loader: "ts-loader",
            options: {
              configFile: "tsconfig.json",
            },
          },
        ],
      },
    ],
  },
  optimization: {
    minimize: false,
  },
};
