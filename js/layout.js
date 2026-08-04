// async function loadComponent(targetId, componentPath) {
//   const target = document.getElementById(targetId);

//   if (!target) {
//     return;
//   }

//   try {
//     const response = await fetch(componentPath);

//     if (!response.ok) {
//       throw new Error(
//         `Componenta ${componentPath} nu a putut fi încărcată: ${response.status}`,
//       );
//     }

//     target.innerHTML = await response.text();
//   } catch (error) {
//     console.error("Eroare la încărcarea componentei:", error);
//   }
// }

// window.addEventListener("DOMContentLoaded", () => {
//   loadComponent("site-menu", "/includes/menu.html");
// });
async function loadComponent(targetId, componentPath) {
  const target = document.getElementById(targetId);

  if (!target) return;

  try {
    const response = await fetch(componentPath);

    if (!response.ok) {
      throw new Error(
        `Componenta ${componentPath} nu a putut fi încărcată: ${response.status}`,
      );
    }

    target.innerHTML = await response.text();
  } catch (error) {
    console.error("Eroare la încărcarea componentei:", error);
  }
}

async function loadLayout() {
  await loadComponent("site-header", "/includes/header.html");
  await loadComponent("site-menu", "/includes/menu.html");
  await loadComponent("site-footer", "/includes/footer.html");

  document.dispatchEvent(new CustomEvent("layoutLoaded"));
}

window.addEventListener("DOMContentLoaded", loadLayout);
