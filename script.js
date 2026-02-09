document.addEventListener("DOMContentLoaded", function () {
  const startDate = new Date(2026, 0, 26);
  const themeCheckbox = document.getElementById("checkbox");
  const findMeBtn = document.getElementById("findMeBtn");
  const savedTheme = localStorage.getItem("theme");

  if (savedTheme === "dark") {
    document.documentElement.setAttribute("data-theme", "dark");
    themeCheckbox.checked = true;
  }

  themeCheckbox.addEventListener("change", function () {
    if (this.checked) {
      document.documentElement.setAttribute("data-theme", "dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.removeAttribute("data-theme");
      localStorage.setItem("theme", "light");
    }
  });

  if (window.scheduleData) {
    renderSchedule(window.scheduleData);
    initTabs();
    updateSchedule(true);
    updateTimeTracker();
    setInterval(updateTimeTracker, 1000);
    setInterval(() => updateSchedule(false), 60000);
  } else {
    console.error("Помилка: window.scheduleData не знайдено");
    const status = document.getElementById("weekStatus");
    if (status) status.innerText = "Помилка даних";
  }

  function updateTimeTracker() {
    const trackerContainer = document.getElementById("timeTracker");
    const trackerText = document.getElementById("tracker-text");
    const progressWrapper = document.getElementById("progress-wrapper");
    const progressFill = document.getElementById("progress-fill");

    const now = new Date();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const weekType = getCurrentWeekType();
    const dayName = getDayName(now.getDay());

    if (
      !window.scheduleData[weekType] ||
      !window.scheduleData[weekType][dayName]
    ) {
      trackerContainer.style.display = "none";
      return;
    }
    trackerContainer.style.display = "block";

    const todaysLessons = window.scheduleData[weekType][dayName];
    let activeLesson = null;
    let nextLesson = null;
    let prevLessonEnd = 0;

    for (let i = 0; i < todaysLessons.length; i++) {
      const lesson = todaysLessons[i];
      const { start, end, startStr } = parseTimeRange(lesson.time);

      if (currentMinutes >= start && currentMinutes < end) {
        activeLesson = { ...lesson, start, end };
        break;
      }

      if (currentMinutes < start) {
        nextLesson = { ...lesson, start, end, startStr };
        break;
      }
      prevLessonEnd = end;
    }

    if (activeLesson) {
      const totalDuration = activeLesson.end - activeLesson.start;
      const elapsed = currentMinutes - activeLesson.start;
      const percent = (elapsed / totalDuration) * 100;
      const remaining = activeLesson.end - currentMinutes;

      progressWrapper.style.display = "block";
      progressFill.classList.remove("break-mode");
      progressFill.style.width = `${percent}%`;

      trackerText.innerHTML = `
        <div style="font-size: 0.9em; opacity: 0.8;">Зараз урок:</div>
        <div style="font-weight: 700; font-size: 1.1em;">${activeLesson.subject}</div>
        <div style="font-size: 0.85em; margin-top: 4px;">До кінця: ${formatMinutes(remaining)}</div>
      `;
    } else if (nextLesson) {
      const breakStart = prevLessonEnd;
      const breakEnd = nextLesson.start;
      const totalBreakDuration = breakEnd - breakStart;
      const elapsedBreak = currentMinutes - breakStart;
      const percent =
        totalBreakDuration > 0 ? (elapsedBreak / totalBreakDuration) * 100 : 0;
      const remainingBreak = breakEnd - currentMinutes;

      progressWrapper.style.display = "block";
      progressFill.classList.add("break-mode");
      progressFill.style.width = `${percent}%`;

      const title =
        prevLessonEnd === 0 ? "🌙 До початку навчання:" : "☕ Перерва";

      trackerText.innerHTML = `
        <div style="font-size: 1.1em; font-weight: bold; color: var(--accent-orange);">${title}</div>
        <div style="font-size: 0.9em; margin-top: 5px;">
            Наступний: <b>${nextLesson.subject}</b> о ${nextLesson.startStr}
        </div>
        <div style="font-size: 0.85em; opacity: 0.8; margin-top: 2px;">
            Залишилось часу: ${formatMinutes(remainingBreak)}
        </div>
      `;
    } else {
      progressWrapper.style.display = "none";
      trackerText.innerHTML = "На сьогодні все! Гарного відпочинку 🌙";
    }
  }

  function parseTimeRange(timeStr) {
    const [startRaw, endRaw] = timeStr.split("-");
    return {
      start: timeToMinutes(startRaw),
      end: timeToMinutes(endRaw),
      startStr: startRaw.trim(),
    };
  }

  function timeToMinutes(t) {
    const parts = t.replace(".", ":").split(":").map(Number);
    return parts[0] * 60 + parts[1];
  }

  function formatMinutes(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) return `${h} год ${m} хв`;
    return `${m} хв`;
  }

  function formatDurationShort(mins) {
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    if (h > 0) {
      return `${h}г ${m}хв`;
    }
    return `${m}хв`;
  }

  function getDayName(dayIndex) {
    const days = [
      "Неділя",
      "Понеділок",
      "Вівторок",
      "Середа",
      "Четвер",
      "П'ятниця",
      "Субота",
    ];
    return days[dayIndex];
  }

  function getCurrentWeekType() {
    const now = new Date();
    const diffTime = now - startDate;
    const daysPassed = Math.floor(diffTime / (1000 * 60 * 60 * 24));
    const adjustedDays = daysPassed < 0 ? 0 : daysPassed;
    const weeksPassed = Math.floor(adjustedDays / 7);
    return weeksPassed % 2 === 0 ? "upper" : "lower";
  }

  function renderSchedule(data) {
    if (data.upper) renderWeek("upper", data.upper);
    if (data.lower) renderWeek("lower", data.lower);
  }

  function renderWeek(containerId, weekData) {
    const container = document.getElementById(containerId);
    if (!container) return;
    container.innerHTML = "";

    const DAY_START = 8 * 60;
    const DAY_END = 21 * 60;

    for (const [dayName, lessons] of Object.entries(weekData)) {
      const dayDiv = document.createElement("div");
      dayDiv.className = "day";
      const title = document.createElement("h2");
      title.innerText = dayName;
      dayDiv.appendChild(title);

      const table = document.createElement("table");
      table.innerHTML = `<thead><tr><th>Час</th><th>Предмет</th><th>Тип</th><th>Викладач</th><th>Лінк</th></tr></thead><tbody></tbody>`;
      const tbody = table.querySelector("tbody");

      const sortedLessons = [...lessons].sort((a, b) => {
        return parseTimeRange(a.time).start - parseTimeRange(b.time).start;
      });

      if (sortedLessons.length > 0) {
        const firstLessonStart = parseTimeRange(sortedLessons[0].time).start;
        if (firstLessonStart - DAY_START > 30) {
          tbody.appendChild(createFreeTimeRow(DAY_START, firstLessonStart));
        }
      }

      let previousEnd = null;

      sortedLessons.forEach((lesson) => {
        const { start, end } = parseTimeRange(lesson.time);

        if (previousEnd !== null) {
          if (start - previousEnd > 30) {
            tbody.appendChild(createFreeTimeRow(previousEnd, start));
          }
        }

        const tr = document.createElement("tr");
        tr.className = lesson.type;
        tr.innerHTML = `
            <td class="time-cell">${lesson.time}</td>
            <td class="subject-cell">${lesson.subject}</td>
            <td data-label="Тип"><span class="badge">${lesson.typeLabel}</span></td>
            <td class="teacher-cell">${lesson.teacher}</td>
            <td data-label="Лінк"><a href="${lesson.link}" target="_blank" class="btn-link">${lesson.linkText}</a></td>
        `;
        tbody.appendChild(tr);

        previousEnd = end;
      });

      if (previousEnd !== null && DAY_END - previousEnd > 30) {
        tbody.appendChild(createFreeTimeRow(previousEnd, DAY_END));
      }

      dayDiv.appendChild(table);
      container.appendChild(dayDiv);
    }
  }

  function createFreeTimeRow(startMin, endMin) {
    const durationMin = endMin - startMin;
    const tr = document.createElement("tr");
    tr.className = "free-time-row";

    tr.innerHTML = `
      <td colspan="5">
        <div class="free-time-card">
          <span class="free-time-icon">☕</span> 
          <span>Вільний час: ${formatDurationShort(durationMin)}</span>
        </div>
      </td>
    `;
    return tr;
  }

  function initTabs() {
    const tabBtns = document.getElementsByClassName("tab-btn");
    Array.from(tabBtns).forEach((btn) => {
      btn.addEventListener("click", function () {
        openTab(this.dataset.tab);
      });
    });
  }

  function openTab(tabName) {
    const tabContent = document.getElementsByClassName("tab-content");
    for (let el of tabContent) el.classList.remove("active");
    const tabBtns = document.getElementsByClassName("tab-btn");
    for (let el of tabBtns) el.classList.remove("active");

    const content = document.getElementById(tabName);
    if (content) content.classList.add("active");

    const btn = document.querySelector(`.tab-btn[data-tab="${tabName}"]`);
    if (btn) btn.classList.add("active");
  }

  function updateSchedule(forceSwitchTab) {
    const weekType = getCurrentWeekType();
    const statusEl = document.getElementById("weekStatus");
    if (statusEl)
      statusEl.innerHTML = `Зараз активний: <span>${weekType === "upper" ? "Верхній" : "Нижній"} тиждень</span>`;

    if (forceSwitchTab) openTab(weekType);
    highlightLessons(weekType, new Date());
  }

  findMeBtn.addEventListener("click", () => {
    updateSchedule(true);
    const activeRow =
      document.querySelector(".current") || document.querySelector(".next");
    if (activeRow) {
      activeRow.scrollIntoView({ behavior: "smooth", block: "center" });
    } else {
      const today = getDayName(new Date().getDay());
      const headers = document.querySelectorAll("h2");
      let found = false;
      for (let h of headers) {
        if (h.innerText.includes(today)) {
          h.scrollIntoView({ behavior: "smooth", block: "center" });
          found = true;
          break;
        }
      }
      if (!found) window.scrollTo({ top: 0, behavior: "smooth" });
    }
  });

  function highlightLessons(tabId, now) {
    const dayMap = {
      Понеділок: 1,
      Вівторок: 2,
      Середа: 3,
      Четвер: 4,
      "П'ятниця": 5,
      Субота: 6,
      Неділя: 0,
    };
    const currentDayIndex = now.getDay();
    const currentMinutes = now.getHours() * 60 + now.getMinutes();
    const container = document.getElementById(tabId);
    if (!container) return;

    for (let day of container.getElementsByClassName("day")) {
      const titleText = day.querySelector("h2").innerText.trim();
      const dIdx = dayMap[titleText];

      day.classList.remove("day-passed");

      if (dIdx < currentDayIndex && dIdx !== 0) {
        day.classList.add("day-passed");
        day.querySelectorAll("tr").forEach((r) => {
          if (!r.classList.contains("free-time-row")) {
            r.classList.add("passed");
            r.classList.remove("current", "next");
          }
        });
        continue;
      }

      if (dIdx > currentDayIndex) {
        day
          .querySelectorAll("tr")
          .forEach((r) => r.classList.remove("passed", "current", "next"));
        continue;
      }

      if (dIdx === currentDayIndex) {
        let nextFound = false;
        day.querySelectorAll("tbody tr").forEach((row) => {
          if (row.classList.contains("free-time-row")) return;

          row.classList.remove("passed", "current", "next");
          const timeText = row.querySelector(".time-cell").innerText;
          const { start, end } = parseTimeRange(timeText);

          if (currentMinutes > end) {
            row.classList.add("passed");
          } else if (currentMinutes >= start && currentMinutes <= end) {
            row.classList.add("current");
            nextFound = true;
          } else {
            if (!nextFound) {
              row.classList.add("next");
              nextFound = true;
            }
          }
        });
      }
    }
  }
});
