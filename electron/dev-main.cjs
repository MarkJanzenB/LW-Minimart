// Development bootstrap for Electron that runs the TypeScript main process via ts-node.

require("ts-node").register({
  transpileOnly: true,
  compilerOptions: {
    module: "commonjs",
  },
});

require("./main.ts");
