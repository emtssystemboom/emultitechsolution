/**
 * footer.js
 * Injects the site-wide footer into any page.
 * Usage: <div id="site-footer"></div>  (before closing </body>)
 * Or simply include this script — it auto-injects into #site-footer if present,
 * otherwise appends to <body>.
 */

(function () {
  const footerHTML = `
  <footer class="footer-container">
    <div class="container-fluid">

      <div class="quote__section fade-slide">
        Start Getting Results Online
        <a href="request_quote.html" class="btn btn-hero">REQUEST A QUOTE</a>
      </div>

      <div class="footer-top">
        <div class="contact-box">
          <div class="contact-icon">
            <img src="images/map-icon.png" alt="Map Pin Icon">
          </div>
          <div class="contact-address">
            <h4>KATHMANDU</h4>
            <p>Near UN Office, Kupondol, Lalitpur, Nepal<br>
               Mobile: <a href="https://wa.me/9779851038796" target="_blank" rel="noopener noreferrer">+977 9851038796</a>
            </p>
          </div>
        </div>
        <div class="contact-box">
          <div class="contact-icon">
            <img src="images/map-icon.png" alt="Map Pin Icon">
          </div>
          <div class="contact-address">
            <h4>Melbourne</h4>
            <p>Australia<br>
               Mobile: <a href="https://wa.me/61406806984" target="_blank" rel="noopener noreferrer">+61 406 806 984</a>
            </p>
          </div>
        </div>
      </div>

      <div class="footer-middle">
        <div class="footer-logo fade-slide">
          <img src="images/footer-logo.png" alt="eMultiTechSolutions Logo" loading="lazy">
          <p>We craft, launch, and scale high-performance web, mobile, and wearable applications — from design to development, testing, and ongoing growth.</p>
        </div>

        <div class="footer-column fade-slide">
          <h5>Services</h5>
          <ul>
            <li><a href="ai-powered-solutions.html"         class="footer-text">AI Powered Solutions</a></li>
            <li><a href="mobile-development.html"   class="footer-text">Mobile App Development</a></li>
            <li><a href="saas-development.html"      class="footer-text">SaaS Development</a></li>
            <li><a href="custom-software-development.html" class="footer-text">Custom Software Development</a></li>
            <li><a href="devops-engineer.html"      class="footer-text">DevOps Engineer</a></li>
            <li><a href="product-engineering.html"    class="footer-text">Product Engineering</a></li>
          </ul>
        </div>

        <div class="footer-column fade-slide">
          <h5>Industries</h5>
          <ul>
            <li><a href="healthcare.html"        class="footer-text">Healthcare</a></li>
            <li><a href="realestate.html"         class="footer-text">Real Estate</a></li>
            <li><a href="auction-software.html"  class="footer-text">Auction Software</a></li>
          </ul>
        </div>

        <div class="footer-column fade-slide">
          <h5>Information</h5>
          <ul>
            <li><a href="about.html"               class="footer-text">About Us</a></li>
            <li><a href="privacy-policy.html"      class="footer-text">Privacy Policy</a></li>
            <li><a href="terms-of-condition.html"  class="footer-text">Terms and Condition</a></li>
            <li><a href="cookie-policy.html"       class="footer-text">Cookie Policy</a></li>
            <li><a href="contact.html"             class="footer-text">Contact Us</a></li>
          </ul>
        </div>
      </div>

      <div class="footer-bottom">
        <p>&copy; 2010 - 2026 Emultitechsolution</p>
        <div class="social-icons">
          <a href="https://www.facebook.com/emultitechsolutionnepal" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-facebook-f"></i>
          </a>
          <a href="https://www.linkedin.com/company/emultitechsolution" target="_blank" rel="noopener noreferrer">
            <i class="fa-brands fa-linkedin-in"></i>
          </a>
        </div>
      </div>

    </div>
  </footer>
  `;

  // Inject the footer at runtime ONLY if the page doesn't already have one.
  // Pages built by tools/build-pages.mjs have the footer HTML inlined directly
  // (so crawlers and AI bots see real content) — in that case this is a no-op.
  const placeholder = document.getElementById('site-footer');
  const hasInlinedFooter = document.querySelector('footer') !== null;
  if (!hasInlinedFooter) {
    if (placeholder) {
      placeholder.outerHTML = footerHTML;
    } else {
      document.body.insertAdjacentHTML('beforeend', footerHTML);
    }
  } else if (placeholder) {
    placeholder.remove();
  }
})();
