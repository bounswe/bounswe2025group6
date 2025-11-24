import * as t from "@babel/types";

export default {
  presets: [
    ["@babel/preset-env", { targets: { node: "current" } }],
    ["@babel/preset-react", { runtime: "automatic" }],
  ],
  plugins: [
    // Transform import.meta.env to process.env for Jest
    function () {
      return {
        visitor: {
          MemberExpression(path) {
            // Check if this is import.meta.env.VITE_API_URL or similar
            if (
              path.node.object &&
              path.node.object.type === "MemberExpression" &&
              path.node.object.object &&
              path.node.object.object.type === "MetaProperty" &&
              path.node.object.object.meta &&
              path.node.object.object.meta.name === "import" &&
              path.node.object.object.property &&
              path.node.object.object.property.name === "meta" &&
              path.node.object.property &&
              path.node.object.property.name === "env"
            ) {
              // Transform import.meta.env.VITE_API_URL to process.env.VITE_API_URL
              const propertyName = path.node.property.name;
              path.replaceWith(
                t.memberExpression(
                  t.memberExpression(t.identifier("process"), t.identifier("env")),
                  t.identifier(propertyName)
                )
              );
            }
            // Also handle import.meta.env (without property access)
            else if (
              path.node.object &&
              path.node.object.type === "MetaProperty" &&
              path.node.object.meta &&
              path.node.object.meta.name === "import" &&
              path.node.object.property &&
              path.node.object.property.name === "meta" &&
              path.node.property &&
              path.node.property.name === "env"
            ) {
              // Transform import.meta.env to process.env
              path.replaceWith(
                t.memberExpression(t.identifier("process"), t.identifier("env"))
              );
            }
          },
        },
      };
    },
  ],
};