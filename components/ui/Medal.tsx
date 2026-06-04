'use client';

import { useId } from 'react';
import { Lock } from '@phosphor-icons/react/dist/ssr';
import { Mascot } from './Mascot';
import { cn } from '@/lib/utils';

export type MedalType =
  | 'first-lesson'
  | '100-xp'
  | '40-questions'
  | '500-xp'
  | 'perfect-lesson'
  | 'week-champ'
  | 'hot-streak'
  | 'tooti-favorite';

export type MedalState = 'locked' | 'in-progress' | 'earned' | 'recently';

type MedalTier = 'bronze' | 'silver' | 'gold' | 'special';

/*
 * Tier per type — a literal map so the tier class names ('bronze' | 'silver' |
 * 'gold' | 'special') appear as literal strings the Tailwind tree-shaker keeps.
 */
const TIER: Record<MedalType, MedalTier> = {
  'first-lesson': 'bronze',
  '100-xp': 'bronze',
  '40-questions': 'bronze',
  '500-xp': 'silver',
  'perfect-lesson': 'silver',
  'week-champ': 'gold',
  'hot-streak': 'special',
  'tooti-favorite': 'special',
};

/* Literal state→class map (keeps the class names as literals; 'earned' adds none). */
const STATE_CLASS: Record<MedalState, string> = {
  locked: 'locked',
  'in-progress': 'in-progress',
  earned: '',
  recently: 'recently',
};

/*
 * SVG artwork copied VERBATIM from design/styleguide.html. Per the SVG-artwork
 * exemption, the path geometry / viewBox coords / gradient stops are an asset
 * and are not subject to the "no raw values" rule. All gradient/filter ids are
 * namespaced per instance (useId) so the 8 medals × 4 states on one page never
 * collide on shared gradient ids.
 *
 * The shared gradient/filter defs (styleguide lines 7082–7101). Included inside
 * every emblem <svg> for simplicity — namespacing makes that collision-safe.
 */
const DEFS = `
<linearGradient id="wcRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFE07A"/><stop offset="100%" stop-color="#AE7700"/></linearGradient>
<radialGradient id="wcFace" cx="50%" cy="32%" r="74%"><stop offset="0%" stop-color="#FFEEB4"/><stop offset="46%" stop-color="#FFCC47"/><stop offset="100%" stop-color="#DB9800"/></radialGradient>
<linearGradient id="wcFlame" x1="0" y1="1" x2="0" y2="0"><stop offset="0%" stop-color="#FF5418"/><stop offset="52%" stop-color="#FF9200"/><stop offset="100%" stop-color="#FFD557"/></linearGradient>
<linearGradient id="wcCrown" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#FFF0C4"/></linearGradient>
<linearGradient id="wcRimDark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#34343A"/><stop offset="100%" stop-color="#1E1E22"/></linearGradient>
<radialGradient id="wcFaceDark" cx="50%" cy="32%" r="74%"><stop offset="0%" stop-color="#3A3A40"/><stop offset="100%" stop-color="#232328"/></radialGradient>
<radialGradient id="q40Face" cx="50%" cy="32%" r="74%"><stop offset="0%" stop-color="#F7D3A4"/><stop offset="46%" stop-color="#DD9A56"/><stop offset="100%" stop-color="#A05C20"/></radialGradient>
<linearGradient id="q40Rim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EBB776"/><stop offset="100%" stop-color="#80491A"/></linearGradient>
<radialGradient id="plFace" cx="50%" cy="32%" r="74%"><stop offset="0%" stop-color="#F4F4F9"/><stop offset="46%" stop-color="#C9C9D3"/><stop offset="100%" stop-color="#9494A1"/></radialGradient>
<linearGradient id="plRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0E0E8"/><stop offset="100%" stop-color="#84848E"/></linearGradient>
<linearGradient id="plStar" x1="0.25" y1="0.05" x2="0.75" y2="1"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="58%" stop-color="#EFEFF4"/><stop offset="100%" stop-color="#D4D4DD"/></linearGradient>
<radialGradient id="xpFace" cx="50%" cy="32%" r="74%"><stop offset="0%" stop-color="#F4F4F9"/><stop offset="46%" stop-color="#C9C9D3"/><stop offset="100%" stop-color="#9494A1"/></radialGradient>
<linearGradient id="xpRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#E0E0E8"/><stop offset="100%" stop-color="#84848E"/></linearGradient>
<linearGradient id="xpBolt" x1="0.2" y1="0" x2="0.7" y2="1"><stop offset="0%" stop-color="#F2C84B"/><stop offset="55%" stop-color="#EC9F2A"/><stop offset="100%" stop-color="#DB7E0A"/></linearGradient>
<filter id="xpInner" x="-25%" y="-25%" width="150%" height="150%"><feOffset dx="0" dy="1.5" in="SourceAlpha" result="o"/><feGaussianBlur in="o" stdDeviation="2.2" result="b"/><feComposite in="b" in2="SourceAlpha" operator="arithmetic" k2="-1" k3="1" result="inner"/><feFlood flood-color="#D89A2A" flood-opacity="0.45"/><feComposite in2="inner" operator="in" result="sh"/><feComposite in="sh" in2="SourceGraphic" operator="over"/></filter>
<radialGradient id="flFace" cx="50%" cy="32%" r="74%"><stop offset="0%" stop-color="#F7D3A4"/><stop offset="46%" stop-color="#DD9A56"/><stop offset="100%" stop-color="#A05C20"/></radialGradient>
<linearGradient id="flRim" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#EBB776"/><stop offset="100%" stop-color="#80491A"/></linearGradient>
<linearGradient id="flPageL" x1="0" y1="0" x2="1" y2="0"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#DBDBE4"/></linearGradient>
<linearGradient id="flPageR" x1="1" y1="0" x2="0" y2="0"><stop offset="0%" stop-color="#FFFFFF"/><stop offset="100%" stop-color="#DBDBE4"/></linearGradient>
<linearGradient id="flMark" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="#3EC9B4"/><stop offset="100%" stop-color="#23A38F"/></linearGradient>`;

/*
 * Per-medal emblem inner markup, copied VERBATIM from the styleguide gallery
 * (lines 11201–11512). For medals 1–7 the in-progress / earned / recently
 * states reuse the same `earned` emblem (the state CSS handles dimming /
 * shimmer); `locked` is a distinct dark-silhouette variant (wcRimDark /
 * wcFaceDark). Medal 8 (tooti-favorite) renders the real <Mascot> instead.
 */
type Emblem = { viewBox: string; earned: string; locked: string };

/** Types that render a gradient-emblem <svg> (everything but hot-streak/mascot). */
type ArtMedalType = Exclude<MedalType, 'tooti-favorite' | 'hot-streak'>;

const EMBLEMS: Record<ArtMedalType, Emblem> = {
  'first-lesson': {
    viewBox: '195 55 290 290',
    earned: `<circle cx="340" cy="200" r="140" fill="url(#flRim)"/><circle cx="340" cy="200" r="128" fill="url(#flFace)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#FBE3C6" stroke-width="2" opacity="0.45"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.22"/><circle cx="340" cy="200" r="112" fill="none" stroke="#FBE3C6" stroke-width="1.5" opacity="0.4"/><circle cx="340" cy="200" r="101" fill="none" stroke="#FBE3C6" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.65"/><path d="M337 189 Q305 179 276 191 L276 227 Q305 235 337 227 Z" fill="#CBCBD6"/><path d="M343 189 Q375 179 404 191 L404 227 Q375 235 343 227 Z" fill="#CBCBD6"/><path d="M337 183 Q305 173 276 185 L276 221 Q305 229 337 221 Z" fill="url(#flPageL)" stroke="url(#flPageL)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/><path d="M343 183 Q375 173 404 185 L404 221 Q375 229 343 221 Z" fill="url(#flPageR)" stroke="url(#flPageR)" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/><path d="M340 181 L340 227" stroke="#AFAFBC" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/><g stroke="#BDBDC9" stroke-width="2.5" stroke-linecap="round" opacity="0.55"><line x1="289" y1="199" x2="320" y2="194"/><line x1="289" y1="210" x2="320" y2="205"/><line x1="360" y1="194" x2="391" y2="199"/><line x1="360" y1="205" x2="391" y2="210"/></g><path d="M335 181 L345 181 L345 217 L340 210 L335 217 Z" fill="url(#flMark)" stroke="url(#flMark)" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke"/><path d="M398 164 l2 5.5 l5.5 2 l-5.5 2 l-2 5.5 l-2 -5.5 l-5.5 -2 l5.5 -2 z" fill="#FFFFFF" opacity="0.45"/>`,
    locked: `<circle cx="340" cy="200" r="140" fill="url(#wcRimDark)"/><circle cx="340" cy="200" r="128" fill="url(#wcFaceDark)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#4A4A52" stroke-width="2" opacity="0.12"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.08"/><circle cx="340" cy="200" r="112" fill="none" stroke="#4A4A52" stroke-width="1.5" opacity="0.18"/><circle cx="340" cy="200" r="101" fill="none" stroke="#4A4A52" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.22"/><path d="M337 189 Q305 179 276 191 L276 227 Q305 235 337 227 Z" fill="#2C2C32"/><path d="M343 189 Q375 179 404 191 L404 227 Q375 235 343 227 Z" fill="#2C2C32"/><path d="M337 183 Q305 173 276 185 L276 221 Q305 229 337 221 Z" fill="#4E4E56" stroke="#4E4E56" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/><path d="M343 183 Q375 173 404 185 L404 221 Q375 229 343 221 Z" fill="#4E4E56" stroke="#4E4E56" stroke-width="3" stroke-linejoin="round" paint-order="stroke"/><path d="M340 181 L340 227" stroke="#1C1C20" stroke-width="2.5" stroke-linecap="round" opacity="0.55"/><g stroke="#3C3C42" stroke-width="2.5" stroke-linecap="round" opacity="0.55"><line x1="289" y1="199" x2="320" y2="194"/><line x1="289" y1="210" x2="320" y2="205"/><line x1="360" y1="194" x2="391" y2="199"/><line x1="360" y1="205" x2="391" y2="210"/></g><path d="M335 181 L345 181 L345 217 L340 210 L335 217 Z" fill="#5E5E66" stroke="#5E5E66" stroke-width="2.5" stroke-linejoin="round" paint-order="stroke"/><path d="M398 164 l2 5.5 l5.5 2 l-5.5 2 l-2 5.5 l-2 -5.5 l-5.5 -2 l5.5 -2 z" fill="#FFFFFF" opacity="0"/>`,
  },
  '100-xp': {
    viewBox: '195 55 290 290',
    earned: `<circle cx="340" cy="200" r="140" fill="url(#flRim)"/><circle cx="340" cy="200" r="128" fill="url(#flFace)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#FBE3C6" stroke-width="2" opacity="0.45"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.22"/><circle cx="340" cy="200" r="112" fill="none" stroke="#FBE3C6" stroke-width="1.5" opacity="0.4"/><circle cx="340" cy="200" r="101" fill="none" stroke="#FBE3C6" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.65"/><path d="M344 154 L303 209 L336 209 L326 246 L377 186 L344 186 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="20" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/><path d="M344 154 L303 209 L336 209 L326 246 L377 186 L344 186 Z" fill="url(#xpBolt)" stroke="url(#xpBolt)" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/><path d="M390 173 l2 5.5 l5.5 2 l-5.5 2 l-2 5.5 l-2 -5.5 l-5.5 -2 l5.5 -2 z" fill="#FFFFFF" opacity="0.45"/><circle cx="289" cy="220" r="3.5" fill="#FFFFFF" opacity="0.45"/>`,
    locked: `<circle cx="340" cy="200" r="140" fill="url(#wcRimDark)"/><circle cx="340" cy="200" r="128" fill="url(#wcFaceDark)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#4A4A52" stroke-width="2" opacity="0.12"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.08"/><circle cx="340" cy="200" r="112" fill="none" stroke="#4A4A52" stroke-width="1.5" opacity="0.18"/><circle cx="340" cy="200" r="101" fill="none" stroke="#4A4A52" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.22"/><g transform="translate(340 200) scale(0.84) translate(-340 -200)"><path d="M345 146 L297 211 L335 211 L324 254 L383 184 L345 184 Z" fill="#5C5C64" stroke="#3A3A40" stroke-width="14" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/></g>`,
  },
  '40-questions': {
    viewBox: '195 55 290 290',
    earned: `<circle cx="340" cy="200" r="140" fill="url(#q40Rim)"/><circle cx="340" cy="200" r="128" fill="url(#q40Face)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#FBE3C6" stroke-width="2" opacity="0.45"/><circle cx="340" cy="200" r="112" fill="none" stroke="#FBE3C6" stroke-width="1.5" opacity="0.4"/><circle cx="340" cy="200" r="101" fill="none" stroke="#FBE3C6" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.7"/><ellipse cx="340" cy="125" rx="86" ry="40" fill="#FFFFFF" opacity="0.22"/><rect x="288" y="156" width="104" height="86" rx="24" fill="#FFFFFF"/><path d="M314 236 L308 264 L344 238 Z" fill="#FFFFFF"/><text x="340" y="219" font-family="Nunito, sans-serif" font-size="62" font-weight="800" fill="#A86530" text-anchor="middle">?</text><circle cx="390" cy="232" r="20" fill="#34C759" stroke="#FFFFFF" stroke-width="3"/><path d="M381 232 l6 7 l12 -14" fill="none" stroke="#FFFFFF" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
    locked: `<circle cx="340" cy="200" r="140" fill="url(#wcRimDark)"/><circle cx="340" cy="200" r="128" fill="url(#wcFaceDark)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#FBE3C6" stroke-width="2" opacity="0.12"/><circle cx="340" cy="200" r="112" fill="none" stroke="#4A4A52" stroke-width="1.5" opacity="0.18"/><circle cx="340" cy="200" r="101" fill="none" stroke="#4A4A52" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.22"/><ellipse cx="340" cy="125" rx="86" ry="40" fill="#FFFFFF" opacity="0.08"/><rect x="288" y="156" width="104" height="86" rx="24" fill="#4E4E56"/><path d="M314 236 L308 264 L344 238 Z" fill="#4E4E56"/><text x="340" y="219" font-family="Nunito, sans-serif" font-size="62" font-weight="800" fill="#5C5C64" text-anchor="middle">?</text><circle cx="390" cy="232" r="20" fill="#44444A" stroke="#FFFFFF" stroke-width="3"/><path d="M381 232 l6 7 l12 -14" fill="none" stroke="#5E5E66" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  '500-xp': {
    viewBox: '195 55 290 290',
    earned: `<circle cx="340" cy="200" r="140" fill="url(#xpRim)"/><circle cx="340" cy="200" r="128" fill="url(#xpFace)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.26"/><circle cx="340" cy="200" r="112" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4"/><circle cx="340" cy="200" r="101" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.7"/><path d="M345 146 L297 211 L335 211 L324 254 L383 184 L345 184 Z" fill="url(#xpBolt)" stroke="url(#xpBolt)" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/><path d="M392 170 l2.5 6.5 l6.5 2.5 l-6.5 2.5 l-2.5 6.5 l-2.5 -6.5 l-6.5 -2.5 l6.5 -2.5 z" fill="#FFFFFF" opacity="0.45"/><path d="M282 196 l2 5.5 l5.5 2 l-5.5 2 l-2 5.5 l-2 -5.5 l-5.5 -2 l5.5 -2 z" fill="#FFFFFF" opacity="0.45"/><circle cx="386" cy="232" r="4" fill="#FFFFFF" opacity="0.45"/>`,
    locked: `<circle cx="340" cy="200" r="140" fill="url(#wcRimDark)"/><circle cx="340" cy="200" r="128" fill="url(#wcFaceDark)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#4A4A52" stroke-width="2" opacity="0.12"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.08"/><circle cx="340" cy="200" r="112" fill="none" stroke="#4A4A52" stroke-width="1.5" opacity="0.18"/><circle cx="340" cy="200" r="101" fill="none" stroke="#4A4A52" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.22"/><path d="M345 146 L297 211 L335 211 L324 254 L383 184 L345 184 Z" fill="#5C5C64" stroke="#5C5C64" stroke-width="12" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/><g opacity="0"><path d="M392 170 l2.5 6.5 l6.5 2.5 l-6.5 2.5 l-2.5 6.5 l-2.5 -6.5 l-6.5 -2.5 l6.5 -2.5 z" fill="#FFFFFF" opacity="0.8"/><path d="M282 196 l2 5.5 l5.5 2 l-5.5 2 l-2 5.5 l-2 -5.5 l-5.5 -2 l5.5 -2 z" fill="#FFFFFF" opacity="0.7"/><circle cx="386" cy="232" r="4" fill="#FFFFFF" opacity="0.68"/></g>`,
  },
  'perfect-lesson': {
    viewBox: '195 55 290 290',
    earned: `<circle cx="340" cy="200" r="140" fill="url(#plRim)"/><circle cx="340" cy="200" r="128" fill="url(#plFace)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#FFFFFF" stroke-width="2" opacity="0.5"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.26"/><circle cx="340" cy="200" r="112" fill="none" stroke="#FFFFFF" stroke-width="1.5" opacity="0.4"/><circle cx="340" cy="200" r="101" fill="none" stroke="#FFFFFF" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.7"/><path d="M340 138 L356 180 L401 182 L366 208 L378 250 L340 226 L302 250 L314 208 L279 182 L324 180 Z" fill="url(#plStar)" stroke="url(#plStar)" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/><path d="M322 201 l11 13 l29 -32" fill="none" stroke="#34C759" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
    locked: `<circle cx="340" cy="200" r="140" fill="url(#wcRimDark)"/><circle cx="340" cy="200" r="128" fill="url(#wcFaceDark)"/><circle cx="340" cy="200" r="128" fill="none" stroke="#4A4A52" stroke-width="2" opacity="0.12"/><ellipse cx="340" cy="128" rx="84" ry="38" fill="#FFFFFF" opacity="0.08"/><circle cx="340" cy="200" r="112" fill="none" stroke="#4A4A52" stroke-width="1.5" opacity="0.18"/><circle cx="340" cy="200" r="101" fill="none" stroke="#4A4A52" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.22"/><path d="M340 138 L356 180 L401 182 L366 208 L378 250 L340 226 L302 250 L314 208 L279 182 L324 180 Z" fill="#4E4E56" stroke="#4E4E56" stroke-width="16" stroke-linejoin="round" stroke-linecap="round" paint-order="stroke"/><path d="M322 201 l11 13 l29 -32" fill="none" stroke="#5E5E66" stroke-width="11" stroke-linecap="round" stroke-linejoin="round"/>`,
  },
  'week-champ': {
    viewBox: '195 50 290 290',
    earned: `<circle cx="340" cy="195" r="140" fill="url(#wcRim)"/><circle cx="340" cy="195" r="128" fill="url(#wcFace)"/><circle cx="340" cy="195" r="128" fill="none" stroke="#FFF7DD" stroke-width="2" opacity="0.55"/><circle cx="340" cy="195" r="112" fill="none" stroke="#FFF7DD" stroke-width="1.5" opacity="0.4"/><circle cx="340" cy="195" r="101" fill="none" stroke="#FFF7DD" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.7"/><ellipse cx="340" cy="120" rx="86" ry="40" fill="#FFFFFF" opacity="0.28"/><path d="M340 110 C370 146, 390 176, 374 204 C390 196, 399 180, 396 166 C418 197, 409 236, 372 248 C351 254, 329 254, 308 248 C271 236, 262 197, 284 166 C281 180, 290 196, 306 204 C290 176, 310 146, 340 110 Z" fill="url(#wcFlame)" opacity="0.95"/><rect x="300" y="172" width="80" height="78" rx="12" fill="#FFFFFF"/><rect x="300" y="172" width="80" height="22" rx="12" fill="#E9E9ED"/><rect x="300" y="183" width="80" height="11" fill="#E9E9ED"/><text x="340" y="235" font-family="Nunito, sans-serif" font-size="44" font-weight="800" fill="#DB9800" text-anchor="middle">7</text><path d="M312 170 L320 142 L332 156 L340 134 L348 156 L360 142 L368 170 Z" fill="url(#wcCrown)" stroke="#DFA300" stroke-width="2" stroke-linejoin="round"/><circle cx="320" cy="140" r="3.5" fill="#FFFFFF" stroke="#DFA300" stroke-width="1.5"/><circle cx="340" cy="132" r="4" fill="#FFFFFF" stroke="#DFA300" stroke-width="1.5"/><circle cx="360" cy="140" r="3.5" fill="#FFFFFF" stroke="#DFA300" stroke-width="1.5"/>`,
    locked: `<circle cx="340" cy="195" r="140" fill="url(#wcRimDark)"/><circle cx="340" cy="195" r="128" fill="url(#wcFaceDark)"/><circle cx="340" cy="195" r="128" fill="none" stroke="#FFF7DD" stroke-width="2" opacity="0.12"/><circle cx="340" cy="195" r="112" fill="none" stroke="#4A4A52" stroke-width="1.5" opacity="0.18"/><circle cx="340" cy="195" r="101" fill="none" stroke="#4A4A52" stroke-width="5" stroke-dasharray="0.5 14" stroke-linecap="round" opacity="0.22"/><ellipse cx="340" cy="120" rx="86" ry="40" fill="#FFFFFF" opacity="0.08"/><path d="M340 110 C370 146, 390 176, 374 204 C390 196, 399 180, 396 166 C418 197, 409 236, 372 248 C351 254, 329 254, 308 248 C271 236, 262 197, 284 166 C281 180, 290 196, 306 204 C290 176, 310 146, 340 110 Z" fill="#4A4A52" opacity="0.95"/><rect x="300" y="172" width="80" height="78" rx="12" fill="#4E4E56"/><rect x="300" y="172" width="80" height="22" rx="12" fill="#3E3E45"/><rect x="300" y="183" width="80" height="11" fill="#3E3E45"/><text x="340" y="235" font-family="Nunito, sans-serif" font-size="44" font-weight="800" fill="#5C5C64" text-anchor="middle">7</text><path d="M312 170 L320 142 L332 156 L340 134 L348 156 L360 142 L368 170 Z" fill="#4E4E56" stroke="#2C2C32" stroke-width="2" stroke-linejoin="round"/><circle cx="320" cy="140" r="3.5" fill="#4E4E56" stroke="#2C2C32" stroke-width="1.5"/><circle cx="340" cy="132" r="4" fill="#4E4E56" stroke="#2C2C32" stroke-width="1.5"/><circle cx="360" cy="140" r="3.5" fill="#4E4E56" stroke="#2C2C32" stroke-width="1.5"/>`,
  },
};

/*
 * Hot-streak (special) uses a Phosphor-symbol structure: deco-rings + a .sym
 * holding the brand flame (.streak-flame) and a sparkle overlay (.sym-fx). The
 * styleguide references the flame via <use href="#ic-m-streak-white">; here the
 * flame paths (styleguide symbol lines 7130–7150) are inlined so the component
 * is self-contained.
 */
const STREAK_DECO_RINGS = `<circle cx="128" cy="128" r="94" fill="none" stroke="#fff" stroke-width="2.5" opacity=".4"/><circle cx="128" cy="128" r="84" fill="none" stroke="#fff" stroke-width="7" stroke-dasharray="1 22" stroke-linecap="round" opacity=".7"/>`;
const STREAK_FLAME = `<path d="M16.6 3.8 C17.2 5.0 18.0 6.0 18.8 7.0 C21.4 10.0 23.6 13.0 23.6 17.0 C23.6 22.0 19.4 26.0 14.0 26.0 C8.6 26.0 4.4 22.0 4.4 17.0 C4.4 13.4 6.0 11.0 8.0 8.6 C9.0 7.4 10.0 6.4 10.6 5.4 C11.0 7.0 11.4 8.6 12.8 8.6 C14.0 8.6 14.4 7.4 14.6 6.0 C14.8 5.0 15.4 4.4 16.6 3.8 Z" fill="#FFFFFF"/><path d="M14.0 11.8 C14.0 11.8 12.2 13.6 11.4 15.4 C10.6 17.0 10.4 18.2 10.4 19.4 C10.4 21.8 12.0 23.4 14.0 23.4 C16.0 23.4 17.6 21.8 17.6 19.4 C17.6 18.2 17.4 17.0 16.6 15.4 C15.8 13.6 14.0 11.8 14.0 11.8 Z" fill="#FFFFFF" opacity=".42"/>`;
const STREAK_FX = `<path d="M6.5 12 L7.4 14.4 L9.8 15.3 L7.4 16.2 L6.5 18.6 L5.6 16.2 L3.2 15.3 L5.6 14.4 Z" fill="#fff"/><path d="M43 16 L43.7 18 L45.7 18.7 L43.7 19.4 L43 21.4 L42.3 19.4 L40.3 18.7 L42.3 18 Z" fill="#fff" opacity=".92"/><circle cx="40" cy="9" r="1.5" fill="#fff" opacity=".85"/><circle cx="44.5" cy="34" r="1.6" fill="#fff" opacity=".8"/><circle cx="8" cy="34" r="1.3" fill="#fff" opacity=".72"/><circle cx="11" cy="8.5" r="1" fill="#fff" opacity=".68"/>`;

/** Rewrite id="x" → id="${uid}-x" and url(#x) → url(#${uid}-x) (Mascot helper). */
function namespaceIds(svg: string, uid: string): string {
  return svg
    .replace(/id="([^"]+)"/g, `id="${uid}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${uid}-$1)`);
}

export interface MedalProps {
  type: MedalType;
  /** Visual state. @default 'earned' */
  state?: MedalState;
  /** Completion 0–100, used by the 'in-progress' ring + pip. @default 0 */
  progress?: number;
  /** Rendered width/height in px. The 64px artwork is scaled to fit. @default 64 */
  size?: number;
  className?: string;
}

/** Inner artwork for the Phosphor-symbol medals (hot-streak). */
function StreakSym({ uid }: { uid: string }) {
  return (
    <>
      <svg
        className="deco-rings"
        viewBox="0 0 256 256"
        dangerouslySetInnerHTML={{ __html: STREAK_DECO_RINGS }}
      />
      <div className="sym">
        <svg
          className="streak-flame"
          viewBox="0 0 28 28"
          dangerouslySetInnerHTML={{ __html: namespaceIds(STREAK_FLAME, uid) }}
        />
        <svg
          className="sym-fx"
          viewBox="0 0 50 50"
          dangerouslySetInnerHTML={{ __html: namespaceIds(STREAK_FX, uid) }}
        />
      </div>
    </>
  );
}

/** Inner artwork for the gradient-emblem medals (1–5 + week-champ). */
function ArtSym({ emblem, locked, uid }: { emblem: Emblem; locked: boolean; uid: string }) {
  const art = locked ? emblem.locked : emblem.earned;
  const inner = namespaceIds(`<defs>${DEFS}</defs>${art}`, uid);
  return (
    <svg
      className="wc-art"
      viewBox={emblem.viewBox}
      xmlns="http://www.w3.org/2000/svg"
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}

export function Medal({ type, state = 'earned', progress = 0, size = 64, className }: MedalProps) {
  const uid = useId().replace(/:/g, '');
  const tier = TIER[type];
  const stateClass = STATE_CLASS[state];
  const locked = state === 'locked';

  let sym;
  if (type === 'tooti-favorite') {
    sym = (
      <div className="sym mascot">
        <Mascot pose="celebrate" size={52} />
      </div>
    );
  } else if (type === 'hot-streak') {
    sym = <StreakSym uid={uid} />;
  } else {
    sym = <ArtSym emblem={EMBLEMS[type]} locked={locked} uid={uid} />;
  }

  // The verbatim chrome is tuned for a 64px piece; scale the whole piece to
  // honour `size` without retuning the asset px. The default (64) is identity.
  const scaled = size !== 64;
  const wrapperStyle = scaled
    ? { width: size, height: size, display: 'grid', placeItems: 'center' }
    : undefined;
  const pieceStyle = {
    '--p': progress,
    ...(scaled ? { transform: `scale(${size / 64})`, transformOrigin: 'center' } : null),
  } as React.CSSProperties;

  const piece = (
    <div className={cn('medal-piece', tier, stateClass)} style={pieceStyle}>
      <div className="base" />
      <div className="rim" />
      <div className="shade" />
      <div className="reflex" />
      {state === 'recently' ? <div className="shimmer" /> : null}
      {sym}
      {state === 'in-progress' ? (
        <span className="pct-arm">
          <span className="pct-pip">{progress}%</span>
        </span>
      ) : null}
      {state === 'locked' ? (
        <span className="lock-pip">
          <Lock weight="bold" />
        </span>
      ) : null}
      {state === 'recently' ? (
        <>
          <span className="sparkle s1" />
          <span className="sparkle s2" />
          <span className="sparkle s3" />
          <span className="sparkle s4" />
          <span className="new-ribbon">NEW!</span>
        </>
      ) : null}
    </div>
  );

  if (scaled) {
    return (
      <div className={className} style={wrapperStyle}>
        {piece}
      </div>
    );
  }
  return className ? <div className={className}>{piece}</div> : piece;
}
