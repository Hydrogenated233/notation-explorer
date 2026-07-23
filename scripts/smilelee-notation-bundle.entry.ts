import type { NotationCategoryDefinition } from '@/core/notation_category.ts';
import type { NotationDefinition } from '@/notation-definition.ts';

import { omega } from '@/notations/Misc/Omega.ts';
import { VeblenPhi } from '@/notations/Misc/Veblen.ts';
import { BOCF_EBO } from '@/notations/OCN/BOCF_EBO.ts';
import { MOCF_EBO } from '@/notations/OCN/MOCF_EBO.ts';
import { NOCF_EBO } from '@/notations/OCN/NOCF_EBO.ts';
import { Inacc_OCF } from '@/notations/OCN/Inacc_OCF.ts';
import { finite_Mahlo_OCF } from '@/notations/OCN/finite_Mahlo_OCF.ts';
import { Minus1_Y } from '@/notations/Y/minus1_Y.ts';
import { T_Minus1_Y } from '@/notations/Y/T_minus1_Y.ts';
import { Y_seq } from '@/notations/Y/Y.ts';
import {
    category_y_omega,
    omega_Y_actual,
    omega_Y_medium,
    omega_Y_strong,
    omega_Y_weak,
} from '@/notations/Y/Omega_Y.ts';
import { BM4, seq_0Y } from '@/notations/BM-like/BM.ts';
import { TBM } from '@/notations/BM-like/TBM.ts';
import { CMS } from '@/notations/BM-like/CMS.ts';
import { BHM } from '@/notations/BM-like/BHM.ts';
import { BSM } from '@/notations/BM-like/BSM.ts';
import { BLM } from '@/notations/BM-like/BLM.ts';
import { category_partial_UPMS, UPMS } from '@/notations/BM-like/UPMS.ts';
import { LPMS, LPTSS } from '@/notations/BM-like/LPMS.ts';
import { wMM } from '@/notations/BM-like/wMM.ts';
import { DSM } from '@/notations/BM-like/DSM.ts';
import { WSMv1_4_1 } from '@/notations/BM-like/WSM.ts';
import { BTBM } from '@/notations/BM-like/BTBM.ts';
import { GMS_categories, GMS_notations } from '@/notations/BM-like/GMS.ts';
import { category_bm_minus1_y_nss } from '@/notations/BM-like/Minus1_Y_nSS-series/Minus1_Y_nSS.ts';
import { category_bm_t_minus1_y_nss } from '@/notations/BM-like/Minus1_Y_nSS-series/T_Minus1_Y_nSS.ts';
import { category_bm_bt_minus1_y_nss } from '@/notations/BM-like/Minus1_Y_nSS-series/BT_Minus1_Y_nSS.ts';
import { category_bm_bt_star_minus1_y_nss } from '@/notations/BM-like/Minus1_Y_nSS-series/BT_star_Minus1_Y_nSS.ts';
import { category_bm_bt_star_minus1_y_nss1 } from "@/notations/BM-like/Minus1_Y_nSS-series/BT_star_Minus1_Y_nSS'.ts";
import { category_bm_btl_minus1_y_nss } from '@/notations/BM-like/Minus1_Y_nSS-series/BTL_Minus1_Y_nSS.ts';
import { omega_MN } from '@/notations/MN/Omega_MN.ts';
import { T_omega_MN } from '@/notations/MN/T_omega_MN.ts';
import { A_omega2_MN2, wA_omega2_MN2 } from '@/notations/MN/Aw2MN2.ts';
import { A_omega2_MN3, wA_omega2_MN3 } from '@/notations/MN/Aw2MN3.ts';
import { category_n_mn } from '@/notations/SMN/n_MN.ts';
import { SA_omega2_MN } from '@/notations/SMN/SA_omega2_MN.ts';
import { S_omega2_MN } from '@/notations/SMN/S_omega2_MN.ts';
import { S_omega_pow_omega_MN } from '@/notations/SMN/S_omega_pow_omega_MN.ts';
import { DEN } from '@/notations/DEN/DEN.ts';
import { DEN2 } from '@/notations/DEN/DEN2.ts';
import { DEN3 } from '@/notations/DEN/DEN3.ts';
import { LMN } from '@/notations/OCN/LMN.ts';
import { LON } from '@/notations/OCN/LON.ts';
import { UPS1_1r5 } from '@/notations/OCN/UPS1_1r5.ts';
import { cOCF } from '@/notations/OCN/cOCF.ts';
import { n_shifted_psi } from '@/notations/OCN/n_shifted_psi.ts';
import { TON_DRC } from '@/notations/TON/TON_DRC.ts';
import { TON_DRP } from '@/notations/TON/TON_DRP.ts';
import { TON_DoR } from '@/notations/TON/TON_DoR.ts';
import { TON_DRPC } from '@/notations/TON/TON_DRPC.ts';
import { TON_I } from '@/notations/TON/TON_I.ts';
import { TON_IBP } from '@/notations/TON/TON_IBP.ts';
import { TON_main } from '@/notations/TON/TON_main.ts';
import { TON_MC } from '@/notations/TON/TON_MC.ts';
import { TON_MPC } from '@/notations/TON/TON_MPC.ts';
import { aSAN } from '@/notations/aSAN/aSAN.ts';
import { aSAN2 } from '@/notations/aSAN/aSAN2.ts';
import { aSAN3 } from '@/notations/aSAN/aSAN3.ts';
import { aSAN_tilde3plus } from '@/notations/aSAN/aSAN_tilde3plus.ts';

import { category_ocf, category_ocn } from '@/notations/OCN/categories.ts';
import { category_y } from '@/notations/Y/categories.ts';
import { category_bm_like, category_minus1_y_nss_series } from '@/notations/BM-like/categories.ts';
import { category_mn, category_hypcos_w2mn } from '@/notations/MN/categories.ts';
import { category_smile_mn } from '@/notations/SMN/categories.ts';
import { category_den } from '@/notations/DEN/categories.ts';
import { category_ton } from '@/notations/TON/categories.ts';
import { category_asan } from '@/notations/aSAN/categories.ts';

const REPOSITORY = 'https://github.com/SmileLee-lyx/ne-rewritten';
const COMMIT = '5413a94f0c5b6b56b4c13a91a8acf3a794698bb9';
const EXPECTED_NOTATION_COUNT = 105;
const EXPECTED_DIRECT_COUNT = 73;
const EXPECTED_GENERATED_COUNT = 32;

const directNotations: NotationDefinition<any>[] = [
    omega,
    VeblenPhi,
    BOCF_EBO,
    MOCF_EBO,
    NOCF_EBO,
    Inacc_OCF,
    finite_Mahlo_OCF,
    Minus1_Y,
    T_Minus1_Y,
    seq_0Y,
    Y_seq,
    omega_Y_weak,
    omega_Y_actual,
    omega_Y_medium,
    omega_Y_strong,
    BM4,
    TBM,
    CMS,
    BHM,
    BSM,
    BLM,
    UPMS,
    LPMS,
    LPTSS,
    wMM,
    DSM,
    WSMv1_4_1,
    BTBM,
    ...GMS_notations,
    omega_MN,
    T_omega_MN,
    A_omega2_MN2,
    wA_omega2_MN2,
    A_omega2_MN3,
    wA_omega2_MN3,
    SA_omega2_MN,
    S_omega2_MN,
    S_omega_pow_omega_MN,
    DEN,
    DEN2,
    DEN3,
    LMN,
    LON,
    UPS1_1r5,
    cOCF,
    n_shifted_psi,
    TON_DRC,
    TON_DRP,
    TON_DoR,
    TON_DRPC,
    TON_I,
    TON_IBP,
    TON_main,
    TON_MC,
    TON_MPC,
    aSAN,
    aSAN2,
    aSAN3,
    aSAN_tilde3plus,
];

const generatorCategories: NotationCategoryDefinition[] = [
    category_partial_UPMS,
    category_bm_minus1_y_nss,
    category_bm_t_minus1_y_nss,
    category_bm_bt_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss1,
    category_bm_btl_minus1_y_nss,
    ...GMS_categories.filter((category) => category.generator !== undefined),
    category_n_mn,
];

const allCategories: NotationCategoryDefinition[] = [
    category_ocf,
    category_y,
    category_y_omega,
    category_bm_like,
    category_partial_UPMS,
    category_minus1_y_nss_series,
    category_bm_minus1_y_nss,
    category_bm_t_minus1_y_nss,
    category_bm_bt_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss,
    category_bm_bt_star_minus1_y_nss1,
    category_bm_btl_minus1_y_nss,
    ...GMS_categories,
    category_mn,
    category_n_mn,
    category_hypcos_w2mn,
    category_smile_mn,
    category_den,
    category_ocn,
    category_ton,
    category_asan,
];

function materializeGenerator(category: NotationCategoryDefinition): NotationDefinition<any>[] {
    const generator = category.generator;
    if (!generator) return [];
    const result: NotationDefinition<any>[] = [];
    for (let index = generator.start; index <= generator.initial; index++) {
        result.push(generator.create(index));
    }
    return result;
}

const generatedNotations = generatorCategories.flatMap(materializeGenerator);
const notations = [...directNotations, ...generatedNotations];
const notationsById: Record<string, NotationDefinition<any>> = Object.create(null);

for (const notation of notations) {
    if (!notation || typeof notation.id !== 'string' || notation.id.length === 0) {
        throw new Error('SmileLee notation bundle contains an invalid notation definition.');
    }
    if (notationsById[notation.id]) {
        throw new Error(`SmileLee notation bundle contains duplicate id '${notation.id}'.`);
    }
    notationsById[notation.id] = notation;
}

if (
    directNotations.length !== EXPECTED_DIRECT_COUNT ||
    generatedNotations.length !== EXPECTED_GENERATED_COUNT ||
    notations.length !== EXPECTED_NOTATION_COUNT
) {
    throw new Error(
        'SmileLee notation bundle inventory changed: ' +
            `${directNotations.length} direct + ${generatedNotations.length} generated = ${notations.length}; ` +
            `expected ${EXPECTED_DIRECT_COUNT} + ${EXPECTED_GENERATED_COUNT} = ${EXPECTED_NOTATION_COUNT}.`,
    );
}

function validateGeneratorIndex(categoryId: string, index: number, start: number): void {
    if (!Number.isSafeInteger(index)) {
        throw new TypeError(`Generator index for '${categoryId}' must be a safe integer.`);
    }
    if (index < start) {
        throw new RangeError(`Generator index for '${categoryId}' must be at least ${start}; received ${index}.`);
    }
}

function validateGeneratedNotation(
    categoryId: string,
    index: number,
    notation: NotationDefinition<any>,
): NotationDefinition<any> {
    if (!notation || typeof notation !== 'object' || typeof notation.id !== 'string' || notation.id.length === 0) {
        throw new Error(`Generator '${categoryId}' returned an invalid notation for index ${index}.`);
    }
    if (notation.category_id !== categoryId) {
        throw new Error(
            `Generator '${categoryId}' returned notation '${notation.id}' in category '${notation.category_id}'.`,
        );
    }
    return notation;
}

const categories = allCategories.map((category) => {
    const generator = category.generator;
    return Object.freeze({
        id: category.id,
        name: category.name,
        simple_name: category.simple_name,
        parent_id: category.parent_id,
        generator: generator
            ? Object.freeze({
                  start: generator.start,
                  initial: generator.initial,
                  create(index: number) {
                      validateGeneratorIndex(category.id, index, generator.start);
                      return validateGeneratedNotation(category.id, index, generator.create(index));
                  },
              })
            : undefined,
    });
});
const categoriesById: Record<string, (typeof categories)[number]> = Object.create(null);
for (const category of categories) {
    if (categoriesById[category.id]) {
        throw new Error(`SmileLee notation bundle contains duplicate category id '${category.id}'.`);
    }
    categoriesById[category.id] = category;
}
const generatorCategoryIds = categories
    .filter((category) => category.generator !== undefined)
    .map((category) => category.id);

function createGeneratedNotation(categoryId: string, index: number): NotationDefinition<any> {
    if (typeof categoryId !== 'string' || categoryId.length === 0) {
        throw new TypeError('Generator category id must be a non-empty string.');
    }
    const category = categoriesById[categoryId];
    if (!category) throw new Error(`Unknown SmileLee notation category '${categoryId}'.`);
    if (!category.generator) throw new Error(`SmileLee notation category '${categoryId}' is not generated.`);
    return category.generator.create(index);
}

const credits = {
    'credit.bashicu': {
        zh: '由 Bashicu Hyudora 定义; 展开器来自原 NE 项目.',
        en: 'Defined by Bashicu Hyudora; expander from the original NE project.',
    },
    'credit.tbm': { zh: '由社区定义.', en: 'Defined by the community.' },
    'credit.yukito': {
        zh: '由 Yukito 定义; 展开器来自原 NE 项目, 最初由 Yukito 给出; 山脉图绘制由 Yukito 给出.',
        en: 'Defined by Yukito; expander from the original NE project, originally by Yukito; mountain diagram by Yukito.',
    },
    'credit.den': {
        zh: '由 Hypcos 基于 test_alpha0 定义的 BLP 作出定义; 展开器来自原 NE 项目; 可视化方案由 test_alpha0 给出.',
        en: 'Defined by Hypcos based on BLP by test_alpha0; expander from the original NE project; visualization by test_alpha0.',
    },
    'credit.den23': {
        zh: '由 test_alpha0 基于 DEN 作出定义; 展开器来自原 NE 项目; 可视化方案由 test_alpha0 给出.',
        en: 'Defined by test_alpha0 based on DEN; expander from the original NE project; visualization by test_alpha0.',
    },
    'credit.btbm': {
        zh: '由 Bubby3 最初提出设想, 由社区完善. 笑姐姐 基于与 Asheep233 的讨论给出展开器.',
        en: 'Originally conceived by Bubby3, refined by the community. Expander by 笑姐姐 (Smile Lee) based on discussions with Asheep233.',
    },
    'credit.hypcos_mn': {
        zh: '由 Hypcos 定义; 展开器来自原 NE 项目.',
        en: 'Defined by Hypcos; expander from the original NE project.',
    },
    'credit.n_mn': {
        zh: '由 笑姐姐 基于 Hypcos 的 MN 系列作出定义, 并给出展开器.',
        en: "Defined by 笑姐姐 (Smile Lee) based on Hypcos's MN series; expander also by 笑姐姐 (Smile Lee).",
    },
    'credit.test-alpha0': {
        zh: '由 test_alpha0 定义, 并给出展开器.',
        en: 'Defined by test_alpha0, with expander by the same author.',
    },
    'credit.test-alpha0-ocn': {
        zh: '由 test_alpha0 定义, 并给出展开器. 同时提供 OCN 渲染.',
        en: 'Defined by test_alpha0, with expander by the same author. Also provides OCN rendering.',
    },
    'credit.ton': {
        zh: '由 Taranosvky 定义; 展开器来自原 NE 项目.',
        en: 'Defined by Taranosvky; expander from the original NE project.',
    },
    'credit.asan': {
        zh: '由 Aarex 定义; 展开器来自原 NE 项目.',
        en: 'Defined by Aarex; expander from the original NE project.',
    },
    'credit.community_y': { zh: '由社区定义.', en: 'Defined by the community.' },
    'credit.asheep': {
        zh: '由 Asheep233 给出粗略定义, 由 笑姐姐 基于此给出展开器.',
        en: 'Rough definition by Asheep233; expander by 笑姐姐 (Smile Lee) based on it.',
    },
    'credit.bocf': {
        zh: '由 Buchholz 给出最初定义; 由社区完善.',
        en: 'Initially defined by Buchholz; refined by the community.',
    },
    'credit.mocf': { zh: '由 Madore 给出最初定义.', en: 'Initially defined by Madore.' },
    'credit.nocf': { zh: '由社区定义.', en: 'Defined by the community.' },
    'credit.ups1_1r5': {
        zh: '由 Optimism 最初创作, Alice 完善. 由 Alice 给出展开器与可视化方案.',
        en: 'Originally created by Optimism, refined by Alice. Expander and visualization by Alice.',
    },
    'credit.dsm': {
        zh: '由 Alice 定义并给出展开器.',
        en: 'Defined by Alice, with expander by the same author.',
    },
    'credit.wmm': {
        zh: '由社区从 Aarex 定义的 MMS 改进而来. 展开器来自原 NE 项目.',
        en: 'A community improvement upon MMS defined by Aarex. Expander from the original NE project.',
    },
};

const bundle = Object.freeze({
    schemaVersion: 2,
    source: Object.freeze({ repository: REPOSITORY, commit: COMMIT }),
    counts: Object.freeze({
        direct: directNotations.length,
        generated: generatedNotations.length,
        total: notations.length,
    }),
    notations: Object.freeze(notations),
    notationsById: Object.freeze(notationsById),
    generatedNotationIds: Object.freeze(generatedNotations.map((notation) => notation.id)),
    categories: Object.freeze(categories),
    categoriesById: Object.freeze(categoriesById),
    generatorCategoryIds: Object.freeze(generatorCategoryIds),
    createGeneratedNotation,
    credits: Object.freeze(credits),
});

Object.defineProperty(globalThis, 'SmileLeeNotationBundle', {
    configurable: false,
    enumerable: true,
    writable: false,
    value: bundle,
});
