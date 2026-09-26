import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import CustomEase from 'gsap/CustomEase';

gsap.registerPlugin(ScrollTrigger, CustomEase);

// Shared across every staggered-letter component so all text reveals move
// with the same signature feel.
export const EASE_SIGNATURE_BEZIER = '0.64, 0, 0, 0.97';
export const EASE_SIGNATURE = 'chx-signature';

CustomEase.create(EASE_SIGNATURE, EASE_SIGNATURE_BEZIER);

export { gsap, ScrollTrigger, CustomEase };
