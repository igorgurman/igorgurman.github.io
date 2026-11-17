(function () {
  "use strict";

  var sessionToken = null;
  var AUTH_URL =
    "https://backend.appstudio-u7cm9zhmha0ruwv8.piappengine.com/pi/auth/v1/login";

  function $(id) {
    return document.getElementById(id);
  }

  function setStatus(text, kind) {
    var el = $("pi-status");
    if (!el) return;
    el.textContent = text || "";
    el.className = "status" + (kind ? " " + kind : "");
  }

  function onIncompletePaymentFound() {
    // This site does not process Pi payments.
  }

  async function initPi() {
    var btn = $("pi-login");
    var note = $("pi-note");
    if (!window.Pi) {
      if (note) {
        note.hidden = false;
        note.classList.add("warn");
        note.textContent =
          "Войти через Pi можно в браузере Pi Browser. Сейчас страница открыта в обычном браузере.";
      }
      if (btn) btn.disabled = true;
      return;
    }
    try {
      await window.Pi.init({ version: "2.0" });
      if (btn) btn.disabled = false;
    } catch (err) {
      if (note) {
        note.hidden = false;
        note.classList.add("warn");
        note.textContent =
          "Не удалось подключить Pi. Откройте эту страницу в Pi Browser и попробуйте снова.";
      }
      if (btn) btn.disabled = true;
    }
  }

  async function loginWithPi() {
    var btn = $("pi-login");
    if (!window.Pi) {
      setStatus(
        "Войти через Pi можно только в браузере Pi Browser.",
        "err"
      );
      return;
    }
    if (btn) btn.disabled = true;
    setStatus("Входим…", "");
    try {
      var auth = await window.Pi.authenticate(
        ["username"],
        onIncompletePaymentFound
      );
      var accessToken = auth && auth.accessToken;
      if (!accessToken) {
        throw new Error("no-token");
      }
      var res = await fetch(AUTH_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ accessToken: accessToken }),
      });
      if (!res.ok) {
        throw new Error("auth-http");
      }
      var data = await res.json();
      sessionToken = data && data.sessionToken ? data.sessionToken : null;
      var username =
        data && data.user && data.user.username ? data.user.username : "";
      if (username) {
        setStatus("Здравствуйте, " + username + "!", "ok");
      } else {
        setStatus("Вход выполнен.", "ok");
      }
    } catch (err) {
      setStatus("Не получилось войти через Pi. Попробуйте ещё раз.", "err");
    } finally {
      if (btn && window.Pi) btn.disabled = false;
    }
  }

  document.addEventListener("DOMContentLoaded", function () {
    var btn = $("pi-login");
    if (btn) {
      btn.disabled = true;
      btn.addEventListener("click", loginWithPi);
    }
    initPi();
  });
})();
