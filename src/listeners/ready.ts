import { Listener } from '@sapphire/framework';
import { Events } from 'discord.js';

export class ReadyListener extends Listener {
  constructor(context: Listener.LoaderContext, options: Listener.Options) {
    super(context, {
      ...options,
      event: Events.ClientReady,
      once: true,
    });
  }

  run() {
    console.log('Bot is ready!');
  }
}
