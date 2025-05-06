import styles from "./styles.module.scss";

import Landing from "@/sections/home/Landing";
import { Test } from "@/sections/Test/Test";

export default function Home() {
  return (
    <main style={{ position: "relative" }}>
      <Landing />
      <Test />
    </main>
  );
}
