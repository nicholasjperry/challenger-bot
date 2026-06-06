import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";
import { handleChallengeResponse } from "../services/handleChallengeResponse.js";

export class ReminderChoiceHandler extends InteractionHandler {
    constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    async run(interaction: ButtonInteraction) {
        return handleChallengeResponse(interaction);
    }
}