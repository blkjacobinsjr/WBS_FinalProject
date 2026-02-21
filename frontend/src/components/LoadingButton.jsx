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
      {isLoading && (
        <img
          src="/mascot-subzro/mascotmove5.webp"
          alt=""
          className="mascot-slide h-5 w-5"
        />
      )}
      <span>{isLoading && loadingText ? loadingText : children}</span>
    </button>
  );
}
