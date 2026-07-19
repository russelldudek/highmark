import assert from 'node:assert/strict';
import {
  DEFAULT_SCENARIO_ID,
  PLANE_ORDER,
  SCENARIOS,
  getScenario
} from '../assets/data/topology-scenarios.js';

assert.equal(DEFAULT_SCENARIO_ID, 'prior-auth-completeness');
assert.deepEqual(PLANE_ORDER, ['workflow', 'evidence', 'authority', 'adoption', 'value']);
assert.equal(SCENARIOS.length, 4);

for (const scenario of SCENARIOS) {
  assert.equal(scenario.path.length, 5, `${scenario.id} must traverse five planes`);
  assert.deepEqual(scenario.path.map(node => node.plane), PLANE_ORDER);
  assert.ok(scenario.disposition.label);
  assert.ok(scenario.disposition.basis);
  assert.ok(scenario.measurement.length >= 3);
  assert.ok(scenario.publicBoundary);
  assert.ok(scenario.owner);
  assert.ok(scenario.adoptionBurden);
}

assert.equal(getScenario(DEFAULT_SCENARIO_ID).illustrative, true);
assert.throws(() => getScenario('missing'), /Unknown topology scenario/);
console.log('scenario model: passed');
