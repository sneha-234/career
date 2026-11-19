const trainingActivities = [
  {
    title: "Study product features",
    description: "Use feature guides and flashcards to compare specs and explain what matters to a customer.",
  },
  {
    title: "Test your knowledge",
    description: "Choose product categories, take a quiz, and review the answers you missed.",
  },
  {
    title: "Practise selling",
    description: "Roleplay with an AI customer and get feedback on your greeting, questions, and responses.",
  },
];

export default function LandingPage() {
  return (
    <>
      <header className="trainer-header">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 trainer-header-inner">
          <div className="trainer-brand">
            <img className="trainer-logo" src="/lotus-logo.png" width={500} height={223} alt="Lotus Electronics" />
            <span className="trainer-brand-name font-display">Sales Knowledge Trainer</span>
          </div>
          <a className="btn btn-ghost btn-sm" href="/login">Employee Login</a>
        </div>
      </header>

      <main className="landing-content max-w-6xl mx-auto px-4 sm:px-6">
        <section className="landing-hero" aria-labelledby="landing-title">
          <div className="landing-hero-copy">
            <h1 id="landing-title">Build confidence on the sales floor</h1>
            <p>Learn the products you sell and practise helping customers choose what works for them.</p>
            <a className="btn btn-primary" href="/login">Start Training</a>
          </div>
          <img
            className="landing-hero-image"
            src="/training-showroom.webp"
            width={1000}
            height={1250}
            alt="An electronics sales associate demonstrates a television to a customer"
            fetchPriority="high"
          />
        </section>

        <section className="landing-training" aria-labelledby="landing-training-title">
          <h2 id="landing-training-title">What you can practise</h2>
          <ul className="landing-activities">
            {trainingActivities.map(({ title, description }) => (
              <li key={title}>
                <h3>{title}</h3>
                <p>{description}</p>
              </li>
            ))}
          </ul>
        </section>
      </main>
    </>
  );
}
