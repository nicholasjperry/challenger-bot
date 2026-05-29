import { Command } from '@sapphire/framework';
import { CommandInteraction, ApplicationCommandRegistry } from 'discord.js';

export class PingCommand extends Command {
  constructor(context: Command.LoaderContext, options: Command.Options) {
    super(context, {
      ...options,
      name: 'ping',
      description: 'Replies with Pong!',
      chatInputCommand: true,
    });
  }

  async chatInputRun(interaction: CommandInteraction) {
    await interaction.reply('Pong!');
  }

  registerApplicationCommands(registry: ApplicationCommandRegistry) {
    registry.registerChatInputCommand((builder) =>
      builder.setName('ping').setDescription('Replies with Pong!')
    );
  }
}
