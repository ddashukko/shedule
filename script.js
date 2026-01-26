let scheduleData = null;
const container = document.getElementById("schedule-container");
const btnUpper = document.getElementById("btn-upper");
const btnLower = document.getElementById("btn-lower");

fetch("data.json")
  .then((response) => response.json())
  .then((data) => {
    scheduleData = data;
    renderSchedule(data.upper);
  })
  .catch((error) => console.error(error));

btnUpper.addEventListener("click", () => {
  if (scheduleData) {
    renderSchedule(scheduleData.upper);
    btnUpper.classList.add("active");
    btnLower.classList.remove("active");
  }
});

btnLower.addEventListener("click", () => {
  if (scheduleData) {
    renderSchedule(scheduleData.lower);
    btnLower.classList.add("active");
    btnUpper.classList.remove("active");
  }
});

function renderSchedule(weekData) {
  container.innerHTML = "";

  weekData.forEach((dayItem) => {
    if (!dayItem.lessons) return;

    const dayCard = document.createElement("div");
    dayCard.classList.add("day-card");

    const dayTitle = document.createElement("h3");
    dayTitle.textContent = dayItem.day;
    dayCard.appendChild(dayTitle);

    const lessonsList = document.createElement("ul");
    lessonsList.classList.add("lessons-list");

    dayItem.lessons.forEach((lesson) => {
      const lessonItem = document.createElement("li");
      lessonItem.classList.add("lesson-item");

      let linkHtml = "";
      if (lesson.link) {
        linkHtml = `<a href="${lesson.link}" target="_blank" class="join-btn">Підключитися</a>`;
      }

      lessonItem.innerHTML = `
                <div class="lesson-time">${lesson.time}</div>
                <div class="lesson-info">
                    <span class="lesson-subject">${lesson.subject} <span class="lesson-type">(${lesson.type})</span></span>
                    <div class="lesson-teacher">${lesson.teacher}</div>
                </div>
                ${linkHtml}
            `;

      lessonsList.appendChild(lessonItem);
    });

    dayCard.appendChild(lessonsList);
    container.appendChild(dayCard);
  });
}
