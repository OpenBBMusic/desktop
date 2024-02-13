import styles from './index.module.scss';
import { cls, transformImgUrl } from '@/utils';
import { useState } from 'react';
import { useVideoStore } from '@/store/video';
import { api } from '@/app/api';
import { SearchItem as SearchItemInter, SearchType } from '@/app/api/search';
import { seconds2mmss } from '@/player';
import { Image } from '@/app/components/ui/image';

export default function SearchItem({ data }: { data: SearchItemInter }) {
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const videoStore = useVideoStore();
  const getDetailHandler = async () => {
    setLoading(true);
    try {
      const info = await api.search.getItemInfo(data);
      if (info.type === SearchType.Order) {
        // videoStore.setData(info);
        // router.push(`/parts`);
      } else {
        setShow(true);
      }
    } catch (e) {
      console.error('e', e);
    }
    setLoading(false);
  };
  const name = data.name;
  return (
    <div
      className={styles.searchItem}
      onClick={getDetailHandler}
      title={name}
    >
      <Image
        className={styles.cover}
        src={transformImgUrl(data.cover)}
        alt=''
        mode='cover'
      />
      <div className={styles.title}>
        <span>{name}</span>
        {/* <span>{data.author}</span> */}
      </div>
      <div
        className={styles.author}
        title={data.author}
      >
        {data.author}
      </div>
      <div className={styles.duration}>
        <span>{seconds2mmss(data.duration)}</span>
      </div>

      {loading && <div className={styles.loading}>加载中...</div>}
      <div className={cls(styles.operate, show ? styles.show : '')}>
        <span>立即播放</span>
        <span>加入歌单</span>
        <span>添加至播放列表</span>
      </div>
    </div>
  );
}