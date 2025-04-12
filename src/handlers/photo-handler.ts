import { CONFIG } from '../config/constants';
import { ImageProcessor } from '../services/image-processor';
import { StickerSetService } from '../services/sticker-set-service';
import { PhotoContext } from '../types/bot';
import { logger } from '../utils/logger';

export class PhotoHandler {
  constructor(
    private readonly imageProcessor: ImageProcessor,
    private readonly stickerSetService: StickerSetService,
    private readonly botToken: string
  ) {}

  async handlePhotoMessage(ctx: PhotoContext): Promise<void> {
    const processor = new ImageProcessor();
    try {
      logger.info('Processing photo message', {
        userId: ctx.from?.id,
        messageId: ctx.message.message_id,
      });

      const photo = ctx.message.photo[ctx.message.photo.length - 1];
      const file = await ctx.api.getFile(photo.file_id);
      const fileUrl = `https://api.telegram.org/file/bot${this.botToken}/${file.file_path}`;

      logger.debug('Downloading image', { fileUrl });
      const response = await fetch(fileUrl);

      if (!response.ok) {
        logger.error('Failed to download image', {
          status: response.status,
          statusText: response.statusText,
        });

        throw new Error(`Failed to download image: ${response.statusText}`);
      }

      const buffer = await response.arrayBuffer();
      logger.debug('Image downloaded successfully');

      const tilePaths = await processor.processImage(Buffer.from(buffer));

      const userId = ctx.from?.id;

      if (!userId) {
        logger.error('Could not determine user ID');
        throw new Error('Could not determine user ID');
      }

      const botInfo = await ctx.api.getMe();
      const botUsername = botInfo.username;

      if (!botUsername) {
        logger.error('Could not determine bot username');
        throw new Error('Could not determine bot username');
      }

      const timestamp = Date.now().toString(36);
      const config = {
        userId,
        setName: `pack_${timestamp}_by_${botUsername}`,
        title: 'Static Emoji Pack by @web4ken',
        emoji: CONFIG.DEFAULT_EMOJI,
      };

      logger.info('Creating sticker set', { config });
      await ctx.reply('Creating your emoji pack... This may take a moment.');

      const setName = await this.stickerSetService.createStickerSet(
        config,
        tilePaths
      );

      const stickerSetUrl = `https://t.me/addstickers/${setName}`;

      logger.info('Sticker set created successfully', {
        setName,
        url: stickerSetUrl,
      });

      await ctx.reply(
        `Your emoji pack has been created! You can find it here: ${stickerSetUrl}`
      );
    } catch (error) {
      logger.error('Error processing photo message', { error });
      await ctx.reply(
        'Sorry, there was an error processing your photo. Please try again with a different image format (PNG, JPEG, or WebP).'
      );
    } finally {
      processor.cleanup();
    }
  }
}
