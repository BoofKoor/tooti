'use client';

import { useId } from 'react';

export type MascotPose = 'encourage' | 'celebrate' | 'think' | 'reassure';

/*
 * SVG artwork copied VERBATIM from design/styleguide.html (shared gradient/
 * filter defs + the four pose symbols). Per the SVG-artwork exemption, the path
 * geometry / viewBox coords / gradient stops are an asset and are not subject to
 * the "no raw values" rule. Every gradient/filter id is namespaced per instance
 * (useId) so multiple mascots on a page never collide.
 */

const DEFS = `
<radialGradient id="m-body" cx="38%" cy="35%" r="75%">
  <stop offset="0%"  stop-color="#48D2BD"/>
  <stop offset="55%" stop-color="#2BB7A3"/>
  <stop offset="100%" stop-color="#1F9C8B"/>
</radialGradient>
<radialGradient id="m-belly" cx="50%" cy="35%" r="70%">
  <stop offset="0%"  stop-color="#FFFFFF"/>
  <stop offset="55%" stop-color="#F2FBF8"/>
  <stop offset="100%" stop-color="#C8E8DF"/>
</radialGradient>
<radialGradient id="m-chest" cx="50%" cy="35%" r="65%">
  <stop offset="0%"  stop-color="#FFFFFF"/>
  <stop offset="70%" stop-color="#EAF9F5"/>
  <stop offset="100%" stop-color="#D2EFE7"/>
</radialGradient>
<radialGradient id="m-beak" cx="50%" cy="30%" r="70%">
  <stop offset="0%"  stop-color="#FFB142"/>
  <stop offset="100%" stop-color="#E07B00"/>
</radialGradient>
<linearGradient id="m-wing" x1="0" x2="0" y1="0" y2="1">
  <stop offset="0%"  stop-color="#249685"/>
  <stop offset="100%" stop-color="#157B6E"/>
</linearGradient>
<filter id="m-shadow" x="-20%" y="-10%" width="140%" height="125%">
  <feDropShadow dx="0" dy="3" stdDeviation="3" flood-color="#0B2A22" flood-opacity="0.14"/>
</filter>`;

const POSES: Record<MascotPose, string> = {
  encourage: `
<ellipse cx="110" cy="232" rx="56" ry="5" fill="#0B2A22" opacity=".09"/>
<ellipse cx="92"  cy="58" rx="8"  ry="22" fill="#FF375F" transform="rotate(-22 110 70)"/>
<ellipse cx="110" cy="50" rx="9"  ry="26" fill="#FFD60A"/>
<ellipse cx="128" cy="58" rx="8"  ry="22" fill="#64D2FF" transform="rotate(22 110 70)"/>
<ellipse cx="42"  cy="160" rx="20" ry="34" fill="url(#m-wing)" transform="rotate(14 42 160)"/>
<ellipse cx="178" cy="160" rx="20" ry="34" fill="url(#m-wing)" transform="rotate(-14 178 160)"/>
<circle cx="110" cy="142" r="78" fill="url(#m-body)" filter="url(#m-shadow)"/>
<ellipse cx="110" cy="126" rx="62" ry="52" fill="url(#m-chest)"/>
<ellipse cx="110" cy="172" rx="46" ry="42" fill="url(#m-belly)"/>
<circle cx="72"  cy="142" r="10" fill="#FF375F" opacity=".22"/>
<circle cx="148" cy="142" r="10" fill="#FF375F" opacity=".22"/>
<g stroke="#14171D" stroke-width="2.4" stroke-linecap="round" fill="none">
  <path d="M82 102 Q92 98 102 102"/>
  <path d="M118 102 Q128 98 138 102"/>
</g>
<g>
  <circle cx="92"  cy="120" r="10" fill="#14171D"/>
  <circle cx="128" cy="120" r="10" fill="#14171D"/>
  <circle cx="95.5"  cy="116" r="3.6" fill="#FFFFFF"/>
  <circle cx="131.5" cy="116" r="3.6" fill="#FFFFFF"/>
  <circle cx="89"  cy="123.5" r="1.4" fill="#FFFFFF" opacity=".6"/>
  <circle cx="125" cy="123.5" r="1.4" fill="#FFFFFF" opacity=".6"/>
</g>
<path d="M94 140 Q110 132 126 140 Q122 154 110 155 Q98 154 94 140 Z" fill="url(#m-beak)"/>
<path d="M100 150 Q110 154 120 150 Q116 160 110 160 Q104 160 100 150 Z" fill="#C56500"/>
<circle cx="102" cy="144" r="1.4" fill="#FFFFFF" opacity=".5"/>`,
  celebrate: `
<ellipse cx="110" cy="232" rx="56" ry="5" fill="#0B2A22" opacity=".09"/>
<ellipse cx="90"  cy="56" rx="8"  ry="22" fill="#FF375F" transform="rotate(-32 110 70)"/>
<ellipse cx="110" cy="44" rx="9"  ry="30" fill="#FFD60A"/>
<ellipse cx="130" cy="56" rx="8"  ry="22" fill="#64D2FF" transform="rotate(32 110 70)"/>
<ellipse cx="32"  cy="124" rx="18" ry="32" fill="url(#m-wing)" transform="rotate(-38 32 124)"/>
<ellipse cx="188" cy="124" rx="18" ry="32" fill="url(#m-wing)" transform="rotate(38 188 124)"/>
<g transform="rotate(-3 110 142)">
  <circle cx="110" cy="142" r="78" fill="url(#m-body)" filter="url(#m-shadow)"/>
  <ellipse cx="110" cy="126" rx="62" ry="52" fill="url(#m-chest)"/>
  <ellipse cx="110" cy="172" rx="46" ry="42" fill="url(#m-belly)"/>
  <circle cx="72"  cy="142" r="11" fill="#FF375F" opacity=".34"/>
  <circle cx="148" cy="142" r="11" fill="#FF375F" opacity=".34"/>
  <g stroke="#14171D" stroke-width="2.6" stroke-linecap="round" fill="none">
    <path d="M82 94 Q92 90 102 94"/>
    <path d="M118 94 Q128 90 138 94"/>
  </g>
  <g stroke="#14171D" stroke-width="3.6" stroke-linecap="round" fill="none">
    <path d="M83 122 Q92 113 101 122"/>
    <path d="M119 122 Q128 113 137 122"/>
  </g>
  <path d="M91 140 Q110 134 129 140 Q124 162 110 164 Q96 162 91 140 Z" fill="url(#m-beak)"/>
  <ellipse cx="110" cy="152" rx="10" ry="7.5" fill="#A23A1B"/>
  <ellipse cx="110" cy="155" rx="5" ry="3" fill="#FF6B8A"/>
  <path d="M100 159 Q110 167 120 159 Q110 164 100 159 Z" fill="#C56500"/>
</g>`,
  reassure: `
<ellipse cx="110" cy="232" rx="56" ry="5" fill="#0B2A22" opacity=".09"/>
<g transform="translate(184 50)">
  <path d="M0 4 C-4 -3, -12 -3, -12 4 C-12 9, -6 14, 0 19 C6 14, 12 9, 12 4 C12 -3, 4 -3, 0 4 Z" fill="#FF375F"/>
  <path d="M-4 1 C-5 -1, -8 -1, -8 1" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" fill="none" opacity=".7"/>
</g>
<g transform="rotate(-5 110 70) translate(0 2)">
  <ellipse cx="92"  cy="58" rx="8"  ry="22" fill="#FF375F" transform="rotate(-26 110 70)"/>
  <ellipse cx="110" cy="52" rx="9"  ry="25" fill="#FFD60A"/>
  <ellipse cx="128" cy="58" rx="8"  ry="22" fill="#64D2FF" transform="rotate(26 110 70)"/>
</g>
<ellipse cx="46" cy="168" rx="20" ry="32" fill="url(#m-wing)" transform="rotate(20 46 168)"/>
<ellipse cx="166" cy="178" rx="22" ry="26" fill="url(#m-wing)" transform="rotate(-44 166 178)"/>
<g transform="translate(0 4)">
  <circle cx="110" cy="142" r="78" fill="url(#m-body)" filter="url(#m-shadow)"/>
  <ellipse cx="110" cy="126" rx="62" ry="52" fill="url(#m-chest)"/>
  <ellipse cx="110" cy="172" rx="46" ry="42" fill="url(#m-belly)"/>
  <circle cx="72"  cy="142" r="10" fill="#FF375F" opacity=".26"/>
  <circle cx="148" cy="142" r="10" fill="#FF375F" opacity=".26"/>
  <g stroke="#14171D" stroke-width="2.6" stroke-linecap="round" fill="none">
    <path d="M80 102 Q92 92 104 102"/>
    <path d="M116 102 Q128 92 140 102"/>
  </g>
  <g>
    <path d="M82 120 Q92 113 102 120 Q92 124 82 120 Z" fill="#14171D"/>
    <path d="M118 120 Q128 113 138 120 Q128 124 118 120 Z" fill="#14171D"/>
    <circle cx="93" cy="116" r="2.4" fill="#FFFFFF"/>
    <circle cx="129" cy="116" r="2.4" fill="#FFFFFF"/>
  </g>
  <path d="M96 140 Q110 134 124 140 Q120 150 110 151 Q100 150 96 140 Z" fill="url(#m-beak)"/>
  <path d="M101 148 Q110 152 119 148 Q115 156 110 156 Q105 156 101 148 Z" fill="#C56500"/>
</g>`,
  think: `
<ellipse cx="110" cy="232" rx="56" ry="5" fill="#0B2A22" opacity=".09"/>
<g>
  <ellipse cx="186" cy="42" rx="20" ry="16" fill="#FFFFFF" stroke="#0A84FF" stroke-width="2.2"/>
  <circle cx="170" cy="64" r="5.5" fill="#FFFFFF" stroke="#0A84FF" stroke-width="2"/>
  <circle cx="160" cy="76" r="3" fill="#FFFFFF" stroke="#0A84FF" stroke-width="1.6"/>
  <circle cx="178" cy="42" r="1.8" fill="#0A84FF"/>
  <circle cx="186" cy="42" r="1.8" fill="#0A84FF"/>
  <circle cx="194" cy="42" r="1.8" fill="#0A84FF"/>
</g>
<g transform="rotate(-8 110 70)">
  <ellipse cx="92"  cy="58" rx="8"  ry="22" fill="#FF375F" transform="rotate(-22 110 70)"/>
  <ellipse cx="110" cy="50" rx="9"  ry="26" fill="#FFD60A"/>
  <ellipse cx="128" cy="58" rx="8"  ry="22" fill="#64D2FF" transform="rotate(22 110 70)"/>
</g>
<ellipse cx="40" cy="172" rx="20" ry="32" fill="url(#m-wing)" transform="rotate(8 40 172)"/>
<ellipse cx="172" cy="108" rx="16" ry="28" fill="url(#m-wing)" transform="rotate(-70 172 108)"/>
<g transform="rotate(-2 110 142)">
  <circle cx="110" cy="142" r="78" fill="url(#m-body)" filter="url(#m-shadow)"/>
  <ellipse cx="110" cy="126" rx="62" ry="52" fill="url(#m-chest)"/>
  <ellipse cx="110" cy="172" rx="46" ry="42" fill="url(#m-belly)"/>
  <circle cx="72"  cy="142" r="9" fill="#FF375F" opacity=".22"/>
  <circle cx="148" cy="142" r="9" fill="#FF375F" opacity=".22"/>
  <g stroke="#14171D" stroke-width="2.6" stroke-linecap="round" fill="none">
    <path d="M82 104 L102 102"/>
    <path d="M116 94 Q126 89 138 100"/>
  </g>
  <g>
    <circle cx="92"  cy="120" r="10" fill="#14171D"/>
    <circle cx="128" cy="120" r="10" fill="#14171D"/>
    <circle cx="96"  cy="114" r="3.6" fill="#FFFFFF"/>
    <circle cx="132" cy="114" r="3.6" fill="#FFFFFF"/>
    <circle cx="90"  cy="122" r="1.2" fill="#FFFFFF" opacity=".5"/>
    <circle cx="126" cy="122" r="1.2" fill="#FFFFFF" opacity=".5"/>
  </g>
  <path d="M101 142 Q110 138 120 142 Q117 150 110 151 Q103 150 101 142 Z" fill="url(#m-beak)"/>
  <path d="M105 148 Q110 150 116 148 Q113 153 110 153 Q107 153 105 148 Z" fill="#C56500"/>
</g>`,
};

function namespaceIds(svg: string, uid: string): string {
  return svg
    .replace(/id="([^"]+)"/g, `id="${uid}-$1"`)
    .replace(/url\(#([^)]+)\)/g, `url(#${uid}-$1)`);
}

export interface MascotProps {
  pose?: MascotPose;
  /** Rendered width in px; height follows the 220:240 viewBox ratio. */
  size?: number;
  /** Accessible name; when omitted the mascot is decorative (aria-hidden). */
  title?: string;
  className?: string;
}

export function Mascot({ pose = 'encourage', size = 120, title, className }: MascotProps) {
  const uid = useId().replace(/:/g, '');
  const height = Math.round((size * 240) / 220);
  const inner = namespaceIds(`<defs>${DEFS}</defs>${POSES[pose]}`, uid);

  return (
    <svg
      className={className}
      width={size}
      height={height}
      viewBox="0 0 220 240"
      role={title ? 'img' : undefined}
      aria-label={title}
      aria-hidden={title ? undefined : true}
      dangerouslySetInnerHTML={{ __html: inner }}
    />
  );
}
