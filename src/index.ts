import { Bot } from 'grammy';
import { config } from 'dotenv';

config();

function main() {
    const botToken = process.env.BOT_TOKEN

    if (botToken == null) {
        console.error('BOT_TOKEN is not set');
        process.exit(1);
    }

    const bot = new Bot(botToken);

    bot.on('message', async (ctx) => {
        await ctx.reply('Hello, world!');
    });

    bot.start();
    console.log('Bot started');
}

main(); 
