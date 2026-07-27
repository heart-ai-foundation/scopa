import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import {
  mkdtemp,
  readFile,
  rm,
} from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import test from 'node:test';
import { EFFECT_CATEGORIES } from '../../journal/src/effect-schema.js';
import {
  CASE_EFFECT_MAPPING,
  CASE_EXPORT_SCHEMA,
  CASE_ONTOLOGY_VERSION,
  CASE_UTILS_VERSION,
  SCOPA_CASE_NAMESPACE_UUID,
  createCaseExport,
  serializeCaseExport,
  verifyCaseExport,
  verifyCaseExportBytes,
} from '../src/index.js';

const ROOT = path.resolve(import.meta.dirname, '../../..');
const PACKET_PATH = path.join(
  ROOT,
  'evidence/S4/2026-07-26-freetsa-packet.json',
);
const ROOTS_PATH = path.join(ROOT, 'fixtures/S4/freetsa-root.pem');
const SIGNER_SHA256 =
  '32e841a95cc1164101ffde41298ef2fc75c1c4372ef095e88a6bbd47dfb191fc';

async function fixture() {
  return {
    packetBytes: await readFile(PACKET_PATH),
    verificationOptions: {
      trustedTimestampRootsPem: await readFile(ROOTS_PATH, 'utf8'),
      requireTimestamp: true,
      expectedTimestampAuthorityId: 'freetsa.org-2026',
      expectedTimestampSignerSha256: SIGNER_SHA256,
    },
  };
}

function clone(value) {
  return structuredClone(value);
}

test('mapping exactly covers the frozen effect ABI without category renaming', () => {
  assert.deepEqual(
    Object.keys(CASE_EFFECT_MAPPING).sort(),
    [...EFFECT_CATEGORIES].sort(),
  );
  assert.equal(new Set(
    Object.values(CASE_EFFECT_MAPPING).map((mapping) => mapping.tag),
  ).size, EFFECT_CATEGORIES.length);
  for (const category of EFFECT_CATEGORIES) {
    const mapping = CASE_EFFECT_MAPPING[category];
    assert.equal(mapping.actionType, 'uco-action:Action');
    assert.equal(mapping.tag, `scopa:effect-category:${category}`);
    assert.ok(['OBSERVE', 'ACT', 'PRINCIPAL'].includes(mapping.effectKind));
    assert.ok(mapping.label.length > 0);
  }
  assert.equal(Object.isFrozen(CASE_EFFECT_MAPPING), true);
});

test('same signed packet exports to byte-identical CASE/UCO JSON-LD', async () => {
  const input = await fixture();
  const first = await createCaseExport(input);
  const second = await createCaseExport(input);
  assert.equal(first.schema, CASE_EXPORT_SCHEMA);
  assert.equal(first.document['@graph'][0]['uco-core:specVersion'], CASE_ONTOLOGY_VERSION);
  assert.equal(
    first.document['@graph'][1]['scopa:caseUtilsVersion'],
    CASE_UTILS_VERSION,
  );
  assert.deepEqual(first.jsonBytes, second.jsonBytes);
  assert.deepEqual(first.jsonBytes, serializeCaseExport(first.document));
  assert.equal(first.packetVerification.ok, true);
  assert.match(
    SCOPA_CASE_NAMESPACE_UUID,
    /^[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
  );
  for (const node of first.document['@graph']) {
    assert.match(
      node['@id'],
      /-[0-9a-f]{8}-[0-9a-f]{4}-5[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/,
    );
  }
});

test('graph is legible while preserving claim boundaries', async () => {
  const exported = await createCaseExport(await fixture());
  const nodes = exported.document['@graph'];
  const carrier = nodes.find((node) =>
    Array.isArray(node['@type']) &&
    node['@type'].includes('scopa:EvidencePacket'));
  const identity = nodes.find(
    (node) => node['@type'] === 'uco-identity:Identity',
  );
  const tool = nodes.find((node) => node['@type'] === 'uco-tool:Tool');
  const actions = nodes.filter(
    (node) => node['@type'] === 'uco-action:Action',
  );
  const relationships = nodes.filter(
    (node) => node['@type'] === 'uco-core:Relationship',
  );

  assert.match(
    carrier['uco-core:description'],
    /CASE validation checks graph structure only/,
  );
  assert.match(identity['scopa:identityBoundary'], /not a person, device/);
  assert.match(tool['uco-core:description'], /does not imply/);
  assert.deepEqual(
    actions.map((action) => action['scopa:effectCategory']),
    ['TOOL.QUERY', 'TOOL.COMMAND', 'INFER', 'INFER'],
  );
  assert.equal(relationships.length, actions.length + 1);
  for (const action of actions) {
    assert.ok(
      action['uco-core:tag'].includes(
        `scopa:effect-category:${action['scopa:effectCategory']}`,
      ),
    );
  }
});

test('exact native packet bytes round-trip and retain S4 verification', async () => {
  const input = await fixture();
  const exported = await createCaseExport(input);
  const result = await verifyCaseExportBytes(exported.jsonBytes, {
    verificationOptions: input.verificationOptions,
  });
  assert.equal(result.ok, true);
  assert.equal(
    Buffer.from(result.packetBytes).equals(Buffer.from(input.packetBytes)),
    true,
  );
  assert.equal(result.packetVerification.ok, true);
  assert.equal(result.packetVerification.chain.length, 4);
  assert.equal(result.packetVerification.timestamp.authorityId, 'freetsa.org-2026');
  assert.equal(result.graph.actionCount, 4);
  assert.equal(result.graph.relationshipCount, 5);
});

test('round trip rejects structural, semantic, and serialization drift', async () => {
  const input = await fixture();
  const exported = await createCaseExport(input);
  const carrierIndex = exported.document['@graph'].findIndex((node) =>
    Array.isArray(node['@type']) &&
    node['@type'].includes('scopa:EvidencePacket'));
  const actionIndex = exported.document['@graph'].findIndex(
    (node) => node['@type'] === 'uco-action:Action',
  );

  const cases = [
    (document) => {
      document.unexpected = true;
    },
    (document) => {
      document['@context'] = 'https://attacker.invalid/context';
    },
    (document) => {
      document['@graph'][actionIndex]['scopa:effectCategory'] = 'EMIT';
    },
    (document) => {
      document['@graph'][actionIndex]['uco-core:name'] = 'Distorted category';
    },
    (document) => {
      document['@graph'].splice(actionIndex, 1);
    },
    (document) => {
      document['@graph'].push(clone(document['@graph'][carrierIndex]));
    },
    (document) => {
      document['@graph'][carrierIndex]['scopa:nativePacketBase64']['@value'] =
        `A${document['@graph'][carrierIndex]['scopa:nativePacketBase64']['@value'].slice(1)}`;
    },
    (document) => {
      document['@graph'].reverse();
    },
    (document) => {
      Object.defineProperty(document['@graph'][actionIndex], '__proto__', {
        value: null,
        enumerable: true,
        writable: true,
        configurable: true,
      });
    },
    (document) => {
      Object.defineProperty(document['@graph'][actionIndex], 'hidden', {
        value: 'mutation',
        enumerable: false,
      });
    },
    (document) => {
      document['@graph'].unexpected = 'mutation';
    },
    (document) => {
      const hostile = Object.create(Array.prototype);
      hostile.filter = () => [];
      Object.setPrototypeOf(document['@graph'], hostile);
    },
    (document) => {
      Object.defineProperty(document['@graph'], 'length', {
        writable: false,
      });
    },
    (document) => {
      Object.defineProperty(document['@graph'], '0', {
        writable: false,
      });
    },
  ];

  for (const mutate of cases) {
    const document = clone(exported.document);
    mutate(document);
    await assert.rejects(
      () =>
        verifyCaseExport(document, {
          verificationOptions: input.verificationOptions,
        }),
      /CASE|packet|schema|graph|base64|digest|projection|carrier/,
    );
  }

  const nonCanonical = Buffer.from(
    JSON.stringify(exported.document),
    'utf8',
  );
  await assert.rejects(
    () =>
      verifyCaseExportBytes(nonCanonical, {
        verificationOptions: input.verificationOptions,
      }),
    /not the canonical SCOPA serialization/,
  );
});

test('fresh CLIs export and verify without the original workflow', async (context) => {
  const temp = await mkdtemp(path.join(os.tmpdir(), 'scopa-case-cli-'));
  context.after(() => rm(temp, { recursive: true, force: true }));
  const exportPath = path.join(temp, 'export.jsonld');
  const generationReport = path.join(temp, 'generation.json');
  const verificationReport = path.join(temp, 'verification.json');
  const trustArgs = [
    '--timestamp-roots',
    ROOTS_PATH,
    '--require-timestamp',
    '--timestamp-authority-id',
    'freetsa.org-2026',
    '--timestamp-signer-sha256',
    SIGNER_SHA256,
  ];

  const generated = spawnSync(
    process.execPath,
    [
      'packages/interop/src/export-cli.js',
      '--packet',
      PACKET_PATH,
      '--out',
      exportPath,
      '--report-out',
      generationReport,
      ...trustArgs,
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  assert.equal(generated.status, 0, generated.stderr);

  const verified = spawnSync(
    process.execPath,
    [
      'packages/interop/src/verify-case-cli.js',
      '--export',
      exportPath,
      '--report-out',
      verificationReport,
      ...trustArgs,
    ],
    { cwd: ROOT, encoding: 'utf8' },
  );
  assert.equal(verified.status, 0, verified.stderr);

  const [generation, verification, exportBytes] = await Promise.all([
    readFile(generationReport, 'utf8').then(JSON.parse),
    readFile(verificationReport, 'utf8').then(JSON.parse),
    readFile(exportPath),
  ]);
  assert.equal(generation.ok, true);
  assert.equal(verification.ok, true);
  assert.equal(verification.exactNativePacketRecovered, true);
  assert.equal(generation.nativePacketSha256, verification.nativePacketSha256);
  assert.equal(
    exportBytes.equals(
      Buffer.from((await createCaseExport(await fixture())).jsonBytes),
    ),
    true,
  );
});
