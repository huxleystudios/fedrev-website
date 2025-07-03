// ----------------------------------
// 🛠️ Static Site Build Script
// ----------------------------------
// This script generates a complete static site by:
// - Bundling and minifying CSS (with content hash for cache busting)
// - Copying static assets (JS, images, icons)
// - Loading HTML partials and injecting dynamic content from JSON
// - Building and minifying final HTML pages
// - Generating sitemap.xml and robots.txt
// - Validating internal links
// - Logging timings and file sizes
// ----------------------------------

// Imports
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import crypto from "crypto";

// Emulate __dirname in ES Modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// ----------------------------------
// 📁 Path Configuration
// ----------------------------------

const SRC_DIR = path.join(__dirname, "src");
const PUBLIC_DIR = path.join(__dirname, "public");
const ASSETS_DIR = path.join(SRC_DIR, "assets");
const PARTIALS_DIR = path.join(SRC_DIR, "partials");
const CONTENT_DIR = path.join(ASSETS_DIR, "content");
const COPY_JSON_PATH = path.join(CONTENT_DIR, "copy.json");

// ----------------------------------
// 📁 Manage Public Folder
// ----------------------------------

// Remove existing public folder
if (fs.existsSync(PUBLIC_DIR)) {
  fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
  console.log("🧹 Removed stale public directory");
}

// Create public folder
fs.mkdirSync(PUBLIC_DIR, { recursive: true });
console.log("📁 Created public directory");

// ----------------------------------
// 🎨 CSS Bundling & Minification
// ----------------------------------

/**
 * Minify CSS by removing comments, whitespace, and unnecessary characters.
 * @param {string} css - CSS string to minify
 * @returns {string} Minified CSS string
 */
function minifyCSS(css) {
  return css
    .replace(/\/\*[\s\S]*?\*\//g, "") // Remove comments
    .replace(/\s+/g, " ") // Collapse whitespace
    .replace(/\s*([{}:;,])\s*/g, "$1") // Remove spaces around symbols
    .replace(/;}/g, "}") // Remove trailing semicolons
    .trim();
}

/**
 * Recursively inline CSS files referenced by @import statements.
 * Prevents duplicate inlining via a Set of seen paths.
 * @param {string} filePath - Absolute path to CSS file
 * @param {Set<string>} seen - Set of already inlined file paths
 * @returns {string} CSS content with inlined imports
 */
function inlineCSS(filePath, seen = new Set()) {
  if (seen.has(filePath)) return "";
  seen.add(filePath);

  const content = fs.readFileSync(filePath, "utf8");

  return content.replace(/@import\s+["'](.+?)["'];/g, (_, importPath) => {
    const resolvedPath = path.resolve(path.dirname(filePath), importPath);
    if (!fs.existsSync(resolvedPath)) {
      console.warn(`⚠️ Missing imported CSS: ${resolvedPath}`);
      return "";
    }
    return inlineCSS(resolvedPath, seen);
  });
}

/**
 * Generate a short 8-character MD5 hash from file content.
 * Used for cache busting.
 * @param {string} content - File content to hash
 * @returns {string} Hash string
 */
function getContentHash(content) {
  return crypto.createHash("md5").update(content).digest("hex").slice(0, 8);
}

/**
 * Compile CSS bundle from input file by inlining imports, minifying,
 * writing to public directory with content hash in filename.
 * @param {string} inputCssFile - CSS entry filename relative to assets/css/
 * @returns {string} Output hashed filename for referencing in HTML
 */
function compileCSSBundleWithHash(inputCssFile) {
  const inputPath = path.join(ASSETS_DIR, "css", inputCssFile);
  const bundledCss = inlineCSS(inputPath);
  const minifiedCss = minifyCSS(bundledCss);

  const hash = getContentHash(minifiedCss);
  const outputFileName = `bundle.${hash}.css`;
  const outputPath = path.join(PUBLIC_DIR, "css", outputFileName);

  fs.mkdirSync(path.dirname(outputPath), { recursive: true });
  fs.writeFileSync(outputPath, minifiedCss, "utf8");
  console.log(`🎨 CSS bundled and minified with hash: ${outputFileName}`);

  return outputFileName;
}

// ----------------------------------
// 📦 Copy Static Assets
// ----------------------------------

/**
 * Recursively copy all files and folders from src to dest.
 * @param {string} src - Source folder path
 * @param {string} dest - Destination folder path
 */
function copyFolder(src, dest) {
  if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
  for (const file of fs.readdirSync(src)) {
    const srcPath = path.join(src, file);
    const destPath = path.join(dest, file);
    const stat = fs.statSync(srcPath);

    if (stat.isDirectory()) {
      copyFolder(srcPath, destPath);
    } else {
      fs.copyFileSync(srcPath, destPath);
    }
  }
}

// Copy essential asset folders into public
const assetFolders = {
  js: "js",
  img: "img",
  icons: "icons",
};

// ----------------------------------
// 🧩 Load HTML Partials
// ----------------------------------

/**
 * Load all HTML partial files into memory.
 * Partial names correspond to keys for replacement in final HTML.
 */
const partialNames = [
  "head",
  "headerHTML",
  "heroSection",
  "invoices",
  "aboutSection",
  "steps",
  "servicesSection",
  "services",
  "contactSection",
  "contactForm",
  "footerHTML",
];

const partials = {};
partialNames.forEach((name) => {
  const fileName = name.replace("HTML", "") + ".html";
  const filePath = path.join(PARTIALS_DIR, fileName);
  partials[name] = fs.readFileSync(filePath, "utf8");
});
console.log("🧩 Loaded HTML partials");

// ----------------------------------
// 📖 Load Site Copy (JSON)
// ----------------------------------

const copyJSON = JSON.parse(fs.readFileSync(COPY_JSON_PATH, "utf8"));
console.log("📖 Loaded site copy from copy.json");

// ----------------------------------
// 🧠 Inject Dynamic Content into Partials
// ----------------------------------

/**
 * Replace placeholders in partials with dynamic content from copy.json.
 * Supports multiple replacements and nested partial injection.
 */
function injectDynamicContent() {
  // Header navigation (multiple links)
  copyJSON.header.nav.forEach((item) => {
    partials.headerHTML = partials.headerHTML
      .replace("{{LABEL}}", item.label)
      .replace("{{DESTINATION}}", item.link);
  });

  // Hero section content
  partials.heroSection = partials.heroSection
    .replace("{{TITLE}}", copyJSON.hero.title)
    .replace("{{DESCRIPTION}}", copyJSON.hero.description)
    .replace("{{CTA}}", copyJSON.hero.cta);

  // Invoices section
  partials.invoices = partials.invoices.replace(
    /{{LABEL}}/g,
    copyJSON.invoices.label
  );
  copyJSON.invoices.amounts.forEach((amount) => {
    partials.invoices = partials.invoices.replace("{{AMOUNT}}", amount);
  });
  partials.heroSection = partials.heroSection.replace(
    "<!-- INVOICES -->",
    partials.invoices
  );

  // About section + steps
  partials.aboutSection = partials.aboutSection
    .replace("{{TITLE}}", copyJSON.about.title)
    .replace("{{DESCRIPTION}}", copyJSON.about.description);

  copyJSON.about.steps.forEach((step) => {
    partials.steps = partials.steps
      .replace("{{TITLE}}", step.title)
      .replace("{{DESCRIPTION}}", step.description);
  });
  partials.aboutSection = partials.aboutSection.replace(
    "<!-- STEPS -->",
    partials.steps
  );

  // Services section + individual services
  partials.servicesSection = partials.servicesSection
    .replace("{{TITLE}}", copyJSON.services.title)
    .replace("{{DESCRIPTION}}", copyJSON.services.description);

  copyJSON.services.list.forEach((service) => {
    partials.services = partials.services
      .replace("{{TITLE}}", service.title)
      .replace("{{DESCRIPTION}}", service.description);
  });
  partials.servicesSection = partials.servicesSection.replace(
    "<!-- SERVICES -->",
    partials.services
  );

  // Contact section with nested contact form partial
  partials.contactSection = partials.contactSection
    .replace("{{TITLE}}", copyJSON.contact.title)
    .replace("{{DESCRIPTION}}", copyJSON.contact.description)
    .replace("<!-- CONTACT FORM -->", partials.contactForm);

  console.log("🔧 Injected dynamic content into partials");
}

// ----------------------------------
// 🧼 HTML Minification
// ----------------------------------

/**
 * Minify HTML by removing comments, whitespace, and newlines.
 * @param {string} html - HTML content string
 * @returns {string} Minified HTML string
 */
function minifyHTML(html) {
  return html
    .replace(/<!--[\s\S]*?-->/g, "") // Remove comments
    .replace(/>\s+</g, "><") // Remove whitespace between tags
    .replace(/\s{2,}/g, " ") // Collapse multiple spaces
    .replace(/^\s+|\s+$/gm, "") // Trim lines
    .replace(/\n+/g, "") // Remove newlines
    .trim();
}

// ----------------------------------
// ⏱️ Helper: Time Operations
// ----------------------------------

/**
 * Utility to time synchronous operations and log duration.
 * @param {string} name - Operation name for logging
 * @param {Function} fn - Synchronous function to execute
 * @returns {*} Function result
 */
function timeOperation(name, fn) {
  const start = process.hrtime.bigint();
  const result = fn();
  const end = process.hrtime.bigint();
  const ms = Number(end - start) / 1e6;
  console.log(`⏱️ ${name} took ${ms.toFixed(2)} ms`);
  return result;
}

// ----------------------------------
// ⚙️ Build Steps
// ----------------------------------

// 1. Bundle and minify CSS, get hashed filename
const hashedCssFile = timeOperation("CSS bundling", () =>
  compileCSSBundleWithHash("main.css")
);

// 2. Copy static assets
for (const [srcName, destName] of Object.entries(assetFolders)) {
  const assetPath = path.join(ASSETS_DIR, srcName);
  const destPath = path.join(PUBLIC_DIR, destName);
  copyFolder(assetPath, destPath);
  console.log(`📂 Copied asset folder: ${srcName} → ${destName}`);
}

// 3. Inject dynamic content into partials
injectDynamicContent();

// 4. Build and minify final HTML pages
fs.readdirSync(SRC_DIR).forEach((file) => {
  if (path.extname(file) === ".html") {
    const inputPath = path.join(SRC_DIR, file);
    let html = fs.readFileSync(inputPath, "utf8");

    html = html
      .replace("<!-- HEAD -->", partials.head)
      .replace(/\/css\/bundle\.css/, `/css/${hashedCssFile}`)
      .replace("<!-- HEADER -->", partials.headerHTML)
      .replace("<!-- HERO SECTION -->", partials.heroSection)
      .replace("<!-- ABOUT SECTION -->", partials.aboutSection)
      .replace("<!-- SERVICES SECTION -->", partials.servicesSection)
      .replace("<!-- CONTACT SECTION -->", partials.contactSection)
      .replace("<!-- FOOTER -->", partials.footerHTML);

    // **Remove /public from asset URLs**
    html = html.replace(/\/public\//g, "/");

    const outputPath = path.join(PUBLIC_DIR, file);
    fs.writeFileSync(outputPath, minifyHTML(html));

    console.log(`✅ Built HTML page: ${file}`);
  }
});

// 5. Generate sitemap.xml
const BASE_URL = "https://fedrev.co"; // <-- UPDATE this for your site
const SITEMAP_PATH = path.join(PUBLIC_DIR, "sitemap.xml");

const htmlFiles = fs
  .readdirSync(PUBLIC_DIR)
  .filter((file) => path.extname(file) === ".html");

const sitemapXml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${htmlFiles
  .map((file) => {
    const route = file === "index.html" ? "/" : `/${file}`;
    return `  <url>
    <loc>${BASE_URL}${route}</loc>
  </url>`;
  })
  .join("\n")}
</urlset>`;

fs.writeFileSync(SITEMAP_PATH, sitemapXml.trim());
console.log("🗺️ Generated sitemap.xml");

// 6. Generate robots.txt
const robotsTxt = `User-agent: *
Allow: /

Sitemap: ${BASE_URL}/sitemap.xml`;

const ROBOTS_PATH = path.join(PUBLIC_DIR, "robots.txt");
fs.writeFileSync(ROBOTS_PATH, robotsTxt.trim());
console.log("🤖 Generated robots.txt");

// 7. Validate internal links in built HTML
function validateLinks(publicDir) {
  const htmlFiles = fs
    .readdirSync(publicDir)
    .filter((f) => path.extname(f) === ".html");

  let errorsFound = false;

  htmlFiles.forEach((file) => {
    const filePath = path.join(publicDir, file);
    const content = fs.readFileSync(filePath, "utf8");

    // Extract internal href/src values
    const linkRegex = /(?:href|src)=["']([^"':#?][^"']*)["']/g;
    let match;

    while ((match = linkRegex.exec(content)) !== null) {
      const link = match[1];
      if (link.startsWith("http") || link.startsWith("//")) return; // skip external

      // Normalize relative paths
      let targetPath = link.split("?")[0].split("#")[0];
      if (targetPath.endsWith("/")) targetPath += "index.html";

      const resolved = path.join(publicDir, targetPath);

      if (!fs.existsSync(resolved)) {
        console.warn(`⚠️ Broken link in ${file}: '${link}' does not exist.`);
        errorsFound = true;
      }
    }
  });

  if (!errorsFound) {
    console.log("✅ All internal links validated successfully.");
  }
}

validateLinks(PUBLIC_DIR);

// 8. Log file size of bundled CSS
function logFileSize(filePath) {
  const sizeBytes = fs.statSync(filePath).size;
  const sizeKB = (sizeBytes / 1024).toFixed(2);
  console.log(`📦 ${path.basename(filePath)} size: ${sizeKB} KB`);
}

logFileSize(path.join(PUBLIC_DIR, "css", hashedCssFile));

// ----------------------------------
// 🎉 Build Complete!
// ----------------------------------
console.log("🎉 Static site build complete!");
