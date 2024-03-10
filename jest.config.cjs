const hq = require("alias-hq")

module.exports = {
    transform: {
        "\\.[jt]sx?$": ["esbuild-jest", { format: "esm" }],
    },
    moduleNameMapper: {
        ...hq.get("jest"),
        '^(\\.{1,2}/.*)\\.js$': '$1',
    },
    moduleFileExtensions: ["ts", "js"],
    extensionsToTreatAsEsm: ['.ts'],
    testPathIgnorePatterns: ["build"],
}
