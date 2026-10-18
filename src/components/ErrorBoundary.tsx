import { Component } from "react";
import type { ErrorInfo, ReactNode } from "react";
import i18n from "@/i18n";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

/**
 * Catches otherwise-fatal render errors anywhere in the tree and shows
 * a recovery screen instead of a blank white page. Reloading is often
 * enough to clear a transient error; this is a last line of defense,
 * not a substitute for handling expected errors (bad imports, network
 * failures) at their source, which the app already does.
 */
export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("Unhandled render error:", error, info.componentStack);
  }

  private handleReload = () => {
    window.location.reload();
  };

  private handleGoHome = () => {
    this.setState({ error: null });
    window.location.href = "/";
  };

  render() {
    if (!this.state.error) return this.props.children;

    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          gap: "16px",
          padding: "32px",
          textAlign: "center",
          background: "#13131b",
          color: "#e4e1ed",
          fontFamily: "system-ui, sans-serif",
        }}
      >
        <h1 style={{ fontSize: "24px", fontWeight: 600, margin: 0, color: "var(--color-on-surface, #e4e1ed)" }}>
          {i18n.t("common.error")}
        </h1>
        <p style={{ color: "var(--color-on-surface-variant, #c7c4d7)", maxWidth: "420px", margin: 0 }}>
          {i18n.t("errorBoundary.description")}
        </p>
        <div style={{ display: "flex", gap: "12px", marginTop: "8px" }}>
          <button
            onClick={this.handleReload}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "var(--color-primary, #c0c1ff)",
              color: "var(--color-on-primary, #1000a9)",
              border: "none",
              fontWeight: 600,
              cursor: "pointer",
            }}
          >
            {i18n.t("common.retry")}
          </button>
          <button
            onClick={this.handleGoHome}
            style={{
              padding: "10px 20px",
              borderRadius: "8px",
              background: "transparent",
              color: "var(--color-on-surface, #e4e1ed)",
              border: "1px solid var(--color-outline-variant, #464554)",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            {i18n.t("errorBoundary.goHome")}
          </button>
        </div>
        {import.meta.env.DEV && (
          <pre
            style={{
              marginTop: "16px",
              padding: "12px",
              background: "#1f1f27",
              borderRadius: "8px",
              maxWidth: "600px",
              overflow: "auto",
              fontSize: "12px",
              textAlign: "left",
              color: "#ffb4ab",
            }}
          >
            {this.state.error.message}
            {"\n"}
            {this.state.error.stack}
          </pre>
        )}
      </div>
    );
  }
}
