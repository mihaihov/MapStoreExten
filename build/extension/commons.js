const path = require("path");

// common configuration between production and development for webpack
module.exports = {
    // exposes tells the module federation the entries to expose. `./plugin` the plugin key for loading.
    exposes: {
        "./plugin": path.join(__dirname, '..', '..', 'js', 'extension', 'plugins', "SaveSessionToLocalStorageExtension")
    },
    // dist of the root of the project
    destination: path.join(__dirname, '..', '..', "dist"),
    // to compile properly also mapstore dependencies
    alias: {
        "@mapstore/patcher": path.resolve(__dirname, '..', '..', "node_modules", "@mapstore", "patcher"),
        "@mapstore": path.resolve(__dirname, '..', '..', "MapStore2", "web", "client"),
        "@js": path.resolve(__dirname, '..', '..', "js")
    }
};
