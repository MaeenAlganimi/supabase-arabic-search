import { embedDocument, type Topic } from "./embed";

export type Document = {
  id: string;
  title: string;
  body: string;
  language: "ar" | "en";
  topics: Topic[];
  embedding: number[];
};

type RawDocument = Omit<Document, "embedding">;

const RAW_DOCUMENTS: RawDocument[] = [
  {
    id: "coffee-yemen-ar",
    title: "قَهْوَةُ المخا",
    language: "ar",
    topics: ["coffee", "trade"],
    body: "كان بن يمني يُحمَّل في ميناء المخا بعد أن يجف فوق المدرجات. هذه القهــــوة تُغلى بنار هادئة، وتُشرب في فنجان صغير بلا عجلة.",
  },
  {
    id: "coffee-journey-en",
    title: "From the terraces to the cup",
    language: "en",
    topics: ["coffee", "trade"],
    body: "Mocha lent its name to a port before it named a drink. Coffee beans dried on high terraces, crossed the water in sacks, and arrived bitter and dark. A small cup was enough.",
  },
  {
    id: "coffee-majlis-ar",
    title: "فنجان الضيف",
    language: "ar",
    topics: ["coffee"],
    body: "في المجلــــس تُدار الدلة من اليمين. تُقدَّم قهوة الضيف أولاً، والهيل اختياري. رد الفنجان بلطف يعني أن الضيف اكتفى.",
  },
  {
    id: "dates-oasis-ar",
    title: "تمر الواحة",
    language: "ar",
    topics: ["food"],
    body: "يُقطف التمر حين يلين، ويُحفظ في خصاف من خوص النخل. بعد الغداء تكفي تمرة واحدة وماء بارد، ويبقى الفائض للمسافر.",
  },
  {
    id: "dates-table-en",
    title: "Dates after the meal",
    language: "en",
    topics: ["food"],
    body: "An oasis harvest is judged by texture. Soft dates are pressed into baskets of palm leaf. At the end of lunch, one date and cold water close the table.",
  },
  {
    id: "coral-red-sea-ar",
    title: "حدائق المرجان",
    language: "ar",
    topics: ["sea"],
    body: "في بحر دافئ تنمو مستعمرات المرجان عند حافة ضحلة. الأسماك الصغيرة تعبر كخيط فضة، والغواص يعد الألوان ولا يلمس غصناً.",
  },
  {
    id: "coral-gardens-en",
    title: "Coral gardens of the Red Sea",
    language: "en",
    topics: ["sea"],
    body: "On a shallow ledge the coral reef builds slowly. Small fish cross like silver thread, and a diver counts colors without touching a branch of the reef.",
  },
  {
    id: "incense-caravan-ar",
    title: "قافلة اللبان",
    language: "ar",
    topics: ["trade", "desert"],
    body: "يُجمع لبان أبيض من جرح صغير في اللحاء. تسير القافلة ليلاً حين يبرد الرمل، والحمولة خفيفة ورائحتها أقوى من وزنها.",
  },
  {
    id: "incense-road-en",
    title: "The incense road",
    language: "en",
    topics: ["trade", "desert"],
    body: "A frankincense tree gives resin after a shallow cut in the bark. Caravans preferred the night, when the sand cooled, carrying incense lighter than its scent.",
  },
  {
    id: "empty-quarter-ar",
    title: "ليل الربع الخالي",
    language: "ar",
    topics: ["desert"],
    body: "في الصحراء تتسع السماء حتى يصغر الكلام. الرمل يحفظ أثر القدم إلى أن تأتي ريح، والنجوم تكفي دليلاً لمن يعرف الجهات.",
  },
  {
    id: "dunes-walk-en",
    title: "Walking the dunes",
    language: "en",
    topics: ["desert"],
    body: "The empty quarter makes speech feel too large. Footprints last until wind rewrites them, and the stars are a practical map if you can read the dunes.",
  },
  {
    id: "falaj-mountains-ar",
    title: "أفلاج الجبل",
    language: "ar",
    topics: ["water"],
    body: "الفلج قناة تحت الأرض تنقل الماء من عين عالية إلى بساتين النخيل. يتقاسم المزارعون الساعات، ولكل حقل موعد لا يتقدم عليه أحد.",
  },
  {
    id: "falaj-hours-en",
    title: "Falaj channels",
    language: "en",
    topics: ["water"],
    body: "A falaj is a covered channel that carries spring water from high ground to palm gardens. Farmers share hours of flow as carefully as they share volume. The aflaj still mark the week.",
  },
  {
    id: "barjeel-ar",
    title: "أبراج الهواء",
    language: "ar",
    topics: ["architecture"],
    body: "برج الهواء يلتقط نسيم السطح ويهبط به إلى المجلس. في بيت الفناء يبرد الحجر قبل الجدار، والظل مادة بناء لا زينة.",
  },
  {
    id: "courtyard-en",
    title: "Courtyards and wind catchers",
    language: "en",
    topics: ["architecture"],
    body: "A barjeel catches the breeze above the roof and drops it into the sitting room. In a courtyard house the stone cools first, and shade is a building material.",
  },
  {
    id: "naskh-ahmad-ar",
    title: "القلم وخط النسخ",
    language: "ar",
    topics: ["calligraphy"],
    body: "يُبرى القصب بزاوية حادة ثم يُغمس في الحبر. خط النسخ واضح في القراءة، وكان أَحْمَد يحاسب كل سن في القلم قبل أن يكتب سطراً.",
  },
  {
    id: "reed-pen-en",
    title: "Learning the reed pen",
    language: "en",
    topics: ["calligraphy"],
    body: "A reed is cut at a sharp angle and dipped once. Naskh stays legible at small sizes. Ahmad was the slow student, because he checked every tooth of the nib.",
  },
  {
    id: "rain-threshold-ar",
    title: "مطر على العتبة",
    language: "ar",
    topics: ["poetry"],
    body: "مطر خفيف لا يكفي السيل، يكفي أن يغسل العتبة. كتب أحدهم في الهامش: على المطر أن يعود، وعلى الباب أن يبقى مفتوحاً.",
  },
  {
    id: "translating-rain-en",
    title: "Translating rain",
    language: "en",
    topics: ["poetry"],
    body: "A light rain will not fill the wadi, but it will rinse the threshold. The poem in the margin asked the door to stay open until the cloud returned.",
  },
  {
    id: "grammar-verb-ar",
    title: "الجملة والفعل",
    language: "ar",
    topics: ["grammar"],
    body: "في درس نحو يبدأ الفعل ثم يأتي الفاعل. الجذر الثلاثي يفتح أبواباً: من كتب تُشتق الكتابة والكاتب والمكتب. يُقرأ الكتاب بصوت عال قبل الإعراب.",
  },
  {
    id: "roots-patterns-en",
    title: "Roots and patterns",
    language: "en",
    topics: ["grammar"],
    body: "Arabic grammar often starts with the verb, then the subject. A three-letter root opens a family of words. The pattern does as much work as the root.",
  },
  {
    id: "oud-room-ar",
    title: "عود في غرفة صغيرة",
    language: "ar",
    topics: ["music"],
    body: "يكفي عود واحد وغرفة لا ترد الصدى كثيراً. المقام يبدأ من قرار منخفض، والأصابع تحفظ الطريق أكثر مما يحفظه الورق.",
  },
  {
    id: "maqam-oud-en",
    title: "Maqam in a small room",
    language: "en",
    topics: ["music"],
    body: "One oud is enough if the room does not answer too loudly. A maqam begins on a low note, and the fingers remember the path better than the page does.",
  },
  {
    id: "crescent-ar",
    title: "رؤية الهلال",
    language: "ar",
    topics: ["astronomy"],
    body: "فوق سطح المسجد يُرقب الهلال بعين مجردة. التقويم يبدأ بالشهادة لا بالجدول وحده، وإن غامت السماء أُكمل الشهر ثلاثين يوماً.",
  },
  {
    id: "astrolabe-en",
    title: "Night clocks",
    language: "en",
    topics: ["astronomy"],
    body: "An astrolabe turns the sky into a flat plate of brass. Observers still watched the moon with the naked eye, because a calendar begins with a witness.",
  },
  {
    id: "pearl-dive-ar",
    title: "غوص اللؤلؤ",
    language: "ar",
    topics: ["sea", "trade"],
    body: "يغوص البحارة بحبل ونفس طويل، ويحملون اللؤلؤ في منديل. البحر يعطي ببطء، والموسم قصير، والحكاية في المجلس أطول من الغوصة.",
  },
  {
    id: "levantine-breakfast-en",
    title: "A Levantine breakfast",
    language: "en",
    topics: ["food"],
    body: "Warm bread, olive oil, thyme, and tomatoes cut thick. Breakfast is a savoury hour, and nobody reaches for kunafa until the tea is poured.",
  },
  {
    id: "kunafa-ar",
    title: "كنافة وجبن",
    language: "ar",
    topics: ["food"],
    body: "تُخبز الكنافة حتى تحمر الشعيرية، ثم تُقلب فوق الجبن المالح. يُسكب القطر بارداً فوق الصينية الساخنة حتى تُسمع الطقطقة.",
  },
  {
    id: "margin-note-ar",
    title: "حاشية في المكتبة",
    language: "ar",
    topics: ["calligraphy", "grammar"],
    body: "في مكتبة الحي نسخة من كتاب نحو قديم. في هامشها سطر بخط أحمد: راجع هذه المسألة مساءً. الورق أصفر والحبر ثابت.",
  },
  {
    id: "courtyard-cistern-en",
    title: "The cistern under the courtyard",
    language: "en",
    topics: ["architecture", "water"],
    body: "Rain from the roof runs to a cistern beneath the courtyard. In a dry month the bucket goes down on a rope, and the water tastes faintly of stone.",
  },
];

export const DOCUMENTS: Document[] = RAW_DOCUMENTS.map((document) => ({
  ...document,
  embedding: embedDocument(document.topics),
}));
