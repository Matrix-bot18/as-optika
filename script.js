// AS Glasses – animacije
document.documentElement.classList.add("js");

// Pojavljivanje elemenata pri skrolovanju
(function () {
  var elementi = document.querySelectorAll(".pojavi");
  if (!("IntersectionObserver" in window)) {
    elementi.forEach(function (el) { el.classList.add("vidljivo"); });
    return;
  }
  var posmatrac = new IntersectionObserver(function (unosi) {
    unosi.forEach(function (u) {
      if (u.isIntersecting) {
        var el = u.target;
        el.classList.add("vidljivo");
        posmatrac.unobserve(el);
        // posle pojavljivanja ukloni kašnjenje, da efekti pri prelasku mišem budu trenutni
        if (el.dataset.kasnjenje) {
          setTimeout(function () { el.style.transitionDelay = ""; }, Number(el.dataset.kasnjenje) + 900);
        }
      }
    });
  }, { threshold: 0.12 });
  elementi.forEach(function (el, i) {
    if (el.dataset.kasnjenje) el.style.transitionDelay = el.dataset.kasnjenje + "ms";
    posmatrac.observe(el);
  });
})();

// Početna: logo se blago naginje prema mišu (efekat dubine)
(function () {
  var scena = document.getElementById("scena");
  var omot = scena && scena.querySelector(".logo-omot");
  if (!omot || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
  if (!window.matchMedia("(hover: hover)").matches) return;
  scena.addEventListener("pointermove", function (e) {
    var r = scena.getBoundingClientRect();
    var x = (e.clientX - r.left) / r.width - 0.5;
    var y = (e.clientY - r.top) / r.height - 0.5;
    omot.style.transform = "perspective(900px) rotateY(" + (x * 7).toFixed(2) + "deg) rotateX(" + (-y * 7).toFixed(2) + "deg)";
  });
  scena.addEventListener("pointerleave", function () { omot.style.transform = ""; });
})();

// Galerija ramova na šipki: njihanje, paljenje svetla i uvećan prikaz
(function () {
  var zid = document.querySelector(".zid");
  if (!zid) return;
  var visi = Array.prototype.slice.call(zid.querySelectorAll(".visi"));
  var natpis = document.querySelector(".galerija-natpis");
  var smanjeno = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  var dodir = window.matchMedia("(hover: none)").matches;
  var engleski = document.documentElement.lang === "en";
  var n = visi.length;

  // ugao (stepeni) i brzina njihanja svakog rama; svaki ram visi malo nakrivo, kao na pravom zidu
  var ugao = [], brzina = [], mir = [];
  for (var i = 0; i < n; i++) { mir[i] = ((i * 37 + 11) % 7 - 3) * 0.5; ugao[i] = mir[i]; brzina[i] = 0; }
  var upaljena = -1, petlja = 0, poslednje = 0;

  function korak(t) {
    var dt = poslednje ? Math.min(0.05, (t - poslednje) / 1000) : 1 / 60;
    poslednje = t;
    var radi = false;
    for (var i = 0; i < n; i++) {
      var cilj = i === upaljena ? 0 : mir[i];
      var a = -38 * (ugao[i] - cilj) - 2.1 * brzina[i];
      brzina[i] += a * dt;
      ugao[i] = Math.max(-14, Math.min(14, ugao[i] + brzina[i] * dt));
      visi[i].style.transform = "rotate(" + ugao[i].toFixed(3) + "deg)";
      if (Math.abs(ugao[i] - cilj) > 0.02 || Math.abs(brzina[i]) > 0.05) radi = true;
    }
    if (radi) petlja = requestAnimationFrame(korak); else { petlja = 0; poslednje = 0; }
  }
  function pokreni() { if (!smanjeno && !petlja) petlja = requestAnimationFrame(korak); }
  function gurni(i, jacina) { if (i < 0 || i >= n || smanjeno) return; brzina[i] += jacina; pokreni(); }
  for (var k = 0; k < n; k++) visi[k].style.transform = "rotate(" + mir[k] + "deg)";

  function upali(i) {
    if (i === upaljena) return;
    var stara = upaljena;
    upaljena = i;
    visi.forEach(function (v, j) { v.classList.toggle("upaljena", j === i); });
    zid.classList.toggle("ima-upaljenu", i >= 0);
    if (i >= 0) { gurni(i - 1, 14); gurni(i + 1, -14); gurni(i, stara < i ? 10 : -10); }
    if (natpis) {
      if (i >= 0) {
        var r = visi[i].querySelector(".ram");
        natpis.innerHTML = "<strong>" + r.dataset.naslov + "</strong><span>" + r.dataset.opis + " · " + (engleski ? (dodir ? "tap to enlarge" : "click to enlarge") : (dodir ? "dodirnite za uvećanje" : "kliknite za uvećanje")) + "</span>";
      } else {
        natpis.innerHTML = natpis.dataset.pocetni;
      }
    }
    pokreni();
  }
  if (natpis) natpis.dataset.pocetni = natpis.innerHTML;

  // „Prelazak rukom“ preko šipke: ramovi se zanjišu u pravcu pokreta
  var poslednjiX = null, poslednjeT = 0;
  zid.addEventListener("pointermove", function (e) {
    if (e.pointerType !== "mouse") return;
    var sad = performance.now();
    if (poslednjiX !== null) {
      var v = (e.clientX - poslednjiX) / Math.max(1, sad - poslednjeT);
      visi.forEach(function (el, j) {
        var b = el.getBoundingClientRect();
        if (e.clientX > b.left && e.clientX < b.right) gurni(j, Math.max(-6, Math.min(6, v * 6)));
      });
    }
    poslednjiX = e.clientX; poslednjeT = sad;
    stani();
  });
  zid.addEventListener("pointerleave", function (e) { if (e.pointerType === "mouse") { poslednjiX = null; upali(-1); } });

  visi.forEach(function (el, i) {
    var ram = el.querySelector(".ram");
    ram.addEventListener("mouseenter", function () { stani(); upali(i); });
    ram.addEventListener("focus", function () { stani(); upali(i); });
    ram.addEventListener("click", function () {
      stani();
      if (dodir && upaljena !== i) { upali(i); return; } // na telefonu: prvi dodir pali, drugi uvećava
      otvori(i);
    });
  });

  // Prvi put kada se galerija vidi: lagano „prelazak“ preko šipke, pa automatsko paljenje jedne po jedne slike
  var auto = 0, zaustavljeno = false;
  function stani() { zaustavljeno = true; clearInterval(auto); }
  function automatski() {
    if (smanjeno || zaustavljeno) return;
    var sledeca = 0;
    auto = setInterval(function () {
      if (zaustavljeno || document.hidden) return;
      upali(sledeca);
      if (dodir && zid.scrollWidth > zid.clientWidth) {
        var v = visi[sledeca];
        zid.scrollTo({ left: v.offsetLeft - (zid.clientWidth - v.offsetWidth) / 2, behavior: "smooth" });
      }
      sledeca = (sledeca + 1) % n;
    }, 2800);
  }
  if ("IntersectionObserver" in window) {
    var jednom = false;
    new IntersectionObserver(function (unosi, o) {
      if (!unosi[0].isIntersecting || jednom) return;
      jednom = true; o.disconnect();
      visi.forEach(function (_, j) { setTimeout(function () { gurni(j, 22 - j * 2); }, 150 + j * 90); });
      setTimeout(automatski, 1200);
    }, { threshold: 0.35 }).observe(zid);
  }
  // na telefonu, kada korisnik sam lista, zaustavi automatsko
  zid.addEventListener("touchstart", stani, { passive: true });

  // ----- Uvećan prikaz -----
  var prozor = document.querySelector(".uvecano");
  if (!prozor) return;
  var pRam = prozor.querySelector(".ram"), pSlika = prozor.querySelector("img"), pNatpis = prozor.querySelector(".uvecano-natpis");
  var otvorena = -1, prethodniFokus = null;
  function popuni(i) {
    var r = visi[i].querySelector(".ram");
    pRam.className = r.className;
    pSlika.src = r.querySelector("img").src;
    pSlika.alt = r.querySelector("img").alt;
    pNatpis.innerHTML = "<strong>" + r.dataset.naslov + "</strong><span>" + r.dataset.opis + " · " + (i + 1) + " / " + n + "</span>";
  }
  function otvori(i) {
    otvorena = i; prethodniFokus = document.activeElement;
    popuni(i);
    prozor.classList.add("otvoreno");
    prozor.setAttribute("aria-hidden", "false");
    document.body.style.overflow = "hidden";
    prozor.querySelector(".uvecano-zatvori").focus();
  }
  function zatvori() {
    if (otvorena < 0) return;
    var i = otvorena; otvorena = -1;
    prozor.classList.remove("otvoreno");
    prozor.setAttribute("aria-hidden", "true");
    document.body.style.overflow = "";
    if (prethodniFokus) prethodniFokus.focus({ preventScroll: true });
    gurni(i, i % 2 ? 20 : -20);
  }
  function pomeri(d) { if (otvorena < 0) return; otvorena = (otvorena + d + n) % n; popuni(otvorena); upali(otvorena); }
  prozor.querySelector(".uvecano-zatvori").addEventListener("click", zatvori);
  prozor.querySelector(".uvecano-prethodna").addEventListener("click", function () { pomeri(-1); });
  prozor.querySelector(".uvecano-sledeca").addEventListener("click", function () { pomeri(1); });
  prozor.addEventListener("click", function (e) { if (e.target === prozor) zatvori(); });
  document.addEventListener("keydown", function (e) {
    if (otvorena < 0) return;
    if (e.key === "Escape") zatvori();
    else if (e.key === "ArrowRight") pomeri(1);
    else if (e.key === "ArrowLeft") pomeri(-1);
  });
  // prevlačenje prstom levo/desno u uvećanom prikazu
  var startX = null;
  prozor.addEventListener("touchstart", function (e) { startX = e.touches[0].clientX; }, { passive: true });
  prozor.addEventListener("touchend", function (e) {
    if (startX === null) return;
    var dx = e.changedTouches[0].clientX - startX; startX = null;
    if (Math.abs(dx) > 50) pomeri(dx < 0 ? 1 : -1);
  });
})();

// Reklama u ramu telefona: zvuk na dugme, pauza kada video nije na ekranu
(function () {
  var video = document.querySelector(".video-okrenut, .reklama-video");
  if (!video) return;
  var dugme = document.querySelector(".zvuk");
  var en = document.documentElement.lang === "en";
  if (dugme) dugme.addEventListener("click", function () {
    video.muted = !video.muted;
    if (!video.muted) video.play();
    dugme.setAttribute("aria-pressed", video.muted ? "false" : "true");
    dugme.setAttribute("aria-label", video.muted ? (en ? "Turn sound on" : "Uključi zvuk") : (en ? "Turn sound off" : "Isključi zvuk"));
  });
  if ("IntersectionObserver" in window) {
    new IntersectionObserver(function (u) {
      if (u[0].isIntersecting) { var p = video.play(); if (p && p.catch) p.catch(function () {}); }
      else video.pause();
    }, { threshold: 0.25 }).observe(video);
  }
})();
