import Footer from "@/components/Footer/Footer";
import "./globals.scss";

export default function Home() {
  return (
    <>
      <div
        style={{
          height: "400vh",
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          fontSize: "24px",
          fontWeight: "bold",
        }}
      ></div>
      <Footer />
    </>
  );
}
