import WordAnimation from "@/components/WordAnimation/WordAnimation";
import styles from "./styles.module.scss";
import ImageComp from "@/components/ImageComp/ImageComp";
import GridItem from "./GridItem";

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

          <WordAnimation
            text="Lorem ipsum dolor sit amet consectetur."
            element="p"
            className={styles["paragraph"]}
            letterDelay={0.03}
            duration={1}
          />
        </div>
        <div className={styles["image"]}>
          <div className={styles["image-container"]}>
            <ImageComp
              alt="About Image"
              img="/images/me.png"
              className={styles["content__image"]}
            />
          </div>
        </div>
      </section>

      <section className={styles["info"]}>
        <WordAnimation
          text="Lorem ipsum dolor sit amet consectetur."
          element="h2"
          className={styles["info__text"]}
          letterDelay={0.03}
          duration={1}
        />

        <div className={styles["info__grid"]}>
          <GridItem
            icon={
              <svg
                width="32"
                height="32"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 216.766L183.2 399.997H98.1747C43.9669 399.997 0 356.029 0 301.821V216.766Z"
                  fill="#9f5dd1"
                />
                <path
                  d="M183.231 0L0 183.232V98.2076C0 43.9677 43.9669 0 98.1747 0H183.231Z"
                  fill="#9f5dd1"
                />
                <path
                  d="M399.999 98.2076V183.232L216.767 0H301.823C356.03 0 399.999 43.9677 399.999 98.2076Z"
                  fill="#9f5dd1"
                />
                <path
                  d="M216.801 399.997L400 216.766V301.821C400 356.029 356.032 399.997 301.824 399.997H216.801Z"
                  fill="#9f5dd1"
                />
                <path
                  d="M313.824 237.403L237.408 313.819C216.736 293.147 183.265 293.147 162.593 313.819L86.1758 237.403C106.848 216.764 106.848 183.259 86.1758 162.587L162.593 86.1719C183.265 106.844 216.736 106.844 237.408 86.1719L313.824 162.587C293.152 183.259 293.152 216.764 313.824 237.403Z"
                  fill="#9f5dd1"
                />
              </svg>
            }
            title="Title One"
            desc="Lorem ipsum dolor sit amet consectetur. Eu nibh maecenas ac sed leo dolor. Vel sit eget laoreet arcu neque. Suspendisse massa aliquet nisi at."
          />
          <GridItem
            icon={
              <svg
                width="32"
                height="32"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 212.48V400H187.52C304.864 400 400 304.864 400 187.52V0H212.48C95.1357 0 0 95.1357 0 212.48ZM337.856 337.952H186.656C117.856 337.952 62.1125 282.176 62.1125 213.408V62.2078H213.312C282.113 62.2078 337.856 117.984 337.856 186.752V337.952Z"
                  fill="#6c95e8"
                />
                <path
                  d="M221.377 98.3945C153.409 98.3945 98.3047 153.498 98.3047 221.466V301.754H178.592C246.56 301.754 301.664 246.65 301.664 178.682V98.3945H221.377ZM241.695 241.786H158.272V158.362H241.695V241.786Z"
                  fill="#6c95e8"
                />
              </svg>
            }
            title="Title Two"
            desc="Lorem ipsum dolor sit amet consectetur. Eu nibh maecenas ac sed leo dolor. Vel sit eget laoreet arcu neque. Suspendisse massa aliquet nisi at."
          />
          <GridItem
            icon={
              <svg
                width="32"
                height="32"
                viewBox="0 0 400 400"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  d="M0 272V128C39.712 128 72 160.32 72 200C72 239.68 39.712 272 0 272Z"
                  fill="#746ce8"
                />
                <path
                  d="M0 336V304C57.344 304 104 257.344 104 200C104 142.656 57.344 96 0 96V64C75.008 64 136 125.024 136 200C136 274.976 75.008 336 0 336Z"
                  fill="#746ce8"
                />
                <path
                  d="M0 400V368C92.64 368 168 292.64 168 200C168 107.36 92.64 32 0 32V0C110.464 0 200 89.536 200 200C200 255.232 177.632 305.217 141.408 341.441C105.248 377.601 55.232 400 0 400Z"
                  fill="#746ce8"
                />
                <path
                  d="M400 272V128C360.288 128 328 160.32 328 200C328 239.68 360.288 272 400 272Z"
                  fill="#746ce8"
                />
                <path
                  d="M400 336V304C342.656 304 296 257.344 296 200C296 142.656 342.656 96 400 96V64C324.992 64 264 125.024 264 200C264 274.976 324.992 336 400 336Z"
                  fill="#746ce8"
                />
                <path
                  d="M400 400V368C307.36 368 232 292.64 232 200C232 107.36 307.36 32 400 32V0C289.536 0 200 89.536 200 200C200 255.232 222.368 305.217 258.592 341.441C294.752 377.601 344.768 400 400 400Z"
                  fill="#746ce8"
                />
              </svg>
            }
            title="Title Three"
            desc="Lorem ipsum dolor sit amet consectetur. Eu nibh maecenas ac sed leo dolor. Vel sit eget laoreet arcu neque. Suspendisse massa aliquet nisi at."
          />
        </div>
      </section>

      <section className={styles["details"]}>
        <div className={styles["details__image"]}>
          <div className={styles["details__image-container"]}>
            <ImageComp
              alt="Details Image"
              img="/images/me.png"
              className={styles["details__img"]}
            />
          </div>
        </div>
        <div className={styles["details__text"]}>
          <div className={styles["details__text-container"]}>
            <WordAnimation
              text="Lorem ipsum dolor sit amet consectetur. Eu nibh maecenas ac sed leo dolor. Vel sit eget laoreet arcu neque. Suspendisse massa aliquet nisi at."
              element="p"
              className={styles["details__paragraph"]}
              letterDelay={0.03}
              duration={1}
            />
          </div>
        </div>
      </section>
    </main>
  );
};

export default About;
