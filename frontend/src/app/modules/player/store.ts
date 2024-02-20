import { PlayerMode, PlayerStatus } from './constants';
import { create } from 'zustand';
import { AudioInstance, MusicItem } from '@/app/api/music';
import { api } from '@/app/api';

const CACHE_KEY = 'BBPlayerStorage';

interface PlayerStoreState {
  /** 播放器 */
  audio?: AudioInstance | null;
  /** 当前歌曲 */
  current?: MusicItem;
  /** 播放列表 */
  playerList: MusicItem[];
  /** 已播放，用于计算随机 */
  playerHistory: string[];
  /** 播放器状态 */
  playerStatus: PlayerStatus;
  /** 播放模式 */
  playerMode: PlayerMode;
}
interface PlayerStoreHandler {
  init: () => Promise<void>;
  /** 播放 */
  play: (music?: MusicItem) => Promise<void>;
  /** 暂停 */
  pause: () => void;
  /** 上一首 */
  prev: () => void;
  /** 下一首 */
  next: () => void;
  /** 播放完成后下一首 */
  endNext: () => void;
  /** 添加歌曲到播放列表 */
  addPlayerList: (values: MusicItem | MusicItem[]) => void;
  /** 将歌曲从播放列表移除 */
  removePlayerList: (ids: string[]) => void;
  /** 清空播放列表 */
  clearPlayerList: () => void;
  /** 切换播放模式 */
  togglePlayerMode: (mode?: PlayerMode) => void;
  /** 添加至播放历史 */
  addPlayerHistory: () => void;
  /** 下一首播放 */
  nextPlayer: (value: MusicItem) => void;
}

type PlayerStore = PlayerStoreState & PlayerStoreHandler;

export const playerStore = create<PlayerStore>()((set, get) => {
  return {
    audio: null,
    playerStatus: PlayerStatus.Stop,
    playerList: [],
    current: void 0,
    playerMode: PlayerMode.ListLoop,
    playerHistory: [],
    init: async () => {
      loadCache();
      const audio = api.music.createAudio();
      set({
        audio,
        playerStatus: PlayerStatus.Stop,
      });
      const store = get();

      if (store.current) {
        const url = await api.music.getMusicPlayerUrl(store.current);
        audio.setSrc(url);
      }
    },
    play: async (m) => {
      const store = get();

      if (!store.current) {
        set({ current: store.playerList[0] });
      }

      if (m && store.current?.id !== m.id) {
        // 存在歌曲信息，并且不是正在播放的歌曲
        const music = store.playerList?.find((p) => p.id === m.id);
        if (!music) {
          // 不在播放列表时添加进去
          store.addPlayerList([m]);
        }
        set({
          current: m,
          playerStatus: PlayerStatus.Play,
        });
        const url = await api.music.getMusicPlayerUrl(m);
        store.audio?.setSrc(url);
        store.audio?.setCurrentTime(0);
        store.audio?.play();
        store.addPlayerHistory();
      } else {
        if (store.playerStatus === PlayerStatus.Play) {
          store.pause();
        } else {
          set({
            playerStatus: PlayerStatus.Play,
          });
          const url = await api.music.getMusicPlayerUrl(store.current!);
          store.audio?.setSrc(url);
          store.audio?.play();
          store.addPlayerHistory();
        }
      }
    },
    pause: () => {
      const store = get();
      set({
        playerStatus: PlayerStatus.Pause,
      });
      store.audio?.pause();
    },
    prev: () => {
      const store = get();
      if (!store.current) return;
      const cind = store.playerHistory.findIndex((p) => p === store.current?.id);
      const prevId = store.playerHistory[cind - 1];
      if (prevId) {
        const m = store.playerList.find((p) => p.id === prevId);
        store.play(m);
      }

      // return;
      // const index = store.playerList?.findIndex((p) => p.id === store.current?.id);
      // if (index === 0) return;
      // store.play(store.playerList[index - 1]);
    },
    next: () => {
      const store = get();
      if (!store.current) return;
      if (store.playerMode === PlayerMode.Random) {
        store.endNext();
      } else {
        const index = store.playerList?.findIndex((p) => p.id === store.current?.id);
        if (index === store.playerList.length - 1) return;
        store.play(store.playerList[index + 1]);
      }
    },
    endNext: () => {
      const store = get();
      const current = store.current;
      if (!current) return;
      // 随机播放
      if (store.playerMode === PlayerMode.Random) {
        const list = store.playerList.filter((p) => !store.playerHistory.includes(p.id + ''));
        const len = list.length;

        if (len === 0) {
          set({
            playerHistory: [],
          });
          const nn = store.playerList.length;
          const n = Math.floor(Math.random() * nn);
          store.play(store.playerList[n]);
        } else {
          const n = Math.floor(Math.random() * len);
          store.play(list[n]);
        }
      }
      // 单曲循环
      if (store.playerMode === PlayerMode.SignalLoop) {
        store.audio?.setCurrentTime(0);
        store.pause();
        store.play(current);
      }
      // 列表循环 / 列表结尾停止
      if (store.playerMode === PlayerMode.ListLoop || store.playerMode === PlayerMode.ListOrder) {
        const index = store.playerList?.findIndex((p) => p.id === store.current?.id);
        if (index === store.playerList.length - 1) {
          if (store.playerMode === PlayerMode.ListOrder) {
            // 列表顺序结尾停止
            return;
          } else {
            store.play(store.playerList[0]);
          }
        } else {
          store.play(store.playerList[index + 1]);
        }
      }
    },
    nextPlayer: (m) => {
      const ms = Array.isArray(m) ? m : [m];
      const store = get();
      const current = store.current;
      const playerList = store.playerList.filter((p) => !ms.find((m) => m.id === p.id));
      const currentIndex = playerList.findIndex((p) => p.id === current?.id);
      if (currentIndex) {
        console.log('currentIndex: ', currentIndex);
        playerList.splice(currentIndex + 1, 0, m);
      }
      set({
        playerList,
      });
    },
    addPlayerList: (m) => {
      const ms = Array.isArray(m) ? m : [m];
      const store = get();
      const playerList = store.playerList.filter((p) => !ms.find((m) => m.id === p.id));
      playerList.push(...ms);
      set({
        playerList,
      });
    },
    removePlayerList: (ids) => {
      const store = get();
      set({
        playerList: store.playerList.filter((p) => !ids.includes(p.id + '')),
        playerHistory: store.playerHistory.filter((p) => !ids.includes(p)),
      });
    },
    clearPlayerList: () => {
      set({
        playerList: [],
        playerHistory: [],
      });
    },

    togglePlayerMode: (mode) => {
      const store = get();
      if (mode) {
        set({
          playerMode: mode,
        });
      } else {
        const l = [
          PlayerMode.SignalLoop,
          PlayerMode.ListLoop,
          PlayerMode.Random,
          PlayerMode.ListOrder,
        ];
        const index = l.findIndex((p) => store.playerMode === p);

        if (index === l.length - 1) {
          set({
            playerMode: l[0],
          });
        } else {
          set({
            playerMode: l[index + 1],
          });
        }
      }
    },
    addPlayerHistory: () => {
      const current = get().current;
      if (current) {
        const list = get().playerHistory.filter((p) => p !== current.id);

        set({
          playerHistory: [...list, current.id + ''],
        });
      }
    },
  };
});

let timer: NodeJS.Timeout;
playerStore.subscribe((state, preState) => {
  console.log('playerStore', state);
  clearTimeout(timer);
  timer = setTimeout(() => {
    api.cacheStorage.setItem(
      CACHE_KEY,
      JSON.stringify({
        playerList: state.playerList,
        playerMode: state.playerMode,
        current: state.current,
        playerHistory: state.playerHistory,
      })
    );
  }, 200);
});
async function loadCache() {
  try {
    const str = await api.cacheStorage.getItem(CACHE_KEY);
    const state = JSON.parse(str || '');
    console.log('loadCache: ', state);
    playerStore.setState({
      playerList: state.playerList,
      playerMode: state.playerMode,
      current: state.current,
      playerHistory: state.playerHistory,
    });
  } catch (e) {
    console.log('e: ', e);
  }
}
export const usePlayerStore = playerStore;
