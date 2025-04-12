import { Context, Filter } from 'grammy';

export type PhotoContext = Filter<Context, 'message:photo'>;
export type StickerSetConfig = {
  userId: number;
  setName: string;
  title: string;
  emoji: string;
};
