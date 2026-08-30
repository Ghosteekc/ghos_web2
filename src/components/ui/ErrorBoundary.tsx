import { Component, type ErrorInfo, type ReactNode } from "react";
import { ErrorState } from "@/components/ui/ErrorState";
import { toUserFacingError } from "@/utils/userError";

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("UI error:", error, info.componentStack);
  }

  render() {
    if (this.state.error) {
      const { message, code } = toUserFacingError(
        this.state.error,
        "Нет соединения с ботом, попробуй позже",
      );
      return (
        <ErrorState
          className="my-8"
          title={message}
          description={`Код ошибки: ${code}`}
          button="Попробовать снова"
          onAction={() => this.setState({ error: null })}
        />
      );
    }
    return this.props.children;
  }
}
