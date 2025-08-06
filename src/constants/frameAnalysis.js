import { RULE_SELECTION, SITUATION, IDENTITY, DEFINITION_OF_SITUATION } from './labels';

export const SECTIONS = [
  {
    name: SITUATION,
    color: '#fff5f3'
  },
  {
    name: IDENTITY,
    color: '#fffef5'
  },
  {
    name: DEFINITION_OF_SITUATION,
    color: '#f0f8ff'
  },
  {
    name: RULE_SELECTION,
    color: '#f8f8f8'
  },
  {
    name: 'Decision',
    color: '#f0fff0'
  }
];

export const connectionPairs = [
  { from: 0, to: 1, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'A' },     // Situation → Identity
  { from: 0, to: 2, fromSide: 'right', toSide: 'left', horizontalOffset: 20, label: 'B' },     // Situation → Definition of Situation
  { from: 1, to: 2, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'C' },     // Identity → Definition of Situation
  { from: 1, to: 3, fromSide: 'right', toSide: 'left', horizontalOffset: 30, label: 'D' },     // Identity → ${RULE_SELECTION}
  { from: 2, to: 3, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'E' },     // Definition of Situation → ${RULE_SELECTION}
  { from: 3, to: 4, fromSide: 'left', toSide: 'right', horizontalOffset: 20, label: 'F' }      // ${RULE_SELECTION} → Decision
]; 