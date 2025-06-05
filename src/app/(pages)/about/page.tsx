import WordAnimation from "@/components/WordAnimation/WordAnimation";
import styles from "./styles.module.scss";
import ImageComp from "@/components/ImageComp/ImageComp";

const About = () => {
  return (
    <main className={styles["main"]}>
      <WordAnimation
        text="WHO IS THIS GUY?"
        element="h1"
        className={styles["title"]}
      />

      <section className={styles["content"]}>
        <div className={styles["text"]}>
          <WordAnimation
            text="Lorem ipsum dolor sit amet consectetur. Eu nibh maecenas ac sed leo dolor. Vel sit eget laoreet arcu neque. Suspendisse massa aliquet nisi at. Blandit vestibulum suspendisse duis ut ut accumsan eget condimentum."
            element="p"
            className={styles["paragraph"]}
            letterDelay={0.03}
            duration={1}
          />
        </div>
        <div className={styles["image"]}>
          <div className={styles["image-container"]}>
            <ImageComp alt="About Image" img="/images/me.png" />
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
