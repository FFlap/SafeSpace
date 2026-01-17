import { action } from "./_generated/server";
import { internal } from "./_generated/api";

export const recomputeLayout = action({
    args: {},
    handler: async (ctx) => {
        await ctx.runAction(internal.clustering.actions.computeLayout);
        return "Layout recomputed successfully";
    },
});
