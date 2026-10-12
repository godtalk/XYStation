const clock = document.getElementById("clock");

function tick() {
  clock.textContent = new Date().toLocaleTimeString("zh-CN", { hour12: false });
}

tick();
setInterval(tick, 1000);

document.querySelectorAll(".row").forEach((row) => {
  row.addEventListener("click", () => {
    const panel = document.getElementById(row.dataset.panel);
    const open = panel.classList.contains("open");

    document.querySelectorAll(".panel").forEach((item) => item.classList.remove("open"));
    document.querySelectorAll(".row").forEach((item) => item.classList.remove("active"));

    if (!open) {
      panel.classList.add("open");
      row.classList.add("active");
    }
  });
});
