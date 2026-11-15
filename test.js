/*
 * معدّلي — اختبارات القبول الآلية ضد دوال core.js نفسها (لا نسخة حساب موازية).
 * التشغيل: node test.js — يطبع جدول النتائج ويخرج برمز 1 عند أي فشل.
 *
 * ملاحظة توثيقية مهمة: ملف مجموعة البيانات على القرص (11-grading-systems.md)
 * منقوص — ينتهي منتصف قاعدة التحويل 6 بعلامة اقتطاع حرفية، وقسم الأمثلة
 * المحلولة غير موجود فيه. لذلك أُعيد بناء مدخلات الأمثلة الخمسة هنا من
 * النتائج المتوقعة الموثّقة في تسليم فرع البحث (4.44 / 2.51 / 81.25% /
 * 2.22 / 3.80)، وكل مدخل مُتحقَّق منه بحساب يدوي مستقل في تعليقه،
 * ولا يُدَّعى أنها المدخلات الأصلية حرفيًا.
 */
'use strict';

var core = require('./core.js');
var S = core.SYSTEMS;

var results = [];
function check(id, name, actual, expected) {
  var ok = (actual === expected) ||
    (typeof actual === 'number' && typeof expected === 'number' && Math.abs(actual - expected) < 1e-9);
  results.push({ id: id, name: name, expected: expected, actual: actual, ok: ok });
}
function L(letter, hours, semester, code) {
  return { inputType: 'letter', value: letter, hours: hours, semester: semester || 's1', code: code || '' };
}
function P(pct, hours, semester, code) {
  return { inputType: 'percent', value: pct, hours: hours, semester: semester || 's1', code: code || '' };
}
function PT(points, hours, semester, code) {
  return { inputType: 'points', value: points, hours: hours, semester: semester || 's1', code: code || '' };
}

/* ===== المثال 1 (مُعاد بناؤه): سعودي 5.00 — معدل فصلي = 4.44 =====
 * A+ ‏4س: 5.00×4=20.00 | A ‏4س: 4.75×4=19.00 | B ‏4س: 4.00×4=16.00 | B ‏4س: 16.00
 * المجموع 71.00 ÷ 16 ساعة = 4.4375 ← 4.44 */
(function () {
  var r = core.computePointsGPA(S.saudi5, [L('A+', 4), L('A', 4), L('B', 4), L('B', 4)], 'all');
  check('مثال-1', 'سعودي 5.00 فصلي', r.gpa, 4.44);
})();

/* ===== المثال 2 (مُعاد بناؤه) + فخ متوسط الفصليين: KFUPM تراكمي = 2.51 =====
 * فصل1 (12س): A ‏3س=11.25، B+ ‏3س=10.50، B ‏3س=9.00، D ‏3س=3.00 → 33.75 (فصلي 2.8125)
 * فصل2 (18س): A ‏4س=15.00، B+ ‏4س=14.00، C+ ‏3س=7.50، D+ ‏2س=3.00، D ‏2س=2.00، F ‏3س=0 → 41.50 (فصلي 2.3056)
 * التراكمي من الخام: 75.25 ÷ 30 = 2.5083 ← 2.51
 * المتوسط الساذج: (2.8125 + 2.3056) ÷ 2 = 2.5590 ← 2.56 (خطأ موثّق) */
(function () {
  var courses = [
    L('A', 3, 's1'), L('B+', 3, 's1'), L('B', 3, 's1'), L('D', 3, 's1'),
    L('A', 4, 's2'), L('B+', 4, 's2'), L('C+', 3, 's2'), L('D+', 2, 's2'), L('D', 2, 's2'), L('F', 3, 's2')
  ];
  var cum = core.computePointsGPA(S.saudi4, courses, 'all');
  check('مثال-2', 'KFUPM تراكمي بفصلين (فيه F)', cum.gpa, 2.51);
  var s1 = core.computeSemesterGPA(S.saudi4, courses, 's1', 'all');
  var s2 = core.computeSemesterGPA(S.saudi4, courses, 's2', 'all');
  check('مثال-2/ف1', 'KFUPM فصلي أول', s1.gpa, 2.81);
  check('مثال-2/ف2', 'KFUPM فصلي ثانٍ', s2.gpa, 2.31);
  var naive = core.round2((s1.gpa + s2.gpa) / 2);
  check('فخ-المتوسط', 'المتوسط الساذج للفصليين (يجب أن يختلف عن التراكمي)', naive, 2.56);
  check('فخ-المتوسط/اختلاف', 'التراكمي ≠ المتوسط الساذج', cum.gpa !== naive, true);
})();

/* ===== المثال 3 (مُعاد بناؤه) + فخ متوسط النسب: يمني صنعاء = 81.25% «جيد جداً» =====
 * الدرجات: 95/100، 44/50، 41/50، 76/100، 35/50، 34/50
 * المجموع: 325 ÷ 400 = 81.25% ← جيد جداً (80–89 بصيغة الدبلوم الموثّقة)
 * متوسط النسب الساذج: (95+88+82+76+70+68) ÷ 6 = 79.83% ← «جيد» (خطأ موثّق) */
(function () {
  var courses = [
    { mark: 95, max: 100 }, { mark: 44, max: 50 }, { mark: 41, max: 50 },
    { mark: 76, max: 100 }, { mark: 35, max: 50 }, { mark: 34, max: 50 }
  ];
  var r = core.computePercentGPA(S.yemenSanaaA, courses);
  check('مثال-3', 'يمني صنعاء — النسبة التراكمية', r.percent, 81.25);
  check('مثال-3/تقدير', 'يمني صنعاء — التقدير', r.label, 'جيد جداً');
  var naivePct = core.round2((95 + 88 + 82 + 76 + 70 + 68) / 6);
  check('فخ-النسب', 'متوسط النسب الساذج (يجب أن يختلف)', naivePct, 79.83);
  var naiveBand = core.bandForPercent(S.yemenSanaaA, naivePct);
  check('فخ-النسب/تقدير', 'تقدير المتوسط الساذج', naiveBand.label, 'جيد');
})();

/* ===== المثال 4 (مُعاد بناؤه): O6U فصلي بحدود فاصلة (84، 68، 59) = 2.22 =====
 * إدخال بالنسب: 84←B+ ‏(3.30)، 68←C- ‏(1.70)، 59←F ‏(0.00)، 95←A ‏(4.00)، 74←C+ ‏(2.30)، 71←C ‏(2.00)
 * كل مقرر 3 ساعات: المجموع 39.90 ÷ 18 = 2.2167 ← 2.22 */
(function () {
  check('مثال-4/حد84', 'O6U: 84 ← B+', core.bandForPercent(S.o6u, 84).letter, 'B+');
  check('مثال-4/حد68', 'O6U: 68 ← C-', core.bandForPercent(S.o6u, 68).letter, 'C-');
  check('مثال-4/حد59', 'O6U: 59 ← F', core.bandForPercent(S.o6u, 59).letter, 'F');
  var r = core.computePointsGPA(S.o6u,
    [P(84, 3), P(68, 3), P(59, 3), P(95, 3), P(74, 3), P(71, 3)], 'all');
  check('مثال-4', 'O6U فصلي بحدود فاصلة', r.gpa, 2.22);
})();

/* ===== المثال 5 (مُعاد بناؤه): مخطّط هدف — قطر، مطلوب 3.80 في 15 ساعة لبلوغ 3.00 =====
 * منجز: 30 ساعة بتراكمي 2.60 (78.00 نقطة). المطلوب = [3.00×45 − 78] ÷ 15 = 3.80 */
(function () {
  var r = core.planGoal(S.qatar, 30, 2.60, 3.00, 15);
  check('مثال-5', 'مخطط هدف قطر — المطلوب', r.required, 3.80);
  check('مثال-5/حالة', 'مخطط هدف قطر — الحالة', r.status, 'feasible');
})();

/* ===== فخ F في عمود 5.00: قيمتها 1.00 لا 0.00 ===== */
(function () {
  var onlyF = core.computePointsGPA(S.saudi5, [L('F', 3)], 'all');
  check('فخ-F5', 'سعودي 5.00: مقرر F وحده', onlyF.gpa, 1.00);
  var mixed = core.computePointsGPA(S.saudi5, [L('A+', 3), L('F', 3)], 'all');
  check('فخ-F5/مختلط', 'سعودي 5.00: ‏A+ مع F', mixed.gpa, 3.00);
  var f4 = core.computePointsGPA(S.saudi4, [L('F', 3)], 'all');
  check('فخ-F5/مقابل', 'سعودي 4.00: مقرر F وحده (صفر)', f4.gpa, 0.00);
})();

/* ===== اختبارات تغطية مستقلة ===== */
(function () {
  check('تغطية-سعودي4', 'سعودي 4.00: ‏A+ ‏3س + B ‏3س', core.computePointsGPA(S.saudi4, [L('A+', 3), L('B', 3)], 'all').gpa, 3.50);
  check('تغطية-قطر', 'قطر: A ‏3س + B+ ‏3س', core.computePointsGPA(S.qatar, [L('A', 3), L('B+', 3)], 'all').gpa, 3.75);
  check('تغطية-قطر-لاA+', 'قطر: 95% ← A (لا A+ في النظام)', core.bandForPercent(S.qatar, 95).letter, 'A');
  var eg = core.computePercentGPA(S.egyptTrad, [{ mark: 170, max: 200 }, { mark: 130, max: 200 }]);
  check('تغطية-مصري-تقليدي', 'مصري تقليدي: 300/400', eg.percent, 75.00);
  check('تغطية-مصري-تقليدي/تقدير', 'مصري تقليدي: التقدير', eg.label, 'جيد جداً');
  check('تغطية-يمني-حد65', 'يمني صنعاء: 65/100 ← مقبول', core.computePercentGPA(S.yemenSanaaA, [{ mark: 65, max: 100 }]).label, 'مقبول');
  check('تغطية-يمني-حد64', 'يمني صنعاء: 64/100 ← راسب', core.computePercentGPA(S.yemenSanaaA, [{ mark: 64, max: 100 }]).label, 'راسب');
  check('تغطية-حد95', 'سعودي 4.00: 95 ← A+', core.bandForPercent(S.saudi4, 95).letter, 'A+');
  check('تغطية-حد94.99', 'سعودي 4.00: 94.99 ← A', core.bandForPercent(S.saudi4, 94.99).letter, 'A');
  check('تغطية-حد60', 'سعودي 4.00: 60 ← D', core.bandForPercent(S.saudi4, 60).letter, 'D');
  check('تغطية-حد59.99', 'سعودي 4.00: 59.99 ← F', core.bandForPercent(S.saudi4, 59.99).letter, 'F');
  check('تغطية-قبل-التقريب', 'المقارنة بالنطاق قبل التقريب: 84.999 ← B لا B+', core.bandForPercent(S.saudi4, 84.999).letter, 'B');
  /* المحوّل عبر النسبة */
  check('محوّل-90-سعودي4', 'محوّل: 90% ← سعودي 4.00 نقاط', core.convertGrade(S.saudi4, S.saudi4, { inputType: 'percent', value: 90 }).targetPoints, 3.75);
  check('محوّل-90-قطر', 'محوّل: 90% ← قطر نقاط', core.convertGrade(S.saudi4, S.qatar, { inputType: 'percent', value: 90 }).targetPoints, 4.00);
  check('محوّل-90-سعودي5', 'محوّل: 90% ← سعودي 5.00 نقاط', core.convertGrade(S.saudi4, S.saudi5, { inputType: 'percent', value: 90 }).targetPoints, 4.75);
  check('محوّل-90-O6U', 'محوّل: 90% ← O6U حرف', core.convertGrade(S.saudi4, S.o6u, { inputType: 'percent', value: 90 }).targetLetter, 'A-');
  check('محوّل-90-مصري', 'محوّل: 90% ← مصري تقليدي', core.convertGrade(S.saudi4, S.egyptTrad, { inputType: 'percent', value: 90 }).targetLabel, 'ممتاز');
  check('محوّل-حرف', 'محوّل بحرف: B سعودي4 (منتصف 82.5) ← O6U', core.convertGrade(S.saudi4, S.o6u, { inputType: 'letter', value: 'B' }).targetLetter, 'B');
  /* مخطّط الهدف: استحالة وتحقّق */
  var imp = core.planGoal(S.qatar, 30, 1.50, 3.50, 15);
  check('هدف-مستحيل', 'هدف مستحيل حسابيًا يُعلَن', imp.status, 'impossible');
  check('هدف-مستحيل/قيمة', 'المطلوب المستحيل', imp.required, 7.50);
  var sec = core.planGoal(S.qatar, 30, 3.90, 2.50, 15);
  check('هدف-متحقق', 'هدف متحقق سلفًا يُعلَن', sec.status, 'secured');
  /* سياسات الإعادة */
  var attempts = [L('F', 3, 's1', 'MATH101'), L('B', 3, 's2', 'MATH101'), L('A', 3, 's2', 'ENG101')];
  check('إعادة-أخيرة', 'إعادة: الأخيرة فقط', core.computePointsGPA(S.saudi4, attempts, 'last').gpa, 3.38);
  check('إعادة-الكل', 'إعادة: كل المحاولات', core.computePointsGPA(S.saudi4, attempts, 'all').gpa, 2.25);
  check('إعادة-الأعلى', 'إعادة: الأعلى فقط', core.computePointsGPA(S.saudi4, attempts, 'best').gpa, 3.38);
  /* الرموز الإدارية الموثّقة */
  check('رمز-DN5', 'سعودي 5.00: DN يدخل بـ 1.00', core.computePointsGPA(S.saudi5, [L('DN', 3)], 'all').gpa, 1.00);
  check('رمز-DN4', 'سعودي 4.00: DN يدخل بصفر', core.computePointsGPA(S.saudi4, [L('DN', 3)], 'all').gpa, 0.00);
})();

/* ===== اختبارات إصلاح ملاحظات التدقيق المستقل (21-audit-findings.md) =====
 * كل اختبار هنا بحالة المدقق نفسها ورقم ملاحظته — إثبات إصلاح لا تغطية عامة. */

/* م-01: نقاط مباشرة خارج [0، حد النظام] تُرفض صراحة ولا تدخل الحساب */
(function () {
  var over = core.computePointsGPA(S.saudi4, [PT(10, 3)], 'all');
  check('م-01/فوق-الحد', 'نقاط 10 في نظام 4.00: لا معدل', over.gpa, null);
  check('م-01/فوق-الحد/تنبيه', 'نقاط 10: تُبلَّغ invalid', over.invalid.length, 1);
  check('م-01/فوق-الحد/عدّ', 'نقاط 10: المحسوبة 0', over.countedCount, 0);
  var neg = core.computePointsGPA(S.saudi4, [PT(-2, 3)], 'all');
  check('م-01/سالب', 'نقاط −2: لا معدل', neg.gpa, null);
  check('م-01/سالب/تنبيه', 'نقاط −2: تُبلَّغ invalid', neg.invalid.length, 1);
  var mixed = core.computePointsGPA(S.saudi4, [PT(9, 3), L('B', 3)], 'all');
  check('م-01/مختلط', 'حالة المدقق {9نقاط×3س + B×3س}: معدل B وحده', mixed.gpa, 3.00);
  check('م-01/مختلط/عدّ', 'المختلط: المحسوبة 1 لا 2', mixed.countedCount, 1);
  var atMax = core.computePointsGPA(S.saudi4, [PT(4, 3)], 'all');
  check('م-01/عند-الحد', 'نقاط = حد النظام تمامًا: صالحة', atMax.gpa, 4.00);
  check('م-01/عند-الحد/بلا-تنبيه', 'عند الحد: لا تنبيه', atMax.invalid.length, 0);
  check('م-01/صفر', 'نقاط 0: صالحة (معدل 0)', core.computePointsGPA(S.saudi4, [PT(0, 3)], 'all').gpa, 0.00);
  check('م-01/تقييم', 'assessCourse: ‏4.01 في 4.00 invalid', core.assessCourse(S.saudi4, PT(4.01, 3)).status, 'invalid');
})();

/* م-02: درجة فوق النهاية العظمى تُرفض — لا نسبة >100 ولا تقدير null */
(function () {
  var over = core.computePercentGPA(S.egyptTrad, [{ mark: 120, max: 100 }]);
  check('م-02/فوق-النهاية', 'درجة 120/100 وحدها: لا نسبة', over.percent, null);
  check('م-02/فوق-النهاية/تنبيه', 'درجة 120/100: تُبلَّغ invalid', over.invalid.length, 1);
  var mixed = core.computePercentGPA(S.egyptTrad, [{ mark: 120, max: 100 }, { mark: 85, max: 100 }]);
  check('م-02/مختلط', 'مع صالح 85/100: النسبة 85', mixed.percent, 85.00);
  check('م-02/مختلط/تقدير', 'التقدير موجود لا null', mixed.label, 'ممتاز');
  check('م-02/مختلط/عدّ', 'المحسوبة 1', mixed.countedCount, 1);
  check('م-02/كامل', '100/100: التقدير ممتاز', core.computePercentGPA(S.egyptTrad, [{ mark: 100, max: 100 }]).label, 'ممتاز');
})();

/* م-03: مطابقة الإعادة غير حسّاسة لحالة أحرف الرمز */
(function () {
  var attempts = [L('F', 3, 's1', 'math101'), L('A+', 3, 's2', 'MATH101')];
  check('م-03/حالة-مختلفة', 'math101 ثم MATH101 بسياسة الأخيرة: إعادة واحدة', core.computePointsGPA(S.saudi4, attempts, 'last').gpa, 4.00);
  check('م-03/الكل', 'نفس الرمزين بسياسة الكل: محاولتان', core.computePointsGPA(S.saudi4, attempts, 'all').gpa, 2.00);
  var spaced = [L('F', 3, 's1', ' Math101 '), L('B', 3, 's2', 'MATH101')];
  check('م-03/مسافات', 'مسافات طرفية وحالة مختلفة: إعادة واحدة', core.computePointsGPA(S.saudi4, spaced, 'last').gpa, 3.00);
})();

/* م-04: لا استبعاد صامت — كل خارج عن المجال يُبلَّغ، والعدّاد يعدّ المحسوب فقط */
(function () {
  var pctOver = core.computePointsGPA(S.saudi4, [P(150, 3), L('B', 3)], 'all');
  check('م-04/نسبة150', 'نسبة 150% كمقرر نقطي: معدل B وحده', pctOver.gpa, 3.00);
  check('م-04/نسبة150/تنبيه', 'نسبة 150%: تُبلَّغ', pctOver.invalid.length, 1);
  check('م-04/نسبة150/عدّ', 'نسبة 150%: المحسوبة 1 (حالة المدقق: كانت 2)', pctOver.countedCount, 1);
  var pctNeg = core.computePointsGPA(S.saudi4, [P(-10, 3), L('B', 3)], 'all');
  check('م-04/نسبة-سالبة', 'نسبة −10%: تُبلَّغ ولا تدخل', pctNeg.invalid.length, 1);
  var hrsNeg = core.computePointsGPA(S.saudi4, [L('A', -3), L('B', 3)], 'all');
  check('م-04/ساعات-سالبة', 'ساعات −3 مع صالح: معدل الصالح فقط', hrsNeg.gpa, 3.00);
  check('م-04/ساعات-سالبة/تنبيه', 'ساعات −3: تُبلَّغ', hrsNeg.invalid.length, 1);
  var hrsZero = core.computePointsGPA(S.saudi4, [L('A', 0), L('B', 3)], 'all');
  check('م-04/ساعات-صفر', 'ساعات 0 مع تقدير: تُبلَّغ', hrsZero.invalid.length, 1);
  var markNeg = core.computePercentGPA(S.egyptTrad, [{ mark: -5, max: 100 }, { mark: 85, max: 100 }]);
  check('م-04/درجة-سالبة', 'درجة −5 في النسبي: تُبلَّغ وتُستبعد بصراحة', markNeg.invalid.length, 1);
  check('م-04/درجة-سالبة/نسبة', 'النسبة من الصالح وحده', markNeg.percent, 85.00);
  var incomplete = core.computePointsGPA(S.saudi4, [L('', 3)], 'all');
  check('م-04/صف-فارغ', 'صف حرف فارغ: لا معدل ولا تنبيه (غير مملوء، لا خاطئ)', incomplete.invalid.length, 0);
  var incompletePct = core.computePercentGPA(S.egyptTrad, [{ mark: '', max: 100 }]);
  check('م-04/صف-نسبي-فارغ', 'صف نسبي فارغ: لا تنبيه', incompletePct.invalid.length, 0);
})();

/* م-05: المعدل الفصلي تاريخي — الإعادة اللاحقة لا تعيد كتابته */
(function () {
  var attempts = [L('F', 3, 's1', 'MATH101'), L('A+', 3, 's2', 'MATH101')];
  var s1 = core.computeSemesterGPA(S.saudi4, attempts, 's1', 'last');
  check('م-05/فصل-أصلي', 'فصل الـF بسياسة الأخيرة: فصلي 0.00 تاريخي لا null', s1.gpa, 0.00);
  var s2 = core.computeSemesterGPA(S.saudi4, attempts, 's2', 'last');
  check('م-05/فصل-الإعادة', 'فصل الإعادة: فصلي 4.00', s2.gpa, 4.00);
  check('م-05/تراكمي', 'التراكمي وحده يتأثر بالسياسة: 4.00', core.computePointsGPA(S.saudi4, attempts, 'last').gpa, 4.00);
})();

/* م-06: سقف B+ ‏(3.30) لدرجة O6U المستبدَلة بعد رسوب F — قاعدة اللائحة الموثّقة */
(function () {
  var retake = [L('F', 3, 's1', 'CS101'), L('A', 3, 's2', 'CS101')];
  check('م-06/سقف', 'O6U: ‏F ثم A بسياسة الأخيرة ← 3.30 لا 4.00', core.computePointsGPA(S.o6u, retake, 'last').gpa, 3.30);
  check('م-06/سقف-الأعلى', 'O6U: ‏F ثم A بسياسة الأعلى ← 3.30 أيضًا', core.computePointsGPA(S.o6u, retake, 'best').gpa, 3.30);
  check('م-06/دون-السقف', 'O6U: ‏F ثم B ‏(3.00 دون السقف) تبقى 3.00', core.computePointsGPA(S.o6u, [L('F', 3, 's1', 'CS101'), L('B', 3, 's2', 'CS101')], 'last').gpa, 3.00);
  check('م-06/بلا-رسوب', 'O6U: ‏A بلا إعادة رسوب سابقة ← 4.00 كاملة', core.computePointsGPA(S.o6u, [L('A', 3)], 'all').gpa, 4.00);
  check('م-06/تحسين-لا-سقف', 'O6U: تحسين D ثم A (لا رسوب) ← 4.00 بلا سقف', core.computePointsGPA(S.o6u, [L('D', 3, 's1', 'CS101'), L('A', 3, 's2', 'CS101')], 'last').gpa, 4.00);
  check('م-06/رسوب-بنسبة', 'O6U: رسوب بإدخال نسبي 50% ثم A ← 3.30', core.computePointsGPA(S.o6u, [P(50, 3, 's1', 'CS101'), L('A', 3, 's2', 'CS101')], 'last').gpa, 3.30);
  check('م-06/نظام-آخر', 'سعودي 4.00: ‏F ثم A+ بلا سقف ← 4.00', core.computePointsGPA(S.saudi4, [L('F', 3, 's1', 'CS101'), L('A+', 3, 's2', 'CS101')], 'last').gpa, 4.00);
})();

/* م-07: القرار من الخام دائمًا — والفصل بين قرار الخام وعرض المقرّب موثّق */
(function () {
  var r = core.computePercentGPA(S.egyptTrad, [{ mark: 84996, max: 100000 }]);
  check('م-07/نسبة-حدّية', '84.996%: العرض يقرّب إلى 85.00', r.percent, 85.00);
  check('م-07/تقدير-الخام', '84.996%: التقدير من الخام «جيد جداً» لا «ممتاز»', r.label, 'جيد جداً');
  var g = core.planGoal(S.qatar, 10, 3.00, 3.502, 10);
  check('م-07/هدف-حدّي/حالة', 'مطلوب خام 4.004 في قطر: مستحيل', g.status, 'impossible');
  check('م-07/هدف-حدّي/خام', 'المطلوب الخام فوق الحد فعلًا (لعرض 3 منازل في الواجهة)', g.requiredRaw > 4.00, true);
  check('م-07/هدف-حدّي/عرض', 'المطلوب المقرّب 4.00 — موضع تناقض العرض الذي عولج', g.required, 4.00);
})();

/* م-08: مخطّط الهدف يرفض السالب وفوق-الحد صراحة بحالة invalid */
(function () {
  check('م-08/فوق-الحد', 'معدل حالي 9.9 في قطر (حالة المدقق): invalid', core.planGoal(S.qatar, 30, 9.9, 3.0, 15).status, 'invalid');
  check('م-08/سالبان', 'حالي −1 ومستهدف −0.5 (حالة المدقق): invalid', core.planGoal(S.qatar, 30, -1, -0.5, 15).status, 'invalid');
  check('م-08/مستهدف-سالب', 'مستهدف سالب وحده: invalid', core.planGoal(S.qatar, 30, 2.5, -0.5, 15).status, 'invalid');
  check('م-08/ساعات-سالبة', 'ساعات منجزة سالبة: invalid', core.planGoal(S.qatar, -5, 2.5, 3.0, 15).status, 'invalid');
  check('م-08/صالح-يبقى', 'قيم صالحة: feasible كما كان', core.planGoal(S.qatar, 30, 2.60, 3.00, 15).status, 'feasible');
})();

/* م-09: حرف الرسوب F يبقى راسبًا عند التحويل لأي نظام */
(function () {
  check('م-09/تمثيل-F', 'تمثيل F النسبي: 0% لا منتصف 30%', core.letterRepresentativePercent(S.saudi4, 'F'), 0);
  check('م-09/F-لمصري', 'F سعودي4 ← مصري تقليدي: «ضعيف جداً» لا «ضعيف»', core.convertGrade(S.saudi4, S.egyptTrad, { inputType: 'letter', value: 'F' }).targetLabel, 'ضعيف جداً');
  check('م-09/F-لقطر', 'F سعودي4 ← قطر: F', core.convertGrade(S.saudi4, S.qatar, { inputType: 'letter', value: 'F' }).targetLetter, 'F');
  check('م-09/F5-لسعودي4', 'F سعودي5 ← سعودي4: F بصفر', core.convertGrade(S.saudi5, S.saudi4, { inputType: 'letter', value: 'F' }).targetPoints, 0.00);
  check('م-09/غير-F-ثابت', 'B سعودي4: منتصف 82.5 كما كان', core.letterRepresentativePercent(S.saudi4, 'B'), 82.5);
})();

/* مسح-1 (ملاحظة المسح الختامي في 23-closure-verification.md): التحويل اللفظي من الأنظمة
 * النسبية كان يحسب منتصف النطاق في الواجهة متجاوزًا قاعدة م-09 — «راسب» صنعاء (أدنى نطاق،
 * 0–65) بمنتصفه 32.5% يخرج «ضعيف» في المصري التقليدي لا أدنى تقديراته «ضعيف جداً» */
(function () {
  check('مسح-1/تمثيل-راسب', 'تمثيل «راسب» صنعاء النسبي: 0% لا منتصف 32.5%', core.labelRepresentativePercent(S.yemenSanaaA, 'راسب'), 0);
  check('مسح-1/راسب-لمصري', '«راسب» صنعاء ← مصري تقليدي: «ضعيف جداً» لا «ضعيف» (حالة المدقق)', core.convertGrade(S.yemenSanaaA, S.egyptTrad, { inputType: 'label', value: 'راسب' }).targetLabel, 'ضعيف جداً');
  check('مسح-1/راسب-لنقطي', '«راسب» صنعاء ← سعودي 4.00: F', core.convertGrade(S.yemenSanaaA, S.saudi4, { inputType: 'label', value: 'راسب' }).targetLetter, 'F');
  check('مسح-1/أدنى-مصري', '«ضعيف جداً» مصري تقليدي (أدنى نطاقه) ← صنعاء: «راسب»', core.convertGrade(S.egyptTrad, S.yemenSanaaA, { inputType: 'label', value: 'ضعيف جداً' }).targetLabel, 'راسب');
  check('مسح-1/غير-الأدنى-ثابت', '«مقبول» صنعاء: منتصف 70 كما كان ← مصري تقليدي «جيد»', core.convertGrade(S.yemenSanaaA, S.egyptTrad, { inputType: 'label', value: 'مقبول' }).targetLabel, 'جيد');
  check('مسح-1/تقدير-مجهول', 'تقدير لفظي غير موجود في النظام: null لا تحويل', core.convertGrade(S.yemenSanaaA, S.egyptTrad, { inputType: 'label', value: 'غير موجود' }), null);
})();

/* ===== الطباعة والحكم ===== */
var failed = 0;
console.log('المعرّف | الاختبار | المتوقع | الفعلي | الحكم');
results.forEach(function (r) {
  if (!r.ok) failed++;
  console.log([r.id, r.name, r.expected, r.actual, r.ok ? 'ناجح' : 'فاشل'].join(' | '));
});
console.log('المجموع: ' + results.length + ' — ناجح: ' + (results.length - failed) + ' — فاشل: ' + failed);
process.exit(failed > 0 ? 1 : 0);
