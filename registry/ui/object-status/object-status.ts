import { NgTemplateOutlet } from '@angular/common';
import {
    ChangeDetectionStrategy,
    Component,
    ElementRef,
    TemplateRef,
    booleanAttribute,
    computed,
    inject,
    input
} from '@angular/core';
import { cn, type ClassValue } from '@/lib/utils';
import { Icon, type IconFont } from '@/ui/icon/icon';

export type ObjectStatus = 'negative' | 'critical' | 'positive' | 'informative' | 'neutral';
export type IndicationColor = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 10;

/** Text (--os-c) and icon (--os-ic) colours. */
const PLAIN: Record<ObjectStatus, string> = {
    neutral: '[--os-c:var(--sapNeutralTextColor)] [--os-ic:var(--sapNeutralElementColor)]',
    positive: '[--os-c:var(--sapPositiveTextColor)] [--os-ic:var(--sapPositiveElementColor)]',
    critical: '[--os-c:var(--sapCriticalTextColor)] [--os-ic:var(--sapCriticalElementColor)]',
    negative: '[--os-c:var(--sapNegativeTextColor)] [--os-ic:var(--sapNegativeElementColor)]',
    informative: '[--os-c:var(--sapInformativeTextColor)] [--os-ic:var(--sapInformativeElementColor)]'
};
const INDICATION: Record<IndicationColor, string> = {
    1: '[--os-c:var(--sapIndicationColor_1)] [--os-ic:var(--sapIndicationColor_1)]',
    2: '[--os-c:var(--sapIndicationColor_2)] [--os-ic:var(--sapIndicationColor_2)]',
    3: '[--os-c:var(--sapIndicationColor_3)] [--os-ic:var(--sapIndicationColor_3)]',
    4: '[--os-c:var(--sapIndicationColor_4)] [--os-ic:var(--sapIndicationColor_4)]',
    5: '[--os-c:var(--sapIndicationColor_5)] [--os-ic:var(--sapIndicationColor_5)]',
    6: '[--os-c:var(--sapIndicationColor_6)] [--os-ic:var(--sapIndicationColor_6)]',
    7: '[--os-c:var(--sapIndicationColor_7)] [--os-ic:var(--sapIndicationColor_7)]',
    8: '[--os-c:var(--sapIndicationColor_8)] [--os-ic:var(--sapIndicationColor_8)]',
    9: '[--os-c:var(--sapIndicationColor_9)] [--os-ic:var(--sapIndicationColor_9)]',
    10: '[--os-c:var(--sapIndicationColor_10)] [--os-ic:var(--sapIndicationColor_10)]'
};

/** Inverted colours: regular (--os-*), hover (--os-h-*), active (--os-a-*) and visited (--os-v-*). */
const INVERTED: Record<ObjectStatus, string> = {
    neutral:
        '[--os-c:var(--sapTextColor)] [--os-ic:var(--sapTextColor)] [--os-bg:var(--sapNeutralBackground)] [--os-bc:var(--sapNeutralBorderColor)] [--os-h-c:var(--sapButton_Neutral_Hover_TextColor)] [--os-h-bg:var(--sapButton_Neutral_Hover_Background)] [--os-h-bc:var(--sapButton_Neutral_Hover_BorderColor)] [--os-a-c:var(--sapButton_Active_TextColor)] [--os-a-ic:var(--sapButton_Active_TextColor)] [--os-a-bg:var(--sapButton_Neutral_Active_Background)] [--os-a-bc:var(--sapButton_Neutral_Active_BorderColor)] [--os-v-c:var(--sapTextColor)] [--os-v-bg:var(--sapNeutralBackground)] [--os-v-bc:var(--sapNeutralBorderColor)]',
    positive:
        '[--os-c:var(--sapButton_Success_TextColor)] [--os-ic:var(--sapButton_Success_TextColor)] [--os-bg:var(--sapButton_Success_Background)] [--os-bc:var(--sapButton_Success_BorderColor)] [--os-h-c:var(--sapButton_Success_Hover_TextColor)] [--os-h-bg:var(--sapButton_Success_Hover_Background)] [--os-h-bc:var(--sapButton_Success_Hover_BorderColor)] [--os-a-c:var(--sapButton_Accept_Selected_TextColor)] [--os-a-ic:var(--sapButton_Accept_Selected_TextColor)] [--os-a-bg:var(--sapButton_Success_Active_Background)] [--os-a-bc:var(--sapButton_Success_Active_BorderColor)] [--os-v-c:var(--sapButton_Critical_TextColor)] [--os-v-bg:var(--sapButton_Success_Background)] [--os-v-bc:var(--sapButton_Success_BorderColor)]',
    critical:
        '[--os-c:var(--sapButton_Critical_TextColor)] [--os-ic:var(--sapButton_Critical_TextColor)] [--os-bg:var(--sapButton_Critical_Background)] [--os-bc:var(--sapButton_Critical_BorderColor)] [--os-h-c:var(--sapButton_Critical_Hover_TextColor)] [--os-h-bg:var(--sapButton_Critical_Hover_Background)] [--os-h-bc:var(--sapButton_Critical_Hover_BorderColor)] [--os-a-c:var(--sapButton_Attention_Selected_TextColor)] [--os-a-ic:var(--sapButton_Attention_Selected_TextColor)] [--os-a-bg:var(--sapButton_Critical_Active_Background)] [--os-a-bc:var(--sapButton_Critical_Active_BorderColor)] [--os-v-c:var(--sapButton_Critical_TextColor)] [--os-v-bg:var(--sapButton_Critical_Background)] [--os-v-bc:var(--sapButton_Critical_BorderColor)]',
    negative:
        '[--os-c:var(--sapButton_Negative_TextColor)] [--os-ic:var(--sapButton_Negative_TextColor)] [--os-bg:var(--sapButton_Negative_Background)] [--os-bc:var(--sapButton_Negative_BorderColor)] [--os-h-c:var(--sapButton_Negative_Hover_TextColor)] [--os-h-bg:var(--sapButton_Negative_Hover_Background)] [--os-h-bc:var(--sapButton_Negative_Hover_BorderColor)] [--os-a-c:var(--sapButton_Reject_Selected_TextColor)] [--os-a-ic:var(--sapButton_Reject_Selected_TextColor)] [--os-a-bg:var(--sapButton_Negative_Active_Background)] [--os-a-bc:var(--sapButton_Negative_Active_BorderColor)] [--os-v-c:var(--sapButton_Negative_Background)] [--os-v-bg:var(--sapButton_Negative_TextColor)] [--os-v-bc:var(--sapButton_Negative_BorderColor)]',
    informative:
        '[--os-c:var(--sapButton_Information_TextColor)] [--os-ic:var(--sapButton_Information_TextColor)] [--os-bg:var(--sapButton_Information_Background)] [--os-bc:var(--sapButton_Information_BorderColor)] [--os-h-c:var(--sapButton_Information_Hover_TextColor)] [--os-h-bg:var(--sapButton_Information_Hover_Background)] [--os-h-bc:var(--sapButton_Information_Hover_BorderColor)] [--os-a-c:var(--sapButton_Selected_TextColor)] [--os-a-ic:var(--sapButton_Selected_TextColor)] [--os-a-bg:var(--sapButton_Information_Active_Background)] [--os-a-bc:var(--sapButton_Information_Active_BorderColor)] [--os-v-c:var(--sapButton_Information_TextColor)] [--os-v-bg:var(--sapButton_Information_Background)] [--os-v-bc:var(--sapButton_Information_BorderColor)]'
};
const INVERTED_INDICATION: Record<string, string> = {
    '1': '[--os-c:var(--sapIndicationColor_1_TextColor)] [--os-ic:var(--sapIndicationColor_1_TextColor)] [--os-bg:var(--sapIndicationColor_1_Background)] [--os-bc:var(--sapIndicationColor_1_BorderColor)] [--os-h-c:var(--sapIndicationColor_1_TextColor)] [--os-h-bg:var(--sapIndicationColor_1_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_1_BorderColor)] [--os-a-c:var(--sapIndicationColor_1_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_1_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_1_Active_Background)] [--os-a-bc:var(--sapIndicationColor_1_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_1_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_1)] [--os-v-bc:var(--sapIndicationColor_1_Active_BorderColor)]',
    '2': '[--os-c:var(--sapIndicationColor_2_TextColor)] [--os-ic:var(--sapIndicationColor_2_TextColor)] [--os-bg:var(--sapIndicationColor_2_Background)] [--os-bc:var(--sapIndicationColor_2_BorderColor)] [--os-h-c:var(--sapIndicationColor_2_TextColor)] [--os-h-bg:var(--sapIndicationColor_2_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_2_BorderColor)] [--os-a-c:var(--sapIndicationColor_2_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_2_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_2_Active_Background)] [--os-a-bc:var(--sapIndicationColor_2_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_2_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_2)] [--os-v-bc:var(--sapIndicationColor_2_Active_BorderColor)]',
    '3': '[--os-c:var(--sapIndicationColor_3_TextColor)] [--os-ic:var(--sapIndicationColor_3_TextColor)] [--os-bg:var(--sapIndicationColor_3_Background)] [--os-bc:var(--sapIndicationColor_3_BorderColor)] [--os-h-c:var(--sapIndicationColor_3_TextColor)] [--os-h-bg:var(--sapIndicationColor_3_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_3_BorderColor)] [--os-a-c:var(--sapIndicationColor_3_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_3_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_3_Active_Background)] [--os-a-bc:var(--sapIndicationColor_3_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_3_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_3)] [--os-v-bc:var(--sapIndicationColor_3_Active_BorderColor)]',
    '4': '[--os-c:var(--sapIndicationColor_4_TextColor)] [--os-ic:var(--sapIndicationColor_4_TextColor)] [--os-bg:var(--sapIndicationColor_4_Background)] [--os-bc:var(--sapIndicationColor_4_BorderColor)] [--os-h-c:var(--sapIndicationColor_4_TextColor)] [--os-h-bg:var(--sapIndicationColor_4_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_4_BorderColor)] [--os-a-c:var(--sapIndicationColor_4_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_4_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_4_Active_Background)] [--os-a-bc:var(--sapIndicationColor_4_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_4_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_4)] [--os-v-bc:var(--sapIndicationColor_4_Active_BorderColor)]',
    '5': '[--os-c:var(--sapIndicationColor_5_TextColor)] [--os-ic:var(--sapIndicationColor_5_TextColor)] [--os-bg:var(--sapIndicationColor_5_Background)] [--os-bc:var(--sapIndicationColor_5_BorderColor)] [--os-h-c:var(--sapIndicationColor_5_TextColor)] [--os-h-bg:var(--sapIndicationColor_5_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_5_BorderColor)] [--os-a-c:var(--sapIndicationColor_5_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_5_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_5_Active_Background)] [--os-a-bc:var(--sapIndicationColor_5_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_5_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_5)] [--os-v-bc:var(--sapIndicationColor_5_Active_BorderColor)]',
    '6': '[--os-c:var(--sapIndicationColor_6_TextColor)] [--os-ic:var(--sapIndicationColor_6_TextColor)] [--os-bg:var(--sapIndicationColor_6_Background)] [--os-bc:var(--sapIndicationColor_6_BorderColor)] [--os-h-c:var(--sapIndicationColor_6_TextColor)] [--os-h-bg:var(--sapIndicationColor_6_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_6_BorderColor)] [--os-a-c:var(--sapIndicationColor_6_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_6_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_6_Active_Background)] [--os-a-bc:var(--sapIndicationColor_6_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_6_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_6)] [--os-v-bc:var(--sapIndicationColor_6_Active_BorderColor)]',
    '7': '[--os-c:var(--sapIndicationColor_7_TextColor)] [--os-ic:var(--sapIndicationColor_7_TextColor)] [--os-bg:var(--sapIndicationColor_7_Background)] [--os-bc:var(--sapIndicationColor_7_BorderColor)] [--os-h-c:var(--sapIndicationColor_7_TextColor)] [--os-h-bg:var(--sapIndicationColor_7_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_7_BorderColor)] [--os-a-c:var(--sapIndicationColor_7_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_7_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_7_Active_Background)] [--os-a-bc:var(--sapIndicationColor_7_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_7_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_7)] [--os-v-bc:var(--sapIndicationColor_7_Active_BorderColor)]',
    '8': '[--os-c:var(--sapIndicationColor_8_TextColor)] [--os-ic:var(--sapIndicationColor_8_TextColor)] [--os-bg:var(--sapIndicationColor_8_Background)] [--os-bc:var(--sapIndicationColor_8_BorderColor)] [--os-h-c:var(--sapIndicationColor_8_TextColor)] [--os-h-bg:var(--sapIndicationColor_8_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_8_BorderColor)] [--os-a-c:var(--sapIndicationColor_8_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_8_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_8_Active_Background)] [--os-a-bc:var(--sapIndicationColor_8_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_8_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_8)] [--os-v-bc:var(--sapIndicationColor_8_Active_BorderColor)]',
    '9': '[--os-c:var(--sapIndicationColor_9_TextColor)] [--os-ic:var(--sapIndicationColor_9_TextColor)] [--os-bg:var(--sapIndicationColor_9_Background)] [--os-bc:var(--sapIndicationColor_9_BorderColor)] [--os-h-c:var(--sapIndicationColor_9_TextColor)] [--os-h-bg:var(--sapIndicationColor_9_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_9_BorderColor)] [--os-a-c:var(--sapIndicationColor_9_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_9_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_9_Active_Background)] [--os-a-bc:var(--sapIndicationColor_9_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_9_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_9)] [--os-v-bc:var(--sapIndicationColor_9_Active_BorderColor)]',
    '10': '[--os-c:var(--sapIndicationColor_10_TextColor)] [--os-ic:var(--sapIndicationColor_10_TextColor)] [--os-bg:var(--sapIndicationColor_10_Background)] [--os-bc:var(--sapIndicationColor_10_BorderColor)] [--os-h-c:var(--sapIndicationColor_10_TextColor)] [--os-h-bg:var(--sapIndicationColor_10_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_10_BorderColor)] [--os-a-c:var(--sapIndicationColor_10_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_10_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_10_Active_Background)] [--os-a-bc:var(--sapIndicationColor_10_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_10_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_10)] [--os-v-bc:var(--sapIndicationColor_10_Active_BorderColor)]',
    '1b': '[--os-c:var(--sapIndicationColor_1)] [--os-ic:var(--sapIndicationColor_1)] [--os-bg:var(--sapIndicationColor_1b)] [--os-bc:var(--sapIndicationColor_1b_BorderColor)] [--os-h-c:var(--sapIndicationColor_1)] [--os-h-bg:var(--sapIndicationColor_1b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_1b_BorderColor)] [--os-a-c:var(--sapIndicationColor_1_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_1_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_1_Active_Background)] [--os-a-bc:var(--sapIndicationColor_1_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_1_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_1_Active_Background)] [--os-v-bc:var(--sapIndicationColor_1_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_1_TextColor)] hc:[--os-ic:var(--sapIndicationColor_1_TextColor)] hc:[--os-bg:var(--sapIndicationColor_1_Background)] hc:[--os-bc:var(--sapIndicationColor_1_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_1_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_1_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_1_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '2b': '[--os-c:var(--sapIndicationColor_2)] [--os-ic:var(--sapIndicationColor_2)] [--os-bg:var(--sapIndicationColor_2b)] [--os-bc:var(--sapIndicationColor_2b_BorderColor)] [--os-h-c:var(--sapIndicationColor_2)] [--os-h-bg:var(--sapIndicationColor_2b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_2b_BorderColor)] [--os-a-c:var(--sapIndicationColor_2_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_2_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_2_Active_Background)] [--os-a-bc:var(--sapIndicationColor_2_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_2_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_2_Active_Background)] [--os-v-bc:var(--sapIndicationColor_2_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_2_TextColor)] hc:[--os-ic:var(--sapIndicationColor_2_TextColor)] hc:[--os-bg:var(--sapIndicationColor_2_Background)] hc:[--os-bc:var(--sapIndicationColor_2_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_2_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_2_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_2_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '3b': '[--os-c:var(--sapIndicationColor_3)] [--os-ic:var(--sapIndicationColor_3)] [--os-bg:var(--sapIndicationColor_3b)] [--os-bc:var(--sapIndicationColor_3b_BorderColor)] [--os-h-c:var(--sapIndicationColor_3)] [--os-h-bg:var(--sapIndicationColor_3b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_3b_BorderColor)] [--os-a-c:var(--sapIndicationColor_3_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_3_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_3_Active_Background)] [--os-a-bc:var(--sapIndicationColor_3_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_3_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_3_Active_Background)] [--os-v-bc:var(--sapIndicationColor_3_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_3_TextColor)] hc:[--os-ic:var(--sapIndicationColor_3_TextColor)] hc:[--os-bg:var(--sapIndicationColor_3_Background)] hc:[--os-bc:var(--sapIndicationColor_3_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_3_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_3_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_3_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '4b': '[--os-c:var(--sapIndicationColor_4)] [--os-ic:var(--sapIndicationColor_4)] [--os-bg:var(--sapIndicationColor_4b)] [--os-bc:var(--sapIndicationColor_4b_BorderColor)] [--os-h-c:var(--sapIndicationColor_4)] [--os-h-bg:var(--sapIndicationColor_4b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_4b_BorderColor)] [--os-a-c:var(--sapIndicationColor_4_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_4_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_4_Active_Background)] [--os-a-bc:var(--sapIndicationColor_4_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_4_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_4_Active_Background)] [--os-v-bc:var(--sapIndicationColor_4_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_4_TextColor)] hc:[--os-ic:var(--sapIndicationColor_4_TextColor)] hc:[--os-bg:var(--sapIndicationColor_4_Background)] hc:[--os-bc:var(--sapIndicationColor_4_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_4_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_4_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_4_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '5b': '[--os-c:var(--sapIndicationColor_5)] [--os-ic:var(--sapIndicationColor_5)] [--os-bg:var(--sapIndicationColor_5b)] [--os-bc:var(--sapIndicationColor_5b_BorderColor)] [--os-h-c:var(--sapIndicationColor_5)] [--os-h-bg:var(--sapIndicationColor_5b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_5b_BorderColor)] [--os-a-c:var(--sapIndicationColor_5_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_5_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_5_Active_Background)] [--os-a-bc:var(--sapIndicationColor_5_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_5_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_5_Active_Background)] [--os-v-bc:var(--sapIndicationColor_5_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_5_TextColor)] hc:[--os-ic:var(--sapIndicationColor_5_TextColor)] hc:[--os-bg:var(--sapIndicationColor_5_Background)] hc:[--os-bc:var(--sapIndicationColor_5_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_5_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_5_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_5_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '6b': '[--os-c:var(--sapIndicationColor_6)] [--os-ic:var(--sapIndicationColor_6)] [--os-bg:var(--sapIndicationColor_6b)] [--os-bc:var(--sapIndicationColor_6b_BorderColor)] [--os-h-c:var(--sapIndicationColor_6)] [--os-h-bg:var(--sapIndicationColor_6b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_6b_BorderColor)] [--os-a-c:var(--sapIndicationColor_6_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_6_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_6_Active_Background)] [--os-a-bc:var(--sapIndicationColor_6_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_6_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_6_Active_Background)] [--os-v-bc:var(--sapIndicationColor_6_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_6_TextColor)] hc:[--os-ic:var(--sapIndicationColor_6_TextColor)] hc:[--os-bg:var(--sapIndicationColor_6_Background)] hc:[--os-bc:var(--sapIndicationColor_6_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_6_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_6_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_6_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '7b': '[--os-c:var(--sapIndicationColor_7)] [--os-ic:var(--sapIndicationColor_7)] [--os-bg:var(--sapIndicationColor_7b)] [--os-bc:var(--sapIndicationColor_7b_BorderColor)] [--os-h-c:var(--sapIndicationColor_7)] [--os-h-bg:var(--sapIndicationColor_7b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_7b_BorderColor)] [--os-a-c:var(--sapIndicationColor_7_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_7_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_7_Active_Background)] [--os-a-bc:var(--sapIndicationColor_7_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_7_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_7_Active_Background)] [--os-v-bc:var(--sapIndicationColor_7_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_7_TextColor)] hc:[--os-ic:var(--sapIndicationColor_7_TextColor)] hc:[--os-bg:var(--sapIndicationColor_7_Background)] hc:[--os-bc:var(--sapIndicationColor_7_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_7_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_7_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_7_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '8b': '[--os-c:var(--sapIndicationColor_8)] [--os-ic:var(--sapIndicationColor_8)] [--os-bg:var(--sapIndicationColor_8b)] [--os-bc:var(--sapIndicationColor_8b_BorderColor)] [--os-h-c:var(--sapIndicationColor_8)] [--os-h-bg:var(--sapIndicationColor_8b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_8b_BorderColor)] [--os-a-c:var(--sapIndicationColor_8_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_8_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_8_Active_Background)] [--os-a-bc:var(--sapIndicationColor_8_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_8_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_8_Active_Background)] [--os-v-bc:var(--sapIndicationColor_8_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_8_TextColor)] hc:[--os-ic:var(--sapIndicationColor_8_TextColor)] hc:[--os-bg:var(--sapIndicationColor_8_Background)] hc:[--os-bc:var(--sapIndicationColor_8_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_8_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_8_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_8_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '9b': '[--os-c:var(--sapIndicationColor_9)] [--os-ic:var(--sapIndicationColor_9)] [--os-bg:var(--sapIndicationColor_9b)] [--os-bc:var(--sapIndicationColor_9b_BorderColor)] [--os-h-c:var(--sapIndicationColor_9)] [--os-h-bg:var(--sapIndicationColor_9b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_9b_BorderColor)] [--os-a-c:var(--sapIndicationColor_9_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_9_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_9_Active_Background)] [--os-a-bc:var(--sapIndicationColor_9_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_9_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_9_Active_Background)] [--os-v-bc:var(--sapIndicationColor_9_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_9_TextColor)] hc:[--os-ic:var(--sapIndicationColor_9_TextColor)] hc:[--os-bg:var(--sapIndicationColor_9_Background)] hc:[--os-bc:var(--sapIndicationColor_9_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_9_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_9_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_9_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]',
    '10b': '[--os-c:var(--sapIndicationColor_10)] [--os-ic:var(--sapIndicationColor_10)] [--os-bg:var(--sapIndicationColor_10b)] [--os-bc:var(--sapIndicationColor_10b_BorderColor)] [--os-h-c:var(--sapIndicationColor_10)] [--os-h-bg:var(--sapIndicationColor_10b_Hover_Background)] [--os-h-bc:var(--sapIndicationColor_10b_BorderColor)] [--os-a-c:var(--sapIndicationColor_10_Active_TextColor)] [--os-a-ic:var(--sapIndicationColor_10_Active_TextColor)] [--os-a-bg:var(--sapIndicationColor_10_Active_Background)] [--os-a-bc:var(--sapIndicationColor_10_Active_BorderColor)] [--os-v-c:var(--sapIndicationColor_10_Active_TextColor)] [--os-v-bg:var(--sapIndicationColor_10_Active_Background)] [--os-v-bc:var(--sapIndicationColor_10_Active_BorderColor)] hc:[--os-c:var(--sapIndicationColor_10_TextColor)] hc:[--os-ic:var(--sapIndicationColor_10_TextColor)] hc:[--os-bg:var(--sapIndicationColor_10_Background)] hc:[--os-bc:var(--sapIndicationColor_10_BorderColor)] hc:[--os-h-c:var(--sapIndicationColor_10_TextColor)] hc:[--os-h-bg:var(--sapIndicationColor_10_Hover_Background)] hc:[--os-h-bc:var(--sapIndicationColor_10_BorderColor)] text-shadow-sap-content-text-shadow hc:[text-shadow:none]'
};

const STATUS_TEXT: Partial<Record<ObjectStatus, string>> = {
    critical: 'Warning issued',
    informative: 'Informative entry',
    negative: 'Invalid Entry',
    positive: 'Entry successfully validated'
};

/**
 * Object status: the status of an object as coloured text and/or icon; inverted shows it as a
 * filled badge. Clickable statuses are buttons.
 *
 * ```html
 * <span fdObjectStatus status="positive" glyph="sys-enter-2" label="Approved"></span>
 * <span fdObjectStatus status="negative" inverted label="5"></span>
 * <button fdObjectStatus [indicationColor]="6" clickable label="In review" (click)="open()"></button>
 * ```
 */
@Component({
    selector: '[fdObjectStatus], [fd-object-status]',
    exportAs: 'fdObjectStatus',
    imports: [Icon, NgTemplateOutlet],
    changeDetection: ChangeDetectionStrategy.OnPush,
    host: {
        '[class]': 'computedClass()',
        '[attr.tabindex]': 'clickable() ? 0 : null',
        '[attr.role]': 'clickable() ? "button" : null',
        '[attr.aria-roledescription]': 'clickable() ? ariaRoleDescription() : null',
        '(keydown.enter)': 'activate($event)',
        '(keydown.space)': 'activate($event)'
    },
    template: `
        @if (glyph()) {
            <fd-icon
                [glyph]="glyph()"
                [font]="glyphFont()"
                [ariaLabel]="glyphAriaLabel()"
                class="flex items-center justify-center text-(length:--os-icon) leading-(--os-h) text-(--os-ic)"
            />
        }
        @if (textTemplate()) {
            <span [class]="textClass()"><ng-container [ngTemplateOutlet]="textTemplate()" /></span>
        }
        @if (label()) {
            <span [class]="textClass()">{{ label() }}</span>
        }
        @if (!clickable()) {
            <span class="sr-only-sap">{{ ariaLabel() || 'Object Status' }}</span>
        }
        @if (indicationColor()) {
            <span class="sr-only-sap"
                >Indication Color {{ indicationColor() }}{{ secondaryIndication() ? 'b' : '' }}</span
            >
        }
        @if (statusText()) {
            <span class="sr-only-sap">{{ statusText() }}</span>
        }
    `
})
export class ObjectStatusComponent {
    readonly status = input<ObjectStatus | null | undefined>();
    /** Announced instead of the default text of the status. */
    readonly statusMessage = input<string | null | undefined>();
    readonly label = input<string | null | undefined>();
    readonly glyph = input<string | null | undefined>();
    readonly glyphFont = input<IconFont>('SAP-icons');
    readonly glyphAriaLabel = input<string | null | undefined>();
    readonly ariaLabel = input<string | null | undefined>();
    readonly ariaRoleDescription = input('Object Status Button');
    /** Generic indication colour 1-10, instead of a status. */
    readonly indicationColor = input<IndicationColor | null | undefined>();
    /** Second set of indication colours (inverted only). */
    readonly secondaryIndication = input(false, { transform: booleanAttribute });
    readonly clickable = input(false, { transform: booleanAttribute });
    /** Filled badge style. */
    readonly inverted = input(false, { transform: booleanAttribute });
    readonly large = input(false, { transform: booleanAttribute });
    /** Truncates the text with an ellipsis. */
    readonly truncate = input(false, { transform: booleanAttribute });
    readonly textTemplate = input<TemplateRef<unknown> | null | undefined>();
    readonly userClass = input<ClassValue>('', { alias: 'class' });

    private readonly elementRef = inject<ElementRef<HTMLElement>>(ElementRef);

    /** role="button" hosts activate with Enter and Space like native buttons. */
    protected activate(event: Event): void {
        const host = this.elementRef.nativeElement;
        if (!this.clickable() || event.target !== host || host instanceof HTMLButtonElement) return;
        event.preventDefault();
        host.click();
    }

    protected readonly statusText = computed(() => {
        const status = this.status();
        return status ? this.statusMessage() || STATUS_TEXT[status] || null : null;
    });

    protected readonly textClass = computed(() =>
        cn(
            'm-0 p-0 leading-(--os-h) [font-size:inherit] [font-family:inherit] text-inherit',
            this.clickable() &&
                !this.inverted() &&
                'underline group-hover/os:no-underline group-active/os:no-underline group-focus/os:underline',
            this.truncate() && 'truncate'
        )
    );

    protected readonly computedClass = computed(() => {
        const status = this.status() ?? 'neutral';
        const indication = this.indicationColor();
        const inverted = this.inverted();
        const clickable = this.clickable();
        const large = this.large();
        const iconOnly = !this.label() && !this.textTemplate();
        return cn(
            'group/os relative m-0 box-border inline-flex max-w-full items-center justify-center gap-1 p-0 align-middle',
            'h-fit min-h-(--os-h) min-w-6 leading-(--os-h) break-words',
            '[--os-h:1rem] [--os-icon:1rem] text-(length:--os-font) [--os-font:var(--sapFontSize)] font-sap-font-family',
            'text-(--os-c) text-shadow-sap-content-text-shadow',
            indication ? INDICATION[indication] : PLAIN[status],
            large && '[--os-h:1.5rem] [--os-icon:1.5rem] [--os-font:1.5rem] font-sap-font-light-family',
            clickable &&
                !inverted && [
                    'cursor-pointer focus:outline-none',
                    // Horizon: filled focus in the contrast colour; high contrast: dotted outline
                    'focus:not-active:rounded-[0.125rem] focus:not-active:bg-sap-content-focus-color focus:not-active:[text-shadow:none]',
                    'focus:not-active:outline-[0.125rem] focus:not-active:outline-solid focus:not-active:outline-sap-content-focus-color',
                    'focus:not-active:[--os-c:var(--sapContent_ContrastTextColor)] focus:not-active:[--os-ic:var(--sapContent_ContrastTextColor)]',
                    'hc:focus:not-active:bg-inherit hc:focus:not-active:rounded-none hc:focus:not-active:outline-dotted',
                    indication ? hcFocus(INDICATION[indication]) : hcFocus(PLAIN[status])
                ],
            inverted && [
                'max-h-none overflow-hidden border border-solid border-(--os-bc) bg-(--os-bg) [text-shadow:none]',
                'min-h-[1.375rem] min-w-[1.375rem] px-1 py-[0.1875rem] rounded-sap-button-border-corner-radius',
                '[--os-icon:0.75rem] [--os-font:var(--sapFontSmallSize)] font-sap-font-bold-family [&>*]:leading-4',
                indication
                    ? INVERTED_INDICATION[`${indication}${this.secondaryIndication() ? 'b' : ''}`]
                    : INVERTED[status],
                large &&
                    'h-auto min-w-7 self-center px-1 py-px [--os-h:1.5rem] [--os-icon:1.5rem] [--os-font:1.25rem] font-sap-font-semibold-family [&>*]:leading-(--os-h)',
                clickable && [
                    'cursor-pointer',
                    'hover:[--os-c:var(--os-h-c)] hover:[--os-ic:var(--os-h-c)] hover:[--os-bg:var(--os-h-bg)] hover:[--os-bc:var(--os-h-bc)]',
                    'active:[--os-c:var(--os-a-c)] active:[--os-ic:var(--os-a-ic)] active:[--os-bg:var(--os-a-bg)] active:[--os-bc:var(--os-a-bc)]',
                    'focus:border-sap-content-focus-color focus:outline focus:outline-1 focus:[outline-style:var(--sapContent_FocusStyle)] focus:outline-sap-content-focus-color focus:-outline-offset-2',
                    'focus:shadow-[inset_0_0_0_0.125rem_var(--sapContent_ContrastFocusColor)] hc:focus:shadow-none'
                ]
            ],
            iconOnly && 'min-w-6',
            this.userClass()
        );
    });
}

/** In high contrast, focused statuses keep their colours instead of the contrast text colour. */
function hcFocus(colors: string): string {
    return colors.replace(/\[--os-(i?c):/g, 'hc:focus:not-active:[--os-$1:');
}
