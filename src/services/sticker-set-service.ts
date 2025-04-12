import { InputSticker } from '@grammyjs/types';
import { Bot, InputFile } from 'grammy';
import { CONFIG } from '../config/constants';
import { StickerSetConfig } from '../types/bot';
import { logger } from '../utils/logger';

export class StickerSetService {
  constructor(private readonly bot: Bot) {}

  async createStickerSet(
    config: StickerSetConfig,
    tilePaths: string[]
  ): Promise<string> {
    logger.info('Creating sticker set', {
      userId: config.userId,
      setName: config.setName,
      totalStickers: tilePaths.length,
    });

    try {
      const firstSticker: InputSticker<InputFile> = {
        sticker: new InputFile(tilePaths[0]),
        format: 'static',
        emoji_list: [CONFIG.DEFAULT_EMOJI],
      };

      logger.debug('Creating initial sticker set');
      await this.bot.api.createNewStickerSet(
        config.userId,
        config.setName,
        config.title,
        [firstSticker],
        { sticker_type: 'custom_emoji' }
      );
      logger.info('Initial sticker set created');

      logger.debug('Adding remaining stickers', {
        remaining: tilePaths.length - 1,
      });

      for (let i = 1; i < tilePaths.length; i++) {
        const sticker: InputSticker<InputFile> = {
          sticker: new InputFile(tilePaths[i]),
          format: 'static',
          emoji_list: [CONFIG.DEFAULT_EMOJI],
        };

        await this.bot.api.addStickerToSet(
          config.userId,
          config.setName,
          sticker
        );

        logger.debug('Added sticker', { index: i });
      }

      logger.info('Sticker set creation completed', {
        setName: config.setName,
      });

      return config.setName;
    } catch (error) {
      logger.error('Error creating sticker set', { error });
      throw new Error('Failed to create sticker set');
    }
  }
}
