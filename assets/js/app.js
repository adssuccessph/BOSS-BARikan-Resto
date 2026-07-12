(() => {
  "use strict";

  const config = window.BARIKAN_CONFIG || {};
  const form = document.getElementById("bookingForm");
  const status = document.getElementById("formStatus");
  const submitBtn = document.getElementById("submitBtn");
  const dialog = document.getElementById("successDialog");
  const bookingRef = document.getElementById("bookingRef");
  const demoBanner = document.getElementById("demoBanner");
  const dateInput = form?.querySelector('input[name="eventDate"]');

  document.getElementById("year").textContent = new Date().getFullYear();

  const isConfigured = Boolean(
    config.googleScriptUrl &&
    config.googleScriptUrl.startsWith("https://script.google.com/") &&
    !config.googleScriptUrl.includes("PASTE_YOUR")
  );

  if (config.demoMode || !isConfigured) demoBanner.hidden = false;

  if (dateInput) {
    const today = new Date();
    const localToday = new Date(today.getTime() - today.getTimezoneOffset() * 60000)
      .toISOString()
      .slice(0, 10);
    dateInput.min = localToday;
  }

  const observer = new IntersectionObserver((entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });

  document.querySelectorAll(".reveal").forEach((el) => observer.observe(el));

  document.querySelectorAll(".service-select").forEach((button) => {
    button.addEventListener("click", () => {
      const service = button.dataset.service;
      const checkbox = [...form.querySelectorAll('input[name="services"]')]
        .find((item) => item.value === service);
      if (checkbox) checkbox.checked = true;
      document.getElementById("booking").scrollIntoView({ behavior: "smooth" });
    });
  });

  document.querySelector(".dialog-close")?.addEventListener("click", () => dialog.close());

  function makeBookingId() {
    const now = new Date();
    const y = now.getFullYear();
    const m = String(now.getMonth() + 1).padStart(2, "0");
    const d = String(now.getDate()).padStart(2, "0");
    const code = Math.random().toString(36).slice(2, 6).toUpperCase();
    return `BRK-${y}${m}${d}-${code}`;
  }

  function getUtmData() {
    const params = new URLSearchParams(window.location.search);
    return {
      utmSource: params.get("utm_source") || "",
      utmMedium: params.get("utm_medium") || "",
      utmCampaign: params.get("utm_campaign") || "",
      utmContent: params.get("utm_content") || ""
    };
  }

  function validateForm() {
    let valid = true;
    status.textContent = "";
    status.classList.remove("error");

    form.querySelectorAll("[required]").forEach((field) => {
      if (field.type === "checkbox") return;
      const ok = field.checkValidity();
      field.setAttribute("aria-invalid", ok ? "false" : "true");
      if (!ok) valid = false;
    });

    const selectedServices = form.querySelectorAll('input[name="services"]:checked');
    if (!selectedServices.length) valid = false;

    const consent = form.querySelector('input[name="consent"]');
    if (!consent.checked) valid = false;

    if (!valid) {
      status.textContent = "Please complete the required fields and select at least one service.";
      status.classList.add("error");
    }

    return valid;
  }

  function buildPayload() {
    const data = new FormData(form);
    return {
      bookingId: data.get("bookingId"),
      submittedAtClient: new Date().toISOString(),
      fullName: String(data.get("fullName") || "").trim(),
      mobile: String(data.get("mobile") || "").trim(),
      email: String(data.get("email") || "").trim(),
      eventType: String(data.get("eventType") || "").trim(),
      eventDate: String(data.get("eventDate") || "").trim(),
      eventTime: String(data.get("eventTime") || "").trim(),
      guestCount: String(data.get("guestCount") || "").trim(),
      services: data.getAll("services").join(", "),
      notes: String(data.get("notes") || "").trim(),
      consent: data.get("consent") === "on" ? "Yes" : "No",
      source: String(data.get("source") || "BARikan Event Booking Landing Page"),
      pageUrl: window.location.href,
      userAgent: navigator.userAgent,
      ...getUtmData()
    };
  }

  function saveDemoCopy(payload) {
    const key = "barikan_demo_bookings";
    const current = JSON.parse(localStorage.getItem(key) || "[]");
    current.push(payload);
    localStorage.setItem(key, JSON.stringify(current.slice(-25)));
  }

  async function submitToGoogleScript(payload) {
    await fetch(config.googleScriptUrl, {
      method: "POST",
      mode: "no-cors",
      redirect: "follow",
      headers: { "Content-Type": "text/plain;charset=utf-8" },
      body: JSON.stringify(payload)
    });
  }

  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    if (!validateForm()) return;

    const id = makeBookingId();
    form.querySelector('input[name="bookingId"]').value = id;
    const payload = buildPayload();

    submitBtn.disabled = true;
    submitBtn.querySelector("span").textContent = "Sending inquiry...";
    status.textContent = "Please wait while we submit your event details.";
    status.classList.remove("error");

    try {
      if (config.demoMode || !isConfigured) {
        saveDemoCopy(payload);
        await new Promise((resolve) => setTimeout(resolve, 650));
      } else {
        await submitToGoogleScript(payload);
      }

      bookingRef.textContent = id;
      form.reset();
      if (dateInput) dateInput.min = dateInput.min;
      status.textContent = config.demoMode || !isConfigured
        ? "Demo mode: inquiry saved in this browser only. Connect Google Apps Script before launch."
        : "Inquiry sent. Please save your reference number.";
      dialog.showModal();
    } catch (error) {
      console.error(error);
      status.textContent = "We could not send the inquiry. Please call 0917 588 2281 or try again.";
      status.classList.add("error");
    } finally {
      submitBtn.disabled = false;
      submitBtn.querySelector("span").textContent = "Send Event Inquiry";
    }
  });
})();