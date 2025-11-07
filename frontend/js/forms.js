 (function() {
      const tabs = document.querySelectorAll(".demo-tab");
      const forms = document.querySelectorAll(".demo-form");

      tabs.forEach(tab => {
        tab.addEventListener("click", () => {
          tabs.forEach(t => t.classList.remove("active"));
          forms.forEach(f => f.classList.remove("active"));

          tab.classList.add("active");
          const target = document.getElementById(tab.dataset.target);
          if (target) target.classList.add("active");
        });
      });
    })();