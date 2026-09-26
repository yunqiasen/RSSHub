import type { Context } from 'hono';
import { renderToString } from 'hono/jsx/dom/server';

import type { Route } from '@/types';
import ofetch from '@/utils/ofetch';
import { parseDate } from '@/utils/parse-date';

import { getSearchParams, rootUrl } from './utils';

const categories = {
    watch: '看盘',
    announcement: '公司',
    red: '加红',
    remind: '提醒',
    fund: '基金',
    hk: '港股',
    hk_us: '港美股',
};

const renderTelegraphDescription = (item) =>
    renderToString(
        <>
            {item.content ? <>{item.content}</> : null}
            {item.images?.length ? (
                <>
                    <br />
                    {item.images.map((image) => (
                        <img src={image} key={image} />
                    ))}
                </>
            ) : null}
        </>
    );

export const route: Route = {
    path: '/telegraph/:category?',
    categories: ['finance'],
    example: '/cls/telegraph',
    parameters: { category: '分类，见下表，默认为全部' },
    features: {
        requireConfig: false,
        requirePuppeteer: false,
        antiCrawler: false,
        supportBT: false,
        supportPodcast: false,
        supportScihub: false,
    },
    radar: [
        {
            source: ['cls.cn/telegraph', 'cls.cn/'],
            target: '/telegraph',
        },
    ],
    name: '电报',
    maintainers: ['nczitzk'],
    handler,
    url: 'cls.cn/telegraph',
    description: `| 看盘  | 公司         | 加红 | 提醒   | 基金 | 港美股 |
| ----- | ------------ | ---- | ------ | ---- | ------ |
| watch | announcement | red  | remind | fund | hk\\_us |`,
};

function articleLink(item): string | undefined {
    if (/^[1-9]\d*$/.test(String(item.id || ''))) {
        return `${rootUrl}/detail/${item.id}`;
    }
    try {
        const url = new URL(item.shareurl);
        if (['http:', 'https:'].includes(url.protocol) && ['www.cls.cn', 'cls.cn'].includes(url.hostname) && /^\/detail\/[1-9]\d*\/?$/.test(url.pathname)) {
            return `${rootUrl}${url.pathname}`;
        }
    } catch {
        // No trustworthy article identifier: omit the item instead of fabricating a permalink.
    }
}

async function handler(ctx: Context) {
    const category = ctx.req.param('category');
    const limit = ctx.req.query('limit') ? Number.parseInt(ctx.req.query('limit')!) : 50;

    let apiUrl = `${rootUrl}/api/cache`;
    if (category) {
        apiUrl = `${rootUrl}/v1/roll/get_roll_list`;
    }

    const currentUrl = `${rootUrl}/telegraph`;

    const response = await ofetch(apiUrl, {
        query: getSearchParams({
            category,
            name: category ? undefined : 'telegraph',
        }),
    });

    const items = response.data.roll_data
        .slice(0, limit)
        .map((item) => ({
            title: item.title || item.content,
            link: articleLink(item),
            description: renderTelegraphDescription(item),
            pubDate: parseDate(item.ctime, 'X'),
            category: item.subjects?.map((s) => s.subject_name),
        }))
        .filter((item) => item.link);

    return {
        title: `财联社 - 电报${category ? ` - ${categories[category]}` : ''}`,
        link: currentUrl,
        item: items,
    };
}
