(() => {
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;

  // QA 시나리오 매트릭스: 4단계 × 16건
  const qa = document.getElementById("qa");
  const cells = [];
  if (qa) {
    ["승인", "매입", "차액정산", "반기환급"].forEach((stage) => {
      const b = document.createElement("b");
      b.textContent = stage;
      qa.appendChild(b);
      for (let i = 0; i < 16; i++) { const c = document.createElement("i"); qa.appendChild(c); cells.push(c); }
    });
  }
  const fillQA = () => cells.forEach((c, i) => setTimeout(() => c.classList.add("on"), reduced ? 0 : i * 18));

  // 숫자 카운트업
  const countUp = (el) => {
    const end = Number(el.dataset.count);
    const fmt = (n) => n.toLocaleString("ko-KR");
    if (reduced) { el.textContent = fmt(end); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = Math.min(1, (t - t0) / 1200);
      el.textContent = fmt(Math.round(end * (1 - Math.pow(1 - p, 3))));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  // 화면에 들어오면 애니메이션 실행
  const io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("is-in");
      $$("[data-count]", e.target).forEach(countUp);
      if (e.target.contains(qa)) fillQA();
      io.unobserve(e.target);
    });
  }, { threshold: 0.12 });
  $$(".reveal, .page, .sec").forEach((el) => io.observe(el));

  // 인쇄(PDF) 시 최종 상태로 고정
  const finalize = () => {
    document.body.classList.add("print");
    $$(".reveal, .page").forEach((el) => el.classList.add("is-in"));
    $$("[data-count]").forEach((el) => (el.textContent = Number(el.dataset.count).toLocaleString("ko-KR")));
    cells.forEach((c) => c.classList.add("on"));
  };
  addEventListener("beforeprint", finalize);
  if (location.search.includes("print")) finalize();
})();
