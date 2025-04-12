import { config } from 'dotenv';
import { Bot } from 'grammy';
import { PhotoHandler } from './handlers/photo-handler';
import { ImageProcessor } from './services/image-processor';
import { StickerSetService } from './services/sticker-set-service';
import { env } from './utils/env';
import { logger } from './utils/logger';

config();

const botToken = env('BOT_TOKEN', { required: true });
const bot = new Bot(botToken);

const imageProcessor = new ImageProcessor();
const stickerSetService = new StickerSetService(bot);
const photoHandler = new PhotoHandler(
  imageProcessor,
  stickerSetService,
  botToken
);

bot.command('start', async (ctx) => {
  await ctx.reply(
    'Welcome! Send me a photo to create an emoji pack. The photo will be split into 100x100 pixel tiles.'
  );
});

bot.on('message:photo', async (ctx) => {
  await photoHandler.handlePhotoMessage(ctx);
});

bot.start();
logger.info('Bot started successfully');
