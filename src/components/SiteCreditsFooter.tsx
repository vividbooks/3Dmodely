import "./site-credits-footer.css";

export default function SiteCreditsFooter() {
  return (
    <footer className="site-credits" lang="cs">
      <details className="site-credits__details">
        <summary className="site-credits__summary">Credits</summary>
        <div className="site-credits__body">
          <p>
            3D modely v tomto katalogu jsou <strong>volně dostupná díla z internetu</strong> (např. z komunitních
            platforem, kde je autoři zveřejnili).
          </p>
          <p>
            <strong>Děkujeme všem autorům</strong> za možnost s jejich modely pracovat a využívat je ve výuce a ve
            vlastních materiálech.
          </p>
        </div>
      </details>
    </footer>
  );
}
