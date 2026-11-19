/* =====================================================================
1. EDITABLE DATA — Employees, Admin login, Categories, Translations
===================================================================== */

// ---- MASTER EMPLOYEE LIST -------------------------------------------
// The roster now lives centrally in the shared server (one document at
// "employees/roster"), NOT in this code — so it can be edited any time
// from the Admin Dashboard → Team Roster tab, by anyone with admin
// access, with no limit on headcount and no republish needed.
//
// DEFAULT_EMPLOYEES below is used ONLY ONCE: the very first time this
// app connects to a brand-new, empty server it seeds the roster with
// these names so there's something to start from. After that first
// seed, editing this array does nothing — manage the real roster from
// the Team Roster tab instead. (Safe to leave as-is, or trim to [] if
// you'd rather start with an empty roster and add everyone via the UI.)
const DEFAULT_EMPLOYEES = [
{id:"EMP001", name:"Rahul Sharma"},
{id:"EMP002", name:"Priya Verma"},
{id:"EMP003", name:"Amit Singh"},
{id:"EMP004", name:"Sneha Patil"},
{id:"EMP005", name:"Vikram Rao"},
{id:"EMP006", name:"Anjali Nair"},
{id:"EMP007", name:"Karan Mehta"},
{id:"EMP008", name:"Divya Reddy"},
{id:"EMP009", name:"Suresh Kumar"},
{id:"EMP010", name:"Neha Gupta"},
{id:"EMP011", name:"Arjun Iyer"},
{id:"EMP012", name:"Pooja Joshi"},
{id:"EMP013", name:"Manoj Tiwari"},
{id:"EMP014", name:"Kavya Menon"},
{id:"EMP015", name:"Rohit Chauhan"},
{id:"EMP016", name:"Shreya Desai"},
{id:"EMP017", name:"Aditya Kulkarni"},
{id:"EMP018", name:"Meera Pillai"},
{id:"EMP019", name:"Nikhil Bansal"},
{id:"EMP020", name:"Ritu Agarwal"},
];
// Populated at runtime from the server; see ROSTER HELPERS below.
let EMPLOYEES = [];

// ---- ADMIN LOGIN -------------------------------------------------------
const ADMIN_CREDENTIALS = { id: "ADMIN", password: "Admin@123" };

// ---- FIREBASE PROJECT (self-hosted build only) --------------------------
// This is the connection info for YOUR Firebase project (from Firebase
// Console → Project settings → Your apps). It is safe to leave visible
// here — unlike a password, this key is designed to be public in web
// pages; real security comes from the Firestore Rules you set in the
// Firebase Console, not from hiding this. To move this app to a
// different Firebase project later, just replace the values below.
const FIREBASE_CONFIG = {
apiKey: "AIzaSyC7vEcv3TaWIXHsqT9-dbHhhxRtV8YHArc",
authDomain: "product-traning.firebaseapp.com",
projectId: "product-traning",
storageBucket: "product-traning.firebasestorage.app",
messagingSenderId: "913201813577",
appId: "1:913201813577:web:6724eb31828ed2afd8c798",
};

// ---- CATEGORY ICONS (simple inline SVGs) --------------------------------
const ICONS = {
tv: '<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="5" width="22" height="14" rx="2"/><path d="M10 23h8M14 19v4"/></svg>',
ac: '<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="7" width="24" height="9" rx="3"/><path d="M6 20l2-3M12 20l1.5-3M18 20l1.5-3M23 20l1-3"/></svg>',
fridge: '<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="2" width="16" height="24" rx="2"/><path d="M6 11h16M10 5v3M10 14v3"/></svg>',
wm: '<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="3" width="22" height="22" rx="3"/><circle cx="14" cy="16" r="6"/><path d="M8 7h.01M12 7h.01"/></svg>',
laptop: '<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="6" y="4" width="16" height="12" rx="1.5"/><path d="M2 22h24l-2.5-4h-19L2 22z"/></svg>',
mobile: '<svg viewBox="0 0 28 28" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect x="8" y="2" width="12" height="24" rx="3"/><path d="M12 22h4"/></svg>',
};

const CATEGORIES = [
{key:"tv", en:"Television (TV)", hi:"टेलीविज़न (टीवी)"},
{key:"ac", en:"Air Conditioner (AC)", hi:"एयर कंडीशनर (एसी)"},
{key:"fridge", en:"Refrigerator", hi:"रेफ्रिजरेटर"},
{key:"wm", en:"Washing Machine", hi:"वॉशिंग मशीन"},
{key:"laptop", en:"Laptop", hi:"लैपटॉप"},
{key:"mobile", en:"Mobile Phone", hi:"मोबाइल फोन"},
];
const CAT_MAP = Object.fromEntries(CATEGORIES.map(c=>[c.key,c]));

// Coaching skills practiced in the AI roleplay coach (Sales & Greeting Coach tab).
// Labels are resolved through TRANSLATIONS (coachFocus<Key>) so they stay bilingual.
const COACH_FOCUSES = [
{key:"greeting", i18n:"coachFocusGreeting", icon:"👋"},
{key:"needs", i18n:"coachFocusNeeds", icon:"🔍"},
{key:"objection", i18n:"coachFocusObjection", icon:"🛡️"},
{key:"closing", i18n:"coachFocusClosing", icon:"🤝"},
];

const TOPIC_LABELS = {
"display": {en:"Display & Picture Quality", hi:"डिस्प्ले और पिक्चर क्वालिटी"},
"performance": {en:"Performance", hi:"परफॉर्मेंस"},
"smart-features": {en:"Smart Features & OS", hi:"स्मार्ट फीचर्स और OS"},
"audio": {en:"Audio", hi:"ऑडियो"},
"cooling": {en:"Cooling Capacity", hi:"कूलिंग क्षमता"},
"energy": {en:"Energy Efficiency", hi:"ऊर्जा दक्षता"},
"technology": {en:"Core Technology", hi:"मूल तकनीक"},
"cooling-tech": {en:"Cooling Technology", hi:"कूलिंग तकनीक"},
"durability": {en:"Durability", hi:"टिकाऊपन"},
"form-factor": {en:"Form Factor", hi:"फॉर्म फैक्टर"},
"capacity-planning": {en:"Capacity Planning", hi:"क्षमता योजना"},
"maintenance": {en:"Maintenance & Upkeep", hi:"रखरखाव"},
"storage": {en:"Storage", hi:"स्टोरेज"},
"graphics": {en:"Graphics", hi:"ग्राफिक्स"},
"camera": {en:"Camera", hi:"कैमरा"},
"battery": {en:"Battery", hi:"बैटरी"},
"objection-handling": {en:"Objection Handling", hi:"आपत्ति समाधान"},
};

// ---- UI TRANSLATIONS ----------------------------------------------------
// Add a new UI string anywhere in the app by adding a key here, then use
// data-i18n="yourKey" on an element (or data-i18n-ph for a placeholder).
const TRANSLATIONS = {
appName: {en:"Sales Knowledge Trainer", hi:"सेल्स नॉलेज ट्रेनर"},
loginHeroTitle: {en:"Build confidence on the sales floor", hi:"सेल्स फ्लोर पर आत्मविश्वास बढ़ाएँ"},
loginHeroSummary: {en:"Learn product features, test your knowledge and practise conversations with customers.", hi:"प्रोडक्ट के फीचर्स सीखें, अपना ज्ञान परखें और ग्राहकों से बातचीत का अभ्यास करें।"},
logout: {en:"Logout", hi:"लॉगआउट"},
loginTitle: {en:"Sales Team Login", hi:"सेल्स टीम लॉगिन"},
loginSubtitle: {en:"Enter your Employee ID to begin product knowledge training.", hi:"प्रोडक्ट नॉलेज ट्रेनिंग शुरू करने के लिए अपनी एम्प्लॉई आईडी दर्ज करें।"},
employeeIdLabel: {en:"Employee ID", hi:"एम्प्लॉई आईडी"},
employeeIdPlaceholder: {en:"e.g. EMP001", hi:"जैसे EMP001"},
loginButton: {en:"Log In", hi:"लॉग इन करें"},
loginErrorMsg: {en:"Access denied. Invalid Employee ID.", hi:"पहुंच अस्वीकृत। अमान्य एम्प्लॉई आईडी।"},
adminLoginTitle: {en:"Admin Login", hi:"एडमिन लॉगिन"},
adminLoginSubtitle: {en:"Enter admin credentials to view compliance & performance data.", hi:"अनुपालन और प्रदर्शन डेटा देखने के लिए एडमिन क्रेडेंशियल दर्ज करें।"},
adminIdLabel: {en:"Admin ID", hi:"एडमिन आईडी"},
adminPasswordLabel: {en:"Password", hi:"पासवर्ड"},
adminLoginButton: {en:"Log In as Admin", hi:"एडमिन के रूप में लॉग इन करें"},
adminLoginErrorMsg: {en:"Incorrect admin ID or password.", hi:"गलत एडमिन आईडी या पासवर्ड।"},
backToLogin: {en:"Back to employee login", hi:"एम्प्लॉई लॉगिन पर वापस जाएं"},
categoryPrompt: {en:"Choose the product categories you want to be tested on.", hi:"वे प्रोडक्ट श्रेणियां चुनें जिन पर आप टेस्ट देना चाहते हैं।"},
categoryHint: {en:"Select 1 to 3 categories. Your 25 questions will be drawn freshly and randomly every attempt.", hi:"1 से 3 श्रेणियां चुनें। हर बार आपके 25 प्रश्न नए और यादृच्छिक रूप से चुने जाएंगे।"},
selectedCount: {en:"selected (max 3)", hi:"चयनित (अधिकतम 3)"},
maxCategoriesToast: {en:"You can select up to 3 categories only.", hi:"आप अधिकतम 3 श्रेणियां ही चुन सकते हैं।"},
startTestButton: {en:"Start Test", hi:"टेस्ट शुरू करें"},
questionCounterPrefix: {en:"Question", hi:"प्रश्न"},
nextButton: {en:"Next →", hi:"अगला →"},
submitButton: {en:"Submit Test →", hi:"टेस्ट सबमिट करें →"},
medium: {en:"Medium", hi:"मध्यम"},
advanced: {en:"Advanced", hi:"एडवांस्ड"},
technical: {en:"Technical", hi:"तकनीकी"},
scenario: {en:"Scenario", hi:"परिदृश्य"},
resultsTitle: {en:"Test Complete", hi:"टेस्ट पूर्ण"},
correctOfTotal: {en:"You answered {correct} of {total} questions correctly.", hi:"आपने {total} में से {correct} प्रश्नों के सही उत्तर दिए।"},
passText: {en:"Pass", hi:"उत्तीर्ण"},
failText: {en:"Needs Improvement", hi:"सुधार आवश्यक"},
belowThresholdMsg: {en:"Your score is below 70%. We've prepared a targeted training summary for you.", hi:"आपका स्कोर 70% से कम है। हमने आपके लिए एक लक्षित प्रशिक्षण सारांश तैयार किया है।"},
viewTrainingButton: {en:"View Targeted Training Summary", hi:"लक्षित प्रशिक्षण सारांश देखें"},
categoryBreakdownTitle: {en:"Score by Category", hi:"श्रेणी अनुसार स्कोर"},
reviewAnswersTitle: {en:"Review Your Answers", hi:"अपने उत्तर देखें"},
yourAnswerLabel: {en:"Your answer", hi:"आपका उत्तर"},
correctAnswerLabel: {en:"Correct answer", hi:"सही उत्तर"},
explanationLabel: {en:"Why", hi:"क्यों"},
correctTag: {en:"Correct", hi:"सही"},
incorrectTag: {en:"Incorrect", hi:"गलत"},
backToCategoriesButton: {en:"Take Another Test", hi:"एक और टेस्ट लें"},
trainingSummaryTitle: {en:"Targeted Training Summary", hi:"लक्षित प्रशिक्षण सारांश"},
trainingSummarySubtitle: {en:"Focus on these areas before your next attempt — grouped by the exact features and scenarios you missed.", hi:"अपने अगले प्रयास से पहले इन क्षेत्रों पर ध्यान दें — जो सटीक फीचर्स और परिदृश्य आपने गलत किए, उनके अनुसार समूहीकृत।"},
backToResultsButton: {en:"← Back to Results", hi:"← परिणामों पर वापस जाएं"},
missedQuestionsLabel: {en:"What you missed", hi:"आपने क्या गलत किया"},
dashboardTitle: {en:"Admin Dashboard", hi:"एडमिन डैशबोर्ड"},
adminLogoutButton: {en:"Log out of admin", hi:"एडमिन से लॉगआउट करें"},
overviewTotalEmployees: {en:"Total Employees", hi:"कुल कर्मचारी"},
overviewTested: {en:"Tested", hi:"टेस्ट किया गया"},
overviewPending: {en:"Pending", hi:"लंबित"},
overviewAvgScore: {en:"Average Score", hi:"औसत स्कोर"},
tabHistory: {en:"Test History", hi:"टेस्ट इतिहास"},
tabPending: {en:"Pending Compliance", hi:"लंबित अनुपालन"},
tabEmployees: {en:"Team Roster", hi:"टीम रोस्टर"},
employeesTabHint: {en:"Add, rename or remove team members here — changes sync to every device immediately, and there's no limit on how many you can add.", hi:"यहां टीम के सदस्यों को जोड़ें, नाम बदलें या हटाएं — बदलाव तुरंत हर डिवाइस पर सिंक हो जाते हैं, और जोड़ने की कोई सीमा नहीं है।"},
addEmployeeIdPlaceholder: {en:"e.g. EMP021", hi:"जैसे EMP021"},
addEmployeeNamePlaceholder: {en:"Full name", hi:"पूरा नाम"},
addEmployeeButton: {en:"+ Add Employee", hi:"+ कर्मचारी जोड़ें"},
noEmployeesMessage: {en:"No team members yet — add the first one above.", hi:"अभी कोई टीम सदस्य नहीं है — ऊपर पहला सदस्य जोड़ें।"},
colActions: {en:"Actions", hi:"कार्रवाई"},
editButton: {en:"Edit", hi:"संपादित करें"},
saveButton: {en:"Save", hi:"सहेजें"},
cancelButton: {en:"Cancel", hi:"रद्द करें"},
deleteButton: {en:"Delete", hi:"हटाएं"},
employeeFormIncomplete: {en:"Enter both an Employee ID and a name.", hi:"कृपया एम्प्लॉई आईडी और नाम दोनों दर्ज करें।"},
employeeIdExists: {en:"That Employee ID already exists. IDs must be unique.", hi:"यह एम्प्लॉई आईडी पहले से मौजूद है। आईडी अद्वितीय होनी चाहिए।"},
confirmDeleteEmployee: {en:"Remove {name} ({id}) from the roster? Their past test history will be kept.", hi:"{name} ({id}) को रोस्टर से हटाएं? उनका पिछला टेस्ट इतिहास सुरक्षित रहेगा।"},
toastEmployeeAdded: {en:"Employee added.", hi:"कर्मचारी जोड़ा गया।"},
toastEmployeeUpdated: {en:"Employee updated.", hi:"कर्मचारी अपडेट किया गया।"},
toastEmployeeDeleted: {en:"Employee removed.", hi:"कर्मचारी हटाया गया।"},
toastRosterSaveFailed: {en:"Could not save this change to the server. Please try again.", hi:"यह बदलाव सर्वर पर सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।"},
importCsvButton: {en:"⬆ Import from CSV", hi:"⬆ CSV से आयात करें"},
downloadTemplateButton: {en:"Download CSV Template", hi:"CSV टेम्पलेट डाउनलोड करें"},
csvImportHint: {en:"Include Employee ID and Full Name. Add a Store column to assign stores. Existing IDs are updated.", hi:"एम्प्लॉई आईडी और पूरा नाम डालें। स्टोर असाइन करने के लिए Store कॉलम जोड़ें। मौजूदा आईडी अपडेट होंगी।"},
csvImportReading: {en:"Reading file…", hi:"फ़ाइल पढ़ी जा रही है…"},
toastCsvImportSuccess: {en:"Import complete: {added} added, {updated} updated, {skipped} skipped.", hi:"आयात पूर्ण: {added} जोड़े गए, {updated} अपडेट किए गए, {skipped} छोड़े गए।"},
toastCsvImportNoRows: {en:"No valid rows found. Make sure the file has an Employee ID and a Name in each row.", hi:"कोई मान्य पंक्ति नहीं मिली। सुनिश्चित करें कि हर पंक्ति में एम्प्लॉई आईडी और नाम हो।"},
toastCsvImportFailed: {en:"Could not read or save that file. Please check the format and try again.", hi:"वह फ़ाइल पढ़ी या सहेजी नहीं जा सकी। कृपया फ़ॉर्मेट जांचें और पुनः प्रयास करें।"},
exportHistoryButton: {en:"⬇ Export Completed Tests (CSV)", hi:"⬇ पूर्ण टेस्ट निर्यात करें (CSV)"},
exportPendingButton: {en:"⬇ Export Pending List (CSV)", hi:"⬇ लंबित सूची निर्यात करें (CSV)"},
noDataMessage: {en:"No records yet.", hi:"अभी कोई रिकॉर्ड नहीं है।"},
storageNote: {en:"Test records are stored centrally on the server and shared live with every device — this dashboard reflects the whole team in real time, and nothing is kept on any individual device.", hi:"टेस्ट रिकॉर्ड सर्वर पर केंद्रीय रूप से सहेजे जाते हैं और हर डिवाइस के साथ लाइव शेयर होते हैं — यह डैशबोर्ड वास्तविक समय में पूरी टीम को दर्शाता है, और किसी भी डिवाइस पर कुछ भी सहेजा नहीं जाता।"},
connectingTitle: {en:"Connecting to server…", hi:"सर्वर से कनेक्ट हो रहा है…"},
connectingMessage: {en:"Setting up a live connection so test results sync centrally across every device. This only takes a moment.", hi:"टेस्ट परिणामों को हर डिवाइस पर केंद्रीय रूप से सिंक करने के लिए लाइव कनेक्शन सेट किया जा रहा है। इसमें बस एक पल लगेगा।"},
serverErrorTitle: {en:"Can't reach the central server", hi:"केंद्रीय सर्वर तक नहीं पहुंचा जा सका"},
serverErrorMessage: {en:"This app only tracks test results on the central server so every device stays in sync — it never saves anything on this device. Check your connection and try again.", hi:"यह ऐप टेस्ट परिणामों को केवल केंद्रीय सर्वर पर ट्रैक करता है ताकि हर डिवाइस सिंक में रहे — यह इस डिवाइस पर कभी कुछ नहीं सहेजता। अपना कनेक्शन जांचें और पुनः प्रयास करें।"},
retryConnectionButton: {en:"Retry Connection", hi:"पुनः कनेक्ट करें"},
saveFailedMsg: {en:"This result could not be saved to the central server yet, so it won't appear on the admin dashboard until it's retried.", hi:"यह परिणाम अभी केंद्रीय सर्वर पर सहेजा नहीं जा सका, इसलिए दोबारा प्रयास होने तक यह एडमिन डैशबोर्ड पर नहीं दिखेगा।"},
retrySaveButton: {en:"Retry Save", hi:"दोबारा सहेजने का प्रयास करें"},
toastServerUnavailable: {en:"Server connection unavailable right now.", hi:"अभी सर्वर कनेक्शन उपलब्ध नहीं है।"},
toastSaveFailed: {en:"Could not save this result to the server. Please retry.", hi:"यह परिणाम सर्वर पर सहेजा नहीं जा सका। कृपया पुनः प्रयास करें।"},
toastSaved: {en:"Result saved to the server.", hi:"परिणाम सर्वर पर सहेज लिया गया।"},
colEmployeeId: {en:"Employee ID", hi:"एम्प्लॉई आईडी"},
colName: {en:"Name", hi:"नाम"},
colStore: {en:"Store", hi:"स्टोर"},
storeUnassigned: {en:"Unassigned", hi:"स्टोर असाइन नहीं है"},
pendingStoreHint: {en:"Assign missing stores in Team Roster to include these employees in store filters.", hi:"इन कर्मचारियों को स्टोर फ़िल्टर में शामिल करने के लिए टीम रोस्टर में उनके स्टोर असाइन करें।"},
filterByStoreLabel: {en:"Filter by Store:", hi:"स्टोर के अनुसार फ़िल्टर करें:"},
allStoresOption: {en:"All Stores", hi:"सभी स्टोर"},
newEmployeeStorePlaceholder: {en:"Store (optional)", hi:"स्टोर (वैकल्पिक)"},
changePasswordButton: {en:"Change Password", hi:"पासवर्ड बदलें"},
changePasswordTitle: {en:"Change Admin Password", hi:"एडमिन पासवर्ड बदलें"},
currentPasswordPlaceholder: {en:"Current password", hi:"मौजूदा पासवर्ड"},
newPasswordPlaceholder: {en:"New password", hi:"नया पासवर्ड"},
confirmPasswordPlaceholder: {en:"Confirm new password", hi:"नए पासवर्ड की पुष्टि करें"},
savePasswordButton: {en:"Save Password", hi:"पासवर्ड सहेजें"},
changePasswordFillAll: {en:"Please fill in all three fields.", hi:"कृपया तीनों फ़ील्ड भरें।"},
changePasswordWrongCurrent: {en:"Current password is incorrect.", hi:"मौजूदा पासवर्ड गलत है।"},
changePasswordMismatch: {en:"New password and confirmation do not match.", hi:"नया पासवर्ड और पुष्टि मेल नहीं खाते।"},
changePasswordTooShort: {en:"New password must be at least 6 characters.", hi:"नया पासवर्ड कम से कम 6 अक्षरों का होना चाहिए।"},
toastPasswordChanged: {en:"Admin password updated. Use it next time you log in.", hi:"एडमिन पासवर्ड अपडेट हो गया। अगली बार लॉग इन करते समय इसका उपयोग करें।"},
toastPasswordChangeFailed: {en:"Could not save the new password — please try again.", hi:"नया पासवर्ड सहेजा नहीं जा सका — कृपया फिर से कोशिश करें।"},
colAttempt: {en:"Attempt #", hi:"प्रयास #"},
colCategories: {en:"Categories", hi:"श्रेणियां"},
colDate: {en:"Date / Time", hi:"तारीख / समय"},
colScore: {en:"Score %", hi:"स्कोर %"},
colWeakAreas: {en:"Weak Areas", hi:"कमज़ोर क्षेत्र"},
welcomeBackPrefix: {en:"Welcome, ", hi:"स्वागत है, "},
toastDownloaded: {en:"File downloaded.", hi:"फ़ाइल डाउनलोड हो गई।"},
toastDownloadFailed: {en:"Could not download the file.", hi:"फ़ाइल डाउनलोड नहीं हो पाई।"},
toastDownloadUnavailable: {en:"Download isn't available in this preview — open the published page in a new tab and try again.", hi:"यह प्रीव्यू में डाउनलोड उपलब्ध नहीं है — पब्लिश किए गए पेज को नए टैब में खोलकर पुनः प्रयास करें।"},
tabTakeTest: {en:"Take a Test", hi:"टेस्ट लें"},
tabStudyMaterial: {en:"📚 Study Material", hi:"📚 अध्ययन सामग्री"},
studyHubPrompt: {en:"Browse full specs and key selling points for every model — no test, no time pressure.", hi:"हर मॉडल के पूरे स्पेसिफिकेशन और मुख्य बिक्री बिंदु देखें — न कोई टेस्ट, न कोई समय दबाव।"},
studyHubHint: {en:"Pick a category to open its flashcards. Your progress is visible to your manager on the admin dashboard.", hi:"फ्लैशकार्ड खोलने के लिए एक श्रेणी चुनें। आपकी प्रगति आपके मैनेजर को एडमिन डैशबोर्ड पर दिखती है।"},
studyCardsCountSuffix: {en:"cards", hi:"कार्ड"},
studyModeLabel: {en:"Study Mode", hi:"अध्ययन मोड"},
studyBackButton: {en:"← Back to Categories", hi:"← श्रेणियों पर वापस जाएं"},
basicsIntroLabel: {en:"Product Basics", hi:"उत्पाद की बुनियादी जानकारी"},
basicsGlossaryLabel: {en:"Key Features Explained", hi:"मुख्य फीचर्स की व्याख्या"},
studyStartCardsButton: {en:"Start Flashcards →", hi:"फ्लैशकार्ड शुरू करें →"},
studyViewBasicsButton: {en:"ℹ Feature Guide", hi:"ℹ फीचर गाइड"},
studyCardPrefix: {en:"Card", hi:"कार्ड"},
whyItSellsLabel: {en:"Why It Sells", hi:"यह क्यों बिकता है"},
studyPrevButton: {en:"← Previous", hi:"← पिछला"},
studyNextButton: {en:"Next →", hi:"अगला →"},
studyDoneButton: {en:"Done ✓", hi:"पूर्ण ✓"},
colStudied: {en:"Studied", hi:"अध्ययन किया"},
studyActivityUnavailable: {en:"Unavailable", hi:"उपलब्ध नहीं"},
studyActivityReadDenied: {en:"Firestore denied access to study activity. Study counts are unavailable.", hi:"Firestore ने अध्ययन गतिविधि पढ़ने की अनुमति नहीं दी। अध्ययन की गिनती उपलब्ध नहीं है।"},
studyActivityWriteDenied: {en:"Firestore did not allow your study progress to be saved.", hi:"Firestore ने आपकी अध्ययन प्रगति सहेजने की अनुमति नहीं दी।"},

// ---- SALES & GREETING COACH (AI roleplay) ------------------------------
tabSalesCoach: {en:"🎤 Sales & Greeting Coach", hi:"🎤 सेल्स और अभिवादन कोच"},
coachSetupPrompt: {en:"Practice a live roleplay with an AI customer and get scored on the spot.", hi:"एक AI ग्राहक के साथ लाइव रोलप्ले प्रैक्टिस करें और तुरंत स्कोर पाएं।"},
coachSetupHint: {en:"Pick a product category and a skill to focus on. The AI will play the customer for a short back-and-forth.", hi:"एक उत्पाद श्रेणी और अभ्यास करने के लिए एक स्किल चुनें। AI थोड़ी बातचीत के लिए ग्राहक की भूमिका निभाएगा।"},
coachCategoryLabel: {en:"1. Choose a category", hi:"1. एक श्रेणी चुनें"},
coachFocusLabel: {en:"2. Choose a skill to practice", hi:"2. अभ्यास के लिए एक स्किल चुनें"},
coachStartButton: {en:"Start Roleplay →", hi:"रोलप्ले शुरू करें →"},
coachFocusGreeting: {en:"Greeting & Rapport", hi:"अभिवादन और तालमेल"},
coachFocusNeeds: {en:"Needs Discovery", hi:"आवश्यकता पहचान"},
coachFocusObjection: {en:"Objection Handling", hi:"आपत्ति समाधान"},
coachFocusClosing: {en:"Closing the Sale", hi:"बिक्री पूर्ण करना"},
coachTurnLabel: {en:"Turn", hi:"राउंड"},
coachAvgScoreLabel: {en:"Avg. score so far", hi:"अब तक औसत स्कोर"},
coachInputPlaceholder: {en:"Type what you'd say to the customer…", hi:"ग्राहक से जो कहेंगे वह लिखें…"},
coachSendButton: {en:"Send", hi:"भेजें"},
coachEndEarlyButton: {en:"End Scenario", hi:"परिदृश्य समाप्त करें"},
coachEndEarlyConfirm: {en:"End this roleplay now and see your results so far?", hi:"क्या अभी यह रोलप्ले समाप्त करें और अब तक के परिणाम देखें?"},
coachThinking: {en:"Customer is replying…", hi:"ग्राहक जवाब दे रहा/रही है…"},
coachTurnErrorToast: {en:"The AI coach is temporarily unavailable. Please try sending that again.", hi:"AI कोच अभी अस्थायी रूप से उपलब्ध नहीं है। कृपया फिर से भेजने का प्रयास करें।"},
coachBackButton: {en:"← Back to Categories", hi:"← श्रेणियों पर वापस जाएं"},
coachResultsTitle: {en:"Roleplay Complete", hi:"रोलप्ले पूर्ण"},
coachPointsLabel: {en:"points earned", hi:"अंक प्राप्त हुए"},
coachFeedbackTitle: {en:"Turn-by-Turn Feedback", hi:"राउंड-दर-राउंड फीडबैक"},
coachTryAnotherButton: {en:"Try Another Scenario", hi:"एक और परिदृश्य आज़माएं"},
coachNoTurnsMsg: {en:"You ended before replying to the customer, so there's nothing to score yet.", hi:"आपने ग्राहक को जवाब देने से पहले ही समाप्त कर दिया, इसलिए अभी स्कोर करने के लिए कुछ नहीं है।"},
coachTurnsCountSuffix: {en:"turns", hi:"राउंड"},
coachSaveFailedMsg: {en:"This result could not be saved to the central server yet, so it won't appear on the admin dashboard until it's retried.", hi:"यह परिणाम अभी केंद्रीय सर्वर पर सहेजा नहीं जा सका, इसलिए इसे पुनः प्रयास करने तक एडमिन डैशबोर्ड पर नहीं दिखाया जाएगा।"},
};

/* =====================================================================
2. STATE
===================================================================== */
let lang = "en"; // in-memory only — nothing persisted on-device
let currentUser = null; // {id, name}
let isAdmin = false;
let selectedCategories = [];
let quiz = null; // {questions, idx, answers, tier, categories, attemptNumber}
let lastResult = null; // computed after quiz submit
const adminPage = document.querySelector('[data-trainer-page="admin"]') !== null;
let dbNamespace = null; // the shared "db" capability — the ONLY place test records live
let adminPassword = null; // live admin password, loaded from the server at connect time (see 3B)
let adminUnsub = null; // live subscription while the admin dashboard is open
let latestHistoryCache = []; // last history snapshot rendered in the admin dashboard, used for CSV export
let employeesUnsub = null; // live subscription to the roster doc, kept open for the whole session
let editingEmployeeId = null; // employee ID currently in inline-edit mode on the roster table, if any
let categoryScreenMode = "test"; // "test" or "study" — which tab is active on the category screen
let studyCategory = null;    // category key currently open in Study Mode, if any
let studyCards = [];         // FLASHCARDS filtered to studyCategory
let studyIndex = 0;          // index into studyCards currently shown
let studyActivityUnsub = null; // live subscription to studyActivity, open only while admin dashboard is active
let studyActivityReadDenied = false;
let studyActivityWriteDenied = false;
let STUDY_ACTIVITY = {};     // employeeId -> {catKey: true, ...} of categories they've opened in Study Mode

// ---- SALES & GREETING COACH STATE --------------------------------------
let coachCategory = null;    // category key chosen for the current/next roleplay
let coachFocus = null;       // COACH_FOCUSES key chosen for the current/next roleplay
const COACH_MAX_TURNS = 5;   // associate replies per scenario before it auto-ends
let coachTurnNumber = 1;     // the turn about to be sent (1-based)
let coachHistory = [];       // [{role:"customer"|"associate", content}], oldest first
let coachTurnScores = [];    // one 0-100 score per completed associate turn
let coachTurnFeedback = [];  // one feedback sentence per completed associate turn, paired with coachTurnScores
let coachBusy = false;       // true while a turn request is in flight (disables input)
let lastCoachResult = null;  // computed once a scenario ends; drives the coach-results screen

/* =====================================================================
3. STORAGE HELPERS
This app stores test records exclusively in the central "db" capability
(collection "history") so every device sees the same live data — there
is no on-device fallback of any kind. If the server connection is not
available, the app blocks on the "server unavailable" screen (see INIT)
rather than saving anything locally.
===================================================================== */
// Raised from the original 1000 — real usage had already crossed that cap,
// which silently hid older history rows from the admin view (they were never
// deleted, just outside the query window). 20000 gives a large safety margin.
const HISTORY_QUERY_LIMIT = 10000;
async function fetchAllHistory(){
if(!dbNamespace){ toast(t("toastServerUnavailable")); return []; }
try{
const snap = await dbNamespace.collection("history").orderBy("timestamp","desc").limit(HISTORY_QUERY_LIMIT).get();
return snap.docs.map(d=>({ _docId:d.id, ...d.data() }));
}catch(e){
console.error("central server read failed", e);
toast(t("toastServerUnavailable"));
return [];
}
}
async function fetchAttemptCount(employeeId){
if(!dbNamespace) return 0;
try{
const snap = await dbNamespace.collection("history").where("employeeId","==",employeeId).limit(HISTORY_QUERY_LIMIT).get();
return snap.size;
}catch(e){
console.error("central server read failed", e);
return 0;
}
}
async function persistHistoryRecord(rec){
if(!dbNamespace){
toast(t("toastServerUnavailable"));
throw new Error("central server unavailable");
}
try{
await dbNamespace.collection("history").add(rec);
}catch(e){
console.error("central server write failed", e);
toast(t("toastSaveFailed"));
throw e;
}
}
// Sales & Greeting Coach results live in their own collection ("coachingHistory")
// rather than mixed into "history" — different shape (turns/avgScore, no quiz
// questions), and admins may want to look at them separately. Same no-local-
// fallback rule as the rest of the app: a failed save surfaces a retry, never
// a silent on-device save.
async function persistCoachRecord(rec){
if(!dbNamespace){
toast(t("toastServerUnavailable"));
throw new Error("central server unavailable");
}
try{
await dbNamespace.collection("coachingHistory").add(rec);
}catch(e){
console.error("central server write failed (coaching)", e);
toast(t("toastSaveFailed"));
throw e;
}
}
function updateStorageNote(){
const el = document.querySelector('[data-i18n="storageNote"]');
if(!el) return;
el.textContent = t("storageNote");
}

/* =====================================================================
3B. ROSTER HELPERS
The employee roster lives as ONE document ("employees/roster", a
{list:[{id,name},...]} body) rather than one document per employee.
That keeps headcount effectively unlimited (a single document can hold
several thousand employees) without competing against the server's
total-document budget the way one-doc-per-employee would. Every write
is a full read-modify-write of that one array — fine for an admin tool
used by a handful of people, not meant for high-concurrency editing.
===================================================================== */
const ROSTER_DOC_PATH = "employees/roster";
async function ensureEmployeeRoster(){
const ref = dbNamespace.doc(ROSTER_DOC_PATH);
const snap = await ref.get();
if(!snap.exists){
await ref.set({ list: DEFAULT_EMPLOYEES, updatedAt: new Date().toISOString() });
return DEFAULT_EMPLOYEES.slice();
}
const data = snap.data();
return Array.isArray(data && data.list) ? data.list : [];
}
const ADMIN_CONFIG_DOC_PATH = "config/adminAuth";
async function ensureAdminConfig(){
// The admin password is seeded from the built-in default the first time
// any device connects, then lives server-side from then on — so a
// password change from any device applies everywhere immediately, and
// nothing password-related is ever kept only on one device.
const ref = dbNamespace.doc(ADMIN_CONFIG_DOC_PATH);
const snap = await ref.get();
if(!snap.exists){
await ref.set({ password: ADMIN_CREDENTIALS.password, updatedAt: new Date().toISOString() });
return ADMIN_CREDENTIALS.password;
}
const data = snap.data();
return (data && data.password) ? data.password : ADMIN_CREDENTIALS.password;
}
async function changeAdminPassword(newPw){
await dbNamespace.doc(ADMIN_CONFIG_DOC_PATH).set({ password: newPw, updatedAt: new Date().toISOString() });
adminPassword = newPw; // apply locally right away, same pattern as writeRoster()
}
function subscribeEmployeeRoster(){
// Keeps every OTHER open device in sync live. This page's own writes are
// applied locally right away by the write helpers below (so an admin's
// own edits never wait on a round trip, and never get clobbered by a
// background refresh landing mid-keystroke) — this listener exists for
// everyone else's changes, and only touches the screen when nobody here
// is actively mid-edit.
if(employeesUnsub){ employeesUnsub(); employeesUnsub = null; }
employeesUnsub = dbNamespace.doc(ROSTER_DOC_PATH).onSnapshot(
snap => {
const data = snap.data();
EMPLOYEES = (snap.exists && Array.isArray(data && data.list)) ? data.list : [];
const active = document.querySelector(".screen.active");
if(active && active.id==="screen-admin"){
document.getElementById("statTotal").textContent = EMPLOYEES.length;
if(!editingEmployeeId) renderEmployeesTable();
renderAdminWithHistory(latestHistoryCache);
}
},
err => { console.error("roster subscription failed", err); }
);
}
async function writeRoster(newList){
if(!dbNamespace){ toast(t("toastServerUnavailable")); throw new Error("central server unavailable"); }
try{
await dbNamespace.doc(ROSTER_DOC_PATH).set({ list: newList, updatedAt: new Date().toISOString() });
EMPLOYEES = newList; // apply locally right away rather than waiting on the subscription round trip
}catch(e){
console.error("roster write failed", e);
toast(t("toastRosterSaveFailed"));
throw e;
}
}
async function submitAddEmployee(){
const idInput = document.getElementById("newEmployeeIdInput");
const nameInput = document.getElementById("newEmployeeNameInput");
const storeInput = document.getElementById("newEmployeeStoreInput");
const errEl = document.getElementById("employeeFormError");
const id = idInput.value.trim().toUpperCase();
const name = nameInput.value.trim();
const store = storeInput ? storeInput.value.trim() : "";
if(!id || !name){
errEl.textContent = t("employeeFormIncomplete");
errEl.classList.remove("hidden");
return;
}
if(EMPLOYEES.some(e=>e.id.toUpperCase()===id)){
errEl.textContent = t("employeeIdExists");
errEl.classList.remove("hidden");
return;
}
errEl.classList.add("hidden");
const updated = EMPLOYEES.concat([{id, name, store, categories:[]}]);
try{
await writeRoster(updated);
idInput.value = ""; nameInput.value = ""; if(storeInput) storeInput.value = "";
document.getElementById("statTotal").textContent = EMPLOYEES.length;
renderEmployeesTable();
toast(t("toastEmployeeAdded"));
}catch(e){ /* toast already shown */ }
}
function downloadEmployeeTemplateCSV(){
const headers = ["Employee ID", "Full Name", "Store", "Category"];
const rows = [
["EMP021", "Priya Sharma", "BAC", "Laptop, Mobile"],
["EMP022", "Rahul Verma", "BHR", "Air Conditioner"],
];
saveFile("employee_roster_template.csv", toCSV(headers, rows));
}
// Recognized header names for each roster field, so an uploaded CSV's
// columns can be in any order (and include extra columns we ignore, like
// Designation) as long as the header row is present.
const CSV_HEADER_ALIASES = {
id: ["employee code","employee id","emp code","emp id","empid","id","code","employee no","emp no"],
name: ["employee name","full name","name"],
store: ["store","location","branch","branch code","store code","store name"],
categories: ["category","categories","product category","product categories","working category"],
};
function detectCsvColumnMap(headerRow){
const map = {};
headerRow.forEach((cell, i)=>{
const norm = (cell||"").trim().toLowerCase();
for(const field of Object.keys(CSV_HEADER_ALIASES)){
if(map[field]===undefined && CSV_HEADER_ALIASES[field].includes(norm)) map[field] = i;
}
});
// Only trust this as a real header row if we can find at least ID and Name.
if(map.id===undefined || map.name===undefined) return null;
return map;
}
// Category text -> internal category key, so tags from a CSV line up with
// the app's own category labels (and translate correctly). An unrecognized
// value is kept as-is rather than dropped.
const CSV_CATEGORY_ALIASES = {
tv: ["television","tv"],
ac: ["air conditioner","ac","air-conditioner"],
fridge: ["refrigerator","fridge","refrigerators"],
wm: ["washing machine","wm","washing machines"],
laptop: ["laptop","laptops"],
mobile: ["mobile","mobile phone","mobiles","smartphone","smartphones"],
};
function normalizeCategoryTag(raw){
const norm = raw.trim().toLowerCase();
for(const key of Object.keys(CSV_CATEGORY_ALIASES)){
if(CSV_CATEGORY_ALIASES[key].includes(norm)) return key;
}
return raw.trim();
}
function parseCategoryTagsCell(cellText){
if(!cellText) return [];
const parts = cellText.split(",").map(s=>s.trim()).filter(Boolean);
return Array.from(new Set(parts.map(normalizeCategoryTag)));
}
function categoryTagLabel(tag){
return CAT_MAP[tag] ? CAT_MAP[tag][lang] : tag;
}
function parseCSVText(text){
if(text.charCodeAt(0)===0xFEFF) text = text.slice(1); // strip BOM
const rows = [];
let row = [], field = "", inQuotes = false;
for(let i=0;i<text.length;i++){
const c = text[i];
if(inQuotes){
if(c==='"'){
if(text[i+1]==='"'){ field+='"'; i++; }
else inQuotes = false;
} else field += c;
} else {
if(c==='"') inQuotes = true;
else if(c===','){ row.push(field); field=""; }
else if(c==='\n'){ row.push(field); rows.push(row); row=[]; field=""; }
else if(c==='\r'){ /* ignore, \n follows */ }
else field += c;
}
}
if(field.length>0 || row.length>0){ row.push(field); rows.push(row); }
return rows.filter(r => r.some(cell => (cell||"").trim()!==""));
}
async function handleCsvImport(event){
const fileInput = event.target;
const file = fileInput.files && fileInput.files[0];
const statusEl = document.getElementById("csvImportStatus");
if(!file) return;
statusEl.classList.remove("hidden");
statusEl.style.color = "var(--ink-soft)";
statusEl.textContent = t("csvImportReading");
try{
const text = await file.text();
const rows = parseCSVText(text);
if(rows.length===0){
statusEl.style.color = "var(--danger)";
statusEl.textContent = t("toastCsvImportNoRows");
return;
}
// Try to read the header row by name (Store, Employee Code, Employee
// Name, Category, Designation — in any order, extra columns ignored).
// Falls back to the plain two-column [ID, Name] template if no
// recognizable header is found.
const colMap = detectCsvColumnMap(rows[0]);
const dataRows = colMap ? rows.slice(1) : rows;
const idCol = colMap ? colMap.id : 0;
const nameCol = colMap ? colMap.name : 1;
const storeCol = colMap && colMap.store!==undefined ? colMap.store : -1;
const catCol = colMap && colMap.categories!==undefined ? colMap.categories : -1;

const seenInFile = new Set();
let added = 0, updated = 0, skipped = 0;
const merged = EMPLOYEES.slice();
dataRows.forEach(r=>{
const id = (r[idCol]||"").trim().toUpperCase();
const name = (r[nameCol]||"").trim();
if(!id || !name){ skipped++; return; }
if(seenInFile.has(id)){ skipped++; return; }
seenInFile.add(id);
const existingIdx = merged.findIndex(e=>e.id.toUpperCase()===id);
// Only overwrite Store / Category if this file actually has those
// columns — a plain ID/Name re-upload should never blank out data
// that a previous, richer import already set.
const prev = existingIdx>=0 ? merged[existingIdx] : null;
const store = storeCol>=0 ? (r[storeCol]||"").trim() : (prev ? (prev.store||"") : "");
const categories = catCol>=0 ? parseCategoryTagsCell(r[catCol]||"") : (prev ? (prev.categories||[]) : []);
if(prev){
const changed = prev.name!==name || (prev.store||"")!==store || JSON.stringify(prev.categories||[])!==JSON.stringify(categories);
if(changed){ merged[existingIdx] = {id: prev.id, name, store, categories}; updated++; }
} else {
merged.push({id, name, store, categories});
added++;
}
});
if(added===0 && updated===0){
statusEl.style.color = "var(--danger)";
statusEl.textContent = t("toastCsvImportNoRows");
return;
}
await writeRoster(merged);
document.getElementById("statTotal").textContent = EMPLOYEES.length;
renderEmployeesTable();
const summary = t("toastCsvImportSuccess").replace("{added}", added).replace("{updated}", updated).replace("{skipped}", skipped);
statusEl.style.color = "var(--success)";
statusEl.textContent = summary;
toast(summary);
}catch(e){
console.error("csv import failed", e);
statusEl.style.color = "var(--danger)";
statusEl.textContent = t("toastCsvImportFailed");
}finally{
fileInput.value = "";
}
}
function startEditEmployee(id){
editingEmployeeId = id;
renderEmployeesTable();
}
function cancelEditEmployee(){
editingEmployeeId = null;
renderEmployeesTable();
}
async function saveEditEmployee(originalId){
const row = document.getElementById("emprow-"+originalId);
const newId = row.querySelector(".edit-id-input").value.trim().toUpperCase();
const newName = row.querySelector(".edit-name-input").value.trim();
const newStore = row.querySelector(".edit-store-input").value.trim();
const errEl = document.getElementById("employeeFormError");
if(!newId || !newName){
errEl.textContent = t("employeeFormIncomplete");
errEl.classList.remove("hidden");
return;
}
if(newId!==originalId.toUpperCase() && EMPLOYEES.some(e=>e.id.toUpperCase()===newId)){
errEl.textContent = t("employeeIdExists");
errEl.classList.remove("hidden");
return;
}
errEl.classList.add("hidden");
const updated = EMPLOYEES.map(e => e.id===originalId ? {id:newId, name:newName, store:newStore, categories:e.categories||[]} : e);
try{
await writeRoster(updated);
editingEmployeeId = null;
renderEmployeesTable();
toast(t("toastEmployeeUpdated"));
}catch(e){ /* toast already shown */ }
}
async function deleteEmployee(id, name){
const msg = t("confirmDeleteEmployee").replace("{name}", name).replace("{id}", id);
if(!window.confirm(msg)) return;
const updated = EMPLOYEES.filter(e=>e.id!==id);
try{
await writeRoster(updated);
document.getElementById("statTotal").textContent = EMPLOYEES.length;
renderEmployeesTable();
renderAdminWithHistory(latestHistoryCache);
toast(t("toastEmployeeDeleted"));
}catch(e){ /* toast already shown */ }
}
// ---- STORE FILTER (shared across History / Pending / Team Roster tabs) --
let adminStoreFilter = "";
function refreshStoreFilterOptions(){
const sel = document.getElementById("adminStoreFilter");
if(!sel) return;
const stores = Array.from(new Set(EMPLOYEES.map(e=>(e.store||"").trim()).filter(Boolean))).sort();
if(adminStoreFilter && !stores.includes(adminStoreFilter)) adminStoreFilter = "";
const prev = sel.value;
sel.innerHTML = `<option value="">${t("allStoresOption")}</option>` + stores.map(s=>`<option value="${s}">${s}</option>`).join("");
sel.value = stores.includes(prev) ? prev : "";
adminStoreFilter = sel.value;
document.getElementById("adminStoreFilterWrap")?.classList.toggle("hidden", stores.length===0);
}
function onAdminStoreFilterChange(){
adminStoreFilter = document.getElementById("adminStoreFilter").value;
renderEmployeesTable();
renderAdminWithHistory(latestHistoryCache);
}
function categoryChips(categories){
if(!categories || categories.length===0) return `<span style="color:var(--ink-faint);">—</span>`;
return categories.map(c=>`<span class="pill tag-scenario" style="margin:0 .2rem .2rem 0; display:inline-block;">${categoryTagLabel(c)}</span>`).join("");
}
function renderEmployeesTable(){
const head = document.getElementById("employeesTableHead");
const body = document.getElementById("employeesTableBody");
if(!head || !body) return;
refreshStoreFilterOptions();
head.innerHTML = `<th>${t("colEmployeeId")}</th><th>${t("colName")}</th><th>${t("colStore")}</th><th>${t("colCategories")}</th><th>${t("colStudied")}</th><th>${t("colActions")}</th>`;
const filtered = adminStoreFilter ? EMPLOYEES.filter(e=>(e.store||"")===adminStoreFilter) : EMPLOYEES;
const sorted = filtered.slice().sort((a,b)=> a.id.localeCompare(b.id));
body.innerHTML = sorted.map(e=>{
const studiedCount = Object.keys(STUDY_ACTIVITY[e.id]||{}).length;
const studiedText = studyActivityReadDenied ? t("studyActivityUnavailable") : `${studiedCount}/${CATEGORIES.length}`;
const studiedCell = `<span style="color:${studiedCount>0?"var(--success)":"var(--ink-faint)"};">${studiedText}</span>`;
if(editingEmployeeId===e.id){
return `<tr id="emprow-${e.id}">
<td><input type="text" class="edit-id-input" value="${e.id}" style="padding:.4rem .6rem; font-size:.85rem; width:100%;"></td>
<td><input type="text" class="edit-name-input" value="${e.name}" style="padding:.4rem .6rem; font-size:.85rem; width:100%;"></td>
<td><input type="text" class="edit-store-input" value="${e.store||""}" style="padding:.4rem .6rem; font-size:.85rem; width:100%;"></td>
<td>${categoryChips(e.categories)}</td>
<td>${studiedCell}</td>
<td class="flex gap-2">
<button class="btn btn-primary btn-sm" onclick="saveEditEmployee('${e.id}')">${t("saveButton")}</button>
<button class="btn btn-ghost btn-sm" onclick="cancelEditEmployee()">${t("cancelButton")}</button>
</td>
</tr>`;
}
return `<tr id="emprow-${e.id}">
<td>${e.id}</td><td>${e.name}</td><td>${e.store||"—"}</td><td>${categoryChips(e.categories)}</td><td>${studiedCell}</td>
<td class="flex gap-2">
<button class="btn btn-ghost btn-sm" onclick="startEditEmployee('${e.id}')">${t("editButton")}</button>
<button class="btn btn-ghost btn-sm" style="color:var(--danger);" onclick="deleteEmployee('${e.id}', '${e.name.replace(/'/g,"\\'")}')">${t("deleteButton")}</button>
</td>
</tr>`;
}).join("");
document.getElementById("employeesEmptyMsg").classList.toggle("hidden", sorted.length>0);
document.getElementById("studyActivityNotice").classList.toggle("hidden", !studyActivityReadDenied);
}

/* =====================================================================
4. i18n
===================================================================== */
function t(key){
const entry = TRANSLATIONS[key];
if(!entry) return key;
return entry[lang] || entry.en || key;
}
function applyLanguage(){
document.querySelectorAll("[data-i18n]").forEach(el=>{
el.textContent = t(el.getAttribute("data-i18n"));
});
document.querySelectorAll("[data-i18n-ph]").forEach(el=>{
el.setAttribute("placeholder", t(el.getAttribute("data-i18n-ph")));
});
document.getElementById("langEnBtn").classList.toggle("active", lang==="en");
document.getElementById("langHiBtn").classList.toggle("active", lang==="hi");
document.documentElement.setAttribute("lang", lang);
refreshDynamicScreen();
}
function setLang(l){
lang = l;
applyLanguage();
}
function refreshDynamicScreen(){
if(currentUser){
document.getElementById("userChip").textContent = t("welcomeBackPrefix") + currentUser.name + " (" + currentUser.id + ")";
}
updateStorageNote();
const active = document.querySelector(".screen.active");
if(!active) return;
const id = active.id;
if(id==="screen-category") renderCategoryGrid();
else if(id==="screen-quiz" && quiz) renderQuestion();
else if(id==="screen-results" && lastResult) renderResults();
else if(id==="screen-training" && lastResult) renderTrainingSummary();
else if(id==="screen-admin" && isAdmin){ renderAdminWithHistory(latestHistoryCache); renderEmployeesTable(); }
else if(id==="screen-coach" && coachCategory) renderCoachChatStatic();
else if(id==="screen-coach-results" && lastCoachResult) renderCoachResults();
if(currentUser) document.getElementById("welcomeBackText").textContent = t("welcomeBackPrefix") + currentUser.name;
}

/* =====================================================================
5. NAVIGATION / TOAST
===================================================================== */
function showScreen(name){
document.querySelectorAll(".screen").forEach(s=>s.classList.remove("active"));
document.getElementById("screen-"+name).classList.add("active");
document.getElementById("logoutBtn").classList.toggle("hidden", !(currentUser||isAdmin));
document.getElementById("userChip").classList.toggle("hidden", !currentUser);
if(name!=="admin" && adminUnsub){ adminUnsub(); adminUnsub = null; }
if(name==="category") setCategoryMode(categoryScreenMode);
else if(name==="training") renderTrainingSummary();
else if(name==="admin") enterAdminScreen();
window.scrollTo({top:0, behavior:"instant"});
}
let toastTimer=null;
function toast(msg){
const el = document.getElementById("toast");
el.textContent = msg;
el.classList.remove("hidden");
clearTimeout(toastTimer);
toastTimer = setTimeout(()=>el.classList.add("hidden"), 3200);
}

/* =====================================================================
6. LOGIN
===================================================================== */
function attemptEmployeeLogin(){
if(adminPage || !dbNamespace) return;
const val = document.getElementById("employeeIdInput").value.trim().toUpperCase();
const emp = EMPLOYEES.find(e=>e.id.toUpperCase()===val);
const errEl = document.getElementById("loginError");
if(!emp || !val){
errEl.textContent = t("loginErrorMsg");
errEl.classList.remove("hidden");
return;
}
errEl.classList.add("hidden");
currentUser = emp;
selectedCategories = [];
document.getElementById("userChip").classList.remove("hidden");
document.getElementById("userChip").textContent = t("welcomeBackPrefix") + emp.name + " (" + emp.id + ")";
document.getElementById("welcomeBackText").textContent = t("welcomeBackPrefix") + emp.name;
document.getElementById("employeeIdInput").value = "";
showScreen("category");
renderCategoryGrid();
}
function attemptAdminLogin(){
if(!adminPage || !dbNamespace) return;
const id = document.getElementById("adminIdInput").value.trim().toUpperCase();
const pw = document.getElementById("adminPasswordInput").value.trim();
const errEl = document.getElementById("adminLoginError");
if(id!==ADMIN_CREDENTIALS.id.toUpperCase() || pw!==adminPassword){
errEl.textContent = t("adminLoginErrorMsg");
errEl.classList.remove("hidden");
return;
}
errEl.classList.add("hidden");
isAdmin = true;
document.getElementById("adminIdInput").value = "";
document.getElementById("adminPasswordInput").value = "";
showScreen("admin");
}
function toggleChangePasswordPanel(show){
const panel = document.getElementById("changePasswordPanel");
const willShow = show===undefined ? panel.classList.contains("hidden") : show;
panel.classList.toggle("hidden", !willShow);
document.getElementById("changePasswordError").classList.add("hidden");
document.getElementById("currentPasswordInput").value = "";
document.getElementById("newPasswordInput").value = "";
document.getElementById("confirmPasswordInput").value = "";
}
async function submitChangeAdminPassword(){
const cur = document.getElementById("currentPasswordInput").value;
const next = document.getElementById("newPasswordInput").value;
const confirmPw = document.getElementById("confirmPasswordInput").value;
const errEl = document.getElementById("changePasswordError");
const showErr = (msg)=>{ errEl.textContent = msg; errEl.classList.remove("hidden"); };
if(!cur || !next || !confirmPw){ showErr(t("changePasswordFillAll")); return; }
if(cur!==adminPassword){ showErr(t("changePasswordWrongCurrent")); return; }
if(next.length<6){ showErr(t("changePasswordTooShort")); return; }
if(next!==confirmPw){ showErr(t("changePasswordMismatch")); return; }
errEl.classList.add("hidden");
try{
await changeAdminPassword(next);
toggleChangePasswordPanel(false);
toast(t("toastPasswordChanged"));
}catch(e){
console.error("admin password change failed", e);
showErr(t("toastPasswordChangeFailed"));
}
}
function doLogout(){
currentUser = null;
isAdmin = false;
selectedCategories = [];
quiz = null;
lastResult = null;
studyCategory = null;
studyCards = [];
studyIndex = 0;
coachCategory = null;
coachFocus = null;
coachHistory = [];
coachTurnScores = [];
coachTurnFeedback = [];
lastCoachResult = null;
categoryScreenMode = "test";
if(adminUnsub){ adminUnsub(); adminUnsub = null; }
if(studyActivityUnsub){ studyActivityUnsub(); studyActivityUnsub = null; }
document.getElementById("userChip").classList.add("hidden");
if(adminPage) toggleChangePasswordPanel(false);
showScreen("login");
}

/* =====================================================================
7. CATEGORY SELECTION
===================================================================== */
function setCategoryMode(mode){
categoryScreenMode = mode;
document.getElementById("tab-catmode-test-btn").classList.toggle("active", mode==="test");
document.getElementById("tab-catmode-study-btn").classList.toggle("active", mode==="study");
document.getElementById("tab-catmode-coach-btn").classList.toggle("active", mode==="coach");
document.getElementById("catModeTest").classList.toggle("hidden", mode!=="test");
document.getElementById("catModeStudy").classList.toggle("hidden", mode!=="study");
document.getElementById("catModeCoach").classList.toggle("hidden", mode!=="coach");
if(mode==="test") renderCategoryGrid();
else if(mode==="study") renderStudyHubGrid();
else renderCoachSetupGrids();
}
function renderCategoryGrid(){
const grid = document.getElementById("categoryGrid");
grid.innerHTML = CATEGORIES.map(c=>{
const sel = selectedCategories.includes(c.key);
return `<button type="button" id="test-category-${c.key}" class="cat-tile ${sel?"selected":""}" aria-pressed="${sel}" onclick="toggleCategory('${c.key}')">
<span class="cat-tile-icon" aria-hidden="true">${ICONS[c.key]}</span>
<span class="block font-semibold text-sm mt-2">${c[lang]}</span>
</button>`;
}).join("");
document.getElementById("selectedCountText").textContent = selectedCategories.length;
document.getElementById("startTestBtn").disabled = selectedCategories.length===0;
}
function toggleCategory(key){
const buttonId = "test-category-" + key;
const restoreFocus = document.activeElement?.id === buttonId;
const i = selectedCategories.indexOf(key);
if(i>=0){ selectedCategories.splice(i,1); }
else{
if(selectedCategories.length>=3){ toast(t("maxCategoriesToast")); return; }
selectedCategories.push(key);
}
renderCategoryGrid();
if(restoreFocus) document.getElementById(buttonId)?.focus({preventScroll:true});
}
/* Study Material tab: a dedicated grid, separate from test-category selection.
   Each tile opens that category's flashcards directly — no multi-select, no
   "Start" step, since browsing here is never graded. */
function renderStudyHubGrid(){
const grid = document.getElementById("studyHubGrid");
if(!grid) return;
grid.innerHTML = CATEGORIES.map(c=>{
const count = FLASHCARDS.filter(f=>f.category===c.key).length;
return `<button type="button" class="cat-tile" onclick="openStudyMode('${c.key}')">
<span class="cat-tile-icon" aria-hidden="true">${ICONS[c.key]}</span>
<span class="block font-semibold text-sm mt-2">${c[lang]}</span>
<span class="block text-sm mt-1" style="color:var(--ink-faint);">${count} ${t("studyCardsCountSuffix")}</span>
</button>`;
}).join("");
}

/* =====================================================================
7C. SALES & GREETING COACH
A live AI roleplay: the associate picks a product category and a skill
to practice, then exchanges a short series of messages with an AI
playing the customer. Every associate message is sent to the
coach-turn Netlify function (which calls Claude through the Netlify AI
Gateway) and comes back with the customer's next line plus a 0-100
score and one feedback sentence for that message — scored live, turn
by turn, rather than only at the end. Scenarios run a fixed number of
turns (COACH_MAX_TURNS) and the completed scenario is saved to its own
"coachingHistory" collection (see persistCoachRecord), same
never-store-locally rule as everything else in this app.
===================================================================== */
// Scripted opening line the "customer" uses to kick off each focus — the
// coach-turn function only ever scores an ASSOCIATE message, so the very
// first line of every scenario is written here rather than generated, to
// guarantee there's something for the associate to respond to.
const COACH_OPENERS = {
greeting: {en:"Hi, I'm just having a look around.", hi:"नमस्ते, मैं बस देख रहा/रही हूँ।"},
needs: {en:"Hi, I think I need a new one of these, but I'm not sure which one yet.", hi:"नमस्ते, मुझे लगता है मुझे एक नया वाला चाहिए, पर अभी पता नहीं कौन सा लूं।"},
objection: {en:"I saw this cheaper online, so I'm not really sure about buying it here.", hi:"मैंने यह ऑनलाइन सस्ता देखा है, इसलिए यहाँ से खरीदने को लेकर पक्का नहीं हूँ।"},
closing: {en:"Okay, I do like what you've shown me so far.", hi:"ठीक है, आपने जो अब तक दिखाया वह मुझे पसंद आया।"},
};
function renderCoachSetupGrids(){
const catGrid = document.getElementById("coachCategoryGrid");
if(catGrid){
catGrid.innerHTML = CATEGORIES.map(c=>{
const sel = coachCategory===c.key;
return `<button type="button" id="coach-category-${c.key}" class="cat-tile ${sel?"selected":""}" aria-pressed="${sel}" onclick="selectCoachCategory('${c.key}')">
<span class="cat-tile-icon" aria-hidden="true">${ICONS[c.key]}</span>
<span class="block font-semibold text-sm mt-2">${c[lang]}</span>
</button>`;
}).join("");
}
const focusGrid = document.getElementById("coachFocusGrid");
if(focusGrid){
focusGrid.innerHTML = COACH_FOCUSES.map(f=>{
const sel = coachFocus===f.key;
return `<button type="button" class="focus-pill ${sel?"selected":""}" onclick="selectCoachFocus('${f.key}')">${f.icon} ${t(f.i18n)}</button>`;
}).join("");
}
const btn = document.getElementById("startCoachBtn");
if(btn) btn.disabled = !(coachCategory && coachFocus);
}
function selectCoachCategory(key){
const buttonId = "coach-category-" + key;
const restoreFocus = document.activeElement?.id === buttonId;
coachCategory = key;
renderCoachSetupGrids();
if(restoreFocus) document.getElementById(buttonId)?.focus({preventScroll:true});
}
function selectCoachFocus(key){
coachFocus = key;
renderCoachSetupGrids();
}
function exitCoachMode(){
categoryScreenMode = "coach"; // they came from the Coach tab — return there, not the test tab
showScreen("category");
}
function restartCoachSetup(){
coachCategory = null;
coachFocus = null;
exitCoachMode();
}
function startCoachScenario(){
if(!coachCategory || !coachFocus) return;
coachTurnNumber = 1;
coachTurnScores = [];
coachTurnFeedback = [];
coachBusy = false;
const opener = COACH_OPENERS[coachFocus] || COACH_OPENERS.greeting;
coachHistory = [{role:"customer", content: opener[lang] || opener.en}];
renderCoachChatStatic();
document.getElementById("coachChatLog").innerHTML = "";
appendCoachBubble("customer", coachHistory[0].content);
setCoachInputEnabled(true);
showScreen("coach");
document.getElementById("coachInput").focus();
}
function renderCoachChatStatic(){
const cat = CATEGORIES.find(c=>c.key===coachCategory);
const focus = COACH_FOCUSES.find(f=>f.key===coachFocus);
document.getElementById("coachCategoryTitle").textContent = cat ? cat[lang] : "";
document.getElementById("coachFocusTitle").textContent = focus ? t(focus.i18n) : "";
document.getElementById("coachTurnText").textContent = Math.min(coachTurnNumber, COACH_MAX_TURNS);
document.getElementById("coachMaxTurnsText").textContent = COACH_MAX_TURNS;
document.getElementById("coachProgressFill").style.width = ((Math.min(coachTurnNumber-1,COACH_MAX_TURNS)/COACH_MAX_TURNS)*100)+"%";
const avgEl = document.getElementById("coachAvgScoreText");
if(coachTurnScores.length){
const avg = Math.round(coachTurnScores.reduce((a,b)=>a+b,0)/coachTurnScores.length);
avgEl.textContent = avg+"%";
avgEl.style.color = avg>=70 ? "var(--success)" : "var(--danger)";
}else{
avgEl.textContent = "—";
avgEl.style.color = "var(--ink)";
}
}
function appendCoachBubble(role, text){
const log = document.getElementById("coachChatLog");
const row = document.createElement("div");
row.className = "coach-msg-row "+role;
row.innerHTML = `<div class="coach-bubble ${role}"></div>`;
row.querySelector(".coach-bubble").textContent = text; // textContent: never render model/user text as HTML
log.appendChild(row);
log.scrollTop = log.scrollHeight;
return row;
}
function appendCoachNote(score, feedback){
const log = document.getElementById("coachChatLog");
const row = document.createElement("div");
row.className = "coach-msg-row associate";
const colorVar = score>=70 ? "var(--success)" : "var(--warning)";
row.innerHTML = `<div class="coach-note"><span class="coach-turn-score" style="color:${colorVar};">${score}%</span> — <span></span></div>`;
row.querySelector(".coach-note span:last-child").textContent = feedback;
log.appendChild(row);
log.scrollTop = log.scrollHeight;
}
function setCoachInputEnabled(enabled){
coachBusy = !enabled;
document.getElementById("coachInput").disabled = !enabled;
document.getElementById("coachSendBtn").disabled = !enabled;
}
async function sendCoachMessage(){
if(coachBusy) return;
const input = document.getElementById("coachInput");
const msg = input.value.trim();
if(!msg) return;
coachHistory.push({role:"associate", content: msg});
appendCoachBubble("associate", msg);
input.value = "";
setCoachInputEnabled(false);
const thinkingRow = appendCoachBubble("customer", t("coachThinking"));
thinkingRow.querySelector(".coach-bubble").classList.add("thinking");
const cat = CATEGORIES.find(c=>c.key===coachCategory);
const focus = COACH_FOCUSES.find(f=>f.key===coachFocus);
try{
const res = await fetch("/api/coach-turn", {
method: "POST",
headers: {"Content-Type":"application/json"},
body: JSON.stringify({
lang, category: coachCategory, categoryLabel: cat ? cat[lang] : coachCategory,
focus: coachFocus, focusLabel: focus ? t(focus.i18n) : coachFocus,
employeeName: currentUser ? currentUser.name : "",
turnNumber: coachTurnNumber, maxTurns: COACH_MAX_TURNS,
history: coachHistory,
}),
});
if(!res.ok) throw new Error("coach-turn HTTP "+res.status);
const data = await res.json();
thinkingRow.remove();
coachTurnScores.push(data.turnScore);
coachTurnFeedback.push(data.feedback);
appendCoachNote(data.turnScore, data.feedback);
coachHistory.push({role:"customer", content: data.customerReply});
appendCoachBubble("customer", data.customerReply);
coachTurnNumber++;
renderCoachChatStatic();
if(data.scenarioComplete || coachTurnNumber>COACH_MAX_TURNS){
finishCoachScenario();
}else{
setCoachInputEnabled(true);
input.focus();
}
}catch(e){
console.error("coach-turn request failed", e);
thinkingRow.remove();
coachHistory.pop(); // let them retry the same message rather than silently dropping it
input.value = msg;
toast(t("coachTurnErrorToast"));
setCoachInputEnabled(true);
}
}
function endCoachScenarioEarly(){
if(coachBusy) return;
if(!confirm(t("coachEndEarlyConfirm"))) return;
finishCoachScenario();
}
async function finishCoachScenario(){
const turnCount = coachTurnScores.length;
const avgScore = turnCount ? Math.round(coachTurnScores.reduce((a,b)=>a+b,0)/turnCount) : 0;
const passed = turnCount>0 && avgScore>=70;
const cat = CATEGORIES.find(c=>c.key===coachCategory);
const focus = COACH_FOCUSES.find(f=>f.key===coachFocus);
const record = {
employeeId: currentUser.id,
name: currentUser.name,
store: currentUser.store || "",
category: coachCategory,
categoryLabel: cat ? cat.en : coachCategory,
focus: coachFocus,
focusLabel: focus ? (TRANSLATIONS[focus.i18n] && TRANSLATIONS[focus.i18n].en) || coachFocus : coachFocus,
lang,
timestamp: new Date().toISOString(),
turnCount, avgScore, passed,
pointsEarned: avgScore, // simple gamification: points earned == the avg score itself
turns: coachHistory.map((h,i)=>({...h})),
turnScores: coachTurnScores.slice(),
turnFeedback: coachTurnFeedback.slice(),
};
let saveFailed = false;
if(turnCount>0){
try{ await persistCoachRecord(record); }catch(e){ saveFailed = true; }
}
lastCoachResult = { record, avgScore, passed, turnCount, saveFailed };
showScreen("coach-results");
renderCoachResults();
}
function renderCoachResults(){
const r = lastCoachResult;
if(!r) return;
document.getElementById("coachSaveStatusBanner").classList.toggle("hidden", !r.saveFailed);
document.getElementById("coachScorePctText").textContent = r.avgScore+"%";
const circumference = 2*Math.PI*64;
const ring = document.getElementById("coachScoreRing");
ring.style.stroke = r.passed ? "var(--success)" : "var(--danger)";
ring.setAttribute("stroke-dasharray", circumference.toFixed(1));
ring.setAttribute("stroke-dashoffset", (circumference*(1-r.avgScore/100)).toFixed(1));
const band = document.getElementById("coachScoreBandText");
band.textContent = r.turnCount===0 ? "—" : (r.passed ? t("passText") : t("failText"));
band.className = "pill mt-1 " + (r.passed ? "tag-success" : "tag-advanced");
document.getElementById("coachResultsSummaryText").textContent = r.turnCount===0
? t("coachNoTurnsMsg")
: `${r.avgScore}% ${t("coachPointsLabel")} · ${r.turnCount} ${t("coachTurnsCountSuffix")}`;
const wrap = document.getElementById("coachFeedbackWrap");
wrap.innerHTML = "";
r.record.turnFeedback.forEach((fb,i)=>{
const score = r.record.turnScores[i];
const color = score>=70 ? "var(--success)" : "var(--warning)";
const card = document.createElement("div");
card.className = "flat p-4";
card.innerHTML = `<div class="flex items-center justify-between mb-1">
<div class="font-semibold text-sm">${t("coachTurnLabel")} ${i+1}</div>
<div class="coach-turn-score font-bold" style="color:${color};">${score}%</div>
</div>
<div class="coach-fb-text text-sm" style="color:var(--ink-soft);"></div>`;
card.querySelector(".coach-fb-text").textContent = fb; // textContent: fb is model-generated, never trust as HTML
wrap.appendChild(card);
});
}
async function retrySaveCoachResult(){
if(!lastCoachResult || !lastCoachResult.saveFailed) return;
try{
await persistCoachRecord(lastCoachResult.record);
lastCoachResult.saveFailed = false;
toast(t("toastSaved"));
renderCoachResults();
}catch(e){ /* toast already shown by persistCoachRecord */ }
}

/* =====================================================================
7B. STUDY MODE
A no-pressure flashcard browser for one category at a time — every base
model's full spec sheet plus its key selling point, with Prev/Next
navigation and no scoring or time limit. Meant for new joiners who want
to read up before attempting the graded test. Opening a category here is
recorded server-side (once per category, best-effort) so admins can see
study activity separately from test results.
===================================================================== */
function openStudyMode(catKey){
studyCategory = catKey;
studyCards = FLASHCARDS.filter(c=>c.category===catKey);
studyIndex = 0;
recordStudyActivity(catKey);
renderStudyBasics();
showScreen("study-basics"); // product basics + feature glossary come first, then "Start Flashcards"
}
function exitStudyMode(){
categoryScreenMode = "study"; // they came from the Study Material tab — return there, not the test tab
showScreen("category");
}
function renderStudyBasics(){
const cat = CATEGORIES.find(c=>c.key===studyCategory);
document.getElementById("studyBasicsCategoryTitle").textContent = cat ? cat[lang] : "";
const basics = CATEGORY_BASICS[studyCategory];
if(!basics) return;
document.getElementById("studyBasicsIntroText").textContent = basics.intro[lang];
document.getElementById("studyGlossaryWrap").innerHTML = basics.glossary.map(g=>`
<div class="glossary-entry">
<div class="text-sm font-bold capitalize">${g.label[lang]}</div>
<div class="text-sm mt-0.5" style="color:var(--ink-soft);">${g.why[lang]}</div>
</div>`).join("");
}
function showStudyBasics(){
renderStudyBasics();
showScreen("study-basics");
}
function startStudyCards(){
renderStudyCard();
showScreen("study");
}
function renderStudyCard(){
const cat = CATEGORIES.find(c=>c.key===studyCategory);
document.getElementById("studyCategoryTitle").textContent = cat ? cat[lang] : "";
const card = studyCards[studyIndex];
if(!card) return;
document.getElementById("studyCardIndexText").textContent = studyIndex+1;
document.getElementById("studyCardTotalText").textContent = studyCards.length;
document.getElementById("studyProgressFill").style.width = (((studyIndex+1)/studyCards.length)*100)+"%";
document.getElementById("studyCardBrand").textContent = card.brand;
document.getElementById("studyCardModel").textContent = card.model;
document.getElementById("studySpecsWrap").innerHTML = card.specs.map(s=>`
<div class="flashcard-spec">
<span class="text-sm" style="color:var(--ink-soft);">${s.label[lang]}</span>
<span class="text-sm font-semibold">${s.value}</span>
</div>`).join("");
const spWrap = document.getElementById("studySellingPointWrap");
if(card.sellingPoint){
spWrap.classList.remove("hidden");
const spText = card.sellingPoint[lang];
document.getElementById("studySellingPointText").textContent = spText.charAt(0).toUpperCase()+spText.slice(1);
}else{
spWrap.classList.add("hidden");
}
document.getElementById("studyPrevBtn").disabled = studyIndex===0;
document.getElementById("studyNextBtn").textContent = (studyIndex===studyCards.length-1) ? t("studyDoneButton") : t("studyNextButton");
}
function studyPrev(){
if(studyIndex<=0) return;
studyIndex--;
renderStudyCard();
}
function studyNext(){
if(studyIndex>=studyCards.length-1){ exitStudyMode(); return; }
studyIndex++;
renderStudyCard();
}
const STUDY_ACTIVITY_DOC_PATH = "studyActivity";
async function recordStudyActivity(catKey){
if(!dbNamespace || !currentUser || studyActivityWriteDenied) return;
const employeeId = currentUser.id;
if(STUDY_ACTIVITY[employeeId]?.[catKey]) return;
try{
await dbNamespace.doc(STUDY_ACTIVITY_DOC_PATH+"/"+employeeId).set({
categories: { [catKey]: true },
updatedAt: new Date().toISOString(),
}, { merge: true });
STUDY_ACTIVITY[employeeId] = { ...STUDY_ACTIVITY[employeeId], [catKey]: true };
}catch(e){
if(e.code==="permission-denied"){
if(!studyActivityWriteDenied) toast(t("studyActivityWriteDenied"));
studyActivityWriteDenied = true;
return;
}
console.error("study activity write failed (non-critical)", e);
}
}

/* =====================================================================
8. QUIZ ENGINE
===================================================================== */
function shuffleArr(arr){
const a = arr.slice();
for(let i=a.length-1;i>0;i--){
const j = Math.floor(Math.random()*(i+1));
[a[i],a[j]] = [a[j],a[i]];
}
return a;
}
// Base random pool size (unchanged from before), plus guaranteed slots reserved
// for the "match customer need to feature" and "how to operate a feature" sets,
// so every test the sales team takes always includes a healthy helping of both —
// on top of the original random mix, not instead of it. Total test length is
// therefore BASE_TOTAL + GUARANTEED_NEEDS_TOTAL + GUARANTEED_USAGE_TOTAL = 25
// (up from 15), split fairly across whichever categories were selected.
const BASE_TOTAL = 15;
const GUARANTEED_NEEDS_TOTAL = 5;
const GUARANTEED_USAGE_TOTAL = 5;

// Splits `total` into `n` whole-number shares, as evenly as possible (same
// rule the original code used for the base pool: floor + remainder to the
// first few categories), so every selected category gets its fair share.
function splitAcrossCategories(total, n){
const base = Math.floor(total/n), rem = total % n;
return Array.from({length:n}, (_,i)=> base + (i<rem?1:0));
}

// Randomly pick up to `count` questions of a given topic for a category,
// preferring the current difficulty tier but backfilling from any difficulty
// if that tier doesn't have enough — same fallback pattern as the base pool
// below, so a guarantee never fails just because the advanced tier is thin
// on a particular topic yet.
function pickTopicQuestions(cat, tier, topic, count, excludeIds){
if(count<=0) return [];
let pool = shuffleArr(QUESTION_BANK.filter(q=>q.category===cat && q.topic===topic && q.difficulty===tier && !excludeIds.has(q.id)));
let take = pool.slice(0, count);
if(take.length < count){
const taken = new Set(take.map(q=>q.id));
let more = shuffleArr(QUESTION_BANK.filter(q=>q.category===cat && q.topic===topic && !excludeIds.has(q.id) && !taken.has(q.id)));
take = take.concat(more.slice(0, count-take.length));
}
return take;
}

function buildQuiz(categories, tier){
const n = categories.length;
const baseSplit = splitAcrossCategories(BASE_TOTAL, n);
const needsSplit = splitAcrossCategories(GUARANTEED_NEEDS_TOTAL, n);
const usageSplit = splitAcrossCategories(GUARANTEED_USAGE_TOTAL, n);
let picked = [];
categories.forEach((cat,i)=>{
const takenIds = new Set();
const guaranteedNeeds = pickTopicQuestions(cat, tier, 'needs-matching', needsSplit[i], takenIds);
guaranteedNeeds.forEach(q=>takenIds.add(q.id));
const guaranteedUsage = pickTopicQuestions(cat, tier, 'feature-usage', usageSplit[i], takenIds);
guaranteedUsage.forEach(q=>takenIds.add(q.id));
const need = baseSplit[i];
let pool = shuffleArr(QUESTION_BANK.filter(q=>q.category===cat && q.difficulty===tier && !takenIds.has(q.id)));
let take = pool.slice(0, need);
if(take.length < need){
take.forEach(q=>takenIds.add(q.id));
let more = shuffleArr(QUESTION_BANK.filter(q=>q.category===cat && !takenIds.has(q.id)));
take = take.concat(more.slice(0, need-take.length));
}
picked = picked.concat(guaranteedNeeds, guaranteedUsage, take);
});
picked = shuffleArr(picked);
return picked.map(q=>{
const order = shuffleArr([0,1,2,3]);
return {
id:q.id, category:q.category, type:q.type, difficulty:q.difficulty, topic:q.topic,
en:{ q:q.en.q, options:order.map(i=>q.en.options[i]), correct:order.indexOf(q.en.correct), explain:q.en.explain },
hi:{ q:q.hi.q, options:order.map(i=>q.hi.options[i]), correct:order.indexOf(q.hi.correct), explain:q.hi.explain },
};
});
}
async function startQuiz(){
if(selectedCategories.length===0) return;
const startBtn = document.getElementById("startTestBtn");
startBtn.disabled = true;
let attemptNumber = 1;
try{
attemptNumber = (await fetchAttemptCount(currentUser.id)) + 1;
}catch(e){ /* default to attempt 1 on any failure */ }
startBtn.disabled = selectedCategories.length===0;
const tier = attemptNumber<=1 ? "medium" : "advanced";
quiz = {
questions: buildQuiz(selectedCategories, tier),
idx: 0,
answers: {},
tier,
categories: selectedCategories.slice(),
attemptNumber,
};
showScreen("quiz");
renderQuestion();
}
const OPT_LETTERS = ["A","B","C","D"];
function renderQuestion(){
const q = quiz.questions[quiz.idx];
document.getElementById("qIndexText").textContent = quiz.idx+1;
document.getElementById("qTotalText").textContent = quiz.questions.length;
document.getElementById("quizProgressFill").style.width = (((quiz.idx)/quiz.questions.length)*100)+"%";
const tierTag = document.getElementById("quizTierTag");
tierTag.textContent = t(quiz.tier);
tierTag.className = "pill " + (quiz.tier==="medium" ? "tag-medium" : "tag-advanced");
document.getElementById("quizCatTag").textContent = CAT_MAP[q.category][lang];
const typeTag = document.getElementById("quizTypeTag");
typeTag.textContent = t(q.type);
typeTag.className = "pill " + (q.type==="technical" ? "tag-tech" : "tag-scenario");
document.getElementById("questionText").textContent = q[lang].q;
const wrap = document.getElementById("optionsWrap");
const selected = quiz.answers[q.id];
wrap.innerHTML = q[lang].options.map((opt,i)=>`
<button type="button" class="opt-btn ${selected===i?"selected":""}" onclick="selectOption(${i})">
<span class="opt-letter">${OPT_LETTERS[i]}</span>
<span class="flex-1">${opt}</span>
</button>`).join("");
const nextBtn = document.getElementById("nextQBtn");
nextBtn.disabled = selected===undefined;
nextBtn.textContent = quiz.idx===quiz.questions.length-1 ? t("submitButton") : t("nextButton");
}
function selectOption(i){
const q = quiz.questions[quiz.idx];
quiz.answers[q.id] = i;
renderQuestion();
}
function nextQuestion(){
if(quiz.idx < quiz.questions.length-1){
quiz.idx++;
renderQuestion();
} else {
finishQuiz();
}
}

/* =====================================================================
9. RESULTS + HISTORY
===================================================================== */
async function finishQuiz(){
let correctCount = 0;
const byCategory = {};
quiz.categories.forEach(c=>byCategory[c]={correct:0,total:0});
const missed = [];
quiz.questions.forEach(q=>{
const sel = quiz.answers[q.id];
const isCorrect = sel === q.en.correct;
byCategory[q.category] = byCategory[q.category] || {correct:0,total:0};
byCategory[q.category].total++;
if(isCorrect){ correctCount++; byCategory[q.category].correct++; }
else{ missed.push(q); }
});
const total = quiz.questions.length;
const scorePercent = Math.round((correctCount/total)*100);
const weakCategories = Object.keys(byCategory).filter(c=>byCategory[c].total>0 && (byCategory[c].correct/byCategory[c].total) < 0.7);
const weakTopics = Array.from(new Set(missed.map(q=>q.topic)));

const record = {
employeeId: currentUser.id,
name: currentUser.name,
store: currentUser.store || "",
attempt: quiz.attemptNumber,
categories: quiz.categories.slice(),
timestamp: new Date().toISOString(),
scorePercent, correctCount, total,
weakCategories, weakTopics,
missedQuestionIds: missed.map(q=>q.id),
};
let saveFailed = false;
try{
await persistHistoryRecord(record);
}catch(e){ saveFailed = true; }

lastResult = { quiz, byCategory, missed, correctCount, total, scorePercent, weakTopics, record, saveFailed };
showScreen("results");
renderResults();
}
async function retrySaveResult(){
if(!lastResult || !lastResult.saveFailed) return;
try{
await persistHistoryRecord(lastResult.record);
lastResult.saveFailed = false;
toast(t("toastSaved"));
renderResults();
}catch(e){ /* toast already shown by persistHistoryRecord */ }
}
function renderResults(){
const r = lastResult;
document.getElementById("saveStatusBanner").classList.toggle("hidden", !r.saveFailed);
document.getElementById("scorePctText").textContent = r.scorePercent+"%";
const circumference = 2*Math.PI*64;
const ring = document.getElementById("scoreRing");
ring.style.stroke = r.scorePercent>=70 ? "var(--success)" : "var(--danger)";
ring.setAttribute("stroke-dasharray", circumference.toFixed(1));
ring.setAttribute("stroke-dashoffset", (circumference*(1-r.scorePercent/100)).toFixed(1));
const band = document.getElementById("scoreBandText");
band.textContent = r.scorePercent>=70 ? t("passText") : t("failText");
band.className = "pill mt-1 " + (r.scorePercent>=70 ? "tag-success" : "tag-advanced");
document.getElementById("scoreSummaryText").textContent = t("correctOfTotal").replace("{correct}", r.correctCount).replace("{total}", r.total);
document.getElementById("trainingCTA").classList.toggle("hidden", r.scorePercent>=70);

const bwrap = document.getElementById("categoryBreakdownWrap");
bwrap.innerHTML = Object.keys(r.byCategory).map(c=>{
const d = r.byCategory[c];
const pct = d.total ? Math.round((d.correct/d.total)*100) : 0;
const color = pct>=70 ? "var(--success)" : "var(--danger)";
return `<div class="flat p-4">
<div class="flex items-center justify-between mb-2">
<div class="flex items-center gap-2 font-semibold text-sm"><span style="color:var(--primary)">${ICONS[c]}</span>${CAT_MAP[c][lang]}</div>
<div class="text-sm font-bold" style="color:${color}">${pct}%</div>
</div>
<div class="progress-track"><div class="progress-fill" style="width:${pct}%; background:${color};"></div></div>
<div class="text-xs mt-1.5" style="color:var(--ink-faint);">${d.correct} / ${d.total}</div>
</div>`;
}).join("");

const rwrap = document.getElementById("reviewWrap");
rwrap.innerHTML = r.quiz.questions.map(q=>{
const sel = r.quiz.answers[q.id];
const isCorrect = sel===q.en.correct;
const optsHtml = q[lang].options.map((opt,i)=>{
let cls = "opt-btn";
if(i===q[lang].correct) cls += " correct";
else if(i===sel) cls += " incorrect";
return `<div class="${cls}" style="cursor:default;"><span class="opt-letter">${OPT_LETTERS[i]}</span><span class="flex-1">${opt}</span></div>`;
}).join("");
return `<div class="card p-5">
<div class="flex items-center gap-2 mb-3 flex-wrap">
<span class="pill ${isCorrect?"tag-success":"tag-advanced"}">${isCorrect?t("correctTag"):t("incorrectTag")}</span>
<span class="pill tag-tech">${CAT_MAP[q.category][lang]}</span>
<span class="pill ${q.type==="technical"?"tag-tech":"tag-scenario"}">${t(q.type)}</span>
</div>
<div class="font-semibold mb-3">${q[lang].q}</div>
<div class="flex flex-col gap-2 mb-3">${optsHtml}</div>
<div class="text-sm p-3 rounded-lg" style="background:var(--surface-2);"><span class="font-semibold">${t("explanationLabel")}:</span> ${q[lang].explain}</div>
</div>`;
}).join("");
}
function resetToCategory(){
quiz = null;
lastResult = null;
selectedCategories = [];
showScreen("category");
renderCategoryGrid();
}

/* =====================================================================
10. TARGETED TRAINING SUMMARY
===================================================================== */
function renderTrainingSummary(){
const wrap = document.getElementById("trainingCardsWrap");
if(!lastResult || lastResult.missed.length===0){
wrap.innerHTML = "";
return;
}
const byTopic = {};
lastResult.missed.forEach(q=>{
byTopic[q.topic] = byTopic[q.topic] || [];
byTopic[q.topic].push(q);
});
wrap.innerHTML = Object.keys(byTopic).map(topic=>{
const qs = byTopic[topic];
const label = TOPIC_LABELS[topic] ? TOPIC_LABELS[topic][lang] : topic;
const items = qs.map(q=>`
<div class="pt-3 mt-3 border-t" style="border-color:var(--border);">
<div class="text-sm font-semibold mb-1">${q[lang].q}</div>
<div class="text-xs mb-1" style="color:var(--success);">${t("correctAnswerLabel")}: ${q[lang].options[q[lang].correct]}</div>
<div class="text-xs" style="color:var(--ink-soft);">${q[lang].explain}</div>
</div>`).join("");
return `<div class="card p-5">
<div class="flex items-center gap-2 mb-1">
<div class="w-9 h-9 rounded-lg flex items-center justify-center" style="background:var(--accent-soft); color:var(--accent);">
<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2a7 7 0 0 0-4 12.7V17a1 1 0 0 0 1 1h6a1 1 0 0 0 1-1v-2.3A7 7 0 0 0 12 2z"/><path d="M9 21h6M10 18h4"/></svg>
</div>
<div class="font-bold">${label}</div>
</div>
<div class="text-xs mb-1" style="color:var(--ink-faint);">${t("missedQuestionsLabel")} (${qs.length})</div>
${items}
</div>`;
}).join("");
}

/* =====================================================================
11. ADMIN DASHBOARD
===================================================================== */
let adminTab = "history";
function setAdminTab(tabName){
// Called both when the admin explicitly clicks a tab AND whenever
// renderAdminWithHistory() re-applies the current tab after a live data
// refresh — only the former should drop any in-progress roster edit.
const isRealTabChange = tabName !== adminTab;
adminTab = tabName;
document.getElementById("tab-history-btn").classList.toggle("active", tabName==="history");
document.getElementById("tab-pending-btn").classList.toggle("active", tabName==="pending");
document.getElementById("tab-employees-btn").classList.toggle("active", tabName==="employees");
document.getElementById("adminTab-history").classList.toggle("hidden", tabName!=="history");
document.getElementById("adminTab-pending").classList.toggle("hidden", tabName!=="pending");
document.getElementById("adminTab-employees").classList.toggle("hidden", tabName!=="employees");
if(tabName==="employees"){
if(isRealTabChange) editingEmployeeId = null;
if(isRealTabChange || !editingEmployeeId) renderEmployeesTable();
}
}
function enterAdminScreen(){
renderEmployeesTable();
if(adminUnsub){ adminUnsub(); adminUnsub = null; }
if(studyActivityUnsub){ studyActivityUnsub(); studyActivityUnsub = null; }
if(dbNamespace){
try{
studyActivityUnsub = dbNamespace.collection(STUDY_ACTIVITY_DOC_PATH).limit(1000).onSnapshot(
snap => {
studyActivityReadDenied = false;
STUDY_ACTIVITY = {};
snap.docs.forEach(d=>{ STUDY_ACTIVITY[d.id] = (d.data() && d.data().categories) || {}; });
const active = document.querySelector(".screen.active");
if(active && active.id==="screen-admin" && !editingEmployeeId) renderEmployeesTable();
},
err => {
if(err.code!=="permission-denied"){
console.error("study activity subscription failed", err);
return;
}
studyActivityReadDenied = true;
STUDY_ACTIVITY = {};
document.getElementById("studyActivityNotice").classList.remove("hidden");
if(!editingEmployeeId) renderEmployeesTable();
}
);
}catch(e){ console.error(e); }
}
if(dbNamespace){
try{
adminUnsub = dbNamespace.collection("history").orderBy("timestamp","desc").limit(HISTORY_QUERY_LIMIT).onSnapshot(
snap => renderAdminWithHistory(snap.docs.map(d=>({ _docId:d.id, ...d.data() }))),
err => { console.error("admin live subscription failed, falling back to a one-off read", err); fetchAllHistory().then(renderAdminWithHistory); }
);
return;
}catch(e){ console.error(e); }
}
fetchAllHistory().then(renderAdminWithHistory);
}
function employeeStoreFor(h){
// History records save a store snapshot from when the test was taken; older
// records made before that existed fall back to the roster's current value.
return h.store!==undefined ? (h.store||"") : ((EMPLOYEES.find(e=>e.id===h.employeeId)||{}).store || "");
}
function parseHistoryScore(value){
if(typeof value==="string" && value.trim()!==""){
const text = value.trim().replace(/%$/, "").trim();
value = text ? Number(text) : NaN;
}
return Number.isFinite(value) && value>=0 && value<=100 ? value : null;
}
function renderAdminWithHistory(history){
latestHistoryCache = history;
refreshStoreFilterOptions();
const scopedEmployees = adminStoreFilter ? EMPLOYEES.filter(e=>(e.store||"")===adminStoreFilter) : EMPLOYEES;
const scopedEmployeeIds = new Set(scopedEmployees.map(e=>e.id));
const scopedHistory = adminStoreFilter ? history.filter(h=> scopedEmployeeIds.has(h.employeeId) || employeeStoreFor(h)===adminStoreFilter) : history;
const testedIds = new Set(scopedHistory.map(h=>h.employeeId));
const pendingEmployees = scopedEmployees.filter(e=>!testedIds.has(e.id));
document.getElementById("statTotal").textContent = scopedEmployees.length;
document.getElementById("statTested").textContent = testedIds.size;
document.getElementById("statPending").textContent = pendingEmployees.length;
const scores = scopedHistory.map(h=>parseHistoryScore(h.scorePercent)).filter(score=>score!==null);
document.getElementById("statAvg").textContent = scores.length ? Math.round(scores.reduce((sum,score)=>sum+score,0)/scores.length)+"%" : "—";

const histHeadCols = ["colEmployeeId","colName","colStore","colAttempt","colCategories","colDate","colScore","colWeakAreas"];
document.getElementById("historyTableHead").innerHTML = histHeadCols.map(k=>`<th>${t(k)}</th>`).join("");
const sorted = scopedHistory.slice().sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp));
document.getElementById("historyTableBody").innerHTML = sorted.map(h=>{
const catsTxt = h.categories.map(c=> CAT_MAP[c] ? CAT_MAP[c][lang] : c).join(", ");
const weakTxt = (h.weakTopics||[]).map(tp=> TOPIC_LABELS[tp] ? TOPIC_LABELS[tp][lang] : tp).join(", ") || "—";
const dateTxt = new Date(h.timestamp).toLocaleString(lang==="hi"?"hi-IN":"en-IN");
const score = parseHistoryScore(h.scorePercent);
const scoreText = score===null ? "—" : score+"%";
const scoreColor = score===null ? "var(--ink-faint)" : score>=70 ? "var(--success)" : "var(--danger)";
const storeTxt = employeeStoreFor(h) || "—";
return `<tr><td>${h.employeeId}</td><td>${h.name}</td><td>${storeTxt}</td><td>${h.attempt}</td><td>${catsTxt}</td><td>${dateTxt}</td><td style="color:${scoreColor}; font-weight:700;">${scoreText}</td><td>${weakTxt}</td></tr>`;
}).join("");
document.getElementById("historyEmptyMsg").classList.toggle("hidden", sorted.length>0);

document.getElementById("pendingTableHead").innerHTML = `<th>${t("colEmployeeId")}</th><th>${t("colName")}</th><th>${t("colStore")}</th>`;
document.getElementById("pendingTableBody").innerHTML = pendingEmployees.map(e=>{
const store = (e.store||"").trim();
return `<tr><td>${e.id}</td><td>${e.name}</td><td>${store || `<span style="color:var(--ink-faint)">${t("storeUnassigned")}</span>`}</td></tr>`;
}).join("");
document.getElementById("pendingStoreHint").classList.toggle("hidden", !pendingEmployees.some(e=>!(e.store||"").trim()));
document.getElementById("pendingEmptyMsg").classList.toggle("hidden", pendingEmployees.length>0);

setAdminTab(adminTab);
}

function csvEscape(val){
const s = String(val===undefined||val===null ? "" : val);
return '"' + s.replace(/"/g,'""') + '"';
}
function toCSV(headers, rows){
const lines = [headers.map(csvEscape).join(",")];
rows.forEach(r=> lines.push(r.map(csvEscape).join(",")));
return "﻿" + lines.join("\r\n");
}
async function saveFile(filename, csvText){
try{
if(window.claude && typeof window.claude.use === "function"){
const downloads = await window.claude.use("downloads");
if(downloads){
try{
await downloads.save({filename, data: csvText});
toast(t("toastDownloaded"));
return;
}catch(err){
if(err && err.code==="declined") return;
toast(t("toastDownloadFailed"));
return;
}
}
}
}catch(e){ /* fall through to blob fallback */ }
try{
const blob = new Blob([csvText], {type:"text/csv;charset=utf-8;"});
const url = URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url; a.download = filename;
document.body.appendChild(a); a.click(); document.body.removeChild(a);
URL.revokeObjectURL(url);
}catch(e){
toast(t("toastDownloadUnavailable"));
}
}
function exportHistoryCSV(){
const scopedEmployeeIds = new Set((adminStoreFilter ? EMPLOYEES.filter(e=>(e.store||"")===adminStoreFilter) : EMPLOYEES).map(e=>e.id));
const history = latestHistoryCache
.filter(h=> !adminStoreFilter || scopedEmployeeIds.has(h.employeeId) || employeeStoreFor(h)===adminStoreFilter)
.slice().sort((a,b)=> new Date(b.timestamp) - new Date(a.timestamp));
const headers = ["Employee ID","Name","Store","Attempt #","Categories","Date / Time","Score %","Correct","Total","Weak Categories","Weak Topics"];
const rows = history.map(h=>[
h.employeeId, h.name, employeeStoreFor(h), h.attempt,
h.categories.map(c=>CAT_MAP[c]?CAT_MAP[c].en:c).join(" | "),
new Date(h.timestamp).toLocaleString("en-IN"),
h.scorePercent, h.correctCount, h.total,
(h.weakCategories||[]).map(c=>CAT_MAP[c]?CAT_MAP[c].en:c).join(" | "),
(h.weakTopics||[]).map(tp=>TOPIC_LABELS[tp]?TOPIC_LABELS[tp].en:tp).join(" | "),
]);
saveFile(adminStoreFilter ? `test_performance_report_${adminStoreFilter}.csv` : "test_performance_report.csv", toCSV(headers, rows));
}
function exportPendingCSV(){
const testedIds = new Set(latestHistoryCache.map(h=>h.employeeId));
const scoped = adminStoreFilter ? EMPLOYEES.filter(e=>(e.store||"")===adminStoreFilter) : EMPLOYEES;
const pending = scoped.filter(e=>!testedIds.has(e.id));
const headers = ["Employee ID","Name","Store"];
const rows = pending.map(e=>[e.id, e.name, e.store||""]);
saveFile(adminStoreFilter ? `pending_compliance_report_${adminStoreFilter}.csv` : "pending_compliance_report.csv", toCSV(headers, rows));
}

/* =====================================================================
12. INIT
This app never stores test data on-device: it requires a live
connection to your Firebase project (Firestore) before showing the
login screen at all. If that connection can't be established, the app
blocks on a dedicated "server unavailable" screen (with a retry
button) rather than silently falling back to local storage.
===================================================================== */
applyLanguage();
let connectInFlight = false;
async function connectToServer(){
if(connectInFlight) return;
connectInFlight = true;
studyActivityReadDenied = false;
studyActivityWriteDenied = false;
showScreen("connecting");
dbNamespace = null;
try{
if(window.firebase && typeof firebase.initializeApp === "function"){
if(!firebase.apps.length) firebase.initializeApp(FIREBASE_CONFIG);
dbNamespace = firebase.firestore();
}
}catch(e){ console.error("could not initialize Firebase", e); dbNamespace = null; }
if(dbNamespace){
try{
EMPLOYEES = await ensureEmployeeRoster();
subscribeEmployeeRoster();
if(adminPage) adminPassword = await ensureAdminConfig();
}catch(e){
console.error("could not load team roster or admin config from server", e);
dbNamespace = null; // treat a load failure the same as no server — never fall back locally
}
}
connectInFlight = false;
if(dbNamespace){
updateStorageNote();
showScreen("login");
}else{
showScreen("server-error");
}
}
connectToServer();
