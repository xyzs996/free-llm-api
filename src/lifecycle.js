// 一个已经过去的下线日期不是「即将」。
//
// 这个仓库里原先有六处各自判断 `availability.retires_at` 非空 —— 非空就当将来时
// 排版:首页表格的「Retires 2026-07-30」、README 的同一格、中文 README 的
// 「2026-07-30 下线」、厂商页的生命周期一栏、那一页的问答、还有给模型读的
// llms.txt 里的 `retires 2026-07-30`。关停当天,这六处一起开始说假话,而没有
// 一处会红:日期还在,字段还合法,页面照样 200。github-models 就这样以将来时
// 挂了 23 天。
//
// 时态的判断收在这里一处,而且只认数据里的状态,不自己看钟 —— 渲染必须是数据的
// 纯函数,否则同一份数据今天明天编出两份产物,`render.js --check` 会在无人改动
// 的那天变红,而红的原因和真正的问题无关。让状态跟上日历是另一条判据的事:
// test/providers-data.test.js 里那条会在下线日当天自己变红。
export function hasRetired(provider) {
  return provider.availability.status === 'retired';
}

// 「核对于 2026-07-25」这一行会印在每家的页面上,也喂给 schema.org 的
// dateModified、sitemap 的 lastmod 和 llms.txt 的 sources read。26 家一起在这个
// 日期上停了 28 天,而仓库里没有任何一处会因此不高兴 —— 日期越旧,那一行越像
// 一句担保,实际担保的却是一个月前的世界。
//
// 这一条只报不拦:源没重读是欠账,得有人去读;而下线日期过了状态没跟上是假话,
// 那条在 test/providers-data.test.js 里直接红。两者不是一回事,别按同一档处理 ——
// 把欠账做成硬闸,人只会去改那个 30。
export const STALE_AFTER_DAYS = 30;

export function staleSources(providers, today, days = STALE_AFTER_DAYS) {
  const cutoff = new Date(`${today}T00:00:00Z`);
  cutoff.setUTCDate(cutoff.getUTCDate() - days);
  const oldest = cutoff.toISOString().slice(0, 10);

  return providers
    .filter(({ source_checked_at: checked }) => checked < oldest)
    .map(({ id, source_checked_at: checked }) => ({
      id,
      checkedAt: checked,
      daysAgo: Math.round(
        (new Date(`${today}T00:00:00Z`) - new Date(`${checked}T00:00:00Z`)) / 86400000,
      ),
    }))
    .sort((a, b) => b.daysAgo - a.daysAgo || a.id.localeCompare(b.id));
}
