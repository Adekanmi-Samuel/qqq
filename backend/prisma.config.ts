import { defineConfig } from "@prisma/config";

export default defineConfig({
  schema: "./prisma/schema.prisma",

  datasource: {
    url: process.env.DATABASE_URL || "",
    schemas: ["public", "auth"],
  },

  migrate: {
    url: process.env.DIRECT_URL || process.env.DATABASE_URL || "",
  },
});
