import LoadingSpinner from "./LoadingSpinner";

export default function LoadingButton({
  isLoading = false,
  loadingText,
  className = "",
  children,
  disabled,
  ...props
}) {
  const isDisabled = disabled || isLoading;

  return (
    <button
      {...props}
      disabled={isDisabled}
      aria-busy={isLoading}
      className={`btn-press inline-flex items-center justify-center gap-2 ${className}`}
    >
      {isLoading && <LoadingSpinner className="h-4 w-4" />}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
}
