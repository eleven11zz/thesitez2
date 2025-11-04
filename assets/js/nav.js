document.addEventListener("DOMContentLoaded", () => {
  const headers = document.querySelectorAll("header");
  let autoId = 0;

  headers.forEach((header) => {
    const nav = header.querySelector(".main-nav");
    if (!nav) return;

    if (!nav.id) {
      autoId += 1;
      nav.id = `main-nav-${autoId}`;
    }

    let toggle = header.querySelector(".nav-toggle");
    const headerInner = nav.parentElement;

    if (!toggle) {
      toggle = document.createElement("button");
      toggle.type = "button";
      toggle.className = "nav-toggle";
      toggle.setAttribute("aria-expanded", "false");
      toggle.setAttribute("aria-controls", nav.id);
      toggle.innerHTML = `
        <span class="sr-only">Toggle navigation</span>
        <span></span>
        <span></span>
        <span></span>
      `;

      if (headerInner) {
        headerInner.insertBefore(toggle, nav);
      } else {
        header.appendChild(toggle);
      }
    } else if (!toggle.hasAttribute("aria-controls")) {
      toggle.setAttribute("aria-controls", nav.id);
    }

    if (toggle.dataset.navBound === "true") return;
    toggle.dataset.navBound = "true";

    const closeNav = () => {
      nav.classList.remove("open");
      toggle.classList.remove("is-active");
      toggle.setAttribute("aria-expanded", "false");
      document.body.classList.remove("nav-open");
    };

    const openNav = () => {
      nav.classList.add("open");
      toggle.classList.add("is-active");
      toggle.setAttribute("aria-expanded", "true");
      document.body.classList.add("nav-open");
    };

    const toggleNav = () => {
      if (nav.classList.contains("open")) {
        closeNav();
      } else {
        openNav();
      }
    };

    toggle.addEventListener("click", toggleNav);

    nav.querySelectorAll("a, button").forEach((link) => {
      link.addEventListener("click", () => {
        if (nav.classList.contains("open")) {
          closeNav();
        }
      });
    });

    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && nav.classList.contains("open")) {
        closeNav();
      }
    });

    const mq = window.matchMedia("(min-width: 901px)");
    const handleMqChange = (event) => {
      if (event.matches) {
        closeNav();
      }
    };

    if (typeof mq.addEventListener === "function") {
      mq.addEventListener("change", handleMqChange);
    } else if (typeof mq.addListener === "function") {
      mq.addListener(handleMqChange);
    }
  });
});
