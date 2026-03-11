# Invisible Interaction Rules for New Components

Short brief for agents building new UI.
Goal is simple: components must feel alive, legible, and fast.
Use this as a strict implementation contract, not inspiration only.

## Craft
- Design interaction before polish.
- Define intent, trigger, motion, and feedback for every component.
- Keep one primary decision per step.
- Use `src/hooks/useAppHaptics.js` as the only haptic API.
- Budget haptics to one to two pulses per intent.

## Metaphors
- Reuse known metaphors first: tap to select, swipe to move layers, pinch for precision.
- Match mental model to motion direction.
- Do not invent gestures without strong payoff.

## Kinetic Physics
- Motion must preserve momentum and feel interruptible.
- Prefer spring dynamics over linear timing for touch interactions.
- Keep mass consistent within a component family.

## Swipe Gestures
- Lightweight actions can trigger during swipe once threshold is crossed.
- Destructive actions must commit on release.
- Reset state cleanly when user reverses direction.

## Responsive Gestures
- Reflect finger movement from the first pixel.
- Threshold controls commitment, not visibility.
- Never wait for gesture end just to show obvious feedback.

## Spatial Consistency
- Animate from the source of intent.
- Enter and exit paths must map to actual layout geography.
- If source is ambiguous, choose a stable global direction and keep it fixed.

## Fluid Morphing
- Keep one shared anchor when changing shape or size.
- Preserve silhouette continuity to avoid jump cuts.
- Morph only between semantically related elements.

## Frequency & Novelty
- High frequency flows get low motion.
- Low frequency moments can carry higher delight.
- Remove any animation that feels like delay after repeated use.

## Fidgetability
- Add safe, reversible micro interactions where stress accumulates.
- Never tie fidget affordances to destructive state changes.
- Keep fidgets optional and ignorable.

## Scroll Landmarks
- Provide quick return to reading position for long content.
- Preserve user context while allowing fast exploration.
- Use clear, lightweight markers, not heavy overlays.

## Touch Content Visibility
- If finger hides critical detail, render a temporary proxy above the finger.
- Keep drag interactions active even when pointer leaves a narrow track.
- Prioritize confidence over visual purity during direct manipulation.

## Implicit Input
- Use context as input when confidence is high.
- Infer with restraint, always leave override paths.
- Favor assistive automation, not surprising automation.

## Fitts's Law
- Increase hit area on frequent actions.
- Place high value actions near likely pointer or thumb positions.
- Use corners and edges for fast acquisition when platform supports it.

## Practical Tips
| Scenario | Solution |
| --- | --- |
| Make buttons feel responsive | Add `transform: scale(0.97)` on `:active` |
| Element appears from nowhere | Start from `scale(0.95)`, not `scale(0)` |
| Shaky/jittery animations | Add `will-change: transform` |
| Hover causes flicker | Animate child element, not parent |
| Popover scales from wrong point | Set `transform-origin` to trigger location |
| Sequential tooltips feel slow | Skip delay/animation after first tooltip |
| Small buttons hard to tap | Use 44px minimum hit area (pseudo-element) |
| Something still feels off | Add subtle blur (under 20px) to mask it |
| Hover triggers on mobile | Use `@media (hover: hover) and (pointer: fine)` |

## Scrolling
- Do not hijack scroll ownership unpredictably.
- Keep inertial behavior and cancellation rules coherent.
- Support direct manipulation for sliders and media seek where possible.

## Closing Thoughts
- Taste is repeatable when rules are explicit.
- The best interactions disappear into intent.
- If users notice the animation more than the outcome, simplify.

## Acknowledgments
- Rauno Freiberg for interaction vocabulary and framing.
- Platform HIG authors and interaction researchers for foundational models.

## Resources
- Rauno Freiberg, Invisible Details of Interaction Design, July 2023.
- Apple Human Interface Guidelines.
- C. Karunamuni, N. Vries, M. Alonso, Designing Fluid Interfaces.
- Paul Fitts, The information capacity of the human motor system.
- Kevin Hale, Visualizing Fitts's Law.
- Brandur, Learning From Terminals to Design the Future of User Interfaces.
