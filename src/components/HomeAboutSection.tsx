import Link from "next/link";
import { homeAbout } from "@/data/home-about";
import styles from "./HomeAboutSection.module.css";

export function HomeAboutSection() {
  return <section id="about" aria-labelledby="home-about-title" className={styles.section}>
    <div className={styles.layout}>
      <div className={styles.copy}>
        <p className={styles.eyebrow}>{homeAbout.eyebrow}</p>
        <h2 id="home-about-title" className={styles.title}>{homeAbout.title.replace(/\n/g, " ")}</h2>
        <p className={styles.body}>{homeAbout.body}</p>
        <ul className={styles.points}>
          {homeAbout.points.map(point => <li key={point.title}>{point.title}</li>)}
        </ul>
        <Link href="/products" className={styles.link}>Explore our T-shirts ↗</Link>
      </div>
    </div>
  </section>;
}
