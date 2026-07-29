# Warning philosophy

RXOS milestone 1.2 uses a presentation-only severity model. It does not
reproduce Mazda warning logic, verified thresholds, diagnostic coverage, or
factory warning lamps.

## Severity roles

| Severity    | Purpose                                                      | Presentation                                     |
| ----------- | ------------------------------------------------------------ | ------------------------------------------------ |
| Information | Neutral state worth noting                                   | Text and icon                                    |
| Advisory    | Awareness without immediate urgency                          | Accent treatment                                 |
| Caution     | Prompt attention                                             | Amber treatment                                  |
| Critical    | Persistent simulated condition requiring immediate awareness | Red treatment, text, icon, and persistent banner |

Every warning contains a stable identifier, severity, short title,
plain-language message, acknowledgement policy, source, timestamp, and active
state. Acknowledgement only dismisses an eligible presentation; it never claims
to clear or repair an underlying condition. Critical warnings are not
acknowledgeable and remain visible until the simulated source flag clears.

The current simulator flags are mapped solely to demonstrate the four visual
roles. Labels must include “simulated” where a viewer could mistake them for
vehicle authority. No new threshold is inferred in QML.

Colour is supplementary: each state also uses a severity word, icon shape, and
plain-language text. Red is reserved for critical emphasis and is not used for
normal status.
