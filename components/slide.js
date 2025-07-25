// slide.js
const bgBase = chrome.runtime.getURL("assets/background/");

setupTabLayout(
  {
  todo: `${bgBase}todo.png`,
  clock: `${bgBase}clock.png`,
  notes: `${bgBase}notes.png`
});

function setupTabLayout(tabToBg)
{
  const tabs =
  {
    todo: document.getElementById("todo"),
    clock: document.getElementById("clock"),
    notes: document.getElementById("notes")
  };
  const closeBtn = document.getElementById("soot-close");

  //Object.entries(dict) gives key-value pairs
  for (const [key, tab] of Object.entries(tabs))
  {
    tab.style.backgroundImage = `url('${tabToBg[key]}')`;
  }

  Object.entries(tabs).forEach(([key, tab]) =>
  {
    tab.addEventListener("click", () =>
    {
      tab.classList.add("expanded");
      tab.classList.remove("preview");

      Object.entries(tabs).forEach(([otherKey, otherTab]) => {
        if (otherKey !== key)
        {
          otherTab.classList.add("hidden-tab");
        }
      });

      closeBtn.style.display = "block";
    });
  });

  closeBtn.addEventListener("click", () =>
  {
    for (const tab of Object.values(tabs))
    {
      tab.classList.remove("expanded", "hidden-tab");
      tab.classList.add("preview");
    }
    closeBtn.style.display = "none";
  });
}

window.setupTabLayout = setupTabLayout;