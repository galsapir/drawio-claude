// ABOUTME: Vitest test configuration.
// ABOUTME: Configures test paths and snapshot settings.

import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    globals: true,
    include: ["src/**/*.test.ts"],
  },
});
