export const SECTIONS = [
  {
    name: 'Situation',
    color: '#fff5f3'
  },
  {
    name: 'Identity',
    color: '#fffef5'
  },
  {
    name: 'Definition of Situation',
    color: '#f0f8ff'
  },
  {
    name: 'Rule Selection',
    color: '#f8f8f8'
  },
  {
    name: 'Decision',
    color: '#f0fff0'
  }
];

export const connectionPairs = [
  { from: 0, to: 1, fromSide: 'left', toSide: 'right', horizontalOffset: 20 },
  { from: 0, to: 2, fromSide: 'right', toSide: 'left', horizontalOffset: 20 },     // Situation → Definition of Situation
  { from: 1, to: 2, fromSide: 'left', toSide: 'right', horizontalOffset: 20 },     // Identity → Definition of Situation
  { from: 1, to: 3, fromSide: 'right', toSide: 'left', horizontalOffset: 30 },     // Identity → Rule Selection
  { from: 2, to: 3, fromSide: 'left', toSide: 'right', horizontalOffset: 20 },     // Definition of Situation → Rule Selection
  { from: 3, to: 4, fromSide: 'left', toSide: 'right', horizontalOffset: 20 }      // Rule Selection → Decision
]; 