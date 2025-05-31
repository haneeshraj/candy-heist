"use client";

import clsx from "clsx";
import styles from "./styles.module.scss";
import { useEffect, useState } from "react";

interface FormData {
  firstName: string;
  lastName: string;
  organisation: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Form = () => {
  const [stepNumber, setStepNumber] = useState(0);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    organisation: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  return (
    <>
      <div className={styles["progress-bar"]}>
        <div
          className={clsx(
            styles["node"],
            styles["node--1"],
            stepNumber >= 0 && styles["node--active"]
          )}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 400 403"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M250.752 273.782C307.648 256.502 348.256 211.03 348.256 157.686H51.7758C51.7758 211.062 92.4162 256.534 149.28 273.782C63.3921 288.758 0 340.822 0 402.774H400C400 340.822 336.608 288.758 250.72 273.782H250.752Z"
              fill="#b053e6"
            />
            <path
              d="M277.82 78.6347C277.956 35.4771 243.079 0.380571 199.922 0.244987C156.764 0.109403 121.668 34.9861 121.533 78.1437C121.397 121.301 156.273 156.397 199.431 156.533C242.588 156.668 277.685 121.792 277.82 78.6347Z"
              fill="#b053e6"
            />
          </svg>
        </div>
        <div
          className={clsx(
            styles["line"],
            styles["line--1"],
            stepNumber > 0 && styles["line--active"]
          )}
        ></div>
        <div
          className={clsx(
            styles["node"],
            styles["node--2"],
            stepNumber > 0 && styles["node--active"]
          )}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M400 200.001C400 167.77 346.117 140.311 270.403 129.597C259.689 53.8826 232.23 0 199.999 0C167.769 0 140.311 53.8826 129.597 129.597C53.8826 140.311 0 167.77 0 200.001C0 232.231 53.8826 259.689 129.597 270.403C140.311 346.117 167.769 400 199.999 400C232.23 400 259.689 346.117 270.403 270.403C346.117 259.689 400 232.231 400 200.001Z"
              fill="#109D82"
            />
          </svg>
        </div>
        <div
          className={clsx(
            styles["line"],
            styles["line--2"],
            stepNumber > 1 && styles["line--active"]
          )}
        ></div>
        <div
          className={clsx(
            styles["node"],
            styles["node--3"],
            stepNumber > 1 && styles["node--active"]
          )}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 400 400"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M199.999 200L278.252 32.9601C255.797 12.128 228.916 0 199.999 0C171.082 0 144.201 12.1575 121.746 32.9601L199.999 200Z"
              fill="#F297A4"
            />
            <path
              d="M199.999 200L121.746 367.041C144.201 387.873 171.082 400 199.999 400C228.916 400 255.797 387.843 278.252 367.041L199.999 200Z"
              fill="#F297A4"
            />
            <path
              d="M200 199.999L367.041 278.253C387.873 255.798 400 228.916 400 199.999C400 171.082 387.843 144.201 367.041 121.746L200 199.999Z"
              fill="#F297A4"
            />
            <path
              d="M200 199.999L32.9593 121.746C12.1272 144.201 0 171.082 0 199.999C0 228.916 12.1567 255.798 32.9593 278.253L200 199.999Z"
              fill="#F297A4"
            />
          </svg>
        </div>
        <div
          className={clsx(
            styles["line"],
            styles["line--2"],
            stepNumber > 2 && styles["line--active"]
          )}
        ></div>
        <div
          className={clsx(
            styles["node"],
            styles["node--4"],
            stepNumber > 2 && styles["node--active"]
          )}
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 400 291"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              d="M273.923 52.2199L236.994 15.2908C216.606 -5.09692 183.523 -5.09692 163.094 15.2908L126.164 52.2199L200.064 126.121L273.965 52.2199H273.923Z"
              fill="#2E96D4"
            />
            <path
              d="M384.751 75.1755C364.363 54.7878 331.279 54.7878 310.85 75.1755L273.921 112.105L200.021 186.005L126.12 112.105L89.191 75.1755C68.8033 54.7878 35.7198 54.7878 15.2908 75.1755C-5.09692 95.5632 -5.09692 128.646 15.2908 149.075L52.2202 186.005L126.12 259.905C166.937 300.722 233.104 300.722 273.88 259.905L347.78 186.005L384.709 149.075C405.097 128.688 405.097 95.6046 384.709 75.1755H384.751Z"
              fill="#2E96D4"
            />
          </svg>
        </div>
      </div>
    </>
  );
};

export default Form;
