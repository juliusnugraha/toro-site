const CART_KEY = "toro-cart";

const catalog = {
  "spicy-tuna": { name: "Spicy Tuna", price: 6.5 },
  salmon: { name: "Salmon", price: 6.5 },
  chutoro: { name: "Bluefin Chutoro", price: 10.5 },
};

function readCart() {
  try {
    return JSON.parse(localStorage.getItem(CART_KEY) || "{}");
  } catch {
    return {};
  }
}

function writeCart(cart) {
  localStorage.setItem(CART_KEY, JSON.stringify(cart));
  updateCount();
  renderCartDrawer();
  renderCartPage();
}

function cartCount(cart = readCart()) {
  return Object.values(cart).reduce((sum, n) => sum + n, 0);
}

function menuHref() {
  return document.body.id === "top" ? "#menu" : "./index.html#menu";
}

function updateCount() {
  const n = cartCount();
  const label = `Cart, ${n} ${n === 1 ? "item" : "items"}`;
  document.querySelectorAll("[data-cart-count]").forEach((el) => {
    el.textContent = String(n);
  });
  document.querySelectorAll("[data-mobile-cart]").forEach((el) => {
    el.hidden = n < 1;
  });
  document.querySelectorAll("[data-cart-toggle]").forEach((el) => {
    el.setAttribute("aria-label", label);
  });
}

function showToast(message) {
  const toast = document.querySelector(".toast");
  if (!toast) return;
  toast.textContent = message;
  toast.hidden = false;
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => {
    toast.hidden = true;
  }, 1800);
}

function addItem(id) {
  const item = catalog[id];
  if (!item) return;
  const cart = readCart();
  cart[id] = (cart[id] || 0) + 1;
  writeCart(cart);
  showToast(`Added ${item.name}`);
}

function removeItem(id) {
  const item = catalog[id];
  const cart = readCart();
  if (!cart[id]) return;
  delete cart[id];
  writeCart(cart);
  if (item) showToast(`Removed ${item.name}`);
}

function cartEntries(cart = readCart()) {
  return Object.entries(cart).filter(([, qty]) => qty > 0);
}

let cartEditMode = false;

function syncCartEditUi() {
  const hasItems = cartEntries().length > 0;
  if (!hasItems) cartEditMode = false;

  document.querySelectorAll(".cart-drawer").forEach((el) => {
    el.classList.toggle("is-editing", cartEditMode);
  });
  document.querySelectorAll("[data-cart-page]").forEach((el) => {
    el.classList.toggle("is-editing", cartEditMode);
  });
  document.querySelector(".cart-page-hero")?.classList.toggle("is-editing", cartEditMode);

  document.querySelectorAll("[data-cart-edit]").forEach((btn) => {
    btn.hidden = !hasItems;
    btn.setAttribute("aria-pressed", String(cartEditMode));
    btn.textContent = cartEditMode ? "Done" : "Edit";
  });
}

function setCartEditMode(on) {
  cartEditMode = Boolean(on) && cartEntries().length > 0;
  syncCartEditUi();
}

function cartMarkup() {
  const entries = cartEntries();
  if (!entries.length) {
    return `
      <p class="cart-drawer-empty">Your cart is empty.</p>
      <a class="btn btn-primary" href="${menuHref()}">Add signature rolls</a>
    `;
  }

  let total = 0;
  const rows = entries
    .map(([id, qty]) => {
      const item = catalog[id];
      if (!item) return "";
      const line = item.price * qty;
      total += line;
      return `
        <div class="cart-drawer-line">
          <button
            class="cart-drawer-remove"
            type="button"
            data-remove="${id}"
            aria-label="Remove ${item.name} from cart"
          >
            <img src="./assets/icons/delete.svg" alt="" width="18" height="18" />
          </button>
          <div class="cart-drawer-line-main">
            <span class="cart-drawer-line-title">${item.name} × ${qty}</span>
            <span>$${line.toFixed(2)}</span>
          </div>
        </div>
      `;
    })
    .join("");

  return `
    ${rows}
    <p class="cart-drawer-total"><span>Total</span><span>$${total.toFixed(2)}</span></p>
    <div style="height: 2em;"></div>
    <a class="btn btn-primary" href="${menuHref()}" style="margin-bottom: 0.5em;">Continue ordering</a>
  `;
}

function bindCartActions(root) {
  if (!root) return;
  root.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setCartOpen(false));
  });
  root.querySelectorAll("[data-remove]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      removeItem(btn.getAttribute("data-remove"));
    });
  });
}

function renderCartDrawer() {
  const body = document.querySelector("[data-cart-drawer-body]");
  if (!body) return;
  body.innerHTML = cartMarkup();
  bindCartActions(body);
  syncCartEditUi();
}

function renderCartPage() {
  const panel = document.querySelector("[data-cart-page]");
  if (!panel) return;
  panel.innerHTML = cartMarkup();
  bindCartActions(panel);
  syncCartEditUi();
}

document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => addItem(btn.getAttribute("data-add")));
});

const menuToggle = document.querySelector(".menu-toggle");
const mobileNav = document.querySelector("#mobile-nav");
const cartDrawer = document.querySelector("#cart-drawer");
const cartToggles = document.querySelectorAll("[data-cart-toggle]");

function setMobileNavOpen(open) {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute("aria-expanded", String(open));
  menuToggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  mobileNav.hidden = !open;
  if (open) closeCartOnly();
}

function closeCartOnly() {
  if (!cartDrawer || cartDrawer.hidden) return;
  cartDrawer.hidden = true;
  cartToggles.forEach((btn) => btn.setAttribute("aria-expanded", "false"));
  setCartEditMode(false);
}

function closeMenuOnly() {
  if (!menuToggle || !mobileNav) return;
  menuToggle.setAttribute("aria-expanded", "false");
  menuToggle.setAttribute("aria-label", "Open menu");
  mobileNav.hidden = true;
}

function setCartOpen(open) {
  if (!cartDrawer) return;
  cartDrawer.hidden = !open;
  cartToggles.forEach((btn) => {
    btn.setAttribute("aria-expanded", String(open));
  });
  if (open) {
    closeMenuOnly();
    renderCartDrawer();
  } else {
    setCartEditMode(false);
  }
}

function isCartOpen() {
  return cartDrawer && !cartDrawer.hidden;
}

function isMenuOpen() {
  return menuToggle?.getAttribute("aria-expanded") === "true";
}

if (menuToggle && mobileNav) {
  menuToggle.addEventListener("click", (e) => {
    e.stopPropagation();
    setMobileNavOpen(!isMenuOpen());
  });
  mobileNav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => setMobileNavOpen(false));
  });
  mobileNav.querySelectorAll("[data-open-cart]").forEach((btn) => {
    btn.addEventListener("click", (e) => {
      e.stopPropagation();
      setMobileNavOpen(false);
      setCartOpen(true);
    });
  });
}

cartToggles.forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setCartOpen(!isCartOpen());
  });
});

document.addEventListener("click", (e) => {
  const inMenu = mobileNav?.contains(e.target) || menuToggle?.contains(e.target);
  const inCart =
    cartDrawer?.contains(e.target) ||
    [...cartToggles].some((btn) => btn.contains(e.target));

  if (isMenuOpen() && !inMenu) setMobileNavOpen(false);
  if (isCartOpen() && !inCart) setCartOpen(false);
});

document.addEventListener("keydown", (e) => {
  if (e.key !== "Escape") return;
  setMobileNavOpen(false);
  setCartOpen(false);
});

window.addEventListener("resize", () => {
  if (window.matchMedia("(min-width: 768px)").matches) {
    setMobileNavOpen(false);
  }
});

updateCount();
renderCartDrawer();
renderCartPage();

document.querySelectorAll("[data-cart-edit]").forEach((btn) => {
  btn.addEventListener("click", (e) => {
    e.stopPropagation();
    setCartEditMode(!cartEditMode);
  });
});

syncCartEditUi();
