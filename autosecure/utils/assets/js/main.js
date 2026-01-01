const toggleBtn = document.getElementById("theme-toggle");
toggleBtn.addEventListener("click", () => {
  document.body.classList.toggle("dark-mode");
  localStorage.setItem("theme", 
    document.body.classList.contains("dark-mode") ? "dark" : "light"
  );
});

// load lại theme đã lưu
if (localStorage.getItem("theme") === "dark") {
  document.body.classList.add("dark-mode");
}
