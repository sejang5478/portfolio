(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const reduced = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const sleep = (ms) => new Promise((r) => setTimeout(r, reduced ? 0 : ms));

  /* ---------- progress · nav ---------- */
  const bar = $("#progressBar");
  const nav = $(".nav");
  const onScroll = () => {
    const max = document.documentElement.scrollHeight - innerHeight;
    if (bar) bar.style.width = (max > 0 ? (scrollY / max) * 100 : 0) + "%";
    if (nav) nav.classList.toggle("is-scrolled", scrollY > 8);
  };
  addEventListener("scroll", onScroll, { passive: true });
  onScroll();

  /* ---------- toast · copy ---------- */
  const toast = $("#toast");
  let toastTimer;
  const showToast = (msg) => {
    if (!toast) return;
    toast.textContent = msg;
    toast.classList.add("is-on");
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove("is-on"), 1800);
  };
  $$("[data-copy]").forEach((b) =>
    b.addEventListener("click", async () => {
      try { await navigator.clipboard.writeText(b.dataset.copy); showToast("이메일 주소를 복사했어요"); }
      catch { showToast(b.dataset.copy); }
    })
  );
  $$("[data-print]").forEach((b) => b.addEventListener("click", () => print()));

  /* ---------- count-up ---------- */
  const fmt = (n, dec) => n.toLocaleString("ko-KR", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const countUp = (el) => {
    const end = Number(el.dataset.count);
    const dec = (el.dataset.count.split(".")[1] || "").length;
    if (reduced) { el.textContent = fmt(end, dec); return; }
    const t0 = performance.now();
    const step = (t) => {
      const p = matchMedia("print").matches ? 1 : Math.min(1, (t - t0) / 1300);
      el.textContent = fmt(end * (1 - Math.pow(1 - p, 3)), dec);
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  };

  /* ---------- reveal (+ 진입 시 실행되는 연출) ---------- */
  const onEnter = new Map();
  const io = new IntersectionObserver(
    (entries) =>
      entries.forEach((e) => {
        if (!e.isIntersecting) return;
        e.target.classList.add("is-in");
        $$("[data-count]", e.target).forEach(countUp);
        if (e.target.matches("[data-count]")) countUp(e.target);
        const fn = onEnter.get(e.target);
        if (fn) { fn(); onEnter.delete(e.target); }
        io.unobserve(e.target);
      }),
    { threshold: 0.18, rootMargin: "0px 0px -40px 0px" }
  );
  const watch = (el, fn) => { if (!el) return; if (fn) onEnter.set(el, fn); io.observe(el); };
  $$(".reveal").forEach((el) => watch(el));
  // 인쇄할 때는 애니메이션 대신 최종 숫자를 보여 줌
  addEventListener("beforeprint", () => $$("[data-count]").forEach((el) => {
    const dec = (el.dataset.count.split(".")[1] || "").length;
    el.textContent = fmt(Number(el.dataset.count), dec);
  }));

  /* ---------- 홈: 결제 조건 단계 ---------- */
  const STEPS = [
    {
      tab: "가맹점번호", no: "1단계",
      title: "서비스·브랜드별로 가맹점번호를 나누는 데서 시작합니다",
      text: "같은 결제라도 어떤 가맹점번호로 승인되느냐에 따라 혜택과 정책이 달라집니다. 신규 서비스가 오면 번호 구조부터 설계합니다.",
      proof: ["전용 가맹점번호 채번", "하위몰 심사 반송 대응"],
      cases: [["2-2", "국민행복카드 바우처 전용 가맹점번호를 카드사별 조건에 맞춰 채번"], ["기타", "제휴카드·PLCC 혜택이 빠지는 결제를 브랜드 전용 번호로 분리"]],
    },
    {
      tab: "카드사 업종코드", no: "2단계",
      title: "번호마다 업종과 특약이 붙고, 카드사마다 기준이 다릅니다",
      text: "환금성 업종, 신차, 해외사업자처럼 카드사가 까다롭게 보는 업종은 카드사가 무엇을 근거로 판단하는지 먼저 파악합니다.",
      proof: ["카드사별 업종 체계 전수 확인", "특약·한도 공문 작성"],
      cases: [["2-3", "상품권·게임·차액정산·해외사업자 등 특수업종 카드 결제 오픈"], ["2-5", "카드사마다 다른 신차 업종코드·소득공제·무이자 기준 확인"]],
    },
    {
      tab: "승인 · 매입", no: "3단계",
      title: "승인과 매입 시점에 그 코드 기준으로 정책이 적용됩니다",
      text: "인증·한도는 승인에서, 수수료와 대금은 매입에서 결정됩니다. 어느 구간의 문제인지 짚고 카드사·VAN사와 함께 풉니다.",
      proof: ["매입 VAN 다중화 PM", "오픈 7일 전 인증 차이 해소"],
      cases: [["2-4", "월 약 8,000억 원 규모 매입을 중단 없이 다중화 구조로 전환"], ["2-3", "게임 결제 일 한도 50만 원 → 1,000만 원 예외 승인"]],
    },
    {
      tab: "고객이 받는 조건", no: "결과",
      title: "혜택 · 무이자 · 한도 · 소득공제가 고객 결제에 반영됩니다",
      text: "앞 단계가 맞아야 고객이 약속받은 조건을 그대로 받습니다. 선불 결제수단처럼 구조가 다른 결제도 같은 기준으로 맞춥니다.",
      proof: ["문화비 소득공제 적용", "6개 전 카드사 결제 지원"],
      cases: [["2-1", "삼성월렛 머니(선불)에도 문화비 소득공제가 맞게 적용되도록 협의"], ["2-2", "국민행복카드 바우처 6/6, 전 카드사를 지원하는 유일한 간편결제"]],
    },
  ];
  const stepper = $("#stepper");
  if (stepper) {
    const tabs = $(".stepper__tabs", stepper);
    const body = $(".stepper__body", stepper);
    let cur = 0, timer;
    tabs.innerHTML = STEPS.map((s, i) => `<button class="stepper__tab" role="tab" id="st-tab-${i}" aria-controls="st-pane" aria-selected="${i === 0}"><small>${s.no}</small><b>${s.tab}</b></button>`).join("");
    const render = (i) => {
      cur = i;
      const s = STEPS[i];
      $$(".stepper__tab", tabs).forEach((t, k) => { t.setAttribute("aria-selected", k === i); t.tabIndex = k === i ? 0 : -1; });
      body.innerHTML = `
        <div class="stepper__pane pane-in" id="st-pane" role="tabpanel" aria-labelledby="st-tab-${i}">
          <h3>${s.title}</h3><p>${s.text}</p>
          <div class="stepper__proof">${s.proof.map((p) => `<span class="chip chip--blue">${p}</span>`).join("")}</div>
        </div>
        <div class="stepper__cases pane-in"><small>이 단계에서 푼 일</small><ul>${s.cases.map(([n, t]) => `<li><b>${n}</b><span>${t}</span></li>`).join("")}</ul></div>`;
    };
    const auto = () => { clearInterval(timer); if (!reduced) timer = setInterval(() => render((cur + 1) % STEPS.length), 5200); };
    $$(".stepper__tab", tabs).forEach((t, i) => {
      t.addEventListener("click", () => { render(i); clearInterval(timer); });
      t.addEventListener("keydown", (e) => {
        if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
        const n = (cur + (e.key === "ArrowRight" ? 1 : STEPS.length - 1)) % STEPS.length;
        render(n); clearInterval(timer); $$(".stepper__tab", tabs)[n].focus();
      });
    });
    render(0);
    watch(stepper, auto);
  }

  /* ---------- 경력기술서: 프로젝트 아코디언 ---------- */
  $$(".pj").forEach((pj) => {
    const head = $(".pj__head", pj);
    head.addEventListener("click", () => {
      const open = pj.classList.toggle("is-open");
      head.setAttribute("aria-expanded", open);
    });
  });
  const allBtn = $("#toggleAll");
  if (allBtn) {
    allBtn.addEventListener("click", () => {
      const pjs = $$(".pj");
      const open = !pjs.every((p) => p.classList.contains("is-open"));
      pjs.forEach((p) => { p.classList.toggle("is-open", open); $(".pj__head", p).setAttribute("aria-expanded", open); });
      allBtn.textContent = open ? "모두 접기" : "모두 펼치기";
    });
  }
  // 해시로 들어오면 해당 프로젝트를 펼침
  const openHash = () => {
    const t = location.hash && document.getElementById(location.hash.slice(1));
    if (t && t.classList.contains("pj")) { t.classList.add("is-open"); $(".pj__head", t).setAttribute("aria-expanded", true); }
  };
  addEventListener("hashchange", openHash);
  openHash();
  addEventListener("beforeprint", () => $$(".pj").forEach((p) => p.classList.add("is-open")));

  /* ---------- 로컬 목차 scrollspy ---------- */
  const tocLinks = $$(".toc a");
  if (tocLinks.length) {
    const targets = tocLinks.map((a) => document.getElementById(a.getAttribute("href").slice(1))).filter(Boolean);
    const spy = () => {
      const y = scrollY + 160;
      let k = 0;
      targets.forEach((t, i) => { if (t.offsetTop <= y) k = i; });
      tocLinks.forEach((a, i) => a.classList.toggle("is-on", i === k));
      const on = tocLinks[k];
      if (on) { const box = on.parentElement; const l = on.offsetLeft - box.clientWidth / 2 + on.clientWidth / 2; box.scrollTo({ left: l, behavior: "smooth" }); }
    };
    let ticking = false;
    addEventListener("scroll", () => { if (!ticking) { ticking = true; requestAnimationFrame(() => { spy(); ticking = false; }); } }, { passive: true });
    spy();
  }

  /* ---------- 포트폴리오 1: 결제 흐름 재생 ---------- */
  const pay = $("#pay");
  if (pay) {
    const nodes = $$(".pay__node", pay);
    let running = false;
    const play = async () => {
      if (running) return;
      running = true;
      nodes.forEach((n) => n.classList.remove("is-on"));
      for (const n of nodes) { n.classList.add("is-on"); await sleep(650); n.classList.remove("is-on"); }
      nodes[nodes.length - 1].classList.add("is-on");
      running = false;
    };
    $("#payPlay")?.addEventListener("click", play);
    watch(pay, play);
  }

  /* ---------- 포트폴리오 2: 6/6 연결 ---------- */
  const six = $("#six");
  if (six) {
    const cards = $$(".six__card", six);
    const num = $("#sixNum");
    const count = $(".six__count", six);
    let running = false;
    const play = async () => {
      if (running) return;
      running = true;
      cards.forEach((c) => c.classList.remove("is-on"));
      count.classList.remove("is-done");
      num.textContent = "0";
      for (let i = 0; i < cards.length; i++) { await sleep(380); cards[i].classList.add("is-on"); num.textContent = i + 1; }
      count.classList.add("is-done");
      running = false;
    };
    $("#sixPlay")?.addEventListener("click", play);
    watch(six, play);
  }

  /* ---------- 포트폴리오 3: 차이만 보기 ---------- */
  const diff = $("#diffOnly");
  if (diff) {
    diff.addEventListener("change", () => {
      $$("#authTbl tbody tr").forEach((tr) => tr.classList.toggle("is-dim", diff.checked && !tr.querySelector(".hl")));
    });
  }

  /* bars */
  $$("[data-bars]").forEach((box) =>
    watch(box, () => $$(".bar__fill", box).forEach((f) => (f.style.width = f.dataset.w + "%")))
  );

  /* ---------- 포트폴리오 4: 대안 선택 ---------- */
  const alts = $$(".alt");
  const altOut = $("#altOut");
  if (alts.length && altOut) {
    const pick = (b) => {
      alts.forEach((a) => a.setAttribute("aria-pressed", a === b));
      altOut.innerHTML = b.dataset.out;
      altOut.classList.remove("pane-in"); void altOut.offsetWidth; altOut.classList.add("pane-in");
    };
    alts.forEach((a) => a.addEventListener("click", () => pick(a)));
    pick(alts.find((a) => a.classList.contains("alt--pick")) || alts[0]);
  }

  /* 진행 월 */
  const months = $("#months");
  if (months) {
    const ms = $$(".month", months);
    let running = false;
    const play = async () => {
      if (running) return;
      running = true;
      ms.forEach((m) => m.classList.remove("is-on"));
      for (const m of ms) { await sleep(450); m.classList.add("is-on"); }
      running = false;
    };
    $("#monthsPlay")?.addEventListener("click", play);
    watch(months, play);
  }

  /* QA 필터 */
  const qaSeg = $("#qaSeg");
  if (qaSeg) {
    const btns = $$("button", qaSeg);
    btns.forEach((b) =>
      b.addEventListener("click", () => {
        btns.forEach((x) => x.setAttribute("aria-pressed", x === b));
        const f = b.dataset.f;
        $$("#qaTbl tbody tr").forEach((tr) => (tr.hidden = f !== "all" && tr.dataset.k !== f));
      })
    );
  }

  /* ---------- 포트폴리오 5: 서류 자동화 데모 ---------- */
  const demo = $("#demo");
  if (demo) {
    const out = $$(".docs9 div", demo);
    const tEl = $("#demoTime");
    const btn = $("#demoRun");
    let running = false;
    btn.addEventListener("click", async () => {
      if (running) return;
      running = true;
      btn.disabled = true;
      const v = Object.fromEntries($$("input", demo).map((i) => [i.name, i.value.trim() || i.placeholder]));
      out.forEach((d) => { d.classList.remove("is-on"); $("i", d).textContent = "대기 중"; });
      const t0 = performance.now();
      const tick = () => { if (!running) return; tEl.textContent = ((performance.now() - t0) / 1000).toFixed(1) + "초"; requestAnimationFrame(tick); };
      requestAnimationFrame(tick);
      for (const d of out) {
        await sleep(260);
        d.classList.add("is-on");
        $("i", d).textContent = `${v.shop} · ${v.date}`;
      }
      running = false;
      tEl.textContent = ((performance.now() - t0) / 1000).toFixed(1) + "초";
      btn.disabled = false;
      btn.textContent = "다시 만들기";
      showToast("서류 9종을 한 번에 만들었어요 (예시)");
    });
  }
})();
