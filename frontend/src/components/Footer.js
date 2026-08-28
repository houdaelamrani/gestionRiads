"use client";

import Link from "next/link";
import { useLanguage } from "../lib/LanguageContext";

export default function Footer({ onCityClick }) {
  const { t } = useLanguage();

  return (
    <footer className="footer" style={{ marginTop: "60px" }}>
      <div className="footer-grid">
        <div className="footer-col">
          <h3 className="footer-logo" style={{ fontFamily: "'Playfair Display', serif" }}>
            Morocco<span>Riads</span>
          </h3>
          <p className="footer-desc">
            {t("footer_desc")}
          </p>
        </div>

        <div className="footer-col">
          <h4>{t("footer_destinations")}</h4>
          <ul className="footer-links">
            <li>
              {onCityClick ? (
                <a href="#riads" onClick={() => onCityClick("Marrakech")}>
                  Marrakech
                </a>
              ) : (
                <Link href="/#riads">Marrakech</Link>
              )}
            </li>
            <li>
              {onCityClick ? (
                <a href="#riads" onClick={() => onCityClick("Fès")}>
                  Fès
                </a>
              ) : (
                <Link href="/#riads">Fès</Link>
              )}
            </li>
            <li>
              {onCityClick ? (
                <a href="#riads" onClick={() => onCityClick("Essaouira")}>
                  Essaouira
                </a>
              ) : (
                <Link href="/#riads">Essaouira</Link>
              )}
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{t("footer_platform")}</h4>
          <ul className="footer-links">
            <li>
              <Link href="/#riads">{t("nav_riads")}</Link>
            </li>
            <li>
              <Link href="/#comment">{t("nav_services")}</Link>
            </li>
          </ul>
        </div>

        <div className="footer-col">
          <h4>{t("footer_newsletter")}</h4>
          <p style={{ fontSize: "0.88rem", marginBottom: "14px", color: "var(--text-secondary)" }}>
            {t("newsletter_desc")}
          </p>
          <form
            className="newsletter-form"
            onSubmit={(e) => {
              e.preventDefault();
              alert(t("newsletter_success"));
            }}
          >
            <input type="email" placeholder={t("newsletter_placeholder")} required />
            <button
              type="submit"
              className="btn btn-primary"
              style={{ padding: "10px 16px" }}
            >
              {t("newsletter_btn")}
            </button>
          </form>
        </div>
      </div>

      <div className="footer-bottom">
        <p>{t("footer_rights")}</p>
        <p>{t("footer_motto")}</p>
      </div>
    </footer>
  );
}
