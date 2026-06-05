import { InteractionHandler, InteractionHandlerTypes } from "@sapphire/framework";
import { ButtonInteraction } from "discord.js";
import { prisma } from "../index.js";

export class ReminderChoiceHandler extends InteractionHandler {
    constructor(context: InteractionHandler.LoaderContext, options: InteractionHandler.Options) {
        super(context, {
            ...options,
            interactionHandlerType: InteractionHandlerTypes.Button,
        });
    }

    async run(interaction: ButtonInteraction) {
        const [prefix, choice, challengeId] = interaction.customId.split('-');

        if (prefix !== 'reminder') return;

        const challenge = await prisma.challenge.findUnique({
            where: {
                id: challengeId,
            }
        });

        if (!challenge)
            return interaction.reply({ content: 'Challenge not found.', ephemeral: true });

        const userId = interaction.user.id;

        let role: 'challenger' | 'target' | null = null;

        if (userId === challenge.challengerId){
            role = 'challenger';
        } else if (userId === challenge.targetId) {
            role = 'target';
        } else {
            role = null;
        }

        if (!role) {
            return interaction.reply({
                content: 'You are not part of this challenge.',
                ephemeral: true,
            });
        }

        // TODO: Update Challenge model with challenger/targetResponse

    }
}