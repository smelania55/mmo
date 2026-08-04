const PRODUCTS_SOURCE = "/produse_2performant.json?v=" + Date.now();

/**
 * Transformă titlul produsului într-un URL curat.
 *
 * Exemplu:
 * Miere de Manuka MGO 250+ (250 g)
 *
 * devine:
 * miere-de-manuka-mgo-250-250-g
 */
function createProductSlug(text) {
  if (typeof text !== "string") {
    return "";
  }

  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

/**
 * Decodează în siguranță un text provenit din URL.
 */
function safeDecodeURIComponent(value) {
  try {
    return decodeURIComponent(value);
  } catch (error) {
    return value;
  }
}

/**
 * Citește produsul solicitat.
 *
 * Acceptă atât:
 * /produs.html?id=Titlu%20Produs
 *
 * cât și:
 * /miere-de-manuka-mgo-250-250g
 */
function getRequestedProductIdentifier() {
  const urlParams = new URLSearchParams(window.location.search);

  const queryId = urlParams.get("id");

  if (queryId) {
    return safeDecodeURIComponent(queryId).trim();
  }

  const pathname = window.location.pathname.replace(/^\/+|\/+$/g, "");

  if (!pathname || pathname === "produs.html" || pathname === "produs") {
    return "";
  }

  const pathParts = pathname.split("/");
  const lastPart = pathParts[pathParts.length - 1];

  return safeDecodeURIComponent(lastPart).trim();
}

/**
 * Identifică produsul atât după titlu,
 * cât și după slug-ul creat din titlu.
 */
function findRequestedProduct(products, identifier) {
  if (!identifier || !Array.isArray(products)) {
    return null;
  }

  const normalizedIdentifier = createProductSlug(identifier);

  return (
    products.find((product) => {
      if (!product || typeof product !== "object") {
        return false;
      }

      const productTitle =
        typeof product.title === "string" ? product.title.trim() : "";

      const productSlug =
        typeof product.slug === "string"
          ? product.slug.trim().replace(/^\/+|\/+$/g, "")
          : "";

      return (
        productTitle === identifier ||
        createProductSlug(productTitle) === normalizedIdentifier ||
        createProductSlug(productSlug) === normalizedIdentifier
      );
    }) || null
  );
}

/**
 * Găsește linkul afiliat al produsului.
 */
function getAffiliateLink(product) {
  if (!product || typeof product !== "object") {
    return "#";
  }

  const preferredFields = [
    "affiliate_link",
    "affiliate_url",
    "affiliateLink",
    "affiliateUrl",
    "product_url",
    "productUrl",
    "deeplink",
    "deep_link",
    "url",
    "link",
  ];

  for (const field of preferredFields) {
    const value = product[field];

    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
  }

  /*
   * Soluție de rezervă:
   * căutăm un URL, dar evităm câmpurile imaginilor.
   */
  for (const [key, value] of Object.entries(product)) {
    const lowerKey = key.toLowerCase();

    if (
      lowerKey.includes("image") ||
      lowerKey.includes("img") ||
      lowerKey.includes("photo")
    ) {
      continue;
    }

    if (typeof value === "string" && /^https?:\/\//i.test(value.trim())) {
      return value.trim();
    }
  }

  return "#";
}

/**
 * Transformă o cale relativă a imaginii
 * într-un URL complet atunci când este necesar.
 */
function getProductImage(product) {
  const fallbackImage = "/imagini/miere-de-manuka-proprietati.webp";

  if (!product || typeof product !== "object") {
    return fallbackImage;
  }

  const image =
    product.image_urls || product.image_url || product.image || fallbackImage;

  return typeof image === "string" && image.trim()
    ? image.trim()
    : fallbackImage;
}

/**
 * Creează sau actualizează meta description.
 */
function updateMetaDescription(description) {
  let metaDescription = document.querySelector('meta[name="description"]');

  if (!metaDescription) {
    metaDescription = document.createElement("meta");

    metaDescription.name = "description";
    document.head.appendChild(metaDescription);
  }

  metaDescription.content = description;
}

/**
 * Actualizează metadatele disponibile în browser.
 *
 * Notă:
 * Facebook și WhatsApp nu se bazează întotdeauna
 * pe metadate introduse prin JavaScript.
 */
function updateProductMetadata(product, imageUrl, description) {
  const productTitle = product.title || "Miere de Manuka";

  document.title = `${productTitle} | MiereDeManuka.com`;

  updateMetaDescription(description);

  const currentUrl = window.location.href;

  const metadata = {
    'meta[property="og:title"]': productTitle,
    'meta[property="og:description"]': description,
    'meta[property="og:image"]': imageUrl,
    'meta[property="og:url"]': currentUrl,
  };

  Object.entries(metadata).forEach(([selector, value]) => {
    const element = document.querySelector(selector);

    if (element) {
      element.setAttribute("content", value);
    }
  });
}

/**
 * Amestecă produsele folosind algoritmul
 * Fisher-Yates.
 */
function shuffleProducts(products) {
  const shuffled = [...products];

  for (let index = shuffled.length - 1; index > 0; index -= 1) {
    const randomIndex = Math.floor(Math.random() * (index + 1));

    [shuffled[index], shuffled[randomIndex]] = [
      shuffled[randomIndex],
      shuffled[index],
    ];
  }

  return shuffled;
}

/**
 * Protecție pentru textele introduse în innerHTML.
 */
function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * Afișează patru produse recomandate aleatoriu.
 *
 * Produsul curent este exclus.
 */
function displayRecommendedProducts(products, currentProduct) {
  const grid = document.getElementById("recommendedProductsGrid");

  if (!grid) {
    return;
  }

  const currentTitle =
    currentProduct && typeof currentProduct.title === "string"
      ? currentProduct.title
      : "";

  const currentSlug = createProductSlug(currentTitle);

  const availableProducts = products.filter((product) => {
    if (!product || typeof product.title !== "string") {
      return false;
    }

    return createProductSlug(product.title) !== currentSlug;
  });

  const recommendedProducts = shuffleProducts(availableProducts).slice(0, 4);

  if (recommendedProducts.length === 0) {
    grid.innerHTML =
      '<p class="loading">Momentan nu există alte produse recomandate.</p>';

    return;
  }

  grid.innerHTML = recommendedProducts
    .map((product) => {
      const productTitle = product.title || "Miere de Manuka";

      const productImage = getProductImage(product);

      const productSlug = createProductSlug(productTitle);

      const productUrl = `/${encodeURIComponent(productSlug)}`;

      const altText = product.alt || productTitle;

      const titleText = product.titleImagine || productTitle;

      const price =
        product.price !== undefined &&
        product.price !== null &&
        String(product.price).trim() !== ""
          ? `${product.price} RON`
          : "";

      return `
        <article class="product-card">

          <a
            href="${productUrl}"
            aria-label="Vezi produsul ${escapeHtml(productTitle)}"
          >
            <img
              src="${escapeHtml(productImage)}"
              alt="${escapeHtml(altText)}"
              title="${escapeHtml(titleText)}"
              class="product-image"
              loading="lazy"
            >
          </a>

          <div class="product-info">

            <h3 class="product-title">
              <a
                href="${productUrl}"
                style="
                  color: inherit;
                  text-decoration: none;
                "
              >
                ${escapeHtml(productTitle)}
              </a>
            </h3>

            ${
              price
                ? `
                  <p class="product-price">
                    ${escapeHtml(price)}
                  </p>
                `
                : ""
            }

            <a
              href="${productUrl}"
              class="affiliate-btn"
            >
              Vezi produsul
            </a>

          </div>
        </article>
      `;
    })
    .join("");
}

/**
 * Afișează mesajele de eroare în pagina produsului.
 */
function displayProductError(message) {
  const titleElement = document.getElementById("productTitle");

  const priceElement = document.getElementById("productPrice");

  const descriptionElement = document.getElementById("productDescription");

  const affiliateButton = document.getElementById("productAffiliateBtn");

  if (titleElement) {
    titleElement.textContent = "Produsul nu a fost găsit";
  }

  if (priceElement) {
    priceElement.textContent = "";
  }

  if (descriptionElement) {
    descriptionElement.textContent = message;
  }

  if (affiliateButton) {
    affiliateButton.style.display = "none";
  }
}

/**
 * Încarcă produsul și completează pagina.
 */
async function loadProductDetails() {
  const requestedIdentifier = getRequestedProductIdentifier();

  if (!requestedIdentifier) {
    displayProductError("Adresa produsului nu este validă.");

    return;
  }

  try {
    const response = await fetch(PRODUCTS_SOURCE);

    if (!response.ok) {
      throw new Error(
        `Fișierul produselor nu a putut fi încărcat. Cod: ${response.status}`,
      );
    }

    const products = await response.json();

    if (!Array.isArray(products)) {
      throw new Error("Fișierul produselor nu are structura corectă.");
    }

    const product = findRequestedProduct(products, requestedIdentifier);

    if (!product) {
      displayProductError("Produsul solicitat nu există în catalog.");

      return;
    }

    const productTitle = product.title || "Miere de Manuka";

    const productImage = getProductImage(product);

    const productPrice =
      product.price !== undefined &&
      product.price !== null &&
      String(product.price).trim() !== ""
        ? `${product.price} RON`
        : "Preț indisponibil";

    const productDescription =
      product.description ||
      "Descoperă caracteristicile acestui sortiment de miere de Manuka și verifică oferta disponibilă în magazinul partener.";

    const affiliateLink = getAffiliateLink(product);

    const altText = product.alt || productTitle;

    const titleText = product.titleImagine || productTitle;

    const imageElement = document.getElementById("productImage");

    const titleElement = document.getElementById("productTitle");

    const priceElement = document.getElementById("productPrice");

    const descriptionElement = document.getElementById("productDescription");

    const affiliateButton = document.getElementById("productAffiliateBtn");

    if (imageElement) {
      imageElement.src = productImage;
      imageElement.alt = altText;
      imageElement.title = titleText;
    }

    if (titleElement) {
      titleElement.textContent = productTitle;
    }

    if (priceElement) {
      priceElement.textContent = productPrice;
    }

    if (descriptionElement) {
      descriptionElement.textContent = productDescription;
    }

    if (affiliateButton) {
      affiliateButton.href = affiliateLink;

      if (affiliateLink === "#") {
        affiliateButton.textContent = "Oferta nu este disponibilă";

        affiliateButton.setAttribute("aria-disabled", "true");
      } else {
        affiliateButton.textContent = "Cumpără produsul";

        affiliateButton.removeAttribute("aria-disabled");
      }
    }

    updateProductMetadata(product, productImage, productDescription);

    displayRecommendedProducts(products, product);
  } catch (error) {
    console.error("Eroare la încărcarea produsului:", error);

    displayProductError(
      "A apărut o eroare tehnică la încărcarea produsului. Reîncarcă pagina și încearcă din nou.",
    );
  }
}

window.addEventListener("DOMContentLoaded", loadProductDetails);
