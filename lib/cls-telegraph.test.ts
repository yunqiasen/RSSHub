import { expect, it, vi } from 'vitest';

import ofetch from '@/utils/ofetch';

import { route } from './routes/cls/telegraph';

vi.mock('@/utils/ofetch', () => ({ default: vi.fn() }));

it('links each telegraph to its actual article, not a shared index or an untrusted URL', async () => {
    vi.mocked(ofetch).mockResolvedValue({
        data: {
            roll_data: [
                { id: 123, title: 'With ID', content: 'First', ctime: 1_790_290_000 },
                { title: 'With link', shareurl: 'https://www.cls.cn/detail/124', content: 'Second', ctime: 1_790_290_000 },
                { id: 'bad', shareurl: 'javascript:alert(1)', title: 'Invalid', ctime: 1_790_290_000 },
            ],
        },
    });
    const result = await (route.handler as any)({ req: { param: vi.fn(), query: vi.fn() } });
    expect(result.item.map((item) => item.link)).toEqual(['https://www.cls.cn/detail/123', 'https://www.cls.cn/detail/124']);
});
