import { isJson } from '@/utils';
import { UserMusicOrderOrigin } from '../common';
import axios from 'axios';
import { MusicOrderItem } from '@/app/api/music';
import { Action } from '@/app/api/userMusicOrder';
import dayjs from 'dayjs';
import { nanoid } from 'nanoid';

interface ListResponse {
  name: string;
  path: string;
  sha: string;
  size: number;
  url: string;
  html_url: string;
  git_url: string;
  download_url: string;
  type: string;
  content: string;
  encoding: string;
}

export class GithubUserMusicOrderAction implements Action {
  public async getList(config: UserMusicOrderOrigin.GithubConfig) {
    let list: MusicOrderItem[] = [];
    try {
      list = await this.getData(config);
    } catch (e: any) {
      if (e.response.status === 404) {
        // 没有同步文件, 创建
        await this.createMyJson(config);
        list = await this.getData(config);
      }
    }
    return list;
  }
  public async update(data: MusicOrderItem, config: UserMusicOrderOrigin.GithubConfig) {
    const { request, filePath } = this.createConfig(config);
    let list = await this.getList(config);
    const current = list.find((l) => l.id === data.id);
    if (!current) {
      return Promise.reject(new Error('歌单不存在'));
    }
    list = list.map((l) =>
      l.id === data.id
        ? {
            ...l,
            name: data.name,
            desc: data.desc,
            cover: data.cover,
            updated_at: dayjs().format(),
          }
        : l
    );
    const content = btoa(JSON.stringify(list));
    await request.put(filePath, {
      message: `更新歌单${current.name}(${current.id})`,
      content,
    });
  }
  public async create(data: Omit<MusicOrderItem, 'id'>, config: UserMusicOrderOrigin.GithubConfig) {
    const { request, filePath } = this.createConfig(config);
    let list = await this.getList(config);
    if (list.find((l) => l.name === data.name)) {
      return Promise.reject(new Error('歌单已存在'));
    }
    const id = nanoid();
    list.push({
      ...data,
      id,
      created_at: dayjs().format(),
      updated_at: '',
    });
    const content = btoa(JSON.stringify(list));
    await request.put(filePath, {
      message: `创建歌单${data.name}(${id})`,
      content,
    });
  }
  public async delete(data: Pick<MusicOrderItem, 'id'>, config: UserMusicOrderOrigin.GithubConfig) {
    const { request, filePath } = this.createConfig(config);
    let list = await this.getList(config);
    const current = list.find((l) => l.id === data.id);
    if (!current) {
      return Promise.reject(new Error('歌单不存在'));
    }
    list = list.filter((l) => l.id !== data.id);
    const content = btoa(JSON.stringify(list));
    await request.put(filePath, {
      message: `删除歌单${current.name}(${current.id})`,
      content,
    });
  }
  private createConfig(config: UserMusicOrderOrigin.GithubConfig) {
    const { owner, repo } = transformRepoUrl(config.repo);
    const filePath = `/repos/${owner}/${repo}/contents/my.json`;

    return {
      request: axios.create({
        baseURL: 'https://api.github.com',
        headers: {
          Authorization: `Bearer ${config.token}`,
          'X-GitHub-Api-Version': '2022-11-28',
          Accept: 'application/vnd.github+json',
        },
      }),
      filePath,
    };
  }
  private async getData(config: UserMusicOrderOrigin.GithubConfig) {
    const { request, filePath } = this.createConfig(config);
    const res = await request.get<ListResponse>(filePath);
    const data = isJson<MusicOrderItem[]>(decode(res.data.content));
    return data || [];
  }
  private async createMyJson(config: UserMusicOrderOrigin.GithubConfig) {
    const { request, filePath } = this.createConfig(config);
    // 字符串转 base64
    const content = btoa('[]');
    await request.put(filePath, {
      message: '初始化歌单文件',
      content,
    });
  }
}

function transformRepoUrl(url: string) {
  const [, , , owner, repo] = url.split('/');
  return {
    owner,
    repo: url.endsWith('.git') ? repo.replace(/\.git/gi, '') : repo,
  };
}

// 对 gbk 编码的 base64 解码
function decode(value: string) {
  const bytes = Uint8Array.from(atob(value), (c) => c.charCodeAt(0));
  const decodedString = new TextDecoder().decode(bytes);
  return decodedString;
}
