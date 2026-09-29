/**
 * Home screen quotes. Tone: mostly wise and warm, about a third with the
 * brand's dry sarcasm. Gender-neutral wording so every reader fits.
 * Each entry is [ru, uk, en] so the same quote follows a language switch.
 */

type Locale = 'ru' | 'uk' | 'en';

const Q: [string, string, string][] = [
  ['Карты не предсказывают будущее. Они показывают, куда ты уже идёшь.', 'Карти не передбачають майбутнє. Вони показують, куди ти вже йдеш.', 'Cards don’t predict the future. They show where you are already heading.'],
  ['Интуиция шепчет. Паника кричит. Слушай ту, что тише.', 'Інтуїція шепоче. Паніка кричить. Слухай ту, що тихіша.', 'Intuition whispers. Panic shouts. Listen to the quieter one.'],
  ['Вселенная не опаздывает. Она просто не сверяется с твоим календарём.', 'Всесвіт не запізнюється. Він просто не звіряється з твоїм календарем.', 'The universe is never late. It just doesn’t check your calendar.'],
  ['Каждый расклад начинается с честного вопроса к себе.', 'Кожен розклад починається з чесного запитання до себе.', 'Every reading starts with an honest question to yourself.'],
  ['Луна меняет форму каждую ночь и не извиняется за это.', 'Місяць змінює форму щоночі й не перепрошує за це.', 'The Moon changes shape every night and never apologises for it.'],
  ['Тишина — тоже ответ. Иногда самый точный.', 'Тиша — теж відповідь. Іноді найточніша.', 'Silence is an answer too. Sometimes the most precise one.'],
  ['Не всё, что уходит, потеряно. Часть просто освобождает место.', 'Не все, що йде, втрачено. Частина просто звільняє місце.', 'Not everything that leaves is lost. Some of it just makes room.'],
  ['Звёзды не решают за тебя. Они подсвечивают варианты.', 'Зірки не вирішують за тебе. Вони підсвічують варіанти.', 'The stars don’t decide for you. They light up the options.'],
  ['То, что ты ищешь, тоже ищет тебя.', 'Те, що ти шукаєш, теж шукає тебе.', 'What you are looking for is looking for you too.'],
  ['Самая сильная карта в колоде — твоё решение.', 'Найсильніша карта в колоді — твоє рішення.', 'The strongest card in the deck is your decision.'],
  ['Перевёрнутая карта не проклятие, а просьба посмотреть под другим углом.', 'Перевернута карта не прокляття, а прохання подивитися під іншим кутом.', 'A reversed card isn’t a curse. It asks you to look from another angle.'],
  ['Судьба любит тех, кто делает первый шаг.', 'Доля любить тих, хто робить перший крок.', 'Fate loves those who take the first step.'],
  ['Сомнение не враг. Это компас, который пока не настроен.', 'Сумнів не ворог. Це компас, який поки не налаштований.', 'Doubt isn’t the enemy. It’s a compass that isn’t calibrated yet.'],
  ['Не нужно знать весь путь. Достаточно видеть следующий шаг.', 'Не треба знати весь шлях. Досить бачити наступний крок.', 'You don’t need the whole path. Seeing the next step is enough.'],
  ['Магия начинается там, где заканчивается «а вдруг не получится».', 'Магія починається там, де закінчується «а раптом не вийде».', 'Magic begins where “what if it doesn’t work” ends.'],
  ['Всё важное случается в тишине, пока никто не смотрит.', 'Усе важливе стається в тиші, поки ніхто не дивиться.', 'Everything important happens quietly, while nobody is watching.'],
  ['Карта Смерти означает перемены. Паниковать можно, но необязательно.', 'Карта Смерті означає зміни. Панікувати можна, але не обов’язково.', 'The Death card means change. You may panic, but it’s optional.'],
  ['Когда закрывается дверь, проверь окна. И подвал.', 'Коли зачиняються двері, перевір вікна. І підвал.', 'When a door closes, check the windows. And the basement.'],
  ['Твоя энергия идёт туда, куда смотрит внимание.', 'Твоя енергія йде туди, куди дивиться увага.', 'Your energy flows where your attention goes.'],
  ['Прошлое не изменить, но можно перестать его перечитывать.', 'Минуле не змінити, але можна перестати його перечитувати.', 'You can’t change the past, but you can stop rereading it.'],
  ['Звёзды складываются для тех, кто не боится темноты.', 'Зірки складаються для тих, хто не боїться темряви.', 'Stars align for those who aren’t afraid of the dark.'],
  ['Знаки повсюду. Проблема в том, что мы ждём неоновую вывеску.', 'Знаки всюди. Проблема в тому, що ми чекаємо неонову вивіску.', 'Signs are everywhere. The problem is we keep waiting for a neon one.'],
  ['Не проси у Вселенной лёгкой дороги. Проси крепкие ботинки.', 'Не проси у Всесвіту легкої дороги. Проси міцні черевики.', 'Don’t ask the universe for an easy road. Ask for sturdy boots.'],
  ['Каждое новолуние даёт шанс начать без черновиков.', 'Кожен молодик дає шанс почати без чернеток.', 'Every new moon is a chance to start without drafts.'],
  ['Ответы приходят, когда перестаёшь задавать вопрос по сто раз.', 'Відповіді приходять, коли перестаєш питати одне й те саме сто разів.', 'Answers arrive once you stop asking the same question a hundred times.'],
  ['Мудрость — это знать, какой вопрос не задавать.', 'Мудрість — це знати, якого питання не ставити.', 'Wisdom is knowing which question not to ask.'],
  ['Иногда карты говорят «подожди». Это тоже ответ, просто не тот, что хотелось.', 'Іноді карти кажуть «зачекай». Це теж відповідь, просто не та, що хотілося.', 'Sometimes the cards say “wait”. It’s still an answer, just not the one you wanted.'],
  ['Колесо Фортуны вертится. Главное не стоять под ним.', 'Колесо Фортуни крутиться. Головне не стояти під ним.', 'The Wheel of Fortune keeps turning. Just don’t stand under it.'],
  ['Смелость не в том, чтобы не бояться, а в том, чтобы идти с дрожащими коленями.', 'Сміливість не в тому, щоб не боятися, а в тому, щоб іти з тремтячими колінами.', 'Courage isn’t the absence of fear. It’s walking on shaking knees.'],
  ['Всё происходит вовремя. Даже если кажется иначе.', 'Усе відбувається вчасно. Навіть якщо здається інакше.', 'Everything happens on time. Even when it doesn’t feel like it.'],
  ['Интуиция никогда не опаздывает. Опаздывает только наше доверие к ней.', 'Інтуїція ніколи не запізнюється. Запізнюється лише наша довіра до неї.', 'Intuition is never late. Only our trust in it is.'],
  ['Отпусти то, что держит без пользы. Даже если это привычка.', 'Відпусти те, що тримає без користі. Навіть якщо це звичка.', 'Let go of what holds you for nothing. Even if it’s a habit.'],
  ['Лунный свет ничего не прячет. Он просто делает тени мягче.', 'Місячне світло нічого не ховає. Воно просто робить тіні м’якшими.', 'Moonlight hides nothing. It just makes the shadows softer.'],
  ['Не каждый поворот — ошибка. Некоторые — короткий путь.', 'Не кожен поворот — помилка. Деякі — короткий шлях.', 'Not every turn is a mistake. Some are shortcuts.'],
  ['Твой путь не обязан быть понятен другим.', 'Твій шлях не мусить бути зрозумілим іншим.', 'Your path doesn’t have to make sense to others.'],
  ['Карта дня — не приговор, а подсказка к утру.', 'Карта дня — не вирок, а підказка до ранку.', 'The card of the day isn’t a verdict. It’s a hint for the morning.'],
  ['Самые важные двери открываются изнутри.', 'Найважливіші двері відчиняються зсередини.', 'The most important doors open from the inside.'],
  ['Ты сильнее любого расклада. Карты это знают.', 'Ти сильніше за будь-який розклад. Карти це знають.', 'You are stronger than any reading. The cards know it.'],
  ['Вселенная отвечает на действия, а не на мечты в подушку.', 'Всесвіт відповідає на дії, а не на мрії в подушку.', 'The universe answers actions, not dreams whispered into a pillow.'],
  ['Если карта пришла дважды, Вселенная настаивает.', 'Якщо карта прийшла двічі, Всесвіт наполягає.', 'If a card shows up twice, the universe insists.'],
  ['Истина редко кричит. Обычно она тихо ждёт, пока ты перестанешь спорить.', 'Істина рідко кричить. Зазвичай вона тихо чекає, поки ти перестанеш сперечатися.', 'Truth rarely shouts. It quietly waits until you stop arguing.'],
  ['Лучший талисман — выспаться.', 'Найкращий талісман — виспатися.', 'The best talisman is a good night’s sleep.'],
  ['Звезда в раскладе напоминает: надежда тоже стратегия.', 'Зірка в розкладі нагадує: надія теж стратегія.', 'The Star in a spread reminds you: hope is a strategy too.'],
  ['Будущее пишется не картами, а тем, что ты сделаешь после расклада.', 'Майбутнє пишуть не карти, а те, що ти зробиш після розкладу.', 'The future isn’t written by the cards but by what you do after the reading.'],
  ['Никакой ретроградный Меркурий не отменяет здравый смысл.', 'Жоден ретроградний Меркурій не скасовує здорового глузду.', 'No retrograde Mercury cancels common sense.'],
  ['Жизнь как колода: карты не выбираешь, но решаешь, как сыграть.', 'Життя як колода: карти не обираєш, але вирішуєш, як зіграти.', 'Life is a deck: you don’t pick the cards, but you choose how to play them.'],
  ['Боишься перемен? Они уже начались, просто без тебя.', 'Боїшся змін? Вони вже почалися, просто без тебе.', 'Afraid of change? It already started, just without you.'],
  ['Внутренний голос не спорит. Он просто повторяет, пока не услышишь.', 'Внутрішній голос не сперечається. Він просто повторює, поки не почуєш.', 'Your inner voice doesn’t argue. It repeats itself until you listen.'],
  ['Мир не против тебя. Он просто занят собой.', 'Світ не проти тебе. Він просто зайнятий собою.', 'The world isn’t against you. It’s just busy with itself.'],
  ['Отшельник в раскладе не про одиночество, а про время на себя.', 'Відлюдник у розкладі не про самотність, а про час на себе.', 'The Hermit isn’t about loneliness. It’s about time for yourself.'],
  ['Каждый конец — чьё-то начало. Иногда твоё.', 'Кожен кінець — чийсь початок. Іноді твій.', 'Every ending is someone’s beginning. Sometimes yours.'],
  ['Счастье любит тишину. Особенно в соцсетях.', 'Щастя любить тишу. Особливо в соцмережах.', 'Happiness loves silence. Especially on social media.'],
  ['Не спеши с выводами. Колода ещё не закончилась.', 'Не поспішай із висновками. Колода ще не закінчилася.', 'Don’t jump to conclusions. The deck isn’t finished yet.'],
  ['Время лечит. Но таро быстрее ставит диагноз.', 'Час лікує. Але таро швидше ставить діагноз.', 'Time heals. Tarot just diagnoses faster.'],
  ['Там, где страшно, обычно растёт что-то важное.', 'Там, де страшно, зазвичай росте щось важливе.', 'Where it feels scary, something important is usually growing.'],
  ['Сравнивать свой путь с чужим — всё равно что читать чужой гороскоп.', 'Порівнювати свій шлях із чужим — те саме, що читати чужий гороскоп.', 'Comparing your path to someone else’s is like reading their horoscope.'],
  ['Прими свою тень. Без неё не было бы объёма.', 'Прийми свою тінь. Без неї не було б об’єму.', 'Embrace your shadow. Without it there would be no depth.'],
  ['Звёзды советуют, а решаешь всё равно ты.', 'Зірки радять, а вирішуєш усе одно ти.', 'The stars advise. You still decide.'],
  ['Энергия, потраченная на обиду, могла бы стать твоей силой.', 'Енергія, витрачена на образу, могла б стати твоєю силою.', 'The energy spent on a grudge could have become your strength.'],
  ['Королева Кубков знает: чувствовать — не слабость.', 'Королева Кубків знає: відчувати — не слабкість.', 'The Queen of Cups knows: feeling is not weakness.'],
  ['Иногда лучший расклад — чашка чая и выключенный телефон.', 'Іноді найкращий розклад — чашка чаю й вимкнений телефон.', 'Sometimes the best reading is a cup of tea and a phone switched off.'],
  ['Когда всё рушится, проверь, не строится ли что-то новое.', 'Коли все руйнується, перевір, чи не будується щось нове.', 'When everything falls apart, check whether something new is being built.'],
  ['Удача любит подготовленных. И немного наглых.', 'Удача любить підготовлених. І трохи нахабних.', 'Luck favours the prepared. And the slightly cheeky.'],
  ['Магия не в картах, а в вопросах, которые ты наконец задаёшь.', 'Магія не в картах, а в питаннях, які ти нарешті ставиш.', 'The magic isn’t in the cards but in the questions you finally ask.'],
  ['Любой путь начинается с «ладно, попробую».', 'Будь-який шлях починається з «гаразд, спробую».', 'Every journey begins with “fine, I’ll try”.'],
  ['Карты не врут. Врёт тот, кто задаёт вопрос, уже зная ответ.', 'Карти не брешуть. Бреше той, хто ставить питання, вже знаючи відповідь.', 'Cards don’t lie. People who ask while already knowing the answer do.'],
  ['Не всё нужно понимать. Кое-что достаточно почувствовать.', 'Не все треба розуміти. Дещо досить відчути.', 'Not everything needs understanding. Some things just need feeling.'],
  ['Сегодняшний хаос — завтрашний опыт.', 'Сьогоднішній хаос — завтрашній досвід.', 'Today’s chaos is tomorrow’s experience.'],
  ['Твой главный оберег — умение говорить «нет».', 'Твій головний оберіг — уміння казати «ні».', 'Your best amulet is the ability to say “no”.'],
  ['Не каждая буря приходит разрушать. Некоторые расчищают дорогу.', 'Не кожна буря приходить руйнувати. Деякі розчищають дорогу.', 'Not every storm comes to destroy. Some clear the road.'],
  ['Полнолуние обостряет эмоции. Это не повод писать бывшему.', 'Повня загострює емоції. Це не привід писати колишньому.', 'The full moon heightens emotions. That’s not a reason to text your ex.'],
  ['Вселенная посылает знаки. Но счета всё равно оплачивать самостоятельно.', 'Всесвіт посилає знаки. Але рахунки все одно сплачувати самотужки.', 'The universe sends signs. You still have to pay the bills yourself.'],
  ['Чтобы увидеть звёзды, должно стать темно.', 'Щоб побачити зірки, має стати темно.', 'To see the stars, it has to get dark first.'],
  ['Верь в чудеса, но код от карты никому не говори.', 'Вір у дива, але код від картки нікому не кажи.', 'Believe in miracles, but never share your card PIN.'],
  ['Прислушайся к телу. Оно знает раньше, чем голова.', 'Прислухайся до тіла. Воно знає раніше, ніж голова.', 'Listen to your body. It knows before your head does.'],
  ['Нет плохих карт. Есть неудобные истины.', 'Немає поганих карт. Є незручні істини.', 'There are no bad cards. Only inconvenient truths.'],
  ['Иногда отпустить значит наконец взять свою жизнь в руки.', 'Іноді відпустити означає нарешті взяти своє життя в руки.', 'Sometimes letting go means finally taking your life into your own hands.'],
  ['Из пустой чаши не нальёшь. Сначала наполни себя.', 'З порожньої чаші не наллєш. Спершу наповни себе.', 'You can’t pour from an empty cup. Fill yourself first.'],
  ['Шут в раскладе напоминает: иногда нужно просто прыгнуть.', 'Блазень у розкладі нагадує: іноді треба просто стрибнути.', 'The Fool reminds you: sometimes you just have to jump.'],
  ['Самый точный прогноз: завтра будет новый день. Остальное детали.', 'Найточніший прогноз: завтра буде новий день. Решта деталі.', 'The most accurate forecast: tomorrow will be a new day. The rest is detail.'],
  ['Гороскоп на сегодня: ты справишься. Как и вчера.', 'Гороскоп на сьогодні: ти впораєшся. Як і вчора.', 'Today’s horoscope: you’ll manage. Just like yesterday.'],
  ['Не ищи знаки в каждой луже. Иногда лужа — это просто лужа.', 'Не шукай знаків у кожній калюжі. Іноді калюжа — це просто калюжа.', 'Don’t look for signs in every puddle. Sometimes a puddle is just a puddle.'],
  ['Звёзды не обещают лёгкости. Они обещают, что свет будет.', 'Зірки не обіцяють легкості. Вони обіцяють, що світло буде.', 'The stars don’t promise ease. They promise there will be light.'],
  ['Башня рушит только то, что стояло на песке.', 'Вежа руйнує тільки те, що стояло на піску.', 'The Tower only destroys what was built on sand.'],
  ['Настоящая магия — это постоянство. Каждый день понемногу.', 'Справжня магія — це сталість. Щодня потроху.', 'Real magic is consistency. A little every day.'],
  ['Твоей интуиции не нужно чужое одобрение.', 'Твоїй інтуїції не потрібне чуже схвалення.', 'Your intuition doesn’t need anyone’s approval.'],
  ['Лучше честная карта, чем красивая ложь.', 'Краще чесна карта, ніж гарна брехня.', 'Better an honest card than a pretty lie.'],
  ['Меркурий ретроградный, а ты молодец при любом положении планет.', 'Меркурій ретроградний, а ти молодець за будь-якого положення планет.', 'Mercury is retrograde, and you’re doing great in any planetary position.'],
  ['Всё, что нужно, уже в колоде. Осталось вытянуть.', 'Усе, що потрібно, вже в колоді. Лишилося витягнути.', 'Everything you need is already in the deck. Just draw it.'],
  ['Вода принимает форму сосуда, но точит камень. Будь водой.', 'Вода набуває форми посудини, але точить камінь. Будь водою.', 'Water takes the shape of its vessel, yet it wears down stone. Be water.'],
  ['Хочешь знать будущее? Посмотри, что ты делаешь каждый день.', 'Хочеш знати майбутнє? Подивися, що ти робиш щодня.', 'Want to know your future? Look at what you do every day.'],
  ['Не торопи судьбу. У неё своя очередь, и ты в ней точно есть.', 'Не квап долю. У неї своя черга, і ти в ній точно є.', 'Don’t rush fate. It has its own queue, and you are definitely in it.'],
  ['Эмоции — это погода. Ты — небо.', 'Емоції — це погода. Ти — небо.', 'Emotions are the weather. You are the sky.'],
  ['Не знаешь, что делать? Сделай паузу. Это тоже действие.', 'Не знаєш, що робити? Зроби паузу. Це теж дія.', 'Not sure what to do? Pause. That counts as action too.'],
  ['Свет приходит к тем, кто держит окна открытыми.', 'Світло приходить до тих, хто тримає вікна відчиненими.', 'Light comes to those who keep their windows open.'],
  ['Любовь не ищут по гороскопу. Но совместимость проверить не помешает.', 'Кохання не шукають за гороскопом. Але сумісність перевірити не завадить.', 'You don’t find love by horoscope. Checking compatibility won’t hurt, though.'],
  ['Звезда не спорит с темнотой. Она просто светит.', 'Зірка не сперечається з темрявою. Вона просто світить.', 'A star doesn’t argue with the dark. It just shines.'],
  ['Каждая карта — зеркало. Не бойся заглянуть в отражение.', 'Кожна карта — дзеркало. Не бійся зазирнути у відображення.', 'Every card is a mirror. Don’t be afraid of the reflection.'],
  ['Верь знакам, но сверяй с фактами.', 'Вір знакам, але звіряй із фактами.', 'Trust the signs, but double-check the facts.'],
  ['Душа знает дорогу. Навигатор можно не включать.', 'Душа знає дорогу. Навігатор можна не вмикати.', 'Your soul knows the way. You can switch off the GPS.'],
  ['Судьба стучит тихо. Сделай музыку потише.', 'Доля стукає тихо. Зроби музику тихіше.', 'Fate knocks quietly. Turn the music down.'],
  ['Самый ценный ресурс не мана, а твоё внимание.', 'Найцінніший ресурс не мана, а твоя увага.', 'Your most valuable resource isn’t mana. It’s your attention.'],
  ['Иногда «нет» от Вселенной значит «не сейчас» или «есть вариант получше».', 'Іноді «ні» від Всесвіту означає «не зараз» або «є варіант кращий».', 'Sometimes the universe’s “no” means “not now” or “there’s a better option”.'],
  ['Никто не видит всей картины. Даже карты показывают только часть.', 'Ніхто не бачить усієї картини. Навіть карти показують лише частину.', 'Nobody sees the whole picture. Even the cards show only part of it.'],
  ['То, что для тебя, мимо не пройдёт.', 'Те, що для тебе, мимо не пройде.', 'What is meant for you won’t pass you by.'],
  ['Колдовать проще на сытый желудок и после сна.', 'Чаклувати легше на ситий шлунок і після сну.', 'Spells work better after a meal and a good night’s sleep.'],
  ['Если снится бывший, это значит, что тебе снится бывший. Всё.', 'Якщо сниться колишній, це означає, що тобі сниться колишній. Усе.', 'If you dream of your ex, it means you dreamed of your ex. That’s it.'],
  ['Верховная Жрица молчит не потому, что нечего сказать.', 'Верховна Жриця мовчить не тому, що нічого сказати.', 'The High Priestess is silent, but not because she has nothing to say.'],
  ['Мечтать полезно. Мечтать и действовать ещё полезнее.', 'Мріяти корисно. Мріяти й діяти ще корисніше.', 'Dreaming is good. Dreaming and acting is better.'],
  ['Плохой день не делает жизнь плохой.', 'Поганий день не робить життя поганим.', 'A bad day doesn’t make a bad life.'],
  ['Слушай сердце, но договоры читай головой.', 'Слухай серце, але договори читай головою.', 'Follow your heart, but read contracts with your head.'],
  ['Случайных людей не бывает. Бывают уроки разной длительности.', 'Випадкових людей не буває. Бувають уроки різної тривалості.', 'There are no random people. Only lessons of different lengths.'],
  ['Энергия денег любит порядок. И отключённые подписки.', 'Енергія грошей любить порядок. І вимкнені підписки.', 'Money energy loves order. And cancelled subscriptions.'],
  ['Интуиция не ошибается. Ошибается наше желание, чтобы было иначе.', 'Інтуїція не помиляється. Помиляється наше бажання, щоб було інакше.', 'Intuition isn’t wrong. Our wish for things to be different is.'],
  ['Каждое утро Вселенная раздаёт новую колоду.', 'Щоранку Всесвіт роздає нову колоду.', 'Every morning the universe deals a fresh deck.'],
  ['Звёзды расположены благоприятно. Осталось встать с дивана.', 'Зірки розташовані сприятливо. Лишилося встати з дивана.', 'The stars are favourable. Now just get off the couch.'],
  ['Солнце в раскладе — это «да». Громкое и тёплое.', 'Сонце в розкладі — це «так». Гучне й тепле.', 'The Sun in a spread is a “yes”. Loud and warm.'],
  ['Прощать нужно не ради них, а ради своего спокойствия.', 'Прощати треба не заради них, а заради свого спокою.', 'Forgive not for them, but for your own peace.'],
  ['Кто ищет подвох в каждой карте, тот его находит.', 'Хто шукає підступ у кожній карті, той його знаходить.', 'Whoever looks for a catch in every card finds one.'],
  ['Ретроградный Меркурий не виноват, что письмо третью неделю без ответа.', 'Ретроградний Меркурій не винен, що лист третій тиждень без відповіді.', 'Retrograde Mercury isn’t why that email has waited three weeks for a reply.'],
  ['Твоё «рано» может оказаться «вовремя».', 'Твоє «зарано» може виявитися «вчасно».', 'Your “too early” may turn out to be “just in time”.'],
  ['Судьбу не обманешь. Но договориться можно.', 'Долю не обдуриш. Але домовитися можна.', 'You can’t cheat fate. You can negotiate, though.'],
  ['Лучшее время для перемен было вчера. Следующее лучшее — сегодня.', 'Найкращий час для змін був учора. Наступний найкращий — сьогодні.', 'The best time for change was yesterday. The next best is today.'],
  ['Эзотерика учит видеть связи. Жизнь учит их не пугаться.', 'Езотерика вчить бачити зв’язки. Життя вчить їх не лякатися.', 'Esoterica teaches you to see connections. Life teaches you not to fear them.'],
  ['Каждый раз, выбирая себя, ты меняешь свой расклад.', 'Щоразу, обираючи себе, ти змінюєш свій розклад.', 'Every time you choose yourself, your spread changes.'],
  ['Магическое мышление работает лучше с планом.', 'Магічне мислення працює краще з планом.', 'Magical thinking works better with a plan.'],
  ['Никто не опаздывает. Каждый приходит своим маршрутом.', 'Ніхто не запізнюється. Кожен приходить своїм маршрутом.', 'Nobody is late. Everyone arrives by their own route.'],
  ['Даже Луна не светит сама. И ничего, справляется.', 'Навіть Місяць не світить сам. І нічого, дає раду.', 'Even the Moon doesn’t shine on its own. It manages just fine.'],
  ['Не всё, что блестит, — Пентакль.', 'Не все, що блищить, — Пентакль.', 'Not everything that glitters is a Pentacle.'],
  ['Колесо крутится. Сегодня ты внизу, чтобы завтра увидеть вид сверху.', 'Колесо крутиться. Сьогодні ти внизу, щоб завтра побачити краєвид згори.', 'The wheel turns. Today you’re at the bottom so tomorrow you can enjoy the view.'],
  ['Иногда Вселенная отвечает не словами, а людьми.', 'Іноді Всесвіт відповідає не словами, а людьми.', 'Sometimes the universe answers with people, not words.'],
  ['Сомневаешься — спроси карты. Всё ещё сомневаешься — спроси ещё раз, но честнее.', 'Сумніваєшся — запитай карти. Досі сумніваєшся — запитай ще раз, але чесніше.', 'In doubt, ask the cards. Still in doubt, ask again, but more honestly.'],
  ['Благодарность притягивает больше, чем желания.', 'Вдячність притягує більше, ніж бажання.', 'Gratitude attracts more than wishes do.'],
  ['Кармические уроки повторяются, пока не сдашь их на отлично.', 'Кармічні уроки повторюються, поки не складеш їх на відмінно.', 'Karmic lessons repeat until you pass them with honours.'],
  ['Не носи чужие ожидания. Они тяжелее, чем кажутся.', 'Не носи чужих очікувань. Вони важчі, ніж здаються.', 'Don’t carry other people’s expectations. They’re heavier than they look.'],
  ['Равновесие не когда всё идеально, а когда ты не падаешь.', 'Рівновага не коли все ідеально, а коли ти не падаєш.', 'Balance isn’t when everything is perfect. It’s when you don’t fall.'],
  ['Чем меньше контроля, тем больше места для чуда.', 'Що менше контролю, то більше місця для дива.', 'The less control, the more room for a miracle.'],
  ['Правильный вопрос — половина ответа. Вторая половина — смелость его принять.', 'Правильне питання — половина відповіді. Друга половина — сміливість її прийняти.', 'The right question is half the answer. The other half is the courage to accept it.'],
  ['Звёзды на твоей стороне. А вот будильник нет.', 'Зірки на твоєму боці. А от будильник ні.', 'The stars are on your side. Your alarm clock isn’t.'],
  ['Интуиция и немного сарказма решают большинство проблем.', 'Інтуїція й трохи сарказму розв’язують більшість проблем.', 'Intuition and a little sarcasm solve most problems.'],
  ['Твоя тень хранит силу, которую ты пока не признаёшь.', 'Твоя тінь береже силу, яку ти поки не визнаєш.', 'Your shadow holds a strength you haven’t admitted yet.'],
  ['Все ответы приходят вовремя. Просто некоторые на следующее утро.', 'Усі відповіді приходять вчасно. Просто деякі наступного ранку.', 'All answers arrive on time. Some just come the next morning.'],
  ['Страх — это просто энергия без направления.', 'Страх — це просто енергія без напрямку.', 'Fear is just energy without direction.'],
  ['Нельзя изменить ситуацию? Смени угол зрения. Или расклад.', 'Не можна змінити ситуацію? Зміни кут зору. Або розклад.', 'Can’t change the situation? Change your angle. Or the spread.'],
  ['Туз в раскладе значит: начало уже случилось, осталось заметить.', 'Туз у розкладі означає: початок уже стався, лишилося помітити.', 'An Ace means the beginning has already happened. You just need to notice.'],
  ['Звёзды советуют пить воду. Это не астрология, это здравый смысл.', 'Зірки радять пити воду. Це не астрологія, це здоровий глузд.', 'The stars advise drinking water. That’s not astrology, that’s common sense.'],
  ['Каждый новый день — ещё одна попытка стать собой.', 'Кожен новий день — ще одна спроба стати собою.', 'Every new day is one more chance to become yourself.'],
  ['Сердце знает. Голова проверяет. Карты подтверждают.', 'Серце знає. Голова перевіряє. Карти підтверджують.', 'The heart knows. The head checks. The cards confirm.'],
  ['Верь в себя так же, как веришь в плохие приметы.', 'Вір у себе так само, як віриш у погані прикмети.', 'Believe in yourself the way you believe in bad omens.'],
  ['Магия никуда не делась. Она ждёт, пока ты о ней вспомнишь.', 'Магія нікуди не зникла. Вона чекає, поки ти про неї згадаєш.', 'Magic never left. It is waiting for you to remember it.'],
  ['Карты любят вопросы с открытым концом. Люди любят «да» и «нет».', 'Карти люблять питання з відкритим кінцем. Люди люблять «так» і «ні».', 'Cards love open-ended questions. People love “yes” and “no”.'],
  ['Удача не приходит к тем, кто закрыл все двери на три замка.', 'Удача не приходить до тих, хто зачинив усі двері на три замки.', 'Luck doesn’t visit those who lock every door three times.'],
  ['Лучший оберег от сглаза — хорошее настроение и немного равнодушия.', 'Найкращий оберіг від пристріту — гарний настрій і трохи байдужості.', 'The best protection from the evil eye is a good mood and a little indifference.'],
  ['Не всё, что тебе снится, пророчество. Иногда это просто сыр на ночь.', 'Не все, що тобі сниться, пророцтво. Іноді це просто сир на ніч.', 'Not every dream is a prophecy. Sometimes it’s just cheese before bed.'],
  ['Колода тасуется каждый день. Как и твои возможности.', 'Колода тасується щодня. Як і твої можливості.', 'The deck gets shuffled every day. So do your chances.'],
];

export const QUOTE_COUNT = Q.length;

export function quoteAt(i: number, l: Locale): string {
  const q = Q[((i % Q.length) + Q.length) % Q.length];
  return l === 'uk' ? q[1] : l === 'en' ? q[2] : q[0];
}

const BAG_KEY = 'mk_quote_bag';

/**
 * Next quote index for this launch. Keeps a shuffled bag in localStorage,
 * so every quote shows once before any repeats.
 */
export function nextQuoteIndex(): number {
  const fresh = () => {
    const a = Array.from({ length: Q.length }, (_, i) => i);
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };
  try {
    let bag: number[] = JSON.parse(localStorage.getItem(BAG_KEY) || '[]');
    if (!Array.isArray(bag) || bag.length === 0 || bag.some((n) => typeof n !== 'number' || n >= Q.length)) {
      bag = fresh();
    }
    const idx = bag.shift()!;
    localStorage.setItem(BAG_KEY, JSON.stringify(bag));
    return idx;
  } catch {
    return Math.floor(Math.random() * Q.length);
  }
}
