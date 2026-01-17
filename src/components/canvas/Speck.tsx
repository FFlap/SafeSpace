interface SpeckProps {
  x: number;
  y: number;
  isCurrentUser?: boolean;
  isInSameThread?: boolean;
}

export function Speck({
  x,
  y,
  isCurrentUser = false,
  isInSameThread = false,
}: SpeckProps) {
  const size = isCurrentUser ? 12 : 8;

  let bgColor = "bg-gray-400"; // Default: users in other threads
  if (isCurrentUser) {
    bgColor = "bg-blue-500";
  } else if (isInSameThread) {
    bgColor = "bg-white";
  }

  return (
    <div
      className={`absolute rounded-full ${bgColor} ${
        isCurrentUser ? "ring-2 ring-blue-300 ring-opacity-50" : ""
      }`}
      style={{
        left: x,
        top: y,
        width: size,
        height: size,
        transform: "translate(-50%, -50%)",
      }}
    />
  );
}
