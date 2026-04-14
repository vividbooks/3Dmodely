import "./site-credits-footer.css";

export default function SiteCreditsFooter() {
  return (
    <footer className="site-credits" lang="cs">
      <details className="site-credits__details">
        <summary className="site-credits__summary">Credits</summary>
        <div className="site-credits__body">
          <p>
            Aplikace 3D modelů je dostupná <strong>široké veřejnosti</strong>.
          </p>
          <p>
            3D modely v tomto katalogu jsou <strong>volně dostupná díla z internetu</strong> (např. z komunitních
            platforem, kde je autoři zveřejnili). Tato stránka je jen jejich přehledný katalog — nejde o vlastní
            autorství modelů.
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
