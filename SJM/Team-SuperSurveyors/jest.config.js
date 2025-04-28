// jest.config.js
module.exports = {
    collectCoverage: true,
    coverageReporters: ["text", "text-summary"],
    reporters: [
      // only this one — no default reporter to print failures or warnings
      ["jest-silent-reporter", { useDots: false, showWarnings: false }]
    ],
    silent: true,
  };
  