// Per-agent visual identity. The hex map lives here (not in a component file)
// because it is data — used by chips, dots, and message author labels alike.
// CouncilSession renders these as inline color styles (runtime-dynamic).

export const AGENT_HUE: Record<string, string> = {
  archaeologist: '#E8B86B',
  security:      '#F26D6D',
  synthesizer:   '#C58BFF',
  adversary:     '#FF9159',
  cartographer:  '#4DD4AC',
  domain:        '#7C8CFF',
}

export const AGENT_LABEL: Record<string, string> = {
  archaeologist: 'Archaeologist',
  security:      'Security Sentinel',
  synthesizer:   'Synthesizer',
  adversary:     'Adversary',
  cartographer:  'Cartographer',
  domain:        'Domain Expert',
}
