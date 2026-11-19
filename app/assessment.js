import { FIREBASE_CONFIG, SETTINGS } from './firebase-config';
import { BANK, POSTS, postName, buildTest, scoreTest, inr } from './question-bank';

export function mountAssessment(appRoot, modalRoot, { admin: adminRoute = false } = {}) {
  const events = new AbortController();
  const listen = (target, type, handler) => {
    target.addEventListener(type, handler, { signal: events.signal });
  };

  /* ===== Small helpers ===== */
  const $ = (s, r) => (r || document).querySelector(s);
  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  const LS = {
    get(k, d) { try { const v = JSON.parse(localStorage.getItem(k)); return v == null ? d : v; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, JSON.stringify(v)); return true; } catch (e) { return false; } },
    del(k) { try { localStorage.removeItem(k); } catch (e) {} }
  };
  const DAY = 86400000, DUR = SETTINGS.durationMin * 60;
  const LIVE = /^AIza/.test(FIREBASE_CONFIG.apiKey || '');
  const CDN = 'https://www.gstatic.com/firebasejs/10.12.2/';
  const CHUNK = 700000, PAGE = 300;
  const attId = (m, p) => m + '_' + p;
  const newId = () => { const c = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789'; let s = ''; for (const b of crypto.getRandomValues(new Uint8Array(20))) s += c[b % c.length]; return s; };
  const fmtD = ms => ms ? new Date(ms).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }) : '';
  const fmtDT = ms => ms ? new Date(ms).toLocaleString('en-IN', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '';
  const mmss = s => s == null ? '' : Math.floor(s / 60) + ':' + String(Math.floor(s % 60)).padStart(2, '0');
  const ms = v => v && v.toMillis ? v.toMillis() : (typeof v === 'number' ? v : null);
  const fileB64 = f => new Promise((ok, no) => { const r = new FileReader(); r.onload = () => ok(String(r.result).split(',')[1] || ''); r.onerror = () => no(new Error('read')); r.readAsDataURL(f); });
  const b64Blob = (b64, type) => { const bin = atob(b64), u = new Uint8Array(bin.length); for (let i = 0; i < bin.length; i++) u[i] = bin.charCodeAt(i); return new Blob([u], { type: type || 'application/octet-stream' }); };

  /* ===== Database layer: Firebase when configured, this device's storage in demo mode ===== */
  let FB = null;
  async function fb() {
    if (FB) return FB;
    const [A, F] = await Promise.all([import(/* webpackIgnore: true */ CDN + 'firebase-app.js'), import(/* webpackIgnore: true */ CDN + 'firebase-firestore-lite.js')]);
    const app = A.initializeApp(FIREBASE_CONFIG);
    FB = { app, F, db: F.getFirestore(app) };
    return FB;
  }
  async function fbAuth() {
    const b = await fb();
    if (!b.A) { b.A = await import(/* webpackIgnore: true */ CDN + 'firebase-auth.js'); b.auth = b.A.getAuth(b.app); }
    await b.auth.authStateReady();
    return b;
  }
  const normCand = (id, d) => Object.assign({}, d, { id, createdAt: ms(d.createdAt), submittedAt: ms(d.submittedAt) });

  const DB = {
    async getAttempt(m, p) {
      if (!LIVE) { const a = LS.get('lx_att', {})[attId(m, p)]; return a ? { at: a } : null; }
      const { F, db } = await fb();
      const s = await F.getDoc(F.doc(db, 'attempts', attId(m, p)));
      return s.exists() ? { at: ms(s.data().at) || Date.now() } : null;
    },
    /* Saves CV, profile and the attempt marker. `done` remembers finished steps so a retry never repeats one. */
    async start(c, file, done) {
      let cv = done.cv || null;
      if (!LIVE) {
        if (file && !done.cv) { const b64 = await fileB64(file); cv = done.cv = { name: file.name, type: file.type, size: file.size, chunks: 1 }; if (!LS.set('lx_cv_' + c.id, b64)) cv = done.cv = null; }
        const all = LS.get('lx_cands', {}); all[c.id] = Object.assign({}, c, { cv, status: 'started', createdAt: Date.now() }); LS.set('lx_cands', all);
        const att = LS.get('lx_att', {}); att[attId(c.mobile, c.post)] = Date.now(); LS.set('lx_att', att);
        return;
      }
      const { F, db } = await fb();
      if (file && !done.cv) {
        const b64 = await fileB64(file), n = Math.ceil(b64.length / CHUNK);
        for (let i = done.cvPart || 0; i < n; i++) { await F.setDoc(F.doc(db, 'cvChunks', c.id + '_' + i), { cand: c.id, i, d: b64.slice(i * CHUNK, (i + 1) * CHUNK) }); done.cvPart = i + 1; }
        cv = done.cv = { name: file.name, type: file.type || '', size: file.size, chunks: n };
      }
      if (!done.cand) { await F.setDoc(F.doc(db, 'candidates', c.id), Object.assign({}, c, { cv, status: 'started', createdAt: F.serverTimestamp() })); done.cand = true; }
      if (!done.att) { await F.setDoc(F.doc(db, 'attempts', attId(c.mobile, c.post)), { mobile: c.mobile, post: c.post, cand: c.id, at: F.serverTimestamp() }); done.att = true; }
    },
    async submit(id, res) {
      if (!LIVE) { const all = LS.get('lx_cands', {}); if (all[id]) { Object.assign(all[id], res, { status: 'submitted', submittedAt: Date.now() }); LS.set('lx_cands', all); } return; }
      const { F, db } = await fb();
      await F.updateDoc(F.doc(db, 'candidates', id), Object.assign({}, res, { status: 'submitted', submittedAt: F.serverTimestamp() }));
    },
    async questions(post) {
      if (!LIVE) return (LS.get('lx_q', []) || []).filter(q => q.scope === 'all' || q.scope === post);
      const { F, db } = await fb();
      const s = await F.getDocs(F.query(F.collection(db, 'questions'), F.where('scope', 'in', ['all', post])));
      return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
    },
    /* ----- admin ----- */
    async adminReady() {
      if (!LIVE) return sessionStorage.getItem('lx_admin') === '1';
      const b = await fbAuth(); return !!b.auth.currentUser;
    },
    async adminLogin(email, pw) {
      if (!LIVE) { if (pw !== SETTINGS.demoAdminPassword) throw new Error('Wrong password.'); sessionStorage.setItem('lx_admin', '1'); return; }
      const b = await fbAuth();
      let cred;
      try { cred = await b.A.signInWithEmailAndPassword(b.auth, email, pw); } catch (e) { throw new Error('Wrong email or password.'); }
      const s = await b.F.getDoc(b.F.doc(b.db, 'admins', cred.user.uid));
      if (!s.exists()) { await b.A.signOut(b.auth); throw new Error('This login works, but it is not registered as an admin yet. See Setup Guide, Part 3.'); }
    },
    async adminLogout() { if (!LIVE) { sessionStorage.removeItem('lx_admin'); return; } const b = await fbAuth(); await b.A.signOut(b.auth); },
    async candidates(cursor) {
      if (!LIVE) return { rows: Object.entries(LS.get('lx_cands', {})).map(([id, d]) => normCand(id, d)).sort((a, b) => b.createdAt - a.createdAt), cursor: null };
      const { F, db } = await fbAuth();
      const parts = [F.collection(db, 'candidates'), F.orderBy('createdAt', 'desc')];
      if (cursor) parts.push(F.startAfter(cursor));
      parts.push(F.limit(PAGE));
      const s = await F.getDocs(F.query.apply(null, parts));
      return { rows: s.docs.map(d => normCand(d.id, d.data())), cursor: s.docs.length === PAGE ? s.docs[s.docs.length - 1] : null };
    },
    async resetAttempt(m, p) {
      if (!LIVE) { const a = LS.get('lx_att', {}); delete a[attId(m, p)]; LS.set('lx_att', a); return; }
      const { F, db } = await fbAuth(); await F.deleteDoc(F.doc(db, 'attempts', attId(m, p)));
    },
    async deleteCandidate(c) {
      if (!LIVE) { const all = LS.get('lx_cands', {}); delete all[c.id]; LS.set('lx_cands', all); LS.del('lx_cv_' + c.id); return; }
      const { F, db } = await fbAuth();
      for (let i = 0; i < ((c.cv && c.cv.chunks) || 0); i++) await F.deleteDoc(F.doc(db, 'cvChunks', c.id + '_' + i));
      await F.deleteDoc(F.doc(db, 'candidates', c.id));
    },
    async cv(c) {
      if (!LIVE) return b64Blob(LS.get('lx_cv_' + c.id, ''), c.cv.type);
      const { F, db } = await fbAuth(); let b64 = '';
      for (let i = 0; i < c.cv.chunks; i++) { const s = await F.getDoc(F.doc(db, 'cvChunks', c.id + '_' + i)); if (!s.exists()) throw new Error('CV file is incomplete.'); b64 += s.data().d; }
      return b64Blob(b64, c.cv.type);
    },
    async allQuestions() {
      if (!LIVE) return LS.get('lx_q', []) || [];
      const { F, db } = await fbAuth();
      const s = await F.getDocs(F.collection(db, 'questions'));
      return s.docs.map(d => Object.assign({ id: d.id }, d.data()));
    },
    async saveQuestions(list) {
      const clean = list.map(q => ({ id: q.id || newId(), cat: q.cat, post: q.cat === 'role' ? q.post : null, scope: q.cat === 'role' ? q.post : 'all', fr: q.cat === 'role' && !!q.fr, en: { q: q.en.q, o: q.en.o.slice(0, 4) }, hi: { q: q.hi.q, o: q.hi.o.slice(0, 4) }, a: Number(q.a) || 0 }));
      if (!LIVE) { const cur = LS.get('lx_q', []) || []; for (const q of clean) { const i = cur.findIndex(x => x.id === q.id); if (i >= 0) cur[i] = q; else cur.push(q); } LS.set('lx_q', cur); return; }
      const { F, db } = await fbAuth();
      for (let i = 0; i < clean.length; i += 400) {
        const batch = F.writeBatch(db);
        for (const q of clean.slice(i, i + 400)) { const d = Object.assign({}, q); delete d.id; batch.set(F.doc(db, 'questions', q.id), d); }
        await batch.commit();
      }
    },
    async deleteQuestion(id) {
      if (!LIVE) { LS.set('lx_q', (LS.get('lx_q', []) || []).filter(q => q.id !== id)); return; }
      const { F, db } = await fbAuth(); await F.deleteDoc(F.doc(db, 'questions', id));
    }
  };

  /* ===== Text (English / Hindi) ===== */
  const T = {
    sub: { en: 'Recruitment Assessment', hi: 'भर्ती मूल्यांकन' },
    langBtn: { en: 'हिंदी', hi: 'English' },
    demo: { en: 'DEMO MODE: nothing is saved online yet. Data stays on this device only.', hi: 'डेमो मोड: अभी कुछ भी ऑनलाइन सेव नहीं हो रहा। डेटा सिर्फ इसी डिवाइस पर है।' },
    applicationDetails: { en: 'Application details', hi: 'आवेदन का विवरण' },
    aTitle: { en: 'Apply for a job at Lotus Electronics', hi: 'Lotus Electronics में नौकरी के लिए आवेदन' },
    aSub: { en: 'Enter your mobile number and choose the post. It takes about 25 minutes in total.', hi: 'अपना मोबाइल नंबर डालें और पोस्ट चुनें। कुल लगभग 25 मिनट लगेंगे।' },
    mobile: { en: 'Mobile number', hi: 'मोबाइल नंबर' },
    mobileH: { en: '10 digits, without +91', hi: '10 अंक, +91 के बिना' },
    post: { en: 'Post you are applying for', hi: 'जिस पोस्ट के लिए आवेदन कर रहे हैं' },
    choose: { en: 'Select a post', hi: 'पोस्ट चुनें' },
    check: { en: 'Continue', hi: 'आगे बढ़ें' },
    eMobile: { en: 'Please enter a valid 10-digit mobile number.', hi: 'कृपया सही 10 अंकों का मोबाइल नंबर डालें।' },
    ePost: { en: 'Please select a post.', hi: 'कृपया पोस्ट चुनें।' },
    exp: { en: 'Do you have work experience in the same field as this post?', hi: 'क्या आपको इसी पोस्ट जैसे काम (same field) का अनुभव है?' },
    same: { en: 'Yes, I have done this kind of work', hi: 'हां, मैंने इसी तरह का काम किया है' },
    other: { en: 'No, my experience is in a different field', hi: 'नहीं, मेरा अनुभव किसी दूसरे फील्ड का है' },
    fresher: { en: 'No, I am a fresher (no job yet)', hi: 'नहीं, मैं फ्रेशर हूं (अभी तक नौकरी नहीं की)' },
    x_same: { en: 'Same-field experience', hi: 'इसी फील्ड का अनुभव' }, x_other: { en: 'Other-field experience', hi: 'दूसरे फील्ड का अनुभव' }, x_fresher: { en: 'Fresher', hi: 'फ्रेशर' },
    eExp: { en: 'Please answer the work experience question.', hi: 'कृपया कार्य अनुभव वाले प्रश्न का उत्तर दें।' },
    eFresherPost: { en: 'This post needs work experience. Please choose another post.', hi: 'इस पोस्ट के लिए कार्य अनुभव ज़रूरी है। कृपया कोई दूसरी पोस्ट चुनें।' },
    qualification: { en: 'Highest qualification', hi: 'सबसे ऊंची शैक्षणिक योग्यता' },
    qualificationH: { en: 'For example: 12th pass, B.Com, BBA, ITI', hi: 'जैसे: 12वीं पास, B.Com, BBA, ITI' },
    passYear: { en: 'Year of passing', hi: 'पास होने का वर्ष' },
    otherExp: { en: 'Any part-time work, internship or family business experience (optional)', hi: 'कोई पार्ट-टाइम काम, इंटर्नशिप या पारिवारिक व्यवसाय का अनुभव (वैकल्पिक)' },
    eNet: { en: 'Could not connect. Please check your internet and try again.', hi: 'कनेक्ट नहीं हो पाया। कृपया इंटरनेट जांचें और दोबारा कोशिश करें।' },
    blocked: { en: 'You already completed the assessment for {post} on {d1}. Eligible again on {d2}. You may select a different post to apply right now.', hi: 'आप {post} का असेसमेंट {d1} को दे चुके हैं। आप {d2} को दोबारा दे सकते हैं। आप अभी कोई दूसरी पोस्ट चुनकर आवेदन कर सकते हैं।' },
    bTitle: { en: 'Your details', hi: 'आपकी जानकारी' },
    bSub: { en: 'All fields are required unless marked optional.', hi: 'जब तक "वैकल्पिक" न लिखा हो, सभी जानकारी भरना ज़रूरी है।' },
    name: { en: 'Full name', hi: 'पूरा नाम' },
    lastCompany: { en: 'Last place worked', hi: 'पिछली नौकरी कहां की' },
    lastDesignation: { en: 'Last designation', hi: 'पिछला पद' },
    lastSalary: { en: 'Last salary drawn / CTC (₹ per month)', hi: 'पिछली सैलरी / CTC (₹ प्रति माह)' },
    incentiveInCtc: { en: 'Was incentive part of your CTC?', hi: 'क्या इंसेंटिव आपके CTC का हिस्सा था?' },
    avgIncentive: { en: 'Average monthly incentive earned (₹)', hi: 'औसत मासिक इंसेंटिव (₹)' },
    joinDate: { en: 'Earliest joining date', hi: 'सबसे जल्दी जॉइन करने की तारीख' },
    pf: { en: 'Were you covered under Provident Fund (PF)?', hi: 'क्या आप प्रोविडेंट फंड (PF) में कवर थे?' },
    pfNumber: { en: 'PF number / UAN', hi: 'PF नंबर / UAN' },
    dependents: { en: 'Number of family dependents', hi: 'परिवार में आश्रित सदस्यों की संख्या' },
    whyJoin: { en: 'Why do you want to join Lotus Electronics?', hi: 'आप Lotus Electronics क्यों जॉइन करना चाहते हैं?' },
    whyLeave: { en: 'Reason for leaving your last job', hi: 'पिछली नौकरी छोड़ने का कारण' },
    cv: { en: 'Attach CV / Resume (required)', hi: 'CV / रिज़्यूमे लगाएं (अनिवार्य)' },
    cvH: { en: 'PDF, DOC or DOCX, up to {n} MB', hi: 'PDF, DOC या DOCX, अधिकतम {n} MB' },
    yes: { en: 'Yes', hi: 'हां' }, no: { en: 'No', hi: 'नहीं' },
    back: { en: 'Back', hi: 'पीछे' }, next: { en: 'Next', hi: 'आगे' }, prev: { en: 'Previous', hi: 'पिछला' },
    eReq: { en: 'Please fill in: {f}', hi: 'कृपया भरें: {f}' },
    eCvRequired: { en: 'Please attach your CV or resume.', hi: 'कृपया अपना CV / रिज़्यूमे लगाएं।' },
    eCvType: { en: 'CV must be a PDF, DOC or DOCX file.', hi: 'CV सिर्फ PDF, DOC या DOCX फाइल होनी चाहिए।' },
    eCvSize: { en: 'CV file is too large. Maximum {n} MB.', hi: 'CV फाइल बहुत बड़ी है। अधिकतम {n} MB।' },
    cTitle: { en: 'Before you start', hi: 'शुरू करने से पहले' },
    r1: { en: '25 multiple-choice questions. You have {n} minutes.', hi: '25 बहुविकल्पीय प्रश्न। आपके पास {n} मिनट हैं।' },
    r2: { en: 'You can switch any question between English and Hindi.', hi: 'आप किसी भी प्रश्न को अंग्रेज़ी और हिंदी के बीच बदल सकते हैं।' },
    r3: { en: 'Do not leave this screen. Do not open another app, tab or call. The first time you leave, you get a warning. The second time, your test is submitted automatically.', hi: 'इस स्क्रीन को न छोड़ें। कोई दूसरा ऐप, टैब या कॉल न खोलें। पहली बार स्क्रीन छोड़ने पर चेतावनी मिलेगी। दूसरी बार आपका टेस्ट अपने आप सबमिट हो जाएगा।' },
    r4: { en: 'Once started, the test cannot be restarted for {n} days.', hi: 'एक बार शुरू होने के बाद टेस्ट {n} दिन तक दोबारा नहीं दिया जा सकता।' },
    r5: { en: 'Keep a pen and paper ready for calculations.', hi: 'हिसाब के लिए पेन और कागज़ पास रखें।' },
    start: { en: 'Start the test', hi: 'टेस्ट शुरू करें' },
    saving: { en: 'Saving your details…', hi: 'आपकी जानकारी सेव हो रही है…' },
    qOf: { en: 'Question {a} of {b}', hi: 'प्रश्न {a} / {b}' },
    answered: { en: '{a}/{b} answered', hi: '{a}/{b} उत्तर दिए' },
    submit: { en: 'Submit test', hi: 'टेस्ट सबमिट करें' },
    cfTitle: { en: 'Submit your test?', hi: 'टेस्ट सबमिट करें?' },
    cfLeft: { en: '{n} question(s) are still unanswered.', hi: '{n} प्रश्न अभी बाकी हैं।' },
    cfAll: { en: 'You have answered all questions.', hi: 'आपने सभी प्रश्नों के उत्तर दे दिए हैं।' },
    cfNo: { en: 'Go back', hi: 'वापस जाएं' }, cfYes: { en: 'Yes, submit', hi: 'हां, सबमिट करें' },
    wTitle: { en: 'Warning', hi: 'चेतावनी' },
    wText: { en: 'You left the test screen. This has been recorded. If you leave the screen again, your test will be submitted immediately with the answers given so far.', hi: 'आपने टेस्ट की स्क्रीन छोड़ी थी। यह रिकॉर्ड कर लिया गया है। अगर आप दोबारा स्क्रीन छोड़ेंगे, तो आपका टेस्ट अब तक दिए गए उत्तरों के साथ तुरंत सबमिट हो जाएगा।' },
    wOk: { en: 'I understand', hi: 'मैं समझ गया/गई' },
    subm: { en: 'Submitting your test…', hi: 'आपका टेस्ट सबमिट हो रहा है…' },
    failT: { en: 'Not submitted yet', hi: 'अभी सबमिट नहीं हुआ' },
    failP: { en: 'Your answers are safe on this phone, but could not be sent. Check your internet and press Retry. Do not close this page.', hi: 'आपके उत्तर इस फोन में सुरक्षित हैं, लेकिन भेजे नहीं जा सके। इंटरनेट जांचें और "दोबारा कोशिश करें" दबाएं। यह पेज बंद न करें।' },
    retry: { en: 'Retry', hi: 'दोबारा कोशिश करें' },
    doneT: { en: 'Thank you. Your test is submitted.', hi: 'धन्यवाद। आपका टेस्ट सबमिट हो गया है।' },
    doneP: { en: 'Our HR team will review your application and contact you on your mobile number.', hi: 'हमारी HR टीम आपके आवेदन की समीक्षा करेगी और आपके मोबाइल नंबर पर संपर्क करेगी।' },
    doneAuto: { en: 'Your test was submitted automatically because you left the test screen twice.', hi: 'आपने दो बार टेस्ट की स्क्रीन छोड़ी, इसलिए आपका टेस्ट अपने आप सबमिट हो गया।' },
    doneTime: { en: 'Time was over, so your test was submitted automatically.', hi: 'समय समाप्त हो गया, इसलिए आपका टेस्ट अपने आप सबमिट हो गया।' },
    score: { en: 'Your score: {a} out of {b}', hi: 'आपका स्कोर: {b} में से {a}' },
    cat_self: { en: 'Work attitude', hi: 'कार्य व्यवहार' }, cat_lotus: { en: 'Retail basics', hi: 'रिटेल की जानकारी' }, cat_math: { en: 'Calculation', hi: 'गणना' }, cat_role: { en: 'Job knowledge', hi: 'काम की जानकारी' }, cat_apt: { en: 'Aptitude', hi: 'योग्यता' }
  };
  const t = (k, v) => { let s = (T[k] || {})[S.lang] || k; if (v) for (const x in v) s = s.replace('{' + x + '}', v[x]); return s; };

  /* ===== State ===== */
  const S = { view: 'check', lang: LS.get('lx_lang', 'en'), mobile: '', post: '', exp: '', block: null, err: '', busy: false, form: {}, file: null, done: null, startDone: {} };
  let sess = null, timer = null;
  const A = { tab: 'cands', rows: [], cursor: null, loaded: false, f: { q: '', post: '', exp: '', from: '', to: '', min: '0', group: false }, qs: null, qf: '', err: '' };
  const saveSess = () => LS.set('lx_sess', sess);

  /* ===== Rendering ===== */
  function render() {
    const admin = S.view === 'admin' || S.view === 'adminLogin';
    const application = S.view === 'check' || S.view === 'profile';
    let body = '';
    if (S.view === 'check') body = vCheck();
    else if (S.view === 'profile') body = vProfile();
    else if (S.view === 'ready') body = vReady();
    else if (S.view === 'test') body = vTest();
    else if (S.view === 'submitting') body = `<div class="card"><h2>${t('subm')}</h2><p class="mut">${t('failP').split('.')[0]}.</p></div>`;
    else if (S.view === 'submitFail') body = `<div class="card"><h2>${t('failT')}</h2><div class="msg warn">${t('failP')}</div><button class="btn" data-act="retrySubmit">${t('retry')}</button></div>`;
    else if (S.view === 'done') body = vDone();
    else if (S.view === 'adminLogin') body = vAdminLogin();
    else if (S.view === 'admin') body = vAdmin();
    appRoot.innerHTML =
      `<header class="site-header"><div class="header-inner">
        <img class="brand-logo" src="/lotus-logo.png" alt="Lotus Electronics" width="160" height="48">
        <span class="header-title">${admin ? 'Recruitment Admin' : t('sub')}</span>
        ${admin ? '' : `<button class="lang" data-act="lang">${t('langBtn')}</button>`}
      </div></header>` +
      (LIVE ? '' : `<div class="demo">${admin ? T.demo.en : t('demo')}</div>`) +
      `<main class="${S.view === 'admin' ? 'wide admin-dashboard' : S.view === 'adminLogin' ? 'admin-signin' : ''} ${S.view === 'test' ? 'notest' : ''} ${application ? 'assessment-home' : ''} ${S.view === 'profile' ? 'assessment-profile' : ''}">
        ${application ? `<section class="assessment-intro"><h1>${t('aTitle')}</h1><p>${t('aSub')}</p></section>` : ''}
        ${body}</main>` +
      (S.view === 'check' ? `<footer class="site-footer"><div class="footer-inner"><span>Lotus Electronics</span></div></footer>` : '');
    document.documentElement.lang = S.lang;
    if (S.view === 'test') tick();
  }
  const requiredMark = ' <span class="required-mark" aria-hidden="true">*</span>';
  const steps = n => `<div class="steps">${[1, 2, 3].map(i => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</div>`;
  const errBox = () => S.err ? `<div class="msg bad" role="alert">${esc(S.err)}</div>` : '';
  const btn = (label, busy, cls) => `<button class="btn ${cls || ''}" ${busy ? 'disabled' : ''}>${busy ? '<span class="spin"></span>' : ''}${label}</button>`;

  function vCheck() {
    const b = S.block;
    return `<form class="card assessment-entry" data-form="check" aria-labelledby="application-details" novalidate>
      ${steps(1)}
      <h2 id="application-details">${t('applicationDetails')}</h2>
      ${b ? `<div class="msg warn" role="alert">${esc(t('blocked', { post: postName(b.post, S.lang), d1: fmtD(b.at), d2: fmtD(b.at + SETTINGS.cooldownDays * DAY) }))}</div>` : ''}${errBox()}
      <label class="f">${t('mobile')}${requiredMark}<small>${t('mobileH')}</small><input type="tel" name="mobile" required inputmode="numeric" maxlength="10" autocomplete="tel-national" value="${esc(S.mobile)}"></label>
      <label class="f">${t('post')}${requiredMark}<select name="post" required><option value="">${t('choose')}</option>${POSTS.map(p => `<option value="${p.id}" ${S.post === p.id ? 'selected' : ''}>${esc(p[S.lang])}</option>`).join('')}</select></label>
      <fieldset class="experience-field"><legend>${t('exp')}${requiredMark}</legend><div class="radios">${['same', 'other', 'fresher'].map(x => `<label><input type="radio" name="exp" required value="${x}" ${S.exp === x ? 'checked' : ''}>${t(x)}</label>`).join('')}</div></fieldset>
      ${btn(t('check'), S.busy)}
    </form>`;
  }

  const FIELDS = ['name', 'lastCompany', 'lastDesignation', 'lastSalary', 'incentiveInCtc', 'avgIncentive', 'joinDate', 'pf', 'pfNumber', 'dependents', 'whyJoin', 'whyLeave'];
  function vProfile() {
    const f = S.form, v = k => esc(f[k] || ''), fr = S.exp === 'fresher';
    const txt = (k, type, extra) => `<label class="f">${t(k)}${requiredMark}<input type="${type || 'text'}" name="${k}" required value="${v(k)}" ${extra || ''}></label>`;
    const yn = k => `<div class="f" style="margin-bottom:14px;font-weight:600;font-size:14.5px">${t(k)}${requiredMark}<div class="radios" role="radiogroup">${['yes', 'no'].map(x => `<label><input type="radio" name="${k}" required value="${x}" ${f[k] === x ? 'checked' : ''}>${t(x)}</label>`).join('')}</div></div>`;
    return `<form class="card assessment-entry" data-form="profile" aria-labelledby="profile-details" novalidate>
      ${steps(2)}
      <h2 id="profile-details">${t('bTitle')}</h2><p class="mut">${esc(postName(S.post, S.lang))} · ${t('x_' + S.exp)} · ${esc(S.mobile)}<br>${t('bSub')}</p>${errBox()}
      ${txt('name', 'text', 'autocomplete="name" maxlength="80"')}
      ${fr ? `<label class="f">${t('qualification')}${requiredMark}<small>${t('qualificationH')}</small><input type="text" name="qualification" required value="${v('qualification')}" maxlength="80"></label>
      ${txt('passYear', 'number', 'inputmode="numeric" min="1980" max="2100"')}
      <label class="f">${t('otherExp')}<textarea name="otherExp" maxlength="600">${v('otherExp')}</textarea></label>` : `
      ${txt('lastCompany', 'text', 'maxlength="100"')}
      ${txt('lastDesignation', 'text', 'maxlength="80"')}
      ${txt('lastSalary', 'number', 'inputmode="numeric" min="0"')}
      ${yn('incentiveInCtc')}
      ${f.incentiveInCtc === 'no' ? txt('avgIncentive', 'number', 'inputmode="numeric" min="0"') : ''}`}
      ${txt('joinDate', 'date', `min="${new Date().toISOString().slice(0, 10)}"`)}
      ${fr ? '' : yn('pf') + (f.pf === 'yes' ? txt('pfNumber', 'text', 'maxlength="30"') : '')}
      ${txt('dependents', 'number', 'inputmode="numeric" min="0" max="20"')}
      <label class="f">${t('whyJoin')}${requiredMark}<textarea name="whyJoin" required maxlength="600">${v('whyJoin')}</textarea></label>
      ${fr ? '' : `<label class="f">${t('whyLeave')}${requiredMark}<textarea name="whyLeave" required maxlength="600">${v('whyLeave')}</textarea></label>`}
      <label class="f">${t('cv')}${requiredMark}<small>${t('cvH', { n: SETTINGS.maxCvMB })}${S.file ? ' · <b>' + esc(S.file.name) + '</b>' : ''}</small><input type="file" name="cv" required accept=".pdf,.doc,.docx,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document" style="margin-top:6px;width:100%"></label>
      <div class="row"><button type="button" class="btn sec" data-act="toCheck">${t('back')}</button>${btn(t('next'))}</div>
    </form>`;
  }

  function vReady() {
    return `${steps(3)}<div class="card"><h1>${t('cTitle')}</h1><p class="mut">${esc(S.form.name)} · ${esc(postName(S.post, S.lang))}</p>${errBox()}
      <ul class="rules"><li>${t('r1', { n: SETTINGS.durationMin })}</li><li>${t('r2')}</li><li><b>${t('r3')}</b></li><li>${t('r4', { n: SETTINGS.cooldownDays })}</li><li>${t('r5')}</li></ul>
      ${S.busy ? `<p class="mut">${t('saving')}</p>` : ''}
      <div class="row"><button class="btn sec" data-act="toProfile" ${S.busy ? 'disabled' : ''}>${t('back')}</button><button class="btn" data-act="startTest" ${S.busy ? 'disabled' : ''}>${S.busy ? '<span class="spin"></span>' : ''}${t('start')}</button></div></div>`;
  }

  function vTest() {
    const i = sess.cur, q = sess.q[i], x = q[S.lang] || q.en, n = sess.q.length, done = sess.ans.filter(a => a != null).length;
    return `<div class="tbar"><span class="tm" id="tm" aria-live="off"></span><span class="sp"></span><span class="cnt">${t('answered', { a: done, b: n })}</span></div>
    <div class="prog"><i id="tbar"></i></div>
    <div class="card"><div class="qh"><span>${t('qOf', { a: i + 1, b: n })}</span><span class="tag">${t('cat_' + q.cat)}</span><span class="sp"></span>
      <span class="lt"><button data-act="setLang" data-l="en" class="${S.lang === 'en' ? 'on' : ''}">EN</button><button data-act="setLang" data-l="hi" class="${S.lang === 'hi' ? 'on' : ''}">हिंदी</button></span></div>
      <p class="qt">${esc(x.q)}</p>
      ${x.o.map((o, k) => `<button class="opt ${sess.ans[i] === k ? 'on' : ''}" data-act="ans" data-k="${k}" aria-pressed="${sess.ans[i] === k}"><b>${'ABCD'[k]}</b><span>${esc(o)}</span></button>`).join('')}
    </div>
    <div class="row" style="margin-bottom:14px"><button class="btn sec" data-act="go" data-i="${i - 1}" ${i === 0 ? 'disabled' : ''}>${t('prev')}</button>
      ${i < n - 1 ? `<button class="btn dark" data-act="go" data-i="${i + 1}">${t('next')}</button>` : `<button class="btn" data-act="askSubmit">${t('submit')}</button>`}</div>
    <div class="card"><div class="pal">${sess.q.map((_, k) => `<button data-act="go" data-i="${k}" class="${sess.ans[k] != null ? 'd' : ''} ${k === i ? 'c' : ''}" aria-label="${k + 1}">${k + 1}</button>`).join('')}</div>
      ${i < n - 1 ? `<button class="btn sec" style="margin-top:14px" data-act="askSubmit">${t('submit')}</button>` : ''}</div>`;
  }

  function vDone() {
    const r = S.done || {};
    return `<div class="card"><h1>${t('doneT')}</h1>
      ${r.submitReason === 'tab-switch' ? `<div class="msg warn">${t('doneAuto')}</div>` : r.submitReason === 'timeout' ? `<div class="msg info">${t('doneTime')}</div>` : ''}
      ${SETTINGS.showScoreToCandidate && r.total ? `<div class="msg ok"><b>${t('score', { a: r.score, b: r.total })}</b></div>` : ''}
      <p>${t('doneP')}</p></div>`;
  }

  /* ===== Modal ===== */
  function modal(html, wide) { const m = modalRoot; m.innerHTML = `<div class="box ${wide ? 'wide' : ''}" role="dialog" aria-modal="true">${html}</div>`; m.classList.add('on'); const b = $('button', m); if (b) b.focus(); }
  function closeModal() { const m = modalRoot; m.classList.remove('on'); m.innerHTML = ''; }

  /* ===== Candidate flow ===== */
  async function doCheck(form) {
    const mobile = form.mobile.value.replace(/\D/g, '').replace(/^(91|0)(?=\d{10}$)/, ''), post = form.post.value;
    S.mobile = mobile; S.post = post; S.exp = form.exp.value || ''; S.block = null; S.err = '';
    if (!/^[6-9]\d{9}$/.test(mobile)) S.err = t('eMobile'); else if (!post) S.err = t('ePost'); else if (!S.exp) S.err = t('eExp');
    else if (S.exp === 'fresher' && !SETTINGS.fresherPosts.includes(post)) S.err = t('eFresherPost');
    if (S.err) return render();
    S.busy = true; render();
    try {
      const a = await DB.getAttempt(mobile, post);
      if (a && Date.now() - a.at < SETTINGS.cooldownDays * DAY) S.block = { post, at: a.at };
      else { S.view = 'profile'; S.startDone = {}; }
    } catch (e) { S.err = t('eNet'); }
    S.busy = false; render(); window.scrollTo(0, 0);
  }

  function doProfile() {
    const f = S.form, fr = S.exp === 'fresher', need = fr ? ['name', 'qualification', 'passYear', 'joinDate', 'dependents', 'whyJoin'] : ['name', 'lastCompany', 'lastDesignation', 'lastSalary', 'incentiveInCtc', 'joinDate', 'pf', 'dependents', 'whyJoin', 'whyLeave'];
    if (!fr && f.incentiveInCtc === 'no') need.splice(5, 0, 'avgIncentive');
    if (!fr && f.pf === 'yes') need.splice(need.indexOf('pf') + 1, 0, 'pfNumber');
    const miss = need.find(k => !String(f[k] == null ? '' : f[k]).trim());
    S.err = miss ? t('eReq', { f: t(miss) }) : '';
    if (!S.err) {
      if (!S.file) S.err = t('eCvRequired');
      else if (!/\.(pdf|docx?)$/i.test(S.file.name)) S.err = t('eCvType');
      else if (S.file.size > SETTINGS.maxCvMB * 1048576) S.err = t('eCvSize', { n: SETTINGS.maxCvMB });
    }
    if (!S.err) S.view = 'ready';
    render(); window.scrollTo(0, 0);
    if (S.err) $(`[name="${miss || 'cv'}"]`)?.focus();
  }

  async function startTest() {
    if (S.busy) return;
    S.busy = true; S.err = ''; render();
    const f = S.form;
    if (!S.candId) S.candId = newId();
    const fr = S.exp === 'fresher', base = { id: S.candId, mobile: S.mobile, post: S.post, fresher: fr, exp: S.exp, name: f.name.trim(), joinDate: f.joinDate, dependents: Number(f.dependents) || 0, whyJoin: f.whyJoin.trim() };
    const cand = fr ? Object.assign(base, { qualification: f.qualification.trim(), passYear: Number(f.passYear) || 0, otherExp: (f.otherExp || '').trim(), whyLeave: '', pf: false }) : Object.assign(base, {
      lastCompany: f.lastCompany.trim(), lastDesignation: f.lastDesignation.trim(),
      lastSalary: Number(f.lastSalary) || 0, incentiveInCtc: f.incentiveInCtc === 'yes', avgIncentive: f.incentiveInCtc === 'no' ? Number(f.avgIncentive) || 0 : null,
      pf: f.pf === 'yes', pfNumber: f.pf === 'yes' ? f.pfNumber.trim() : null, whyLeave: f.whyLeave.trim()
    });
    try {
      let remote = [];
      try { remote = await DB.questions(S.post); } catch (e) { remote = []; }
      await DB.start(cand, S.file, S.startDone);
      sess = { candId: cand.id, post: S.post, startAt: Date.now(), q: buildTest(S.post, remote, BANK, S.exp !== 'same'), ans: [], cur: 0, infr: 0 };
      sess.ans = sess.q.map(() => null);
      saveSess(); S.busy = false; S.view = 'test'; beginTest(); render(); window.scrollTo(0, 0);
    } catch (e) {
      S.busy = false;
      if (e && /permission/i.test(String(e.code || e.message)) && S.startDone.cand && !S.startDone.att) { S.view = 'check'; S.block = { post: S.post, at: Date.now() }; }
      else S.err = t('eNet');
      render();
    }
  }

  function beginTest() { clearInterval(timer); timer = setInterval(tick, 1000); }
  function tick() {
    if (!sess || S.view !== 'test') return;
    const left = Math.max(0, DUR - Math.floor((Date.now() - sess.startAt) / 1000)), tm = $('#tm'), bar = $('#tbar');
    if (tm) { tm.textContent = mmss(left); tm.classList.toggle('low', left <= 120); }
    if (bar) { bar.style.width = (left / DUR * 100) + '%'; bar.classList.toggle('low', left <= 120); }
    if (left <= 0) finish('timeout');
  }
  function leftScreen() {
    if (!sess || S.view !== 'test' || sess.away) return;
    sess.away = true; sess.infr++; saveSess();
    if (sess.infr >= 2) finish('tab-switch');
    else warn();
  }
  function warn() {
    modal(`<h2 style="color:#8a1218">${t('wTitle')}</h2><p>${t('wText')}</p><button class="btn" data-act="closeModal">${t('wOk')}</button>`);
  }
  function cameBack() { if (sess && sess.away) { sess.away = false; saveSess(); } }

  async function finish(reason) {
    if (!sess || sess.result) return;
    clearInterval(timer); closeModal();
    const r = scoreTest(sess.q, sess.ans);
    sess.result = {
      score: r.score, total: r.total, by: r.by, timeTakenSec: Math.min(DUR, Math.round((Date.now() - sess.startAt) / 1000)), infractions: sess.infr, submitReason: reason,
      sheet: sess.q.map((q, i) => ({ c: q.cat, q: q.en.q, o: q.en.o, a: q.a, p: sess.ans[i] == null ? null : sess.ans[i] }))
    };
    saveSess(); await trySubmit();
  }
  async function trySubmit() {
    S.view = 'submitting'; render(); window.scrollTo(0, 0);
    try { await DB.submit(sess.candId, sess.result); S.done = sess.result; sess = null; LS.del('lx_sess'); S.view = 'done'; }
    catch (e) { S.view = 'submitFail'; }
    render();
  }

  /* ===== Admin ===== */
  async function openAdmin() {
    S.view = 'adminLogin'; A.err = ''; render();
    try { if (await DB.adminReady()) { S.view = 'admin'; render(); loadCands(true); } } catch (e) { A.err = 'Could not reach the database. Check your internet connection.'; render(); }
  }
  function vAdminLogin() {
    return `<form class="card admin-login-card" data-form="adminLogin"><h1>Admin sign in</h1><p class="mut">Sign in to manage candidate applications and the question bank.</p>${A.err ? `<div class="msg bad" role="alert">${esc(A.err)}</div>` : ''}
      ${LIVE ? '<label class="f">Email<input type="email" name="email" autocomplete="username" required></label>' : `<p class="mut">Demo mode password: <b>${esc(SETTINGS.demoAdminPassword)}</b></p>`}
      <label class="f">Password<input type="password" name="pw" autocomplete="current-password" required></label>
      ${btn('Sign in', S.busy)}</form><div class="foot"><button data-act="toCheck">Back to the candidate page</button></div>`;
  }
  async function loadCands(reset) {
    A.loading = true; if (reset) { A.rows = []; A.cursor = null; } render();
    try { const r = await DB.candidates(reset ? null : A.cursor); A.rows = A.rows.concat(r.rows); A.cursor = r.cursor; A.err = ''; }
    catch (e) { A.err = 'Could not load candidates: ' + (e.message || e); }
    A.loading = false; A.loaded = true; render();
  }
  const expOf = c => c.exp || (c.fresher ? 'fresher' : 'same');
  const EXP = { same: 'Same field', other: 'Other field', fresher: 'Fresher' };
  const pct = c => c.total ? Math.round(c.score / c.total * 100) : null;
  function filtered() {
    const f = A.f, q = f.q.trim().toLowerCase(), from = f.from ? new Date(f.from + 'T00:00').getTime() : 0, to = f.to ? new Date(f.to + 'T23:59:59').getTime() : Infinity;
    return A.rows.filter(c => {
      const when = c.submittedAt || c.createdAt || 0;
      if (q && !((c.name || '').toLowerCase().includes(q) || (c.mobile || '').includes(q))) return false;
      if (f.post && c.post !== f.post) return false;
      if (f.exp && f.exp !== expOf(c)) return false;
      if (when < from || when > to) return false;
      if (f.min !== '0' && !(c.status === 'submitted' && pct(c) > Number(f.min))) return false;
      return true;
    });
  }
  const scorePill = c => { if (c.status !== 'submitted') return '<span class="pill x">Not submitted</span>'; const p = pct(c); return `<span class="pill ${p > 80 ? 'g' : p > 50 ? 'y' : 'r'}">${c.score}/${c.total}</span>`; };
  function vAdmin() {
    const candidates = A.tab === 'cands';
    return `<div class="admin-heading">
      <div><h1>Recruitment dashboard</h1><p class="mut">Review applications and manage assessment questions.</p></div>
      <button class="btn sec sm" data-act="adminLogout">Sign out</button>
    </div>
    <nav class="tabs admin-nav" aria-label="Recruitment dashboard">
      <button class="tab ${candidates ? 'on' : ''}" aria-pressed="${candidates}" data-act="aTab" data-t="cands">Candidates</button>
      <button class="tab ${!candidates ? 'on' : ''}" aria-pressed="${!candidates}" data-act="aTab" data-t="qs">Question bank</button>
    </nav>
    ${A.err ? `<div class="msg bad" role="alert">${esc(A.err)}</div>` : ''}
    ${candidates ? vCands() : `<section class="admin-question-bank" aria-labelledby="question-bank-title"><h2 id="question-bank-title">Question bank</h2>${vQs()}</section>`}`;
  }
  function vCands() {
    const f = A.f, rows = filtered(), counts = {};
    A.rows.forEach(c => counts[c.mobile] = (counts[c.mobile] || 0) + 1);
    const tr = c => `<tr><td><button class="lk" data-act="cand" data-id="${esc(c.id)}">${esc(c.name)}</button>${expOf(c) !== 'same' ? ` <span class="pill y">${EXP[expOf(c)]}</span>` : ''}</td><td class="n">${esc(c.mobile)}${counts[c.mobile] > 1 ? ` <span class="pill x" title="Total applications from this number">${counts[c.mobile]}×</span>` : ''}</td><td>${esc(postName(c.post))}</td><td class="n">${scorePill(c)}</td><td class="n">${c.status === 'submitted' ? fmtDT(c.submittedAt) : 'Started ' + fmtDT(c.createdAt)}</td><td class="n">${c.status === 'submitted' ? mmss(c.timeTakenSec) : ''}</td><td class="n">${c.fresher ? '-' : c.pf ? 'Yes' : 'No'}</td><td class="n">${c.cv ? `<button class="lk" data-act="cv" data-id="${esc(c.id)}">Download</button>` : ''}</td></tr>`;
    let body = '';
    if (f.group) {
      const g = {}; rows.forEach(c => (g[c.mobile] = g[c.mobile] || []).push(c));
      body = Object.keys(g).sort((a, b) => g[b].length - g[a].length).map(m => `<tr class="grp"><td colspan="8">${esc(m)} · ${esc(g[m][0].name)} · ${g[m].length} application(s)</td></tr>` + g[m].map(tr).join('')).join('');
    } else body = rows.map(tr).join('');
    const submitted = A.rows.filter(c => c.status === 'submitted').length;
    const metric = value => A.loaded ? value.toLocaleString('en-IN') : '&mdash;';
    return `<dl class="admin-metrics">
      <div><dt>Applications loaded</dt><dd>${metric(A.rows.length)}</dd></div>
      <div><dt>Submitted</dt><dd>${metric(submitted)}</dd></div>
      <div><dt>Pending submission</dt><dd>${metric(A.rows.length - submitted)}</dd></div>
    </dl>
    <section class="card admin-candidates" aria-labelledby="candidate-title">
    <div class="admin-panel-header">
      <div><h2 id="candidate-title">Candidate applications</h2><p class="mut" role="status">${rows.length} of ${A.rows.length} loaded applications shown${A.loading ? ' · Loading…' : ''}</p></div>
      <div class="admin-actions"><button class="btn sec sm" data-act="reload" ${A.loading ? 'disabled' : ''}>Refresh</button><button class="btn sm" data-act="csv">Export CSV</button></div>
    </div>
    <div class="filters admin-filters">
      <label>Search name or mobile<input type="search" data-f="q" value="${esc(f.q)}"></label>
      <label>Job post<select data-f="post"><option value="">All posts</option>${POSTS.map(p => `<option value="${p.id}" ${f.post === p.id ? 'selected' : ''}>${esc(p.en)}</option>`).join('')}</select></label>
      <label>Experience<select data-f="exp"><option value="">All</option>${Object.keys(EXP).map(k => `<option value="${k}" ${f.exp === k ? 'selected' : ''}>${EXP[k]}</option>`).join('')}</select></label>
      <label>From<input type="date" data-f="from" value="${esc(f.from)}"></label><label>To<input type="date" data-f="to" value="${esc(f.to)}"></label>
      <label>Minimum score<select data-f="min"><option value="0">Any</option><option value="50" ${f.min === '50' ? 'selected' : ''}>Above 50%</option><option value="80" ${f.min === '80' ? 'selected' : ''}>Above 80%</option></select></label>
      <label class="admin-group"><input type="checkbox" data-f="group" ${f.group ? 'checked' : ''}> Group by mobile</label></div>
    <div class="tw" role="region" aria-label="Candidate results" tabindex="0"><table><thead><tr><th>Name</th><th>Mobile</th><th>Post applied</th><th>Score</th><th>Submitted</th><th>Time taken</th><th>PF</th><th>CV</th></tr></thead><tbody>${body || `<tr><td colspan="8" class="mut admin-empty">${A.loaded ? 'No candidates match.' : 'Loading…'}</td></tr>`}</tbody></table></div>
    ${A.cursor ? `<div class="admin-pagination"><button class="btn sec sm" data-act="more" ${A.loading ? 'disabled' : ''}>Load older candidates</button></div>` : ''}</section>`;
  }
  function candModal(id) {
    const c = A.rows.find(x => x.id === id); if (!c) return;
    const others = A.rows.filter(x => x.mobile === c.mobile).sort((a, b) => b.createdAt - a.createdAt), by = c.by || {};
    const kv = (k, v) => `<dt>${k}</dt><dd>${esc(v == null || v === '' ? '-' : v)}</dd>`;
    const names = { self: 'Work attitude', lotus: 'Lotus and retail basics', math: 'Calculation', role: 'Job knowledge', apt: 'Aptitude' };
    modal(`<h2>${esc(c.name)}</h2><dl class="kv">
      ${kv('Mobile', c.mobile)}${kv('Post', postName(c.post))}${kv('Experience', EXP[expOf(c)] + (expOf(c) === 'same' ? '' : ' (took the no-jargon test)'))}
      ${c.fresher ? kv('Qualification', c.qualification) + kv('Year of passing', c.passYear) + kv('Other experience', c.otherExp) : kv('Last place worked', c.lastCompany) + kv('Last designation', c.lastDesignation) + kv('Last salary / CTC', inr(c.lastSalary)) + kv('Incentive part of CTC', c.incentiveInCtc ? 'Yes' : 'No, average monthly incentive ' + inr(c.avgIncentive || 0)) + kv('PF', c.pf ? 'Yes, ' + (c.pfNumber || '') : 'No') + kv('Reason for leaving', c.whyLeave)}
      ${kv('Earliest joining', c.joinDate)}${kv('Dependents', c.dependents)}${kv('Why Lotus', c.whyJoin)}
      ${c.status === 'submitted' ? kv('Score', `${c.score}/${c.total} (${pct(c)}%)`) + kv('Sections', Object.keys(names).filter(k => by[k]).map(k => `${names[k]} ${by[k][0]}/${by[k][1]}`).join(', ')) + kv('Time taken', mmss(c.timeTakenSec) + ' min') + kv('Left the screen', (c.infractions || 0) + ' time(s)' + (c.submitReason === 'tab-switch' ? ', auto-submitted' : c.submitReason === 'timeout' ? ', time ran out' : '')) : kv('Status', 'Started ' + fmtDT(c.createdAt) + ', never submitted')}
      </dl>
      <h2>All applications from ${esc(c.mobile)}</h2>
      ${others.map(o => `<div class="sheet">${fmtD(o.createdAt)} · ${esc(postName(o.post))} · ${scorePill(o)}</div>`).join('')}
      ${c.sheet ? `<h2 style="margin-top:14px">Answer sheet</h2>` + c.sheet.map((s, i) => `<div class="sheet"><b>${i + 1}. ${esc(s.q)}</b><br>${s.p == null ? '<span class="no">Not answered</span>' : `<span class="${s.p === s.a ? 'ok' : 'no'}">${s.p === s.a ? 'Correct' : 'Wrong'}: ${esc(s.o[s.p])}</span>`}${s.p !== s.a ? `<br><span class="mut">Right answer: ${esc(s.o[s.a])}</span>` : ''}</div>`).join('') : ''}
      <div class="row" style="margin-top:16px;flex-wrap:wrap"><button class="btn sec sm" data-act="retest" data-id="${esc(c.id)}">Allow re-test now</button><button class="btn sec sm" data-act="delCand" data-id="${esc(c.id)}">Delete record</button><button class="btn dark sm" data-act="closeModal">Close</button></div>`, true);
  }
  function csv() {
    const cols = ['name', 'mobile', 'post', 'experience', 'qualification', 'passYear', 'otherExperience', 'status', 'score', 'total', 'percent', 'submitted', 'timeTaken', 'leftScreen', 'lastCompany', 'lastDesignation', 'lastSalary', 'incentiveInCtc', 'avgIncentive', 'joinDate', 'pf', 'pfNumber', 'dependents', 'whyJoin', 'whyLeave', 'cv'];
    const q = v => { let s = String(v == null ? '' : v); if (/^[=+\-@]/.test(s)) s = "'" + s; return '"' + s.replace(/"/g, '""') + '"'; };
    const lines = filtered().map(c => [c.name, c.mobile, postName(c.post), EXP[expOf(c)], c.qualification, c.passYear, c.otherExp, c.status, c.score, c.total, pct(c), fmtDT(c.submittedAt), mmss(c.timeTakenSec), c.infractions, c.lastCompany, c.lastDesignation, c.lastSalary, c.incentiveInCtc ? 'Yes' : 'No', c.avgIncentive, c.joinDate, c.pf ? 'Yes' : 'No', c.pfNumber, c.dependents, c.whyJoin, c.whyLeave, c.cv ? c.cv.name : ''].map(q).join(','));
    download(new Blob(['﻿' + cols.join(',') + '\n' + lines.join('\n')], { type: 'text/csv' }), 'lotus-candidates-' + new Date().toISOString().slice(0, 10) + '.csv');
  }
  function download(blob, name) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 5000); }

  /* ----- question management ----- */
  async function loadQs() { A.qs = null; render(); try { A.qs = await DB.allQuestions(); A.err = ''; } catch (e) { A.qs = []; A.err = 'Could not load questions: ' + (e.message || e); } render(); }
  const CATS = { self: 'Self-awareness and discipline', lotus: 'Lotus and retail basics', role: 'Role-specific', apt: 'Fresher aptitude' };
  function vQs() {
    if (!A.qs) return '<p class="mut">Loading…</p>';
    const list = A.qs.filter(q => !A.qf || q.scope === A.qf || CATS[A.qf] && q.cat === A.qf);
    const count = k => A.qs.filter(q => q.cat === 'role' ? q.post === k : q.cat === k).length;
    return `<div class="card">${A.qs.length === 0 ? `<div class="msg info">The database has no questions yet, so tests use the ${BANK.length} starter questions built into the app. Copy them into the database to edit them or add your own.</div><button class="btn" data-act="seed">Copy the ${BANK.length} starter questions into the database</button>` :
      `<p class="mut">Each test needs 4 self-awareness, 3 Lotus/retail and 10 role questions. A fresher, or someone whose experience is in another field, gets up to 5 role questions marked "OK for freshers" and the rest from Fresher aptitude. If a group has fewer in the database, the app tops up from its built-in starter questions. The 8 calculation questions are generated fresh for every candidate and are not listed here.</p>
      <div class="filters question-toolbar"><label>Show<select data-qf><option value="">All (${A.qs.length})</option><option value="self" ${A.qf === 'self' ? 'selected' : ''}>${CATS.self} (${count('self')})</option><option value="lotus" ${A.qf === 'lotus' ? 'selected' : ''}>${CATS.lotus} (${count('lotus')})</option><option value="apt" ${A.qf === 'apt' ? 'selected' : ''}>${CATS.apt} (${count('apt')})</option>${POSTS.map(p => `<option value="${p.id}" ${A.qf === p.id ? 'selected' : ''}>${esc(p.en)} (${count(p.id)})</option>`).join('')}</select></label>
      <button class="btn sm" data-act="qNew">Add question</button><label class="btn sec sm admin-import">Import JSON<input type="file" accept=".json,application/json" data-import></label></div>
      ${list.map(q => `<div class="qrow"><div><b>${esc(q.en.q)}</b><br><span class="mut">${esc(q.hi.q)}</span><br><span class="pill g">${esc(q.en.o[q.a])}</span> <span class="pill x">${esc(q.cat === 'role' ? postName(q.post) : CATS[q.cat])}</span>${q.cat === 'role' && q.fr ? ' <span class="pill y">OK for freshers</span>' : ''}</div><button class="btn sec sm" data-act="qEdit" data-id="${esc(q.id)}">Edit</button><button class="btn sec sm admin-danger" data-act="qDel" data-id="${esc(q.id)}">Delete</button></div>`).join('') || '<p class="mut">No questions in this group.</p>'}`}</div>`;
  }
  function qModal(id) {
    const q = id ? A.qs.find(x => x.id === id) : { cat: 'role', post: POSTS.some(p => p.id === A.qf) ? A.qf : 'sales', en: { q: '', o: ['', '', '', ''] }, hi: { q: '', o: ['', '', '', ''] }, a: 0 };
    modal(`<form data-form="q"><h2>${id ? 'Edit question' : 'Add question'}</h2><input type="hidden" name="id" value="${esc(id || '')}">
      <div class="row"><label class="f">Group<select name="cat">${Object.keys(CATS).map(c => `<option value="${c}" ${q.cat === c ? 'selected' : ''}>${CATS[c]}</option>`).join('')}</select></label>
      <label class="f">Post (for role-specific)<select name="post">${POSTS.map(p => `<option value="${p.id}" ${q.post === p.id ? 'selected' : ''}>${esc(p.en)}</option>`).join('')}</select></label></div>
      <label style="display:flex;gap:8px;align-items:center;margin-bottom:14px;font-size:14.5px"><input type="checkbox" name="fr" ${q.fr ? 'checked' : ''} style="width:18px;height:18px"> OK for freshers: a role question with no jargon, answerable without work experience</label>
      <label class="f">Question (English)<textarea name="enq" required>${esc(q.en.q)}</textarea></label>
      <label class="f">Question (Hindi)<textarea name="hiq" required>${esc(q.hi.q)}</textarea></label>
      ${[0, 1, 2, 3].map(i => `<div class="card" style="padding:12px"><label style="display:flex;gap:8px;align-items:center;font-weight:600;font-size:14px"><input type="radio" name="a" value="${i}" ${q.a === i ? 'checked' : ''} style="width:18px;height:18px"> Option ${'ABCD'[i]} is the correct answer</label><input type="text" name="en${i}" placeholder="English" value="${esc(q.en.o[i])}" required><input type="text" name="hi${i}" placeholder="Hindi" value="${esc(q.hi.o[i])}" required></div>`).join('')}
      <div class="row"><button type="button" class="btn sec" data-act="closeModal">Cancel</button><button class="btn">Save</button></div></form>`, true);
  }
  async function saveQ(form) {
    const g = n => form[n].value.trim(), q = { id: g('id') || null, cat: g('cat'), post: g('post'), fr: form.fr.checked, en: { q: g('enq'), o: [0, 1, 2, 3].map(i => g('en' + i)) }, hi: { q: g('hiq'), o: [0, 1, 2, 3].map(i => g('hi' + i)) }, a: Number(form.a.value) };
    try { await DB.saveQuestions([q]); closeModal(); loadQs(); } catch (e) { alert('Could not save: ' + (e.message || e)); }
  }
  async function importFile(file) {
    try {
      const data = JSON.parse(await file.text()), list = (Array.isArray(data) ? data : data.questions || []).filter(q => q && CATS[q.cat] && q.en && q.hi && Array.isArray(q.en.o) && q.en.o.length === 4 && Array.isArray(q.hi.o) && q.hi.o.length === 4 && (q.cat !== 'role' || POSTS.some(p => p.id === q.post)));
      if (!list.length) return alert('No valid questions found in this file.');
      if (!confirm(`Import ${list.length} question(s)? Questions with the same ID will be replaced.`)) return;
      await DB.saveQuestions(list); loadQs();
    } catch (e) { alert('Could not import: ' + (e.message || e)); }
  }

  /* ===== Events ===== */
  const ACT = {
    lang() { S.lang = S.lang === 'en' ? 'hi' : 'en'; LS.set('lx_lang', S.lang); render(); },
    setLang(el) { S.lang = el.dataset.l; LS.set('lx_lang', S.lang); render(); },
    toCheck() {
      if (adminRoute) {
        location.replace('/landing');
        return;
      }
      S.view = 'check'; S.err = ''; history.replaceState(null, '', location.pathname); render();
    },
    toProfile() { S.view = 'profile'; S.err = ''; render(); },
    startTest,
    ans(el) { sess.ans[sess.cur] = Number(el.dataset.k); saveSess(); render(); },
    go(el) { const i = Number(el.dataset.i); if (i >= 0 && i < sess.q.length) { sess.cur = i; saveSess(); render(); window.scrollTo(0, 0); } },
    askSubmit() { const left = sess.ans.filter(a => a == null).length; modal(`<h2>${t('cfTitle')}</h2><p>${left ? t('cfLeft', { n: left }) : t('cfAll')}</p><div class="row"><button class="btn sec" data-act="closeModal">${t('cfNo')}</button><button class="btn" data-act="doSubmit">${t('cfYes')}</button></div>`); },
    doSubmit() { finish('submitted'); },
    retrySubmit() { trySubmit(); },
    closeModal,
    async adminLogout() { await DB.adminLogout(); A.loaded = false; A.rows = []; A.qs = null; ACT.toCheck(); },
    aTab(el) { A.tab = el.dataset.t; A.err = ''; render(); if (A.tab === 'qs' && !A.qs) loadQs(); },
    reload() { loadCands(true); }, more() { loadCands(false); }, csv,
    cand(el) { candModal(el.dataset.id); },
    async cv(el) { const c = A.rows.find(x => x.id === el.dataset.id); el.textContent = 'Preparing…'; try { download(await DB.cv(c), c.cv.name || 'cv'); el.textContent = 'Download'; } catch (e) { el.textContent = 'Failed, retry'; } },
    async retest(el) { const c = A.rows.find(x => x.id === el.dataset.id); if (!confirm(`Allow ${c.name} to take the ${postName(c.post)} test again right away?`)) return; try { await DB.resetAttempt(c.mobile, c.post); alert('Done. This candidate can take the test again now.'); } catch (e) { alert('Could not do that: ' + (e.message || e)); } },
    async delCand(el) { const c = A.rows.find(x => x.id === el.dataset.id); if (!confirm(`Permanently delete the record and CV of ${c.name}? This cannot be undone.`)) return; try { await DB.deleteCandidate(c); A.rows = A.rows.filter(x => x.id !== c.id); closeModal(); render(); } catch (e) { alert('Could not delete: ' + (e.message || e)); } },
    async seed(el) { el.disabled = true; el.textContent = 'Copying…'; try { await DB.saveQuestions(BANK); } catch (e) { alert('Could not copy: ' + (e.message || e)); } loadQs(); },
    qNew() { qModal(null); }, qEdit(el) { qModal(el.dataset.id); },
    async qDel(el) { if (!confirm('Delete this question?')) return; try { await DB.deleteQuestion(el.dataset.id); loadQs(); } catch (e) { alert('Could not delete: ' + (e.message || e)); } }
  };
  listen(document, 'click', e => { const el = e.target.closest('[data-act]'); if (el && !el.disabled && ACT[el.dataset.act]) { e.preventDefault(); ACT[el.dataset.act](el); } });
  listen(document, 'submit', async e => {
    const f = e.target, k = f.dataset.form; if (!k) return; e.preventDefault();
    if (k === 'check') doCheck(f);
    else if (k === 'profile') doProfile();
    else if (k === 'q') saveQ(f);
    else if (k === 'adminLogin') { S.busy = true; A.err = ''; const email = f.email ? f.email.value.trim() : '', pw = f.pw.value; render(); try { await DB.adminLogin(email, pw); S.busy = false; S.view = 'admin'; render(); loadCands(true); } catch (err) { S.busy = false; A.err = err.message || 'Could not sign in.'; render(); } }
  });
  listen(document, 'input', e => {
    const el = e.target;
    if (el.closest('[data-form="check"]') && el.name) S[el.name] = el.value;
    else if (el.closest('[data-form="profile"]') && el.name && el.type !== 'file' && el.type !== 'radio') S.form[el.name] = el.value;
    else if (el.dataset.f === 'q') { A.f.q = el.value; const pos = el.selectionStart; render(); const n = $('[data-f="q"]'); if (n) { n.focus(); try { n.setSelectionRange(pos, pos); } catch (x) {} } }
  });
  listen(document, 'change', e => {
    const el = e.target;
    if (el.closest('[data-form="profile"]')) {
      if (el.type === 'radio') { S.form[el.name] = el.value; render(); const r = document.querySelector(`[name="${el.name}"][value="${el.value}"]`); if (r) r.focus(); }
      else if (el.type === 'file') { S.file = el.files[0] || null; }
    } else if (el.dataset.f && el.dataset.f !== 'q') { A.f[el.dataset.f] = el.type === 'checkbox' ? el.checked : el.value; render(); }
    else if ('qf' in el.dataset) { A.qf = el.value; render(); }
    else if ('import' in el.dataset && el.files[0]) importFile(el.files[0]);
  });
  listen(document, 'visibilitychange', () => document.hidden ? leftScreen() : cameBack());
  listen(window, 'blur', leftScreen);
  listen(window, 'focus', cameBack);
  listen(window, 'beforeunload', e => { if (sess && S.view === 'test') { e.preventDefault(); e.returnValue = ''; } });
  for (const ev of ['copy', 'cut', 'contextmenu']) listen(document, ev, e => { if (S.view === 'test') e.preventDefault(); });

  /* ===== Start ===== */
  (function init() {
    if (adminRoute) { openAdmin(); return; }
    sess = LS.get('lx_sess', null);
    if (sess && sess.q && sess.q.length) {
      if (sess.result) { trySubmit(); return; }
      if (Date.now() - sess.startAt >= DUR * 1000) { render(); finish('timeout'); return; }
      /* Reopening or refreshing the page counts as leaving the test once (unless that exit was already counted). */
      if (!sess.away) sess.infr++;
      sess.away = false; saveSess();
      if (sess.infr >= 2) { render(); finish('tab-switch'); return; }
      S.view = 'test'; beginTest(); render(); warn(); return;
    }
    sess = null;
    render();
  })();

  return () => {
    events.abort();
    clearInterval(timer);
  };
}
