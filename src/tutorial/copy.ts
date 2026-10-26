// Keyboard hint lines. Tokens from docs/fabula/teksty-m1-en.md are filled with the
// default bindings (WASD, Enter, Space, Q, 1, E). Touch lines stay in the lore file.
export const TUT_COPY = {
  M1_TUT_01K: 'Move: WASD.',
  M1_TUT_02K: 'Choose LIFT. Press Enter to go down.',
  M1_TUT_03K: 'Walk into it, or press Space.',
  M1_TUT_04: '! means attack. Step off the x.',
  M1_TUT_05K: 'Press Q to heal.',
  M1_TUT_06K: 'Press 1 to dash away.',
  M1_TUT_07: 'AT RISK: you lose this if you die.',
  M1_TUT_08: 'Bag almost full.',
  M1_TUT_09K: 'Press E at the terminal.',
  M1_TUT_11: 'Now go back to the lift.',
  M1_TUT_12K: 'Hold E to call the lift.',
  M1_TUT_13: 'Stand still and keep holding.',
  M1_TUT_SETTING: 'Hints',
} as const;

export type TutTextId = keyof typeof TUT_COPY;
