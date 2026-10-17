'use client';

import React, { useState, useEffect, useMemo } from 'react';
import { 
  X, 
  Printer, 
  CheckSquare, 
  Plus, 
  Trash2, 
  Calculator, 
  Globe,
  MapPin,
  Phone,
  Sparkles,
  TrendingDown,
  Layers,
  Award,
  CheckCircle2,
  QrCode
} from 'lucide-react';

function formatNum(val: number | string): string {
  const n = Number(val) || 0;
  return n.toLocaleString('en-US');
}

function numberToArabicWords(num: number): string {
  if (isNaN(num) || num === 0) return 'صفر دينار عراقي';
  const ones = ['', 'واحد', 'اثنان', 'ثلاثة', 'أربعة', 'خمسة', 'ستة', 'سبعة', 'ثمانية', 'تسعة'];
  const tens = ['', 'عشرة', 'عشرون', 'ثلاثون', 'أربعون', 'خمسون', 'ستون', 'سبعون', 'ثمانون', 'تسعون'];
  const teens = ['عشرة', 'أحد عشر', 'اثنا عشر', 'ثلاثة عشر', 'أربعة عشر', 'خمسة عشر', 'ستة عشر', 'سبعة عشر', 'ثمانية عشر', 'تسعة عشر'];
  const hundreds = ['', 'مائة', 'مائتان', 'ثلاثمائة', 'أربعمائة', 'خمسمائة', 'ستمائة', 'سبعمائة', 'ثمانمائة', 'تسعمائة'];

  function convertGroup(n: number): string {
    let out = '';
    const h = Math.floor(n / 100);
    const rem = n % 100;
    const t = Math.floor(rem / 10);
    const o = rem % 10;
    if (h > 0) out += hundreds[h];
    if (rem > 0) {
      if (out !== '') out += ' و';
      if (rem >= 10 && rem <= 19) out += teens[rem - 10];
      else {
        if (o > 0) out += ones[o];
        if (o > 0 && t > 0) out += ' و';
        if (t > 0) out += tens[t];
      }
    }
    return out;
  }

  const intNum = Math.floor(num);
  const billions = Math.floor(intNum / 1000000000);
  const millions = Math.floor((intNum % 1000000000) / 1000000);
  const thousands = Math.floor((intNum % 1000000) / 1000);
  const remainder = intNum % 1000;

  const parts: string[] = [];
  if (billions > 0) parts.push(billions === 1 ? 'مليار' : billions === 2 ? 'ملياران' : convertGroup(billions) + ' مليار');
  if (millions > 0) parts.push(millions === 1 ? 'مليون' : millions === 2 ? 'مليونان' : convertGroup(millions) + ' مليون');
  if (thousands > 0) parts.push(thousands === 1 ? 'ألف' : thousands === 2 ? 'ألفان' : convertGroup(thousands) + ' ألف');
  if (remainder > 0) parts.push(convertGroup(remainder));

  return `فقط ${parts.join(' و')} دينار عراقي لا غير`;
}

function calculateRows(text: string): number {
  if (!text) return 2;
  const lines = text.split('\n');
  let count = 0;
  for (const line of lines) {
    count += Math.max(1, Math.ceil(line.length / 42));
  }
  return Math.max(2, count);
}

const OFFICIAL_TENDER_TEMPLATES = [
  { id: 1, name: 'تهيئة الموقع: يشمل العمل إزالة المعوقات وتخطيط الموقع وقشط الارض الطبيعية وحسب المنسوب التصميمي في المخططات مع اسناد جوانب الحفر وسحب المياه الجوفية وإزالة الأنقاض خارج الموقع وحسب توجيهات المهندس المشرف', unit: 'قطعي', calcType: 'FIXED_1', prices: { low: 1000000, medium: 1500000, high: 2200000 } },
  { id: 2, name: 'تجهيز المواد والمعدات والقيام بأعمال تجهيز طبقة من الحصى الخابط نوع (B) على ان لا تزيد سمك الطبقة عن 25 سم وصولا الى المنسوب المطلوب مع الرش الجيد بالماء والحدل الجيد بنسبة حدل 95% ورش مادة الكلوردين (دورسبان) وحسب توجيه المهندس المشرف', unit: 'م3', calcType: 'SUBBASE', prices: { low: 16000, medium: 20000, high: 26000 } },
  { id: 3, name: 'الاعمال الكونكريتية: تجهيز المواد والمعدات والقيام بصب الاساس الحصيري وحسب المخططات الانشائية باستخدام الكونكريت بنسبة خلط (4:2:1) على ان يكون حديد التسليح من النوعية الجيدة والناجحة في الفحوصات المختبرية مع مراعاة الصقل والانهاء لوجه الصبة الخرسانية مع كل ما يلزم لعمل متكامل بما فيها استخدام الهزاز في كل مراحل الصب والرش الجيد المستمر بعد اعمال الصب ويشمل العمل الطلاء بالمواد القيرية للأسطح الملامسة للتربة وحسب المخططات التصميمية وتوجيهات المهندس المشرف', unit: 'م3', calcType: 'RAFT_CONCRETE', prices: { low: 160000, medium: 185000, high: 225000 } },
  { id: 4, name: 'صب كونكريت الجسور والسقوف والسلالم وسقف البيتونة بسمك 20 سم للسقوف وبأبعاد 25*30سم بالنسبة للجسور وبمقاومة انضغاط 25MPa وحسب التفاصيل المبينة في المخططات الانشائية شاملا كل ما يلزم لعمل متكامل بما فيها استخدام الهزاز في كل مراحل الصب والرش الجيد والمستمر بعد اعمال الصب وحسب المواصفات وتوجيهات المهندس المشرف', unit: 'م3', calcType: 'SLABS_CONCRETE', prices: { low: 180000, medium: 210000, high: 250000 } },
  { id: 5, name: 'البناء بالطابوق: تجهيز كل ما يلزم من مواد ومعدات وايدي عامله واية متطلبات اخرى والبناء بالطابوق الناجح في الفحوصات المختبرية ومونة الاسمنت بنسبة 3:1 سمك 24سم للقواطع الخارجية والداخلية شاملا العمل الرش المستمر مع مراعاة الاستقامة الشاقولية وحسب المخططات الانشائية والمواصفات الفنية وتوجيهات المهندس المشرف (للجدران الداخلية والخارجية بارتفاع 3م ليكون الارتفاع الكلي مع الجسر 3.3م، وللمناور بارتفاع 2.0م، وللستارة 1.6م، والجدار الخارجي 2.0م)', unit: 'م3', calcType: 'BRICKWORK', prices: { low: 150000, medium: 175000, high: 210000 } },
  { id: 6, name: 'الإنهاءات: تجهيز المواد والعمل على اللبخ بمونة الاسمنت والرمل وبنسبة خلط (3:1) للجدران الداخلية مع مراعاة الاستقامات والاستوائية والمساطر والاركان ومن ثم الانهاء بالمخمر (البياض) وحسب توجيهات المهندس المشرف', unit: 'م2', calcType: 'PLASTER_INTERNAL', prices: { low: 7500, medium: 9000, high: 12000 } },
  { id: 7, name: 'تجهيز المواد والعمل على اللبخ بمونة الاسمنت والرمل وبنسبة خلط (3:1) للجدران الخارجية والستارة والبيتونة مع مراعاة الاستقامات والاستوائية والمساطر والاركان وحسب توجيهات المهندس المشرف', unit: 'م2', calcType: 'PLASTER_EXTERNAL', prices: { low: 9500, medium: 12000, high: 16000 } },
  { id: 8, name: 'تجهيز المواد والعمل على اللبخ بمونة الجص للسقوف والجسور ومن ثم الانهاء بالمخمر (البياض) وحسب توجيهات المهندس المشرف', unit: 'م2', calcType: 'CEILING_PLASTER', prices: { low: 7000, medium: 8500, high: 11000 } },
  { id: 9, name: 'تجهيز المواد والمعدات والعمل على التطبيق بـ البورسلين للأرضيات على ان يكون ناجحا بالفحص المختبري بأبعاد (60*60) سم وباستخدام الاسمنت المقاوم للأملاح والرمل وبنسبة (3:1) مع الازارة 10سم للجدران مع الشربتة بمونة الاسمنت الابيض والرمل وحسب المواصفات مع ملاحظة الاستوائية والاستقامات وكل ما يلزم لعمل متكامل وحسب التوجيهات للمهندس المشرف', unit: 'م2', calcType: 'PORCELAIN_FLOOR', prices: { low: 22000, medium: 28000, high: 45000 } },
  { id: 10, name: 'تجهيز المواد والمعدات والقيام بأعمال صبغ الواجهة بثلاث طبقات بنوع صبغ (جوتن) وحسب الالوان المحددة في التفاصيل الانشائية مع تطعيم بالحجر والمرمر بنسبة 10% وحسب توجيهات المهندس المشرف', unit: 'م2', calcType: 'FACADE_PAINT', prices: { low: 16000, medium: 22000, high: 38000 } },
  { id: 11, name: 'تجهيز مواد والعمل على تغليف السلالم بألواح الكرانيت الجاهز (بايه ومرايه) وبسمك لا يقل عن 2سم وباستخدام مونة الاسمنت المقاوم للأملاح والرمل وبنسبة (3:1) مع الشربتة بمونة السمنت الأبيض والرمل وكل ما يلزم لعمل متكامل وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'STAIR_STEPS', prices: { low: 26000, medium: 35000, high: 55000 } },
  { id: 12, name: 'تجهيز المواد والمعدات والقيام بتركيب قطع السقف الثانوي 60*60سم للصحيات والمطبخ مع كافة السكك والملحقات المطلوبة شاملا السعر كل ما يلزم لعمل متكامل وحسب توجيهات المهندس المشرف', unit: 'م2', calcType: 'FALSE_CEILING', prices: { low: 14000, medium: 18000, high: 28000 } },
  { id: 13, name: 'الاعمال الكهربائية: تكون جميع الاسلاك دفن ومن منشأ سعودي والنقاط الكهربائية من منشأ اماراتي او تركي، مأخذ سعة 13 امبير مفرد بارتفاع 120سم باستخدام الاسلاك الكهربائية من النحاس المعزول قياس (3 * 2.5) ملم وكل ما يتطلبه العمل من براغي جوي وتوصيلات عكوس وتقاسيم وبوكسات بلاستيكية', unit: 'عدد', calcType: 'SOCKET_13A', prices: { low: 15000, medium: 20000, high: 28000 } },
  { id: 14, name: 'مأخذ سعة 32 امبير بارتفاع 130سم باستخدام الاسلاك الكهربائية من النحاس المعزول قياس (3 * 4) ملم وكل ما يتطلبه العمل من براغي جوي وتوصيلات وعكوس وتقاسيم وبوكسات بلاستيكية', unit: 'عدد', calcType: 'SOCKET_32A', prices: { low: 25000, medium: 35000, high: 48000 } },
  { id: 15, name: 'تجهيز وتثبيت وتشغيل مفتاح كهربائي ثنائي او ثلاثي من النوع الجيد ويشمل السعر حفر الحائط والتأسيس باستخدام انابيب الدفن والاسلاك الكهربائية من النحاس المعزول قياس (2.5 * 3) ملم ومن النوعية الجيدة وكل ما يتطلبه العمل من براغي جوي وتوصيلات وعكوس وتقاسيم وبوكسات بلاستيكية وحسب توجيهات المهندس المشرف', unit: 'عدد', calcType: 'SWITCHES', prices: { low: 16000, medium: 22000, high: 32000 } },
  { id: 16, name: 'تجهيز وتركيب لدات الانارة قدرة 100واط تثبت على السقف بشكل يحقق انارة جيدة وكل ما يتطلبه العمل وحسب توجيهات المهندس المشرف', unit: 'عدد', calcType: 'LED_LIGHTS', prices: { low: 12000, medium: 18000, high: 28000 } },
  { id: 17, name: 'تجهيز وتركيب مفرغة هواء حجم 12 عقدة ذات منشأ جيد للصحيات مع عمل إطار تركب بداخله شاملا العمل الربط والتأسيس بالأسلاك الكهربائية', unit: 'عدد', calcType: 'EXHAUST_FANS', prices: { low: 22000, medium: 30000, high: 45000 } },
  { id: 18, name: 'تجهيز ونصب وربط وفحص قابلو نحاسي قياس (70 *3+35) ملم 2 سويدي او تركي من أقرب مغذي الى لوحة السيطرة الرئيسية وحسب المواصفات الفنية مع كل ما يتطلبه العمل وحسب توجيه المهندس المشرف', unit: 'م. ط', calcType: 'MAIN_CABLE', prices: { low: 75000, medium: 95000, high: 135000 } },
  { id: 19, name: 'تجهيز ونصب وربط وفحص ماطور ماء من منشأ جيد مع الملحقات من العكوس والتقاسيم من الشبكة الرئيسية الى خزان الماء وكل ما يتطلبه العمل وحسب توجيهات المهندس المشرف', unit: 'عدد', calcType: 'WATER_PUMP', prices: { low: 130000, medium: 180000, high: 270000 } },
  { id: 20, name: 'لوحة سيطرة رئيسية (بنل) بأبعاد (40*60) سم تحتوي على قاطع دورة رئيسي نوع شنايدر وتحتوي على قواطع دورة احادية الطور مختلفة القياسات ومجموعة اقطاب نحاسية ومجهز بمقياس للتيار والفولتية ومصباح اشارة وعداد مع فيزات ومفاتيح تشغيل واطفاء من خلال عتلة خارج البنل وتكون الواح البنل الخارجية عازلة ومقاومة للظروف الجوية مع الربط مع منظومة التأريض مع كل ما يلزم لعمل متكامل وحسب توجيهات المهندس المشرف', unit: 'عدد', calcType: 'MAIN_PANEL', prices: { low: 650000, medium: 850000, high: 1400000 } },
  { id: 21, name: 'تجهيز ونصب لوحات سيطرة فرعية نوع شنايدر تحتوي قاطع دورة رئيسي ومجموعة اقطاب نحاسية ومجهز بمقياس للتيار والفولتية ومصباح اشارة وعداد مع فيزات ومفاتيح تشغيل واطفاء وكل ما يلزم لعمل متكامل وتكون مهيئة لرط القابلوات فيها من الاعلى والاسفل وحسب توجيهات المهندس المشرف', unit: 'عدد', calcType: 'SUB_PANELS', prices: { low: 320000, medium: 450000, high: 700000 } },
  { id: 22, name: 'الاعمال الصحية: تكون انابيب الماء دفن ومن نوعية جيدة ذات منشأ معتمد والمجاري تكون انابيب سمارت. تجهيز المواد والقيام بمد وتركيب وفحص تأسيسات المجاري بواسطة خط مجاري بقطر4" درجة اولى من منشأ جيد ويشمل السعر الحفر وصب الكونكريت بسمك 10سم وعمل منهولات بأبعاد (50 * 50) سم مع كافة الملحقات من عكوس وتقاسيم وباستخدام مواد رابطه ذات منشى معتمد شاملا السعر كل ما يلزم لإنجاز عمل متكامل وحسب توجيه المهندس المشرف', unit: 'قطعي', calcType: 'FIXED_1', prices: { low: 2600000, medium: 3500000, high: 5200000 } },
  { id: 23, name: 'تجهيز المواد والقيام بمد وتركيب انابيب لتوزيع الماء الحار والبارد للصحيات والمطابخ ولجميع الطوابق قابله لتحمل الضغط المطلوب مع كافة الملحقات وذات منشى معتمد من نفس المادة كالعكوس والتقاسيم وكذلك الاقفال وكل ما يلزم لتثبيت الانابيب بالجدران بقطر 3/4 وتكون كافة الانابيب مخفيه في الجدران او الارضيات شاملا السعر كل ما يلزم لإنجاز عمل متكامل وحسب توجيه المهندس المشرف', unit: 'قطعي', calcType: 'FIXED_1', prices: { low: 2100000, medium: 2800000, high: 4200000 } },
  { id: 24, name: 'تجهيز المواد والقيام بتركيب وفحص مغسله بورسلين من أفضل المناشئ مع السداد والسلسلة والتثبيت والتوصيلات والخلاط والصوندات', unit: 'عدد', calcType: 'SINKS', prices: { low: 80000, medium: 120000, high: 220000 } },
  { id: 25, name: 'تجهيز وتركيب وربط مقعد شرقي مع سيفون وكلي من البلاستيك UPVC من النوع الثقيل شاملا العمل التوصيل مع الانابيب والتثبيت الجيد بالخرسانة من جميع الجهات مع مشبك معدني يثبت بأرضية مستوى الارضية مع كل ما يتطلبه العمل وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'ORIENTAL_TOILETS', prices: { low: 75000, medium: 110000, high: 190000 } },
  { id: 26, name: 'تجهيز وتركيب وربط خزان ماء 1000لتر من البلاستيك مع كافة الملحقات من اقفال وفلنجات والطوافه وكل ما يلزم للعمل', unit: 'عدد', calcType: 'WATER_TANKS', prices: { low: 160000, medium: 220000, high: 320000 } },
  { id: 27, name: 'تجهيز ونصب وفحص سخانات الماء الكهربائية سعة 120لتر مع منظم الحرارة وصمام الامان وتكون معزولة وذات غلاف مطلي مع التوصيلات اللازمة وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'WATER_HEATERS', prices: { low: 130000, medium: 175000, high: 280000 } },
  { id: 28, name: 'تجهيز المواد والمعدات والقيام بتطبيق جدران الصحيات والمطبخ بالسيراميك من منشأ جيد باستخدام مادة لاصقة شاملا السعر الشربتة بالأسمنت الابيض وبارتفاع 3م وحسب توجيه المهندس المشرف', unit: 'م2', calcType: 'CERAMIC_WALLS', prices: { low: 20000, medium: 28000, high: 46000 } },
  { id: 29, name: 'تجهيز المواد والمعدات والقيام بتطبيق ارضيات الصحيات بالسيراميك من منشأ جيد باستخدام مونة الاسمنت والرمل بنسبة 1:3 مع مادة SPR لأرضيات المجاميع الصحية شاملا السعر الشربتة بالأسمنت الابيض وحسب توجيه المهندس المشرف', unit: 'م2', calcType: 'CERAMIC_BATH_FLOORS', prices: { low: 19000, medium: 26000, high: 42000 } },
  { id: 30, name: 'تجهيز ونصب وفحص مانهول 50*50سم2 مع الغطاء الحديدي وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'MANHOLES', prices: { low: 65000, medium: 90000, high: 140000 } },
  { id: 31, name: 'تجهيز ونصب وفحص كلي 4عقدة مع الغطاء مع التوصيلات اللازمة وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'GULLY_TRAPS', prices: { low: 25000, medium: 35000, high: 55000 } },
  { id: 32, name: 'تجهيز ونصب حنفية ماء كروم مع الغطاء الحديدي وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'TAPS', prices: { low: 14000, medium: 20000, high: 36000 } },
  { id: 33, name: 'تجهيز ونصب دوش كروم نصف انج مع الغطاء الحديدي وحسب توجيه المهندس المشرف', unit: 'عدد', calcType: 'SHOWERS', prices: { low: 35000, medium: 50000, high: 95000 } },
  { id: 34, name: 'الابواب والشبابيك: تجهيز المواد والمعدات والقيام بتركيب ابواب من الخشب الصاج وجهين بعرض1م ارتفاع 2.9م مع الكيلون من النوع الجيد والإطار من الخشب الجاوي قياس 3*6 وحسب القياسات في المخططات الانشائية وتوجيهات المهندس المشرف', unit: 'عدد', calcType: 'WOOD_DOORS', prices: { low: 260000, medium: 350000, high: 520000 } },
  { id: 35, name: 'تجهيز المواد والمعدات والقيام بتركيب باب PVC وجهين بعرض 1م وارتفاع 2.9م مع الكيلون من النوع الجيد وحسب القياسات في المخططات الانشائية وتوجيهات المهندس المشرف', unit: 'عدد', calcType: 'PVC_DOORS', prices: { low: 160000, medium: 220000, high: 320000 } },
  { id: 36, name: 'تجهيز المواد والمعدات والقيام بتركيب باب للسطح حديد كبس وجهين بعرض 1م وارتفاع 2.9م مع الكيلون من النوع الجيد وحسب القياسات في المخططات الانشائية وتوجيهات المهندس المشرف', unit: 'عدد', calcType: 'ROOF_STEEL_DOOR', prices: { low: 220000, medium: 300000, high: 420000 } },
  { id: 37, name: 'تجهيز المواد والمعدات والقيام بتركيب باب (للمناور) حديد كبس وجهين بعرض 1م وارتفاع 2.9م مع الكيلون من النوع الجيد وحسب القياسات في المخططات الانشائية وتوجيهات المهندس المشرف', unit: 'عدد', calcType: 'LIGHTWELL_DOORS', prices: { low: 180000, medium: 250000, high: 350000 } },
  { id: 38, name: 'تجهيز المواد والمعدات والقيام بتركيب باب (الرئيسي) حديد كبس وجهين بعرض 3.0 م وارتفاع 2.0 م مع الكيلون من النوع الجيد وحسب القياسات في المخططات الانشائية وتوجيهات المهندس المشرف', unit: 'عدد', calcType: 'MAIN_GATE', prices: { low: 850000, medium: 1200000, high: 2200000 } },
  { id: 39, name: 'تجهيز المواد والمعدات والقيام بتركيب شبابيك PVC مع الزجاج شاملا السعر المقابض وأسلاك مانع الذباب وكل ما يتطلبه العمل وحسب المخططات الانشائية وتوجيهات المهندس المشرف', unit: 'م2', calcType: 'PVC_WINDOWS', prices: { low: 85000, medium: 115000, high: 175000 } },
  { id: 40, name: 'تجهيز المواد والمعدات والقيام بتثبيت محجر الدرج من الالمنيوم والزجاج على ان يتم تثبيت عمود من الالمنيوم كل 60سم وبثلاث الوان حسب رغبة المستفيد وحسب توجيهات المهندس المشرف', unit: 'م. ط', calcType: 'STAIR_HANDRAIL', prices: { low: 55000, medium: 75000, high: 125000 } },
  { id: 41, name: 'التسطيح: تجهيز المعدات والمواد المطلوبة لعمل التسطيح بالشتايكر (80*80) سم ذات نوعية جيدة والمتوفرة في الاسواق مع مراعاة معدل الميل المناسب في العمل مع ارتفاع مرد الماء بالنسبة للبيتونة ويشمل العمل الطلاء بالفلانكوت ثلاث طبقات وفرش القير وطبقة من اللباد والفلين بسمك 2سم ونايلون ومن ثم التهوير بالتراب ويشمل العمل تركيب وتثبيت مرازيب من انابيب بلاستك 4انج ضغط 8بار منشئ مستورد مع العكوس قياس 4انج وربط المرازيب بأحواض التفتيش وتربط مع انابيب المجاري الرئيسية وجميع ملحقات التثبيت مع كل ما يتطلب للوصول الى عمل متكامل وحسب الابعاد المبينة في المخططات وحسب توجيه المهندس الاستشاري المتخصص', unit: 'م2', calcType: 'ROOFING_SHTAIKER', prices: { low: 24000, medium: 32000, high: 45000 } }
];

interface ProjectTenderModalProps {
  project: any;
  companySettings: any;
  onClose: () => void;
  onSaved?: () => void;
}

export default function ProjectTenderModal({
  project,
  companySettings,
  onClose,
  onSaved
}: ProjectTenderModalProps) {
  const existing = project?.tender_data || {};
  const [tenderArea, setTenderArea] = useState(String(existing.area || '200'));
  const [tenderWallLength, setTenderWallLength] = useState(String(existing.wall_length || '90'));
  const [tenderFloors, setTenderFloors] = useState(String(existing.floors || '2'));
  const [tenderFloorHeight, setTenderFloorHeight] = useState(String(existing.floor_height || '3.0'));
  const [tenderRooms, setTenderRooms] = useState(String(existing.rooms || '4'));
  const [tenderBaths, setTenderBaths] = useState(String(existing.baths || '3'));

  const [selectedTier, setSelectedTier] = useState<'low' | 'medium' | 'high'>((existing.tier as any) || 'medium');
  const [tenderCustomItems, setTenderCustomItems] = useState<any[]>([]);
  const [savingTender, setSavingTender] = useState(false);

  const completionRate = project?.completion_rate || 0;
  const totalReceived = Number(project?.total_received || 0);
  const contractVal = Number(project?.contract_value || 0);
  const remainingVal = Math.max(0, contractVal - totalReceived);

  const generateDefault41Items = (area: number, walls: number, floors: number, height: number, rooms: number, baths: number, tier: 'low' | 'medium' | 'high') => {
    const qSubbase = Math.round(area * 0.25);
    const qRaftConcrete = Math.round(area * 0.45);
    const qSlabsConcrete = Math.round(area * floors * 0.26);
    const qBrickwork = Math.round(walls * height * floors * 0.24 * 0.85);
    const qPlasterInside = Math.round(walls * 2 * height * floors * 0.85);
    const qPlasterOutside = Math.round(walls * height * floors * 0.35);
    const qCeilingPlaster = Math.round(area * floors);
    const qPorcelain = Math.round(area * floors * 0.90);
    const qFacadePaint = Math.round(walls * height * 0.35);
    const qStairSteps = Math.round(floors * 22);
    const qFalseCeiling = Math.round(baths * 8 + (area * 0.1));
    const qSocket13A = Math.round((rooms * 6) + (baths * 2) + 12);
    const qSocket32A = Math.round(rooms + baths + 4);
    const qSwitches = Math.round(rooms * 3 + baths * 2 + 6);
    const qLed = Math.round(rooms * 4 + baths * 2 + 10);
    const qExhaust = baths + 1;
    const qMainCable = Math.round(25 + floors * 5);
    const qSubPanels = floors;
    const qSinks = baths + 1;
    const qToilets = baths;
    const qWaterTanks = Math.max(1, Math.round(floors));
    const qHeaters = baths;
    const qCeramicWalls = Math.round((baths * 25) + 30);
    const qCeramicBathFloors = Math.round((baths * 6) + 12);
    const qManholes = Math.round(3 + floors);
    const qGulley = baths + 2;
    const qTaps = baths * 3 + 4;
    const qShowers = baths;
    const qWoodDoors = Math.round(rooms + 2);
    const qPvcDoors = baths;
    const qRoofSteelDoor = 1;
    const qLightwellDoors = 2;
    const qMainGate = 1;
    const qPvcWindows = Math.round(rooms * 3.5 + 4);
    const qHandrail = Math.round(floors * 12);
    const qShtaiker = Math.round(area * 1.05);

    const generated = OFFICIAL_TENDER_TEMPLATES.map((tmpl) => {
      let qty = 1;
      if (tmpl.calcType === 'SUBBASE') qty = qSubbase;
      else if (tmpl.calcType === 'RAFT_CONCRETE') qty = qRaftConcrete;
      else if (tmpl.calcType === 'SLABS_CONCRETE') qty = qSlabsConcrete;
      else if (tmpl.calcType === 'BRICKWORK') qty = qBrickwork;
      else if (tmpl.calcType === 'PLASTER_INTERNAL') qty = qPlasterInside;
      else if (tmpl.calcType === 'PLASTER_EXTERNAL') qty = qPlasterOutside;
      else if (tmpl.calcType === 'CEILING_PLASTER') qty = qCeilingPlaster;
      else if (tmpl.calcType === 'PORCELAIN_FLOOR') qty = qPorcelain;
      else if (tmpl.calcType === 'FACADE_PAINT') qty = qFacadePaint;
      else if (tmpl.calcType === 'STAIR_STEPS') qty = qStairSteps;
      else if (tmpl.calcType === 'FALSE_CEILING') qty = qFalseCeiling;
      else if (tmpl.calcType === 'SOCKET_13A') qty = qSocket13A;
      else if (tmpl.calcType === 'SOCKET_32A') qty = qSocket32A;
      else if (tmpl.calcType === 'SWITCHES') qty = qSwitches;
      else if (tmpl.calcType === 'LED_LIGHTS') qty = qLed;
      else if (tmpl.calcType === 'EXHAUST_FANS') qty = qExhaust;
      else if (tmpl.calcType === 'MAIN_CABLE') qty = qMainCable;
      else if (tmpl.calcType === 'SUB_PANELS') qty = qSubPanels;
      else if (tmpl.calcType === 'SINKS') qty = qSinks;
      else if (tmpl.calcType === 'ORIENTAL_TOILETS') qty = qToilets;
      else if (tmpl.calcType === 'WATER_TANKS') qty = qWaterTanks;
      else if (tmpl.calcType === 'WATER_HEATERS') qty = qHeaters;
      else if (tmpl.calcType === 'CERAMIC_WALLS') qty = qCeramicWalls;
      else if (tmpl.calcType === 'CERAMIC_BATH_FLOORS') qty = qCeramicBathFloors;
      else if (tmpl.calcType === 'MANHOLES') qty = qManholes;
      else if (tmpl.calcType === 'GULLY_TRAPS') qty = qGulley;
      else if (tmpl.calcType === 'TAPS') qty = qTaps;
      else if (tmpl.calcType === 'SHOWERS') qty = qShowers;
      else if (tmpl.calcType === 'WOOD_DOORS') qty = qWoodDoors;
      else if (tmpl.calcType === 'PVC_DOORS') qty = qPvcDoors;
      else if (tmpl.calcType === 'ROOF_STEEL_DOOR') qty = qRoofSteelDoor;
      else if (tmpl.calcType === 'LIGHTWELL_DOORS') qty = qLightwellDoors;
      else if (tmpl.calcType === 'MAIN_GATE') qty = qMainGate;
      else if (tmpl.calcType === 'PVC_WINDOWS') qty = qPvcWindows;
      else if (tmpl.calcType === 'STAIR_HANDRAIL') qty = qHandrail;
      else if (tmpl.calcType === 'ROOFING_SHTAIKER') qty = qShtaiker;
      else qty = 1;

      const unitPrice = tmpl.prices[tier] || tmpl.prices.medium;

      return {
        seq: tmpl.id,
        name: tmpl.name,
        unit: tmpl.unit,
        qty: qty,
        unitPrice: unitPrice,
        total: Math.round(qty * unitPrice)
      };
    });

    setTenderCustomItems(generated);
  };

  useEffect(() => {
    if (Array.isArray(existing.items) && existing.items.length > 0) {
      setTenderCustomItems(existing.items);
    } else {
      generateDefault41Items(
        Number(tenderArea) || 200,
        Number(tenderWallLength) || 90,
        Math.max(1, Number(tenderFloors) || 2),
        Number(tenderFloorHeight) || 3.0,
        Number(tenderRooms) || 4,
        Number(tenderBaths) || 3,
        selectedTier
      );
    }
  }, []);

  const handleSelectTier = (tier: 'low' | 'medium' | 'high') => {
    setSelectedTier(tier);
    setTenderCustomItems(prev => {
      return prev.map(item => {
        const template = OFFICIAL_TENDER_TEMPLATES.find(t => t.id === item.seq);
        if (template && template.prices) {
          const newPrice = template.prices[tier] || item.unitPrice;
          return {
            ...item,
            unitPrice: newPrice,
            total: Math.round(item.qty * newPrice)
          };
        }
        return item;
      });
    });
  };

  const handleRecalculateAll = () => {
    generateDefault41Items(
      Number(tenderArea) || 0,
      Number(tenderWallLength) || 0,
      Math.max(1, Number(tenderFloors) || 1),
      Number(tenderFloorHeight) || 3.0,
      Number(tenderRooms) || 0,
      Number(tenderBaths) || 0,
      selectedTier
    );
  };

  const handleUpdateItem = (index: number, field: string, val: any) => {
    setTenderCustomItems(prev => {
      const updated = [...prev];
      const target = { ...updated[index], [field]: val };
      const q = field === 'qty' ? (Number(val) || 0) : target.qty;
      const p = field === 'unitPrice' ? (Number(val) || 0) : target.unitPrice;
      target.total = Math.round(q * p);
      updated[index] = target;
      return updated;
    });
  };

  const handleDeleteItem = (index: number) => {
    if (!confirm('هل تريد حذف هذه الفقرة من جدول الكميات؟')) return;
    setTenderCustomItems(prev => 
      prev
        .filter((_, i) => i !== index)
        .map((item, idx) => ({ ...item, seq: idx + 1 }))
    );
  };

  const handleAddItem = () => {
    setTenderCustomItems(prev => {
      const nextSeq = prev.length + 1;
      const newItem = {
        seq: nextSeq,
        name: 'فقرة إنشائية إضافية حسب توجيه المهندس المشرف والمواصفات الفنية المعتمدة',
        unit: 'م2',
        qty: 1,
        unitPrice: 0,
        total: 0
      };
      return [...prev, newItem];
    });

    setTimeout(() => {
      window.scrollTo({ top: document.body.scrollHeight, behavior: 'smooth' });
    }, 100);
  };

  const totalTenderCost = useMemo(() => {
    return tenderCustomItems.reduce((acc, curr) => acc + (Number(curr.total) || 0), 0);
  }, [tenderCustomItems]);

  const handleSaveTender = async () => {
    setSavingTender(true);
    try {
      const payload = {
        area: Number(tenderArea),
        wall_length: Number(tenderWallLength),
        floors: Number(tenderFloors),
        floor_height: Number(tenderFloorHeight),
        rooms: Number(tenderRooms),
        baths: Number(tenderBaths),
        tier: selectedTier,
        items: tenderCustomItems,
        total_estimated_cost: totalTenderCost,
        updated_at: new Date().toISOString()
      };

      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'SAVE_TENDER',
          project_id: project.project_id,
          tender_data: payload
        })
      });

      if (res.ok) {
        alert('تم حفظ وتثبيت جدول كميات وتندر المشروع بنجاح!');
        if (onSaved) onSaved();
      }
    } finally {
      setSavingTender(false);
    }
  };

  const hasLetterhead = Boolean(companySettings?.letterhead_url && companySettings.letterhead_url.trim().length > 10);
  const displayBranchName = project?.branch_name || 'الادارة المركزية';
  const currentDateStr = new Date().toISOString().split('T')[0];

  const tierTitleMap = {
    low: 'اقتصادي (قليل الكلفة - تشطيب تجاري قياسي)',
    medium: 'متوسط الكلفة (معياري ممتاز - درجة أولى شائعة)',
    high: 'عالي الكلفة (VIP ديلوكس - تشطيبات ومناشئ فاخرة)'
  };

  // توليد بيانات الباركود الديناميكي للزبون
  const qrVerificationData = useMemo(() => {
    const pName = project?.project_name || 'مشروع مقاولة';
    const client = project?.client_name || 'صاحب العمل';
    const loc = project?.location || 'النجف الأشرف';
    const rate = `${completionRate}%`;
    const recStr = `${formatNum(totalReceived)} د.ع`;
    const remStr = `${formatNum(remainingVal)} د.ع`;
    const costStr = `${formatNum(totalTenderCost)} د.ع`;
    const pId = project?.project_id || 'PRJ-2026';

    const textPayload = `وثيقة تندر معتمدة - شركة البرج المتألق\n` +
      `المشروع: ${pName}\n` +
      `الرقم التعريفي: ${pId}\n` +
      `صاحب العمل: ${client}\n` +
      `الموقع: ${loc}\n` +
      `نسبة الإنجاز الفعلي: ${rate}\n` +
      `المقبوض من العميل: ${recStr}\n` +
      `المتبقي بذمة العميل: ${remStr}\n` +
      `إجمالي كلفة التندر (41 فقرة): ${costStr}\n` +
      `تاريخ المصادقة: ${currentDateStr}\n` +
      `الحالة: وثيقة رسمية مصادق عليها إلكترونياً (DOC VERIFIED)`;

    return `https://api.qrserver.com/v1/create-qr-code/?size=160x160&data=${encodeURIComponent(textPayload)}`;
  }, [project, completionRate, totalReceived, remainingVal, totalTenderCost, currentDateStr]);

  return (
    <div className="fixed inset-0 bg-black/90 z-50 overflow-y-auto flex flex-col items-center p-2 sm:p-4 print:p-0 print:bg-white print:static print:block print:w-full font-cairo text-[14px]">
      
      {/* تنسيقات الطباعة الصارمة المعتمدة بالعرض A4 Landscape مع إزالة شريط التمرير بالكامل */}
      <style jsx global>{`
        textarea {
          overflow: hidden !important;
          resize: none !important;
          scrollbar-width: none !important;
          -ms-overflow-style: none !important;
          height: auto !important;
        }
        textarea::-webkit-scrollbar {
          display: none !important;
          width: 0 !important;
          height: 0 !important;
        }
        
        @media screen and (max-width: 1024px) {
          .mobile-preview-container {
            width: 100% !important;
            overflow-x: auto !important;
            -webkit-overflow-scrolling: touch !important;
          }
          .tender-inner-sheet {
            min-width: 1050px !important;
          }
        }
        @media print {
          @page {
            size: landscape;
            margin: 6mm 8mm;
          }
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: var(--font-cairo), 'Cairo', system-ui, -apple-system, sans-serif !important;
          }
          body, html {
            background-color: #ffffff !important;
            color: #0f172a !important;
            margin: 0 !important;
            padding: 0 !important;
            width: 100% !important;
            height: auto !important;
            font-size: 14px !important;
          }
          header, nav, aside, .print-hidden-element, button {
            display: none !important;
            visibility: hidden !important;
          }
          body * {
            visibility: hidden;
          }
          #printable-tender-document, #printable-tender-document * {
            visibility: visible;
          }
          #printable-tender-document {
            position: absolute;
            left: 0;
            top: 0;
            width: 100% !important;
            max-width: 100% !important;
            min-width: 0 !important;
            margin: 0 !important;
            padding: 8mm 10mm 10mm 10mm !important;
            background: #ffffff !important;
            border: 2px solid #ea580c !important;
            border-radius: 6px !important;
            box-shadow: none !important;
          }
          table {
            page-break-inside: auto !important;
            width: 100% !important;
          }
          tr {
            page-break-inside: avoid !important;
            page-break-after: auto !important;
          }
          thead {
            display: table-header-group !important;
          }
          tfoot {
            display: none !important;
          }
          .avoid-break-inside {
            page-break-inside: avoid !important;
            break-inside: avoid !important;
          }
        }
      `}</style>

      {/* شريط الإجراءات العلوي التفاعلي */}
      <div className="sticky top-0 z-50 w-full max-w-6xl flex items-center justify-between bg-slate-900 border border-slate-700 p-3 sm:px-5 sm:py-3 rounded-2xl mb-4 print:hidden shadow-2xl gap-3">
        <div className="flex items-center gap-2.5 flex-wrap">
          <button 
            type="button"
            onClick={() => window.print()} 
            className="bg-emerald-600 hover:bg-emerald-500 text-white font-black px-4 py-2 rounded-xl text-[14px] flex items-center gap-2 cursor-pointer shadow-md whitespace-nowrap active:scale-95"
          >
            <Printer className="w-4 h-4" /> طباعة وثيقة التندر والعقد (A4 بالعرض)
          </button>
          <button 
            type="button"
            onClick={handleSaveTender} 
            disabled={savingTender}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-4 py-2 rounded-xl text-[14px] flex items-center gap-2 cursor-pointer shadow-md whitespace-nowrap active:scale-95"
          >
            <CheckSquare className="w-4 h-4" /> {savingTender ? 'جاري الحفظ...' : 'تثبيت وحفظ التندر'}
          </button>
          <button 
            type="button"
            onClick={handleAddItem} 
            className="bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-[14px] flex items-center gap-1.5 cursor-pointer border border-slate-700 whitespace-nowrap active:scale-95"
          >
            <Plus className="w-4 h-4 text-amber-400" /> إضافة فقرة جديدة +
          </button>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-[14px] text-slate-300 font-mono hidden md:inline">
            الكلفة التخمينية الكلية: <strong className="text-amber-400 text-base">{formatNum(totalTenderCost)} د.ع</strong>
          </span>
          <button onClick={onClose} className="text-slate-400 hover:text-white p-2 rounded-xl hover:bg-slate-800 transition cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* شريط اختيار الباقة الثلاثية المبتكرة */}
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 p-4 rounded-3xl mb-4 print:hidden shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <span className="text-xs font-bold text-slate-300 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-400" />
            اختر باقة المواصفات والأسعار التخمينية المعتمدة (تحديث فوري لكامل الفقرات الـ 41):
          </span>
          <span className="text-xs font-bold font-mono text-emerald-400">
            الباقة المفعلة حالياً: {tierTitleMap[selectedTier]}
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
          <button
            type="button"
            onClick={() => handleSelectTier('low')}
            className={`p-3 rounded-2xl border transition-all text-right flex flex-col justify-between cursor-pointer ${
              selectedTier === 'low'
                ? 'bg-sky-500/20 border-sky-400 text-white shadow-lg shadow-sky-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-1">
              <span className="font-black text-sm flex items-center gap-1.5 text-sky-400">
                <TrendingDown className="w-4 h-4" /> قليل الكلفة (اقتصادي)
              </span>
              {selectedTier === 'low' && <CheckCircle2 className="w-4 h-4 text-sky-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              مواصفات قياسية تجارية مدروسة الكلفة، مناسبة للمشاريع الاقتصادية والوحدات السكنية المحدودة الميزانية.
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTier('medium')}
            className={`p-3 rounded-2xl border transition-all text-right flex flex-col justify-between cursor-pointer ${
              selectedTier === 'medium'
                ? 'bg-amber-500/20 border-amber-400 text-white shadow-lg shadow-amber-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-1">
              <span className="font-black text-sm flex items-center gap-1.5 text-amber-400">
                <Layers className="w-4 h-4" /> متوسط الكلفة (معياري ممتاز)
              </span>
              {selectedTier === 'medium' && <CheckCircle2 className="w-4 h-4 text-amber-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              المواصفات الأكثر شيوعاً في السوق العراقي (سمنت مقاوم، طابوق فاحص، أسلاك الرياض، صبغ جوتن، بورسلين ممتاز).
            </p>
          </button>

          <button
            type="button"
            onClick={() => handleSelectTier('high')}
            className={`p-3 rounded-2xl border transition-all text-right flex flex-col justify-between cursor-pointer ${
              selectedTier === 'high'
                ? 'bg-purple-500/20 border-purple-400 text-white shadow-lg shadow-purple-500/10'
                : 'bg-slate-950 border-slate-800 text-slate-400 hover:border-slate-700'
            }`}
          >
            <div className="flex justify-between items-center w-full mb-1">
              <span className="font-black text-sm flex items-center gap-1.5 text-purple-400">
                <Award className="w-4 h-4" /> عالي الكلفة (VIP ديلوكس)
              </span>
              {selectedTier === 'high' && <CheckCircle2 className="w-4 h-4 text-purple-400" />}
            </div>
            <p className="text-[11px] leading-relaxed text-slate-300">
              مواصفات معمارية فاخرة (مرمر طبيعي للواجهات، بورسلين إسباني، أبواب صاج ثقيلة، تأسيسات سمارت وخلاطات جروهي).
            </p>
          </button>
        </div>
      </div>

      {/* مدخلات القياسات الأساسية للمشروع */}
      <div className="w-full max-w-6xl bg-slate-900 border border-slate-800 p-5 rounded-3xl mb-5 print:hidden shadow-xl space-y-3">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800 pb-2">
          <h4 className="text-[14px] font-bold text-white flex items-center gap-2">
            <Calculator className="w-4 h-4 text-amber-400" />
            مدخلات القياسات الأساسية للمشروع (حصر كميات الـ 41 فقرة تلقائياً):
          </h4>
          <div className="flex items-center gap-2">
            <button 
              type="button"
              onClick={handleRecalculateAll}
              className="px-3 py-1 bg-amber-500/20 hover:bg-amber-500 text-amber-300 hover:text-slate-950 rounded-lg text-[13px] font-bold border border-amber-500/40 transition cursor-pointer"
            >
              إعادة احتساب وتوليد الكميات ↻
            </button>
            <span className="text-[13px] text-amber-300 font-bold bg-amber-500/10 border border-amber-500/30 px-2.5 py-0.5 rounded-full">
              المواصفات القياسية العراقية المعتمدة
            </span>
          </div>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-6 gap-3 text-[14px]">
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[13px]">مساحة الأرض/البناء (م²)</label>
            <input type="number" value={tenderArea} onChange={(e) => setTenderArea(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-[14px]" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[13px]">طول الجدران الكلي (م.ط)</label>
            <input type="number" value={tenderWallLength} onChange={(e) => setTenderWallLength(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-[14px]" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[13px]">عدد الطوابق</label>
            <input type="number" min="1" value={tenderFloors} onChange={(e) => setTenderFloors(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-[14px]" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[13px]">ارتفاع الطابق (م)</label>
            <input type="number" step="0.1" value={tenderFloorHeight} onChange={(e) => setTenderFloorHeight(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-[14px]" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[13px]">عدد الغرف</label>
            <input type="number" value={tenderRooms} onChange={(e) => setTenderRooms(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-[14px]" />
          </div>
          <div>
            <label className="block text-slate-400 mb-1 font-semibold text-[13px]">عدد الحمامات والصحيات</label>
            <input type="number" value={tenderBaths} onChange={(e) => setTenderBaths(e.target.value)} className="w-full bg-slate-950 border border-slate-700 rounded-xl p-2.5 text-white font-mono font-bold outline-none focus:border-amber-500 text-[14px]" />
          </div>
        </div>
      </div>

      {/* حاوية المعاينة المتجاوبة مع الموبايل وكافة الشاشات */}
      <div className="mobile-preview-container w-full max-w-6xl pb-8 print:pb-0 print:overflow-visible">
        
        {/* الورقة المعتمدة ذات الإطار الهندسي الكامل والمطابق للنموذج المعتمد في التطبيق بالصورة */}
        <div id="printable-tender-document" className="tender-inner-sheet relative w-full bg-white text-slate-950 p-6 sm:p-10 rounded-2xl shadow-2xl border-2 border-[#ea580c] font-cairo text-[14px] overflow-hidden">
          
          {/* العلامة المائية للشركة في المنتصف (Watermark) */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04] z-0 select-none">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={companySettings?.logo_url || "/logo.png"} 
              alt="شعار الشركة" 
              className="w-[500px] h-[500px] object-contain" 
            />
          </div>

          <div className="relative z-10">
            {/* 1. الترويسة المعتمدة المطابقة تماماً لكتب الشركة الرسمية (الصورة المرفقة) */}
            {hasLetterhead ? (
              <div className="w-full border-b pb-3 mb-3">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={companySettings.letterhead_url} alt="ترويسة الشركة" className="w-full max-h-24 object-contain" />
              </div>
            ) : (
              <div className="flex justify-between items-center pb-3 mb-2">
                
                {/* الطرف الأيسر: الإنجليزية */}
                <div className="text-left font-sans" dir="ltr">
                  <h2 className="text-lg font-black text-slate-800 leading-tight">Resplendently Tower Co</h2>
                  <p className="text-[11.5px] font-bold text-[#ea580c] leading-snug">General Contracting</p>
                  <p className="text-[11.5px] font-bold text-[#ea580c] leading-snug">General Trading</p>
                  <p className="text-[11.5px] font-bold text-[#ea580c] leading-snug">General Transport</p>
                  <p className="text-[11.5px] font-bold text-[#ea580c] leading-snug">Real Estate Investments</p>
                </div>

                {/* الطرف الأوسط والأيمن: شعار الشركة والاسم العربي الرسمي */}
                <div className="flex items-center gap-3">
                  <div className="w-20 h-20 relative flex items-center justify-center shrink-0">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={companySettings?.logo_url || "/logo.png"} 
                      alt="شعار الشركة" 
                      className="w-full h-full object-contain" 
                    />
                  </div>
                  <div className="text-right">
                    <h1 className="text-2xl sm:text-3xl font-black text-[#52525b] tracking-tight leading-tight">
                      شركة البرج المتألق
                    </h1>
                    <p className="text-xs sm:text-[13px] font-bold text-[#ea580c] mt-0.5 tracking-wide">
                      للمقاولات العامة و التجارة العامة والنقل العام والاستثمارات العقارية
                    </p>
                  </div>
                </div>

              </div>
            )}

            {/* 2. شريط توثيق العقد والفرع والرقم والتاريخ (مطابق تماماً لنموذج الكتب الرسمية) */}
            <div className="flex items-center justify-between bg-[#f4f4f5] border border-slate-300 rounded-lg px-5 py-2 font-cairo text-[13px] font-bold text-slate-800 mb-3.5 shadow-2xs">
              <div className="flex items-center gap-1.5" dir="rtl">
                <span className="text-slate-700 font-black">العدد :</span>
                <span className="font-mono text-slate-950 font-bold text-[14px]">
                  س / {project?.project_id ? String(project.project_id).slice(-4) : '691'} / 2026
                </span>
              </div>

              <div className="flex items-center justify-center">
                <span className="inline-flex items-center px-4 py-0.5 rounded-md bg-white border border-[#ea580c]/60 text-[#ea580c] font-black text-xs shadow-xs">
                  كتاب صادر رسمي | {displayBranchName}
                </span>
              </div>

              <div className="flex items-center gap-1.5" dir="rtl">
                <span className="text-slate-700 font-black">التاريخ :</span>
                <span className="font-mono text-slate-950 font-bold text-[14px]">{currentDateStr}</span>
              </div>
            </div>

            {/* 3. عنوان الوثيقة الرسمي مع خط تحتي أنيق */}
            <div className="text-center my-3">
              <h2 className="text-base sm:text-lg font-black text-slate-900 inline-block border-b-2 border-[#ea580c] pb-1 px-8">
                وثيقة مناقصة وجدول كميات تعاقدي رسمي (BOQ)
              </h2>
            </div>

            {/* 4. بطاقة بيانات المشروع الأساسية - تتسع للنصوص الطويلة بدون اقتطاع */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 border border-slate-200 p-3 rounded-xl text-[14px] font-semibold mb-3">
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between min-h-[70px]">
                <span className="text-slate-500 block text-[11px] mb-0.5">اسم المشروع</span>
                <span className="text-slate-950 font-bold block text-[13px] leading-snug break-words whitespace-normal">{project?.project_name}</span>
              </div>
              
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between min-h-[70px]">
                <span className="text-slate-500 block text-[11px] mb-0.5">الجهة المستفيدة / صاحب العمل</span>
                <span className="text-slate-950 font-bold block text-[13px] leading-snug break-words whitespace-normal">{project?.client_name}</span>
              </div>
              
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between min-h-[70px]">
                <span className="text-slate-500 block text-[11px] mb-0.5">موقع العمل والأبعاد الإنشائية</span>
                <span className="text-slate-950 font-bold block text-[13px] leading-snug break-words whitespace-normal">
                  {project?.location || 'النجف الأشرف'} ({tenderArea} م² - {tenderFloors} طوابق)
                </span>
              </div>
              
              <div className="p-2.5 bg-white rounded-lg border border-slate-200 flex flex-col justify-between min-h-[70px]">
                <span className="text-slate-500 block text-[11px] mb-0.5">الكلفة التخمينية للعطاء ({tierTitleMap[selectedTier].split('(')[0].trim()})</span>
                <span className="font-mono font-black text-sm block text-[#ea580c]">{formatNum(totalTenderCost)} د.ع</span>
              </div>
            </div>

            {/* 5. جدول الكميات والفقرات الـ 41 ملتصق بانسيابية وبدون أي فراغ أو فاصل سفلي زائد */}
            <div className="border border-slate-300 rounded-xl overflow-hidden mb-4">
              <table className="w-full text-right text-[14px] border-collapse font-cairo">
                <thead className="bg-[#f4f4f5] text-slate-900 font-black border-b-2 border-slate-300 text-[14px]">
                  <tr>
                    <th className="p-2 text-center w-12 border-l border-slate-300">ت</th>
                    <th className="p-2 border-l border-slate-300 min-w-[360px]">الفقرات والمواصفات الفنية للعمل</th>
                    <th className="p-2 text-center w-16 border-l border-slate-300">الوحدة</th>
                    <th className="p-2 text-center w-24 border-l border-slate-300">الكمية</th>
                    <th className="p-2 text-center w-32 border-l border-slate-300">السعر (د.ع)</th>
                    <th className="p-2 text-left w-36 border-l border-slate-300">المبلغ الكلي (د.ع)</th>
                    <th className="p-2 text-center w-12 print:hidden">حذف</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 text-[14px]">
                  {tenderCustomItems.map((item, idx) => (
                    <tr key={idx} className="hover:bg-slate-50">
                      <td className="p-2 text-center font-mono font-bold text-slate-600 border-l border-slate-200 align-middle text-[14px]">
                        {item.seq || (idx + 1)}
                      </td>
                      
                      <td className="p-2 text-slate-950 border-l border-slate-200 leading-normal break-words whitespace-normal align-middle text-[13.5px]">
                        <textarea 
                          rows={calculateRows(item.name)}
                          value={item.name} 
                          onChange={(e) => handleUpdateItem(idx, 'name', e.target.value)}
                          className="print:hidden w-full bg-transparent border-0 focus:ring-1 focus:ring-amber-500 focus:bg-white rounded p-0 outline-none text-[13.5px] resize-none leading-normal block overflow-hidden font-cairo font-medium m-0"
                          style={{ overflow: 'hidden', resize: 'none' }}
                        />
                        <span className="hidden print:inline-block leading-normal text-justify text-[13px] font-medium">{item.name}</span>
                      </td>
                      
                      <td className="p-1.5 text-center font-bold text-slate-700 border-l border-slate-200 font-cairo align-middle text-[14px]">
                        <input 
                          type="text" 
                          value={item.unit} 
                          onChange={(e) => handleUpdateItem(idx, 'unit', e.target.value)}
                          className="print:hidden w-16 bg-transparent border border-transparent hover:border-slate-300 focus:border-amber-500 focus:bg-white rounded p-1 text-center font-cairo outline-none text-[14px] font-bold"
                        />
                        <span className="hidden print:inline">{item.unit}</span>
                      </td>

                      <td className="p-1.5 text-center font-black text-slate-900 border-l border-slate-200 font-mono text-[14px] align-middle">
                        <input 
                          type="number" 
                          value={item.qty} 
                          onChange={(e) => handleUpdateItem(idx, 'qty', e.target.value)}
                          className="print:hidden w-20 bg-slate-50 border border-slate-200 focus:border-amber-500 focus:bg-white rounded p-1 text-center font-mono font-bold outline-none text-[14px]"
                        />
                        <span className="hidden print:inline">{formatNum(item.qty)}</span>
                      </td>
                      
                      <td className="p-1.5 text-center border-l border-slate-200 font-mono align-middle text-[14px]">
                        <input 
                          type="number" 
                          value={item.unitPrice} 
                          onChange={(e) => handleUpdateItem(idx, 'unitPrice', e.target.value)} 
                          className="print:hidden w-full bg-slate-50 border border-slate-300 rounded-lg p-1 text-center font-bold text-slate-900 font-mono text-[14px] outline-none focus:border-amber-600" 
                        />
                        <span className="hidden print:inline font-bold text-slate-950">{formatNum(item.unitPrice)}</span>
                      </td>

                      <td className="p-2 text-left font-black text-slate-950 font-mono whitespace-nowrap border-l border-slate-200 align-middle text-[14px]">
                        {formatNum(item.total)}
                      </td>

                      <td className="p-1.5 text-center print:hidden align-middle">
                        <button 
                          type="button" 
                          onClick={() => handleDeleteItem(idx)}
                          className="text-rose-400 hover:text-rose-600 p-1.5 rounded hover:bg-rose-50 transition cursor-pointer"
                          title="حذف هذه الفقرة"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* 6. المجموع النهائي والتفقيط */}
            <div className="avoid-break-inside border-2 border-slate-900 rounded-xl overflow-hidden mb-4 bg-slate-50 font-cairo">
              <div className="flex justify-between items-center p-3 bg-slate-100 border-b border-slate-300 text-[14px] font-black">
                <span className="text-slate-900">
                  المجموع الكلي لعطاء المناقصة رقماً ({tierTitleMap[selectedTier].split('(')[0].trim()}) :
                </span>
                <span className="font-mono text-base font-black text-[#ea580c]">
                  {formatNum(totalTenderCost)} د.ع
                </span>
              </div>
              <div className="p-2.5 text-right text-slate-800 text-[14px] font-bold">
                المجموع الكلي كتابةً : <strong className="text-slate-950">{numberToArabicWords(totalTenderCost)}</strong>
              </div>
            </div>

            {/* 7. المساحة السفلى المعتمدة (تعهد العطاء + التواقيع الرسمية + ختم الشركة + رمز التحقق QR) */}
            <div className="avoid-break-inside space-y-3 pt-1 text-[14px] font-cairo">
              
              <div className="p-3 bg-slate-50 border border-slate-300 rounded-xl text-[13px] text-slate-800 leading-relaxed font-semibold">
                <strong>تعهد العقد والالتزام الفني:</strong> يقر الطرفان بصحة وجدية الأسعار والكميات المحددة أعلاه، وتتعهد شركة ({companySettings?.company_name || 'شركة البرج المتألق للمقاولات العامة'}) بتنفيذ وإنجاز كافة الفقرات الموضحة وفق المخططات المعمارية والإنشائية المعتمدة والمواصفات القياسية لأعمال الهندسة المدنية وتعليمات المهندس المشرف، وبكلفة تعاقدية إجمالية قدرها ({formatNum(totalTenderCost)} د.ع) فقط لا غير.
              </div>

              {/* قسم التواقيع والختم ورمز التحقق QR النشط */}
              <div className="flex items-center justify-between pt-4 px-2">
                
                {/* الطرف الأيمن: توقيع المدير المفوض (المسمى الوظيفي فقط بدون اسم شخصي) والختم الرسمي الدائري */}
                <div className="text-center space-y-1">
                  <p className="font-black text-base text-slate-900">المدير المفوض</p>
                  
                  {/* الختم الدائري المعتمد */}
                  <div className="w-24 h-24 mx-auto rounded-full border-2 border-dashed border-[#ea580c] flex flex-col items-center justify-center text-[#ea580c] font-black text-[10px] leading-tight rotate-[-8deg] shadow-2xs bg-[#ea580c]/5 mt-1">
                    <span>★ شركة البرج المتألق ★</span>
                    <span className="text-[11px] font-extrabold my-0.5">مصادق رسمياً</span>
                    <span className="font-mono text-[9px]">{currentDateStr}</span>
                  </div>
                </div>

                {/* المنتصف: توقيع مهندس التخمين والتدقيق */}
                <div className="text-center">
                  <p className="font-bold text-[14px] text-slate-800">المهندس المقيم / مدقق التخمين</p>
                  <div className="border-b border-dashed border-slate-400 w-40 mx-auto mt-10"></div>
                </div>

                {/* الطرف الأيسر: توقيع الزبون / صاحب العمل ورمز التحقق QR الفعّال */}
                <div className="flex flex-col items-center gap-2">
                  <div className="text-center">
                    <p className="font-bold text-[14px] text-slate-800">الطرف الأول (صاحب العمل / المستفيد)</p>
                    <div className="border-b border-dashed border-slate-400 w-44 mx-auto mt-6"></div>
                  </div>

                  {/* رمز التحقق QR الفعّال والديناميكي المرتبط بتفاصيل المشروع */}
                  <div className="flex flex-col items-center mt-1">
                    <div className="w-20 h-20 border-2 border-slate-800 p-1 rounded-lg flex items-center justify-center bg-white shadow-2xs">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img 
                        src={qrVerificationData} 
                        alt="وثيقة التحقق الرقمية للمشروع" 
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="text-[9.5px] font-mono font-black text-slate-800 tracking-wider mt-0.5">DOC VERIFIED</span>
                    <span className="text-[9px] text-slate-500 font-mono">مسح الباركود للتحقق</span>
                  </div>
                </div>

              </div>

              {/* 8. تذييل الكتب الرسمية المعتمد بالكامل (المرفقات + الأرشفة + شريط الهواتف والموقع والعنوان) */}
              <div className="pt-3 border-t border-slate-200 mt-2 text-xs">
                
                <div className="flex justify-between items-center text-[11px] text-slate-600 mb-2 px-1">
                  <span>المرفقات: جدول الكميات والمواصفات الفنية المعتمدة (41 فقرة)</span>
                  <span>نسخة منه إلى: مكتب المدير المفوض / المتابعة / الأرشيف</span>
                </div>

                <div className="border-t-2 border-slate-300 pt-2 text-[12px] text-slate-800 font-bold flex items-center justify-between px-2">
                  
                  {/* أرقام الهواتف */}
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Phone className="w-4 h-4 text-slate-700" />
                    <span className="font-mono text-[13px]">
                      {companySettings?.phone_secondary || '07738006699'} - {companySettings?.phone_primary || '07868006699'}
                    </span>
                  </div>

                  {/* العنوان الجغرافي */}
                  <div className="flex items-center gap-1.5">
                    <MapPin className="w-4 h-4 text-slate-700" />
                    <span>{companySettings?.address || 'العراق - النجف الأشرف - حي الفرات'}</span>
                  </div>

                  {/* الموقع الإلكتروني */}
                  <div className="flex items-center gap-1.5" dir="ltr">
                    <Globe className="w-4 h-4 text-slate-700" />
                    <span className="font-mono text-[12px]">{companySettings?.website || 'www.rtcompany.netlify.app'}</span>
                  </div>

                </div>

                {/* الشريط البرتقالي السفلي الجمالي للكتب الرسمية */}
                <div className="w-full h-2 bg-[#ea580c] rounded-full mt-2.5"></div>

              </div>

            </div>

          </div>

        </div>

      </div>

    </div>
  );
}