// دروس عمومی مشترک آزمون کارشناسی ارشد — زبان عمومی و استعداد تحصیلی
// منابع: سؤالات ادوار گذشته کنکور ارشد سراسری، کتاب زبان عمومی ارشد زیر ذره‌بین، ۵۰۴ واژه، لغات تافل و GRE

export default {
  id: "general",
  title: "دروس عمومی (مشترک همه رشته‌ها)",
  icon: "📚",
  description: "زبان عمومی و استعداد تحصیلی — مشترک بین اکثر رشته‌های کارشناسی ارشد",
  exams: [
    {
      id: "gen-english-1",
      title: "زبان عمومی ارشد — آزمون ۱ (واژگان و گرامر)",
      durationMinutes: 20,
      subjectsLabel: "واژگان، گرامر",
      questions: [
        {
          subject: "واژگان",
          q: "The new policy will ............ small businesses that cannot afford the extra taxes.",
          options: ["adversely affect", "properly enhance", "gradually promote", "financially support"],
          answer: 0,
          explanation: "adversely affect یعنی «تأثیر منفی گذاشتن». جمله می‌گوید کسب‌وکارهای کوچکی که توان پرداخت مالیات اضافه را ندارند، آسیب می‌بینند."
        },
        {
          subject: "واژگان",
          q: "Despite years of research, scientists have not yet found a ............ cure for the disease.",
          options: ["temporary", "definitive", "marginal", "redundant"],
          answer: 1,
          explanation: "definitive cure یعنی «درمان قطعی». با «با وجود سال‌ها تحقیق هنوز پیدا نشده» تنها گزینه معنادار است."
        },
        {
          subject: "واژگان",
          q: "The lecturer's explanation was so ............ that even beginners could understand the complex theory.",
          options: ["obscure", "ambiguous", "lucid", "tedious"],
          answer: 2,
          explanation: "lucid یعنی «روشن و شفاف». obscure و ambiguous یعنی مبهم و tedious یعنی خسته‌کننده که با «حتی مبتدی‌ها فهمیدند» تناقض دارند."
        },
        {
          subject: "واژگان",
          q: "Regular exercise can significantly ............ the risk of heart disease.",
          options: ["mitigate", "aggravate", "accumulate", "stimulate"],
          answer: 0,
          explanation: "mitigate یعنی «کاهش دادن، تخفیف دادن». ورزش منظم خطر بیماری قلبی را کاهش می‌دهد. aggravate یعنی تشدید کردن."
        },
        {
          subject: "واژگان",
          q: "The two researchers reached the same conclusion ............, without knowing about each other's work.",
          options: ["consecutively", "independently", "reluctantly", "deliberately"],
          answer: 1,
          explanation: "independently یعنی «مستقلاً». عبارت «بدون اطلاع از کار یکدیگر» دقیقاً همین معنا را تأیید می‌کند."
        },
        {
          subject: "واژگان",
          q: "Water shortage is one of the most ............ problems facing the region today.",
          options: ["trivial", "obsolete", "pressing", "reversible"],
          answer: 2,
          explanation: "pressing problem یعنی «مشکل مبرم و فوری». trivial یعنی جزئی و obsolete یعنی منسوخ."
        },
        {
          subject: "واژگان",
          q: "The company decided to ............ its outdated equipment with modern machinery.",
          options: ["replace", "restore", "resemble", "retain"],
          answer: 0,
          explanation: "replace ... with یعنی «جایگزین کردن با». retain یعنی نگه داشتن که متضاد منظور جمله است."
        },
        {
          subject: "واژگان",
          q: "His argument was based on ............ evidence, so the committee rejected his proposal.",
          options: ["compelling", "conclusive", "insufficient", "abundant"],
          answer: 2,
          explanation: "چون کمیته پیشنهاد را «رد کرد»، شواهد باید «ناکافی» (insufficient) بوده باشند."
        },
        {
          subject: "گرامر",
          q: "By the time the firefighters arrived, the building ............ completely.",
          options: ["has burned", "had burned", "was burning", "burns"],
          answer: 1,
          explanation: "برای عملی که قبل از عمل دیگری در گذشته کامل شده، از گذشته کامل (had + p.p.) استفاده می‌شود."
        },
        {
          subject: "گرامر",
          q: "Not until the results were published ............ how successful the experiment had been.",
          options: ["the researchers realized", "did the researchers realize", "the researchers did realize", "realized the researchers"],
          answer: 1,
          explanation: "وقتی جمله با عبارت منفی مثل Not until شروع شود، فاعل و فعل کمکی جابه‌جا می‌شوند (inversion): did the researchers realize."
        },
        {
          subject: "گرامر",
          q: "The professor insisted that every student ............ the assignment before the deadline.",
          options: ["submits", "submitted", "submit", "would submit"],
          answer: 2,
          explanation: "بعد از افعالی مانند insist، suggest و recommend در حالت subjunctive، فعل به‌صورت مصدر ساده (بدون s) می‌آید: insist that he submit."
        },
        {
          subject: "گرامر",
          q: "............ the difficulty of the task, they managed to finish it on time.",
          options: ["Despite of", "Although", "In spite of", "Even though"],
          answer: 2,
          explanation: "قبل از اسم (the difficulty) فقط In spite of یا Despite (بدون of) به کار می‌رود. Although و Even though نیاز به جمله کامل دارند."
        },
        {
          subject: "گرامر",
          q: "The report, ............ findings were published last week, has caused much debate.",
          options: ["which", "whose", "that", "its"],
          answer: 1,
          explanation: "برای نشان دادن مالکیت در جمله موصولی از whose استفاده می‌شود: گزارشی که «یافته‌هایش» منتشر شد."
        },
        {
          subject: "گرامر",
          q: "If the samples ............ properly, the experiment would not have failed.",
          options: ["were stored", "had been stored", "have been stored", "would be stored"],
          answer: 1,
          explanation: "جمله شرطی نوع سوم (گذشته غیرواقعی): If + had + p.p. در بخش شرط و would have + p.p. در جواب شرط."
        },
        {
          subject: "گرامر",
          q: "Rarely ............ such a comprehensive study on this subject.",
          options: ["we have seen", "we see", "have we seen", "we saw"],
          answer: 2,
          explanation: "قید منفی Rarely در ابتدای جمله باعث inversion می‌شود: Rarely have we seen."
        }
      ]
    },
    {
      id: "gen-english-2",
      title: "زبان عمومی ارشد — آزمون ۲ (درک مطلب و کلوز)",
      durationMinutes: 25,
      subjectsLabel: "درک مطلب، کلوز تست",
      readings: [
        {
          id: "r1",
          title: "Reading Passage",
          text: "Sleep plays a vital role in learning and memory. During deep sleep, the brain consolidates information acquired during the day, transferring it from short-term to long-term storage. Studies have shown that students who sleep adequately after studying perform significantly better on tests than those who stay up all night reviewing material. Sleep deprivation, on the other hand, impairs attention, working memory, and decision-making. Researchers therefore recommend that students maintain a regular sleep schedule, especially during examination periods, rather than sacrificing sleep for extra hours of study."
        }
      ],
      questions: [
        {
          subject: "درک مطلب",
          reading: "r1",
          q: "What is the main idea of the passage?",
          options: [
            "Students should study more at night.",
            "Sleep is essential for learning and memory.",
            "Tests measure long-term memory only.",
            "Decision-making is unrelated to sleep."
          ],
          answer: 1,
          explanation: "کل متن درباره نقش حیاتی خواب در یادگیری و حافظه است؛ جمله اول متن نیز دقیقاً همین را می‌گوید."
        },
        {
          subject: "درک مطلب",
          reading: "r1",
          q: "According to the passage, during deep sleep the brain ............ .",
          options: [
            "erases unnecessary short-term memories",
            "moves information into long-term storage",
            "stops processing information completely",
            "reviews material like a student"
          ],
          answer: 1,
          explanation: "متن می‌گوید مغز اطلاعات را از حافظه کوتاه‌مدت به بلندمدت منتقل می‌کند (transferring it from short-term to long-term storage)."
        },
        {
          subject: "درک مطلب",
          reading: "r1",
          q: "The word \"impairs\" in the passage is closest in meaning to ............ .",
          options: ["improves", "weakens", "measures", "restores"],
          answer: 1,
          explanation: "impair یعنی «آسیب زدن و ضعیف کردن»؛ کم‌خوابی توجه و حافظه کاری را ضعیف می‌کند. نزدیک‌ترین واژه weakens است."
        },
        {
          subject: "درک مطلب",
          reading: "r1",
          q: "What do researchers recommend to students?",
          options: [
            "Staying up all night before exams",
            "Studying only during the day",
            "Keeping a regular sleep schedule",
            "Avoiding tests when tired"
          ],
          answer: 2,
          explanation: "جمله آخر متن: پژوهشگران توصیه می‌کنند دانشجویان برنامه خواب منظم داشته باشند، به‌ویژه در ایام امتحانات."
        },
        {
          subject: "درک مطلب",
          reading: "r1",
          q: "It can be inferred from the passage that an all-night study session before a test is ............ .",
          options: ["counterproductive", "unavoidable", "beneficial", "traditional"],
          answer: 0,
          explanation: "متن می‌گوید دانشجویانی که می‌خوابند بهتر از شب‌بیدارها عمل می‌کنند؛ پس شب‌بیداری نتیجه معکوس دارد (counterproductive)."
        },
        {
          subject: "کلوز تست",
          q: "Global warming is ............ considered one of the greatest threats to biodiversity.",
          options: ["widely", "narrowly", "hardly", "scarcely"],
          answer: 0,
          explanation: "widely considered یعنی «به‌طور گسترده‌ای ... تلقی می‌شود» — ترکیب رایج (collocation) در انگلیسی آکادمیک."
        },
        {
          subject: "کلوز تست",
          q: "Many species will become extinct ............ urgent measures are taken to protect their habitats.",
          options: ["if", "unless", "because", "since"],
          answer: 1,
          explanation: "unless یعنی «مگر اینکه»: گونه‌ها منقرض می‌شوند مگر اینکه اقدامات فوری انجام شود."
        },
        {
          subject: "کلوز تست",
          q: "The rate of deforestation has increased dramatically ............ the last three decades.",
          options: ["since", "over", "from", "until"],
          answer: 1,
          explanation: "over the last three decades یعنی «طی سه دهه اخیر». برای بازه زمانی با حال کامل، over/during صحیح است؛ since نیاز به نقطه شروع دارد."
        },
        {
          subject: "کلوز تست",
          q: "Scientists warn that ............ action is taken now, the damage may become irreversible.",
          options: ["whether", "however", "unless", "despite"],
          answer: 2,
          explanation: "ساختار شرطی منفی: «مگر اینکه همین حالا اقدام شود، آسیب برگشت‌ناپذیر خواهد شد» — unless."
        },
        {
          subject: "کلوز تست",
          q: "Conservation programs, ............ expensive, are essential for future generations.",
          options: ["despite", "although", "because of", "owing to"],
          answer: 1,
          explanation: "although + صفت (حذف فعل to be): although (they are) expensive. despite نیاز به اسم دارد."
        },
        {
          subject: "واژگان",
          q: "The government allocated additional funds to ............ the effects of the economic crisis.",
          options: ["alleviate", "elevate", "aggravate", "celebrate"],
          answer: 0,
          explanation: "alleviate یعنی «کاستن و تسکین دادن» اثرات بحران. aggravate یعنی بدتر کردن و elevate یعنی بالا بردن."
        },
        {
          subject: "واژگان",
          q: "Her research makes a significant ............ to our understanding of climate change.",
          options: ["contribution", "distribution", "restriction", "prescription"],
          answer: 0,
          explanation: "make a contribution to یعنی «سهم و کمک به». ترکیب ثابت significant contribution بسیار پرتکرار در متون علمی است."
        },
        {
          subject: "واژگان",
          q: "The findings of the study are ............ with previous research in this field.",
          options: ["consistent", "insistent", "resistant", "persistent"],
          answer: 0,
          explanation: "consistent with یعنی «سازگار و هم‌راستا با». عبارت رایج در مقالات علمی برای تأیید نتایج قبلی."
        },
        {
          subject: "واژگان",
          q: "Due to the ambiguity of the question, the students asked the teacher to ............ it.",
          options: ["clarify", "classify", "certify", "quantify"],
          answer: 0,
          explanation: "چون سؤال مبهم (ambiguous) بود، خواستند آن را «شفاف‌سازی» کند: clarify."
        },
        {
          subject: "واژگان",
          q: "The committee will ............ all applications and announce the results next month.",
          options: ["evaluate", "evacuate", "evaporate", "elaborate"],
          answer: 0,
          explanation: "evaluate یعنی «ارزیابی کردن» درخواست‌ها. سایر گزینه‌ها (تخلیه کردن، تبخیر شدن، بسط دادن) بی‌ربط‌اند."
        }
      ]
    },
    {
      id: "gen-gmat-1",
      title: "استعداد تحصیلی — آزمون ۱",
      durationMinutes: 30,
      subjectsLabel: "درک مطلب تحلیلی، کمّی، منطقی",
      questions: [
        {
          subject: "استدلال کمّی",
          q: "اگر قیمت کالایی ابتدا ۲۰٪ افزایش و سپس ۲۰٪ کاهش یابد، قیمت نهایی نسبت به قیمت اولیه چه تغییری کرده است؟",
          options: ["بدون تغییر", "۴٪ کاهش", "۴٪ افزایش", "۲٪ کاهش"],
          answer: 1,
          explanation: "قیمت نهایی = ۱٫۲ × ۰٫۸ = ۰٫۹۶ برابر قیمت اولیه؛ یعنی ۴٪ کاهش."
        },
        {
          subject: "استدلال کمّی",
          q: "میانگین ۵ عدد برابر ۱۲ است. اگر عدد ۳۰ به این اعداد اضافه شود، میانگین جدید چقدر است؟",
          options: ["۱۴", "۱۵", "۱۶", "۱۸"],
          answer: 1,
          explanation: "مجموع ۵ عدد = ۶۰؛ با اضافه شدن ۳۰، مجموع = ۹۰ و تعداد = ۶؛ میانگین = ۹۰ ÷ ۶ = ۱۵."
        },
        {
          subject: "استدلال کمّی",
          q: "کارگری کاری را در ۶ روز و کارگر دیگری همان کار را در ۱۲ روز انجام می‌دهد. اگر با هم کار کنند، کار در چند روز تمام می‌شود؟",
          options: ["۹ روز", "۸ روز", "۴ روز", "۳ روز"],
          answer: 2,
          explanation: "نرخ کار مشترک = ۱/۶ + ۱/۱۲ = ۳/۱۲ = ۱/۴؛ پس کار در ۴ روز تمام می‌شود."
        },
        {
          subject: "استدلال کمّی",
          q: "در دنباله ۲، ۶، ۱۲، ۲۰، ۳۰، ... جمله بعدی کدام است؟",
          options: ["۴۰", "۴۲", "۴۴", "۴۸"],
          answer: 1,
          explanation: "الگوی دنباله n(n+1) است: ۱×۲=۲، ۲×۳=۶، ۳×۴=۱۲، ۴×۵=۲۰، ۵×۶=۳۰، ۶×۷=۴۲."
        },
        {
          subject: "استدلال کمّی",
          q: "اگر ۴۰٪ عددی برابر ۶۰ باشد، ۷۵٪ همان عدد چقدر است؟",
          options: ["۹۰", "۱۰۰", "۱۱۲٫۵", "۱۲۰"],
          answer: 2,
          explanation: "عدد = ۶۰ ÷ ۰٫۴ = ۱۵۰؛ پس ۷۵٪ × ۱۵۰ = ۱۱۲٫۵."
        },
        {
          subject: "استدلال منطقی",
          q: "همه مدیران موفق، شنوندگان خوبی هستند. برخی شنوندگان خوب، سخنرانان ماهری‌اند. کدام نتیجه «قطعاً» درست است؟",
          options: [
            "برخی مدیران موفق سخنران ماهرند",
            "همه سخنرانان ماهر مدیر موفق‌اند",
            "هیچ نتیجه قطعی درباره رابطه مدیران موفق و سخنرانان ماهر نمی‌توان گرفت",
            "شنوندگان خوب همیشه مدیر موفق‌اند"
          ],
          answer: 2,
          explanation: "از «همه A، B هستند» و «برخی B، C هستند» نمی‌توان نتیجه قطعی درباره رابطه A و C گرفت؛ ممکن است اشتراک آن دو گروه از B خارج از A باشد."
        },
        {
          subject: "استدلال منطقی",
          q: "اگر گزاره «هر دانشجوی کوشا در آزمون قبول می‌شود» درست باشد، کدام گزینه لزوماً درست است؟",
          options: [
            "هر که قبول شود کوشا بوده است",
            "هر که قبول نشود کوشا نبوده است",
            "هر دانشجوی غیرکوشا مردود می‌شود",
            "برخی قبول‌شدگان کوشا نیستند"
          ],
          answer: 1,
          explanation: "عکس نقیض گزاره شرطی همیشه هم‌ارز آن است: «اگر کوشا ⟵ قبول» هم‌ارز است با «اگر قبول نشد ⟵ کوشا نبوده»."
        },
        {
          subject: "استدلال منطقی",
          q: "پنج نفر A، B، C، D و E در یک ردیف نشسته‌اند. C دقیقاً در وسط است، D در یکی از دو انتها نشسته و A بلافاصله سمت راست C است. اگر B کنار D نباشد، چه کسی کنار D نشسته است؟",
          options: ["A", "B", "E", "C"],
          answer: 2,
          explanation: "C در جایگاه ۳ و A در جایگاه ۴ است. D در جایگاه ۱ یا ۵ است. همسایه D فقط می‌تواند از بین B و E باشد (A و C جایشان مشخص است)؛ چون B کنار D نیست، ناچار E کنار D می‌نشیند."
        },
        {
          subject: "استدلال منطقی",
          q: "«هیچ فلزی عایق نیست. برخی مواد عایق، پلاستیکی‌اند.» کدام نتیجه معتبر است؟",
          options: [
            "برخی پلاستیک‌ها فلز نیستند",
            "هیچ پلاستیکی فلز نیست",
            "همه پلاستیک‌ها عایق‌اند",
            "برخی فلزات پلاستیکی‌اند"
          ],
          answer: 0,
          explanation: "برخی مواد پلاستیکی عایق‌اند و هیچ عایقی فلز نیست؛ پس همان «برخی پلاستیک‌ها» قطعاً فلز نیستند. تعمیم به «هیچ پلاستیکی» معتبر نیست."
        },
        {
          subject: "درک مطلب تحلیلی",
          q: "«افزایش تعداد خودروها به‌تنهایی عامل آلودگی هوا نیست؛ کیفیت سوخت و فرسودگی ناوگان نیز نقش مهمی دارند.» نویسنده با این جمله چه چیزی را رد می‌کند؟",
          options: [
            "نقش خودروها در آلودگی هوا",
            "تک‌عاملی بودن علت آلودگی هوا",
            "اهمیت کیفیت سوخت",
            "لزوم نوسازی ناوگان"
          ],
          answer: 1,
          explanation: "قید «به‌تنهایی» نشان می‌دهد نویسنده تک‌عاملی دانستن علت آلودگی را رد می‌کند، نه اصل نقش خودروها را."
        },
        {
          subject: "استدلال کمّی",
          q: "نسبت سن پدر به پسر ۷ به ۲ است. اگر مجموع سن آن‌ها ۵۴ سال باشد، پسر چند سال دارد؟",
          options: ["۱۰", "۱۲", "۱۴", "۱۶"],
          answer: 1,
          explanation: "مجموع نسبت‌ها = ۹؛ هر واحد = ۵۴ ÷ ۹ = ۶؛ سن پسر = ۲ × ۶ = ۱۲ سال."
        },
        {
          subject: "استدلال کمّی",
          q: "احتمال آنکه در دو بار پرتاب یک سکه سالم، حداقل یک «شیر» بیاید چقدر است؟",
          options: ["۱/۲", "۱/۴", "۳/۴", "۲/۳"],
          answer: 2,
          explanation: "احتمال هیچ شیر (هر دو خط) = ۱/۴؛ پس حداقل یک شیر = ۱ − ۱/۴ = ۳/۴."
        },
        {
          subject: "استدلال منطقی",
          q: "در یک استدلال، «تعمیم شتاب‌زده» زمانی رخ می‌دهد که ............",
          options: [
            "از نمونه‌های اندک و غیرمعرف، نتیجه کلی گرفته شود",
            "به جای نقد استدلال، شخصیت گوینده نقد شود",
            "دو رویداد هم‌زمان، علت و معلول فرض شوند",
            "از مرجع نامعتبر نقل قول شود"
          ],
          answer: 0,
          explanation: "مغالطه تعمیم شتاب‌زده (Hasty Generalization) یعنی نتیجه‌گیری کلی از نمونه‌های ناکافی. گزینه ۲ مغالطه حمله شخصی و گزینه ۳ مغالطه علت شمردن هم‌زمانی است."
        },
        {
          subject: "استدلال کمّی",
          q: "مساحت مربعی که قطر آن ۸ سانتی‌متر است چند سانتی‌متر مربع است؟",
          options: ["۱۶", "۳۲", "۶۴", "۲۴"],
          answer: 1,
          explanation: "مساحت مربع بر حسب قطر = d²/۲ = ۶۴ ÷ ۲ = ۳۲ سانتی‌متر مربع."
        },
        {
          subject: "درک مطلب تحلیلی",
          q: "«اگر بودجه پژوهش افزایش نیابد، مهاجرت نخبگان ادامه خواهد یافت. بودجه پژوهش افزایش نیافته است.» نتیجه منطقی این دو مقدمه چیست؟",
          options: [
            "مهاجرت نخبگان ادامه خواهد یافت",
            "مهاجرت نخبگان متوقف می‌شود",
            "بودجه پژوهش کافی است",
            "نمی‌توان هیچ نتیجه‌ای گرفت"
          ],
          answer: 0,
          explanation: "قیاس استثنایی وضع مقدم (Modus Ponens): شرط «عدم افزایش بودجه» محقق شده، پس تالی یعنی «ادامه مهاجرت نخبگان» نتیجه می‌شود."
        }
      ]
    }
  ]
};
