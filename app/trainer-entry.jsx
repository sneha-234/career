"use client";

import dynamic from "next/dynamic";

// The trainer runtime manages the mounted DOM directly.
const Trainer = dynamic(() => import("./trainer"), {
  ssr: false,
  loading: () => (
    <main className="connection-shell mx-auto px-4">
      <div className="card connection-card" role="status">
        <div className="spinner" aria-hidden="true" />
        <p>Loading Sales Knowledge Trainer…</p>
      </div>
    </main>
  ),
});

export default Trainer;
