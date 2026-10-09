"use client";

import { useState } from "react";
import styles from "./HomeAboutSection.module.css";

export function AboutHangerImage() {
  const [failed, setFailed] = useState(false);
  if (failed) return null;
  return <div className={styles.visual}>
    {/* Place the transparent hanger artwork at public/images/about/tshirts-hanger.png. */}
    {/* eslint-disable-next-line @next/next/no-img-element */}
    <img src="/images/about/tshirts-hanger.png" alt="T-shirts hanging from a clothing rail" loading="lazy" decoding="async" onError={() => setFailed(true)} />
  </div>;
}
