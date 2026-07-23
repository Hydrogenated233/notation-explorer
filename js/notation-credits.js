;(function (root, factory) {
   var api = factory()

   if (typeof module === 'object' && module.exports) {
      module.exports = api
      return
   }

   root.NotationCredits = api
})(typeof globalThis !== 'undefined' ? globalThis : this, function () {
   'use strict'

   var rows = [
      {
         key: 'credit.bashicu',
         en: 'Defined by Bashicu Hyudora; expander from the original NE project.',
         zh: '由 Bashicu Hyudora 定义; 展开器来自原 NE 项目.',
      },
      {
         key: 'credit.tbm',
         en: 'Defined by the community.',
         zh: '由社区定义.',
      },
      {
         key: 'credit.yukito',
         en: 'Defined by Yukito; expander from the original NE project, originally by Yukito; mountain diagram by Yukito.',
         zh: '由 Yukito 定义; 展开器来自原 NE 项目, 最初由 Yukito 给出; 山脉图绘制由 Yukito 给出.',
      },
      {
         key: 'credit.den',
         en: 'Defined by Hypcos based on BLP by test_alpha0; expander from the original NE project; visualization by test_alpha0.',
         zh: '由 Hypcos 基于 test_alpha0 定义的 BLP 作出定义; 展开器来自原 NE 项目; 可视化方案由 test_alpha0 给出.',
      },
      {
         key: 'credit.den23',
         en: 'Defined by test_alpha0 based on DEN; expander from the original NE project; visualization by test_alpha0.',
         zh: '由 test_alpha0 基于 DEN 作出定义; 展开器来自原 NE 项目; 可视化方案由 test_alpha0 给出.',
      },
      {
         key: 'credit.btbm',
         en: 'Originally conceived by Bubby3, refined by the community. Expander by 笑姐姐 (Smile Lee) based on discussions with Asheep233.',
         zh: '由 Bubby3 最初提出设想, 由社区完善. 笑姐姐 基于与 Asheep233 的讨论给出展开器.',
      },
      {
         key: 'credit.hypcos_mn',
         en: 'Defined by Hypcos; expander from the original NE project.',
         zh: '由 Hypcos 定义; 展开器来自原 NE 项目.',
      },
      {
         key: 'credit.n_mn',
         en: "Defined by 笑姐姐 (Smile Lee) based on Hypcos's MN series; expander also by 笑姐姐 (Smile Lee).",
         zh: '由 笑姐姐 基于 Hypcos 的 MN 系列作出定义, 并给出展开器.',
      },
      {
         key: 'credit.test-alpha0',
         en: 'Defined by test_alpha0, with expander by the same author.',
         zh: '由 test_alpha0 定义, 并给出展开器.',
      },
      {
         key: 'credit.test-alpha0-ocn',
         en: 'Defined by test_alpha0, with expander by the same author. Also provides OCN rendering.',
         zh: '由 test_alpha0 定义, 并给出展开器. 同时提供 OCN 渲染.',
      },
      {
         key: 'credit.ton',
         en: 'Defined by Taranosvky; expander from the original NE project.',
         zh: '由 Taranosvky 定义; 展开器来自原 NE 项目.',
      },
      {
         key: 'credit.asan',
         en: 'Defined by Aarex; expander from the original NE project.',
         zh: '由 Aarex 定义; 展开器来自原 NE 项目.',
      },
      {
         key: 'credit.community_y',
         en: 'Defined by the community.',
         zh: '由社区定义.',
      },
      {
         key: 'credit.asheep',
         en: 'Rough definition by Asheep233; expander by 笑姐姐 (Smile Lee) based on it.',
         zh: '由 Asheep233 给出粗略定义, 由 笑姐姐 基于此给出展开器.',
      },
      {
         key: 'credit.bocf',
         en: 'Initially defined by Buchholz; refined by the community.',
         zh: '由 Buchholz 给出最初定义; 由社区完善.',
      },
      {
         key: 'credit.mocf',
         en: 'Initially defined by Madore.',
         zh: '由 Madore 给出最初定义.',
      },
      {
         key: 'credit.nocf',
         en: 'Defined by the community.',
         zh: '由社区定义.',
      },
      {
         key: 'credit.ups1_1r5',
         en: 'Originally created by Optimism, refined by Alice. Expander and visualization by Alice.',
         zh: '由 Optimism 最初创作, Alice 完善. 由 Alice 给出展开器与可视化方案.',
      },
      {
         key: 'credit.dsm',
         en: 'Defined by Alice, with expander by the same author.',
         zh: '由 Alice 定义并给出展开器.',
      },
      {
         key: 'credit.wmm',
         en: 'A community improvement upon MMS defined by Aarex. Expander from the original NE project.',
         zh: '由社区从 Aarex 定义的 MMS 改进而来. 展开器来自原 NE 项目.',
      },
   ]

   var en = {}
   var zh = {}
   var keys = rows.map(function (row) {
      en[row.key] = row.en
      zh[row.key] = row.zh
      return row.key
   })
   var translations = Object.freeze({
      en: Object.freeze(en),
      zh: Object.freeze(zh),
   })
   keys = Object.freeze(keys)

   function resolveCredit(notation, lang) {
      if (!notation || typeof notation !== 'object' || Array.isArray(notation)) return ''
      var key = notation.credit_text_id
      if (typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(translations.en, key)) return ''
      return translations[lang === 'zh' ? 'zh' : 'en'][key]
   }

   return Object.freeze({
      keys: keys,
      translations: translations,
      resolveCredit: resolveCredit,
   })
})
