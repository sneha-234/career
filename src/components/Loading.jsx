export default function Loading({ label = "Loading…" }) {
  return <div className="full-loader"><span className="spinner" /><p>{label}</p></div>;
}
