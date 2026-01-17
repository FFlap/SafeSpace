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

  const bgColor = isCurrentUser ? "bg-white" : isInSameThread ? "bg-white" : "bg-gray-400";

  return (
    <div
      className={`absolute rounded-full ${bgColor} ${
        isCurrentUser ? "ring-2 ring-white ring-opacity-50" : ""
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
