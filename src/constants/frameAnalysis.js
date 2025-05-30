export const SECTIONS = [
  {
    name: 'Situation',
    color: '#f9f3f2'
  },
  {
    name: 'Identity',
    color: '#fcfbf2'
  },
  {
    name: 'Definition of Situation',
    color: '#f2f6fc'
  },
  {
    name: 'Rule Selection',
    color: '#ededed'
  },
  {
    name: 'Decision',
    color: '#f2fcf2'
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