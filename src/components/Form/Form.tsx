// !TODO: Work on the loading state and form validation
"use client";

import clsx from "clsx";
import styles from "./styles.module.scss";
import { useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { toast } from "sonner";
import WordAnimation from "../WordAnimation/WordAnimation";

interface FormData {
  name: string;
  alias: string;
  organisation: string;
  email: string;
  phone: string;
  subject: string;
  message: string;
}

const Form = () => {
  const [submitted, setSubmitted] = useState(false);

  // const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<FormData>({
    name: "",
    alias: "",
    organisation: "",
    email: "",
    phone: "",
    subject: "",
    message: "",
  });

  const submitForm = () => {
    // setLoading(true);

    console.log("Form submitted with data:", formData);

    if (!submitted) {
      setSubmitted(true);
      toast.success(
        "Thank you for dropping a message—appreciate you! I'll be in touch real soon 🔥"
      );

      // setLoading(false);
      return;
    }

    // setLoading(false);

    return;
  };

  return (
    <>
      <div className={styles["progress-bar"]}>
        <motion.div
          className={clsx(
            styles["node"],
            styles["node--1"],
            styles["node--active"]
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1 }}
          onClick={() => {
            setSubmitted(false);
          }}
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
              fill="#fff"
            />
            <path
              d="M277.82 78.6347C277.956 35.4771 243.079 0.380571 199.922 0.244987C156.764 0.109403 121.668 34.9861 121.533 78.1437C121.397 121.301 156.273 156.397 199.431 156.533C242.588 156.668 277.685 121.792 277.82 78.6347Z"
              fill="#fff"
            />
          </svg>
        </motion.div>
        <motion.div
          className={clsx(styles["line"], styles["line--1"])}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.2 }}
        >
          <AnimatePresence>
            {submitted && (
              <motion.div
                className={clsx(styles["line"], styles["line--anim"])}
                initial={{ scaleX: 0, transformOrigin: "left" }}
                animate={{ scaleX: 1 }}
                transition={{ duration: 1, ease: [0.42, 0, 0, 0.97] }}
              ></motion.div>
            )}
          </AnimatePresence>
        </motion.div>

        <motion.div
          className={clsx(
            styles["node"],
            styles["node--2"],
            submitted && styles["node--active"]
          )}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1, delay: 0.4 }}
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
              fill="#fff"
            />
            <path
              d="M384.751 75.1755C364.363 54.7878 331.279 54.7878 310.85 75.1755L273.921 112.105L200.021 186.005L126.12 112.105L89.191 75.1755C68.8033 54.7878 35.7198 54.7878 15.2908 75.1755C-5.09692 95.5632 -5.09692 128.646 15.2908 149.075L52.2202 186.005L126.12 259.905C166.937 300.722 233.104 300.722 273.88 259.905L347.78 186.005L384.709 149.075C405.097 128.688 405.097 95.6046 384.709 75.1755H384.751Z"
              fill="#fff"
            />
          </svg>
        </motion.div>
      </div>

      <form
        className={styles["form"]}
        onSubmit={(e) => {
          e.preventDefault();
          submitForm();
        }}
      >
        <AnimatePresence>
          {!submitted && (
            <motion.div
              className={styles["form__anim"]}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5 }}
              key="form-animation"
            >
              <div
                className={clsx(
                  styles["form__content"],
                  styles["form__content--lg"]
                )}
              >
                <WordAnimation
                  text="So, You wanna collab or got some really cool ideas?"
                  className={styles["form__heading"]}
                  element="h2"
                  delayOffset={0.1}
                />
                <div className={styles["form__line"]}>
                  <WordAnimation
                    text="Yo! My name is * "
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={0.2}
                  />
                  <motion.input
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.3 }}
                    type="text"
                    className={styles["form__input"]}
                    placeholder="Your actual name"
                    onChange={(e) =>
                      setFormData({ ...formData, name: e.target.value })
                    }
                    value={formData.name}
                    pattern="^[a-zA-Z\s]+$"
                    required
                  />
                  <WordAnimation
                    text=". The internet knows"
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={0.4}
                  />
                </div>
                <div className={styles["form__line"]}>
                  <WordAnimation
                    text="me as "
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={0.5}
                  />
                  <motion.input
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.6 }}
                    type="text"
                    className={styles["form__input"]}
                    placeholder="Your alias/stage name"
                    onChange={(e) =>
                      setFormData({ ...formData, alias: e.target.value })
                    }
                    value={formData.alias}
                  />
                  <WordAnimation
                    text=". I'm with "
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={0.7}
                  />
                  <motion.input
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 0.8 }}
                    type="text"
                    className={styles["form__input"]}
                    placeholder="Organisation/Company Name"
                    onChange={(e) =>
                      setFormData({ ...formData, organisation: e.target.value })
                    }
                    value={formData.organisation}
                  />
                  <WordAnimation
                    text="."
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={0.8}
                  />
                </div>
                <div className={styles["form__line"]}>
                  <WordAnimation
                    text="You can reach my mail at "
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={0.9}
                  />
                  <motion.input
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1 }}
                    type="email"
                    className={styles["form__input"]}
                    placeholder="example@email.com"
                    onChange={(e) =>
                      setFormData({ ...formData, email: e.target.value })
                    }
                    value={formData.email}
                    required
                  />
                  <WordAnimation
                    text="."
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={1}
                  />
                </div>
                <div className={styles["form__line"]}>
                  <WordAnimation
                    text="Wanna talk like it's 2003? my number is "
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={1.05}
                  />
                  <motion.input
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 1, delay: 1.1 }}
                    type="text"
                    className={styles["form__input"]}
                    placeholder="+1 234 567 890"
                    onChange={(e) =>
                      setFormData({ ...formData, phone: e.target.value })
                    }
                    value={formData.phone}
                    pattern="^\+?[\d\s\-\(\)\.]{7,15}$"
                  />
                  <WordAnimation
                    text="."
                    className={styles["form__text"]}
                    element="p"
                    delayOffset={1.1}
                  />
                </div>
              </div>
              <div
                className={clsx(
                  styles["form__content"],
                  styles["form__content--mb"]
                )}
              >
                <WordAnimation
                  text="So, You wanna collab or got some really cool ideas?"
                  className={styles["form__heading"]}
                  element="h2"
                  delayOffset={0.1}
                />
                <WordAnimation
                  text="Yo! My name is * "
                  className={styles["form__text"]}
                  element="p"
                  delayOffset={0.2}
                />
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.3 }}
                  type="text"
                  className={styles["form__input"]}
                  placeholder="Your actual name"
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  value={formData.name}
                  pattern="^[a-zA-Z\s]+$"
                  required
                />

                <WordAnimation
                  text="The internet knows me as "
                  className={styles["form__text"]}
                  element="p"
                  delayOffset={0.4}
                />
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  type="text"
                  className={styles["form__input"]}
                  placeholder="Your alias/stage name"
                  onChange={(e) =>
                    setFormData({ ...formData, alias: e.target.value })
                  }
                  value={formData.alias}
                />
                <WordAnimation
                  text="I'm with"
                  className={styles["form__text"]}
                  element="p"
                  delayOffset={0.6}
                />
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.6 }}
                  type="text"
                  className={styles["form__input"]}
                  placeholder="Organisation/Company Name"
                  onChange={(e) =>
                    setFormData({ ...formData, organisation: e.target.value })
                  }
                  value={formData.organisation}
                />

                <WordAnimation
                  text="You can reach my mail at "
                  className={styles["form__text"]}
                  element="p"
                  delayOffset={0.8}
                />
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.5 }}
                  type="email"
                  className={styles["form__input"]}
                  placeholder="example@email.com"
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  value={formData.email}
                  required
                />

                <WordAnimation
                  text="Wanna talk like it's 2003? my number is  "
                  className={styles["form__text"]}
                  element="p"
                />
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.55 }}
                  type="text"
                  className={styles["form__input"]}
                  placeholder="+1 234 567 890"
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value })
                  }
                  value={formData.phone}
                  pattern="^\+?[\d\s\-\(\)\.]{7,15}$"
                />
              </div>
              <div
                className={clsx(
                  styles["form__content"],
                  styles["form__content--msg"]
                )}
              >
                <WordAnimation
                  text="So, what's this about? 💭"
                  className={styles["form__text"]}
                  element="p"
                  delayOffset={0.45}
                />
                <motion.input
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 0.7 }}
                  type="text"
                  className={styles["form__input"]}
                  placeholder="Subject"
                  onChange={(e) =>
                    setFormData({ ...formData, subject: e.target.value })
                  }
                  value={formData.subject}
                  required
                />
                <WordAnimation
                  text="And, what do you have in mind? 🤔"
                  className={styles["form__text"]}
                  element="p"
                  delayOffset={0.5}
                />
                <motion.textarea
                  className={styles["form__textarea"]}
                  placeholder="Your message"
                  onChange={(e) =>
                    setFormData({ ...formData, message: e.target.value })
                  }
                  value={formData.message}
                  required
                  rows={10}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ duration: 1, delay: 1.1 }}
                ></motion.textarea>
              </div>
              <motion.button
                type="submit"
                className={styles["form__submit"]}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 1, delay: 1.1 }}
              >
                Fire it up and send it!
              </motion.button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {submitted && (
            <motion.div
              className={styles["form__success"]}
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.5, delay: 1 }}
            >
              <WordAnimation
                text="Thank you for dropping a message—appreciate you! I'll be in touch real soon!"
                className={styles["form__success-text"]}
                element="p"
                delayOffset={1}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </form>
    </>
  );
};

export default Form;
