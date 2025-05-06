export const createWordVariants = (
  baseDelay: number = 0,
  wordDelay: number = 0.1
) => ({
  hidden: {
    y: "100%",
  },
  visible: (i: number) => ({
    y: 0,
    transition: {
      duration: 1.2,
      delay: baseDelay + i * wordDelay, // Use the wordDelay parameter
      ease: [0.62, 0.02, 0, 0.97],
    },
  }),
});

export const wordVariants = createWordVariants(0, 0.2); // Default values
