import assert from 'node:assert/strict';
import { readFile } from 'node:fs/promises';
import test from 'node:test';
import Ajv2020 from 'ajv/dist/2020.js';
import { validateSliceDefinition } from '../src/lock.js';

const schema = JSON.parse(await readFile(
  new URL('../../../schemas/scopa.slice-definition.v1.schema.json', import.meta.url),
  'utf8',
));
const fixture = JSON.parse(await readFile(
  new URL('../../../fixtures/S10/clean.slice-definition.json', import.meta.url),
  'utf8',
));
const validateSchema = new Ajv2020({ strict: true }).compile(schema);

function rejectsBoth(mutator) {
  const candidate = structuredClone(fixture);
  mutator(candidate);
  assert.equal(validateSchema(candidate), false);
  assert.throws(() => validateSliceDefinition(candidate));
}

test('published slice-definition schema accepts the packaged fixture', () => {
  assert.equal(validateSchema(fixture), true, JSON.stringify(validateSchema.errors));
  assert.equal(validateSliceDefinition(structuredClone(fixture)).sliceId, fixture.sliceId);
});

test('published schema and runtime reject core contract drift', () => {
  for (const mutator of [
    (value) => { value.unknown = true; },
    (value) => { value.allowedPaths = ['workspace/*']; },
    (value) => { value.allowedPaths = ['../workspace/**']; },
    (value) => { value.amendmentPath = '/tmp/amendment.json'; },
    (value) => { value.gates[0].cwd = '../outside'; },
    (value) => { value.gates[0].command = []; },
    (value) => { value.gates[0].timeoutMs = 0; },
    (value) => { value.stopCondition.kind = 'model-says-done'; },
  ]) {
    rejectsBoth(mutator);
  }
});

test('runtime additionally rejects duplicate gate identifiers', () => {
  const candidate = structuredClone(fixture);
  candidate.gates.push(structuredClone(candidate.gates[0]));
  assert.throws(() => validateSliceDefinition(candidate), /duplicate gate id/);
});
