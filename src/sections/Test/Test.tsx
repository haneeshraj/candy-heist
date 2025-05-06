import styles from "./styles.module.scss";
import NewsBox from "@/components/NewsBox/NewsBox";

export const Test = () => {
  return (
    <div
      style={{
        height: "100vh",
      }}
      className={styles["test"]}
    >
      <NewsBox />
    </div>
  );
};
