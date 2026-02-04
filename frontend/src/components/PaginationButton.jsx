export default function PaginationButton({
  children,
  isActive,
  isCurrent,
  clickHandler,
}) {
  return (
    <button
      disabled={!isActive}
      className={`flex h-9 w-9 items-center justify-center rounded-lg border border-black/25 bg-white/25 p-2 text-xs font-semibold text-gray-500 sm:h-10 sm:w-10 sm:text-sm ${
        isActive ? "hover:bg-white/50 " : " "
      } ${isCurrent ? "border-black/50 text-black" : ""}`}
      onClick={clickHandler}
    >
      {children}
    </button>
  );
}
