import { internalQuery } from "../_generated/server";

export const getAllSpaces = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaces").collect();
  },
});

export const getAllLinks = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spaceLinks").collect();
  },
});
