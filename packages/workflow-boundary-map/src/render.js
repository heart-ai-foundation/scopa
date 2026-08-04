import {
  canonicalJsonPretty,
  deepFreeze,
  jsonHash,
} from '../../enforcement/src/index.js';
import { validateWorkflowBoundaryMap } from './map.js';

export const WORKFLOW_BOUNDARY_MAP_RENDER_SCHEMA =
  'scopa.workflow-boundary-map-render.v1';

function text(value) {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('|', '\\|')
    .replace(/\s+/g, ' ')
    .trim();
}

function list(items, empty = 'None') {
  return items.length === 0
    ? `- ${empty}`
    : items.map((item) => `- ${text(item)}`).join('\n');
}

export function renderWorkflowBoundaryMapMarkdown(value) {
  const map = validateWorkflowBoundaryMap(value);
  const mapSha256 = jsonHash(map);
  const lines = [
    '# SCOPA workflow boundary map',
    '',
    `- Map SHA-256: \`${mapSha256}\``,
    `- Slice: ${text(map.scope.sliceId)}`,
    `- Assurance: **${text(map.assurance.level)}** (${text(map.assurance.basis)})`,
    `- Completion: **${text(map.completion.status)}**; can stop: \`${map.completion.canStop}\``,
    '',
    '## Allowed paths',
    '',
    list(map.scope.allowedPaths),
    '',
    '## Non-goals',
    '',
    list(map.scope.nonGoals),
    '',
    '## Completion gates',
    '',
    '| Gate | Status | Exit |',
    '| --- | --- | ---: |',
    ...map.completion.gates.map((gate) =>
      `| ${text(gate.id)} | ${text(gate.status)} | ${gate.exitCode ?? 'n/a'} |`),
    '',
    '## Workflow surfaces',
    '',
    '| Surface | Category | Status | Control | Source |',
    '| --- | --- | --- | --- | --- |',
    ...map.surfaces.map((surface) =>
      `| ${text(surface.id)} | ${text(surface.category)} | ${text(surface.status)} | ${text(surface.control ?? 'none')} | ${text(surface.source)} |`),
    '',
    '## Summary',
    '',
    `- Controlled: ${map.summary.controlled}`,
    `- Uncontrolled: ${map.summary.uncontrolled}`,
    `- Unknown: ${map.summary.unknown}`,
    `- Authority required: ${map.summary.authorityRequired}`,
    `- Disabled: ${map.summary.disabled}`,
    '',
    '> This map is configuration-relative. Unknown evidence is not a safety claim,',
    '> and active native routes remain outside SCOPA unless explicitly controlled.',
    '',
  ];
  return deepFreeze(JSON.parse(canonicalJsonPretty({
    schema: WORKFLOW_BOUNDARY_MAP_RENDER_SCHEMA,
    format: 'markdown',
    mapSha256,
    content: lines.join('\n'),
  })));
}
