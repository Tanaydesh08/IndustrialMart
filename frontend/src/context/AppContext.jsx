import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { t as translateLabel } from '../i18n/labels'

const Context = createContext(null)
const words = {
  'Industrial supply marketplace':'औद्योगिक आपूर्ति बाज़ार', Marketplace:'बाज़ार', Seller:'विक्रेता', Buyer:'खरीदार', 'Admin review':'प्रशासक समीक्षा',
  'API online':'एपीआई चालू', 'API unavailable':'एपीआई अनुपलब्ध', Connecting:'कनेक्ट हो रहा है',
  'Industrial machinery and supplies marketplace.':'औद्योगिक मशीनरी और आपूर्ति का बाज़ार।',
  'Loading listing…':'लिस्टिंग लोड हो रही है…', 'Back to marketplace':'बाज़ार पर वापस जाएँ', 'Moderation status':'समीक्षा स्थिति', 'The backend does not currently expose a buyer contact or credit-unlock action.':'अभी खरीदार संपर्क या क्रेडिट से जानकारी खोलने की सुविधा उपलब्ध नहीं है।',
  'Listed by':'लिस्टिंगकर्ता:', 'The API does not currently provide pagination, price filters, or location filters.':'अभी पेजिंग, मूल्य या स्थान के फ़िल्टर उपलब्ध नहीं हैं।',
  'SELLER WORKFLOW':'विक्रेता प्रक्रिया', 'Submit the listing details, then follow its listing-fee payment status.':'लिस्टिंग का विवरण भेजें और शुल्क भुगतान की स्थिति देखें।', 'Describe the item accurately.':'उत्पाद का सटीक विवरण दें।', 'Saving…':'सहेज रहे हैं…',
  'Sign in as a seller to create listings':'लिस्टिंग बनाने के लिए विक्रेता के रूप में लॉग इन करें', 'Your seller account is used to associate the listing and its fee with you.':'आपका विक्रेता खाता लिस्टिंग और शुल्क से जुड़ा रहेगा।', 'Sign in with a seller account to submit a listing.':'लिस्टिंग भेजने के लिए विक्रेता खाते से लॉग इन करें।',
  MODERATION:'समीक्षा', 'Sign in with an administrator account to review marketplace listings.':'लिस्टिंग की समीक्षा के लिए प्रशासक खाते से लॉग इन करें।', 'Pending submissions and listings needing another review, loaded from the backend.':'बैकएंड से मिली नई और पुनः समीक्षा की प्रतीक्षा वाली लिस्टिंग।', 'Moderation is restricted to authenticated administrator accounts.':'समीक्षा केवल लॉग इन प्रशासक खाते कर सकते हैं।', 'Required by the moderation API':'समीक्षा निर्णय के लिए आवश्यक', 'There are no pending or needs-review listings.':'अभी कोई लंबित या पुनः समीक्षा वाली लिस्टिंग नहीं है।', 'Queue is clear':'कतार खाली है',
  'Seller dashboard':'विक्रेता डैशबोर्ड', 'Start a listing and follow its payment and moderation status.':'लिस्टिंग शुरू करें और भुगतान व समीक्षा की स्थिति देखें।', 'Sign in as a seller to continue':'जारी रखने के लिए विक्रेता के रूप में लॉग इन करें', 'Seller account required':'विक्रेता खाता आवश्यक है', 'Create seller account':'विक्रेता खाता बनाएँ', 'Seller-owned listing history is not available yet':'विक्रेता की लिस्टिंग का इतिहास अभी उपलब्ध नहीं है', 'The backend does not provide an endpoint for listing a seller’s own records yet.':'बैकएंड अभी विक्रेता की अपनी लिस्टिंग दिखाने की सुविधा नहीं देता।',
  'Pending review':'समीक्षा लंबित', 'Needs review':'समीक्षा आवश्यक', Approved:'स्वीकृत', Rejected:'अस्वीकृत', Pending:'लंबित', Successful:'सफल', Failed:'विफल', Unknown:'अज्ञात',
  'INDUSTRIAL SUPPLY MARKETPLACE':'औद्योगिक आपूर्ति बाज़ार', 'Find the equipment':'काम के लिए', 'that keeps work moving.':'ज़रूरी उपकरण खोजें।',
  'Browse rice mill machinery, plant equipment, spare parts and industrial services from live marketplace listings.':'लाइव लिस्टिंग में राइस मिल मशीनरी, प्लांट उपकरण, स्पेयर पार्ट्स और औद्योगिक सेवाएँ खोजें।',
  'Search listings by name or description':'नाम या विवरण से खोजें', Search:'खोजें', 'Explore marketplace':'बाज़ार देखें', 'Create a listing':'लिस्टिंग बनाएँ',
  'BROWSE BY CATEGORY':'श्रेणी के अनुसार देखें', 'Find your part of the market':'अपनी ज़रूरत की श्रेणी चुनें', 'All listings':'सभी लिस्टिंग',
  'LIVE FROM THE API':'लाइव लिस्टिंग', 'Available listings':'उपलब्ध लिस्टिंग', 'View marketplace':'बाज़ार देखें', 'No approved listings are available yet.':'अभी कोई स्वीकृत लिस्टिंग उपलब्ध नहीं है।',
  'FOR SELLERS':'विक्रेताओं के लिए', 'Bring your equipment to the marketplace.':'अपने उपकरण बाज़ार में लाएँ।', 'Create a listing and follow its fee and moderation status through the prototype workflow.':'लिस्टिंग बनाएँ और शुल्क व समीक्षा की स्थिति देखें।', 'Start a listing':'लिस्टिंग शुरू करें',
  'Industrial listings':'औद्योगिक लिस्टिंग', 'Search approved listings using the backend\'s title, description, and category filters.':'शीर्षक, विवरण और श्रेणी के आधार पर स्वीकृत लिस्टिंग खोजें।', Category:'श्रेणी', 'All categories':'सभी श्रेणियाँ', 'Loading listings…':'लिस्टिंग लोड हो रही हैं…', 'No matching listings':'कोई मेल खाती लिस्टिंग नहीं',
  'Back to marketplace':'बाज़ार पर वापस जाएँ', Condition:'स्थिति', Seller:'विक्रेता', Location:'स्थान', 'Moderation status':'समीक्षा स्थिति',
  'Credits and wallet':'क्रेडिट और वॉलेट', 'Load wallet':'वॉलेट खोलें', 'Create credit-pack payment':'क्रेडिट पैक खरीदें', 'Available credits':'उपलब्ध क्रेडिट', 'Wallet activity':'वॉलेट गतिविधि',
  'Review queue':'समीक्षा कतार', Approve:'स्वीकृत करें', Reject:'अस्वीकृत करें', Edit:'बदलें', Delete:'हटाएँ', Save:'सहेजें', Cancel:'रद्द करें',
  'Email':'ईमेल', Password:'पासवर्ड', 'Full name':'पूरा नाम', 'Sign in':'लॉग इन', 'Create account':'खाता बनाएँ', 'Language':'भाषा', English:'अंग्रेज़ी', Hindi:'हिन्दी',
  'Sign out':'लॉग आउट', 'Log in':'लॉग इन', 'Join Industrial Mart':'इंडस्ट्रियल मार्ट से जुड़ें', 'New here?':'यहाँ नए हैं?', 'Already have an account?':'पहले से खाता है?', 'Buyer account':'खरीदार खाता', 'Seller account':'विक्रेता खाता',
  'BUYER SPACE':'खरीदार क्षेत्र', 'SELLER SPACE':'विक्रेता क्षेत्र', 'SELLER WORKFLOW':'विक्रेता प्रक्रिया', 'BUYER SPACE':'खरीदार क्षेत्र',
  'Seller dashboard':'विक्रेता डैशबोर्ड', 'Credits and wallet':'क्रेडिट और वॉलेट', 'Search approved listings using the backend\'s title, description, and category filters.':'शीर्षक, विवरण और श्रेणी के आधार पर स्वीकृत लिस्टिंग खोजें।',
  'Search by title or description':'शीर्षक या विवरण से खोजें', 'Loading wallet…':'वॉलेट लोड हो रहा है…', 'No matching listings':'कोई मेल खाती लिस्टिंग नहीं', 'Try another search or category. The marketplace only shows approved listings.':'दूसरी खोज या श्रेणी आज़माएँ। यहाँ केवल स्वीकृत लिस्टिंग दिखाई जाती हैं।',
  'Sign in to browse live listings':'लाइव लिस्टिंग देखने के लिए लॉग इन करें', 'The marketplace listings are available to authenticated accounts.':'लिस्टिंग देखने के लिए खाते में लॉग इन करें।', 'Sign in to continue':'आगे बढ़ने के लिए लॉग इन करें', 'Industrial listings':'औद्योगिक लिस्टिंग',
  'Sign in to access your wallet':'वॉलेट खोलने के लिए लॉग इन करें', 'Buyer account required':'खरीदार खाता आवश्यक है', 'Wallet and credits are available to buyer accounts.':'वॉलेट और क्रेडिट खरीदार खातों के लिए हैं।', 'Your secure buyer account':'आपका सुरक्षित खरीदार खाता', 'Load wallet':'वॉलेट खोलें', 'Create credit-pack payment':'क्रेडिट पैक भुगतान बनाएँ', 'Loading wallet…':'वॉलेट लोड हो रहा है…', 'Available credits':'उपलब्ध क्रेडिट', 'Wallet activity':'वॉलेट गतिविधि',
  'Review queue':'समीक्षा कतार', 'Administrator access required':'प्रशासक अनुमति आवश्यक है', 'Approve':'स्वीकृत करें', 'Request review':'समीक्षा का अनुरोध करें', 'Reject':'अस्वीकृत करें', 'Decision reason':'निर्णय का कारण',
  'Listing title':'लिस्टिंग शीर्षक', Description:'विवरण', Category:'श्रेणी', 'Select category':'श्रेणी चुनें', 'Seller / business name':'विक्रेता / व्यवसाय का नाम', Location:'स्थान', 'Price (INR)':'मूल्य (₹)', Condition:'स्थिति',
  'Search':'खोजें', 'Explore marketplace':'बाज़ार देखें', 'Create a listing':'लिस्टिंग बनाएँ', 'Start a listing':'लिस्टिंग शुरू करें', 'Available listings':'उपलब्ध लिस्टिंग', 'View marketplace':'बाज़ार देखें',
  'Industrial machinery and supplies marketplace.':'औद्योगिक मशीनरी और आपूर्ति का बाज़ार।',
}
// Hindi mode is phonetic: English interface words are written in Devanagari,
// rather than replaced with Hindi translations.
const phoneticWords = {
  industrial:'इंडस्ट्रियल', supply:'सप्लाई', marketplace:'मार्केटप्लेस', seller:'सेलर', sellers:'सेलर्स', buyer:'बायर', buyers:'बायर्स', admin:'एडमिन', review:'रिव्यू',
  'api':'एपीआई', online:'ऑनलाइन', unavailable:'अनअवेलेबल', connecting:'कनेक्टिंग', machinery:'मशीनरी', supplies:'सप्लाईज़', loading:'लोडिंग', listing:'लिस्टिंग', listings:'लिस्टिंग्स',
  back:'बैक', to:'टू', the:'द', by:'बाय', moderation:'मॉडरेशन', status:'स्टेटस', create:'क्रिएट', account:'अकाउंट', sign:'साइन', in:'इन', out:'आउट', log:'लॉग',
  dashboard:'डैशबोर्ड', start:'स्टार्ट', and:'एंड', follow:'फॉलो', its:'इट्स', payment:'पेमेंट', payments:'पेमेंट्स', your:'योर', secure:'सिक्योर', required:'रिक्वायर्ड',
  submit:'सबमिट', details:'डिटेल्स', then:'देन', fee:'फी', saving:'सेविंग', describe:'डिस्क्राइब', item:'आइटम', accurately:'एक्युरेटली',
  search:'सर्च', explore:'एक्सप्लोर', browse:'ब्राउज़', category:'कैटेगरी', categories:'कैटेगरीज', find:'फाइंड', part:'पार्ट', market:'मार्केट', equipment:'इक्विपमेंट',
  available:'अवेलेबल', view:'व्यू', all:'ऑल', approved:'अप्रूव्ड', matching:'मैचिंग', try:'ट्राय', another:'अनदर', description:'डिस्क्रिप्शन', title:'टाइटल',
  industrials:'इंडस्ट्रियल्स', credits:'क्रेडिट्स', credit:'क्रेडिट', wallet:'वॉलेट', activity:'एक्टिविटी', load:'लोड', loading:'लोडिंग', access:'एक्सेस',
  seller:'सेलर', buyer:'बायर', account:'अकाउंट', sign:'साइन', in:'इन', available:'अवेलेबल', prototype:'प्रोटोटाइप', use:'यूज़', backend:'बैकएंड',
  full:'फुल', name:'नेम', email:'ईमेल', password:'पासवर्ड', language:'लैंग्वेज', english:'इंग्लिश', hindi:'हिंदी',
  industrial:'इंडस्ट्रियल', supply:'सप्लाई', browse:'ब्राउज़', rice:'राइस', mill:'मिल', plant:'प्लांट', spare:'स्पेयर', parts:'पार्ट्स', services:'सर्विसेज',
  find:'फाइंड', work:'वर्क', moving:'मूविंग', keeps:'कीप्स', live:'लाइव', name:'नेम', explore:'एक्सप्लोर', all:'ऑल', sign:'साइन', continue:'कंटिन्यू',
  queue:'क्यू', clear:'क्लियर', pending:'पेंडिंग', submissions:'सबमिशन्स', needing:'नीडिंग', another:'अनदर', loaded:'लोडेड', from:'फ्रॉम', administrator:'एडमिनिस्ट्रेटर',
  approve:'अप्रूव', request:'रिक्वेस्ट', reject:'रिजेक्ट', edit:'एडिट', delete:'डिलीट', decision:'डिसीजन', reason:'रीज़न', required:'रिक्वायर्ड',
  location:'लोकेशन', condition:'कंडीशन', price:'प्राइस', seller:'सेलर', business:'बिज़नेस', select:'सिलेक्ट', save:'सेव', changes:'चेंजेज', cancel:'कैंसल',
  industrial:'इंडस्ट्रियल', listings:'लिस्टिंग्स', seller:'सेलर', account:'अकाउंट', sign:'साइन', create:'क्रिएट', successful:'सक्सेसफुल', failed:'फेल्ड', unknown:'अननोन',
  '404':'404', page:'पेज', not:'नॉट', found:'फाउंड', sign:'साइन', seller:'सेलर', buyer:'बायर', moderation:'मॉडरेशन', review:'रिव्यू', available:'अवेलेबल',
  welcome:'वेलकम', get:'गेट', started:'स्टार्टेड', powered:'पावर्ड', network:'नेटवर्क', browse:'ब्राउज़', access:'एक्सेस', secure:'सिक्योर',
  of:'ऑफ', for:'फॉर', with:'विथ', are:'आर', only:'ओनली', shows:'शोज़', try:'ट्राय', again:'अगेन', filters:'फिल्टर्स', filter:'फिल्टर',
  provide:'प्रोवाइड', currently:'करंटली', transactions:'ट्रांज़ैक्शन्स', please:'प्लीज़', session:'सेशन', missing:'मिसिंग', expired:'एक्सपायर्ड',
  error:'एरर', could:'कुड', complete:'कम्प्लीट', dismiss:'डिसमिस', sign:'साइन', registered:'रजिस्टर्ड', private:'प्राइवेट', secure:'सिक्योर',
  rice:'राइस', milling:'मिलिंग', mill:'मिल', complete:'कम्प्लीट', plants:'प्लांट्स', spare:'स्पेयर', parts:'पार्ट्स', components:'कॉम्पोनेंट्स',
  material:'मटेरियल', handling:'हैंडलिंग', equipment:'इक्विपमेंट', sorting:'सॉर्टिंग', grading:'ग्रेडिंग', packaging:'पैकेजिंग', electrical:'इलेक्ट्रिकल', automation:'ऑटोमेशन',
  machines:'मशीन्स', machine:'मशीन', used:'यूज़्ड', processing:'प्रोसेसिंग', turnkey:'टर्नकी', replacement:'रिप्लेसमेंट', conveyors:'कन्वेयर्स', elevators:'एलिवेटर्स', silos:'साइलोज़', systems:'सिस्टम्स',
  motors:'मोटर्स', panels:'पैनल्स', installation:'इंस्टॉलेशन', repair:'रिपेयर', maintenance:'मेंटेनेंस', services:'सर्विसेज', commercial:'कमर्शियल', whitening:'व्हाइटनिंग', whitener:'व्हाइटनर',
  shree:'श्री', suppliers:'सप्लायर्स', raipur:'रायपुर', chhattisgarh:'छत्तीसगढ़', bucket:'बकेट', elevator:'एलिवेटर', grain:'ग्रेन', durg:'दुर्ग', rubber:'रबर', rolls:'रोल्स',
  paddy:'पैडी', husking:'हस्किंग', nagpur:'नागपुर', maharashtra:'महाराष्ट्र', agrotech:'एग्रोटेक', india:'इंडिया', turnkey:'टर्नकी', motors:'मोटर्स', panels:'पैनल्स',
  machines:'मशीन्स', machine:'मशीन', used:'यूज़्ड', processing:'प्रोसेसिंग', components:'कॉम्पोनेंट्स', material:'मटेरियल', systems:'सिस्टम्स',
  motors:'मोटर्स', installation:'इंस्टॉलेशन', replacement:'रिप्लेसमेंट', commercial:'कमर्शियल', whitening:'व्हाइटनिंग', conveyors:'कन्वेयर्स', elevators:'एलिवेटर्स',
  'shree':'श्री', 'agrotech':'एग्रोटेक', 'mill':'मिल', 'rubber':'रबर', 'rolls':'रोल्स', 'paddy':'पैडी', 'grain':'ग्रेन', 'bucket':'बकेट', 'elevator':'एलिवेटर',
  'raipur':'रायपुर', 'durg':'दुर्ग', 'nagpur':'नागपुर', 'chhattisgarh':'छत्तीसगढ़', 'maharashtra':'महाराष्ट्र', 'whitener':'व्हाइटनर', 'husking':'हस्किंग',
  new:'न्यू', inr:'आईएनआर', cnc:'सीएनसी', plc:'पीएलसी', gearbox:'गियरबॉक्स', motor:'मोटर', conveyor:'कन्वेयर', elevator:'एलिवेटर',
}
const consonants = { b:'ब', c:'क', d:'ड', f:'फ', g:'ग', h:'ह', j:'ज', k:'क', l:'ल', m:'म', n:'न', p:'प', q:'क', r:'र', s:'स', t:'ट', v:'व', w:'व', x:'क्स', y:'य', z:'ज़' }
const vowels = { a:['अ','ा'], e:['ए','े'], i:['इ','ि'], o:['ओ','ो'], u:['उ','ु'], aa:['आ','ा'], ee:['ई','ी'], ii:['ई','ी'], oo:['ऊ','ू'], ou:['औ','ौ'], ai:['ऐ','ै'], ay:['ए','े'], ea:['ई','ी'], ee:['ई','ी'], oi:['ऑय','ॉय'], oy:['ऑय','ॉय'], ow:['ओ','ो'], au:['औ','ौ'] }
function approximateWord(word) {
  const source = word.toLowerCase()
  const tokens = source.match(/tion|sion|tch|ch|sh|th|ph|kh|gh|ng|ck|qu|ee|ii|oo|ea|ai|ay|oy|oi|ow|ou|au|aa|[a-z]/g) || []
  let output = ''
  let consonantOpen = false
  for (let index = 0; index < tokens.length; index += 1) {
    const token = tokens[index]
    if (token === 'tion' || token === 'sion') {
      if (consonantOpen) output += '्'
      output += 'शन'; consonantOpen = false
    } else if (token === 'ch' || token === 'tch') {
      if (consonantOpen) output += '्'
      output += 'च'; consonantOpen = true
    } else if (token === 'sh') {
      if (consonantOpen) output += '्'
      output += 'श'; consonantOpen = true
    } else if (token === 'th') {
      if (consonantOpen) output += '्'
      output += 'थ'; consonantOpen = true
    } else if (token === 'ph') {
      if (consonantOpen) output += '्'
      output += 'फ'; consonantOpen = true
    } else if (token === 'kh' || token === 'gh') {
      if (consonantOpen) output += '्'
      output += token === 'kh' ? 'ख' : 'घ'; consonantOpen = true
    } else if (token === 'ng') {
      if (consonantOpen) output += '्'
      output += 'ङ्ग'; consonantOpen = false
    } else if (token === 'qu') {
      if (consonantOpen) output += '्'
      output += 'क्व'; consonantOpen = true
    } else if (vowels[token]) {
      output += consonantOpen ? vowels[token][1] : vowels[token][0]
      consonantOpen = false
    } else if (consonants[token]) {
      if (consonantOpen) output += '्'
      output += consonants[token]
      consonantOpen = true
    }
  }
  return output || word
}
function transliterate(text) {
  return String(text).replace(/[A-Za-z]+/g, word => phoneticWords[word.toLowerCase()] || approximateWord(word))
}
export function AppProvider({ children }) {
  const [language, setLanguage] = useState(() => localStorage.getItem('im-language') || 'en')
  const [user, setUser] = useState(() => { try { return JSON.parse(localStorage.getItem('im-user') || 'null') } catch { return null } })
  useEffect(() => { document.documentElement.lang = language === 'hi' ? 'hi' : 'en' }, [language])
  const value = useMemo(() => ({ language, setLanguage: next => { localStorage.setItem('im-language', next); setLanguage(next) }, user, signIn: data => { localStorage.setItem('im-user', JSON.stringify(data)); localStorage.setItem('im-token', data.token); setUser(data) }, signOut: () => { localStorage.removeItem('im-user'); localStorage.removeItem('im-token'); setUser(null) }, t: translateLabel }), [language, user])
  return <Context.Provider value={value}>{children}</Context.Provider>
}
export const useApp = () => useContext(Context)
