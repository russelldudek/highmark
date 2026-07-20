import assert from 'node:assert/strict';
import {
  DEFAULT_SCENARIO_ID,
  PLANE_ORDER,
  REVIEW_ORDER,
  SCENARIOS,
  getScenario
} from '../assets/data/topology-scenarios.js';

assert.equal(DEFAULT_SCENARIO_ID, 'prior-auth-completeness');
assert.deepEqual(PLANE_ORDER, ['workflow', 'evidence', 'authority', 'adoption', 'value']);
assert.deepEqual(REVIEW_ORDER, ['consequence', 'evidence', 'authority', 'ownership', 'proof']);
assert.equal(SCENARIOS.length, 4);

for (const scenario of SCENARIOS) {
  assert.equal(scenario.path.length, 5, `${scenario.id} must retain the five-condition evidence source`);
  assert.deepEqual(scenario.path.map(node => node.plane), PLANE_ORDER);
  assert.deepEqual(Object.keys(scenario.review), REVIEW_ORDER, `${scenario.id} must expose the five review decisions`);
  for (const key of REVIEW_ORDER) {
    assert.ok(scenario.review[key].finding, `${scenario.id}.${key} missing finding`);
    assert.ok(scenario.review[key].implication, `${scenario.id}.${key} missing implication`);
  }
  assert.ok(scenario.humanBoundary);
  assert.ok(scenario.proofDesign);
  assert.ok(scenario.disposition.label);
  assert.ok(scenario.disposition.basis);
  assert.ok(scenario.measurement.length >= 3);
  assert.ok(scenario.publicBoundary);
  assert.ok(scenario.owner);
  assert.ok(scenario.adoptionBurden);
}

assert.equal(getScenario(DEFAULT_SCENARIO_ID).illustrative, true);
assert.throws(() => getScenario('missing'), /Unknown opportunity-review scenario/);
console.log('scenario model: passed');
