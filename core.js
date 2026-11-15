/*
 * معدّلي — محرك الحساب (دوال نقية، بلا أي اعتماد على المتصفح)
 * البيانات: مجموعة بيانات أنظمة التقدير الموثّقة (11-grading-systems.md)
 * كل نظام يُخزَّن باسم صيغته/جامعته — لا توحيد صامت بين الجامعات.
 * النطاقات تُقرأ [من — إلى) والدرجة تُقارَن بالنطاق قبل أي تقريب.
 */
'use strict';

/* التقريب: نصف-لأعلى لمنزلتين، على الناتج النهائي فقط (اصطلاح منتج معلَن) */
function round2(x) {
  return Math.round((x + 1e-9) * 100) / 100;
}

/* ---------- الأنظمة النقطية (بالساعات المعتمدة) ---------- */
/* bands: {letter, min, max, points} — النطاق [min, max) وأعلى نطاق يشمل 100 */
var POINT_SYSTEMS = {
  saudi4: {
    id: 'saudi4',
    name: 'السعودي الموحّد — عمود 4.00 (صيغة جامعة الملك فهد KFUPM)',
    type: 'points',
    maxPoints: 4.00,
    bands: [
      { letter: 'A+', min: 95, max: 100, points: 4.00 },
      { letter: 'A',  min: 90, max: 95,  points: 3.75 },
      { letter: 'B+', min: 85, max: 90,  points: 3.50 },
      { letter: 'B',  min: 80, max: 85,  points: 3.00 },
      { letter: 'C+', min: 75, max: 80,  points: 2.50 },
      { letter: 'C',  min: 70, max: 75,  points: 2.00 },
      { letter: 'D+', min: 65, max: 70,  points: 1.50 },
      { letter: 'D',  min: 60, max: 65,  points: 1.00 },
      { letter: 'F',  min: 0,  max: 60,  points: 0.00 }
    ],
    /* رموز إدارية موثّقة تدخل المعدل بصفر: DN محروم، WF منسحب راسبًا (KFUPM) */
    extraCodes: [
      { letter: 'DN', points: 0.00, note: 'محروم — يدخل بصفر' },
      { letter: 'WF', points: 0.00, note: 'منسحب راسبًا — يدخل بصفر' }
    ]
  },
  saudi5: {
    id: 'saudi5',
    name: 'السعودي الموحّد — عمود 5.00 (صيغة جامعة الملك سعود)',
    type: 'points',
    maxPoints: 5.00,
    bands: [
      { letter: 'A+', min: 95, max: 100, points: 5.00 },
      { letter: 'A',  min: 90, max: 95,  points: 4.75 },
      { letter: 'B+', min: 85, max: 90,  points: 4.50 },
      { letter: 'B',  min: 80, max: 85,  points: 4.00 },
      { letter: 'C+', min: 75, max: 80,  points: 3.50 },
      { letter: 'C',  min: 70, max: 75,  points: 3.00 },
      { letter: 'D+', min: 65, max: 70,  points: 2.50 },
      { letter: 'D',  min: 60, max: 65,  points: 2.00 },
      /* اختلاف جوهري موثّق: F هنا = 1.00 لا 0.00 */
      { letter: 'F',  min: 0,  max: 60,  points: 1.00 }
    ],
    extraCodes: [
      { letter: 'DN', points: 1.00, note: 'محروم — يدخل بـ 1.00 في هذا العمود' }
    ]
  },
  qatar: {
    id: 'qatar',
    name: 'جامعة قطر — 4.00 بخطوات 0.50 (بلا A+)',
    type: 'points',
    maxPoints: 4.00,
    bands: [
      { letter: 'A',  min: 90, max: 100, points: 4.00 },
      { letter: 'B+', min: 85, max: 90,  points: 3.50 },
      { letter: 'B',  min: 80, max: 85,  points: 3.00 },
      { letter: 'C+', min: 75, max: 80,  points: 2.50 },
      { letter: 'C',  min: 70, max: 75,  points: 2.00 },
      { letter: 'D+', min: 65, max: 70,  points: 1.50 },
      { letter: 'D',  min: 60, max: 65,  points: 1.00 },
      { letter: 'F',  min: 0,  max: 60,  points: 0.00 }
    ],
    extraCodes: []
  },
  o6u: {
    id: 'o6u',
    name: 'المصري بالساعات المعتمدة — صيغة جامعة 6 أكتوبر (O6U)',
    type: 'points',
    maxPoints: 4.00,
    bands: [
      { letter: 'A',  min: 93, max: 100, points: 4.00 },
      { letter: 'A-', min: 89, max: 93,  points: 3.70 },
      { letter: 'B+', min: 84, max: 89,  points: 3.30 },
      { letter: 'B',  min: 80, max: 84,  points: 3.00 },
      { letter: 'B-', min: 76, max: 80,  points: 2.70 },
      { letter: 'C+', min: 73, max: 76,  points: 2.30 },
      { letter: 'C',  min: 70, max: 73,  points: 2.00 },
      { letter: 'C-', min: 67, max: 70,  points: 1.70 },
      { letter: 'D+', min: 64, max: 67,  points: 1.30 },
      { letter: 'D',  min: 60, max: 64,  points: 1.00 },
      { letter: 'F',  min: 0,  max: 60,  points: 0.00 }
    ],
    extraCodes: []
  }
};

/* ---------- الأنظمة النسبية (بلا نقاط، بلا وزن ساعات) ---------- */
var PERCENT_SYSTEMS = {
  egyptTrad: {
    id: 'egyptTrad',
    name: 'المصري التقليدي بالنسبة المئوية (لوائح الإسكندرية/الزقازيق/بنها)',
    type: 'percent',
    bands: [
      { label: 'ممتاز',     min: 85, max: 100 },
      { label: 'جيد جداً',  min: 75, max: 85 },
      { label: 'جيد',       min: 65, max: 75 },
      { label: 'مقبول',     min: 50, max: 65 },
      { label: 'ضعيف',      min: 30, max: 50 },
      { label: 'ضعيف جداً', min: 0,  max: 30 }
    ]
  },
  yemenSanaaA: {
    id: 'yemenSanaaA',
    name: 'اليمني بالنسبة المئوية — جامعة صنعاء، صيغة الدبلوم العالي (الموثّقة)',
    type: 'percent',
    bands: [
      { label: 'ممتاز',    min: 90, max: 100 },
      { label: 'جيد جداً', min: 80, max: 90 },
      { label: 'جيد',      min: 75, max: 80 },
      { label: 'مقبول',    min: 65, max: 75 },
      { label: 'راسب',     min: 0,  max: 65 }
    ]
  }
};

var SYSTEMS = {};
Object.keys(POINT_SYSTEMS).forEach(function (k) { SYSTEMS[k] = POINT_SYSTEMS[k]; });
Object.keys(PERCENT_SYSTEMS).forEach(function (k) { SYSTEMS[k] = PERCENT_SYSTEMS[k]; });

/* ---------- دوال مساعدة ---------- */

function bandForPercent(system, pct) {
  for (var i = 0; i < system.bands.length; i++) {
    var b = system.bands[i];
    if (pct >= b.min && (pct < b.max || (b.max === 100 && pct <= 100))) return b;
  }
  return null;
}

function bandForLetter(system, letter) {
  for (var i = 0; i < system.bands.length; i++) {
    if (system.bands[i].letter === letter) return system.bands[i];
  }
  if (system.extraCodes) {
    for (var j = 0; j < system.extraCodes.length; j++) {
      if (system.extraCodes[j].letter === letter) return system.extraCodes[j];
    }
  }
  return null;
}

/* نقاط الساعة الواحدة لمقرر: إدخال بحرف أو بنسبة أو بنقاط مباشرة (قاعدة 6) */
function courseHourPoints(system, course) {
  if (course.inputType === 'letter') {
    var b = bandForLetter(system, course.value);
    return b ? b.points : null;
  }
  if (course.inputType === 'percent') {
    var band = bandForPercent(system, course.value);
    return band ? band.points : null;
  }
  if (course.inputType === 'points') {
    return (typeof course.value === 'number' && isFinite(course.value)) ? course.value : null;
  }
  return null;
}

/*
 * طبقة التحقق من المجال (إصلاح م-01/م-04): كل مقرر يُقيَّم قبل الحساب إلى:
 * 'ok' صالح ويدخل الحساب | 'incomplete' صف لم يُملأ بعد (يُتخطّى بصمت — ليس خطأ)
 * | 'invalid' قيمة مدخلة لكنها خارج المجال — تُستبعد من الحساب وتُبلَّغ صراحة
 * في حقل invalid بنتيجة الحساب، لا تختفي بصمت أبدًا.
 */
function isEmptyValue(v) { return v === '' || v === null || v === undefined; }

function assessCourse(system, course) {
  if (isEmptyValue(course.value)) return { status: 'incomplete' };
  if (course.inputType === 'letter') {
    var b = bandForLetter(system, course.value);
    if (!b) return { status: 'invalid', reason: 'تقدير «' + course.value + '» غير موجود في هذا النظام' };
    return withHoursCheck({ status: 'ok', hourPoints: b.points }, course);
  }
  if (course.inputType === 'percent') {
    if (typeof course.value !== 'number' || !isFinite(course.value)) {
      return { status: 'invalid', reason: 'النسبة المدخلة ليست رقمًا' };
    }
    if (course.value < 0 || course.value > 100) {
      return { status: 'invalid', reason: 'نسبة ' + course.value + '% خارج المجال [0، 100]' };
    }
    var band = bandForPercent(system, course.value);
    if (!band) return { status: 'invalid', reason: 'نسبة ' + course.value + '% لا تقع في أي نطاق بالنظام' };
    return withHoursCheck({ status: 'ok', hourPoints: band.points }, course);
  }
  if (course.inputType === 'points') {
    if (typeof course.value !== 'number' || !isFinite(course.value)) {
      return { status: 'invalid', reason: 'النقاط المدخلة ليست رقمًا' };
    }
    if (course.value < 0 || course.value > system.maxPoints) {
      return { status: 'invalid', reason: 'نقاط ' + course.value + ' خارج مجال النظام [0، ' + system.maxPoints + ']' };
    }
    return withHoursCheck({ status: 'ok', hourPoints: course.value }, course);
  }
  return { status: 'invalid', reason: 'صورة إدخال غير معروفة' };
}

function withHoursCheck(assessed, course) {
  if (assessed.status !== 'ok') return assessed;
  if (typeof course.hours !== 'number' || !isFinite(course.hours) || course.hours <= 0) {
    return { status: 'invalid', reason: 'ساعات غير صالحة (' + course.hours + ') — يجب أن تكون أكبر من صفر' };
  }
  return assessed;
}

/* هل هذه المحاولة رسوب F؟ (حرف F، أو نسبة دون حد النجاح 60) — لقاعدة O6U في الإعادة */
function isFailAttempt(system, course) {
  if (course.inputType === 'letter') return course.value === 'F';
  if (course.inputType === 'percent') {
    var band = bandForPercent(system, course.value);
    return !!band && band.letter === 'F';
  }
  return false;
}

/*
 * معاملة المحاولات المتكررة لمقرر واحد (نفس الرمز) — خيار معلَن للمستعمل:
 * 'last' الأخيرة فقط (الافتراضي المقترح — على غرار قاعدة الدرجة الأخيرة الموثّقة)،
 * 'best' الأعلى فقط، 'all' كل المحاولات.
 * المقررات بلا رمز تُحتسب دائمًا فرادى.
 * مطابقة الرمز غير حسّاسة لحالة الأحرف ولا للمسافات الطرفية (إصلاح م-03):
 * math101 وMATH101 المقرر نفسه.
 * قاعدة O6U الموثّقة (إصلاح م-06، ملف البيانات نظام 4 وقاعدة 8): عند استبدال
 * محاولة راسبة F بمحاولة ناجحة لاحقة في نظام o6u، تُرصد الدرجة المستبدَلة
 * بسقف B+ ‏(3.30) — تُطبَّق هنا عند حسم المحاولات للتراكمي.
 */
var O6U_REPLACEMENT_CAP = 3.30; /* نقاط B+ في جدول O6U */

function resolveAttempts(courses, policy, system) {
  if (!policy || policy === 'all') return courses.slice();
  var byCode = {};
  var singles = [];
  courses.forEach(function (c, idx) {
    if (c.code && String(c.code).trim() !== '') {
      var key = String(c.code).trim().toUpperCase();
      if (!byCode[key]) byCode[key] = [];
      byCode[key].push({ course: c, idx: idx });
    } else {
      singles.push({ course: c, idx: idx });
    }
  });
  var kept = singles.slice();
  Object.keys(byCode).forEach(function (key) {
    var attempts = byCode[key];
    var chosen = null;
    if (policy === 'last') {
      chosen = attempts[attempts.length - 1];
    } else if (policy === 'best') {
      var best = attempts[0];
      attempts.forEach(function (a) {
        var av = (a.course._hourPoints === null || a.course._hourPoints === undefined) ? -1 : a.course._hourPoints;
        var bv = (best.course._hourPoints === null || best.course._hourPoints === undefined) ? -1 : best.course._hourPoints;
        if (av > bv || (av === bv && a.idx > best.idx)) {
          best = a;
        }
      });
      chosen = best;
    }
    if (chosen) {
      /* سقف O6U: توجد محاولة F سابقة للمحاولة المحسوبة، والمحسوبة ناجحة فوق السقف */
      if (system && system.id === 'o6u' && chosen.course._hourPoints !== null &&
          chosen.course._hourPoints > O6U_REPLACEMENT_CAP) {
        var replacedFail = attempts.some(function (a) {
          return a.idx < chosen.idx && isFailAttempt(system, a.course);
        });
        if (replacedFail) {
          chosen.course._hourPoints = O6U_REPLACEMENT_CAP;
          chosen.course._cappedByO6U = true;
        }
      }
      kept.push(chosen);
    }
  });
  kept.sort(function (a, b) { return a.idx - b.idx; });
  return kept.map(function (k) { return k.course; });
}

/*
 * حساب معدل نقطي من مجاميع النقاط والساعات الخام.
 * تُستخدم الدالة نفسها للفصلي (مقررات فصل) وللتراكمي (كل المقررات) —
 * التراكمي أبدًا ليس متوسط المعدلات الفصلية.
 * courses: [{code, inputType, value, hours, semester}]
 * options: {policy, semester: للتصفية على فصل واحد بعد حسم المحاولات عالميًا}
 */
function enrichCourses(system, courses) {
  return courses.map(function (c) {
    var copy = {};
    for (var k in c) copy[k] = c[k];
    copy._assess = assessCourse(system, c);
    copy._hourPoints = (copy._assess.status === 'ok') ? copy._assess.hourPoints : null;
    return copy;
  });
}

/* تجميع محسوم المحاولات: الصالح يدخل المجموع، وغير الصالح يُبلَّغ لا يُبتلع */
function sumResolved(resolved) {
  var totalPoints = 0, totalHours = 0, countedCount = 0, invalid = [];
  resolved.forEach(function (c) {
    if (c._assess.status === 'incomplete') return;
    if (c._assess.status === 'invalid') {
      invalid.push({ code: c.code || '', value: c.value, reason: c._assess.reason });
      return;
    }
    totalPoints += c._hourPoints * c.hours;
    totalHours += c.hours;
    countedCount++;
  });
  return { totalPoints: totalPoints, totalHours: totalHours, countedCount: countedCount, invalid: invalid };
}

function computePointsGPA(system, courses, policy) {
  var enriched = enrichCourses(system, courses);
  var counted = resolveAttempts(enriched, policy || 'last', system);
  var s = sumResolved(counted);
  return {
    gpa: s.totalHours > 0 ? round2(s.totalPoints / s.totalHours) : null,
    rawGpa: s.totalHours > 0 ? s.totalPoints / s.totalHours : null,
    totalPoints: s.totalPoints,
    totalHours: s.totalHours,
    /* إصلاح م-04: «المحسوبة» تعدّ من دخل المجموع فعلًا فقط، لا المستبعَد */
    countedCount: s.countedCount,
    invalid: s.invalid
  };
}

/*
 * معدل فصل واحد (إصلاح م-05): المعدل الفصلي تاريخي كما في كشف درجات الفصل —
 * يُحسب من مقررات الفصل نفسه فقط، وسياسة الإعادة لا تعيد كتابته بأثر رجعي
 * حين تُعاد مادته في فصل لاحق. أثر السياسة (وسقف O6U) محصور في التراكمي.
 * داخل الفصل الواحد تُحسم محاولات الرمز نفسه بالسياسة نفسها.
 */
function computeSemesterGPA(system, allCourses, semesterId, policy) {
  var own = allCourses.filter(function (c) { return c.semester === semesterId; });
  var enriched = enrichCourses(system, own);
  var counted = resolveAttempts(enriched, policy || 'last', system);
  var s = sumResolved(counted);
  return {
    gpa: s.totalHours > 0 ? round2(s.totalPoints / s.totalHours) : null,
    totalPoints: s.totalPoints,
    totalHours: s.totalHours,
    countedCount: s.countedCount,
    invalid: s.invalid
  };
}

/*
 * الأنظمة النسبية: المعدل = مجموع الدرجات ÷ مجموع النهايات العظمى × 100
 * أبدًا لا بمتوسط النسب المئوية للمقررات، وبلا وزن ساعات.
 * courses: [{mark, max}]
 */
function computePercentGPA(system, courses) {
  var sumMarks = 0, sumMax = 0, countedCount = 0, invalid = [];
  courses.forEach(function (c) {
    if (isEmptyValue(c.mark)) return; /* صف لم يُدخل درجته بعد: ليس خطأ */
    if (isEmptyValue(c.max)) {
      invalid.push({ value: c.mark, reason: 'نهاية عظمى ناقصة لمقرر أُدخلت درجته' });
      return;
    }
    if (typeof c.mark !== 'number' || !isFinite(c.mark) || typeof c.max !== 'number' || !isFinite(c.max)) {
      invalid.push({ value: c.mark, reason: 'درجة أو نهاية عظمى ليست رقمًا' });
      return;
    }
    if (c.max <= 0) {
      invalid.push({ value: c.max, reason: 'نهاية عظمى غير صالحة (' + c.max + ') — يجب أن تكون أكبر من صفر' });
      return;
    }
    if (c.mark < 0) {
      invalid.push({ value: c.mark, reason: 'درجة سالبة (' + c.mark + ') مرفوضة' });
      return;
    }
    /* إصلاح م-02: درجة فوق النهاية تُرفض صراحة — لا نسبة >100 ولا تقدير null */
    if (c.mark > c.max) {
      invalid.push({ value: c.mark, reason: 'درجة ' + c.mark + ' أعلى من نهايتها العظمى ' + c.max });
      return;
    }
    sumMarks += c.mark; sumMax += c.max; countedCount++;
  });
  if (sumMax <= 0) {
    return { percent: null, label: null, sumMarks: 0, sumMax: 0, countedCount: 0, invalid: invalid };
  }
  var pct = (sumMarks / sumMax) * 100;
  var band = bandForPercent(system, pct);
  return {
    percent: round2(pct),
    rawPercent: pct,
    /* كل مقرر محسوب درجته ≤ نهايته، فالنسبة في [0،100] والتقدير موجود دائمًا */
    label: band ? (band.label || band.letter) : null,
    sumMarks: sumMarks,
    sumMax: sumMax,
    countedCount: countedCount,
    invalid: invalid
  };
}

/*
 * مخطّط الهدف (قاعدة أ-5): المتوسط المطلوب في الساعات القادمة
 * = [المستهدف × (المنجزة + القادمة) − النقاط المنجزة] ÷ القادمة
 * الاستحالة والتحقق يُعلَنان صراحة — بلا صمت.
 */
function planGoal(system, doneHours, doneGPA, targetGPA, futureHours) {
  /* إصلاح م-08: تحقق مجال كامل — لا سالب ولا فوق حدّ النظام يمرّ بصمت */
  if (typeof doneHours !== 'number' || !isFinite(doneHours) || doneHours < 0) {
    return { status: 'invalid', required: null };
  }
  if (typeof doneGPA !== 'number' || !isFinite(doneGPA) || doneGPA < 0 || doneGPA > system.maxPoints) {
    return { status: 'invalid', required: null };
  }
  if (typeof targetGPA !== 'number' || !isFinite(targetGPA) || targetGPA < 0 || targetGPA > system.maxPoints) {
    return { status: 'invalid', required: null };
  }
  if (!(futureHours > 0)) return { status: 'invalid', required: null };
  var donePoints = doneGPA * doneHours;
  var requiredRaw = (targetGPA * (doneHours + futureHours) - donePoints) / futureHours;
  if (requiredRaw > system.maxPoints + 1e-12) {
    return { status: 'impossible', required: round2(requiredRaw), requiredRaw: requiredRaw };
  }
  if (requiredRaw <= 0) {
    return { status: 'secured', required: 0, requiredRaw: requiredRaw };
  }
  return {
    status: 'feasible',
    required: round2(requiredRaw),
    requiredRaw: requiredRaw,
    belowCurrent: requiredRaw <= doneGPA
  };
}

/*
 * محوّل التقدير: يمرّ بالنسبة المئوية حصرًا (قاعدة 6).
 * عند الإدخال بحرف أو بتقدير لفظي يُمثَّل بمنتصف نطاقه المئوي في نظامه — اصطلاح منتج معلَن.
 */

/*
 * التمثيل النسبي لنطاق واحد — القاعدة الواحدة لكل مسارات المحوّل:
 * منتصف النطاق، إلا أدنى نطاق في النظام فيُمثَّل بحدّه الأدنى.
 * (إصلاح م-09: أدنى نطاق في الأنظمة النقطية هو حرف الرسوب F، نطاقه 0–60؛
 * منتصفه (30%) يهبط في أنظمة هدف بنطاقات رسوب أضيق فيخرج تقديرًا غير راسب
 * لأصلٍ راسب صريح. الاصطلاح المعتمد والمعلَن: الرسوب يُمثَّل بحدّه الأدنى (0%)
 * فيبقى راسبًا في أي نظام هدف.)
 */
function bandRepresentativePercent(system, b) {
  if (system.bands && system.bands[system.bands.length - 1] === b) return b.min;
  return (b.min + b.max) / 2;
}

function letterRepresentativePercent(system, letter) {
  var b = bandForLetter(system, letter);
  if (!b || b.min === undefined) return null;
  return bandRepresentativePercent(system, b);
}

/*
 * التمثيل النسبي لتقدير لفظي في نظام نسبي (إصلاح مسح-1): القاعدة نفسها عبر
 * bandRepresentativePercent — أدنى تقدير في النظام (مثل «راسب» في يمني صنعاء،
 * نطاقه 0–65) يُمثَّل بحدّه الأدنى لا بمنتصفه (32.5%)؛ فالمنتصف كان يخرجه في
 * المصري التقليدي «ضعيف» لا «ضعيف جداً» — الكسر الدلالي نفسه من عائلة م-09،
 * في مسار كان يحسب المنتصف مباشرة في الواجهة متجاوزًا قاعدة المحرك.
 */
function labelRepresentativePercent(system, label) {
  for (var i = 0; i < system.bands.length; i++) {
    if (system.bands[i].label === label) return bandRepresentativePercent(system, system.bands[i]);
  }
  return null;
}

function convertGrade(fromSystem, toSystem, input) {
  var pct;
  if (input.inputType === 'percent') {
    pct = input.value;
  } else if (input.inputType === 'letter') {
    pct = letterRepresentativePercent(fromSystem, input.value);
    if (pct === null) return null;
  } else if (input.inputType === 'label') {
    pct = labelRepresentativePercent(fromSystem, input.value);
    if (pct === null) return null;
  } else {
    return null;
  }
  var targetBand = bandForPercent(toSystem, pct);
  if (!targetBand) return null;
  return {
    percent: pct,
    targetBand: targetBand,
    targetLetter: targetBand.letter || null,
    targetLabel: targetBand.label || null,
    targetPoints: (targetBand.points !== undefined) ? targetBand.points : null
  };
}

var MuaddaliCore = {
  SYSTEMS: SYSTEMS,
  POINT_SYSTEMS: POINT_SYSTEMS,
  PERCENT_SYSTEMS: PERCENT_SYSTEMS,
  round2: round2,
  bandForPercent: bandForPercent,
  bandForLetter: bandForLetter,
  courseHourPoints: courseHourPoints,
  assessCourse: assessCourse,
  resolveAttempts: resolveAttempts,
  computePointsGPA: computePointsGPA,
  computeSemesterGPA: computeSemesterGPA,
  computePercentGPA: computePercentGPA,
  planGoal: planGoal,
  letterRepresentativePercent: letterRepresentativePercent,
  labelRepresentativePercent: labelRepresentativePercent,
  convertGrade: convertGrade
};

if (typeof module !== 'undefined' && module.exports) {
  module.exports = MuaddaliCore;
}
if (typeof window !== 'undefined') {
  window.MuaddaliCore = MuaddaliCore;
}
