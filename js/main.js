const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");
const year = document.getElementById("year");
const themeToggle = document.getElementById("theme-toggle");
const divisionNav = document.querySelector(".division-nav");
const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
const reelControls = document.querySelector(".reel-controls");
const reelMenuToggle = document.getElementById("reel-menu-toggle");
const reelProjectMenu = document.getElementById("reel-project-menu");
const reelCurrent = document.getElementById("reel-current");
const reelPlayer = document.getElementById("reel-player");
const reelFallback = document.getElementById("reel-fallback");

if (year) {
  year.textContent = new Date().getFullYear();
}

if (themeToggle) {
  const syncThemeToggle = () => {
    const lightMode = document.documentElement.dataset.theme === "light";
    const label = lightMode ? "Switch to dark mode" : "Switch to light mode";
    themeToggle.setAttribute("aria-label", label);
    themeToggle.setAttribute("title", label);
    themeToggle.setAttribute("aria-pressed", String(lightMode));
  };

  syncThemeToggle();

  themeToggle.addEventListener("click", () => {
    const lightMode = document.documentElement.dataset.theme !== "light";
    document.documentElement.dataset.theme = lightMode ? "light" : "dark";
    syncThemeToggle();

    try {
      localStorage.setItem("portfolio-theme", lightMode ? "light" : "dark");
    } catch {}
  });
}

if (divisionNav) {
  const sectionRadios = [...divisionNav.querySelectorAll(".choice-circle")];
  const sections = sectionRadios
    .map((radio) => document.getElementById(radio.value))
    .filter(Boolean);
  const trackMarker = divisionNav.querySelector(".track-marker");
  let collapseTimer = 0;
  let pointerInsideRail = false;
  let clickScrollLocked = false;
  let clickScrollTimer = 0;
  let scrollEndTimer = 0;

  const setActiveSection = (sectionId) => {
    sectionRadios.forEach((radio) => {
      const active = radio.value === sectionId;
      radio.checked = active;
      radio.closest(".choice")?.setAttribute("aria-current", active ? "true" : "false");
    });
  };

  const updateTrackMarker = () => {
    if (!trackMarker) {
      return;
    }

    const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
    const progress = scrollRange > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollRange)) : 0;
    trackMarker.style.top = `${progress * 100}%`;
  };

  const finishClickScroll = () => {
    window.clearTimeout(clickScrollTimer);
    window.clearTimeout(scrollEndTimer);
    if (!clickScrollLocked) {
      return;
    }
    clickScrollLocked = false;
    updateTrackMarker();
  };

  const scheduleClickScrollEnd = () => {
    window.clearTimeout(scrollEndTimer);
    scrollEndTimer = window.setTimeout(finishClickScroll, 180);
  };

  const collapseRail = () => {
    if (!pointerInsideRail) {
      divisionNav.setAttribute("aria-expanded", "false");
    }
  };

  const revealRail = () => {
    divisionNav.setAttribute("aria-expanded", "true");
    window.clearTimeout(collapseTimer);
    collapseTimer = window.setTimeout(collapseRail, 2500);
  };

  const scheduleRailCollapse = () => {
    window.clearTimeout(collapseTimer);
    collapseTimer = window.setTimeout(collapseRail, 2500);
  };

  window.addEventListener("scroll", revealRail, { passive: true });
  divisionNav.addEventListener("pointerenter", () => {
    pointerInsideRail = true;
    revealRail();
  });
  divisionNav.addEventListener("pointerleave", () => {
    pointerInsideRail = false;
    scheduleRailCollapse();
  });
  divisionNav.addEventListener("focusin", revealRail);
  divisionNav.addEventListener("focusout", (event) => {
    if (!divisionNav.contains(event.relatedTarget)) {
      scheduleRailCollapse();
    }
  });

  sectionRadios.forEach((radio) => {
    radio.addEventListener("click", () => {
      if (radio.value === "intro" && !document.getElementById("intro")) {
        window.location.href = "index.html";
      }
    });

    radio.addEventListener("change", () => {
      if (!radio.checked) {
        return;
      }

      const target = document.getElementById(radio.value);
      if (!target) {
        if (radio.value === "intro") {
          window.location.href = "index.html";
        }
        return;
      }

      clickScrollLocked = true;
      setActiveSection(radio.value);
      window.clearTimeout(clickScrollTimer);
      clickScrollTimer = window.setTimeout(finishClickScroll, 1200);
      target.scrollIntoView({
        behavior: prefersReducedMotion.matches ? "auto" : "smooth",
        block: "start",
      });

      if (prefersReducedMotion.matches) {
        finishClickScroll();
      }
    });
  });

  window.addEventListener("scroll", () => {
    updateTrackMarker();
    if (clickScrollLocked) {
      scheduleClickScrollEnd();
    }
  }, { passive: true });

  if ("onscrollend" in window) {
    window.addEventListener("scrollend", finishClickScroll, { passive: true });
  }

  updateTrackMarker();

  if ("IntersectionObserver" in window) {
    const sectionObserver = new IntersectionObserver((entries) => {
      if (clickScrollLocked) {
        return;
      }

      const activeEntry = entries
        .filter((entry) => entry.isIntersecting)
        .sort((first, second) => second.intersectionRatio - first.intersectionRatio)[0];

      if (!activeEntry) {
        return;
      }

      setActiveSection(activeEntry.target.id);
    }, {
      rootMargin: "-20% 0px -55% 0px",
      threshold: [0, 0.1, 0.25, 0.5, 0.75],
    });

    sections.forEach((section) => sectionObserver.observe(section));
  }
}

if (reelControls && reelMenuToggle && reelProjectMenu) {
  const setReelMenuOpen = (open) => {
    reelMenuToggle.checked = open;
    reelMenuToggle.setAttribute("aria-expanded", String(open));
    reelProjectMenu.setAttribute("aria-hidden", String(!open));
    reelProjectMenu.inert = !open;
    reelProjectMenu.dataset.open = String(open);
  };

  const closeReelMenu = () => {
    setReelMenuOpen(false);
  };

  reelProjectMenu.querySelectorAll(".reel-project-option").forEach((option, index) => {
    option.style.setProperty("--option-index", index);
  });

  reelMenuToggle.addEventListener("change", () => {
    setReelMenuOpen(reelMenuToggle.checked);
  });

  reelProjectMenu.querySelectorAll(".reel-project-option").forEach((option) => {
    option.addEventListener("click", () => {
      const fileId = option.dataset.fileId;
      const projectName = option.textContent.trim();
      const previewUrl = `https://drive.google.com/file/d/${fileId}/preview`;

      if (reelPlayer) {
        reelPlayer.src = previewUrl;
        reelPlayer.title = `${projectName} preview`;
      }
      if (reelCurrent) {
        reelCurrent.textContent = projectName;
      }
      if (reelFallback) {
        reelFallback.href = `https://drive.google.com/file/d/${fileId}/view`;
        reelFallback.textContent = `Open ${projectName} in Google Drive`;
      }

      reelProjectMenu.querySelectorAll(".reel-project-option").forEach((item) => {
        item.setAttribute("aria-pressed", String(item === option));
      });

      closeReelMenu();
      reelMenuToggle.focus();
    });
  });

  document.addEventListener("click", (event) => {
    if (!reelControls.contains(event.target)) {
      closeReelMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && reelMenuToggle.checked) {
      closeReelMenu();
      reelMenuToggle.focus();
    }
  });
}

const copyStatus = document.getElementById("copy-status");
const contactForm = document.getElementById("contact-form");

document.querySelectorAll(".copy-btn").forEach((button) => {
  button.addEventListener("click", async () => {
    const value = button.dataset.copy || "";

    try {
      await navigator.clipboard.writeText(value);
    } catch {
      const helper = document.createElement("textarea");
      helper.value = value;
      helper.setAttribute("readonly", "");
      helper.style.position = "absolute";
      helper.style.left = "-9999px";
      document.body.appendChild(helper);
      helper.select();
      document.execCommand("copy");
      helper.remove();
    }

    document.querySelectorAll(".copy-btn").forEach((item) => {
      item.dataset.copied = "false";
      item.textContent = "Copy";
    });
    button.dataset.copied = "true";
    button.textContent = "Copied";
    if (copyStatus) {
      copyStatus.textContent = `${button.getAttribute("aria-label")?.replace("Copy ", "") || "Contact detail"} copied.`;
    }

    window.setTimeout(() => {
      if (button.dataset.copied === "true") {
        button.dataset.copied = "false";
        button.textContent = "Copy";
      }
    }, 2200);
  });
});

if (contactForm) {
  const nameField = document.getElementById("contact-name");
  const emailField = document.getElementById("contact-email");
  const typeField = document.getElementById("contact-type");
  const messageField = document.getElementById("contact-message");
  const submitButton = document.getElementById("contact-submit");
  const formStatus = document.getElementById("form-status");
  const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  const setFieldError = (field, message) => {
    const holder = field.closest(".field");
    const error = holder?.querySelector(".field-error");
    const invalid = Boolean(message);
    field.setAttribute("aria-invalid", String(invalid));
    if (holder) {
      holder.dataset.invalid = String(invalid);
    }
    if (error) {
      error.hidden = !invalid;
      error.textContent = message;
    }
  };

  const validateForm = () => {
    let firstInvalid = null;
    const name = nameField.value.trim();
    const email = emailField.value.trim();
    const message = messageField.value.trim();

    setFieldError(nameField, name ? "" : "Enter your name.");
    setFieldError(emailField, emailPattern.test(email) ? "" : "Enter a valid email address.");
    setFieldError(messageField, message.length >= 10 ? "" : "Add a short project note (at least 10 characters).");

    if (!name) {
      firstInvalid = nameField;
    } else if (!emailPattern.test(email)) {
      firstInvalid = emailField;
    } else if (message.length < 10) {
      firstInvalid = messageField;
    }

    return firstInvalid;
  };

  ["input", "blur"].forEach((eventName) => {
    [nameField, emailField, messageField].forEach((field) => {
      field.addEventListener(eventName, () => {
        if (contactForm.dataset.submitted === "true") {
          validateForm();
        }
      });
    });
  });

  contactForm.addEventListener("submit", async (event) => {
    event.preventDefault();
    contactForm.dataset.submitted = "true";
    const firstInvalid = validateForm();

    if (firstInvalid) {
      formStatus.dataset.state = "error";
      formStatus.textContent = "Check the highlighted fields, then try again.";
      firstInvalid.focus();
      return;
    }

    const honey = contactForm.querySelector(".contact-form-honeypot");
    if (honey && honey.value.trim()) {
      return;
    }

    const endpoint = contactForm.getAttribute("action") || "";
    if (!endpoint) {
      formStatus.dataset.state = "error";
      formStatus.textContent = "No submission endpoint is configured.";
      return;
    }

    submitButton.disabled = true;
    submitButton.textContent = "Sending…";
    formStatus.dataset.state = "sending";
    formStatus.textContent = "Sending your inquiry…";

    const data = new FormData(contactForm);
    const payload = Object.fromEntries(data.entries());

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (response.ok) {
        formStatus.dataset.state = "success";
        formStatus.textContent = "Thanks — your inquiry was sent. I’ll reply within 1–2 business days.";
        contactForm.reset();
      } else {
        const text = await response.text();
        formStatus.dataset.state = "error";
        formStatus.textContent = text || "Something went wrong. Please email the address above directly.";
      }
    } catch (networkError) {
      formStatus.dataset.state = "error";
      formStatus.textContent = "Network error — please email the address above directly.";
    } finally {
      window.setTimeout(() => {
        submitButton.disabled = false;
        submitButton.textContent = "Send inquiry";
      }, 4000);
    }
  });
}

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = nav.classList.toggle("open");
    toggle.setAttribute("aria-expanded", String(open));
    toggle.setAttribute("aria-label", open ? "Close menu" : "Open menu");
  });

  nav.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
      nav.classList.remove("open");
      toggle.setAttribute("aria-expanded", "false");
    });
  });
}

/* ---------- Scroll reveal ---------- */
const revealEls = document.querySelectorAll(".reveal");
let revealObserver = null;

const revealSection = (el) => {
  el.classList.add("is-visible");
};

if (!prefersReducedMotion.matches && "IntersectionObserver" in window) {
  revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        revealSection(entry.target);
        revealObserver.unobserve(entry.target);
      }
    });
  }, {
    rootMargin: "0px 0px -10% 0px",
    threshold: 0.12
  });

  revealEls.forEach((el) => revealObserver.observe(el));
} else {
  revealEls.forEach(revealSection);
}

window.addEventListener("scroll", () => {
  if (prefersReducedMotion.matches || !revealObserver) {
    return;
  }
  revealEls.forEach((el) => {
    if (el.classList.contains("is-visible")) {
      return;
    }
    const rect = el.getBoundingClientRect();
    if (rect.top < window.innerHeight - 80 && rect.bottom > 0) {
      revealSection(el);
      revealObserver.unobserve(el);
    }
  });
}, { passive: true });

/* ---------- Client logo carousel ---------- */
const clientCarousel = document.querySelector("[data-client-carousel]");
const clientTrack = document.querySelector("[data-client-track]");
const clientPanel = document.querySelector("[data-client-panel]");

if (clientCarousel && clientTrack) {
  const cards = [...clientTrack.querySelectorAll(".client-logo-card")];

  const DATA = {
    who: {
      name: "World Health Organization",
      date: "Video Editing · September 2025",
      desc: "Produced introductory videos for each module of WHO's learning materials, enhancing user engagement and comprehension."
    },
    nyc: {
      name: "National Youth Commission",
      date: "Video Editing · January–August 2026",
      desc: "Created introductory videos for educational modules, simplifying technical content for youth audiences."
    },
    pcic: {
      name: "Philippine Crop Insurance Corporation",
      date: "Video Editing · April 2026",
      desc: "Developed an instructional video that guided users on utilizing the mobile application, improving user proficiency."
    },
    deped: {
      name: "Department of Education",
      date: "Video Editing · September 2025",
      desc: "Produced instructional videos aimed at enhancing understanding of system operations within educational institutions."
    },
    qs: {
      name: "Quanby Solutions, Inc.",
      date: "Video Editing · June 2025–Present",
      desc: "Created promotional and instructional videos for 22 systems and platforms, driving clarity and engagement in communication."
    }
  };

  const getData = (card) => {
    return DATA[card.dataset.client] || DATA.qs;
  };

  const showPanel = (card) => {
    if (!clientPanel) {
      return;
    }
    const data = getData(card);
    clientPanel.innerHTML = `
      <h3>${data.name}</h3>
      <p class="panel-date">${data.date}</p>
      <p class="panel-desc">${data.desc}</p>
    `;

    const containerRect = clientCarousel.getBoundingClientRect();
    const cardRect = card.getBoundingClientRect();
    const panelW = 320;
    const panelH = clientPanel.offsetHeight || 150;
    const top = cardRect.top - containerRect.top - panelH - 18;
    let left = cardRect.left - containerRect.left + cardRect.width / 2 - panelW / 2;
    const maxLeft = containerRect.width - panelW - 8;
    if (left < 8) left = 8;
    if (left > maxLeft) left = maxLeft;

    clientPanel.style.left = `${left}px`;
    clientPanel.style.top = `${top}px`;
    clientPanel.classList.add("is-open");
  };

  const hidePanel = () => {
    if (clientPanel) {
      clientPanel.classList.remove("is-open");
    }
  };

  let activeCard = null;

  const onActivate = (card) => {
    if (activeCard === card) {
      return;
    }
    if (activeCard) {
      activeCard.classList.remove("is-active");
    }
    activeCard = card;
    card.classList.add("is-active");
    showPanel(card);
  };

  const onDeactivate = () => {
    if (activeCard) {
      activeCard.classList.remove("is-active");
      activeCard = null;
    }
    hidePanel();
  };

  cards.forEach((card) => {
    card.addEventListener("mouseenter", () => onActivate(card));
    card.addEventListener("focusin", () => onActivate(card));
    card.addEventListener("mouseleave", () => {
      if (activeCard === card) {
        onDeactivate();
      }
    });
    card.addEventListener("focusout", () => {
      if (activeCard === card) {
        onDeactivate();
      }
    });
    card.addEventListener("click", () => {
      if (activeCard === card) {
        onDeactivate();
      } else {
        onActivate(card);
      }
    });
  });

  document.addEventListener("click", (event) => {
    if (!clientCarousel.contains(event.target) && activeCard) {
      onDeactivate();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && activeCard) {
      onDeactivate();
      activeCard.blur();
    }
  });
}
