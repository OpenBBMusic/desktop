export interface MusicItem<T = any> {
  id: string | number; // ID
  cover?: string; // 封面
  name: string; // 名称
  duration: number; // 时长
  author?: string; // 作者
  extraData?: T; // 扩展数据
}

export interface MusicOrderItem<E = any, T = any> {
  id: string | number; // ID
  cover?: string; // 封面
  name: string; // 名称
  author?: string; // 作者
  extraData?: E; // 扩展数据
  desc?: string; // 描述
  musicList?: MusicItem<T>[]; // 音乐列表
}

export abstract class Music<E = any, T = any> {
  /** 歌单详情 */
  abstract getMusicOrderInfo(item: MusicOrderItem<E, T>): Promise<MusicOrderItem<E, T>>;
  /** 获取音乐播放地址 */
  abstract getMusicPlayerUrl(item: MusicItem): Promise<string>;
  /** 下载音乐 */
  abstract download(item: MusicItem<T>): Promise<unknown>;
}