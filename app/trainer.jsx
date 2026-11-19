"use client";

import { useEffect } from "react";

const firebaseScripts = [
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js",
  "https://www.gstatic.com/firebasejs/10.7.1/firebase-firestore-compat.js",
];

export default function Trainer({ adminPage = false }) {
  useEffect(() => {
    if (document.getElementById("trainer-runtime")) return;

    const trainerScripts = [
      ...firebaseScripts,
      ...(adminPage ? [] : ["/question_bank.js", "/flashcards.js"]),
      "/trainer.js",
    ];
    // Classic scripts share globals and execute in insertion order.
    for (const src of trainerScripts) {
      const script = document.createElement("script");
      script.src = src;
      script.async = false;
      if (src === "/trainer.js") script.id = "trainer-runtime";
      document.body.appendChild(script);
    }
  }, [adminPage]);

  return (
    <div className="min-h-screen" data-trainer-page={adminPage ? "admin" : "employee"}>
      <header className="trainer-header sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 trainer-header-inner">
          <div className="trainer-brand">
            <img
              className="trainer-logo"
              src="/lotus-logo.png"
              width={500}
              height={223}
              alt="Lotus Electronics Supermarket"
            />
            <div className="trainer-brand-name font-display" data-i18n="appName">Sales Knowledge Trainer</div>
          </div>
          <div className="trainer-header-actions">
            <div id="userChip" className="hidden text-sm px-3 py-1.5 rounded-full" style={{ background: "var(--surface-2)", color: "var(--ink-soft)" }}></div>
            <div className="lang-toggle" role="group" aria-label="Language toggle">
              <button id="langEnBtn" className="active" onClick={() => window.setLang?.('en')}>EN</button>
              <button id="langHiBtn" onClick={() => window.setLang?.('hi')}>हिं</button>
            </div>
            <button id="logoutBtn" onClick={() => window.doLogout?.()} className="btn btn-ghost btn-sm hidden" data-i18n="logout">Logout</button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-10">

        {/* CONNECTING SCREEN (shown while the central server connection is established) */}
        <section id="screen-connecting" className="screen active">
          <div className="connection-shell mx-auto">
            <div className="card connection-card">
              <div className="spinner" role="status" aria-label="Connecting"></div>
              <div>
                <h1 className="text-xl font-extrabold mb-1" data-i18n="connectingTitle">Connecting to server…</h1>
                <p className="text-sm" style={{ color: "var(--ink-soft)" }} data-i18n="connectingMessage">Setting up a live connection so test results sync centrally across every device. This only takes a moment.</p>
              </div>
            </div>
          </div>
        </section>

        {/* SERVER UNAVAILABLE SCREEN (blocking — this app never stores results on-device) */}
        <section id="screen-server-error" className="screen">
          <div className="connection-shell mx-auto">
            <div className="card connection-card connection-error">
              <div className="connection-error-detail">
                <div className="server-icon">
                  <svg width={26} height={26} viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M12 9v4m0 4h.01M10.29 3.86 1.82 18a1.5 1.5 0 0 0 1.3 2.25h17.76a1.5 1.5 0 0 0 1.3-2.25L13.71 3.86a1.5 1.5 0 0 0-2.42 0Z" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" /></svg>
                </div>
                <div>
                  <h1 className="text-xl font-extrabold mb-1" data-i18n="serverErrorTitle">Can't reach the central server</h1>
                  <p className="text-sm" style={{ color: "var(--ink-soft)" }} data-i18n="serverErrorMessage">This app only tracks test results on the central server so every device stays in sync — it never saves anything on this device. Check your connection and try again.</p>
                </div>
              </div>
              <button className="btn btn-primary w-full mt-5" onClick={() => window.connectToServer?.()} data-i18n="retryConnectionButton">Retry Connection</button>
            </div>
          </div>
        </section>

        {/* LOGIN SCREEN */}
        <section id="screen-login" className="screen">
          <div className="trainer-login">
            <div className="trainer-login-form">
              {!adminPage ? (
                <form onSubmit={(event) => { event.preventDefault(); window.attemptEmployeeLogin?.(); }}>
                  <h1 className="text-2xl font-extrabold mb-1" data-i18n="loginTitle">Sales Team Login</h1>
                  <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }} data-i18n="loginSubtitle">Enter your Employee ID to begin product knowledge training.</p>
                  <label htmlFor="employeeIdInput" className="block text-sm font-semibold mb-1.5" data-i18n="employeeIdLabel">Employee ID</label>
                  <input type="text" id="employeeIdInput" data-i18n-ph="employeeIdPlaceholder" placeholder="e.g. EMP001" autoComplete="off" />
                  <div id="loginError" className="hidden text-sm mt-2 px-3 py-2 rounded-lg" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}></div>
                  <button type="submit" className="btn btn-primary w-full mt-5" data-i18n="loginButton">Log In</button>
                </form>
              ) : (
                <form onSubmit={(event) => { event.preventDefault(); window.attemptAdminLogin?.(); }}>
                  <h1 className="text-2xl font-extrabold mb-1" data-i18n="adminLoginTitle">Admin Login</h1>
                  <p className="text-sm mb-6" style={{ color: "var(--ink-soft)" }} data-i18n="adminLoginSubtitle">Enter admin credentials to view compliance &amp; performance data.</p>
                  <label htmlFor="adminIdInput" className="block text-sm font-semibold mb-1.5" data-i18n="adminIdLabel">Admin ID</label>
                  <input type="text" id="adminIdInput" className="mb-3" autoComplete="off" />
                  <label htmlFor="adminPasswordInput" className="block text-sm font-semibold mb-1.5" data-i18n="adminPasswordLabel">Password</label>
                  <input type="password" id="adminPasswordInput" autoComplete="off" />
                  <div id="adminLoginError" className="hidden text-sm mt-2 px-3 py-2 rounded-lg" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}></div>
                  <button type="submit" className="btn btn-primary w-full mt-5" data-i18n="adminLoginButton">Log In as Admin</button>
                  <a className="trainer-login-switch" href="/" data-i18n="backToLogin">Back to employee login</a>
                </form>
              )}
            </div>
            <aside className="trainer-login-intro">
              <p className="trainer-login-title font-display" data-i18n="loginHeroTitle">Build confidence on the sales floor</p>
              <p className="trainer-login-summary" data-i18n="loginHeroSummary">Learn product features, test your knowledge and practise conversations with customers.</p>
            </aside>
          </div>
        </section>

        {!adminPage && (
          <>
            {/* CATEGORY SELECT SCREEN */}
            <section id="screen-category" className="screen">
              <div className="trainer-workspace max-w-4xl mx-auto">
                <div className="workspace-banner">
                  <h1 className="trainer-workspace-heading" id="welcomeBackText">Welcome back</h1>
                </div>

                <div className="trainer-workspace-tabs">
                  <button className="tabbtn active" id="tab-catmode-test-btn" onClick={() => window.setCategoryMode?.('test')} data-i18n="tabTakeTest">Take a Test</button>
                  <button className="tabbtn" id="tab-catmode-study-btn" onClick={() => window.setCategoryMode?.('study')} data-i18n="tabStudyMaterial">📚 Study Material</button>
                  <button className="tabbtn" id="tab-catmode-coach-btn" onClick={() => window.setCategoryMode?.('coach')} data-i18n="tabSalesCoach">🎤 Sales &amp; Greeting Coach</button>
                </div>

                <div id="catModeTest" className="trainer-workspace-panel">
                  <p className="text-sm mb-1" style={{ color: "var(--ink-soft)" }} data-i18n="categoryPrompt">Choose the product categories you want to be tested on.</p>
                  <p className="text-xs mb-6" style={{ color: "var(--ink-faint)" }} data-i18n="categoryHint">Select 1 to 3 categories. Your 25 questions will be drawn freshly and randomly every attempt.</p>
                  <div id="categoryGrid" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"></div>
                  <div className="trainer-workspace-footer">
                    <div className="text-sm" style={{ color: "var(--ink-soft)" }}><span id="selectedCountText">0</span> <span data-i18n="selectedCount">selected (max 3)</span></div>
                    <button id="startTestBtn" className="btn btn-accent" onClick={() => window.startQuiz?.()} disabled data-i18n="startTestButton">Start Test</button>
                  </div>
                </div>

                <div id="catModeStudy" className="trainer-workspace-panel hidden">
                  <p className="text-sm mb-1" style={{ color: "var(--ink-soft)" }} data-i18n="studyHubPrompt">Browse full specs and key selling points for every model — no test, no time pressure.</p>
                  <p className="text-xs mb-6" style={{ color: "var(--ink-faint)" }} data-i18n="studyHubHint">Pick a category to open its flashcards. Your progress is visible to your manager on the admin dashboard.</p>
                  <div id="studyHubGrid" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"></div>
                </div>

                <div id="catModeCoach" className="trainer-workspace-panel hidden">
                  <p className="text-sm mb-1" style={{ color: "var(--ink-soft)" }} data-i18n="coachSetupPrompt">Practice a live roleplay with an AI customer and get scored on the spot.</p>
                  <p className="text-xs mb-6" style={{ color: "var(--ink-faint)" }} data-i18n="coachSetupHint">Pick a product category and a skill to focus on. The AI will play the customer for a short back-and-forth.</p>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }} data-i18n="coachCategoryLabel">1. Choose a category</div>
                  <div id="coachCategoryGrid" className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6"></div>
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--ink-faint)" }} data-i18n="coachFocusLabel">2. Choose a skill to practice</div>
                  <div id="coachFocusGrid" className="flex flex-wrap gap-2 mb-6"></div>
                  <div className="flex justify-end">
                    <button id="startCoachBtn" className="btn btn-accent" onClick={() => window.startCoachScenario?.()} disabled data-i18n="coachStartButton">Start Roleplay →</button>
                  </div>
                </div>
              </div>
            </section>

            {/* STUDY BASICS SCREEN (product fundamentals + feature glossary, shown
            before the flashcards so a new joiner has the vocabulary first) */}
            <section id="screen-study-basics" className="screen">
              <div className="screen-shell mx-auto">
                <div className="screen-heading">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }} data-i18n="studyModeLabel">Study Mode</div>
                    <h1 id="studyBasicsCategoryTitle" className="text-xl font-extrabold">Category</h1>
                  </div>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.exitStudyMode?.()} data-i18n="studyBackButton">← Back to Categories</button>
                </div>
                <div className="card study-intro">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-2" style={{ color: "var(--accent)" }} data-i18n="basicsIntroLabel">Product Basics</div>
                  <p id="studyBasicsIntroText" className="text-sm leading-relaxed" style={{ color: "var(--ink)" }}></p>
                </div>
                <div className="glossary-panel">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-3" style={{ color: "var(--accent)" }} data-i18n="basicsGlossaryLabel">Key Features Explained</div>
                  <div id="studyGlossaryWrap" className="glossary-grid"></div>
                </div>
                <div className="screen-actions">
                  <button className="btn btn-primary" onClick={() => window.startStudyCards?.()} data-i18n="studyStartCardsButton">Start Flashcards →</button>
                </div>
              </div>
            </section>

            {/* STUDY MODE SCREEN (flashcard browser — no scoring, no time pressure) */}
            <section id="screen-study" className="screen">
              <div className="screen-shell mx-auto">
                <div className="screen-heading">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }} data-i18n="studyModeLabel">Study Mode</div>
                    <h1 id="studyCategoryTitle" className="text-xl font-extrabold">Category</h1>
                  </div>
                  <div className="screen-heading-actions">
                    <button className="btn btn-ghost btn-sm" onClick={() => window.showStudyBasics?.()} data-i18n="studyViewBasicsButton">ℹ Feature Guide</button>
                    <button className="btn btn-ghost btn-sm" onClick={() => window.exitStudyMode?.()} data-i18n="studyBackButton">← Back to Categories</button>
                  </div>
                </div>
                <div className="screen-progress-label" style={{ color: "var(--ink-soft)" }}><span data-i18n="studyCardPrefix">Card</span> <span id="studyCardIndexText">1</span> / <span id="studyCardTotalText">18</span></div>
                <div className="progress-track mb-6"><div id="studyProgressFill" className="progress-fill" style={{ width: "6%" }}></div></div>
                <div className="card flashcard">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }} id="studyCardBrand">Brand</div>
                  <h2 id="studyCardModel" className="flashcard-title">Model name</h2>
                  <div id="studySpecsWrap" className="flashcard-specs"></div>
                  <div id="studySellingPointWrap" className="hidden p-4 rounded-xl" style={{ background: "var(--accent-soft)" }}>
                    <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--accent)" }} data-i18n="whyItSellsLabel">Why It Sells</div>
                    <p id="studySellingPointText" className="text-sm" style={{ color: "var(--ink)" }}></p>
                  </div>
                </div>
                <div className="screen-actions screen-actions-between">
                  <button id="studyPrevBtn" className="btn btn-ghost" onClick={() => window.studyPrev?.()} data-i18n="studyPrevButton">← Previous</button>
                  <button id="studyNextBtn" className="btn btn-primary" onClick={() => window.studyNext?.()} data-i18n="studyNextButton">Next →</button>
                </div>
              </div>
            </section>

            {/* SALES & GREETING COACH — ROLEPLAY CHAT SCREEN */}
            <section id="screen-coach" className="screen">
              <div className="screen-shell mx-auto">
                <div className="screen-heading">
                  <div>
                    <div className="text-xs font-semibold uppercase tracking-wide" style={{ color: "var(--ink-faint)" }}><span id="coachCategoryTitle">Category</span> · <span id="coachFocusTitle">Skill</span></div>
                    <h1 className="text-xl font-extrabold"><span data-i18n="coachTurnLabel">Turn</span> <span id="coachTurnText">1</span> / <span id="coachMaxTurnsText">5</span></h1>
                  </div>
                  <div className="screen-heading-actions">
                    <div className="coach-score">
                      <div className="text-xs" style={{ color: "var(--ink-faint)" }} data-i18n="coachAvgScoreLabel">Avg. score so far</div>
                      <div id="coachAvgScoreText" className="font-bold coach-turn-score">—</div>
                    </div>
                    <button className="btn btn-ghost btn-sm" onClick={() => window.endCoachScenarioEarly?.()} data-i18n="coachEndEarlyButton">End Scenario</button>
                  </div>
                </div>
                <div className="progress-track mb-4"><div id="coachProgressFill" className="progress-fill" style={{ width: "20%" }}></div></div>
                <div className="card coach-conversation">
                  <div id="coachChatLog" role="log" aria-live="polite" className="coach-chat-log"></div>
                  <div className="coach-composer">
                    <textarea id="coachInput" rows={2} data-i18n-ph="coachInputPlaceholder" placeholder="Type what you'd say to the customer…" style={{ background: "var(--surface)", border: "1.5px solid var(--border)", color: "var(--ink)", borderRadius: "10px", padding: ".7rem .9rem", fontSize: ".95rem", width: "100%", fontFamily: "'Inter','Noto Sans Devanagari',sans-serif", resize: "none" }}></textarea>
                    <button id="coachSendBtn" className="btn btn-primary" onClick={() => window.sendCoachMessage?.()} data-i18n="coachSendButton">Send</button>
                  </div>
                </div>
              </div>
            </section>

            {/* SALES & GREETING COACH — RESULTS SCREEN */}
            <section id="screen-coach-results" className="screen">
              <div className="results-shell mx-auto">
                <div className="score-panel card">
                  <div className="score-layout">
                    <div className="ring-wrap">
                      <svg width={150} height={150} viewBox="0 0 150 150">
                        <circle cx={75} cy={75} r={64} fill="none" stroke="var(--surface-2)" strokeWidth={14} />
                        <circle id="coachScoreRing" cx={75} cy={75} r={64} fill="none" stroke="var(--success)" strokeWidth={14} strokeLinecap="round" transform="rotate(-90 75 75)" strokeDasharray="402" strokeDashoffset="402" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div id="coachScorePctText" className="font-display font-extrabold" style={{ fontSize: "2.1rem", lineHeight: "1" }}>0%</div>
                        <div id="coachScoreBandText" className="pill tag-success mt-1">Pass</div>
                      </div>
                    </div>
                    <div className="score-copy">
                      <h1 className="text-2xl font-extrabold mb-1" data-i18n="coachResultsTitle">Roleplay Complete</h1>
                      <p id="coachResultsSummaryText" className="text-sm" style={{ color: "var(--ink-soft)" }}></p>
                      <div id="coachSaveStatusBanner" className="hidden mt-4 p-4 rounded-xl" style={{ background: "var(--danger-soft)" }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: "var(--danger)" }} data-i18n="coachSaveFailedMsg">This result could not be saved to the central server yet, so it won't appear on the admin dashboard until it's retried.</p>
                        <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => window.retrySaveCoachResult?.()} data-i18n="retrySaveButton">Retry Save</button>
                      </div>
                    </div>
                  </div>
                </div>

                <h2 className="text-lg font-bold mb-3" data-i18n="coachFeedbackTitle">Turn-by-Turn Feedback</h2>
                <div id="coachFeedbackWrap" className="feedback-list"></div>

                <div className="screen-actions">
                  <button className="btn btn-primary" onClick={() => window.restartCoachSetup?.()} data-i18n="coachTryAnotherButton">Try Another Scenario</button>
                  <button className="btn btn-ghost" onClick={() => window.exitCoachMode?.()} data-i18n="coachBackButton">← Back to Categories</button>
                </div>
              </div>
            </section>

            {/* QUIZ SCREEN */}
            <section id="screen-quiz" className="screen">
              <div className="screen-shell mx-auto">
                <div className="screen-progress-label" style={{ color: "var(--ink-soft)" }}>
                  <span><span data-i18n="questionCounterPrefix">Question</span> <span id="qIndexText">1</span> / <span id="qTotalText">25</span></span>
                  <span id="quizTierTag" className="pill tag-medium">Medium</span>
                </div>
                <div className="progress-track mb-6"><div id="quizProgressFill" className="progress-fill" style={{ width: "6.6%" }}></div></div>
                <div className="card quiz-question">
                  <div className="flex items-center gap-2 mb-4">
                    <span id="quizCatTag" className="pill tag-tech">TV</span>
                    <span id="quizTypeTag" className="pill tag-tech">Technical</span>
                  </div>
                  <h1 id="questionText" className="quiz-question-title">Question text goes here</h1>
                  <div id="optionsWrap" className="flex flex-col gap-2.5"></div>
                  <div className="screen-actions quiz-actions">
                    <button id="nextQBtn" className="btn btn-primary" onClick={() => window.nextQuestion?.()} disabled data-i18n="nextButton">Next →</button>
                  </div>
                </div>
              </div>
            </section>

            {/* RESULTS SCREEN */}
            <section id="screen-results" className="screen">
              <div className="results-shell mx-auto">
                <div className="score-panel card">
                  <div className="score-layout">
                    <div className="ring-wrap">
                      <svg width={150} height={150} viewBox="0 0 150 150">
                        <circle cx={75} cy={75} r={64} fill="none" stroke="var(--surface-2)" strokeWidth={14} />
                        <circle id="scoreRing" cx={75} cy={75} r={64} fill="none" stroke="var(--success)" strokeWidth={14} strokeLinecap="round" transform="rotate(-90 75 75)" strokeDasharray="402" strokeDashoffset="402" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                        <div id="scorePctText" className="font-display font-extrabold" style={{ fontSize: "2.1rem", lineHeight: "1" }}>0%</div>
                        <div id="scoreBandText" className="pill tag-success mt-1">Pass</div>
                      </div>
                    </div>
                    <div className="score-copy">
                      <h1 className="text-2xl font-extrabold mb-1" data-i18n="resultsTitle">Test Complete</h1>
                      <p id="scoreSummaryText" className="text-sm" style={{ color: "var(--ink-soft)" }}>You answered 0 of 15 correctly.</p>
                      <div id="saveStatusBanner" className="hidden mt-4 p-4 rounded-xl" style={{ background: "var(--danger-soft)" }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: "var(--danger)" }} data-i18n="saveFailedMsg">This result could not be saved to the central server yet, so it won't appear on the admin dashboard until it's retried.</p>
                        <button className="btn btn-sm" style={{ background: "var(--danger)", color: "#fff" }} onClick={() => window.retrySaveResult?.()} data-i18n="retrySaveButton">Retry Save</button>
                      </div>
                      <div id="trainingCTA" className="hidden mt-4 p-4 rounded-xl" style={{ background: "var(--accent-soft)" }}>
                        <p className="text-sm font-semibold mb-2" style={{ color: "var(--accent)" }} data-i18n="belowThresholdMsg">Your score is below 70%. We've prepared a targeted training summary for you.</p>
                        <button className="btn btn-accent btn-sm" onClick={() => window.showScreen?.('training')} data-i18n="viewTrainingButton">View Targeted Training Summary</button>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="results-detail">
                  <div className="results-breakdown">
                    <h2 className="text-lg font-bold mb-3" data-i18n="categoryBreakdownTitle">Score by Category</h2>
                    <div id="categoryBreakdownWrap" className="results-category-list"></div>
                  </div>
                  <div>

                    <h2 className="text-lg font-bold mb-3" data-i18n="reviewAnswersTitle">Review Your Answers</h2>
                    <div id="reviewWrap" className="results-review-list"></div>
                  </div>
                </div>

                <div className="screen-actions">
                  <button className="btn btn-primary" onClick={() => window.resetToCategory?.()} data-i18n="backToCategoriesButton">Take Another Test</button>
                  <button className="btn btn-ghost" onClick={() => window.doLogout?.()} data-i18n="logout">Logout</button>
                </div>
              </div>
            </section>

            {/* TRAINING SUMMARY SCREEN */}
            <section id="screen-training" className="screen">
              <div className="results-shell mx-auto">
                <div className="training-banner">
                  <h1 className="text-2xl font-extrabold mb-1" data-i18n="trainingSummaryTitle">Targeted Training Summary</h1>
                  <p className="text-sm" style={{ color: "var(--ink-soft)" }} data-i18n="trainingSummarySubtitle">Focus on these areas before your next attempt — grouped by the exact features and scenarios you missed.</p>
                </div>
                <div id="trainingCardsWrap" className="training-grid"></div>
                <button className="btn btn-primary" onClick={() => window.showScreen?.('results')} data-i18n="backToResultsButton">← Back to Results</button>
              </div>
            </section>
          </>
        )}

        {adminPage && (
          <section id="screen-admin" className="screen">
            <div className="max-w-6xl mx-auto">
              <div className="admin-heading screen-heading">
                <h1 className="text-2xl font-extrabold" data-i18n="dashboardTitle">Admin Dashboard</h1>
                <div className="screen-heading-actions">
                  <button className="btn btn-ghost btn-sm" onClick={() => window.toggleChangePasswordPanel?.()} data-i18n="changePasswordButton">Change Password</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.doLogout?.()} data-i18n="adminLogoutButton">Log out of admin</button>
                </div>
              </div>

              <div id="changePasswordPanel" className="card p-5 mb-6 hidden">
                <h2 className="text-base font-bold mb-3" data-i18n="changePasswordTitle">Change Admin Password</h2>
                <div className="grid sm:grid-cols-3 gap-3">
                  <input type="password" id="currentPasswordInput" data-i18n-ph="currentPasswordPlaceholder" placeholder="Current password" autoComplete="off" />
                  <input type="password" id="newPasswordInput" data-i18n-ph="newPasswordPlaceholder" placeholder="New password" autoComplete="off" />
                  <input type="password" id="confirmPasswordInput" data-i18n-ph="confirmPasswordPlaceholder" placeholder="Confirm new password" autoComplete="off" />
                </div>
                <div id="changePasswordError" className="hidden text-sm mt-3 px-3 py-2 rounded-lg" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}></div>
                <div className="flex gap-2 mt-4">
                  <button className="btn btn-primary btn-sm" onClick={() => window.submitChangeAdminPassword?.()} data-i18n="savePasswordButton">Save Password</button>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.toggleChangePasswordPanel?.(false)} data-i18n="cancelButton">Cancel</button>
                </div>
              </div>

              <div className="admin-metrics">
                <div className="stat-tile">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }} data-i18n="overviewTotalEmployees">Total Employees</div>
                  <div id="statTotal" className="text-2xl font-display font-extrabold">0</div>
                </div>
                <div className="stat-tile">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }} data-i18n="overviewTested">Tested</div>
                  <div id="statTested" className="text-2xl font-display font-extrabold" style={{ color: "var(--success)" }}>0</div>
                </div>
                <div className="stat-tile">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }} data-i18n="overviewPending">Pending</div>
                  <div id="statPending" className="text-2xl font-display font-extrabold" style={{ color: "var(--danger)" }}>0</div>
                </div>
                <div className="stat-tile">
                  <div className="text-xs font-semibold uppercase tracking-wide mb-1" style={{ color: "var(--ink-faint)" }} data-i18n="overviewAvgScore">Average Score</div>
                  <div id="statAvg" className="text-2xl font-display font-extrabold">—</div>
                </div>
              </div>

              <div id="adminStoreFilterWrap" className="admin-store-filter hidden">
                <label htmlFor="adminStoreFilter" className="text-sm font-semibold" style={{ color: "var(--ink-soft)" }} data-i18n="filterByStoreLabel">Filter by Store:</label>
                <select id="adminStoreFilter" onChange={() => window.onAdminStoreFilterChange?.()} style={{ padding: ".45rem .7rem", borderRadius: "8px", border: "1px solid var(--border)", background: "var(--surface)", color: "var(--ink)", fontSize: ".85rem" }}></select>
              </div>

              <div className="trainer-workspace-tabs admin-tabs">
                <button className="tabbtn active" id="tab-history-btn" onClick={() => window.setAdminTab?.('history')} data-i18n="tabHistory">Test History</button>
                <button className="tabbtn" id="tab-pending-btn" onClick={() => window.setAdminTab?.('pending')} data-i18n="tabPending">Pending Compliance</button>
                <button className="tabbtn" id="tab-employees-btn" onClick={() => window.setAdminTab?.('employees')} data-i18n="tabEmployees">Team Roster</button>
              </div>

              <div id="adminTab-history" className="card admin-table-panel">
                <div className="flex justify-end mb-3">
                  <button className="btn btn-accent btn-sm" onClick={() => window.exportHistoryCSV?.()} data-i18n="exportHistoryButton">⬇ Export Completed Tests (CSV)</button>
                </div>
                <div className="table-wrap">
                  <table>
                    <thead><tr id="historyTableHead"></tr></thead>
                    <tbody id="historyTableBody"></tbody>
                  </table>
                </div>
                <p id="historyEmptyMsg" className="text-sm mt-3 hidden" style={{ color: "var(--ink-faint)" }} data-i18n="noDataMessage">No records yet.</p>
              </div>

              <div id="adminTab-pending" className="card admin-table-panel hidden">
                <div className="flex justify-end mb-3">
                  <button className="btn btn-accent btn-sm" onClick={() => window.exportPendingCSV?.()} data-i18n="exportPendingButton">⬇ Export Pending List (CSV)</button>
                </div>
                <p id="pendingStoreHint" className="hidden text-sm mb-3" data-i18n="pendingStoreHint">Assign missing stores in Team Roster to include these employees in store filters.</p>
                <div className="table-wrap">
                  <table>
                    <thead><tr id="pendingTableHead"></tr></thead>
                    <tbody id="pendingTableBody"></tbody>
                  </table>
                </div>
                <p id="pendingEmptyMsg" className="text-sm mt-3 hidden" style={{ color: "var(--ink-faint)" }} data-i18n="noDataMessage">No records yet.</p>
              </div>

              <div id="adminTab-employees" className="card admin-table-panel hidden">
                <p className="text-sm mb-4" style={{ color: "var(--ink-soft)" }} data-i18n="employeesTabHint">Add, rename or remove team members here — changes sync to every device immediately, and there's no limit on how many you can add.</p>
                <div className="grid sm:grid-cols-[1fr_1.4fr_1fr_auto] gap-2 mb-3 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  <input type="text" id="newEmployeeIdInput" data-i18n-ph="addEmployeeIdPlaceholder" placeholder="e.g. EMP021" autoComplete="off" />
                  <input type="text" id="newEmployeeNameInput" data-i18n-ph="addEmployeeNamePlaceholder" placeholder="Full name" autoComplete="off" />
                  <input type="text" id="newEmployeeStoreInput" data-i18n-ph="newEmployeeStorePlaceholder" placeholder="Store (optional)" autoComplete="off" />
                  <button className="btn btn-primary btn-sm" onClick={() => window.submitAddEmployee?.()} data-i18n="addEmployeeButton">+ Add Employee</button>
                </div>
                <div id="employeeFormError" className="hidden text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "var(--danger-soft)", color: "var(--danger)" }}></div>

                <div className="flex flex-wrap items-center gap-2 mb-2 p-3 rounded-xl" style={{ background: "var(--surface-2)" }}>
                  <label className="btn btn-ghost btn-sm" style={{ cursor: "pointer", margin: "0", position: "relative" }}>
                    <span data-i18n="importCsvButton">⬆ Import from CSV</span>
                    <input type="file" id="csvImportInput" accept=".csv,text/csv" onChange={(event) => window.handleCsvImport?.(event)} style={{ position: "absolute", inset: "0", width: "100%", height: "100%", opacity: "0", cursor: "pointer" }} />
                  </label>
                  <button className="btn btn-ghost btn-sm" onClick={() => window.downloadEmployeeTemplateCSV?.()} data-i18n="downloadTemplateButton">Download CSV Template</button>
                  <span className="text-sm" style={{ color: "var(--ink-faint)" }} data-i18n="csvImportHint">Include Employee ID and Full Name. Add a Store column to assign stores. Existing IDs are updated.</span>
                </div>
                <p id="csvImportStatus" className="hidden text-sm mb-4 px-3 py-2 rounded-lg" style={{ background: "var(--surface-2)" }}></p>
              <p id="studyActivityNotice" className="hidden text-sm mb-3" role="status" data-i18n="studyActivityReadDenied">Firestore denied access to study activity. Study counts are unavailable.</p>
                <div className="table-wrap">
                  <table>
                    <thead><tr id="employeesTableHead"></tr></thead>
                    <tbody id="employeesTableBody"></tbody>
                  </table>
                </div>
                <p id="employeesEmptyMsg" className="text-sm mt-3 hidden" style={{ color: "var(--ink-faint)" }} data-i18n="noEmployeesMessage">No team members yet — add the first one above.</p>
              </div>

              <p className="text-xs mt-6" style={{ color: "var(--ink-faint)" }} data-i18n="storageNote">Test records are stored centrally on the server and shared live with every device — this dashboard reflects the whole team in real time, and nothing is kept on any individual device.</p>
            </div>
          </section>
        )}

      </main>
      <div id="toast" className="hidden fixed bottom-5 left-1/2 -translate-x-1/2 px-4 py-2.5 rounded-xl text-sm font-medium z-50" style={{ background: "var(--ink)", color: "var(--bg)" }}></div>
    </div>
  );
}
