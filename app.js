/* معدّلي — منطق الواجهة. كل الحساب عبر core.js، وكل البيانات محلية على جهاز المستعمل. */
'use strict';

var Core = window.MuaddaliCore;
var SYSTEMS = Core.SYSTEMS;
var LS_KEY = 'muaddali-state-v1';
var uidCounter = 1;

function uid() { return 'id' + (uidCounter++) + Date.now().toString(36); }
function fmt(n) { return (n === null || n === undefined || isNaN(n)) ? '—' : (Math.round(n * 100) / 100).toFixed(2); }
function el(id) { return document.getElementById(id); }

/* ---------- الحالة ---------- */
function emptyCoursePoints() { return { code: '', name: '', inputType: 'letter', value: '', hours: 3 }; }
function emptyCoursePercent() { return { name: '', mark: '', max: 100 }; }
function emptySemester(name, percentMode) {
  return { id: uid(), name: name, courses: [percentMode ? emptyCoursePercent() : emptyCoursePoints()] };
}

var state = {
  systemId: 'saudi4',
  policy: 'last',
  semesters: [emptySemester('الفصل الأول', false)],
  pctSemesters: [emptySemester('الفصل الأول', true)]
};

function save() {
  try { localStorage.setItem(LS_KEY, JSON.stringify(state)); } catch (e) { /* تخزين غير متاح: نكمل بلا حفظ */ }
}

/*
 * إصلاح م-12: تحقق بنيوي عميق من الحالة المحفوظة قبل قبولها — أي فساد في
 * بنية الفصول/المقررات الداخلية يردّنا إلى الافتراضي كاملًا بدل رمي استثناء
 * وقت العرض. تُعاد بناء الكائنات من الحقول المعروفة فقط.
 */
function isNumOrEmpty(v) { return v === '' || (typeof v === 'number' && isFinite(v)); }
function sanitizeCoursePoints(c) {
  if (!c || typeof c !== 'object') return null;
  if (['letter', 'percent', 'points'].indexOf(c.inputType) < 0) return null;
  if (!(typeof c.value === 'string' || (typeof c.value === 'number' && isFinite(c.value)))) return null;
  if (typeof c.hours !== 'number' || !isFinite(c.hours)) return null;
  return {
    code: typeof c.code === 'string' ? c.code : '',
    name: typeof c.name === 'string' ? c.name : '',
    inputType: c.inputType, value: c.value, hours: c.hours
  };
}
function sanitizeCoursePercent(c) {
  if (!c || typeof c !== 'object') return null;
  if (!isNumOrEmpty(c.mark) || !isNumOrEmpty(c.max)) return null;
  return { name: typeof c.name === 'string' ? c.name : '', mark: c.mark, max: c.max };
}
function sanitizeSemesters(list, percentMode) {
  if (!Array.isArray(list) || list.length === 0) return null;
  var out = [];
  for (var i = 0; i < list.length; i++) {
    var s = list[i];
    if (!s || typeof s !== 'object' || !Array.isArray(s.courses)) return null;
    var courses = [];
    for (var j = 0; j < s.courses.length; j++) {
      var cc = percentMode ? sanitizeCoursePercent(s.courses[j]) : sanitizeCoursePoints(s.courses[j]);
      if (!cc) return null;
      courses.push(cc);
    }
    if (courses.length === 0) courses.push(percentMode ? emptyCoursePercent() : emptyCoursePoints());
    out.push({
      id: (typeof s.id === 'string' && s.id) ? s.id : uid(),
      name: typeof s.name === 'string' ? s.name : 'فصل',
      courses: courses
    });
  }
  return out;
}
function load() {
  try {
    var raw = localStorage.getItem(LS_KEY);
    if (!raw) return;
    var parsed = JSON.parse(raw);
    if (!parsed || !SYSTEMS[parsed.systemId]) return;
    if (['last', 'best', 'all'].indexOf(parsed.policy) < 0) return;
    var sems = sanitizeSemesters(parsed.semesters, false);
    var pctSems = sanitizeSemesters(parsed.pctSemesters, true);
    if (!sems || !pctSems) return; /* بنية تالفة: نبقى على الافتراضي */
    state = { systemId: parsed.systemId, policy: parsed.policy, semesters: sems, pctSemesters: pctSems };
  } catch (e) { /* حالة تالفة: نبقى على الافتراضي */ }
}

function currentSystem() { return SYSTEMS[state.systemId]; }
function isPercentMode() { return currentSystem().type === 'percent'; }
function activeSemesters() { return isPercentMode() ? state.pctSemesters : state.semesters; }

/* ---------- التبويبات ---------- */
document.querySelectorAll('.tab').forEach(function (btn) {
  btn.addEventListener('click', function () {
    document.querySelectorAll('.tab').forEach(function (b) {
      b.classList.remove('active');
      b.setAttribute('aria-selected', 'false');
    });
    document.querySelectorAll('.panel').forEach(function (p) { p.classList.remove('active'); });
    btn.classList.add('active');
    btn.setAttribute('aria-selected', 'true');
    el('tab-' + btn.getAttribute('data-tab')).classList.add('active');
  });
});

/* ---------- قوائم الأنظمة ---------- */
function fillSystemSelect(select, onlyPoints) {
  select.innerHTML = '';
  Object.keys(SYSTEMS).forEach(function (id) {
    var s = SYSTEMS[id];
    if (onlyPoints && s.type !== 'points') return;
    var opt = document.createElement('option');
    opt.value = id;
    opt.textContent = s.name;
    select.appendChild(opt);
  });
}

/* ---------- الحاسبة: بناء الصفوف ---------- */
function letterOptions(system, selected) {
  var html = '<option value="">— اختر —</option>';
  system.bands.forEach(function (b) {
    html += '<option value="' + b.letter + '"' + (b.letter === selected ? ' selected' : '') + '>' +
      b.letter + ' (' + fmt(b.points) + ')</option>';
  });
  (system.extraCodes || []).forEach(function (c) {
    html += '<option value="' + c.letter + '"' + (c.letter === selected ? ' selected' : '') + '>' +
      c.letter + ' — ' + c.note + '</option>';
  });
  return html;
}

function renderSemesters() {
  var container = el('semesters');
  container.innerHTML = '';
  var system = currentSystem();
  var percentMode = isPercentMode();

  activeSemesters().forEach(function (sem) {
    var box = document.createElement('div');
    box.className = 'semester';

    var head = document.createElement('div');
    head.className = 'semester-head';
    head.innerHTML =
      '<input class="semester-name" value="" aria-label="اسم الفصل">' +
      '<span class="semester-gpa" data-gpa-for="' + sem.id + '"></span>';
    head.querySelector('.semester-name').value = sem.name;
    head.querySelector('.semester-name').addEventListener('input', function (ev) {
      sem.name = ev.target.value; save();
    });
    box.appendChild(head);

    if (!percentMode) {
      var hr = document.createElement('div');
      hr.className = 'course-row head';
      hr.innerHTML = '<span>رمز المقرر (للإعادة)</span><span>اسم المقرر</span><span>الإدخال</span><span>التقدير</span><span>الساعات</span><span></span>';
      box.appendChild(hr);
    } else {
      var hr2 = document.createElement('div');
      hr2.className = 'course-row head';
      hr2.style.gridTemplateColumns = '2fr 1fr 1fr 36px';
      hr2.innerHTML = '<span>اسم المقرر</span><span>الدرجة المحصّلة</span><span>النهاية العظمى</span><span></span>';
      box.appendChild(hr2);
    }

    sem.courses.forEach(function (course, idx) {
      box.appendChild(percentMode ? percentRow(sem, course, idx) : pointsRow(sem, course, idx, system));
    });

    var foot = document.createElement('div');
    foot.className = 'semester-foot';
    var addBtn = document.createElement('button');
    addBtn.className = 'btn small';
    addBtn.textContent = '+ مقرر';
    addBtn.addEventListener('click', function () {
      sem.courses.push(percentMode ? emptyCoursePercent() : emptyCoursePoints());
      save(); renderSemesters(); updateResults();
    });
    foot.appendChild(addBtn);
    if (activeSemesters().length > 1) {
      var delBtn = document.createElement('button');
      delBtn.className = 'btn small danger';
      delBtn.textContent = 'حذف الفصل';
      delBtn.addEventListener('click', function () {
        var list = activeSemesters();
        var i = list.indexOf(sem);
        if (i >= 0) list.splice(i, 1);
        save(); renderSemesters(); updateResults();
      });
      foot.appendChild(delBtn);
    }
    box.appendChild(foot);
    container.appendChild(box);
  });
}

/* إشارة مجال فورية على الحقل نفسه (تكمّل تنبيه النتائج — إصلاح م-01/م-04) */
function markRangeValidity(input, ok) {
  input.setAttribute('aria-invalid', ok ? 'false' : 'true');
  input.classList.toggle('invalid-input', !ok);
}

function pointsRow(sem, course, idx, system) {
  var row = document.createElement('div');
  row.className = 'course-row';

  var code = document.createElement('input');
  code.type = 'text'; code.placeholder = 'MATH101'; code.className = 'ltr';
  code.setAttribute('aria-label', 'رمز المقرر');
  code.value = course.code || '';
  code.addEventListener('input', function () { course.code = code.value; save(); updateResults(); });

  var name = document.createElement('input');
  name.type = 'text'; name.placeholder = 'اختياري';
  name.setAttribute('aria-label', 'اسم المقرر');
  name.value = course.name || '';
  name.addEventListener('input', function () { course.name = name.value; save(); });

  var typeSel = document.createElement('select');
  typeSel.setAttribute('aria-label', 'صورة إدخال التقدير');
  typeSel.innerHTML =
    '<option value="letter"' + (course.inputType === 'letter' ? ' selected' : '') + '>حرف</option>' +
    '<option value="percent"' + (course.inputType === 'percent' ? ' selected' : '') + '>نسبة %</option>' +
    '<option value="points"' + (course.inputType === 'points' ? ' selected' : '') + '>نقاط</option>';
  typeSel.addEventListener('change', function () {
    course.inputType = typeSel.value;
    course.value = '';
    save(); renderSemesters(); updateResults();
  });

  var valueCell = document.createElement('div');
  var valueInput;
  if (course.inputType === 'letter') {
    valueInput = document.createElement('select');
    valueInput.className = 'ltr';
    valueInput.setAttribute('aria-label', 'التقدير');
    valueInput.innerHTML = letterOptions(system, course.value);
    valueInput.addEventListener('change', function () { course.value = valueInput.value; save(); updateResults(); });
  } else {
    valueInput = document.createElement('input');
    valueInput.type = 'number'; valueInput.step = '0.01'; valueInput.min = '0';
    valueInput.max = course.inputType === 'percent' ? '100' : String(system.maxPoints);
    valueInput.setAttribute('aria-label', course.inputType === 'percent' ? 'النسبة المئوية' : 'النقاط المباشرة');
    valueInput.value = (course.value === '' || course.value === null) ? '' : course.value;
    var valueLimit = course.inputType === 'percent' ? 100 : system.maxPoints;
    var checkValueRange = function () {
      var v = parseFloat(valueInput.value);
      markRangeValidity(valueInput, valueInput.value === '' || (v >= 0 && v <= valueLimit));
    };
    valueInput.addEventListener('input', function () {
      course.value = valueInput.value === '' ? '' : parseFloat(valueInput.value);
      checkValueRange();
      save(); updateResults();
    });
    checkValueRange();
  }
  valueCell.appendChild(valueInput);

  var hours = document.createElement('input');
  hours.type = 'number'; hours.min = '0'; hours.step = '1';
  hours.setAttribute('aria-label', 'الساعات المعتمدة');
  hours.value = course.hours;
  var checkHoursRange = function () {
    markRangeValidity(hours, hours.value === '' || parseFloat(hours.value) > 0);
  };
  hours.addEventListener('input', function () {
    course.hours = hours.value === '' ? 0 : parseFloat(hours.value);
    checkHoursRange();
    save(); updateResults();
  });
  checkHoursRange();

  var del = document.createElement('button');
  del.className = 'row-del'; del.textContent = '×'; del.title = 'حذف المقرر';
  del.setAttribute('aria-label', 'حذف المقرر');
  del.addEventListener('click', function () {
    sem.courses.splice(idx, 1);
    if (sem.courses.length === 0) sem.courses.push(emptyCoursePoints());
    save(); renderSemesters(); updateResults();
  });

  row.appendChild(code); row.appendChild(name); row.appendChild(typeSel);
  row.appendChild(valueCell); row.appendChild(hours); row.appendChild(del);
  return row;
}

function percentRow(sem, course, idx) {
  var row = document.createElement('div');
  row.className = 'course-row';
  row.style.gridTemplateColumns = '2fr 1fr 1fr 36px';

  var name = document.createElement('input');
  name.type = 'text'; name.placeholder = 'اسم المقرر';
  name.setAttribute('aria-label', 'اسم المقرر');
  name.value = course.name || '';
  name.addEventListener('input', function () { course.name = name.value; save(); });

  var mark = document.createElement('input');
  mark.type = 'number'; mark.min = '0'; mark.step = '0.01';
  mark.setAttribute('aria-label', 'الدرجة المحصّلة');
  mark.value = (course.mark === '' || course.mark === null) ? '' : course.mark;
  var checkMarkRange = function () {
    var v = parseFloat(mark.value), mx = parseFloat(max.value);
    markRangeValidity(mark, mark.value === '' || (v >= 0 && (isNaN(mx) || v <= mx)));
  };
  mark.addEventListener('input', function () {
    course.mark = mark.value === '' ? '' : parseFloat(mark.value);
    checkMarkRange();
    save(); updateResults();
  });

  var max = document.createElement('input');
  max.type = 'number'; max.min = '0'; max.step = '0.01';
  max.setAttribute('aria-label', 'النهاية العظمى');
  max.value = course.max;
  var checkMaxRange = function () {
    markRangeValidity(max, max.value === '' || parseFloat(max.value) > 0);
  };
  max.addEventListener('input', function () {
    course.max = max.value === '' ? '' : parseFloat(max.value);
    checkMaxRange(); checkMarkRange();
    save(); updateResults();
  });
  checkMarkRange(); checkMaxRange();

  var del = document.createElement('button');
  del.className = 'row-del'; del.textContent = '×'; del.title = 'حذف المقرر';
  del.setAttribute('aria-label', 'حذف المقرر');
  del.addEventListener('click', function () {
    sem.courses.splice(idx, 1);
    if (sem.courses.length === 0) sem.courses.push(emptyCoursePercent());
    save(); renderSemesters(); updateResults();
  });

  row.appendChild(name); row.appendChild(mark); row.appendChild(max); row.appendChild(del);
  return row;
}

/* ---------- الحاسبة: النتائج ---------- */
function flatCourses() {
  var out = [];
  state.semesters.forEach(function (sem) {
    sem.courses.forEach(function (c) {
      out.push({
        code: c.code || '', inputType: c.inputType,
        /* '' يبقى '' — صف غير مملوء بعد، لا قيمة خاطئة (يمّزه المحرك عن invalid) */
        value: (c.value === '' || c.value === null || c.value === undefined) ? '' : c.value,
        hours: (typeof c.hours === 'number') ? c.hours : 0, semester: sem.id
      });
    });
  });
  return out;
}

function esc(s) {
  return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

/*
 * تنبيه الاستبعاد الصريح (إصلاح م-02/م-04): كل مقرر لم يدخل الحساب لخروجه عن
 * المجال يُسمّى سببه هنا — لا استبعاد صامت بعد اليوم.
 */
function invalidWarningHTML(invalid) {
  if (!invalid || !invalid.length) return '';
  var reasons = {};
  invalid.forEach(function (x) { reasons[x.reason] = (reasons[x.reason] || 0) + 1; });
  var parts = Object.keys(reasons).map(function (r) {
    return esc(r) + (reasons[r] > 1 ? ' (×' + reasons[r] + ')' : '');
  });
  return '<div class="result-warn" role="alert">تنبيه: ' + invalid.length +
    ' من المقررات لم تدخل الحساب لأن قيمها خارج المجال الصحيح: ' + parts.join('؛ ') +
    '. صحّح القيم لتدخل نتيجتك.</div>';
}

function updateResults() {
  var system = currentSystem();
  var resultBox = el('calc-result');

  if (!isPercentMode()) {
    var all = flatCourses();
    state.semesters.forEach(function (sem) {
      var r = Core.computeSemesterGPA(system, all, sem.id, state.policy);
      var chip = document.querySelector('[data-gpa-for="' + sem.id + '"]');
      if (chip) {
        chip.innerHTML = (r.gpa === null ? '' : 'فصلي: <bdi>' + fmt(r.gpa) + '</bdi>') +
          (r.invalid && r.invalid.length ? ' ⚠ راجع التنبيه' : '');
      }
    });
    var cum = Core.computePointsGPA(system, all, state.policy);
    if (cum.gpa === null) {
      resultBox.innerHTML = '<div class="result-label">' +
        (cum.invalid.length
          ? 'لا توجد مقررات صالحة للحساب بعد — راجع التنبيه التالي.'
          : 'أدخل تقديرات مقرراتك وستظهر نتيجتك هنا فورًا.') + '</div>' +
        invalidWarningHTML(cum.invalid);
    } else {
      resultBox.innerHTML =
        '<div class="result-big"><bdi>' + fmt(cum.gpa) + '</bdi></div>' +
        '<div class="result-label">معدلك التراكمي من ' + fmt(system.maxPoints) + ' — محسوب من مجاميع النقاط والساعات الخام</div>' +
        '<div class="result-detail">مجموع النقاط: <bdi>' + fmt(cum.totalPoints) + '</bdi><span class="sep">|</span>' +
        'مجموع الساعات المحسوبة: <bdi>' + fmt(cum.totalHours) + '</bdi></div>' +
        invalidWarningHTML(cum.invalid);
    }
  } else {
    var allPct = [];
    state.pctSemesters.forEach(function (sem) {
      var courses = sem.courses.map(function (c) {
        return { mark: (c.mark === '' || c.mark === null) ? '' : c.mark, max: (c.max === '' || c.max === null) ? '' : c.max };
      });
      var r = Core.computePercentGPA(system, courses);
      var chip = document.querySelector('[data-gpa-for="' + sem.id + '"]');
      if (chip) {
        /* حارس null للتقدير (إصلاح م-02): لا يُطبع «null» أبدًا */
        chip.innerHTML = (r.percent === null ? '' :
          'فصلي: <bdi>' + fmt(r.percent) + '%</bdi> — ' + esc(r.label || '—')) +
          (r.invalid && r.invalid.length ? ' ⚠ راجع التنبيه' : '');
      }
      courses.forEach(function (c) { allPct.push(c); });
    });
    var cumP = Core.computePercentGPA(system, allPct);
    if (cumP.percent === null) {
      resultBox.innerHTML = '<div class="result-label">' +
        (cumP.invalid.length
          ? 'لا توجد مقررات صالحة للحساب بعد — راجع التنبيه التالي.'
          : 'أدخل درجات مقرراتك ونهاياتها العظمى وستظهر نتيجتك هنا فورًا.') + '</div>' +
        invalidWarningHTML(cumP.invalid);
    } else {
      /*
       * إصلاح م-07: التقدير يُحسم من النسبة الخام ويُعرض المقرّب — عند حدود
       * النطاقات قد يبدوان متناقضين (84.996% تُعرض 85.00% وتقديرها «جيد جداً»)،
       * فتُضاف ملاحظة صريحة بدل ترك التناقض الظاهري بلا تفسير.
       */
      var roundedBand = Core.bandForPercent(system, cumP.percent);
      var roundedLabel = roundedBand ? (roundedBand.label || roundedBand.letter) : null;
      var boundaryNote = (roundedLabel && cumP.label && roundedLabel !== cumP.label)
        ? ' — ملاحظة: التقدير محسوب من نسبتك الدقيقة قبل تقريب العرض إلى منزلتين'
        : '';
      resultBox.innerHTML =
        '<div class="result-big"><bdi>' + fmt(cumP.percent) + '%</bdi></div>' +
        '<div class="result-label">نسبتك التراكمية — ' + esc(cumP.label || '—') + boundaryNote + ' — محسوبة من مجموع الدرجات ÷ مجموع النهايات العظمى</div>' +
        '<div class="result-detail">مجموع الدرجات: <bdi>' + fmt(cumP.sumMarks) + '</bdi><span class="sep">|</span>' +
        'مجموع النهايات: <bdi>' + fmt(cumP.sumMax) + '</bdi></div>' +
        invalidWarningHTML(cumP.invalid);
    }
  }
}

/* ---------- أحداث الحاسبة ---------- */
el('calc-system').addEventListener('change', function () {
  state.systemId = el('calc-system').value;
  el('policy-row').style.display = isPercentMode() ? 'none' : '';
  save(); renderSemesters(); updateResults();
});
el('retake-policy').addEventListener('change', function () {
  state.policy = el('retake-policy').value;
  save(); updateResults();
});
el('add-semester').addEventListener('click', function () {
  var list = activeSemesters();
  list.push(emptySemester('فصل جديد', isPercentMode()));
  save(); renderSemesters(); updateResults();
});
el('clear-all').addEventListener('click', function () {
  state.semesters = [emptySemester('الفصل الأول', false)];
  state.pctSemesters = [emptySemester('الفصل الأول', true)];
  try { localStorage.removeItem(LS_KEY); } catch (e) {}
  save(); renderSemesters(); updateResults();
});

/* ---------- مخطّط الهدف ---------- */
el('goal-calc').addEventListener('click', function () {
  var system = SYSTEMS[el('goal-system').value];
  var doneHours = parseFloat(el('goal-done-hours').value);
  var doneGPA = parseFloat(el('goal-done-gpa').value);
  var target = parseFloat(el('goal-target').value);
  var future = parseFloat(el('goal-future-hours').value);
  var box = el('goal-result');
  if (isNaN(doneHours) || isNaN(doneGPA) || isNaN(target) || isNaN(future) || doneHours < 0 || !(future > 0)) {
    box.className = 'goal-result neutral';
    box.textContent = 'أدخل القيم الأربع كلها بأرقام صحيحة لنحسب لك المطلوب.';
    return;
  }
  /* إصلاح م-08: القيم السالبة تُرفض صراحة — لا مخرجات عبثية بصمت */
  if (doneGPA < 0 || target < 0) {
    box.className = 'goal-result neutral';
    box.textContent = 'تنبيه: المعدلات لا تكون سالبة. راجع معدلك الحالي والمستهدف.';
    return;
  }
  if (doneGPA > system.maxPoints || target > system.maxPoints) {
    box.className = 'goal-result neutral';
    box.textContent = 'تنبيه: أدخلت قيمة أعلى من الحد الأقصى لهذا النظام (' + fmt(system.maxPoints) + '). راجع الأرقام.';
    return;
  }
  var r = Core.planGoal(system, doneHours, doneGPA, target, future);
  if (r.status === 'invalid') {
    box.className = 'goal-result neutral';
    box.textContent = 'راجع القيم المدخلة: بعضها خارج المجال الصحيح لهذا النظام.';
    return;
  }
  if (r.status === 'impossible') {
    /*
     * إصلاح م-07: إن قرّب العرضُ المطلوبَ إلى حدّ النظام نفسه (4.004 ← «4.00»)
     * بدت الرسالة متناقضة حرفيًا؛ عندها يُعرض المطلوب بثلاث منازل.
     */
    var reqText = fmt(r.required);
    if (r.requiredRaw > system.maxPoints && r.required <= system.maxPoints) {
      reqText = String(Math.round(r.requiredRaw * 1000) / 1000);
    }
    box.className = 'goal-result impossible';
    box.innerHTML = 'الهدف <strong>غير ممكن حسابيًا</strong> في ' + fmt(future) + ' ساعة: ستحتاج متوسطًا قدره <bdi>' +
      reqText + '</bdi> وهو أعلى من حدّ النظام الأقصى (<bdi>' + fmt(system.maxPoints) + '</bdi>). ' +
      'جرّب زيادة عدد الساعات أو خفض المستهدف.';
  } else if (r.status === 'secured') {
    box.className = 'goal-result secured';
    box.innerHTML = 'هدفك <strong>متحقق سلفًا</strong>: حتى لو كان متوسطك القادم صفرًا سيبقى تراكميّك عند المستهدف أو فوقه.';
  } else {
    box.className = 'goal-result feasible';
    box.innerHTML = 'المطلوب منك في الساعات القادمة: متوسط <bdi>' + fmt(r.required) + '</bdi> من <bdi>' + fmt(system.maxPoints) + '</bdi>.' +
      (r.belowCurrent ? ' وهو عند معدلك الحالي أو دونه — الهدف في المتناول إن حافظت على مستواك.' : '');
  }
});

/* ---------- محوّل التقدير ---------- */
function refreshConvLetters() {
  var from = SYSTEMS[el('conv-from').value];
  var sel = el('conv-letter');
  sel.innerHTML = '';
  if (from.type === 'points') {
    from.bands.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.letter; o.textContent = b.letter;
      sel.appendChild(o);
    });
  } else {
    from.bands.forEach(function (b) {
      var o = document.createElement('option');
      o.value = b.label; o.textContent = b.label;
      sel.appendChild(o);
    });
  }
}
function refreshConvType() {
  var isLetter = el('conv-type').value === 'letter';
  el('conv-value').style.display = isLetter ? 'none' : '';
  el('conv-letter').style.display = isLetter ? '' : 'none';
  if (isLetter) refreshConvLetters();
}
el('conv-type').addEventListener('change', refreshConvType);
el('conv-from').addEventListener('change', function () { if (el('conv-type').value === 'letter') refreshConvLetters(); });
el('conv-calc').addEventListener('click', function () {
  var from = SYSTEMS[el('conv-from').value];
  var to = SYSTEMS[el('conv-to').value];
  var box = el('conv-result');
  var input;
  if (el('conv-type').value === 'letter') {
    var v = el('conv-letter').value;
    if (from.type === 'points') {
      input = { inputType: 'letter', value: v };
    } else {
      /* إصلاح مسح-1: التقدير اللفظي يمرّ بتمثيل المحرك النسبي نفسه (قاعدة م-09 عبر
       * labelRepresentativePercent) — لا منتصف نطاق يُحسب هنا متجاوزًا القاعدة */
      input = { inputType: 'label', value: v };
    }
  } else {
    var pct = parseFloat(el('conv-value').value);
    if (isNaN(pct) || pct < 0 || pct > 100) {
      box.className = 'goal-result neutral';
      box.textContent = 'أدخل نسبة مئوية بين 0 و100.';
      return;
    }
    input = { inputType: 'percent', value: pct };
  }
  var r = Core.convertGrade(from, to, input);
  if (!r) {
    box.className = 'goal-result neutral';
    box.textContent = 'تعذّر التحويل بهذه القيم.';
    return;
  }
  var targetText = r.targetLetter
    ? 'الحرف <bdi>' + r.targetLetter + '</bdi>' + (r.targetPoints !== null ? ' بقيمة <bdi>' + fmt(r.targetPoints) + '</bdi> نقطة' : '')
    : 'التقدير «' + r.targetLabel + '»';
  box.className = 'goal-result neutral';
  box.innerHTML = 'بالنسبة المعتمدة <bdi>' + fmt(r.percent) + '%</bdi> ← في نظام «' + to.name + '»: ' + targetText + '.';
});

/* ---------- بدء التشغيل ---------- */
load();
fillSystemSelect(el('calc-system'), false);
fillSystemSelect(el('goal-system'), true);
fillSystemSelect(el('conv-from'), false);
fillSystemSelect(el('conv-to'), false);
el('calc-system').value = state.systemId;
el('retake-policy').value = state.policy;
el('goal-system').value = 'saudi4';
el('conv-from').value = 'saudi4';
el('conv-to').value = 'qatar';
el('policy-row').style.display = isPercentMode() ? 'none' : '';
refreshConvType();
renderSemesters();
updateResults();
