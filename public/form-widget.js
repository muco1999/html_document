export function initFormWidget({ mount, botToken, chatId }) {
  const root = typeof mount === "string" ? document.querySelector(mount) : mount;
  if (!root) throw new Error("Mount element not found");

  root.innerHTML = `
    <form id="candidate-form" novalidate>
      <div class="grid">
        <div class="field">
          <label>Ном</label>
          <input id="firstName" name="firstName" placeholder="Номи худро нависед"
                 autocomplete="given-name" required pattern="^[A-Za-zА-Яа-яЁё\\-\\s]{2,}$" />
        </div>
        <div class="field">
          <label>Насаб</label>
          <input id="lastName" name="lastName" placeholder="Насаби худро нависед"
                 autocomplete="family-name" required pattern="^[A-Za-zА-Яа-яЁё\\-\\s]{2,}$" />
        </div>
        <div class="field">
          <label>Рақами телефон</label>
          <input id="phone" name="phone" placeholder="+992 900 00 00 00"
                 inputmode="tel" autocomplete="tel" required
                 pattern="^[+0-9\\s()-]{5,}$" />
        </div>
        <div class="field">
          <label>Шумо чӣ қадар мехоҳед бо мо ҳамкорӣ кунед?</label>
          <select id="interest" name="interest" required>
            <option value="" disabled selected>Интихоб кунед (дар фоиз)</option>
            <option value="10%">10% — Каме ҳавасманд 😴</option>
            <option value="20%">20% — Ман фикр дорам дар бораи ҳамкорӣ</option>
            <option value="30%">30% — Ман манфиатдор ҳастам</option>
            <option value="40%">40% — Ман мехоҳам кӯшиш кунам</option>
            <option value="50%">50% — Дилгармии миёна 😌</option>
            <option value="60%">60% — Ман мехоҳам бештар иштирок кунам</option>
            <option value="70%">70% — Ман хеле завқ дорам 💪</option>
            <option value="80%">80% — Ман қариб пурра тайёрам</option>
            <option value="90%">90% — Ман воқеан ҳавасманд ҳастам 🔥</option>
            <option value="100%">100% — Ман пурра омодаам барои ҳамкорӣ 🚀</option>
          </select>
        </div>
      </div>
      <div class="actions">
        <button class="primary" type="submit">Фиристодани дархост</button>
        <span class="note">Бо пахш кардани тугма, шумо ба фиристодани маълумот ба Telegram розигӣ медиҳед.</span>
      </div>
      <div class="status" id="status"></div>
    </form>
  `;

  const form = root.querySelector("#candidate-form");
  const status = root.querySelector("#status");
  const phone = root.querySelector("#phone");

  // ✅ Исправленный обработчик телефона
  phone.addEventListener("input", () => {
    let val = phone.value.replace(/[^0-9+]/g, "");
    if (!val.startsWith("+")) val = "+" + val; // добавляем +, если пользователь не ввёл
    // Автоформат: +992 900 00 00 00
    val = val
      .replace(/^\\+(\\d{3})(\\d{3})(\\d{2})(\\d{2})(\\d{0,2}).*/, "+$1 $2 $3 $4 $5")
      .trim();
    phone.value = val;
  });

  form.addEventListener("submit", async (e) => {
    e.preventDefault();
    status.textContent = "";
    status.className = "status";

    if (!botToken || !chatId) {
      status.textContent = "❗️Токен ё chat_id муайян нашудааст.";
      status.classList.add("err");
      return;
    }

    if (!form.reportValidity()) {
      status.textContent = "Лутфан саҳеҳии маълумотро санҷед.";
      status.classList.add("err");
      return;
    }

    const data = Object.fromEntries(new FormData(form).entries());

    const message = [
      `<b>📝 Дархости нав ворид шуд</b>`,
      `👤 <b>Ном:</b> ${escapeHtml(data.firstName)} ${escapeHtml(data.lastName)}`,
      `📞 <b>Рақам:</b> ${escapeHtml(data.phone)}`,
      `🔥 <b>Дараҷаи ҳавасмандӣ:</b> ${escapeHtml(data.interest)}`
    ].join("\n");

    const endpoint = `https://api.telegram.org/bot${botToken}/sendMessage`;
    const payload = {
      chat_id: chatId,
      text: message,
      parse_mode: "HTML",
      disable_web_page_preview: true
    };

    try {
      setLoading(form, true);
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok || json.ok === false) throw new Error(json.description || "Хатогии фиристодан");

      status.textContent = "✅ Дархост фиристода шуд! Мо бо шумо дар тамос мешавем.";
      status.classList.add("ok");
      form.reset();
    } catch (err) {
      status.textContent = "❌ Фиристодан муваффақ нашуд. Интернет ё маълумоти ботро санҷед.";
      status.classList.add("err");
      console.error(err);
    } finally {
      setLoading(form, false);
    }
  });
}

function setLoading(form, on) {
  const btn = form.querySelector('button[type="submit"]');
  if (!btn) return;
  btn.disabled = !!on;
  btn.style.filter = on ? "grayscale(30%) brightness(.9)" : "";
  btn.textContent = on ? "Фиристода мешавад…" : "Фиристодани дархост";
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
}
