import { mkdirSync, rmSync } from 'fs';
import { tmpdir } from 'os';
import { join } from 'path';
import sharp from 'sharp';
import { CONFIG } from '../config/constants';
import { logger } from '../utils/logger';

export class ImageProcessor {
  private readonly tempDir: string;

  constructor() {
    this.tempDir = join(tmpdir(), CONFIG.TEMP_DIR_PREFIX + Date.now());
    mkdirSync(this.tempDir, { recursive: true });
    logger.info('Created temporary directory', { path: this.tempDir });
  }

  async processImage(buffer: Buffer): Promise<string[]> {
    logger.info('Starting image processing');
    let image = sharp(buffer);
    const metadata = await image.metadata();

    if (!metadata.format) {
      logger.debug('No image format detected, converting to PNG');
      image = image.png();
    }

    const { width, height } = metadata;
    if (!width || !height) {
      logger.error('Could not determine image dimensions');
      throw new Error('Could not determine image dimensions');
    }

    logger.debug('Image dimensions', { width, height });

    const tilesX = Math.floor(width / CONFIG.TILE_SIZE);
    const tilesY = Math.floor(height / CONFIG.TILE_SIZE);

    this.validateDimensions(tilesX, tilesY);
    logger.info('Image validation passed', { tilesX, tilesY });

    const tilePaths = await this.createTiles(image, tilesX, tilesY);
    logger.info('Image processing completed', { totalTiles: tilePaths.length });
    return tilePaths;
  }

  private validateDimensions(tilesX: number, tilesY: number): void {
    if (tilesX === 0 || tilesY === 0) {
      logger.error('Image too small for tiles', { tilesX, tilesY });
      throw new Error(
        'Image is too small to create tiles. Please send a larger image (minimum 100x100 pixels).'
      );
    }

    const totalTiles = tilesX * tilesY;
    if (totalTiles > CONFIG.MAX_TILES) {
      logger.error('Image too large for tiles', {
        totalTiles,
        maxTiles: CONFIG.MAX_TILES,
      });
      throw new Error(
        'Image is too large. Please send a smaller image (maximum 120 tiles).'
      );
    }
  }

  private async createTiles(
    image: sharp.Sharp,
    tilesX: number,
    tilesY: number
  ): Promise<string[]> {
    logger.info('Creating image tiles');
    const tilePaths: string[] = [];

    for (let y = 0; y < tilesY; y++) {
      for (let x = 0; x < tilesX; x++) {
        const tilePath = join(this.tempDir, `tile_${x}_${y}.png`);
        logger.debug('Processing tile', { x, y, path: tilePath });

        await image
          .clone()
          .extract({
            left: x * CONFIG.TILE_SIZE,
            top: y * CONFIG.TILE_SIZE,
            width: CONFIG.TILE_SIZE,
            height: CONFIG.TILE_SIZE,
          })
          .png({
            compressionLevel: 9,
            quality: 100,
            effort: 9,
            palette: true,
          })
          .toFile(tilePath);
        tilePaths.push(tilePath);
      }
    }

    return tilePaths;
  }

  cleanup(): void {
    logger.info('Cleaning up temporary files', { path: this.tempDir });

    try {
      rmSync(this.tempDir, { recursive: true, force: true });
      logger.debug('Temporary files cleaned up successfully');
    } catch (error) {
      logger.error('Error cleaning up temporary files', { error });
    }
  }
}
