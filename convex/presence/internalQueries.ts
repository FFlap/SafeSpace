import { internalQuery } from "../_generated/server";

export const getAllPresence = internalQuery({
  args: {},
  handler: async (ctx) => {
    return await ctx.db.query("spacePresence").collect();
  },
});
