// Shared feed/niche configuration — used by digest, trends, and notifications routes.
// Comprehensive coverage across all 94 niches with dedicated high-volume feeds.
const RSSParser = require("rss-parser");

const parser = new RSSParser({
  timeout: 8000,
  headers: { "User-Agent": "Mozilla/5.0 CreatorPulseBot/1.0" },
  customFields: {
    item: [
      ["media:content", "media:content", { keepArray: true }],
      ["media:thumbnail", "media:thumbnail", { keepArray: true }]
    ]
  }
});

function googleNews(q) {
  return `https://news.google.com/rss/search?q=${encodeURIComponent(q)}&hl=en-US&gl=US&ceid=US:en`;
}

const NICHE_QUERIES = {
  "Football/Soccer": "football soccer premier league champions league transfer",
  "Basketball": "NBA basketball Lakers Warriors",
  "Tennis": "tennis Wimbledon Grand Slam ATP WTA",
  "Cricket": "cricket IPL Test match World Cup",
  "Formula 1": "Formula 1 F1 Grand Prix McLaren Ferrari",
  "Boxing": "boxing fight heavyweight champion",
  "MMA/UFC": "UFC MMA fight octagon",
  "WWE Wrestling": "WWE wrestling Raw SmackDown",
  "American Football": "NFL American football touchdown Super Bowl",
  "Baseball": "MLB baseball World Series",
  "Ice Hockey": "NHL hockey Stanley Cup",
  "Golf": "golf PGA Tour Masters",
  "Rugby": "rugby Six Nations World Cup",
  "Athletics/Track": "athletics track field Olympics sprint",
  "Cycling": "cycling Tour de France Giro",
  "Swimming": "swimming Olympics world record",
  "Esports": "esports gaming tournament League of Legends",
  "Volleyball": "volleyball Olympics championship",
  "Celebrity Gossip": "celebrity gossip Hollywood entertainment",
  "Music (Afrobeats)": "Afrobeats Burna Boy Wizkid Davido music",
  "Music (Hip-Hop)": "hip hop rap Drake Kendrick music album",
  "Music (Pop)": "pop music Taylor Swift chart album",
  "Music (R&B)": "R&B soul music Beyonce album",
  "Music (K-Pop)": "K-pop BTS BLACKPINK Korean music",
  "Music (Amapiano)": "Amapiano South Africa music",
  "Movies & TV": "movies TV series Netflix box office",
  "Anime": "anime manga One Piece Naruto release",
  "Korean Drama": "Korean drama K-drama Netflix series",
  "Bollywood": "Bollywood India movies film box office",
  "Pop Culture": "pop culture viral trending internet",
  "Console Gaming": "PlayStation Xbox Nintendo gaming console",
  "PC Gaming": "PC gaming Steam graphics card GPU",
  "Mobile Gaming": "mobile gaming iOS Android game",
  "Game Reviews": "video game review launch release",
  "Twitch Streaming": "Twitch streaming streamer live",
  "YouTube Gaming": "YouTube gaming channel video",
  "Travel": "travel destination vacation tourism",
  "Food & Recipes": "food recipe cooking chef restaurant",
  "Fitness & Gym": "fitness gym workout health exercise",
  "Mental Health": "mental health wellness therapy anxiety",
  "Relationships & Dating": "relationships dating love advice",
  "Parenting": "parenting children family baby",
  "Minimalism": "minimalism lifestyle simple living",
  "Home Decor": "home decor interior design renovation",
  "Pets": "pets dogs cats animals viral",
  "Streetwear": "streetwear sneakers Supreme Nike Jordan hypebeast",
  "Luxury Fashion": "luxury fashion Gucci Louis Vuitton Chanel runway",
  "Skincare": "skincare beauty routine dermatology",
  "Makeup": "makeup beauty cosmetics tutorial",
  "Haircare": "haircare natural hair styling products",
  "Personal Finance": "personal finance money saving investing",
  "Crypto": "cryptocurrency Bitcoin Ethereum crypto price",
  "Stock Market": "stock market Wall Street S&P 500 trading",
  "Side Hustles": "side hustle passive income make money online",
  "Business News": "business startup entrepreneur funding",
  "Real Estate Investing": "real estate property investment market",
  "Budgeting": "budgeting money management finance tips",
  "AI & Tech News": "artificial intelligence AI OpenAI tech startup",
  "Gadget Reviews": "gadget tech review iPhone Samsung",
  "Coding & Dev Life": "programming coding developer software",
  "Startups": "startup funding venture capital tech",
  "Cybersecurity": "cybersecurity hack data breach privacy",
  "Space & Science": "space NASA SpaceX science discovery",
  "Science": "science discovery research breakthrough",
  "History": "history ancient civilization discovery",
  "Language Learning": "language learning Spanish French Duolingo",
  "Productivity": "productivity habits time-blocking focus deep work",
  "Study Tips": "study tips learning education student",
  "Philosophy": "philosophy life meaning ethics",
  "Psychology": "psychology behavior mind mental",
  "Yapping Videos": "viral controversial opinion debate",
  "Hot Takes": "hot take controversial opinion debate",
  "Rants": "rant viral opinion social media",
  "Storytelling": "storytelling viral story true crime",
  "Political Commentary": "politics government policy news",
  "True Crime": "true crime murder mystery investigation",
  "Mystery & Unexplained": "mystery unexplained paranormal conspiracy",
  "Viral Dances": "TikTok dance trend viral challenge",
  "Trend Reaction": "TikTok viral trend reaction internet",
  "Challenge Content": "TikTok viral challenge trend",
  "YouTube Growth": "YouTube growth subscribers views monetization",
  "Social Media Tips": "social media marketing tips growth",
  "Brand Deals": "brand deals sponsorship influencer marketing",
  "Monetization Advice": "monetization content creator income",
  "Medicine & Health": "health medicine doctor treatment news",
  "Law": "law legal court ruling news",
  "Marketing": "marketing digital advertising brand",
  "Entrepreneurship": "entrepreneurship business success startup",
  "Motivational Speaking": "motivation success mindset inspiration",
  "Faith & Religion": "faith religion church spirituality",
  "African Culture": "African culture Nigeria Ghana music art",
  "Caribbean Culture": "Caribbean culture Jamaica Trinidad music",
  "Astrology": "astrology zodiac horoscope Mercury retrograde",
  "Self-Development": "self development personal growth mindset"
};

const NICHE_RSS = {
  "Football/Soccer": "https://feeds.bbci.co.uk/sport/football/rss.xml",
  "Basketball": "https://www.espn.com/espn/rss/basketball/news",
  "Tennis": "https://www.tennis.com/rss",
  "Cricket": "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
  "Formula 1": "https://www.autosport.com/rss/feed/f1",
  "Boxing": "https://www.boxingscene.com/rss.xml",
  "MMA/UFC": "https://www.mmafighting.com/rss/current.xml",
  "WWE Wrestling": "https://www.wrestlinginc.com/feed/",
  "American Football": "https://www.espn.com/espn/rss/nfl/news",
  "Baseball": "https://www.espn.com/espn/rss/mlb/news",
  "Ice Hockey": "https://www.espn.com/espn/rss/nhl/news",
  "Golf": "https://www.pgatour.com/content/pgatour/rss.rss.pga.rss",
  "Rugby": "https://www.rugbyworld.com/feed",
  "Athletics/Track": "https://worldathletics.org/rss/news",
  "Cycling": "https://www.cyclingnews.com/feeds/all/",
  "Swimming": "https://swimswam.com/feed/",
  "Esports": "https://www.dotesports.com/feed",
  "Volleyball": "https://volleyballmag.com/feed/",
  "Celebrity Gossip": "https://www.tmz.com/rss.xml",
  "Music (Afrobeats)": "https://notjustok.com/feed/",
  "Music (Hip-Hop)": "https://hiphopdx.com/feed",
  "Music (Pop)": "https://www.billboard.com/feed/",
  "Music (R&B)": "https://ratedrnb.com/feed/",
  "Music (K-Pop)": "https://www.soompi.com/feed",
  "Music (Amapiano)": "https://www.musicinafrica.net/rss",
  "Movies & TV": "https://www.hollywoodreporter.com/feed",
  "Anime": "https://www.animenewsnetwork.com/all/rss.xml",
  "Korean Drama": "https://www.soompi.com/feed",
  "Bollywood": "https://www.bollywoodhungama.com/rss/news.xml",
  "Pop Culture": "https://www.complex.com/pop-culture/rss.xml",
  "Console Gaming": "https://www.ign.com/rss/articles/feed",
  "PC Gaming": "https://www.pcgamer.com/rss",
  "Mobile Gaming": "https://www.pocketgamer.com/rss/",
  "Game Reviews": "https://www.polygon.com/rss/index.xml",
  "Twitch Streaming": "https://www.dexerto.com/twitch/feed/",
  "YouTube Gaming": "https://www.tubefilter.com/feed/",
  "Travel": "https://www.cntraveler.com/feed/rss",
  "Food & Recipes": "https://www.bonappetit.com/feed/rss",
  "Fitness & Gym": "https://www.menshealth.com/rss/all.xml/",
  "Mental Health": "https://www.psychologytoday.com/us/blog/feed",
  "Relationships & Dating": "https://www.bustle.com/rss",
  "Parenting": "https://www.mother.ly/feed/",
  "Minimalism": "https://www.theminimalists.com/feed/",
  "Home Decor": "https://www.architecturaldigest.com/feed/rss",
  "Pets": "https://www.thedodo.com/rss",
  "Streetwear": "https://hypebeast.com/feed",
  "Luxury Fashion": "https://www.vogue.com/feed/rss",
  "Skincare": "https://www.allure.com/feed/rss",
  "Makeup": "https://www.allure.com/feed/rss",
  "Haircare": "https://www.naturallycurly.com/feed",
  "Personal Finance": "https://www.nerdwallet.com/blog/feed/",
  "Crypto": "https://cointelegraph.com/rss",
  "Stock Market": "https://www.cnbc.com/id/10001147/device/rss/rss.html",
  "Side Hustles": "https://www.sidehustlenation.com/feed/",
  "Business News": "https://feeds.bloomberg.com/markets/news.rss",
  "Real Estate Investing": "https://www.biggerpockets.com/blog/feed",
  "Budgeting": "https://www.clevergirlfinance.com/feed/",
  "AI & Tech News": "https://feeds.feedburner.com/TechCrunch",
  "Gadget Reviews": "https://www.engadget.com/rss.xml",
  "Coding & Dev Life": "https://dev.to/feed",
  "Startups": "https://feeds.feedburner.com/TechCrunch",
  "Cybersecurity": "https://feeds.feedburner.com/TheHackersNews",
  "Space & Science": "https://www.nasa.gov/rss/dyn/breaking_news.rss",
  "Science": "https://www.sciencedaily.com/rss/all.xml",
  "History": "https://www.history.com/news/feed",
  "Language Learning": "https://www.fluentu.com/blog/feed/",
  "Productivity": "https://jamesclear.com/feed",
  "Study Tips": "https://collegeinfogeek.com/feed/",
  "Philosophy": "https://dailystoic.com/feed/",
  "Psychology": "https://www.psychologytoday.com/us/blog/feed",
  "Yapping Videos": "https://www.thecut.com/feed/index.xml",
  "Hot Takes": "https://www.theringer.com/rss/index.xml",
  "Rants": "https://slate.com/feeds/all.rss",
  "Storytelling": "https://narratively.com/feed/",
  "Political Commentary": "https://www.politico.com/rss/politicopicks.xml",
  "True Crime": "https://www.crimeonline.com/feed/",
  "Mystery & Unexplained": "https://www.unexplained-mysteries.com/feed.xml",
  "Viral Dances": "https://www.dexerto.com/tiktok/feed/",
  "Trend Reaction": "https://knowyourmeme.com/news.rss",
  "Challenge Content": "https://www.dexerto.com/entertainment/feed/",
  "YouTube Growth": "https://www.tubefilter.com/feed/",
  "Social Media Tips": "https://www.socialmediatoday.com/rss/",
  "Brand Deals": "https://influencermarketinghub.com/feed/",
  "Monetization Advice": "https://www.theinformation.com/feed",
  "Medicine & Health": "https://www.statnews.com/feed/",
  "Law": "https://abovethelaw.com/feed/",
  "Marketing": "https://www.adweek.com/feed/",
  "Entrepreneurship": "https://www.inc.com/rss",
  "Motivational Speaking": "https://addicted2success.com/feed/",
  "Faith & Religion": "https://www.christianitytoday.com/feed/",
  "African Culture": "https://okayafrica.com/feed",
  "Caribbean Culture": "https://www.caribbeanlife.com/feed/",
  "Astrology": "https://www.astrology.com/feed",
  "Self-Development": "https://tinybuddha.com/feed/",
  "default": "https://feeds.bbci.co.uk/news/rss.xml"
};

const NICHE_BLOG_RSS = {
  "Football/Soccer": [
    "https://feeds.bbci.co.uk/sport/football/rss.xml",
    "https://www.skysports.com/rss/0,,12040,00.xml",
    "https://www.theguardian.com/football/rss",
    "https://www.espn.com/espn/rss/football/news",
    "https://www.90min.com/posts.rss",
    "https://www.football365.com/feed",
    "https://news.google.com/rss/search?q=Premier%20League%20OR%20Champions%20League%20transfer%20news%20breaking&hl=en-US&gl=US&ceid=US:en"
  ],
  "Basketball": [
    "https://www.espn.com/espn/rss/basketball/news",
    "https://bleacherreport.com/articles/feed",
    "https://www.si.com/nba/rss",
    "https://www.cbssports.com/nba/rss",
    "https://www.hoopshype.com/feed/",
    "https://news.google.com/rss/search?q=NBA%20trade%20news%20rumors%20breaking&hl=en-US&gl=US&ceid=US:en"
  ],
  "Tennis": [
    "https://www.tennis.com/rss",
    "https://www.atptour.com/en/media/rss-feed/xml-feed",
    "https://www.tennisworldusa.org/rss.php",
    "https://news.google.com/rss/search?q=tennis%20ATP%20WTA%20Grand%20Slam%20breaking%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "Cricket": [
    "https://www.espncricinfo.com/rss/content/story/feeds/0.xml",
    "https://www.cricbuzz.com/rss-feed/cricket-news",
    "https://news.google.com/rss/search?q=cricket%20IPL%20Test%20match%20World%20Cup%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "Formula 1": [
    "https://www.autosport.com/rss/feed/f1",
    "https://www.motorsport.com/rss/f1/news",
    "https://www.formula1.com/en/latest/all.xml",
    "https://www.racefans.net/feed/",
    "https://news.google.com/rss/search?q=Formula%201%20Grand%20Prix%20F1%20news%20breaking&hl=en-US&gl=US&ceid=US:en"
  ],
  "Boxing": [
    "https://www.boxingscene.com/rss.xml",
    "https://www.badlefthook.com/rss/current.xml",
    "https://www.ringtv.com/feed/",
    "https://news.google.com/rss/search?q=boxing%20fight%20championship%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "MMA/UFC": [
    "https://www.mmafighting.com/rss/current.xml",
    "https://www.bloodyelbow.com/rss/current.xml",
    "https://www.mmamania.com/rss/current.xml",
    "https://news.google.com/rss/search?q=UFC%20MMA%20fight%20news%20breaking&hl=en-US&gl=US&ceid=US:en"
  ],
  "WWE Wrestling": [
    "https://www.wrestlinginc.com/feed/",
    "https://www.fightful.com/rss.xml",
    "https://www.pwinsider.com/rss.php",
    "https://news.google.com/rss/search?q=WWE%20wrestling%20Raw%20SmackDown%20AEW%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "American Football": [
    "https://www.espn.com/espn/rss/nfl/news",
    "https://profootballtalk.nbcsports.com/feed/",
    "https://www.cbssports.com/nfl/rss",
    "https://www.si.com/nfl/rss",
    "https://news.google.com/rss/search?q=NFL%20football%20trades%20rumors%20Super%20Bowl&hl=en-US&gl=US&ceid=US:en"
  ],
  "Baseball": [
    "https://www.espn.com/espn/rss/mlb/news",
    "https://www.si.com/mlb/rss",
    "https://bleacherreport.com/articles/feed?tag_id=18",
    "https://news.google.com/rss/search?q=MLB%20baseball%20trade%20rumors%20World%20Series&hl=en-US&gl=US&ceid=US:en"
  ],
  "Ice Hockey": [
    "https://www.espn.com/espn/rss/nhl/news",
    "https://www.si.com/nhl/rss",
    "https://news.google.com/rss/search?q=NHL%20hockey%20Stanley%20Cup%20trade%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "Golf": [
    "https://www.pgatour.com/content/pgatour/rss.rss.pga.rss",
    "https://www.golfdigest.com/feed/rss",
    "https://news.google.com/rss/search?q=golf%20PGA%20Tour%20Masters%20LIV%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "Rugby": [
    "https://www.rugbyworld.com/feed",
    "https://www.rugbypass.com/feed/",
    "https://news.google.com/rss/search?q=rugby%20Six%20Nations%20Rugby%20Championship%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "Athletics/Track": [
    "https://worldathletics.org/rss/news",
    "https://www.runnersworld.com/rss/all.xml",
    "https://news.google.com/rss/search?q=track%20and%20field%20athletics%20Olympics%20Diamond%20League&hl=en-US&gl=US&ceid=US:en"
  ],
  "Cycling": [
    "https://www.cyclingnews.com/feeds/all/",
    "https://velo.outsideonline.com/feed/",
    "https://news.google.com/rss/search?q=cycling%20Tour%20de%20France%20Giro%20d%20Italia&hl=en-US&gl=US&ceid=US:en"
  ],
  "Swimming": [
    "https://swimswam.com/feed/",
    "https://www.swimmingworldmagazine.com/news/feed/",
    "https://news.google.com/rss/search?q=swimming%20world%20aquatics%20Olympic%20swimming&hl=en-US&gl=US&ceid=US:en"
  ],
  "Esports": [
    "https://www.dotesports.com/feed",
    "https://www.eurogamer.net/feed",
    "https://www.dexerto.com/esports/feed/",
    "https://news.google.com/rss/search?q=esports%20tournament%20League%20of%20Legends%20Valorant%20CS2&hl=en-US&gl=US&ceid=US:en"
  ],
  "Volleyball": [
    "https://volleyballmag.com/feed/",
    "https://worldofvolley.com/feed",
    "https://news.google.com/rss/search?q=volleyball%20FIVB%20championship%20beach%20volleyball&hl=en-US&gl=US&ceid=US:en"
  ],
  "Celebrity Gossip": [
    "https://www.tmz.com/rss.xml",
    "https://pagesix.com/feed/",
    "https://www.eonline.com/syndication/feeds/rssfeeds/topstories.xml",
    "https://news.google.com/rss/search?q=celebrity%20news%20Hollywood%20gossip%20drama&hl=en-US&gl=US&ceid=US:en"
  ],
  "Music (Afrobeats)": [
    "https://notjustok.com/feed/",
    "https://www.pulsesports.ng/feed",
    "https://news.google.com/rss/search?q=Afrobeats%20Burna%20Boy%20Wizkid%20Davido%20Rema%20Asake%20new%20music&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Afrobeats%20chart%20record%20release%20breaking&hl=en-US&gl=US&ceid=US:en"
  ],
  "Music (Hip-Hop)": [
    "https://hiphopdx.com/feed",
    "https://www.xxlmag.com/feed",
    "https://www.complex.com/music/rss.xml",
    "https://news.google.com/rss/search?q=hip%20hop%20rap%20music%20album%20Drake%20Kendrick&hl=en-US&gl=US&ceid=US:en"
  ],
  "Music (Pop)": [
    "https://www.billboard.com/feed/",
    "https://www.popjustice.com/feed/",
    "https://www.rollingstone.com/music/music-news/feed/",
    "https://news.google.com/rss/search?q=pop%20music%20Billboard%20Hot%20100%20album%20release&hl=en-US&gl=US&ceid=US:en"
  ],
  "Music (R&B)": [
    "https://ratedrnb.com/feed/",
    "https://www.soultracks.com/rss.xml",
    "https://news.google.com/rss/search?q=R%26B%20soul%20music%20Beyonce%20SZA%20new%20album&hl=en-US&gl=US&ceid=US:en"
  ],
  "Music (K-Pop)": [
    "https://www.soompi.com/feed",
    "https://www.allkpop.com/feed",
    "https://www.koreaboo.com/feed/",
    "https://news.google.com/rss/search?q=K-Pop%20BTS%20BLACKPINK%20Stray%20Kids%20comeback%20album&hl=en-US&gl=US&ceid=US:en"
  ],
  "Music (Amapiano)": [
    "https://www.musicinafrica.net/rss",
    "https://news.google.com/rss/search?q=Amapiano%20South%20Africa%20music%20Kabza%20De%20Small%20DJ%20Maphorisa&hl=en-US&gl=US&ceid=US:en",
    "https://news.google.com/rss/search?q=Amapiano%20viral%20dance%20TikTok%20sound&hl=en-US&gl=US&ceid=US:en"
  ],
  "Movies & TV": [
    "https://www.hollywoodreporter.com/feed",
    "https://variety.com/feed",
    "https://deadline.com/feed",
    "https://www.indiewire.com/feed/",
    "https://news.google.com/rss/search?q=movies%20TV%20series%20Netflix%20box%20office%20trailer&hl=en-US&gl=US&ceid=US:en"
  ],
  "Anime": [
    "https://www.animenewsnetwork.com/all/rss.xml",
    "https://www.crunchyroll.com/newsrss",
    "https://animecorner.me/feed/",
    "https://news.google.com/rss/search?q=anime%20manga%20Crunchyroll%20One%20Piece%20episode%20release&hl=en-US&gl=US&ceid=US:en"
  ],
  "Korean Drama": [
    "https://www.soompi.com/feed",
    "https://www.hancinema.net/rss_news.php",
    "https://news.google.com/rss/search?q=Korean%20drama%20K-drama%20Netflix%20series%20cast%20release&hl=en-US&gl=US&ceid=US:en"
  ],
  "Bollywood": [
    "https://www.bollywoodhungama.com/rss/news.xml",
    "https://www.filmfare.com/feeds/rss.xml",
    "https://news.google.com/rss/search?q=Bollywood%20movies%20Hindi%20box%20office%20actor%20actress&hl=en-US&gl=US&ceid=US:en"
  ],
  "Pop Culture": [
    "https://www.complex.com/pop-culture/rss.xml",
    "https://www.buzzfeed.com/celebrity.xml",
    "https://news.google.com/rss/search?q=pop%20culture%20internet%20memes%20viral%20trending&hl=en-US&gl=US&ceid=US:en"
  ],
  "Console Gaming": [
    "https://www.ign.com/rss/articles/feed",
    "https://www.gamespot.com/feeds/game-news/",
    "https://www.pushsquare.com/feeds/latest",
    "https://news.google.com/rss/search?q=PlayStation%205%20Xbox%20Nintendo%20Switch%20console%20gaming&hl=en-US&gl=US&ceid=US:en"
  ],
  "PC Gaming": [
    "https://www.pcgamer.com/rss",
    "https://www.rockpapershotgun.com/feed",
    "https://www.pcgamesn.com/feed",
    "https://news.google.com/rss/search?q=PC%20gaming%20Steam%20graphics%20card%20Nvidia%20AMD%20games&hl=en-US&gl=US&ceid=US:en"
  ],
  "Mobile Gaming": [
    "https://www.pocketgamer.com/rss/",
    "https://toucharcade.com/feed/",
    "https://news.google.com/rss/search?q=mobile%20gaming%20iOS%20Android%20games%20release%20update&hl=en-US&gl=US&ceid=US:en"
  ],
  "Game Reviews": [
    "https://www.polygon.com/rss/index.xml",
    "https://www.eurogamer.net/feed",
    "https://news.google.com/rss/search?q=video%20game%20review%20metacritic%20score%20launch%20rating&hl=en-US&gl=US&ceid=US:en"
  ],
  "Twitch Streaming": [
    "https://www.dexerto.com/twitch/feed/",
    "https://dotesports.com/streaming/feed",
    "https://news.google.com/rss/search?q=Twitch%20streamer%20Kai%20Cenat%20xQc%20ban%20controversy&hl=en-US&gl=US&ceid=US:en"
  ],
  "YouTube Gaming": [
    "https://www.tubefilter.com/feed/",
    "https://news.google.com/rss/search?q=YouTube%20Gaming%20creators%20MrBeast%20gaming%20channel%20viral&hl=en-US&gl=US&ceid=US:en"
  ],
  "Travel": [
    "https://www.cntraveler.com/feed/rss",
    "https://www.travelandleisure.com/feed",
    "https://www.lonelyplanet.com/rss",
    "https://news.google.com/rss/search?q=travel%20destinations%20flights%20vacation%20deals%20tourism&hl=en-US&gl=US&ceid=US:en"
  ],
  "Food & Recipes": [
    "https://www.bonappetit.com/feed/rss",
    "https://www.food52.com/blog.rss",
    "https://www.epicurious.com/feed/rss",
    "https://news.google.com/rss/search?q=recipes%20cooking%20food%20viral%20food%20trends%20restaurant&hl=en-US&gl=US&ceid=US:en"
  ],
  "Fitness & Gym": [
    "https://www.menshealth.com/rss/all.xml/",
    "https://www.womenshealthmag.com/rss/all.xml/",
    "https://barbend.com/feed/",
    "https://news.google.com/rss/search?q=fitness%20gym%20workout%20bodybuilding%20muscle%20exercise&hl=en-US&gl=US&ceid=US:en"
  ],
  "Mental Health": [
    "https://www.psychologytoday.com/us/blog/feed",
    "https://www.mindful.org/feed/",
    "https://news.google.com/rss/search?q=mental%20health%20mindfulness%20therapy%20anxiety%20burnout%20wellness&hl=en-US&gl=US&ceid=US:en"
  ],
  "Relationships & Dating": [
    "https://www.bustle.com/rss",
    "https://www.cosmopolitan.com/rss/all.xml/",
    "https://news.google.com/rss/search?q=dating%20advice%20relationships%20red%20flags%20marriage%20modern%20dating&hl=en-US&gl=US&ceid=US:en"
  ],
  "Parenting": [
    "https://www.mother.ly/feed/",
    "https://www.todaysparent.com/feed/",
    "https://news.google.com/rss/search?q=parenting%20tips%20baby%20toddlers%20kids%20family%20advice&hl=en-US&gl=US&ceid=US:en"
  ],
  "Minimalism": [
    "https://www.theminimalists.com/feed/",
    "https://zenhabits.net/feed/",
    "https://news.google.com/rss/search?q=minimalism%20simple%20living%20decluttering%20intentional%20life&hl=en-US&gl=US&ceid=US:en"
  ],
  "Home Decor": [
    "https://www.architecturaldigest.com/feed/rss",
    "https://www.apartmenttherapy.com/main.rss",
    "https://news.google.com/rss/search?q=interior%20design%20home%20decor%20renovation%20aesthetic%20architecture&hl=en-US&gl=US&ceid=US:en"
  ],
  "Pets": [
    "https://www.thedodo.com/rss",
    "https://www.petmd.com/rss.xml",
    "https://news.google.com/rss/search?q=pets%20dogs%20cats%20viral%20animals%20cute%20animal%20rescue&hl=en-US&gl=US&ceid=US:en"
  ],
  "Streetwear": [
    "https://hypebeast.com/feed",
    "https://sneakernews.com/feed/",
    "https://highsnobiety.com/feed/",
    "https://news.google.com/rss/search?q=streetwear%20sneakers%20drops%20Supreme%20Nike%20Jordan%20fashion&hl=en-US&gl=US&ceid=US:en"
  ],
  "Luxury Fashion": [
    "https://www.vogue.com/feed/rss",
    "https://www.gq.com/feed/rss",
    "https://www.harpersbazaar.com/rss/all.xml/",
    "https://news.google.com/rss/search?q=luxury%20fashion%20runway%20haute%20couture%20Gucci%20Louis%20Vuitton&hl=en-US&gl=US&ceid=US:en"
  ],
  "Skincare": [
    "https://www.allure.com/feed/rss",
    "https://www.byrdie.com/rss",
    "https://news.google.com/rss/search?q=skincare%20routine%20sunscreen%20retinol%20dermatology%20glow&hl=en-US&gl=US&ceid=US:en"
  ],
  "Makeup": [
    "https://www.allure.com/feed/rss",
    "https://www.byrdie.com/rss",
    "https://news.google.com/rss/search?q=makeup%20beauty%20cosmetics%20tutorial%20lipstick%20blush%20foundation&hl=en-US&gl=US&ceid=US:en"
  ],
  "Haircare": [
    "https://www.naturallycurly.com/feed",
    "https://www.allure.com/feed/rss",
    "https://news.google.com/rss/search?q=haircare%20natural%20hair%20hairstyles%20curls%20haircut%20trends&hl=en-US&gl=US&ceid=US:en"
  ],
  "Personal Finance": [
    "https://www.nerdwallet.com/blog/feed/",
    "https://www.kiplinger.com/rss/all.xml",
    "https://www.thepennyhoarder.com/feed/",
    "https://news.google.com/rss/search?q=personal%20finance%20savings%20debt%20investing%20credit%20score&hl=en-US&gl=US&ceid=US:en"
  ],
  "Crypto": [
    "https://cointelegraph.com/rss",
    "https://www.coindesk.com/arc/outboundfeeds/rss/",
    "https://decrypt.co/feed",
    "https://beincrypto.com/feed/",
    "https://news.google.com/rss/search?q=crypto%20Bitcoin%20Ethereum%20Solana%20ETF%20regulation&hl=en-US&gl=US&ceid=US:en"
  ],
  "Stock Market": [
    "https://www.cnbc.com/id/10001147/device/rss/rss.html",
    "https://feeds.marketwatch.com/marketwatch/topstories/",
    "https://www.investing.com/rss/news.rss",
    "https://news.google.com/rss/search?q=stock%20market%20Wall%20Street%20S%26P%20500%20Fed%20rates%20earnings&hl=en-US&gl=US&ceid=US:en"
  ],
  "Side Hustles": [
    "https://www.sidehustlenation.com/feed/",
    "https://millennialmoney.com/feed/",
    "https://news.google.com/rss/search?q=side%20hustle%20make%20money%20online%20freelance%20passive%20income&hl=en-US&gl=US&ceid=US:en"
  ],
  "Business News": [
    "https://feeds.bloomberg.com/markets/news.rss",
    "https://www.reuters.com/rssfeed/businessNews",
    "https://fortune.com/feed/",
    "https://news.google.com/rss/search?q=business%20news%20company%20earnings%20CEO%20acquisition%20economy&hl=en-US&gl=US&ceid=US:en"
  ],
  "Real Estate Investing": [
    "https://www.biggerpockets.com/blog/feed",
    "https://www.inman.com/feed/",
    "https://news.google.com/rss/search?q=real%20estate%20investing%20mortgage%20interest%20rates%20housing%20market&hl=en-US&gl=US&ceid=US:en"
  ],
  "Budgeting": [
    "https://www.clevergirlfinance.com/feed/",
    "https://frugalrules.com/feed/",
    "https://news.google.com/rss/search?q=budgeting%20money%20management%20frugal%20living%20grocery%20budget&hl=en-US&gl=US&ceid=US:en"
  ],
  "AI & Tech News": [
    "https://feeds.feedburner.com/TechCrunch",
    "https://www.theverge.com/rss/index.xml",
    "https://www.wired.com/feed/rss",
    "https://venturebeat.com/feed",
    "https://arstechnica.com/feed/",
    "https://news.google.com/rss/search?q=artificial%20intelligence%20OpenAI%20Claude%20Gemini%20tech%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "Gadget Reviews": [
    "https://www.engadget.com/rss.xml",
    "https://www.theverge.com/rss/index.xml",
    "https://www.cnet.com/rss/news/",
    "https://news.google.com/rss/search?q=gadget%20reviews%20iPhone%20Samsung%20MacBook%20tech%20unboxing&hl=en-US&gl=US&ceid=US:en"
  ],
  "Coding & Dev Life": [
    "https://dev.to/feed",
    "https://news.ycombinator.com/rss",
    "https://www.freecodecamp.org/news/rss/",
    "https://news.google.com/rss/search?q=software%20engineer%20programming%20web%20dev%20JavaScript%20Python%20AI%20coding&hl=en-US&gl=US&ceid=US:en"
  ],
  "Startups": [
    "https://feeds.feedburner.com/TechCrunch",
    "https://www.ycombinator.com/blog/rss",
    "https://sifted.eu/feed",
    "https://news.google.com/rss/search?q=startup%20funding%20seed%20round%20Series%20A%20unicorn%20founders&hl=en-US&gl=US&ceid=US:en"
  ],
  "Cybersecurity": [
    "https://feeds.feedburner.com/TheHackersNews",
    "https://krebsonsecurity.com/feed/",
    "https://www.bleepingcomputer.com/feed/",
    "https://news.google.com/rss/search?q=cybersecurity%20data%20breach%20ransomware%20hack%20malware%20security&hl=en-US&gl=US&ceid=US:en"
  ],
  "Space & Science": [
    "https://www.nasa.gov/rss/dyn/breaking_news.rss",
    "https://www.space.com/feeds/all",
    "https://www.sciencedaily.com/rss/all.xml",
    "https://news.google.com/rss/search?q=space%20SpaceX%20NASA%20astronomy%20Mars%20telescope%20rocket%20launch&hl=en-US&gl=US&ceid=US:en"
  ],
  "Science": [
    "https://www.sciencedaily.com/rss/all.xml",
    "https://www.livescience.com/feeds/all",
    "https://news.google.com/rss/search?q=science%20breakthrough%20physics%20biology%20discovery%20climate&hl=en-US&gl=US&ceid=US:en"
  ],
  "History": [
    "https://www.history.com/news/feed",
    "https://www.ancient-origins.net/rss.xml",
    "https://news.google.com/rss/search?q=history%20archeology%20discovery%20ancient%20civilization%20historic%20findings&hl=en-US&gl=US&ceid=US:en"
  ],
  "Language Learning": [
    "https://www.fluentu.com/blog/feed/",
    "https://news.google.com/rss/search?q=language%20learning%20polyglot%20Spanish%20French%20English%20study%20tips&hl=en-US&gl=US&ceid=US:en"
  ],
  "Productivity": [
    "https://jamesclear.com/feed",
    "https://todoist.com/inspiration/feed",
    "https://news.google.com/rss/search?q=productivity%20habits%20focus%20deep%20work%20time%20management%20atomic%20habits&hl=en-US&gl=US&ceid=US:en"
  ],
  "Study Tips": [
    "https://collegeinfogeek.com/feed/",
    "https://news.google.com/rss/search?q=study%20tips%20exams%20college%20revision%20learning%20memory%20techniques&hl=en-US&gl=US&ceid=US:en"
  ],
  "Philosophy": [
    "https://dailystoic.com/feed/",
    "https://aeon.co/feed.rss",
    "https://news.google.com/rss/search?q=philosophy%20stoicism%20Marcus%20Aurelius%20ethics%20human%20nature&hl=en-US&gl=US&ceid=US:en"
  ],
  "Psychology": [
    "https://www.psychologytoday.com/us/blog/feed",
    "https://psyche.co/feed",
    "https://news.google.com/rss/search?q=psychology%20cognitive%20behavior%20mind%20human%20brain%20decision%20making&hl=en-US&gl=US&ceid=US:en"
  ],
  "Yapping Videos": [
    "https://www.thecut.com/feed/index.xml",
    "https://news.google.com/rss/search?q=viral%20debate%20internet%20argument%20discourse%20trending%20opinion&hl=en-US&gl=US&ceid=US:en"
  ],
  "Hot Takes": [
    "https://www.theringer.com/rss/index.xml",
    "https://news.google.com/rss/search?q=hot%20take%20controversial%20opinion%20sports%20debate%20culture%20debate&hl=en-US&gl=US&ceid=US:en"
  ],
  "Rants": [
    "https://slate.com/feeds/all.rss",
    "https://news.google.com/rss/search?q=viral%20rant%20social%20media%20outrage%20debate%20trending%20take&hl=en-US&gl=US&ceid=US:en"
  ],
  "Storytelling": [
    "https://narratively.com/feed/",
    "https://longreads.com/feed/",
    "https://news.google.com/rss/search?q=crazy%20story%20viral%20true%20story%20real%20life%20unbelievable%20event&hl=en-US&gl=US&ceid=US:en"
  ],
  "Political Commentary": [
    "https://www.politico.com/rss/politicopicks.xml",
    "https://www.axios.com/feed",
    "https://thehill.com/feed/",
    "https://news.google.com/rss/search?q=politics%20government%20election%20policy%20Congress%20news&hl=en-US&gl=US&ceid=US:en"
  ],
  "True Crime": [
    "https://www.crimeonline.com/feed/",
    "https://news.google.com/rss/search?q=true%20crime%20murder%20mystery%20trial%20verdict%20cold%20case%20documentary&hl=en-US&gl=US&ceid=US:en"
  ],
  "Mystery & Unexplained": [
    "https://www.unexplained-mysteries.com/feed.xml",
    "https://news.google.com/rss/search?q=unexplained%20mysteries%20paranormal%20Bermuda%20triangle%20UFO%20phenomena&hl=en-US&gl=US&ceid=US:en"
  ],
  "Viral Dances": [
    "https://www.dexerto.com/tiktok/feed/",
    "https://news.google.com/rss/search?q=TikTok%20dance%20trend%20viral%20challenge%20choreography%20audio%20sound&hl=en-US&gl=US&ceid=US:en"
  ],
  "Trend Reaction": [
    "https://knowyourmeme.com/news.rss",
    "https://news.google.com/rss/search?q=viral%20internet%20trend%20reaction%20meme%20TikTok%20challenge&hl=en-US&gl=US&ceid=US:en"
  ],
  "Challenge Content": [
    "https://www.dexerto.com/entertainment/feed/",
    "https://news.google.com/rss/search?q=viral%20challenge%20social%20media%20trend%20viral%20video%20internet&hl=en-US&gl=US&ceid=US:en"
  ],
  "YouTube Growth": [
    "https://www.tubefilter.com/feed/",
    "https://news.google.com/rss/search?q=YouTube%20algorithm%20views%20subscribers%20CTR%20thumbnail%20creator%20economy&hl=en-US&gl=US&ceid=US:en"
  ],
  "Social Media Tips": [
    "https://www.socialmediatoday.com/rss/",
    "https://later.com/blog/rss/",
    "https://news.google.com/rss/search?q=social%20media%20algorithm%20Instagram%20reach%20TikTok%20growth%20strategy&hl=en-US&gl=US&ceid=US:en"
  ],
  "Brand Deals": [
    "https://influencermarketinghub.com/feed/",
    "https://news.google.com/rss/search?q=creator%20sponsorships%20brand%20deals%20influencer%20marketing%20rate%20card&hl=en-US&gl=US&ceid=US:en"
  ],
  "Monetization Advice": [
    "https://www.theinformation.com/feed",
    "https://news.google.com/rss/search?q=creator%20economy%20monetization%20newsletter%20Patreon%20courses%20income&hl=en-US&gl=US&ceid=US:en"
  ],
  "Medicine & Health": [
    "https://www.statnews.com/feed/",
    "https://www.medicalnewstoday.com/feed",
    "https://news.google.com/rss/search?q=medical%20breakthrough%20doctor%20FDA%20treatment%20clinical%20trial%20disease&hl=en-US&gl=US&ceid=US:en"
  ],
  "Law": [
    "https://abovethelaw.com/feed/",
    "https://www.scotusblog.com/feed/",
    "https://news.google.com/rss/search?q=supreme%20court%20legal%20ruling%20law%20lawsuit%20court%20verdict&hl=en-US&gl=US&ceid=US:en"
  ],
  "Marketing": [
    "https://www.adweek.com/feed/",
    "https://www.marketingdive.com/feeds/news/",
    "https://news.google.com/rss/search?q=marketing%20advertising%20viral%20ad%20campaign%20brand%20strategy&hl=en-US&gl=US&ceid=US:en"
  ],
  "Entrepreneurship": [
    "https://www.inc.com/rss",
    "https://www.entrepreneur.com/latest.rss",
    "https://news.google.com/rss/search?q=entrepreneurship%20founder%20business%20lessons%20startups%20bootstrapping&hl=en-US&gl=US&ceid=US:en"
  ],
  "Motivational Speaking": [
    "https://addicted2success.com/feed/",
    "https://everydaypower.com/feed/",
    "https://news.google.com/rss/search?q=motivation%20success%20discipline%20mindset%20keynote%20inspiration&hl=en-US&gl=US&ceid=US:en"
  ],
  "Faith & Religion": [
    "https://www.christianitytoday.com/feed/",
    "https://religionnews.com/feed/",
    "https://news.google.com/rss/search?q=faith%20religion%20church%20Christianity%20spirituality%20theology&hl=en-US&gl=US&ceid=US:en"
  ],
  "African Culture": [
    "https://okayafrica.com/feed",
    "https://africanarguments.org/feed/",
    "https://news.google.com/rss/search?q=African%20culture%20Nollywood%20arts%20music%20fashion%20heritage%20Africa&hl=en-US&gl=US&ceid=US:en"
  ],
  "Caribbean Culture": [
    "https://www.caribbeanlife.com/feed/",
    "https://jamaicans.com/feed/",
    "https://news.google.com/rss/search?q=Caribbean%20culture%20carnival%20reggae%20soca%20Jamaica%20Trinidad%20diaspora&hl=en-US&gl=US&ceid=US:en"
  ],
  "Astrology": [
    "https://www.astrology.com/feed",
    "https://news.google.com/rss/search?q=astrology%20zodiac%20horoscope%20Mercury%20retrograde%20birth%20chart%20cosmic&hl=en-US&gl=US&ceid=US:en"
  ],
  "Self-Development": [
    "https://tinybuddha.com/feed/",
    "https://www.lifehack.org/feed/",
    "https://news.google.com/rss/search?q=self-development%20personal%20growth%20habits%20discipline%20goal%20setting&hl=en-US&gl=US&ceid=US:en"
  ],
  "default": [
    "https://feeds.bbci.co.uk/news/rss.xml",
    "https://feeds.npr.org/1001/rss.xml",
    "https://news.google.com/rss/search?q=breaking%20news%20world%20headlines%20viral%20updates&hl=en-US&gl=US&ceid=US:en"
  ]
};

module.exports = { parser, googleNews, NICHE_QUERIES, NICHE_RSS, NICHE_BLOG_RSS };
