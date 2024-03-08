/** 播放列表 */
import { downloadMusic, musicCollect } from '../../../modules';
import { usePlayerStore } from '..';
import { ContextMenu, Table } from '../../../components';
import { cls, seconds2mmss } from '../../../utils';
import { RightOne } from '@icon-park/react';
import styles from '../index.module.scss';

export function PlayerList({ open }: { open: boolean }) {
  const player = usePlayerStore();
  return (
    <div
      className={styles.playerListContainer}
      style={{ display: open ? '' : 'none' }}
      onClick={(e) => {
        e.stopPropagation();
      }}
    >
      <div className={styles.headerInfo}>
        <div className={styles.title}>当前播放</div>
        <div style={{ display: 'flex', justifyContent: 'space-between' }}>
          <span className={styles.total}>总{player.playerList.length}首</span>
          <div style={{ display: 'flex', gap: '16px' }}>
            <span
              className={styles.operateBtn}
              onClick={() => {
                musicCollect(player.playerList);
              }}
            >
              收藏全部
            </span>
            <span
              className={styles.clear}
              onClick={() => {
                player.clearPlayerList();
              }}
            >
              清空列表
            </span>
          </div>
        </div>
      </div>
      <div className={styles.list}>
        <Table>
          <thead style={{ display: 'none' }}>
            <tr>
              <th></th>
              <th></th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {player.playerList.map((item, index) => {
              return (
                <ContextMenu
                  asChild
                  items={[
                    {
                      label: '播放',
                      key: '播放',
                      onClick: () => {
                        player.play(item);
                      },
                    },
                    {
                      label: '从列表中移除',
                      key: '移除',
                      onClick: () => {
                        player.removePlayerList([item.id]);
                      },
                    },
                    {
                      label: '收藏到歌单',
                      key: '收藏到歌单',
                      onClick: () => {
                        musicCollect(item);
                      },
                    },
                    {
                      label: '下载',
                      key: '下载',
                      onClick: () => {
                        downloadMusic(item);
                      },
                    },
                  ]}
                  key={item.id}
                >
                  <tr
                    onDoubleClick={() => {
                      player.play(item);
                    }}
                  >
                    <td
                      className={cls(styles.name, player.current?.id === item.id && styles.active)}
                    >
                      <div className={styles.icon}>
                        <RightOne theme="filled" strokeWidth={2} />
                      </div>
                      <span className={styles.nameText}>{item.name}</span>
                    </td>
                    <td>{seconds2mmss(item.duration)}</td>
                  </tr>
                </ContextMenu>
              );
            })}
          </tbody>
        </Table>
      </div>
    </div>
  );
}
