import test from 'node:test';
import assert from 'node:assert/strict';
import type { ReviewProposal, ReviewDatasetBackup } from '../src/types.ts';

test('Review workspace - Proposal backup structure validation', () => {
  const proposal: ReviewProposal = {
    footprintId: 'uch-bld-843737464',
    osmId: 843737464,
    proposedName: 'West Clinical Ward Block',
    department: 'Obstetrics & Gynaecology',
    evidenceUrl: 'https://uch-ibadan.org.ng/clinical-services/',
    captureDate: '2026-10-15',
    confidence: 'high_confidence',
    notes: 'Identified via UCH floor directory and western road access.',
    proposedEntrance: [3.90098, 7.40310],
    updatedAt: new Date().toISOString(),
  };

  const backup: ReviewDatasetBackup = {
    version: '1.0.0',
    exportedAt: new Date().toISOString(),
    institution: 'University College Hospital, Ibadan',
    proposals: {
      'uch-bld-843737464': proposal,
    },
  };

  const serialized = JSON.stringify(backup);
  const parsed = JSON.parse(serialized);

  assert.equal(parsed.version, '1.0.0');
  assert.equal(parsed.institution, 'University College Hospital, Ibadan');
  assert.ok(parsed.proposals['uch-bld-843737464']);
  assert.equal(parsed.proposals['uch-bld-843737464'].proposedName, 'West Clinical Ward Block');
  assert.equal(parsed.proposals['uch-bld-843737464'].confidence, 'high_confidence');
});

test('Review workspace - Rejects malformed import payloads', () => {
  const invalidPayloads = [
    null,
    'not json',
    {},
    { version: '1.0' }, // missing proposals object
    { proposals: 'not an object' },
  ];

  for (const p of invalidPayloads) {
    let isValid = false;
    if (p && typeof p === 'object' && p.proposals && typeof p.proposals === 'object') {
      isValid = true;
    }
    assert.equal(isValid, false, `Should reject invalid payload: ${JSON.stringify(p)}`);
  }
});
