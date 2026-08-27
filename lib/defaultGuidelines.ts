import prisma from "@/lib/prisma";

export interface GuidelineItem {
  id: string;
  serviceKey?: string;
  title: string;
  requiredDocs: string;
  badge?: string;
}

export interface SystemGuidelineData {
  title: string;
  headerNotice: string;
  items: GuidelineItem[];
  footerNoticeTitle: string;
  footerRules: string[];
}

export const DEFAULT_GUIDELINE_DATA: SystemGuidelineData = {
  title: "የሰነድ ማደሻ እና ማስተካከያ አስፈላጊ መስፈርቶች (Required Documents Guide)",
  headerNotice: "ባለሙያ ጋር ሄደው መረጃዎን ለማስተካከል ሲሄዱ ይዘውት መቅረብ ያለብዎት የሰነድ ዝርዝር በአጭሩ ይህንን ይመስላል፡-",
  items: [
    {
      id: "name_major",
      serviceKey: "NAME_CHANGE",
      title: "ለዋናው ስም ለውጥ",
      requiredDocs: "የስም ለውጡን የሚያረጋግጥ የፍርድ ቤት ውሳኔ (ክብ ማህተም ያለው)",
      badge: "የፍርድ ቤት ውሳኔ",
    },
    {
      id: "name_minor",
      serviceKey: "NAME_CHANGE",
      title: "ለአነስተኛ የስም ማስተካከያ (የፊደል ግድፈት)",
      requiredDocs: "የነዋሪነት መታወቂያ፣ ፓስፖርት፣ የመንጃ ፈቃድ፣ ወይም ቢጫ ካርድ",
      badge: "መታወቂያ / ፓስፖርት / መንጃ ፈቃድ",
    },
    {
      id: "name_parent",
      serviceKey: "NAME_CHANGE",
      title: "ለአባት ወይም አያት ስም ለውጥ",
      requiredDocs: "የአባትነት ማረጋገጫ ወይም የጉዲፈቻ የፍርድ ቤት ውሳኔ (ክብ ማህተም ያለው)",
      badge: "የአባትነት ማረጋገጫ / ጉዲፈቻ ውሳኔ",
    },
    {
      id: "dob",
      serviceKey: "DOB",
      title: "ለትውልድ ቀን ማስተካከያ",
      requiredDocs: "የልደት ሰርተፍኬት፣ የነዋሪነት መታወቂያ፣ ፓስፖርት፣ የጡረታ መታወቂያ፣ የፍርድ ቤት ውሳኔ፣ ወይም የመንጃ ፈቃድ",
      badge: "የልደት ሰርተፍኬት / መታወቂያ",
    },
    {
      id: "address",
      serviceKey: "ADDRESS",
      title: "ለአድራሻ ለውጥ",
      requiredDocs: "የነዋሪነት መታወቂያ፣ የፍርድ ቤት ውሳኔ፣ የትምህርት ቤት/የስራ መታወቂያ፣ ከቀበሌ/ወረዳ/መንግስት ተቋም የተሰጠ ደብዳቤ፣ ወይም የመንጃ ፈቃድ",
      badge: "የነዋሪነት መታወቂያ / ደብዳቤ",
    },
    {
      id: "nat_eth",
      serviceKey: "NATIONALITY",
      title: "ዜግነት ወደ ኢትዮጵያዊ ለመቀየር",
      requiredDocs: "ከኢሚግሬሽን እና ዜግነት አገልግሎት የተሰጠ የውሳኔ ደብዳቤ ብቻ",
      badge: "የኢሚግሬሽን ውሳኔ ደብዳቤ",
    },
    {
      id: "nat_foreign",
      serviceKey: "NATIONALITY",
      title: "ዜግነት ወደ ውጭ ዜጋ ለመቀየር",
      requiredDocs: "የውጭ ሀገር ፓስፖርት እና (የሥራ ፈቃድ ወይም የመኖሪያ ፈቃድ)",
      badge: "የውጭ ፓስፖርት + ፈቃድ",
    },
    {
      id: "phone_email",
      serviceKey: "PHONE",
      title: "ለስልክ ቁጥር እና ኢሜይል ማስተካከያ",
      requiredDocs: "ምንም ሰነድ አያስፈልግም (የማረጋገጫ ኮድ ስለሚላክ አዲሱን ስልክዎን መያዝ ብቻ በቂ ነው)",
      badge: "ሰነድ አያስፈልግም",
    },
  ],
  footerNoticeTitle: "ወደ ባለሙያው ሲሄዱ እንዳይረሱ፦",
  footerRules: [
    "የሚይዟቸው ሰነዶች በሙሉ ኦሪጅናል (ዋናው) መሆን አለባቸው (ፎቶ ኮፒ ተቀባይነት የለውም)።",
    "የሰነዶቹ የአገልግሎት ጊዜ ያላለፈበት (Valid) መሆን አለበት።",
    "የፍርድ ቤት ውሳኔ ይዘው የሚሄዱ ከሆነ እና በአማርኛ ያልተጻፈ ከሆነ፤ ህጋዊ ማህተም ባለው የትርጉም ቢሮ ወደ አማርኛ አስተርጉመው መያዝ አለብዎት።",
    "ሰነዶቹ ላይ ያለው ፎቶ እና ማህተም በግልጽ የሚታይ፣ ያልተፋቀ እና ያልተቀደደ መሆን አለበት።",
  ],
};

export async function getSystemGuidelines(): Promise<SystemGuidelineData> {
  try {
    const record = await prisma.systemGuideline.findFirst({
      orderBy: { createdAt: "desc" },
    });

    if (record && record.contentJson) {
      const data = record.contentJson as unknown as SystemGuidelineData;
      return {
        title: data.title || DEFAULT_GUIDELINE_DATA.title,
        headerNotice: data.headerNotice || DEFAULT_GUIDELINE_DATA.headerNotice,
        items: Array.isArray(data.items) && data.items.length > 0 ? data.items : DEFAULT_GUIDELINE_DATA.items,
        footerNoticeTitle: data.footerNoticeTitle || DEFAULT_GUIDELINE_DATA.footerNoticeTitle,
        footerRules: Array.isArray(data.footerRules) && data.footerRules.length > 0 ? data.footerRules : DEFAULT_GUIDELINE_DATA.footerRules,
      };
    }

    // Seed into DB if first time
    const created = await prisma.systemGuideline.create({
      data: {
        title: DEFAULT_GUIDELINE_DATA.title,
        headerNotice: DEFAULT_GUIDELINE_DATA.headerNotice,
        footerNotice: DEFAULT_GUIDELINE_DATA.footerRules.join("\n"),
        contentJson: DEFAULT_GUIDELINE_DATA as any,
      },
    });

    return created.contentJson as unknown as SystemGuidelineData;
  } catch (error) {
    console.error("Error loading guidelines from DB:", error);
    return DEFAULT_GUIDELINE_DATA;
  }
}
